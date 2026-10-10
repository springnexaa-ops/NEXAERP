const express = require('express');
const router = express.Router();
const { db } = require('../db');

// List Stock Adjustments & Damage Audits
router.get('/', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const adjustments = db.prepare('SELECT * FROM stock_adjustments WHERE tenant_id = ? ORDER BY id DESC LIMIT 50').all(tenantId);
    res.json(adjustments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record Stock Adjustment (Physical Audit Variance or Damage Write-Off)
router.post('/', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const {
      product_id,
      batch_id,
      adjustment_type, // 'DAMAGE_WRITEOFF', 'EXPIRED_QUARANTINE', 'PHYSICAL_AUDIT_SURPLUS', 'PHYSICAL_AUDIT_DEFICIT'
      quantity,
      reason,
      audited_by
    } = req.body;

    if (!product_id || !batch_id || !quantity || !adjustment_type) {
      return res.status(400).json({ error: 'Product, batch, quantity, and adjustment type are required' });
    }

    const product = db.prepare('SELECT name FROM products WHERE id = ? AND tenant_id = ?').get(product_id, tenantId);
    const batch = db.prepare('SELECT batch_number, purchase_rate, stock_units FROM batches WHERE id = ? AND tenant_id = ?').get(batch_id, tenantId);

    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    const numQty = Number(quantity);
    const lossValue = numQty * batch.purchase_rate;
    const adjNumber = `ADJ-${Date.now().toString().slice(-6)}`;

    db.exec('BEGIN TRANSACTION;');
    try {
      // 1. Record Adjustment Log
      db.prepare(`
        INSERT INTO stock_adjustments (
          tenant_id, adjustment_number, product_id, product_name, batch_id, batch_number,
          adjustment_type, quantity, loss_value, reason, audited_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        tenantId, adjNumber, product_id, product ? product.name : 'Item',
        batch_id, batch.batch_number, adjustment_type, numQty, lossValue,
        reason || 'Inventory Adjustment', audited_by || 'Store Manager'
      );

      // 2. Adjust Batch Stock
      if (adjustment_type === 'PHYSICAL_AUDIT_SURPLUS') {
        db.prepare('UPDATE batches SET stock_units = stock_units + ? WHERE id = ? AND tenant_id = ?')
          .run(numQty, batch_id, tenantId);
      } else {
        // Deficit, damage or expired quarantine reduces stock
        db.prepare('UPDATE batches SET stock_units = MAX(0, stock_units - ?) WHERE id = ? AND tenant_id = ?')
          .run(numQty, batch_id, tenantId);

        // If damage or expired write-off, record as inventory loss expense
        if (adjustment_type === 'DAMAGE_WRITEOFF' || adjustment_type === 'EXPIRED_QUARANTINE') {
          db.prepare(`
            INSERT INTO expenses (tenant_id, category, amount, payment_mode, reference_no, paid_to, notes)
            VALUES (?, 'Miscellaneous', ?, 'cash', ?, 'Stock Quarantine', ?)
          `).run(tenantId, lossValue, adjNumber, `Inventory Write-Off: ${numQty} units of ${product?.name}`);
        }
      }

      db.exec('COMMIT;');
      res.status(201).json({ success: true, adjNumber, message: 'Stock successfully adjusted & ledger updated' });
    } catch (inner) {
      db.exec('ROLLBACK;');
      throw inner;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Barcode Printable Data Helper
router.get('/barcode-sheet', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { product_id } = req.query;

    let sql = `
      SELECT p.id, p.name, p.barcode, p.brand, p.hsn_code,
        b.batch_number, b.mrp, b.selling_rate, b.expiry_date
      FROM products p
      LEFT JOIN batches b ON p.id = b.product_id AND b.tenant_id = p.tenant_id
      WHERE p.tenant_id = ?
    `;
    const params = [tenantId];

    if (product_id) {
      sql += ' AND p.id = ?';
      params.push(product_id);
    }

    sql += ' ORDER BY p.name ASC LIMIT 50';
    const items = db.prepare(sql).all(...params);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
