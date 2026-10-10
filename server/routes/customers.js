const express = require('express');
const router = express.Router();
const { db } = require('../db');

// List customers (Tenant Scoped)
router.get('/', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { search } = req.query;
    let sql = 'SELECT * FROM customers WHERE tenant_id = ?';
    const params = [tenantId];

    if (search) {
      sql += ' AND (name LIKE ? OR phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY current_balance DESC, name ASC';
    const customers = db.prepare(sql).all(...params);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create customer (Tenant Scoped)
router.post('/', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { name, phone, address, credit_limit = 5000, initial_balance = 0 } = req.body;
    if (!name) return res.status(400).json({ error: 'Customer name is required' });

    const insert = db.prepare(`
      INSERT INTO customers (tenant_id, name, phone, address, credit_limit, current_balance)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      tenantId, name, phone || '', address || '', Number(credit_limit) || 5000, Number(initial_balance) || 0
    );

    if (Number(initial_balance) > 0) {
      db.prepare(`
        INSERT INTO customer_ledger (tenant_id, customer_id, transaction_type, amount, reference_id, notes)
        VALUES (?, ?, 'DEBIT', ?, 'OPENING', 'Opening Outstanding Balance')
      `).run(tenantId, result.lastInsertRowid, Number(initial_balance));
    }

    res.status(201).json({ id: result.lastInsertRowid, message: 'Customer created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get customer with transaction ledger (Tenant Scoped)
router.get('/:id/ledger', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const customer = db.prepare('SELECT * FROM customers WHERE id = ? AND tenant_id = ?').get(req.params.id, tenantId);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const ledger = db.prepare(`
      SELECT * FROM customer_ledger
      WHERE customer_id = ? AND tenant_id = ?
      ORDER BY id DESC
    `).all(req.params.id, tenantId);

    res.json({ customer, ledger });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record Payment In (Tenant Scoped)
router.post('/:id/payment', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { amount, payment_mode = 'cash', notes = '' } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required' });
    }

    const customer = db.prepare('SELECT * FROM customers WHERE id = ? AND tenant_id = ?').get(req.params.id, tenantId);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const receiptNo = `RCPT-${Date.now().toString().slice(-6)}`;

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare('UPDATE customers SET current_balance = current_balance - ? WHERE id = ? AND tenant_id = ?')
        .run(numAmount, req.params.id, tenantId);

      db.prepare(`
        INSERT INTO customer_ledger (tenant_id, customer_id, transaction_type, amount, reference_id, notes)
        VALUES (?, ?, 'CREDIT', ?, ?, ?)
      `).run(tenantId, req.params.id, numAmount, receiptNo, `Payment received via ${payment_mode.toUpperCase()}${notes ? ': ' + notes : ''}`);

      db.exec('COMMIT;');

      const updatedCustomer = db.prepare('SELECT * FROM customers WHERE id = ? AND tenant_id = ?').get(req.params.id, tenantId);
      res.json({
        success: true,
        receiptNo,
        amount: numAmount,
        customer: updatedCustomer,
        message: `₹${numAmount} received. Remaining balance: ₹${updatedCustomer.current_balance}`
      });
    } catch (inner) {
      db.exec('ROLLBACK;');
      throw inner;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
