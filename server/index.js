const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./db');

const { authMiddleware } = require('./middleware/auth');
const authRouter = require('./routes/auth');
const tenantMiddleware = require('./middleware/tenant');
const tenantsRouter = require('./routes/tenants');
const productsRouter = require('./routes/products');
const salesRouter = require('./routes/sales');
const customersRouter = require('./routes/customers');
const suppliersRouter = require('./routes/suppliers');
const purchasesRouter = require('./routes/purchases');
const reportsRouter = require('./routes/reports');
const settingsRouter = require('./routes/settings');

// Business Modules
const accountingRouter = require('./routes/accounting');
const hrmRouter = require('./routes/hrm');
const returnsRouter = require('./routes/returns');
const adjustmentsRouter = require('./routes/adjustments');
const promotionsRouter = require('./routes/promotions');
const plansRouter = require('./routes/plans');
const labRouter = require('./routes/lab');
const importExportRouter = require('./routes/importExport');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// 1. Authentication & Security Routes (Login, PIN, Audit logs)
app.use('/api/auth', authMiddleware, authRouter);

// 2. Security & Tenant Context Middlewares
app.use(authMiddleware);
app.use(tenantMiddleware);

// 3. SaaS Multi-Tenant Management Routes (Super Admin)
app.use('/api/tenants', tenantsRouter);
app.use('/api/plans', plansRouter);

// 4. Tenant-Scoped Store Operations Routes
app.use('/api/products', productsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/customers', customersRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/purchases', purchasesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/settings', settingsRouter);

// 5. Extended ERP Modules
app.use('/api/accounting', accountingRouter);
app.use('/api/hrm', hrmRouter);
app.use('/api/returns', returnsRouter);
app.use('/api/adjustments', adjustmentsRouter);
app.use('/api/promotions', promotionsRouter);
app.use('/api/lab', labRouter);
app.use('/api/import-export', importExportRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Nexa ERP Multi-Tenant SaaS',
    modules: ['POS', 'Inventory', 'Khata', 'Purchases', 'Accounting', 'HRM', 'Returns', 'StockAudit', 'Promotions', 'LabMIS', 'ImportExport', 'Reports'],
    authenticated_user: req.user ? { id: req.user.id, name: req.user.name, role: req.user.role } : null,
    tenant: req.tenant ? { id: req.tenant.id, name: req.tenant.name, slug: req.tenant.slug } : null,
    time: new Date().toISOString()
  });
});

// Serve frontend static build
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    const indexPath = path.join(distPath, 'index.html');
    if (require('fs').existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  next();
});

const server = app.listen(PORT, () => {
  console.log(`Nexa ERP server listening on http://localhost:${PORT}`);
});

module.exports = { app, server };
