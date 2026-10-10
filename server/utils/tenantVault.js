const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');
const { db } = require('../db');

const vaultsDir = path.join(__dirname, '..', '..', 'data', 'vaults');
if (!fs.existsSync(vaultsDir)) {
  fs.mkdirSync(vaultsDir, { recursive: true });
}

/**
 * Builds a strictly isolated SQLite database file containing ONLY the specified tenant's data.
 * Zero bytes or rows from other tenants are present in the exported file.
 */
function createIsolatedTenantVault(tenantId) {
  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId);
  if (!tenant) throw new Error('Tenant not found');

  const timestamp = Date.now();
  const safeSlug = (tenant.slug || `store-${tenantId}`).replace(/[^a-z0-9_-]/gi, '_');
  const fileName = `nexa_store_${safeSlug}_isolated_vault_${timestamp}.sqlite`;
  const vaultPath = path.join(vaultsDir, fileName);

  // Initialize new isolated SQLite instance
  const vaultDb = new DatabaseSync(vaultPath);

  try {
    vaultDb.exec('PRAGMA foreign_keys = OFF;');

    // 1. Recreate table structures
    const tables = db.prepare(`
      SELECT name, sql FROM sqlite_master
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name != 'subscription_plans' AND name != 'saas_subscription_invoices'
    `).all();

    for (const t of tables) {
      if (t.sql) {
        vaultDb.exec(t.sql);
      }
    }

    // 2. Copy tenant record
    const tenantCols = db.prepare('PRAGMA table_info(tenants)').all().map(c => c.name);
    const tenantRow = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId);
    if (tenantRow) {
      const placeholders = tenantCols.map(() => '?').join(', ');
      const insertSql = `INSERT INTO tenants (${tenantCols.join(', ')}) VALUES (${placeholders})`;
      vaultDb.prepare(insertSql).run(...tenantCols.map(c => tenantRow[c]));
    }

    // 3. Copy all scoped tables where tenant_id = tenantId
    const scopedTables = [
      'users',
      'settings',
      'products',
      'batches',
      'customers',
      'customer_ledger',
      'suppliers',
      'supplier_purchases',
      'sales_invoices',
      'sales_items',
      'held_bills',
      'chart_of_accounts',
      'expenses',
      'employees',
      'employee_attendance',
      'payroll_records',
      'sales_returns',
      'sales_return_items',
      'supplier_returns',
      'stock_adjustments',
      'promotions',
      'security_audit_logs',
      'lab_tests',
      'lab_test_parameters',
      'lab_packages',
      'lab_referral_doctors',
      'lab_orders',
      'lab_order_items',
      'lab_order_results'
    ];

    for (const tableName of scopedTables) {
      // Check if table exists in master DB
      const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName);
      if (!tableExists) continue;

      const cols = db.prepare(`PRAGMA table_info(${tableName})`).all().map(c => c.name);
      if (!cols.includes('tenant_id')) continue;

      const rows = db.prepare(`SELECT * FROM ${tableName} WHERE tenant_id = ?`).all(tenantId);
      if (rows && rows.length > 0) {
        const placeholders = cols.map(() => '?').join(', ');
        const insertStmt = vaultDb.prepare(`INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders})`);
        for (const row of rows) {
          insertStmt.run(...cols.map(c => row[c]));
        }
      }
    }

    vaultDb.exec('PRAGMA foreign_keys = ON;');
    vaultDb.close();

    return {
      vaultPath,
      fileName,
      tenantName: tenant.name,
      tenantId: tenant.id
    };
  } catch (err) {
    vaultDb.close();
    if (fs.existsSync(vaultPath)) fs.unlinkSync(vaultPath);
    throw err;
  }
}

module.exports = {
  createIsolatedTenantVault
};
