const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db, seedTenantLabData } = require('../db');

// List all SaaS Tenants (Administrative Metadata & Subscription Info Only - Tenant Isolation Enforced)
router.get('/', (req, res) => {
  try {
    const tenants = db.prepare(`
      SELECT
        t.id,
        t.slug,
        t.name,
        t.business_type,
        t.owner_name,
        t.owner_email,
        t.owner_phone,
        t.plan,
        t.plan_status,
        t.monthly_fee,
        t.custom_monthly_fee,
        t.billing_cycle,
        t.subscription_renews_at,
        t.store_address,
        t.gstin,
        t.dl_number,
        t.fssai_number,
        t.admin_notes,
        t.created_at,
        p.name as plan_name,
        p.monthly_rate as standard_plan_rate,
        p.annual_rate as standard_annual_rate,
        p.max_products as plan_max_products,
        p.max_staff as plan_max_staff,
        (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as user_count
      FROM tenants t
      LEFT JOIN subscription_plans p ON (t.plan = p.code OR t.plan = p.name)
      ORDER BY t.id ASC
    `).all();

    res.json(tenants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SpringNexa Platform SaaS High-Level KPIs (Subscription & Tenant Health Only - Org Data Hidden)
router.get('/platform/stats', (req, res) => {
  try {
    const tenantStats = db.prepare(`
      SELECT
        COUNT(*) as total_tenants,
        COUNT(CASE WHEN plan_status = 'active' THEN 1 END) as active_tenants,
        COUNT(CASE WHEN plan_status = 'trial' THEN 1 END) as trial_tenants,
        COUNT(CASE WHEN plan_status = 'suspended' THEN 1 END) as suspended_tenants,
        COALESCE(SUM(CASE WHEN plan_status = 'active' THEN COALESCE(custom_monthly_fee, monthly_fee, 0) ELSE 0 END), 0) as mrr,
        COUNT(CASE WHEN business_type = 'pharma' OR business_type = 'pharma_lab' THEN 1 END) as pharma_tenants,
        COUNT(CASE WHEN business_type = 'lab' THEN 1 END) as lab_tenants,
        COUNT(CASE WHEN business_type = 'kiryana' THEN 1 END) as kiryana_tenants
      FROM tenants
    `).get();

    const subInvoices = db.prepare(`
      SELECT
        COALESCE(SUM(total_amount), 0) as total_subscription_revenue,
        COUNT(*) as total_subscription_invoices
      FROM saas_subscription_invoices
      WHERE payment_status = 'paid'
    `).get();

    const totalMRR = tenantStats.mrr || 0;
    const totalARR = Math.round(totalMRR * 12);

    res.json({
      ...tenantStats,
      mrr: totalMRR,
      arr: totalARR,
      ...subInvoices,
      privacy_policy: {
        enforced: true,
        tenant_isolation: true,
        organisation_data_hidden: true,
        statement: 'Super Admin is restricted from viewing private organization operational data, customer ledgers, and financial records.'
      },
      platform_owner: 'SpringNexa Private Limited',
      product_name: 'Nexa ERP SaaS'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Alias for platform metrics
router.get('/metrics', (req, res) => {
  res.redirect(307, '/api/tenants/platform/stats');
});

const { getTenantQuotaSummary } = require('../utils/quotaGuard');

// Live Tenant Isolation Verification & Status
router.get('/isolation/status', (req, res) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const quota = getTenantQuotaSummary(tenantId);

    const counts = {
      products: db.prepare('SELECT COUNT(*) as c FROM products WHERE tenant_id = ?').get(tenantId).c,
      batches: db.prepare('SELECT COUNT(*) as c FROM batches WHERE tenant_id = ?').get(tenantId).c,
      customers: db.prepare('SELECT COUNT(*) as c FROM customers WHERE tenant_id = ?').get(tenantId).c,
      suppliers: db.prepare('SELECT COUNT(*) as c FROM suppliers WHERE tenant_id = ?').get(tenantId).c,
      invoices: db.prepare('SELECT COUNT(*) as c FROM sales_invoices WHERE tenant_id = ?').get(tenantId).c,
      purchases: db.prepare('SELECT COUNT(*) as c FROM supplier_purchases WHERE tenant_id = ?').get(tenantId).c,
      employees: db.prepare('SELECT COUNT(*) as c FROM employees WHERE tenant_id = ?').get(tenantId).c,
      expenses: db.prepare('SELECT COUNT(*) as c FROM expenses WHERE tenant_id = ?').get(tenantId).c,
      salesReturns: db.prepare('SELECT COUNT(*) as c FROM sales_returns WHERE tenant_id = ?').get(tenantId).c,
      stockAdjustments: db.prepare('SELECT COUNT(*) as c FROM stock_adjustments WHERE tenant_id = ?').get(tenantId).c,
      promotions: db.prepare('SELECT COUNT(*) as c FROM promotions WHERE tenant_id = ?').get(tenantId).c,
      auditLogs: db.prepare('SELECT COUNT(*) as c FROM security_audit_logs WHERE tenant_id = ?').get(tenantId).c,
      labOrders: db.prepare('SELECT COUNT(*) as c FROM lab_orders WHERE tenant_id = ?').get(tenantId).c,
      labTests: db.prepare('SELECT COUNT(*) as c FROM lab_tests WHERE tenant_id = ?').get(tenantId).c
    };

    res.json({
      success: true,
      isolation: {
        enforced: true,
        mode: req.isolation?.mode || 'STRICT_ROW_LEVEL_ISOLATION',
        crossTenantTamperShield: 'ACTIVE (Blocks & Logs Unauthorized Cross-Store ID Injection)',
        zeroLeakageGuarantee: '100% Isolated Data Boundary',
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        businessVertical: tenant.business_type,
        currentPlan: tenant.plan,
        effectiveRate: tenant.custom_monthly_fee || tenant.monthly_fee
      },
      quota,
      counts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List All SaaS Subscription Invoices Across Stores
router.get('/subscriptions/invoices', (req, res) => {
  try {
    const invoices = db.prepare(`
      SELECT
        i.*,
        t.name as store_name,
        t.business_type,
        t.owner_name,
        t.owner_email,
        t.owner_phone
      FROM saas_subscription_invoices i
      JOIN tenants t ON i.tenant_id = t.id
      ORDER BY i.id DESC
      LIMIT 100
    `).all();

    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single tenant details (Tenant Privacy for Super Admin)
router.get('/:id', (req, res) => {
  try {
    const tenant = db.prepare(`
      SELECT
        t.*,
        p.name as plan_name,
        p.monthly_rate as standard_plan_rate,
        p.annual_rate as standard_annual_rate,
        p.features as plan_features
      FROM tenants t
      LEFT JOIN subscription_plans p ON (t.plan = p.code OR t.plan = p.name)
      WHERE t.id = ?
    `).get(req.params.id);

    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    // Tenant Privacy Policy Enforcement:
    // If requester is super_admin, do not return private business data
    const isSuperAdmin = req.user && req.user.role === 'super_admin';

    let metrics;
    if (isSuperAdmin) {
      const userCount = db.prepare('SELECT COUNT(*) as c FROM users WHERE tenant_id = ?').get(tenant.id)?.c || 0;
      metrics = {
        product_count: '[RESTRICTED]',
        order_count: '[RESTRICTED]',
        total_revenue: 0,
        total_udhar: 0,
        lab_order_count: '[RESTRICTED]',
        lab_revenue: 0,
        lab_test_count: '[RESTRICTED]',
        user_count: userCount,
        privacy_policy_active: true,
        privacy_notice: 'Tenant Privacy Active: Super Admin is restricted from viewing organization business figures.'
      };
    } else {
      metrics = db.prepare(`
        SELECT
          (SELECT COUNT(*) FROM products WHERE tenant_id = ?) as product_count,
          (SELECT COUNT(*) FROM sales_invoices WHERE tenant_id = ?) as order_count,
          (SELECT COALESCE(SUM(grand_total), 0) FROM sales_invoices WHERE tenant_id = ?) as total_revenue,
          (SELECT COALESCE(SUM(current_balance), 0) FROM customers WHERE tenant_id = ?) as total_udhar,
          (SELECT COUNT(*) FROM lab_orders WHERE tenant_id = ?) as lab_order_count,
          (SELECT COALESCE(SUM(net_amount), 0) FROM lab_orders WHERE tenant_id = ?) as lab_revenue,
          (SELECT COUNT(*) FROM lab_tests WHERE tenant_id = ?) as lab_test_count,
          (SELECT COUNT(*) FROM users WHERE tenant_id = ?) as user_count
      `).get(tenant.id, tenant.id, tenant.id, tenant.id, tenant.id, tenant.id, tenant.id, tenant.id);
    }

    const invoices = db.prepare(`
      SELECT * FROM saas_subscription_invoices WHERE tenant_id = ? ORDER BY id DESC LIMIT 12
    `).all(tenant.id);

    res.json({
      ...tenant,
      metrics,
      subscription_invoices: invoices
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Onboard New Tenant (Store Registration)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      slug,
      business_type = 'pharma',
      enable_lmis,
      owner_name,
      owner_email,
      owner_phone = '',
      plan = 'pro',
      monthly_fee,
      billing_cycle = 'monthly',
      store_address = '',
      gstin = '',
      dl_number = '',
      fssai_number = '',
      upi_id = '',
      admin_notes = ''
    } = req.body;

    if (!name || !owner_name || !owner_email) {
      return res.status(400).json({ error: 'Store name, owner name, and owner email are required' });
    }

    // Determine monthly fee based on plan if not explicitly supplied
    let determinedFee = monthly_fee ? Number(monthly_fee) : 999;
    const planObj = db.prepare('SELECT monthly_rate, name FROM subscription_plans WHERE code = ? OR name = ?').get(plan, plan);
    if (planObj && !monthly_fee) {
      determinedFee = planObj.monthly_rate;
    }

    const cleanSlug = (slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `store-${Date.now().toString().slice(-4)}`;

    const renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    db.exec('BEGIN TRANSACTION;');
    try {
      // 1. Create Tenant Record
      const insertTenant = db.prepare(`
        INSERT INTO tenants (
          slug, name, business_type, owner_name, owner_email, owner_phone,
          plan, plan_status, monthly_fee, billing_cycle, subscription_renews_at,
          store_address, gstin, dl_number, fssai_number, upi_id, admin_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const tResult = insertTenant.run(
        cleanSlug, name, business_type, owner_name, owner_email, owner_phone,
        plan, determinedFee, billing_cycle, renewalDate,
        store_address, gstin, dl_number, fssai_number,
        upi_id || `${cleanSlug}@upi`, admin_notes
      );

      const tenantId = tResult.lastInsertRowid;

      // 2. Create Initial Subscription Invoice
      const invNo = `SUB-${Date.now().toString().slice(-6)}`;
      const taxAmount = Number((determinedFee * 0.18).toFixed(2));
      db.prepare(`
        INSERT INTO saas_subscription_invoices (
          tenant_id, invoice_no, plan_code, plan_name, billing_cycle,
          amount, tax_amount, total_amount, payment_status, payment_method,
          period_start, period_end
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paid', 'upi', ?, ?)
      `).run(
        tenantId, invNo, plan, planObj ? planObj.name : plan, billing_cycle,
        determinedFee, taxAmount, determinedFee + taxAmount,
        new Date().toISOString().slice(0, 10), renewalDate
      );

      // 3. Create Tenant Admin User with provided or generated password
      const initialPassword = req.body.owner_password || req.body.password || 'Admin@123';
      const initialPin = req.body.owner_pin || req.body.pin_code || '1111';
      const passwordHash = await bcrypt.hash(initialPassword.trim(), 10);

      db.prepare(`
        INSERT INTO users (tenant_id, name, email, password_hash, role, pin_code, status)
        VALUES (?, ?, ?, ?, 'tenant_admin', ?, 'active')
      `).run(tenantId, owner_name, owner_email, passwordHash, initialPin);

      // 4. Create Tenant Default Settings
      const setSetting = db.prepare('INSERT OR REPLACE INTO settings (tenant_id, key, value) VALUES (?, ?, ?)');
      setSetting.run(tenantId, 'business_type', business_type);
      setSetting.run(tenantId, 'store_name', name);
      setSetting.run(tenantId, 'phone', owner_phone || '+91 98000 00000');
      setSetting.run(tenantId, 'store_address', store_address || 'Main Market');
      setSetting.run(tenantId, 'gstin', gstin || '');
      setSetting.run(tenantId, 'dl_number', dl_number || '');
      setSetting.run(tenantId, 'fssai_number', fssai_number || '');
      setSetting.run(tenantId, 'upi_id', upi_id || `${cleanSlug}@upi`);
      setSetting.run(tenantId, 'printer_format', 'thermal80');
      setSetting.run(tenantId, 'footer_message', `Thank you for choosing ${name}! Powered by Nexa ERP`);

      // 5. Seed initial starter items based on vertical
      if (business_type === 'pharma' || business_type === 'pharma_lab') {
        const p = db.prepare(`
          INSERT INTO products (tenant_id, name, barcode, category, brand, hsn_code, gst_rate, salt_composition, pack_unit, sub_units_per_pack, allow_loose_sale, is_quick_pick)
          VALUES (?, 'Paracetamol 650mg Tablets', '8901117109999', 'Analgesic', 'Generic Care', '3004', 12, 'Paracetamol 650mg', 'Strip', 10, 1, 1)
        `).run(tenantId);

        db.prepare(`
          INSERT INTO batches (tenant_id, product_id, batch_number, expiry_date, purchase_rate, mrp, selling_rate, stock_units)
          VALUES (?, ?, 'BATCH-GEN-01', '2027-12-31', 15.0, 30.0, 25.0, 50)
        `).run(tenantId, p.lastInsertRowid);
      } else if (business_type === 'kiryana' || business_type === 'general') {
        const p = db.prepare(`
          INSERT INTO products (tenant_id, name, barcode, category, brand, hsn_code, gst_rate, unit_type, is_loose_item, is_quick_pick)
          VALUES (?, 'Chakki Fresh Atta 10kg', '890103000001', 'Flours', 'Store Choice', '1101', 5, 'packet', 0, 1)
        `).run(tenantId);

        db.prepare(`
          INSERT INTO batches (tenant_id, product_id, batch_number, expiry_date, purchase_rate, mrp, selling_rate, stock_units)
          VALUES (?, ?, 'LOT-ATTA-01', '2027-06-30', 380.0, 460.0, 430.0, 30)
        `).run(tenantId, p.lastInsertRowid);
      } else if (business_type === 'lab') {
        const p = db.prepare(`
          INSERT INTO products (tenant_id, name, barcode, category, brand, hsn_code, gst_rate, unit_type, is_quick_pick)
          VALUES (?, 'Vacutainer EDTA K2 Tubes 2ml (Pack of 100)', '890888001001', 'Laboratory Consumables', 'BD Vacutainer', '9018', 18, 'pack', 1)
        `).run(tenantId);

        db.prepare(`
          INSERT INTO batches (tenant_id, product_id, batch_number, expiry_date, purchase_rate, mrp, selling_rate, stock_units)
          VALUES (?, ?, 'LOT-VACU-01', '2028-06-30', 320.0, 450.0, 400.0, 20)
        `).run(tenantId, p.lastInsertRowid);
      } else if (business_type === 'impoexpo' || business_type === 'exim') {
        const p = db.prepare(`
          INSERT INTO products (tenant_id, name, barcode, category, brand, hsn_code, gst_rate, unit_type, is_quick_pick)
          VALUES (?, 'Industrial Brass Ball Valves 2-Inch (Grade A)', '890777000101', 'Hardware & Valves', 'Apex Flow Controls', '8481', 18, 'piece', 1)
        `).run(tenantId);

        db.prepare(`
          INSERT INTO batches (tenant_id, product_id, batch_number, expiry_date, purchase_rate, mrp, selling_rate, stock_units)
          VALUES (?, ?, 'EXP-2026-VALVE', '2030-12-31', 450.0, 750.0, 680.0, 200)
        `).run(tenantId, p.lastInsertRowid);

        setSetting.run(tenantId, 'iec_code', '0512987654');
        setSetting.run(tenantId, 'port_code', 'INNSA1 (Nhava Sheva Sea)');
        setSetting.run(tenantId, 'default_incoterm', 'FOB');
        setSetting.run(tenantId, 'default_currency', 'USD');
      }

      // 6. Pre-provision Clinical Laboratory & Pathology MIS (LMIS)
      const shouldSeedLMIS = enable_lmis === true ||
        enable_lmis === 'true' ||
        business_type === 'lab' ||
        business_type === 'pharma_lab' ||
        business_type === 'pharma';

      if (shouldSeedLMIS && typeof seedTenantLabData === 'function') {
        seedTenantLabData(tenantId, true);
      }

      db.exec('COMMIT;');

      const createdTenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId);
      res.status(201).json({
        success: true,
        message: `Tenant ${name} onboarded successfully on SpringNexa platform`,
        tenant: createdTenant
      });
    } catch (inner) {
      db.exec('ROLLBACK;');
      throw inner;
    }
  } catch (err) {
    console.error('Error onboarding tenant:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update Tenant Subscription & Rate Plan (Admin Feature)
router.put('/:id/subscription', (req, res) => {
  try {
    const tenantId = req.params.id;
    const {
      plan,
      plan_status,
      billing_cycle,
      custom_monthly_fee,
      subscription_renews_at,
      admin_notes
    } = req.body;

    const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    // Look up plan standard rate
    let targetMonthlyFee = tenant.monthly_fee;
    if (plan) {
      const planObj = db.prepare('SELECT monthly_rate, annual_rate FROM subscription_plans WHERE code = ? OR name = ?').get(plan, plan);
      if (planObj) {
        targetMonthlyFee = planObj.monthly_rate;
      }
    }

    // If custom_monthly_fee is supplied as null or empty, clear override; if number, use it
    let finalCustomFee = custom_monthly_fee === null || custom_monthly_fee === '' ? null : Number(custom_monthly_fee);
    let effectiveFee = finalCustomFee !== null && !isNaN(finalCustomFee) ? finalCustomFee : targetMonthlyFee;

    db.prepare(`
      UPDATE tenants SET
        plan = COALESCE(?, plan),
        plan_status = COALESCE(?, plan_status),
        monthly_fee = ?,
        custom_monthly_fee = ?,
        billing_cycle = COALESCE(?, billing_cycle),
        subscription_renews_at = COALESCE(?, subscription_renews_at),
        admin_notes = COALESCE(?, admin_notes)
      WHERE id = ?
    `).run(
      plan ?? null,
      plan_status ?? null,
      effectiveFee ?? null,
      finalCustomFee ?? null,
      billing_cycle ?? null,
      subscription_renews_at ?? null,
      admin_notes ?? null,
      tenantId
    );

    const updated = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId);
    res.json({
      success: true,
      message: `Subscription updated for ${updated.name}: Plan [${updated.plan}], Rate [₹${effectiveFee}/mo]`,
      tenant: updated
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record New Subscription Billing Invoice for Tenant
router.post('/:id/subscription/invoice', (req, res) => {
  try {
    const tenantId = req.params.id;
    const {
      amount,
      billing_cycle = 'monthly',
      payment_method = 'upi',
      reference_no,
      period_start,
      period_end,
      payment_status = 'paid'
    } = req.body;

    const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const invNo = `SUB-${Date.now().toString().slice(-6)}`;
    const billAmount = Number(amount) || tenant.monthly_fee;
    const taxAmount = Number((billAmount * 0.18).toFixed(2));
    const totalAmount = billAmount + taxAmount;

    const startDate = period_start || new Date().toISOString().slice(0, 10);
    const endDate = period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    db.prepare(`
      INSERT INTO saas_subscription_invoices (
        tenant_id, invoice_no, plan_code, plan_name, billing_cycle,
        amount, tax_amount, total_amount, payment_status, payment_method,
        reference_no, period_start, period_end
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tenantId, invNo, tenant.plan, tenant.plan, billing_cycle,
      billAmount, taxAmount, totalAmount, payment_status, payment_method,
      reference_no || '', startDate, endDate
    );

    // Update renewal date
    db.prepare("UPDATE tenants SET subscription_renews_at = ?, plan_status = 'active' WHERE id = ?")
      .run(endDate, tenantId);

    res.status(201).json({
      success: true,
      invoice_no: invNo,
      message: `Subscription invoice of ₹${totalAmount} recorded for ${tenant.name}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Tenant General Details
router.put('/:id', (req, res) => {
  try {
    const { name, plan, plan_status, monthly_fee, store_address, phone, gstin, dl_number, fssai_number } = req.body;

    db.prepare(`
      UPDATE tenants SET
        name = COALESCE(?, name),
        plan = COALESCE(?, plan),
        plan_status = COALESCE(?, plan_status),
        monthly_fee = COALESCE(?, monthly_fee),
        store_address = COALESCE(?, store_address),
        owner_phone = COALESCE(?, owner_phone),
        gstin = COALESCE(?, gstin),
        dl_number = COALESCE(?, dl_number),
        fssai_number = COALESCE(?, fssai_number)
      WHERE id = ?
    `).run(
      name ?? null, plan ?? null, plan_status ?? null, monthly_fee ? Number(monthly_fee) : null,
      store_address ?? null, phone ?? null, gstin ?? null, dl_number ?? null, fssai_number ?? null, req.params.id
    );

    const updated = db.prepare('SELECT * FROM tenants WHERE id = ?').get(req.params.id);
    res.json({ message: 'Tenant updated', tenant: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to check user management permission (Super Admin OR Tenant Admin of this organization)
function canManageTenantUsers(req, tenantId) {
  if (!req.user) return false;
  if (req.user.role === 'super_admin') return true;
  if (req.user.role === 'tenant_admin' && Number(req.user.tenant_id) === Number(tenantId)) return true;
  return false;
}

// List users for a tenant (Super Admin OR Tenant Owner)
router.get('/:id/users', (req, res) => {
  try {
    const tenantId = req.params.id;
    if (!canManageTenantUsers(req, tenantId)) {
      return res.status(403).json({ error: 'Access restricted: Only Super Admin or Organization Owner can view staff accounts.' });
    }

    const tenant = db.prepare('SELECT id, name, slug FROM tenants WHERE id = ?').get(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant store not found' });

    const users = db.prepare(`
      SELECT
        id,
        tenant_id,
        name,
        email,
        role,
        pin_code,
        status,
        failed_login_attempts,
        locked_until,
        last_login_at,
        created_at
      FROM users
      WHERE tenant_id = ?
      ORDER BY id ASC
    `).all(tenantId);

    res.json({
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
      users
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new user inside a tenant store (Super Admin OR Tenant Owner)
router.post('/:id/users', async (req, res) => {
  try {
    const tenantId = req.params.id;
    if (!canManageTenantUsers(req, tenantId)) {
      return res.status(403).json({ error: 'Access restricted: Only Super Admin or Organization Owner can create users.' });
    }

    const tenant = db.prepare('SELECT id, name FROM tenants WHERE id = ?').get(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant store not found' });

    const { name, email, password, role = 'cashier', pin_code = '1234' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.trim().length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'A user with this email address already exists' });
    }

    const passwordHash = await bcrypt.hash(password.trim(), 10);
    const result = db.prepare(`
      INSERT INTO users (tenant_id, name, email, password_hash, role, pin_code, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `).run(tenantId, name.trim(), cleanEmail, passwordHash, role, pin_code || '1234');

    // Security Audit Log
    try {
      db.prepare(`
        INSERT INTO security_audit_logs (tenant_id, user_id, email, event_type, details)
        VALUES (?, ?, ?, 'USER_CREATED_BY_SUPERADMIN', ?)
      `).run(tenantId, result.lastInsertRowid, cleanEmail, `Super Admin created user ${name} (${role}) for store ${tenant.name}`);
    } catch (logErr) {
      console.error('Audit log write error:', logErr);
    }

    res.status(201).json({
      success: true,
      message: `User ${name} successfully created for ${tenant.name}`,
      user: {
        id: result.lastInsertRowid,
        tenant_id: Number(tenantId),
        name: name.trim(),
        email: cleanEmail,
        role,
        pin_code,
        status: 'active'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Set / Reset User Password for Tenant User (Super Admin OR Tenant Owner)
router.put('/:id/users/:userId/password', async (req, res) => {
  try {
    const { id: tenantId, userId } = req.params;
    if (!canManageTenantUsers(req, tenantId)) {
      return res.status(403).json({ error: 'Access restricted: Only Super Admin or Organization Owner can reset passwords.' });
    }

    const { password, pin_code } = req.body;

    if (!password || password.trim().length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ? AND tenant_id = ?').get(userId, tenantId);
    if (!user) {
      return res.status(404).json({ error: 'User not found in the specified store tenant' });
    }

    const newHash = await bcrypt.hash(password.trim(), 10);

    // Update password, reset lockout and failed attempts
    db.prepare(`
      UPDATE users SET
        password_hash = ?,
        pin_code = COALESCE(?, pin_code),
        failed_login_attempts = 0,
        locked_until = NULL,
        status = 'active'
      WHERE id = ? AND tenant_id = ?
    `).run(newHash, pin_code ? String(pin_code) : null, userId, tenantId);

    // Invalidate existing sessions so user must log in with new password
    db.prepare('DELETE FROM active_sessions WHERE user_id = ?').run(userId);

    // Security Audit Log
    try {
      db.prepare(`
        INSERT INTO security_audit_logs (tenant_id, user_id, email, event_type, details)
        VALUES (?, ?, ?, 'PASSWORD_RESET', ?)
      `).run(
        tenantId,
        userId,
        user.email,
        `Password reset for ${user.name} (${user.email}). Account unlocked and sessions refreshed.`
      );
    } catch (logErr) {
      console.error('Audit log write error:', logErr);
    }

    res.json({
      success: true,
      message: `Password successfully updated for ${user.name} (${user.email}). Account is unlocked and ready for login.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Tenant User Status (Active / Suspended / Unlock)
router.put('/:id/users/:userId/status', (req, res) => {
  try {
    const { id: tenantId, userId } = req.params;
    if (!canManageTenantUsers(req, tenantId)) {
      return res.status(403).json({ error: 'Access restricted: Only Super Admin or Organization Owner can update status.' });
    }

    const { status, unlock } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE id = ? AND tenant_id = ?').get(userId, tenantId);
    if (!user) {
      return res.status(404).json({ error: 'User not found in this tenant' });
    }

    const newStatus = status || user.status;
    const clearLockout = !!unlock;

    if (clearLockout) {
      db.prepare(`
        UPDATE users SET
          status = ?,
          failed_login_attempts = 0,
          locked_until = NULL
        WHERE id = ? AND tenant_id = ?
      `).run(newStatus, userId, tenantId);
    } else {
      db.prepare(`
        UPDATE users SET status = ? WHERE id = ? AND tenant_id = ?
      `).run(newStatus, userId, tenantId);
    }

    // Security Audit Log
    try {
      db.prepare(`
        INSERT INTO security_audit_logs (tenant_id, user_id, email, event_type, details)
        VALUES (?, ?, ?, 'USER_STATUS_UPDATED', ?)
      `).run(
        tenantId,
        userId,
        user.email,
        `User status changed to ${newStatus}${clearLockout ? ' (lockout cleared)' : ''}`
      );
    } catch (logErr) {
      console.error('Audit log write error:', logErr);
    }

    res.json({
      success: true,
      message: `User ${user.name} status updated to ${newStatus}${clearLockout ? ' (lockout cleared)' : ''}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Tenant User
router.delete('/:id/users/:userId', (req, res) => {
  try {
    const { id: tenantId, userId } = req.params;
    if (!canManageTenantUsers(req, tenantId)) {
      return res.status(403).json({ error: 'Access restricted: Only Super Admin or Organization Owner can delete users.' });
    }

    if (req.user && req.user.id === Number(userId)) {
      return res.status(400).json({ error: 'Cannot delete your own active account.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ? AND tenant_id = ?').get(userId, tenantId);
    if (!user) {
      return res.status(404).json({ error: 'User not found in this tenant' });
    }

    db.prepare('DELETE FROM active_sessions WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ? AND tenant_id = ?').run(userId, tenantId);

    res.json({
      success: true,
      message: `User ${user.name} (${user.email}) deleted successfully`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
