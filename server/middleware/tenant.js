const { db } = require('../db');

/**
 * Strict Tenant Isolation Middleware
 * Guarantees zero cross-tenant data leakage and blocks unauthorized tenant header tampering.
 */
function tenantMiddleware(req, res, next) {
  try {
    const tenantHeader = req.headers['x-tenant-id'] || req.query.tenant_id;
    const tenantSlug = req.headers['x-tenant-slug'] || req.query.tenant_slug;

    // 1. Authenticated User Boundary Enforcement
    if (req.user) {
      if (req.user.role === 'super_admin') {
        // Tenant Privacy Policy Enforcement:
        // Platform Super Admin is restricted from accessing private organization operational data
        const privateOrgPrefixes = [
          '/api/products',
          '/api/sales',
          '/api/customers',
          '/api/suppliers',
          '/api/purchases',
          '/api/reports',
          '/api/accounting',
          '/api/hrm',
          '/api/returns',
          '/api/adjustments',
          '/api/promotions',
          '/api/lab',
          '/api/settings',
          '/api/import-export'
        ];

        const fullUrl = req.originalUrl || req.url || '';
        if (privateOrgPrefixes.some(prefix => fullUrl.startsWith(prefix))) {
          return res.status(403).json({
            error: 'Tenant Privacy Policy Enforced: Platform Super Admin is restricted from viewing private organization operational data (sales bills, customer ledgers, inventory, accounting, and patient clinical records).',
            code: 'SUPER_ADMIN_ORG_DATA_RESTRICTED',
            policy: 'Tenant Isolation Policy'
          });
        }

        // Super Admin is permitted to manage global platform and tenant metadata
        let targetTenant = null;
        if (tenantHeader) {
          if (!isNaN(tenantHeader)) {
            targetTenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(Number(tenantHeader));
          } else {
            targetTenant = db.prepare('SELECT * FROM tenants WHERE slug = ?').get(String(tenantHeader));
          }
        } else if (tenantSlug) {
          targetTenant = db.prepare('SELECT * FROM tenants WHERE slug = ?').get(String(tenantSlug));
        }

        if (targetTenant) {
          req.tenant = targetTenant;
          req.tenantId = targetTenant.id;
        } else {
          req.tenant = null;
          req.tenantId = null;
        }

        req.isolation = {
          mode: 'SUPER_ADMIN_PLATFORM_MANAGEMENT_PRIVACY_ENFORCED',
          enforced: true,
          tenantId: req.tenantId,
          tenantSlug: req.tenant?.slug,
          organisationDataBlocked: true
        };

        return next();
      }

      // Regular Tenant User (tenant_admin, cashier, manager, accountant)
      const userTenantId = req.user.tenant_id;
      if (!userTenantId) {
        return res.status(403).json({ error: 'Tenant Isolation Error: User is not linked to any active store tenant.' });
      }

      // ANTI-TAMPER CHECK: If client tries to spoof or inject another store's ID
      if (tenantHeader && !isNaN(tenantHeader) && Number(tenantHeader) !== Number(userTenantId)) {
        // Log security breach attempt
        try {
          db.prepare(`
            INSERT INTO security_audit_logs (tenant_id, user_id, email, event_type, details, ip_address)
            VALUES (?, ?, ?, 'TENANT_ISOLATION_BREACH_ATTEMPT', ?, ?)
          `).run(
            userTenantId,
            req.user.id,
            req.user.email,
            `Blocked attempt to access Tenant #${tenantHeader} while authenticated as Tenant #${userTenantId}`,
            req.ip || '127.0.0.1'
          );
        } catch (logErr) {
          console.error('Audit log error:', logErr);
        }

        return res.status(403).json({
          error: `Tenant Isolation Violation: Cross-tenant access is strictly prohibited. You are restricted to your assigned store boundary (Tenant #${userTenantId}).`
        });
      }

      // Pin strictly to user's authenticated tenant
      const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(userTenantId);
      if (!tenant) {
        return res.status(404).json({ error: 'Assigned store tenant not found in system.' });
      }

      if (tenant.plan_status === 'suspended') {
        return res.status(403).json({
          error: 'Store Account Suspended: Your store subscription is currently locked. Please contact system administrator.'
        });
      }

      req.tenant = tenant;
      req.tenantId = tenant.id;
      req.isolation = {
        mode: 'STRICT_ROW_LEVEL_ISOLATION',
        enforced: true,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        accessControl: 'ENFORCED'
      };

      return next();
    }

    // 2. Unauthenticated Request (Pre-login, health check, public bootstrap)
    let tenant = null;
    if (tenantHeader) {
      if (!isNaN(tenantHeader)) {
        tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(Number(tenantHeader));
      } else {
        tenant = db.prepare('SELECT * FROM tenants WHERE slug = ?').get(String(tenantHeader));
      }
    } else if (tenantSlug) {
      tenant = db.prepare('SELECT * FROM tenants WHERE slug = ?').get(String(tenantSlug));
    }

    // Default to the first active tenant for initial pre-login state
    if (!tenant) {
      tenant = db.prepare('SELECT * FROM tenants ORDER BY id ASC LIMIT 1').get();
    }

    if (tenant) {
      req.tenant = tenant;
      req.tenantId = tenant.id;
      req.isolation = {
        mode: 'UNAUTHENTICATED_PRE_LOGIN_CONTEXT',
        enforced: false,
        tenantId: tenant.id,
        tenantSlug: tenant.slug
      };
    } else {
      req.tenant = null;
      req.tenantId = null;
      req.isolation = {
        mode: 'NO_TENANT_ESTABLISHED',
        enforced: false
      };
    }

    next();
  } catch (err) {
    console.error('Tenant isolation middleware error:', err);
    res.status(500).json({ error: 'Tenant isolation processing failed: ' + err.message });
  }
}

module.exports = tenantMiddleware;
