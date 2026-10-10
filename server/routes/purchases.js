const express = require('express');
const router = express.Router();
const { db } = require('../db');

// List purchases (Tenant Scoped)
router.get('/', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const purchases = db.prepare('SELECT * FROM supplier_purchases WHERE tenant_id = ? ORDER BY id DESC LIMIT 50').all(tenantId);
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record inward purchase (Tenant Scoped)
router.post('/', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const {
      supplier_id,
      supplier_invoice_no,
      items,
      total_amount,
      tax_amount = 0,
      payment_status = 'paid',
      notes = ''
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Purchase must include at least one item' });
    }

    const supplier = supplier_id ? db.prepare('SELECT * FROM suppliers WHERE id = ? AND tenant_id = ?').get(supplier_id, tenantId) : null;
    const purchaseNumber = `PO-${Date.now().toString().slice(-6)}`;

    db.exec('BEGIN TRANSACTION;');
    try {
      const insertPO = db.prepare(`
        INSERT INTO supplier_purchases (
          tenant_id, purchase_number, supplier_id, supplier_name, supplier_invoice_no,
          total_amount, tax_amount, payment_status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const poResult = insertPO.run(
        tenantId,
        purchaseNumber,
        supplier_id || null,
        supplier ? supplier.name : 'Unknown Supplier',
        supplier_invoice_no || '',
        Number(total_amount),
        Number(tax_amount),
        payment_status,
        notes
      );

      const checkBatch = db.prepare(`
        SELECT id, stock_units FROM batches
        WHERE tenant_id = ? AND product_id = ? AND batch_number = ?
      `);

      const updateBatch = db.prepare(`
        UPDATE batches SET
          stock_units = stock_units + ?,
          purchase_rate = ?,
          mrp = ?,
          selling_rate = ?,
          expiry_date = ?
        WHERE id = ? AND tenant_id = ?
      `);

      const insertBatch = db.prepare(`
        INSERT INTO batches (
          tenant_id, product_id, batch_number, mfg_date, expiry_date,
          purchase_rate, mrp, selling_rate, stock_units, supplier_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        const existing = checkBatch.get(tenantId, item.product_id, item.batch_number);
        if (existing) {
          updateBatch.run(
            Number(item.quantity),
            Number(item.purchase_rate),
            Number(item.mrp),
            Number(item.selling_rate),
            item.expiry_date,
            existing.id,
            tenantId
          );
        } else {
          insertBatch.run(
            tenantId,
            item.product_id,
            item.batch_number || 'LOT-NEW',
            item.mfg_date || null,
            item.expiry_date || '2028-12-31',
            Number(item.purchase_rate) || 0,
            Number(item.mrp) || 0,
            Number(item.selling_rate) || 0,
            Number(item.quantity) || 0,
            supplier_id || null
          );
        }
      }

      if (payment_status === 'credit' && supplier_id) {
        db.prepare('UPDATE suppliers SET current_balance = current_balance + ? WHERE id = ? AND tenant_id = ?')
          .run(Number(total_amount), supplier_id, tenantId);
      }

      db.exec('COMMIT;');
      res.status(201).json({ success: true, purchaseNumber, id: poResult.lastInsertRowid });
    } catch (inner) {
      db.exec('ROLLBACK;');
      throw inner;
    }
  } catch (err) {
    console.error('Purchase error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
