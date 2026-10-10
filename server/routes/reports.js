const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Main Dashboard KPI Metrics (Tenant Scoped)
router.get('/dashboard', (req, res) => {
  try {
    const tenantId = req.tenantId;

    // Today's Sales
    const todaySales = db.prepare(`
      SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(grand_total), 0) as total_revenue,
        COALESCE(SUM(cash_paid), 0) as cash_total,
        COALESCE(SUM(upi_paid), 0) as upi_total,
        COALESCE(SUM(khata_amount), 0) as khata_total
      FROM sales_invoices
      WHERE tenant_id = ? AND date(created_at) = date('now')
    `).get(tenantId);

    // Month Sales
    const monthSales = db.prepare(`
      SELECT COALESCE(SUM(grand_total), 0) as month_revenue, COUNT(*) as month_orders
      FROM sales_invoices
      WHERE tenant_id = ? AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `).get(tenantId);

    // Total Customer Udhar / Receivables
    const receivables = db.prepare(`
      SELECT COALESCE(SUM(current_balance), 0) as total_udhar, COUNT(CASE WHEN current_balance > 0 THEN 1 END) as debtor_count
      FROM customers
      WHERE tenant_id = ?
    `).get(tenantId);

    // Total Stock Valuation
    const valuation = db.prepare(`
      SELECT
        COALESCE(SUM(b.stock_units * b.purchase_rate), 0) as total_purchase_value,
        COALESCE(SUM(b.stock_units * b.selling_rate), 0) as total_retail_value,
        COALESCE(SUM(b.stock_units), 0) as total_units
      FROM batches b
      WHERE b.tenant_id = ? AND b.stock_units > 0
    `).get(tenantId);

    // Low Stock Alert Count
    const lowStock = db.prepare(`
      SELECT COUNT(*) as low_count
      FROM (
        SELECT p.id, p.min_stock_alert, COALESCE(SUM(b.stock_units), 0) as stock
        FROM products p
        LEFT JOIN batches b ON p.id = b.product_id AND b.tenant_id = p.tenant_id
        WHERE p.tenant_id = ?
        GROUP BY p.id
        HAVING stock <= p.min_stock_alert
      )
    `).get(tenantId);

    // Expiry Alerts Count
    const expiryStats = db.prepare(`
      SELECT
        COUNT(CASE WHEN b.expiry_date < date('now') AND b.stock_units > 0 THEN 1 END) as expired_batches,
        COUNT(CASE WHEN b.expiry_date BETWEEN date('now') AND date('now', '+60 days') AND b.stock_units > 0 THEN 1 END) as near_expiry_batches
      FROM batches b
      WHERE b.tenant_id = ?
    `).get(tenantId);

    // Recent 5 Sales
    const recentSales = db.prepare(`
      SELECT * FROM sales_invoices
      WHERE tenant_id = ?
      ORDER BY id DESC LIMIT 5
    `).all(tenantId);

    res.json({
      todaySales,
      monthSales,
      receivables,
      valuation,
      lowStockCount: lowStock ? lowStock.low_count : 0,
      expiryStats,
      recentSales,
      tenant: req.tenant
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: err.message });
  }
});

// Daily Register / Day Closing (Z-Report) (Tenant Scoped)
router.get('/daily-register', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { date: targetDate = new Date().toISOString().slice(0, 10) } = req.query;

    const summary = db.prepare(`
      SELECT
        COUNT(*) as total_invoices,
        COALESCE(SUM(subtotal), 0) as total_subtotal,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COALESCE(SUM(discount_amount), 0) as total_discount,
        COALESCE(SUM(grand_total), 0) as total_sales,
        COALESCE(SUM(cash_paid), 0) as cash_collected,
        COALESCE(SUM(upi_paid), 0) as upi_collected,
        COALESCE(SUM(khata_amount), 0) as udhar_issued
      FROM sales_invoices
      WHERE tenant_id = ? AND date(created_at) = date(?)
    `).get(tenantId, targetDate);

    const udharCollected = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as collected
      FROM customer_ledger
      WHERE tenant_id = ? AND transaction_type = 'CREDIT' AND date(created_at) = date(?)
    `).get(tenantId, targetDate);

    const invoices = db.prepare(`
      SELECT * FROM sales_invoices
      WHERE tenant_id = ? AND date(created_at) = date(?)
      ORDER BY id DESC
    `).all(tenantId, targetDate);

    res.json({
      date: targetDate,
      summary,
      udharSettledToday: udharCollected ? udharCollected.collected : 0,
      invoices,
      tenant: req.tenant
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Expiry Dashboard (Tenant Scoped)
router.get('/expiry', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { filter = 'all' } = req.query;

    let dateCondition = `b.tenant_id = ? AND b.stock_units > 0`;
    const params = [tenantId];

    if (filter === 'expired') {
      dateCondition += ` AND b.expiry_date < date('now')`;
    } else if (filter === '30days') {
      dateCondition += ` AND b.expiry_date BETWEEN date('now') AND date('now', '+30 days')`;
    } else if (filter === '60days') {
      dateCondition += ` AND b.expiry_date BETWEEN date('now') AND date('now', '+60 days')`;
    } else if (filter === '90days') {
      dateCondition += ` AND b.expiry_date BETWEEN date('now') AND date('now', '+90 days')`;
    } else {
      dateCondition += ` AND b.expiry_date <= date('now', '+90 days')`;
    }

    const batches = db.prepare(`
      SELECT
        b.*,
        p.name as product_name,
        p.salt_composition,
        p.pack_unit,
        s.name as supplier_name,
        s.phone as supplier_phone,
        CAST((julianday(b.expiry_date) - julianday('now')) AS INTEGER) as days_to_expiry,
        (b.stock_units * b.purchase_rate) as risk_value
      FROM batches b
      JOIN products p ON b.product_id = p.id AND p.tenant_id = b.tenant_id
      LEFT JOIN suppliers s ON b.supplier_id = s.id AND s.tenant_id = b.tenant_id
      WHERE ${dateCondition}
      ORDER BY b.expiry_date ASC
    `).all(...params);

    res.json(batches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Schedule H / H1 Register (Tenant Scoped)
router.get('/schedule-drugs', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const rows = db.prepare(`
      SELECT
        i.invoice_number,
        i.created_at,
        i.doctor_name,
        i.patient_name,
        i.customer_name,
        i.customer_phone,
        si.product_name,
        si.batch_number,
        si.expiry_date,
        si.quantity,
        p.schedule_type,
        p.salt_composition
      FROM sales_items si
      JOIN sales_invoices i ON si.invoice_id = i.id AND i.tenant_id = si.tenant_id
      JOIN products p ON si.product_id = p.id AND p.tenant_id = si.tenant_id
      WHERE si.tenant_id = ? AND p.schedule_type IN ('Schedule H', 'Schedule H1', 'Narcotic')
      ORDER BY i.id DESC
      LIMIT 100
    `).all(tenantId);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GST Summary Report (Tenant Scoped)
router.get('/gst', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { from_date, to_date } = req.query;
    let sql = `
      SELECT
        p.hsn_code,
        si.gst_rate,
        COUNT(si.id) as item_count,
        SUM(si.quantity) as total_quantity,
        SUM(si.total - si.gst_amount) as taxable_amount,
        SUM(si.gst_amount) as total_gst,
        SUM(si.gst_amount) / 2 as cgst,
        SUM(si.gst_amount) / 2 as sgst,
        SUM(si.total) as total_value
      FROM sales_items si
      JOIN sales_invoices i ON si.invoice_id = i.id AND i.tenant_id = si.tenant_id
      JOIN products p ON si.product_id = p.id AND p.tenant_id = si.tenant_id
      WHERE si.tenant_id = ?
    `;
    const params = [tenantId];

    if (from_date) {
      sql += ` AND date(i.created_at) >= date(?)`;
      params.push(from_date);
    }
    if (to_date) {
      sql += ` AND date(i.created_at) <= date(?)`;
      params.push(to_date);
    }

    sql += ` GROUP BY p.hsn_code, si.gst_rate ORDER BY p.hsn_code ASC`;

    const report = db.prepare(sql).all(...params);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
