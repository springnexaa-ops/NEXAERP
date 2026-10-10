const express = require('express');
const router = express.Router();
const fs = require('fs');
const { db, dbPath } = require('../db');
const { seedDatabase } = require('../seed');

// Get tenant settings as key-value object
router.get('/', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const rows = db.prepare('SELECT key, value FROM settings WHERE tenant_id = ?').all(tenantId);
    const settings = {};
    rows.forEach(r => settings[r.key] = r.value);
    res.json({ ...settings, tenant: req.tenant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update tenant settings
router.post('/', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const updates = req.body;
    const upsert = db.prepare('INSERT OR REPLACE INTO settings (tenant_id, key, value) VALUES (?, ?, ?)');

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'tenant') {
        upsert.run(tenantId, key, String(value));
      }
    }

    // Also update tenant table if business_type or store_name was modified
    if (updates.business_type || updates.store_name) {
      db.prepare(`
        UPDATE tenants SET
          business_type = COALESCE(?, business_type),
          name = COALESCE(?, name)
        WHERE id = ?
      `).run(updates.business_type, updates.store_name, tenantId);
    }

    const rows = db.prepare('SELECT key, value FROM settings WHERE tenant_id = ?').all(tenantId);
    const settings = {};
    rows.forEach(r => settings[r.key] = r.value);

    res.json({ message: 'Settings saved successfully', settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset and re-seed demo data
router.post('/seed', (req, res) => {
  try {
    seedDatabase();
    res.json({ message: 'Nexa ERP SaaS Database refreshed with sample multi-tenant catalog!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const { createIsolatedTenantVault } = require('../utils/tenantVault');

// Download Isolated Tenant SQLite Data Vault (Zero-Leakage Backup)
router.get('/backup', (req, res) => {
  try {
    const tenantId = req.tenantId;

    // Super Admin global backup flag
    if (req.user && req.user.role === 'super_admin' && req.query.global === 'true') {
      if (!fs.existsSync(dbPath)) {
        return res.status(404).json({ error: 'Global database file not found' });
      }
      return res.download(dbPath, `nexa_erp_platform_global_backup_${Date.now()}.sqlite`);
    }

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context required for isolated backup export' });
    }

    // Build standalone isolated SQLite vault containing ONLY this store's rows
    const { vaultPath, fileName } = createIsolatedTenantVault(tenantId);

    res.setHeader('Content-Type', 'application/x-sqlite3');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const stream = fs.createReadStream(vaultPath);
    stream.pipe(res);

    stream.on('end', () => {
      setTimeout(() => {
        if (fs.existsSync(vaultPath)) {
          try { fs.unlinkSync(vaultPath); } catch {}
        }
      }, 500);
    });

    stream.on('error', (streamErr) => {
      console.error('Vault stream error:', streamErr);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Vault file stream failed' });
      }
    });
  } catch (err) {
    console.error('Backup export error:', err);
    res.status(500).json({ error: 'Isolated vault generation failed: ' + err.message });
  }
});

module.exports = router;
