const BASE_URL = '/api';

let activeTenantId = localStorage.getItem('nexa_tenant_id') || '1';
let authToken = localStorage.getItem('nexa_auth_token') || null;

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'x-tenant-id': String(activeTenantId),
    ...options.headers
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const config = {
    ...options,
    headers
  };

  const response = await fetch(url, config);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const api = {
  // Authentication & Security APIs
  setAuthToken: (token) => {
    authToken = token;
    if (token) {
      localStorage.setItem('nexa_auth_token', token);
    } else {
      localStorage.removeItem('nexa_auth_token');
    }
  },
  getAuthToken: () => authToken,

  login: async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) {
      api.setAuthToken(data.token);
    }
    return data;
  },
  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      api.setAuthToken(null);
    }
  },
  getMe: () => request('/auth/me'),
  verifyPin: (pin, user_id) => request('/auth/pos-pin-verify', {
    method: 'POST',
    body: JSON.stringify({ pin, user_id })
  }),
  getAuditLogs: () => request('/auth/audit-logs'),

  // Tenant Switcher Context
  setActiveTenantId: (id) => {
    activeTenantId = String(id);
    localStorage.setItem('nexa_tenant_id', String(id));
  },
  getActiveTenantId: () => activeTenantId,

  // SaaS Tenants & SpringNexa Admin
  getTenants: () => request('/tenants'),
  getTenant: (id) => request(`/tenants/${id}`),
  createTenant: (data) => request('/tenants', { method: 'POST', body: JSON.stringify(data) }),
  updateTenant: (id, data) => request(`/tenants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateTenantSubscription: (id, data) => request(`/tenants/${id}/subscription`, { method: 'PUT', body: JSON.stringify(data) }),
  recordSubscriptionInvoice: (id, data) => request(`/tenants/${id}/subscription/invoice`, { method: 'POST', body: JSON.stringify(data) }),
  getSubscriptionInvoices: () => request('/tenants/subscriptions/invoices'),
  getPlatformStats: () => request('/tenants/platform/stats'),
  getIsolationStatus: () => request('/tenants/isolation/status'),

  // Tenant User & Password Management (Super Admin Access)
  getTenantUsers: (tenantId) => request(`/tenants/${tenantId}/users`),
  createTenantUser: (tenantId, userData) => request(`/tenants/${tenantId}/users`, { method: 'POST', body: JSON.stringify(userData) }),
  setTenantUserPassword: (tenantId, userId, password, pin_code) => request(`/tenants/${tenantId}/users/${userId}/password`, {
    method: 'PUT',
    body: JSON.stringify({ password, pin_code })
  }),
  setTenantUserStatus: (tenantId, userId, status, unlock = false) => request(`/tenants/${tenantId}/users/${userId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, unlock })
  }),
  deleteTenantUser: (tenantId, userId) => request(`/tenants/${tenantId}/users/${userId}`, { method: 'DELETE' }),

  // SaaS Rate Plans Management (Super Admin)
  getPlans: () => request('/plans'),
  getPlan: (id) => request(`/plans/${id}`),
  createPlan: (data) => request('/plans', { method: 'POST', body: JSON.stringify(data) }),
  updatePlan: (id, data) => request(`/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePlan: (id) => request(`/plans/${id}`, { method: 'DELETE' }),

  // Products & Batches (Tenant Scoped)
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? `?${query}` : ''}`);
  },
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addBatch: (productId, data) => request(`/products/${productId}/batches`, { method: 'POST', body: JSON.stringify(data) }),
  getSubstitutes: (salt, excludeId) => request(`/products/substitutes?salt=${encodeURIComponent(salt)}${excludeId ? `&excludeId=${excludeId}` : ''}`),

  // POS Sales & Invoices (Tenant Scoped)
  checkout: (payload) => request('/sales/checkout', { method: 'POST', body: JSON.stringify(payload) }),
  getSales: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/sales${query ? `?${query}` : ''}`);
  },
  getSaleInvoice: (id) => request(`/sales/${id}`),
  holdBill: (payload) => request('/sales/hold', { method: 'POST', body: JSON.stringify(payload) }),
  getHeldBills: () => request('/sales/hold/list'),
  deleteHeldBill: (id) => request(`/sales/hold/${id}`, { method: 'DELETE' }),

  // Customers & Khata (Tenant Scoped)
  getCustomers: (search = '') => request(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createCustomer: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  getCustomerLedger: (id) => request(`/customers/${id}/ledger`),
  recordCustomerPayment: (id, payload) => request(`/customers/${id}/payment`, { method: 'POST', body: JSON.stringify(payload) }),

  // Suppliers & Purchases (Tenant Scoped)
  getSuppliers: () => request('/suppliers'),
  createSupplier: (data) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  getPurchases: () => request('/purchases'),
  createPurchase: (data) => request('/purchases', { method: 'POST', body: JSON.stringify(data) }),

  // Accounting & Expenses
  getFinancialSummary: () => request('/accounting/summary'),
  getExpenses: (category) => request(`/accounting/expenses${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  createExpense: (data) => request('/accounting/expenses', { method: 'POST', body: JSON.stringify(data) }),
  getPLStatement: () => request('/accounting/pl-statement'),

  // HRM & Payroll
  getEmployees: () => request('/hrm/employees'),
  createEmployee: (data) => request('/hrm/employees', { method: 'POST', body: JSON.stringify(data) }),
  getAttendance: (date) => request(`/hrm/attendance${date ? `?date=${date}` : ''}`),
  markAttendance: (data) => request('/hrm/attendance', { method: 'POST', body: JSON.stringify(data) }),
  getPayroll: (monthYear) => request(`/hrm/payroll${monthYear ? `?month_year=${monthYear}` : ''}`),
  disburseSalary: (data) => request('/hrm/payroll/disburse', { method: 'POST', body: JSON.stringify(data) }),

  // Returns & Credit/Debit Notes
  getSalesReturns: () => request('/returns/sales'),
  createSalesReturn: (data) => request('/returns/sales', { method: 'POST', body: JSON.stringify(data) }),
  getSupplierReturns: () => request('/returns/suppliers'),
  createSupplierDebitNote: (data) => request('/returns/suppliers', { method: 'POST', body: JSON.stringify(data) }),

  // Stock Audits & Barcode Sheets
  getStockAdjustments: () => request('/adjustments'),
  createStockAdjustment: (data) => request('/adjustments', { method: 'POST', body: JSON.stringify(data) }),
  getBarcodeSheet: (productId) => request(`/adjustments/barcode-sheet${productId ? `?product_id=${productId}` : ''}`),

  // Promotions & Loyalty
  getPromotions: () => request('/promotions'),
  createPromotion: (data) => request('/promotions', { method: 'POST', body: JSON.stringify(data) }),
  applyCoupon: (code, subtotal) => request('/promotions/apply', { method: 'POST', body: JSON.stringify({ code, cart_subtotal: subtotal }) }),
  getLoyaltyPoints: (customerId) => request(`/promotions/loyalty/${customerId}`),

  // Lab & Diagnostics MIS
  getLabAnalytics: () => request('/lab/analytics'),
  getLabTests: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/lab/tests${query ? `?${query}` : ''}`);
  },
  getLabTest: (id) => request(`/lab/tests/${id}`),
  createLabTest: (data) => request('/lab/tests', { method: 'POST', body: JSON.stringify(data) }),
  updateLabTest: (id, data) => request(`/lab/tests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getLabPackages: () => request('/lab/packages'),
  createLabPackage: (data) => request('/lab/packages', { method: 'POST', body: JSON.stringify(data) }),

  getLabOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/lab/orders${query ? `?${query}` : ''}`);
  },
  getLabOrder: (id) => request(`/lab/orders/${id}`),
  createLabOrder: (data) => request('/lab/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateLabOrderStatus: (id, data) => request(`/lab/orders/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  saveLabOrderResults: (id, data) => request(`/lab/orders/${id}/results`, { method: 'POST', body: JSON.stringify(data) }),
  verifyLabOrder: (id, data) => request(`/lab/orders/${id}/verify`, { method: 'POST', body: JSON.stringify(data) }),

  getLabDoctors: () => request('/lab/doctors'),
  createLabDoctor: (data) => request('/lab/doctors', { method: 'POST', body: JSON.stringify(data) }),
  recordLabDoctorPayout: (id, data) => request(`/lab/doctors/${id}/payout`, { method: 'POST', body: JSON.stringify(data) }),

  // Reports
  getDashboardReports: () => request('/reports/dashboard'),
  getDailyRegister: (date) => request(`/reports/daily-register${date ? `?date=${date}` : ''}`),
  getExpiryReport: (filter) => request(`/reports/expiry${filter ? `?filter=${filter}` : ''}`),
  getScheduleDrugs: () => request('/reports/schedule-drugs'),
  getGstReport: (from, to) => request(`/reports/gst?from_date=${from || ''}&to_date=${to || ''}`),

  // Import, Export & EXIM Shipments
  getImportTemplate: (entity) => request(`/import-export/templates/${entity}`),
  getTemplateDownloadUrl: (entity) => `/api/import-export/templates/${entity}?download=true`,
  importData: (entity, payload) => request(`/import-export/import/${entity}`, { method: 'POST', body: JSON.stringify(payload) }),
  getExportUrl: (entity, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return `/api/import-export/export/${entity}${query ? `?${query}` : ''}`;
  },
  exportDataJson: (entity, params = {}) => {
    const query = new URLSearchParams({ ...params, format: 'json' }).toString();
    return request(`/import-export/export/${entity}?${query}`);
  },
  getEximShipments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/import-export/shipments${query ? `?${query}` : ''}`);
  },
  createEximShipment: (data) => request('/import-export/shipments', { method: 'POST', body: JSON.stringify(data) }),
  updateEximShipment: (id, data) => request(`/import-export/shipments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEximShipment: (id) => request(`/import-export/shipments/${id}`, { method: 'DELETE' }),
  getImportExportJobs: () => request('/import-export/jobs'),
  getImportExportOverview: () => request('/import-export/overview'),

  // Trade Billing, Barcodes & E-Way Bills
  getTradeInvoices: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/import-export/invoices${query ? `?${query}` : ''}`);
  },
  createTradeInvoice: (data) => request('/import-export/invoices', { method: 'POST', body: JSON.stringify(data) }),
  getTradeEwayBills: () => request('/import-export/eway-bills'),
  createTradeEwayBill: (data) => request('/import-export/eway-bills', { method: 'POST', body: JSON.stringify(data) }),
  getTradeProfitAnalysis: () => request('/import-export/profit-analysis'),
  getTradeReceivables: () => request('/import-export/receivables'),
  getTradeGstSummary: () => request('/import-export/gst-summary'),
  getTradeBarcodeProducts: () => request('/import-export/barcode-products'),

  // DGFT Foreign Trade Schemes, Licenses & IEC
  getDgftLicenses: () => request('/import-export/licenses'),
  createDgftLicense: (data) => request('/import-export/licenses', { method: 'POST', body: JSON.stringify(data) }),
  updateDgftLicense: (id, data) => request(`/import-export/licenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDgftLicense: (id) => request(`/import-export/licenses/${id}`, { method: 'DELETE' }),
  getIecProfile: () => request('/import-export/iec-profile'),

  // Custom House Agent (CHA) & Customs Broker Desk
  getChaAgencies: () => request('/import-export/cha/agencies'),
  createChaAgency: (data) => request('/import-export/cha/agencies', { method: 'POST', body: JSON.stringify(data) }),
  getChaClearances: () => request('/import-export/cha/clearances'),
  createChaClearance: (data) => request('/import-export/cha/clearances', { method: 'POST', body: JSON.stringify(data) }),
  updateChaClearance: (id, data) => request(`/import-export/cha/clearances/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteChaClearance: (id) => request(`/import-export/cha/clearances/${id}`, { method: 'DELETE' }),

  // Bank Realisation (e-BRC & RBI EDPMS)
  getBankRealizations: () => request('/import-export/realizations'),
  createBankRealization: (data) => request('/import-export/realizations', { method: 'POST', body: JSON.stringify(data) }),

  // Customs Ports & ICDs Directory
  getCustomsPorts: (params = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.type) q.append('type', params.type);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request(`/import-export/ports${qs}`);
  },
  createCustomsPort: (data) => request('/import-export/ports', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomsPort: (id, data) => request(`/import-export/ports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  setDefaultCustomsPort: (id) => request(`/import-export/ports/${id}/default`, { method: 'PUT' }),
  deleteCustomsPort: (id) => request(`/import-export/ports/${id}`, { method: 'DELETE' }),

  // Settings & Backups (Tenant Scoped)
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'POST', body: JSON.stringify(data) }),
  seedDatabase: () => request('/settings/seed', { method: 'POST' }),
  getBackupUrl: () => '/api/settings/backup'
};
