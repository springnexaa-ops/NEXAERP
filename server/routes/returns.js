const express = require('express');
const router = express.Router();
const { db } = require('../db');

// List Customer Sales Returns
router.get('/sales', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const returns = db.prepare('SELECT * FROM sales_returns WHERE tenant_id = ? ORDER BY id DESC LIMIT 50').all(tenantId);
    res.json(returns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Process Customer Sales Return (Restock & Refund)
router.post('/sales', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const {
      invoice_id,
      invoice_number,
      customer_id,
      customer_name,
      items, // array of { product_id, product_name, batch_id, batch_number, quantity, unit_price, restock_item }
      total_refund_amount,
      refund_mode = 'cash', // 'cash', 'khata', 'credit_note'
      reason
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Return must contain at least one item' });
    }

    const returnNumber = `RET-${Date.now().toString().slice(-6)}`;

    db.exec('BEGIN TRANSACTION;');
    try {
      // 1. Insert Sales Return Record
      const insertReturn = db.prepare(`
        INSERT INTO sales_returns (
          tenant_id, return_number, invoice_id, invoice_number, customer_id, customer_name,
          total_refund_amount, refund_mode, reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const retResult = insertReturn.run(
        tenantId, returnNumber, invoice_id || null, invoice_number || 'DIRECT-RET',
        customer_id || null, customer_name || 'Customer',
        Number(total_refund_amount), refund_mode, reason || 'Customer Return'
      );

      const returnId = retResult.lastInsertRowid;

      // 2. Insert items and optionally restock
      const insertItem = db.prepare(`
        INSERT INTO sales_return_items (
          tenant_id, return_id, product_id, product_name, batch_id, batch_number,
          quantity, unit_price, refund_total, restock_item
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const restockBatch = db.prepare(`
        UPDATE batches SET stock_units = stock_units + ? WHERE id = ? AND tenant_id = ?
      `);

      for (const item of items) {
        const lineTotal = Number(item.quantity) * Number(item.unit_price);
        insertItem.run(
          tenantId, returnId, item.product_id, item.product_name, item.batch_id || null,
          item.batch_number || '', Number(item.quantity), Number(item.unit_price),
          lineTotal, item.restock_item ? 1 : 0
        );

        // Put back in inventory if restock is true
        if (item.restock_item && item.batch_id) {
          restockBatch.run(Number(item.quantity), item.batch_id, tenantId);
        }
      }

      // 3. If refund is via Khata, decrease customer Udhar balance (or give credit)
      if (refund_mode === 'khata' && customer_id) {
        db.prepare('UPDATE customers SET current_balance = current_balance - ? WHERE id = ? AND tenant_id = ?')
          .run(Number(total_refund_amount), customer_id, tenantId);

        db.prepare(`
          INSERT INTO customer_ledger (tenant_id, customer_id, transaction_type, amount, reference_id, notes)
          VALUES (?, ?, 'CREDIT', ?, ?, 'Sales Return Refund Added to Balance')
        `).run(tenantId, customer_id, Number(total_refund_amount), returnNumber);
      }

      db.exec('COMMIT;');
      res.status(201).json({ success: true, returnNumber, id: returnId, message: 'Return processed & stock updated' });
    } catch (inner) {
      db.exec('ROLLBACK;');
      throw inner;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List Supplier Returns (Debit Notes)
router.get('/suppliers', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const notes = db.prepare('SELECT * FROM supplier_returns WHERE tenant_id = ? ORDER BY id DESC LIMIT 50').all(tenantId);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Supplier Debit Note (Return to Distributor)
router.post('/suppliers', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { supplier_id, batch_id, quantity, total_amount, reason } = req.body;

    if (!supplier_id || !total_amount) {
      return res.status(400).json({ error: 'Supplier and total amount are required' });
    }

    const supplier = db.prepare('SELECT name FROM suppliers WHERE id = ? AND tenant_id = ?').get(supplier_id, tenantId);
    const debitNoteNo = `DN-${Date.now().toString().slice(-6)}`;

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`
        INSERT INTO supplier_returns (tenant_id, debit_note_no, supplier_id, supplier_name, total_amount, reason)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(tenantId, debitNoteNo, supplier_id, supplier ? supplier.name : 'Vendor', Number(total_amount), reason || 'Supplier Return');

      // Deduct inventory batch stock if batch specified
      if (batch_id && quantity) {
        db.prepare('UPDATE batches SET stock_units = stock_units - ? WHERE id = ? AND tenant_id = ?')
          .run(Number(quantity), batch_id, tenantId);
      }

      // Deduct supplier payable balance
      db.prepare('UPDATE suppliers SET current_balance = current_balance - ? WHERE id = ? AND tenant_id = ?')
        .run(Number(total_amount), supplier_id, tenantId);

      db.exec('COMMIT;');
      res.status(201).json({ success: true, debitNoteNo, message: 'Supplier Debit Note issued & stock deducted' });
    } catch (inner) {
      db.exec('ROLLBACK;');
      throw inner;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
