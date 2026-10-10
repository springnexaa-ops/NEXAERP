const express = require('express');
const router = express.Router();
const { db } = require('../db');

// List sales invoices (Tenant Scoped)
router.get('/', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { from_date, to_date, customer_id, limit = 50 } = req.query;
    let sql = `SELECT * FROM sales_invoices WHERE tenant_id = ?`;
    const params = [tenantId];

    if (from_date) {
      sql += ` AND date(created_at) >= date(?)`;
      params.push(from_date);
    }
    if (to_date) {
      sql += ` AND date(created_at) <= date(?)`;
      params.push(to_date);
    }
    if (customer_id) {
      sql += ` AND customer_id = ?`;
      params.push(customer_id);
    }

    sql += ` ORDER BY id DESC LIMIT ?`;
    params.push(Number(limit));

    const invoices = db.prepare(sql).all(...params);
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single invoice with line items (Tenant Scoped)
router.get('/:id', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const invoice = db.prepare('SELECT * FROM sales_invoices WHERE id = ? AND tenant_id = ?').get(req.params.id, tenantId);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const items = db.prepare('SELECT * FROM sales_items WHERE invoice_id = ? AND tenant_id = ?').all(invoice.id, tenantId);
    const settings = {};
    const settingRows = db.prepare('SELECT key, value FROM settings WHERE tenant_id = ?').all(tenantId);
    settingRows.forEach(r => settings[r.key] = r.value);

    res.json({ invoice, items, settings, tenant: req.tenant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Process POS Checkout (Tenant Scoped & Atomic)
router.post('/checkout', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const {
      customer_id,
      customer_name,
      customer_phone,
      doctor_name,
      patient_name,
      items,
      subtotal,
      tax_amount = 0,
      discount_amount = 0,
      round_off = 0,
      grand_total,
      payment_mode = 'cash',
      cash_paid = 0,
      upi_paid = 0,
      khata_amount = 0
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Cart cannot be empty' });
    }

    // Generate Invoice Number scoped to tenant
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = req.tenant ? req.tenant.slug.slice(0, 4).toUpperCase() : 'INV';
    const countRow = db.prepare("SELECT COUNT(*) as count FROM sales_invoices WHERE tenant_id = ? AND invoice_number LIKE ?")
      .get(tenantId, `${prefix}-${today}-%`);
    const nextSeq = String((countRow ? countRow.count : 0) + 1).padStart(4, '0');
    const invoiceNumber = `${prefix}-${today}-${nextSeq}`;

    db.exec('BEGIN TRANSACTION;');

    try {
      // 1. Insert Sales Invoice
      const insertInv = db.prepare(`
        INSERT INTO sales_invoices (
          tenant_id, invoice_number, customer_id, customer_name, customer_phone,
          doctor_name, patient_name, total_items, subtotal, tax_amount,
          discount_amount, round_off, grand_total, payment_mode,
          cash_paid, upi_paid, khata_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const invResult = insertInv.run(
        tenantId,
        invoiceNumber,
        customer_id ? Number(customer_id) : null,
        customer_name || 'Walk-in Customer',
        customer_phone || '',
        doctor_name || null,
        patient_name || null,
        items.length,
        Number(subtotal),
        Number(tax_amount),
        Number(discount_amount),
        Number(round_off),
        Number(grand_total),
        payment_mode,
        Number(cash_paid),
        Number(upi_paid),
        Number(khata_amount)
      );

      const invoiceId = invResult.lastInsertRowid;

      // 2. Insert items and decrement tenant batch stock
      const insertItem = db.prepare(`
        INSERT INTO sales_items (
          tenant_id, invoice_id, product_id, product_name, batch_id, batch_number, expiry_date,
          quantity, is_loose, unit_price, mrp, gst_rate, gst_amount, discount, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const updateBatchStock = db.prepare(`
        UPDATE batches SET stock_units = stock_units - ? WHERE id = ? AND tenant_id = ?
      `);

      for (const item of items) {
        const gstRate = Number(item.gst_rate) || 0;
        const itemQty = Number(item.quantity) || 1;
        const itemPrice = Number(item.unit_price) || 0;
        const itemTotal = (itemQty * itemPrice) - (Number(item.discount) || 0);
        const itemGst = (itemTotal * gstRate) / (100 + gstRate);

        insertItem.run(
          tenantId,
          invoiceId,
          item.product_id,
          item.product_name,
          item.batch_id || null,
          item.batch_number || '',
          item.expiry_date || '',
          itemQty,
          item.is_loose ? 1 : 0,
          itemPrice,
          Number(item.mrp) || itemPrice,
          gstRate,
          itemGst,
          Number(item.discount) || 0,
          itemTotal
        );

        if (item.batch_id) {
          const deductionQty = item.is_loose && item.sub_units_per_pack > 1
            ? (itemQty / item.sub_units_per_pack)
            : itemQty;
          updateBatchStock.run(deductionQty, item.batch_id, tenantId);
        }
      }

      // 3. Khata (Customer Udhar) update
      if (Number(khata_amount) > 0 && customer_id) {
        db.prepare(`
          UPDATE customers SET current_balance = current_balance + ? WHERE id = ? AND tenant_id = ?
        `).run(Number(khata_amount), customer_id, tenantId);

        db.prepare(`
          INSERT INTO customer_ledger (tenant_id, customer_id, transaction_type, amount, reference_id, notes)
          VALUES (?, ?, 'DEBIT', ?, ?, ?)
        `).run(tenantId, customer_id, Number(khata_amount), invoiceNumber, `Nexa POS Credit Billing (${payment_mode})`);
      }

      db.exec('COMMIT;');

      const fullInvoice = db.prepare('SELECT * FROM sales_invoices WHERE id = ? AND tenant_id = ?').get(invoiceId, tenantId);
      const savedItems = db.prepare('SELECT * FROM sales_items WHERE invoice_id = ? AND tenant_id = ?').all(invoiceId, tenantId);
      const settings = {};
      db.prepare('SELECT key, value FROM settings WHERE tenant_id = ?').all(tenantId).forEach(r => settings[r.key] = r.value);

      res.status(201).json({
        success: true,
        invoice: fullInvoice,
        items: savedItems,
        settings,
        tenant: req.tenant
      });
    } catch (innerErr) {
      db.exec('ROLLBACK;');
      throw innerErr;
    }
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Hold Bill (Tenant Scoped)
router.post('/hold', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { reference_name, cart_data, customer_data } = req.body;
    const stmt = db.prepare(`
      INSERT INTO held_bills (tenant_id, reference_name, cart_data, customer_data)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(
      tenantId,
      reference_name || `Held Bill #${Date.now().toString().slice(-4)}`,
      JSON.stringify(cart_data || []),
      JSON.stringify(customer_data || {})
    );
    res.status(201).json({ id: result.lastInsertRowid, message: 'Bill held successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List Held Bills (Tenant Scoped)
router.get('/hold/list', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const held = db.prepare('SELECT * FROM held_bills WHERE tenant_id = ? ORDER BY id DESC').all(tenantId);
    const parsed = held.map(h => ({
      ...h,
      cart_data: JSON.parse(h.cart_data || '[]'),
      customer_data: JSON.parse(h.customer_data || '{}')
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete/Recall Held Bill (Tenant Scoped)
router.delete('/hold/:id', (req, res) => {
  try {
    const tenantId = req.tenantId;
    db.prepare('DELETE FROM held_bills WHERE id = ? AND tenant_id = ?').run(req.params.id, tenantId);
    res.json({ message: 'Held bill removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
