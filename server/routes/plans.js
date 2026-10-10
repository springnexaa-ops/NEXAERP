const express = require('express');
const router = express.Router();
const { db } = require('../db');

// List All Subscription Plans (with subscriber counts & MRR stats)
router.get('/', (req, res) => {
  try {
    const plans = db.prepare(`
      SELECT
        p.*,
        (SELECT COUNT(*) FROM tenants WHERE (plan = p.code OR plan = p.name) AND plan_status = 'active') as active_subscribers,
        (SELECT COALESCE(SUM(monthly_fee), 0) FROM tenants WHERE (plan = p.code OR plan = p.name) AND plan_status = 'active') as plan_mrr
      FROM subscription_plans p
      ORDER BY p.monthly_rate ASC
    `).all();

    // Parse JSON features array
    const parsed = plans.map(p => ({
      ...p,
      features: typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || [])
    }));

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Single Plan
router.get('/:id', (req, res) => {
  try {
    const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    res.json({
      ...plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || [])
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create New Subscription Plan (Admin Feature)
router.post('/', (req, res) => {
  try {
    const {
      name,
      code,
      description = '',
      business_type = 'all',
      monthly_rate,
      annual_rate,
      discount_percent = 15,
      max_products = 1000,
      max_orders_per_month = 2000,
      max_staff = 3,
      features = [],
      is_popular = 0
    } = req.body;

    if (!name || !monthly_rate) {
      return res.status(400).json({ error: 'Plan name and monthly rate are required' });
    }

    const cleanCode = (code || name)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || `plan_${Date.now()}`;

    // Check duplicate code
    const existing = db.prepare('SELECT id FROM subscription_plans WHERE code = ?').get(cleanCode);
    if (existing) {
      return res.status(400).json({ error: `A plan with code '${cleanCode}' already exists` });
    }

    const calcAnnual = annual_rate ? Number(annual_rate) : Math.round(Number(monthly_rate) * 12 * 0.85);

    const insert = db.prepare(`
      INSERT INTO subscription_plans (
        name, code, description, business_type, monthly_rate, annual_rate, discount_percent,
        max_products, max_orders_per_month, max_staff, features, is_popular, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `);

    const result = insert.run(
      name,
      cleanCode,
      description,
      business_type,
      Number(monthly_rate),
      calcAnnual,
      Number(discount_percent) || 15,
      Number(max_products) || -1,
      Number(max_orders_per_month) || -1,
      Number(max_staff) || 3,
      JSON.stringify(Array.isArray(features) ? features : []),
      is_popular ? 1 : 0
    );

    const created = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({
      success: true,
      message: `Plan '${name}' created successfully`,
      plan: {
        ...created,
        features: JSON.parse(created.features)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Plan Rates & Limits (Admin Feature)
router.put('/:id', (req, res) => {
  try {
    const {
      name,
      description,
      business_type,
      monthly_rate,
      annual_rate,
      discount_percent,
      max_products,
      max_orders_per_month,
      max_staff,
      features,
      is_popular,
      status
    } = req.body;

    const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    db.prepare(`
      UPDATE subscription_plans SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        business_type = COALESCE(?, business_type),
        monthly_rate = COALESCE(?, monthly_rate),
        annual_rate = COALESCE(?, annual_rate),
        discount_percent = COALESCE(?, discount_percent),
        max_products = COALESCE(?, max_products),
        max_orders_per_month = COALESCE(?, max_orders_per_month),
        max_staff = COALESCE(?, max_staff),
        features = COALESCE(?, features),
        is_popular = COALESCE(?, is_popular),
        status = COALESCE(?, status)
      WHERE id = ?
    `).run(
      name ?? null,
      description ?? null,
      business_type ?? null,
      monthly_rate !== undefined && monthly_rate !== null ? Number(monthly_rate) : null,
      annual_rate !== undefined && annual_rate !== null ? Number(annual_rate) : null,
      discount_percent !== undefined && discount_percent !== null ? Number(discount_percent) : null,
      max_products !== undefined && max_products !== null ? Number(max_products) : null,
      max_orders_per_month !== undefined && max_orders_per_month !== null ? Number(max_orders_per_month) : null,
      max_staff !== undefined && max_staff !== null ? Number(max_staff) : null,
      features ? JSON.stringify(features) : null,
      is_popular !== undefined && is_popular !== null ? (is_popular ? 1 : 0) : null,
      status ?? null,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(req.params.id);
    res.json({
      success: true,
      message: `Plan rates for '${updated.name}' updated successfully`,
      plan: {
        ...updated,
        features: JSON.parse(updated.features)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete or Deactivate Plan
router.delete('/:id', (req, res) => {
  try {
    const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    // Check if tenants are currently assigned to this plan
    const activeSubscribers = db.prepare(
      'SELECT COUNT(*) as count FROM tenants WHERE plan = ? OR plan = ?'
    ).get(plan.code, plan.name).count;

    if (activeSubscribers > 0) {
      // Soft-deactivate instead of hard delete to preserve historical integrity
      db.prepare("UPDATE subscription_plans SET status = 'inactive' WHERE id = ?").run(req.params.id);
      return res.json({
        message: `Plan has ${activeSubscribers} active store(s). Marked as inactive instead of deleting.`
      });
    }

    db.prepare('DELETE FROM subscription_plans WHERE id = ?').run(req.params.id);
    res.json({ message: 'Plan deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
