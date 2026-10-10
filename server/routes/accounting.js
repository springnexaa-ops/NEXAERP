const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Financial Overview (P&L, Cash In Hand, Expenses, Net Profit)
router.get('/summary', (req, res) => {
  try {
    const tenantId = req.tenantId;

    // Gross Sales Revenue
    const salesTotal = db.prepare(`
      SELECT
        COALESCE(SUM(grand_total), 0) as total_sales,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COALESCE(SUM(discount_amount), 0) as total_discounts
      FROM sales_invoices
      WHERE tenant_id = ?
    `).get(tenantId);

    // Cost of Goods Sold (Purchase rate * quantity sold)
    const cogsTotal = db.prepare(`
      SELECT COALESCE(SUM(si.quantity * b.purchase_rate), 0) as total_cogs
      FROM sales_items si
      JOIN batches b ON si.batch_id = b.id AND b.tenant_id = si.tenant_id
      WHERE si.tenant_id = ?
    `).get(tenantId);

    // Total Operational Expenses
    const expensesTotal = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_expenses
      FROM expenses
      WHERE tenant_id = ?
    `).get(tenantId);

    // Total Inward Stock Purchases
    const purchasesTotal = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total_purchases
      FROM supplier_purchases
      WHERE tenant_id = ?
    `).get(tenantId);

    // Customer Receivables (Udhar)
    const receivables = db.prepare(`
      SELECT COALESCE(SUM(current_balance), 0) as total_receivables
      FROM customers
      WHERE tenant_id = ?
    `).get(tenantId);

    // Supplier Payables
    const payables = db.prepare(`
      SELECT COALESCE(SUM(current_balance), 0) as total_payables
      FROM suppliers
      WHERE tenant_id = ?
    `).get(tenantId);

    // Gross Profit = Sales - COGS
    const grossProfit = salesTotal.total_sales - cogsTotal.total_cogs;
    // Net Profit = Gross Profit - Operating Expenses
    const netProfit = grossProfit - expensesTotal.total_expenses;

    res.json({
      revenue: salesTotal.total_sales,
      cogs: cogsTotal.total_cogs,
      grossProfit,
      operatingExpenses: expensesTotal.total_expenses,
      netProfit,
      totalPurchases: purchasesTotal.total_purchases,
      receivables: receivables.total_receivables,
      payables: payables.total_payables,
      taxCollected: salesTotal.total_tax
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List Expenses
router.get('/expenses', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { category } = req.query;
    let sql = 'SELECT * FROM expenses WHERE tenant_id = ?';
    const params = [tenantId];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY expense_date DESC, id DESC LIMIT 100';
    const expenses = db.prepare(sql).all(...params);
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record New Expense
router.post('/expenses', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { category, amount, payment_mode = 'cash', reference_no, paid_to, notes, expense_date } = req.body;

    if (!category || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid category and amount are required' });
    }

    const insert = db.prepare(`
      INSERT INTO expenses (
        tenant_id, category, amount, payment_mode, reference_no, paid_to, notes, expense_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      tenantId,
      category,
      Number(amount),
      payment_mode,
      reference_no || `EXP-${Date.now().toString().slice(-4)}`,
      paid_to || '',
      notes || '',
      expense_date || new Date().toISOString().slice(0, 10)
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Expense recorded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Profit & Loss Detailed Statement
router.get('/pl-statement', (req, res) => {
  try {
    const tenantId = req.tenantId;

    // Revenue Breakdown
    const revenue = db.prepare(`
      SELECT
        COALESCE(SUM(grand_total), 0) as total_sales,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COALESCE(SUM(discount_amount), 0) as total_discounts
      FROM sales_invoices
      WHERE tenant_id = ?
    `).get(tenantId);

    // COGS Breakdown
    const cogs = db.prepare(`
      SELECT COALESCE(SUM(si.quantity * b.purchase_rate), 0) as cogs
      FROM sales_items si
      JOIN batches b ON si.batch_id = b.id AND b.tenant_id = si.tenant_id
      WHERE si.tenant_id = ?
    `).get(tenantId);

    // Expenses grouped by category
    const expenseCategories = db.prepare(`
      SELECT category, SUM(amount) as total
      FROM expenses
      WHERE tenant_id = ?
      GROUP BY category
      ORDER BY total DESC
    `).all(tenantId);

    const totalExpenses = expenseCategories.reduce((s, e) => s + e.total, 0);
    const grossProfit = revenue.total_sales - cogs.cogs;
    const netProfit = grossProfit - totalExpenses;

    res.json({
      revenue,
      cogs: cogs.cogs,
      grossProfit,
      expenseCategories,
      totalExpenses,
      netProfit
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
