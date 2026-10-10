const { db } = require('../db');

/**
 * Tenant Quota & Entitlement Guard
 * Enforces product limits, staff user caps, and feature entitlements per tenant plan tier.
 */

function checkProductQuota(tenantId) {
  try {
    const tenant = db.prepare('SELECT plan FROM tenants WHERE id = ?').get(tenantId);
    if (!tenant) return { allowed: true };

    const plan = db.prepare('SELECT max_products, name FROM subscription_plans WHERE code = ? OR name = ?')
      .get(tenant.plan, tenant.plan);

    if (!plan || plan.max_products === -1) {
      return { allowed: true }; // Unlimited
    }

    const currentCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE tenant_id = ?').get(tenantId).count;

    if (currentCount >= plan.max_products) {
      return {
        allowed: false,
        current: currentCount,
        max: plan.max_products,
        planName: plan.name,
        error: `Plan Quota Exceeded: Your '${plan.name}' plan allows a maximum of ${plan.max_products} products (currently ${currentCount}). Please upgrade to Enterprise Unlimited.`
      };
    }

    return { allowed: true, current: currentCount, max: plan.max_products };
  } catch (err) {
    console.error('Product quota check error:', err);
    return { allowed: true };
  }
}

function checkStaffQuota(tenantId) {
  try {
    const tenant = db.prepare('SELECT plan FROM tenants WHERE id = ?').get(tenantId);
    if (!tenant) return { allowed: true };

    const plan = db.prepare('SELECT max_staff, name FROM subscription_plans WHERE code = ? OR name = ?')
      .get(tenant.plan, tenant.plan);

    if (!plan || plan.max_staff === -1) {
      return { allowed: true }; // Unlimited
    }

    const currentCount = db.prepare('SELECT COUNT(*) as count FROM employees WHERE tenant_id = ?').get(tenantId).count;

    if (currentCount >= plan.max_staff) {
      return {
        allowed: false,
        current: currentCount,
        max: plan.max_staff,
        planName: plan.name,
        error: `Staff Quota Exceeded: Your '${plan.name}' plan allows a maximum of ${plan.max_staff} staff members (currently ${currentCount}). Please upgrade your rate plan.`
      };
    }

    return { allowed: true, current: currentCount, max: plan.max_staff };
  } catch (err) {
    console.error('Staff quota check error:', err);
    return { allowed: true };
  }
}

function getTenantQuotaSummary(tenantId) {
  try {
    const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId);
    if (!tenant) return null;

    const plan = db.prepare('SELECT * FROM subscription_plans WHERE code = ? OR name = ?')
      .get(tenant.plan, tenant.plan);

    const productCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE tenant_id = ?').get(tenantId).count;
    const staffCount = db.prepare('SELECT COUNT(*) as count FROM employees WHERE tenant_id = ?').get(tenantId).count;
    const invoiceCount = db.prepare('SELECT COUNT(*) as count FROM sales_invoices WHERE tenant_id = ?').get(tenantId).count;
    const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers WHERE tenant_id = ?').get(tenantId).count;

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      planCode: tenant.plan,
      planName: plan ? plan.name : tenant.plan,
      monthlyFee: tenant.custom_monthly_fee || tenant.monthly_fee,
      products: {
        current: productCount,
        max: plan ? plan.max_products : -1,
        percentUsed: plan && plan.max_products > 0 ? Math.round((productCount / plan.max_products) * 100) : 0
      },
      staff: {
        current: staffCount,
        max: plan ? plan.max_staff : -1,
        percentUsed: plan && plan.max_staff > 0 ? Math.round((staffCount / plan.max_staff) * 100) : 0
      },
      orders: {
        current: invoiceCount,
        max: plan ? plan.max_orders_per_month : -1
      },
      customers: customerCount
    };
  } catch (err) {
    console.error('Tenant quota summary error:', err);
    return null;
  }
}

module.exports = {
  checkProductQuota,
  checkStaffQuota,
  getTenantQuotaSummary
};
