const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { checkProductQuota } = require('../utils/quotaGuard');

// List products (Tenant Scoped)
router.get('/', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { search, category, quick_pick, salt } = req.query;

    let sql = `
      SELECT p.*,
        COALESCE(SUM(b.stock_units), 0) AS total_stock,
        MIN(CASE WHEN b.stock_units > 0 AND b.expiry_date >= date('now') THEN b.expiry_date END) AS earliest_expiry,
        MIN(CASE WHEN b.stock_units > 0 AND b.expiry_date >= date('now') THEN b.selling_rate END) AS min_selling_rate,
        MAX(CASE WHEN b.stock_units > 0 AND b.expiry_date >= date('now') THEN b.mrp END) AS max_mrp
      FROM products p
      LEFT JOIN batches b ON p.id = b.product_id AND b.tenant_id = p.tenant_id
      WHERE p.tenant_id = ?
    `;
    const params = [tenantId];

    if (search) {
      sql += ` AND (p.name LIKE ? OR p.barcode LIKE ? OR p.salt_composition LIKE ? OR p.brand LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (category) {
      sql += ` AND p.category = ?`;
      params.push(category);
    }

    if (quick_pick === '1' || quick_pick === 'true') {
      sql += ` AND p.is_quick_pick = 1`;
    }

    if (salt) {
      sql += ` AND p.salt_composition LIKE ?`;
      params.push(`%${salt}%`);
    }

    sql += ` GROUP BY p.id ORDER BY p.name ASC`;

    const products = db.prepare(sql).all(...params);

    // Fetch batches for each product (Tenant scoped)
    const getBatches = db.prepare(`
      SELECT * FROM batches
      WHERE product_id = ? AND tenant_id = ?
      ORDER BY expiry_date ASC
    `);

    const result = products.map(prod => ({
      ...prod,
      batches: getBatches.all(prod.id, tenantId)
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: err.message });
  }
});

// Search medicine substitutes by salt composition (Tenant Scoped)
router.get('/substitutes', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { salt, excludeId } = req.query;
    if (!salt) return res.json([]);

    let sql = `
      SELECT p.*,
        COALESCE(SUM(b.stock_units), 0) AS total_stock,
        MIN(b.selling_rate) as min_selling_rate,
        MIN(b.mrp) as min_mrp
      FROM products p
      LEFT JOIN batches b ON p.id = b.product_id AND b.tenant_id = p.tenant_id
      WHERE p.tenant_id = ? AND p.salt_composition LIKE ?
    `;
    const params = [tenantId, `%${salt}%`];

    if (excludeId) {
      sql += ` AND p.id != ?`;
      params.push(excludeId);
    }

    sql += ` GROUP BY p.id HAVING total_stock > 0 ORDER BY total_stock DESC`;

    const subs = db.prepare(sql).all(...params);
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single product (Tenant Scoped)
router.get('/:id', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const prod = db.prepare('SELECT * FROM products WHERE id = ? AND tenant_id = ?').get(req.params.id, tenantId);
    if (!prod) return res.status(404).json({ error: 'Product not found' });

    const batches = db.prepare('SELECT * FROM batches WHERE product_id = ? AND tenant_id = ? ORDER BY expiry_date ASC').all(prod.id, tenantId);
    res.json({ ...prod, batches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create product and initial batch (Tenant Scoped)
router.post('/', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const {
      name, barcode, category, brand, hsn_code, gst_rate,
      salt_composition, schedule_type, pack_unit, sub_units_per_pack, allow_loose_sale,
      unit_type, is_loose_item, is_quick_pick, min_stock_alert,
      batch_number, mfg_date, expiry_date, purchase_rate, mrp, selling_rate, initial_stock, supplier_id
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Product name is required' });

    // Enforce Tenant Plan Quota
    const quotaCheck = checkProductQuota(tenantId);
    if (!quotaCheck.allowed) {
      return res.status(403).json({ error: quotaCheck.error });
    }

    const insertProd = db.prepare(`
      INSERT INTO products (
        tenant_id, name, barcode, category, brand, hsn_code, gst_rate,
        salt_composition, schedule_type, pack_unit, sub_units_per_pack, allow_loose_sale,
        unit_type, is_loose_item, is_quick_pick, min_stock_alert
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertProd.run(
      tenantId, name, barcode || null, category || 'General', brand || '', hsn_code || '', Number(gst_rate) || 0,
      salt_composition || null, schedule_type || 'Regular', pack_unit || 'Strip', Number(sub_units_per_pack) || 1, allow_loose_sale ? 1 : 0,
      unit_type || 'pcs', is_loose_item ? 1 : 0, is_quick_pick ? 1 : 0, Number(min_stock_alert) || 5
    );

    const productId = result.lastInsertRowid;

    // Create batch if supplied
    if (batch_number || initial_stock > 0 || mrp > 0) {
      const insertBatch = db.prepare(`
        INSERT INTO batches (
          tenant_id, product_id, batch_number, mfg_date, expiry_date,
          purchase_rate, mrp, selling_rate, stock_units, supplier_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertBatch.run(
        tenantId,
        productId,
        batch_number || 'DEFAULT-01',
        mfg_date || null,
        expiry_date || '2028-12-31',
        Number(purchase_rate) || 0,
        Number(mrp) || Number(selling_rate) || 0,
        Number(selling_rate) || Number(mrp) || 0,
        Number(initial_stock) || 0,
        supplier_id ? Number(supplier_id) : null
      );
    }

    res.status(201).json({ id: productId, message: 'Product created successfully' });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update product (Tenant Scoped)
router.put('/:id', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const {
      name, barcode, category, brand, hsn_code, gst_rate,
      salt_composition, schedule_type, pack_unit, sub_units_per_pack, allow_loose_sale,
      unit_type, is_loose_item, is_quick_pick, min_stock_alert
    } = req.body;

    const updateStmt = db.prepare(`
      UPDATE products SET
        name = ?, barcode = ?, category = ?, brand = ?, hsn_code = ?, gst_rate = ?,
        salt_composition = ?, schedule_type = ?, pack_unit = ?, sub_units_per_pack = ?, allow_loose_sale = ?,
        unit_type = ?, is_loose_item = ?, is_quick_pick = ?, min_stock_alert = ?
      WHERE id = ? AND tenant_id = ?
    `);

    updateStmt.run(
      name, barcode || null, category || 'General', brand || '', hsn_code || '', Number(gst_rate) || 0,
      salt_composition || null, schedule_type || 'Regular', pack_unit || 'Strip', Number(sub_units_per_pack) || 1, allow_loose_sale ? 1 : 0,
      unit_type || 'pcs', is_loose_item ? 1 : 0, is_quick_pick ? 1 : 0, Number(min_stock_alert) || 5,
      req.params.id, tenantId
    );

    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add batch to product (Tenant Scoped)
router.post('/:id/batches', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { batch_number, mfg_date, expiry_date, purchase_rate, mrp, selling_rate, stock_units, supplier_id } = req.body;

    if (!batch_number || !expiry_date) {
      return res.status(400).json({ error: 'Batch number and Expiry date are required' });
    }

    const insertBatch = db.prepare(`
      INSERT INTO batches (
        tenant_id, product_id, batch_number, mfg_date, expiry_date,
        purchase_rate, mrp, selling_rate, stock_units, supplier_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertBatch.run(
      tenantId,
      req.params.id,
      batch_number,
      mfg_date || null,
      expiry_date,
      Number(purchase_rate) || 0,
      Number(mrp) || 0,
      Number(selling_rate) || 0,
      Number(stock_units) || 0,
      supplier_id ? Number(supplier_id) : null
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Batch added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
