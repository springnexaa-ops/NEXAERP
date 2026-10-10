const jwt = require('jsonwebtoken');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'springnexa_nexa_erp_super_secure_jwt_secret_key_2026';

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];
    let token = null;

    if (authHeader) {
      token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
    }

    if (!token) {
      req.user = null;
      return next();
    }

    // Verify JWT
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        req.user = null;
        return next();
      }

      // Check if user is active in database
      const user = db.prepare('SELECT id, tenant_id, name, email, role, status FROM users WHERE id = ?').get(decoded.id);
      if (!user || user.status !== 'active') {
        req.user = null;
        return next();
      }

      req.user = user;

      // If user is bound to a tenant, enforce their tenant_id
      if (user.tenant_id) {
        req.tenantId = user.tenant_id;
        req.tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(user.tenant_id);
      }

      next();
    });
  } catch (err) {
    console.error('Auth middleware error:', err);
    next();
  }
}

// Role-Based Authorization Guard
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Log security violation in audit log
      try {
        db.prepare(`
          INSERT INTO security_audit_logs (tenant_id, user_id, email, event_type, details)
          VALUES (?, ?, ?, 'UNAUTHORIZED_ACCESS', ?)
        `).run(req.tenantId, req.user.id, req.user.email, `Attempted access to role-protected endpoint requiring: [${allowedRoles.join(', ')}]`);
      } catch (logErr) {
        // ignore
      }

      return res.status(403).json({
        error: `Access Denied: Your role '${req.user.role}' lacks permission for this action.`
      });
    }

    next();
  };
}

module.exports = {
  authMiddleware,
  requireRole,
  JWT_SECRET
};
