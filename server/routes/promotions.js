const express = require('express');
const router = express.Router();
const { db } = require('../db');

// List Promotions / Coupons
router.get('/', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const promos = db.prepare('SELECT * FROM promotions WHERE tenant_id = ? ORDER BY id DESC').all(tenantId);
    res.json(promos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Promotion / Coupon
router.post('/', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { code, title, discount_type = 'PERCENTAGE', discount_value, min_order_amount = 0, max_discount = 0 } = req.body;

    if (!code || !title || !discount_value) {
      return res.status(400).json({ error: 'Code, title, and discount value are required' });
    }

    const insert = db.prepare(`
      INSERT INTO promotions (tenant_id, code, title, discount_type, discount_value, min_order_amount, max_discount)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      tenantId, code.toUpperCase().trim(), title, discount_type,
      Number(discount_value), Number(min_order_amount), Number(max_discount)
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Promo coupon created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Validate & Calculate Discount for POS Cart
router.post('/apply', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { code, cart_subtotal } = req.body;

    if (!code) return res.status(400).json({ error: 'Promo code is required' });

    const promo = db.prepare("SELECT * FROM promotions WHERE tenant_id = ? AND code = ? AND status = 'active'")
      .get(tenantId, code.toUpperCase().trim());

    if (!promo) {
      return res.status(404).json({ error: 'Invalid or expired coupon code' });
    }

    const subtotal = Number(cart_subtotal) || 0;
    if (subtotal < promo.min_order_amount) {
      return res.status(400).json({
        error: `Coupon requires minimum order value of ₹${promo.min_order_amount}`
      });
    }

    let discount = 0;
    if (promo.discount_type === 'PERCENTAGE') {
      discount = (subtotal * promo.discount_value) / 100;
      if (promo.max_discount > 0) {
        discount = Math.min(discount, promo.max_discount);
      }
    } else {
      discount = Math.min(promo.discount_value, subtotal);
    }

    res.json({
      valid: true,
      promo,
      discountAmount: Number(discount.toFixed(2)),
      message: `Coupon '${promo.code}' applied! You save ₹${discount.toFixed(2)}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check Customer Loyalty Points
router.get('/loyalty/:customerId', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const customer = db.prepare('SELECT id, name, loyalty_points FROM customers WHERE id = ? AND tenant_id = ?')
      .get(req.params.customerId, tenantId);

    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const points = customer.loyalty_points || 0;
    // 1 Point = ₹0.50 cash discount
    const redeemableValue = Number((points * 0.50).toFixed(2));

    res.json({
      customerId: customer.id,
      customerName: customer.name,
      points,
      redeemableValue
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
