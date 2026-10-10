const express = require('express');
const router = express.Router();
const { db } = require('../db');

// List suppliers (Tenant Scoped)
router.get('/', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const suppliers = db.prepare('SELECT * FROM suppliers WHERE tenant_id = ? ORDER BY name ASC').all(tenantId);
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create supplier (Tenant Scoped)
router.post('/', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { name, phone, email, address, gstin, current_balance = 0 } = req.body;
    if (!name) return res.status(400).json({ error: 'Supplier name is required' });

    const insert = db.prepare(`
      INSERT INTO suppliers (tenant_id, name, phone, email, address, gstin, current_balance)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      tenantId, name, phone || '', email || '', address || '', gstin || '', Number(current_balance) || 0
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Supplier created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
