const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

// Helper to log security events
function logSecurityEvent(tenantId, userId, email, eventType, req, details = '') {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    db.prepare(`
      INSERT INTO security_audit_logs (tenant_id, user_id, email, event_type, ip_address, user_agent, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(tenantId || null, userId || null, email, eventType, String(ip), String(userAgent), details);
  } catch (err) {
    console.error('Audit log write error:', err);
  }
}

// 1. User Login (Email & Password with Brute-Force Lockout Protection)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(cleanEmail);

    if (!user) {
      logSecurityEvent(null, null, cleanEmail, 'LOGIN_FAILED', req, 'User account not found');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check Account Lockout
    if (user.locked_until) {
      const lockTime = new Date(user.locked_until).getTime();
      const now = Date.now();
      if (now < lockTime) {
        const remainingMinutes = Math.ceil((lockTime - now) / (1000 * 60));
        logSecurityEvent(user.tenant_id, user.id, cleanEmail, 'ACCOUNT_LOCKED', req, `Attempt during lock period. ${remainingMinutes}m left`);
        return res.status(403).json({
          error: `Security Lock: Account temporarily locked due to repeated failed attempts. Please retry in ${remainingMinutes} minutes.`
        });
      } else {
        // Lock has expired, reset lockout
        db.prepare('UPDATE users SET locked_until = NULL, failed_login_attempts = 0 WHERE id = ?').run(user.id);
      }
    }

    // Verify Password Hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      const nextAttempts = (user.failed_login_attempts || 0) + 1;
      let lockUntilSql = null;
      let message = `Invalid email or password. Attempt ${nextAttempts}/5.`;

      if (nextAttempts >= 5) {
        // Lock for 15 minutes
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        db.prepare('UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?')
          .run(nextAttempts, lockUntil, user.id);
        logSecurityEvent(user.tenant_id, user.id, cleanEmail, 'ACCOUNT_LOCKED', req, 'Exceeded 5 failed login attempts');
        return res.status(403).json({
          error: 'Security Lock: Maximum failed attempts exceeded. Account is locked for 15 minutes.'
        });
      } else {
        db.prepare('UPDATE users SET failed_login_attempts = ? WHERE id = ?').run(nextAttempts, user.id);
        logSecurityEvent(user.tenant_id, user.id, cleanEmail, 'LOGIN_FAILED', req, `Failed attempt ${nextAttempts}`);
        return res.status(401).json({ error: message, remainingAttempts: 5 - nextAttempts });
      }
    }

    // Reset failed attempts & update last login on success
    db.prepare(`
      UPDATE users SET
        failed_login_attempts = 0,
        locked_until = NULL,
        last_login_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(user.id);

    // Fetch tenant details if tenant-bound user
    const tenant = user.tenant_id
      ? db.prepare('SELECT * FROM tenants WHERE id = ?').get(user.tenant_id)
      : null;

    // Issue JWT Token (24h validity)
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenant_id: user.tenant_id
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    // Record Active Session
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    db.prepare(`
      INSERT OR REPLACE INTO active_sessions (token, user_id, tenant_id, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(token, user.id, user.tenant_id || null, expiresAt);

    logSecurityEvent(user.tenant_id, user.id, cleanEmail, 'LOGIN_SUCCESS', req, `Role: ${user.role}`);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      tenant_id: user.tenant_id,
      last_login_at: user.last_login_at
    };

    res.json({
      success: true,
      token,
      user: safeUser,
      tenant
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server authentication error' });
  }
});

// 2. Terminal Quick PIN Verification (For Fast Cashier Counter Lock & Shift Swaps)
router.post('/pos-pin-verify', (req, res) => {
  try {
    const { pin, user_id } = req.body;
    if (!pin) return res.status(400).json({ error: 'PIN is required' });

    const user = user_id
      ? db.prepare('SELECT id, name, email, role, tenant_id, pin_code FROM users WHERE id = ?').get(user_id)
      : (req.user ? db.prepare('SELECT id, name, email, role, tenant_id, pin_code FROM users WHERE id = ?').get(req.user.id) : null);

    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.pin_code !== String(pin)) {
      logSecurityEvent(user.tenant_id, user.id, user.email, 'LOGIN_FAILED', req, 'Invalid Counter PIN');
      return res.status(401).json({ error: 'Incorrect 4-digit PIN' });
    }

    logSecurityEvent(user.tenant_id, user.id, user.email, 'PIN_UNLOCK', req, 'POS Terminal Unlocked via PIN');
    res.json({ success: true, message: 'Terminal unlocked', user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Current Authenticated Profile
router.get('/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = db.prepare('SELECT id, tenant_id, name, email, role, status, last_login_at, created_at FROM users WHERE id = ?').get(req.user.id);
  const tenant = user.tenant_id ? db.prepare('SELECT * FROM tenants WHERE id = ?').get(user.tenant_id) : null;

  res.json({
    user,
    tenant
  });
});

// 4. Logout & Session Invalidation
router.post('/logout', (req, res) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];
    let token = authHeader ? (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader) : null;

    if (token) {
      db.prepare('DELETE FROM active_sessions WHERE token = ?').run(token);
    }

    if (req.user) {
      logSecurityEvent(req.user.tenant_id, req.user.id, req.user.email, 'LOGOUT', req, 'Voluntary logout');
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Security Audit Trail Logs
router.get('/audit-logs', (req, res) => {
  try {
    const isSuper = req.user && req.user.role === 'super_admin';
    const tenantId = req.tenantId;

    let sql = `
      SELECT l.*, u.name as user_name
      FROM security_audit_logs l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // If not super_admin, scope strictly to tenant
    if (!isSuper) {
      sql += ' AND l.tenant_id = ?';
      params.push(tenantId);
    }

    sql += ' ORDER BY l.id DESC LIMIT 100';

    const logs = db.prepare(sql).all(...params);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
