const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'erp.sqlite');
const db = new DatabaseSync(dbPath);

// Initialize Complete Enterprise ERP Tables
function initDatabase() {
  db.exec(`
    PRAGMA foreign_keys = ON;

    -- 1. SaaS Tenants Table
    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      business_type TEXT NOT NULL,           -- 'pharma', 'kiryana', 'general'
      owner_name TEXT NOT NULL,
      owner_email TEXT NOT NULL,
      owner_phone TEXT,
      plan TEXT DEFAULT 'pro',               -- 'starter', 'pro', 'enterprise'
      plan_status TEXT DEFAULT 'active',     -- 'active', 'trial', 'past_due', 'suspended'
      monthly_fee REAL DEFAULT 999,
      store_address TEXT,
      gstin TEXT,
      dl_number TEXT,
      fssai_number TEXT,
      upi_id TEXT,
      currency_symbol TEXT DEFAULT '₹',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Users & Authentication
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'cashier',           -- 'super_admin', 'tenant_admin', 'manager', 'cashier', 'accountant'
      pin_code TEXT DEFAULT '1234',
      status TEXT DEFAULT 'active',
      failed_login_attempts INTEGER DEFAULT 0,
      locked_until TEXT DEFAULT NULL,
      last_login_at TEXT DEFAULT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- 3. Security Audit Trail Logs
    CREATE TABLE IF NOT EXISTS security_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER,
      user_id INTEGER,
      email TEXT,
      event_type TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Active Sessions
    CREATE TABLE IF NOT EXISTS active_sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      tenant_id INTEGER,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 5. Tenant Settings
    CREATE TABLE IF NOT EXISTS settings (
      tenant_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (tenant_id, key),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- 6. Products (Tenant Isolated)
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      barcode TEXT,
      category TEXT,
      brand TEXT,
      hsn_code TEXT,
      gst_rate REAL DEFAULT 0,
      salt_composition TEXT,
      schedule_type TEXT DEFAULT 'Regular',
      pack_unit TEXT DEFAULT 'Strip',
      sub_units_per_pack INTEGER DEFAULT 1,
      allow_loose_sale INTEGER DEFAULT 0,
      unit_type TEXT DEFAULT 'pcs',
      is_loose_item INTEGER DEFAULT 0,
      is_quick_pick INTEGER DEFAULT 0,
      min_stock_alert REAL DEFAULT 5,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- 7. Batches (Tenant & Product Isolated)
    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      batch_number TEXT NOT NULL,
      mfg_date TEXT,
      expiry_date TEXT NOT NULL,
      purchase_rate REAL NOT NULL,
      mrp REAL NOT NULL,
      selling_rate REAL NOT NULL,
      stock_units REAL NOT NULL DEFAULT 0,
      loose_stock_units REAL DEFAULT 0,
      supplier_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- 8. Customers & Khata & Loyalty
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      credit_limit REAL DEFAULT 5000,
      current_balance REAL DEFAULT 0,
      loyalty_points INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- 9. Suppliers
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      gstin TEXT,
      current_balance REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- 10. Sales Invoices
    CREATE TABLE IF NOT EXISTS sales_invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      invoice_number TEXT NOT NULL,
      customer_id INTEGER,
      customer_name TEXT,
      customer_phone TEXT,
      doctor_name TEXT,
      patient_name TEXT,
      total_items INTEGER DEFAULT 0,
      subtotal REAL NOT NULL,
      tax_amount REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      round_off REAL DEFAULT 0,
      grand_total REAL NOT NULL,
      payment_mode TEXT DEFAULT 'cash',
      cash_paid REAL DEFAULT 0,
      upi_paid REAL DEFAULT 0,
      khata_amount REAL DEFAULT 0,
      loyalty_points_earned INTEGER DEFAULT 0,
      loyalty_points_redeemed INTEGER DEFAULT 0,
      status TEXT DEFAULT 'completed',      -- 'completed', 'returned', 'cancelled'
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- 11. Sales Items
    CREATE TABLE IF NOT EXISTS sales_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      invoice_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      batch_id INTEGER,
      batch_number TEXT,
      expiry_date TEXT,
      quantity REAL NOT NULL,
      is_loose INTEGER DEFAULT 0,
      unit_price REAL NOT NULL,
      mrp REAL NOT NULL,
      gst_rate REAL DEFAULT 0,
      gst_amount REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total REAL NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id) ON DELETE CASCADE
    );

    -- 12. Customer Ledger (Udhar)
    CREATE TABLE IF NOT EXISTS customer_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      transaction_type TEXT NOT NULL,
      amount REAL NOT NULL,
      reference_id TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    -- 13. Purchases
    CREATE TABLE IF NOT EXISTS supplier_purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      purchase_number TEXT NOT NULL,
      supplier_id INTEGER,
      supplier_name TEXT,
      supplier_invoice_no TEXT,
      total_amount REAL NOT NULL,
      tax_amount REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'paid',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- 14. Held Bills
    CREATE TABLE IF NOT EXISTS held_bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      reference_name TEXT,
      cart_data TEXT NOT NULL,
      customer_data TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- Accounting & Expense Management
    CREATE TABLE IF NOT EXISTS chart_of_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      account_code TEXT NOT NULL,
      account_name TEXT NOT NULL,
      account_type TEXT NOT NULL,            -- 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'
      balance REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      category TEXT NOT NULL,                -- 'Rent', 'Electricity', 'Salaries', 'Delivery', 'Packaging', 'Repair', 'Miscellaneous'
      amount REAL NOT NULL,
      payment_mode TEXT DEFAULT 'cash',      -- 'cash', 'bank', 'upi'
      reference_no TEXT,
      paid_to TEXT,
      notes TEXT,
      expense_date TEXT DEFAULT CURRENT_DATE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- HRM & Payroll Management
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      designation TEXT NOT NULL,            -- 'Senior Pharmacist', 'Counter Cashier', 'Stock Helper', 'Store Manager', 'Delivery Agent'
      salary_type TEXT DEFAULT 'monthly',    -- 'monthly', 'daily'
      base_salary REAL NOT NULL,
      joining_date TEXT DEFAULT CURRENT_DATE,
      status TEXT DEFAULT 'active',          -- 'active', 'on_leave', 'terminated'
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS employee_attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      employee_id INTEGER NOT NULL,
      date TEXT NOT NULL,                    -- YYYY-MM-DD
      status TEXT NOT NULL,                  -- 'PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'
      check_in_time TEXT,
      check_out_time TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      UNIQUE(tenant_id, employee_id, date)
    );

    CREATE TABLE IF NOT EXISTS payroll_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      employee_id INTEGER NOT NULL,
      month_year TEXT NOT NULL,              -- e.g. '2026-10'
      basic_salary REAL NOT NULL,
      allowance REAL DEFAULT 0,
      deductions REAL DEFAULT 0,
      net_salary REAL NOT NULL,
      payment_status TEXT DEFAULT 'paid',    -- 'paid', 'pending'
      payment_date TEXT,
      payment_mode TEXT DEFAULT 'bank',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    -- Returns, Credit Notes & Debit Notes
    CREATE TABLE IF NOT EXISTS sales_returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      return_number TEXT UNIQUE NOT NULL,    -- 'RET-YYYYMMDD-0001'
      invoice_id INTEGER,
      invoice_number TEXT,
      customer_id INTEGER,
      customer_name TEXT,
      total_refund_amount REAL NOT NULL,
      refund_mode TEXT DEFAULT 'cash',       -- 'cash', 'khata', 'credit_note'
      reason TEXT,                           -- 'Defective', 'Expired', 'Customer Changed Mind', 'Wrong Medicine'
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sales_return_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      return_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      batch_id INTEGER,
      batch_number TEXT,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      refund_total REAL NOT NULL,
      restock_item INTEGER DEFAULT 1,        -- 1 to put back in stock, 0 if damaged/discarded
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (return_id) REFERENCES sales_returns(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS supplier_returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      debit_note_no TEXT UNIQUE NOT NULL,    -- 'DN-YYYYMMDD-0001'
      supplier_id INTEGER NOT NULL,
      supplier_name TEXT NOT NULL,
      total_amount REAL NOT NULL,
      reason TEXT,                           -- 'Near Expiry Returned', 'Damaged Pack', 'Rate Difference'
      status TEXT DEFAULT 'issued',          -- 'issued', 'settled'
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
    );

    -- Stock Auditing & Adjustments
    CREATE TABLE IF NOT EXISTS stock_adjustments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      adjustment_number TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      batch_id INTEGER,
      batch_number TEXT,
      adjustment_type TEXT NOT NULL,         -- 'DAMAGE_WRITEOFF', 'EXPIRED_QUARANTINE', 'PHYSICAL_AUDIT_SURPLUS', 'PHYSICAL_AUDIT_DEFICIT'
      quantity REAL NOT NULL,                -- quantity adjusted
      loss_value REAL DEFAULT 0,             -- cost price * quantity
      reason TEXT NOT NULL,
      audited_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- Promotions & Discount Campaigns
    CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      code TEXT NOT NULL,                    -- e.g. 'FESTIVE10', 'DIWALI50', 'HEALTH20'
      title TEXT NOT NULL,
      discount_type TEXT NOT NULL,           -- 'PERCENTAGE', 'FLAT'
      discount_value REAL NOT NULL,
      min_order_amount REAL DEFAULT 0,
      max_discount REAL DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      usage_limit INTEGER DEFAULT 100,
      times_used INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- Laboratory Diagnostics MIS
    CREATE TABLE IF NOT EXISTS lab_tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      test_code TEXT NOT NULL,
      test_name TEXT NOT NULL,
      department TEXT NOT NULL,              -- 'Hematology', 'Biochemistry', 'Serology', 'Microbiology', 'Clinical Pathology', 'Radiology'
      sample_type TEXT NOT NULL,             -- 'EDTA Whole Blood', 'Serum', 'Fluoride Plasma', 'Spot Urine', etc.
      tube_color TEXT DEFAULT 'Purple',      -- 'Purple (EDTA)', 'Red (Plain)', 'Grey (Fluoride)', 'Yellow (SST)'
      tat_hours INTEGER DEFAULT 4,
      price REAL NOT NULL,                   -- B2C MRP
      cost REAL DEFAULT 0,                   -- Reagent / consumable cost
      doctor_commission_percent REAL DEFAULT 15,
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- 2. Test Parameters (with reference intervals)
    CREATE TABLE IF NOT EXISTS lab_test_parameters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      test_id INTEGER NOT NULL,
      parameter_name TEXT NOT NULL,
      unit TEXT,
      reference_range_min REAL,
      reference_range_max REAL,
      reference_range_text TEXT,
      critical_low REAL,
      critical_high REAL,
      method TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (test_id) REFERENCES lab_tests(id) ON DELETE CASCADE
    );

    -- 3. Lab Packages / Health Checkup Profiles
    CREATE TABLE IF NOT EXISTS lab_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      package_code TEXT NOT NULL,
      package_name TEXT NOT NULL,
      description TEXT,
      tests_included TEXT NOT NULL,          -- JSON array of test IDs or codes
      package_price REAL NOT NULL,
      original_price REAL NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- 4. Referring Doctors & Referral Commissions
    CREATE TABLE IF NOT EXISTS lab_referral_doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      doctor_name TEXT NOT NULL,
      clinic_hospital TEXT,
      phone TEXT,
      commission_percent REAL DEFAULT 15,
      total_referred_orders INTEGER DEFAULT 0,
      total_commission_earned REAL DEFAULT 0,
      total_commission_paid REAL DEFAULT 0,
      balance_payable REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- 5. Lab Orders / Patient Requisitions
    CREATE TABLE IF NOT EXISTS lab_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      order_no TEXT UNIQUE NOT NULL,         -- e.g. 'LAB-202610-001'
      barcode TEXT NOT NULL,                 -- e.g. 'SMP-98241'
      patient_name TEXT NOT NULL,
      patient_age INTEGER,
      patient_gender TEXT,                  -- 'Male', 'Female', 'Other'
      patient_phone TEXT,
      patient_email TEXT,
      patient_address TEXT,
      referring_doctor TEXT,
      referring_doctor_commission REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      discount REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      net_amount REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      balance_due REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'paid',    -- 'paid', 'partial', 'pending'
      payment_mode TEXT DEFAULT 'cash',      -- 'cash', 'upi', 'card', 'udhar'
      order_status TEXT DEFAULT 'registered',-- 'registered', 'sample_collected', 'processing', 'completed', 'verified', 'delivered'
      sample_status TEXT DEFAULT 'collected',-- 'pending', 'collected', 'in_transit', 'rejected'
      phlebotomist TEXT,
      collected_at TEXT,
      reported_at TEXT,
      verified_by TEXT,
      clinical_notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- 6. Lab Order Items (Tests / Packages in Order)
    CREATE TABLE IF NOT EXISTS lab_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      order_id INTEGER NOT NULL,
      test_id INTEGER,
      package_id INTEGER,
      item_type TEXT NOT NULL,               -- 'test', 'package'
      item_name TEXT NOT NULL,
      department TEXT,
      price REAL NOT NULL,
      status TEXT DEFAULT 'pending',         -- 'pending', 'processing', 'completed'
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id) REFERENCES lab_orders(id) ON DELETE CASCADE
    );

    -- 7. Lab Order Parameter Observations / Results
    CREATE TABLE IF NOT EXISTS lab_order_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      order_id INTEGER NOT NULL,
      test_id INTEGER NOT NULL,
      parameter_id INTEGER NOT NULL,
      parameter_name TEXT NOT NULL,
      result_value TEXT NOT NULL,
      unit TEXT,
      reference_range_text TEXT,
      flag TEXT DEFAULT 'normal',            -- 'normal', 'low', 'high', 'critical'
      remarks TEXT,
      entered_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id) REFERENCES lab_orders(id) ON DELETE CASCADE
    );

    -- SaaS Subscription Plans & Pricing
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      business_type TEXT DEFAULT 'all',      -- 'all', 'pharma', 'kiryana'
      monthly_rate REAL NOT NULL,
      annual_rate REAL NOT NULL,
      discount_percent REAL DEFAULT 15,
      max_products INTEGER DEFAULT 1000,     -- -1 for unlimited
      max_orders_per_month INTEGER DEFAULT 2000, -- -1 for unlimited
      max_staff INTEGER DEFAULT 3,
      features TEXT NOT NULL,                -- JSON array of feature strings
      is_popular INTEGER DEFAULT 0,          -- 1 if highlighted as most popular
      status TEXT DEFAULT 'active',          -- 'active', 'inactive'
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- SaaS Tenant Subscription Invoices
    CREATE TABLE IF NOT EXISTS saas_subscription_invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      invoice_no TEXT UNIQUE NOT NULL,
      plan_code TEXT NOT NULL,
      plan_name TEXT NOT NULL,
      billing_cycle TEXT DEFAULT 'monthly',  -- 'monthly', 'annual'
      amount REAL NOT NULL,
      tax_amount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      payment_status TEXT DEFAULT 'paid',    -- 'paid', 'pending', 'waived'
      payment_method TEXT DEFAULT 'upi',     -- 'upi', 'bank_transfer', 'card', 'cash'
      reference_no TEXT,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- Import/Export Data Migration & EXIM Trade
    CREATE TABLE IF NOT EXISTS import_export_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      job_type TEXT NOT NULL,                -- 'import', 'export'
      entity_type TEXT NOT NULL,             -- 'products', 'customers', 'suppliers', 'sales', 'lab_tests', 'expenses', 'exim_shipments'
      file_format TEXT NOT NULL,             -- 'csv', 'json'
      file_name TEXT,
      total_records INTEGER DEFAULT 0,
      successful_records INTEGER DEFAULT 0,
      failed_records INTEGER DEFAULT 0,
      status TEXT DEFAULT 'completed',       -- 'completed', 'partial', 'failed'
      error_summary TEXT,                    -- JSON or text
      executed_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exim_shipments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      shipment_number TEXT UNIQUE NOT NULL,  -- e.g. 'IMP-2026-0042', 'EXP-2026-0081'
      trade_type TEXT NOT NULL,              -- 'IMPORT', 'EXPORT'
      partner_name TEXT NOT NULL,            -- e.g. 'Merck KGaA Life Science', 'Pfizer Global Supply'
      partner_country TEXT NOT NULL,         -- e.g. 'Germany', 'USA', 'United Arab Emirates', 'Japan'
      iec_code TEXT,                         -- Importer Exporter Code
      incoterm TEXT DEFAULT 'CIF',           -- 'CIF', 'FOB', 'EXW', 'CFR', 'DDP', 'CIP'
      invoice_number TEXT,
      invoice_value REAL NOT NULL,
      currency TEXT DEFAULT 'USD',           -- 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'INR'
      exchange_rate REAL DEFAULT 84.50,
      total_inr_value REAL NOT NULL,
      port_of_loading TEXT,                  -- 'Hamburg Port', 'Nhava Sheva (JNPT)', 'Jebel Ali'
      port_of_discharge TEXT,                -- 'Nhava Sheva (JNPT)', 'Mundra Port', 'Dubai Port'
      bill_of_lading_no TEXT,                -- BL / Air Waybill
      container_no TEXT,
      carrier_name TEXT,                     -- 'Maersk Line', 'MSC Mediterranean', 'Hapag-Lloyd'
      customs_entry_bill_no TEXT,            -- Bill of Entry (Imports) or Shipping Bill (Exports)
      customs_duty_amount REAL DEFAULT 0,
      hs_tariff_code TEXT,                   -- HSN / ITC-HS tariff (e.g. '3004.90.99', '2933.29.90')
      status TEXT DEFAULT 'in_transit',      -- 'draft', 'in_transit', 'customs_hold', 'customs_cleared', 'delivered', 'archived'
      eta_date TEXT,
      cleared_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- ========================================================
    -- E-WAY BILLS & PORT LOGISTICS COMPLIANCE
    -- ========================================================
    CREATE TABLE IF NOT EXISTS eway_bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      bill_type TEXT NOT NULL,               -- 'outward', 'inward', 'export', 'import'
      document_type TEXT DEFAULT 'INV',      -- 'INV', 'CHL', 'BOE'
      document_no TEXT NOT NULL,
      document_date TEXT NOT NULL,
      eway_bill_no TEXT UNIQUE NOT NULL,     -- 12-digit e.g. '241098451290'
      eway_bill_date TEXT NOT NULL,
      valid_until TEXT NOT NULL,
      from_place TEXT NOT NULL,
      from_pincode TEXT,
      to_place TEXT NOT NULL,
      to_pincode TEXT,
      transporter_name TEXT,
      transporter_id TEXT,
      vehicle_no TEXT,
      distance_km INTEGER DEFAULT 50,
      taxable_value REAL NOT NULL,
      cgst_amount REAL DEFAULT 0,
      sgst_amount REAL DEFAULT 0,
      igst_amount REAL DEFAULT 0,
      total_value REAL NOT NULL,
      status TEXT DEFAULT 'active',          -- 'active', 'cancelled', 'expired'
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- ========================================================
    -- DGFT LICENSES, SCHEMES & EXIM COMPLIANCE
    -- ========================================================
    CREATE TABLE IF NOT EXISTS exim_licenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      license_type TEXT NOT NULL,            -- 'IEC', 'ADVANCE_AUTHORISATION', 'EPCG', 'RODTEP', 'DUTY_DRAWBACK', 'RCMC', 'LUT_GST', 'AEO', 'SCOMET'
      license_number TEXT NOT NULL,
      issuing_authority TEXT DEFAULT 'DGFT', -- 'DGFT', 'CBIC_CUSTOMS', 'GSTN', 'EPC'
      issue_date TEXT NOT NULL,
      expiry_date TEXT,
      cif_value REAL DEFAULT 0,
      fob_obligation_value REAL DEFAULT 0,
      obligation_fulfilled_value REAL DEFAULT 0,
      status TEXT DEFAULT 'active',          -- 'active', 'utilized', 'expired', 'surrendered', 'under_scrutiny'
      scrip_balance REAL DEFAULT 0,
      epc_name TEXT,
      dgft_file_number TEXT,
      eodc_status TEXT DEFAULT 'pending',    -- 'pending', 'applied', 'discharged'
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- ========================================================
    -- CHA (CUSTOM HOUSE AGENT) & CUSTOMS BROKER DIRECTORY
    -- ========================================================
    CREATE TABLE IF NOT EXISTS cha_agencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      agency_name TEXT NOT NULL,
      cha_license_no TEXT NOT NULL,          -- e.g. '11/0458/JNPT' or PAN-based
      contact_person TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      ports_handled TEXT,                    -- e.g. 'Nhava Sheva (INNSA), Mundra (INMUN)'
      icegate_id TEXT,
      pan_number TEXT,
      gstin TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- ========================================================
    -- CHA CUSTOMS CLEARANCES (BILL OF ENTRY & SHIPPING BILL)
    -- ========================================================
    CREATE TABLE IF NOT EXISTS cha_clearances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      shipment_id INTEGER,
      cha_agency_id INTEGER,
      clearance_type TEXT NOT NULL,          -- 'IMPORT_BOE', 'EXPORT_SB'
      doc_number TEXT NOT NULL,              -- Bill of Entry No or Shipping Bill No
      doc_date TEXT NOT NULL,
      port_code TEXT NOT NULL,               -- 'INNSA1', 'INDEL4', 'INMUN1'
      customs_house TEXT DEFAULT 'Nhava Sheva Customs',
      icegate_job_no TEXT,
      assessment_status TEXT DEFAULT 'pending', -- 'draft', 'filed', 'query_raised', 'assessed', 'duty_paid', 'under_examination', 'ooc_given', 'leo_given', 'cleared'
      bcd_amount REAL DEFAULT 0,
      sws_amount REAL DEFAULT 0,
      igst_amount REAL DEFAULT 0,
      aidc_amount REAL DEFAULT 0,
      total_customs_duty REAL DEFAULT 0,
      duty_payment_status TEXT DEFAULT 'unpaid', -- 'unpaid', 'challan_generated', 'paid'
      icegate_challan_no TEXT,
      cfs_name TEXT,                         -- Container Freight Station
      gate_in_date TEXT,
      gate_out_date TEXT,
      examination_order TEXT,
      ooc_number TEXT,                       -- Out of Charge No
      leo_number TEXT,                       -- Let Export Order No
      ooc_leo_date TEXT,
      delivery_order_status TEXT DEFAULT 'pending', -- 'pending', 'do_received', 'cargo_dispatched'
      remarks TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (shipment_id) REFERENCES exim_shipments(id) ON DELETE SET NULL,
      FOREIGN KEY (cha_agency_id) REFERENCES cha_agencies(id) ON DELETE SET NULL
    );

    -- ========================================================
    -- BANK REALISATION CERTIFICATE (e-BRC & RBI EDPMS/IDPMS)
    -- ========================================================
    CREATE TABLE IF NOT EXISTS exim_bank_realizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      shipping_bill_no TEXT NOT NULL,
      invoice_number TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      authorized_dealer_code TEXT,           -- AD Code
      firc_number TEXT,                      -- Foreign Inward Remittance Certificate
      ebrc_number TEXT,                      -- Electronic Bank Realisation Certificate
      realized_amount_fcy REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      realized_amount_inr REAL NOT NULL,
      realization_date TEXT NOT NULL,
      edpms_status TEXT DEFAULT 'closed',    -- 'open', 'closed', 'extension_sought'
      idpms_status TEXT DEFAULT 'not_applicable',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- ========================================================
    -- CUSTOMS PORTS & INLAND CONTAINER DEPOTS (ICDs)
    -- ========================================================
    CREATE TABLE IF NOT EXISTS customs_ports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      port_code TEXT NOT NULL,               -- e.g. 'INNSA1', 'INMUN1', 'INDEL4', 'INTKD6'
      port_name TEXT NOT NULL,               -- e.g. 'Nhava Sheva (JNPT) Sea Port'
      port_type TEXT NOT NULL,               -- 'SEA', 'AIR', 'ICD', 'LCS', 'SEZ'
      customs_zone TEXT,                     -- e.g. 'Mumbai Customs Zone II', 'Delhi Customs Zone'
      custodian TEXT,                        -- e.g. 'JNPT / DP World / PSA', 'CONCOR'
      icegate_enabled INTEGER DEFAULT 1,     -- 1 or 0
      cfs_names TEXT,                        -- Major Container Freight Stations
      edi_version TEXT DEFAULT 'ICEGATE 2.0',
      contact_phone TEXT,
      contact_email TEXT,
      is_default INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',          -- 'active', 'inactive'
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- ========================================================
    -- TRUE LANDED COST ENGINE (FINANCE & BILLING)
    -- ========================================================
    CREATE TABLE IF NOT EXISTS exim_landed_costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      shipment_id INTEGER,
      shipment_number TEXT NOT NULL,
      invoice_number TEXT NOT NULL,
      currency TEXT DEFAULT 'USD',
      exchange_rate_booking REAL NOT NULL DEFAULT 84.50,
      exchange_rate_customs REAL NOT NULL DEFAULT 84.80,
      fob_cif_value_fcy REAL NOT NULL,
      fob_cif_value_inr REAL NOT NULL,
      ocean_air_freight_inr REAL DEFAULT 0,
      marine_insurance_inr REAL DEFAULT 0,
      terminal_handling_inr REAL DEFAULT 0,  -- THC / CFS
      basic_customs_duty_inr REAL DEFAULT 0, -- BCD
      sws_surcharge_inr REAL DEFAULT 0,      -- SWS (10% of BCD)
      igst_tax_inr REAL DEFAULT 0,           -- IGST
      inland_transport_inr REAL DEFAULT 0,
      other_clearance_inr REAL DEFAULT 0,
      total_landed_cost_inr REAL NOT NULL,
      total_quantity REAL DEFAULT 1,
      landed_cost_per_unit REAL NOT NULL,
      selling_rate_unit REAL DEFAULT 0,
      gross_profit_spread REAL DEFAULT 0,
      allocation_method TEXT DEFAULT 'value_pct', -- 'value_pct', 'weight_kg', 'quantity'
      status TEXT DEFAULT 'finalized',       -- 'estimated', 'finalized', 'audited'
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (shipment_id) REFERENCES exim_shipments(id) ON DELETE SET NULL
    );

    -- ========================================================
    -- FOREX LOSS/GAIN BOOKING LEDGER (FINANCE)
    -- ========================================================
    CREATE TABLE IF NOT EXISTS exim_fx_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      shipment_number TEXT NOT NULL,
      invoice_number TEXT NOT NULL,
      currency TEXT DEFAULT 'USD',
      fcy_amount REAL NOT NULL,
      booking_date TEXT NOT NULL,
      booking_rate REAL NOT NULL,
      booking_inr REAL NOT NULL,
      settlement_date TEXT NOT NULL,
      settlement_rate REAL NOT NULL,
      settlement_inr REAL NOT NULL,
      fx_gain_loss_inr REAL NOT NULL,        -- Positive = Gain, Negative = Loss
      booking_type TEXT DEFAULT 'REALIZED',  -- 'UNREALIZED_MTM', 'REALIZED'
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- ========================================================
    -- CONTAINER MILESTONE MATRIX & DEMURRAGE TRACKER (TRACKING & WMS)
    -- ========================================================
    CREATE TABLE IF NOT EXISTS exim_containers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      container_number TEXT NOT NULL,        -- e.g. 'MSKU-908123-4'
      container_size_type TEXT DEFAULT '40HC', -- '20GP', '40GP', '40HC', '40RF'
      shipment_id INTEGER,
      shipment_number TEXT,
      carrier_line TEXT NOT NULL,            -- 'Maersk Line', 'MSC', 'Hapag-Lloyd', 'CMA CGM'
      vessel_name TEXT,
      voyage_no TEXT,
      current_milestone TEXT DEFAULT 'port_arrived', -- 'booking_confirmed', 'gate_in_origin', 'vessel_departed', 'port_arrived', 'customs_hold', 'cfs_destuffed', 'delivered'
      origin_port TEXT,
      discharge_port TEXT,
      current_location TEXT,
      gate_in_origin_date TEXT,
      sailing_date TEXT,
      discharge_date TEXT,                   -- Port arrival / vessel discharge
      ooc_date TEXT,                         -- Out of Charge
      delivered_date TEXT,
      shipping_line_free_days INTEGER DEFAULT 14,
      cfs_free_days INTEGER DEFAULT 3,
      daily_demurrage_rate_usd REAL DEFAULT 65.00,
      daily_demurrage_rate_inr REAL DEFAULT 5500.00,
      accrued_demurrage_usd REAL DEFAULT 0,
      accrued_demurrage_inr REAL DEFAULT 0,
      demurrage_status TEXT DEFAULT 'safe',  -- 'safe', 'approaching_expiry', 'overdue_penalty'
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (shipment_id) REFERENCES exim_shipments(id) ON DELETE SET NULL
    );

    -- ========================================================
    -- PRE-FILING CHECKLIST VERIFICATION (CUSTOMS & COMPLIANCE)
    -- ========================================================
    CREATE TABLE IF NOT EXISTS exim_checklists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      shipment_id INTEGER,
      shipment_number TEXT NOT NULL,
      clearance_type TEXT NOT NULL,          -- 'IMPORT_BOE', 'EXPORT_SB'
      document_ref_no TEXT NOT NULL,         -- Draft BoE / Shipping Bill No
      cha_agency_name TEXT,
      cha_verifier_name TEXT,
      iec_ad_code_verified INTEGER DEFAULT 1,
      hsn_classification_verified INTEGER DEFAULT 1,
      invoice_packing_list_match INTEGER DEFAULT 1,
      origin_cert_verified INTEGER DEFAULT 1,
      fssai_adc_noc_verified INTEGER DEFAULT 1,
      customs_duty_assessed_verified INTEGER DEFAULT 1,
      status TEXT DEFAULT 'verified_by_cha', -- 'draft', 'pending_cha_review', 'verified_by_cha', 'approved_for_filing', 'icegate_filed'
      verified_at TEXT,
      remarks TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (shipment_id) REFERENCES exim_shipments(id) ON DELETE SET NULL
    );

    -- ========================================================
    -- SECURE DOCUMENT MANAGEMENT SYSTEM (DMS)
    -- ========================================================
    CREATE TABLE IF NOT EXISTS exim_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      shipment_number TEXT NOT NULL,
      doc_category TEXT NOT NULL,            -- 'bill_of_lading', 'shipping_bill', 'bill_of_entry', 'commercial_invoice', 'packing_list', 'origin_cert', 'fssai_cert', 'insurance_policy'
      doc_title TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size_kb INTEGER DEFAULT 120,
      uploaded_by_name TEXT NOT NULL,
      uploaded_by_role TEXT NOT NULL,        -- 'cha_agent', 'accountant', 'logistics', 'super_admin'
      verification_status TEXT DEFAULT 'verified', -- 'pending', 'verified', 'flagged'
      verified_by TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );
  `);

  ensureTenantColumns();
  seedSubscriptionPlans();
  seedSubscriptionInvoices();
  seedLabData();
  seedImportExportData();
}

function ensureTenantColumns() {
  try {
    const cols = db.prepare('PRAGMA table_info(tenants)').all().map(c => c.name);
    if (!cols.includes('billing_cycle')) {
      db.exec("ALTER TABLE tenants ADD COLUMN billing_cycle TEXT DEFAULT 'monthly'");
    }
    if (!cols.includes('custom_monthly_fee')) {
      db.exec("ALTER TABLE tenants ADD COLUMN custom_monthly_fee REAL DEFAULT NULL");
    }
    if (!cols.includes('subscription_renews_at')) {
      db.exec("ALTER TABLE tenants ADD COLUMN subscription_renews_at TEXT DEFAULT NULL");
    }
    if (!cols.includes('admin_notes')) {
      db.exec("ALTER TABLE tenants ADD COLUMN admin_notes TEXT DEFAULT NULL");
    }
  } catch (err) {
    console.error('Migration error in tenants columns:', err);
  }
}

function seedSubscriptionPlans() {
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM subscription_plans').get().count;
    if (count === 0) {
      const insert = db.prepare(`
        INSERT INTO subscription_plans (
          name, code, description, business_type, monthly_rate, annual_rate, discount_percent,
          max_products, max_orders_per_month, max_staff, features, is_popular, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `);

      insert.run(
        'Starter Retail',
        'starter',
        'Single-counter POS with basic stock management and customer Udhar ledger',
        'all',
        499,
        4999,
        16.5,
        500,
        1000,
        2,
        JSON.stringify([
          'Fast POS Counter Billing',
          'Single-Batch Stock & Inventory',
          'Customer Khata (Udhar) Ledger',
          'Receipt Printing (Thermal 80/58mm & A4)',
          'Daily Shift Cash Closing Report',
          '1 Cashier Terminal'
        ]),
        0
      );

      insert.run(
        'Professional Store',
        'pro',
        'Full-featured operations suite for growing retail & Kiryana stores with barcode printing and P&L',
        'all',
        999,
        9999,
        16.6,
        3000,
        5000,
        5,
        JSON.stringify([
          'Everything in Starter Plan',
          'Multi-Batch Stock & Expiry Tracking',
          'Khata WhatsApp Balance Reminders',
          'Double-Entry P&L Accounting & Expenses',
          'Barcode Label Printing Studio (24-up)',
          'Supplier Inward & Debit Notes',
          'Customer Sales Returns (RMA) with Restock',
          'GSTR-1 Tax Liability Reports'
        ]),
        1
      );

      insert.run(
        'Pharma Specialist Pro',
        'pharma_pro',
        'High-compliance pharmacy ERP tailored for Chemists with FEFO, Schedule H, and Salt substitution',
        'pharma',
        1299,
        12999,
        16.6,
        5000,
        10000,
        8,
        JSON.stringify([
          'FEFO Automated First-Expiry Picking',
          'Schedule H & H1 Narcotic Drug Register',
          'Salt / Active Molecule Composition Lookup',
          'Drug License Expiry & Quarantine Vault',
          'Prescription Doctor & Patient Tracking',
          'Fast Strip & Loose Tablet Conversion',
          'Near-Expiry Return Claims to Distributors',
          'Expiry Loss P&L Auto-Sync'
        ]),
        0
      );

      insert.run(
        'Enterprise Unlimited',
        'enterprise',
        'Unrestricted multi-counter ERP with full HRM, Biometric Attendance, Payroll and Customer Loyalty',
        'all',
        1999,
        19999,
        16.6,
        -1,
        -1,
        -1,
        JSON.stringify([
          'Unlimited Products & Billed Orders',
          'All 12 ERP Modules Included',
          'HRM Staff Directory & Wage Contracts',
          'Daily Shift Attendance Register',
          'Monthly Payroll Generation & Disbursals',
          'Customer Loyalty Cashback & Reward Points',
          'Promotional Coupon Campaign Engine',
          'Physical Cycle Stock Count Reconciliation',
          'Automated SQLite Cloud Database Backups',
          'Dedicated Priority SLA & Support'
        ]),
        0
      );
    }

    // Ensure Pharma Pro and Enterprise plans have Lab MIS features included
    const pharmaPlan = db.prepare("SELECT id, features FROM subscription_plans WHERE code = 'pharma_pro'").get();
    if (pharmaPlan) {
      let feats = JSON.parse(pharmaPlan.features || '[]');
      if (!feats.some(f => f.includes('Lab') || f.includes('Diagnostic'))) {
        feats.push('Clinical Laboratory & Pathology MIS (F8)');
        feats.push('NABL-Grade Diagnostic Reports & Pathologist Verification');
        feats.push('Doctor Commission Ledger & Payout Tracking');
        db.prepare('UPDATE subscription_plans SET features = ? WHERE id = ?').run(JSON.stringify(feats), pharmaPlan.id);
      }
    }
    const entPlan = db.prepare("SELECT id, features FROM subscription_plans WHERE code = 'enterprise'").get();
    if (entPlan) {
      let feats = JSON.parse(entPlan.features || '[]');
      if (!feats.some(f => f.includes('Lab') || f.includes('Diagnostic'))) {
        feats.push('Clinical Laboratory & Pathology MIS (F8)');
        feats.push('Diagnostic Health Packages & Profiles');
        db.prepare('UPDATE subscription_plans SET features = ? WHERE id = ?').run(JSON.stringify(feats), entPlan.id);
      }
    }
  } catch (err) {
    console.error('Error seeding subscription plans:', err);
  }
}

function seedSubscriptionInvoices() {
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM saas_subscription_invoices').get().count;
    if (count === 0) {
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);

      const existingTenants = db.prepare('SELECT id, name, plan, monthly_fee FROM tenants').all();
      if (!existingTenants.length) return;

      db.prepare(`
        UPDATE tenants SET
          subscription_renews_at = ?,
          billing_cycle = 'monthly'
      `).run(nextMonth);

      const insertInv = db.prepare(`
        INSERT INTO saas_subscription_invoices (
          tenant_id, invoice_no, plan_code, plan_name, billing_cycle,
          amount, tax_amount, total_amount, payment_status, payment_method,
          period_start, period_end
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paid', 'upi', ?, ?)
      `);

      for (let i = 0; i < existingTenants.length; i++) {
        const t = existingTenants[i];
        const fee = Number(t.monthly_fee) || 999;
        const tax = Number((fee * 0.18).toFixed(2));
        insertInv.run(
          t.id,
          `SUB-202610-00${i + 1}`,
          t.plan || 'pro',
          t.plan === 'pharma_pro' ? 'Pharma Specialist Pro' : 'Professional Store',
          'monthly',
          fee,
          tax,
          fee + tax,
          today,
          nextMonth
        );
      }
    }
  } catch (err) {
    console.error('Error seeding subscription invoices:', err);
  }
}

function seedLabData() {
  try {
    const existingTenants = db.prepare("SELECT id, name FROM tenants WHERE business_type IN ('lmis', 'lab')").all();
    if (!existingTenants.length) return;

    for (const tenant of existingTenants) {
      seedTenantLabData(tenant.id, true);
    }
  } catch (err) {
    console.error('Error seeding lab data:', err);
  }
}

function seedTenantLabData(tenantId, seedSampleOrders = true) {
  try {
    const testCount = db.prepare('SELECT COUNT(*) as c FROM lab_tests WHERE tenant_id = ?').get(tenantId).c;
    if (testCount > 0) return;

    // 1. Seed Referral Doctors
    const insertDoc = db.prepare(`
      INSERT INTO lab_referral_doctors (tenant_id, doctor_name, clinic_hospital, phone, commission_percent, total_referred_orders, total_commission_earned, balance_payable)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
      insertDoc.run(tenantId, 'Dr. Sanjay Verma, MD (Internal Med)', 'Verma Polyclinic & Diabetes Care', '+91 98111 22334', 15.0, 3, 580.0, 320.0);
      insertDoc.run(tenantId, 'Dr. Priya Sharma, MBBS, DGO', 'Sharma Mother & Child Clinic', '+91 98222 33445', 15.0, 2, 340.0, 340.0);
      insertDoc.run(tenantId, 'Dr. Rajesh K. Gupta, MS (Ortho)', 'Gupta Bone & Joint Clinic', '+91 98333 44556', 20.0, 1, 150.0, 0.0);
      insertDoc.run(tenantId, 'Self / Direct Walk-in Patient', 'Direct Registration Counter', '+91 00000 00000', 0.0, 2, 0.0, 0.0);

      // 2. Seed Lab Tests with Clinical Parameters
      const insertTest = db.prepare(`
        INSERT INTO lab_tests (tenant_id, test_code, test_name, department, sample_type, tube_color, tat_hours, price, cost, doctor_commission_percent, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertParam = db.prepare(`
        INSERT INTO lab_test_parameters (tenant_id, test_id, parameter_name, unit, reference_range_min, reference_range_max, reference_range_text, critical_low, critical_high, method, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // Test 1: CBC with ESR
      const t1 = insertTest.run(tenantId, 'CBC', 'Complete Blood Count (CBC) with ESR', 'Hematology', 'EDTA Whole Blood', 'Purple (EDTA)', 3, 350, 70, 15, 'Automated 5-Part Cell Counter + Westergren ESR').lastInsertRowid;
      insertParam.run(tenantId, t1, 'Hemoglobin (Hb)', 'g/dL', 13.0, 17.0, '13.0 - 17.0 g/dL', 7.0, 20.0, 'Photometric SLS', 1);
      insertParam.run(tenantId, t1, 'Total Leucocyte Count (TLC/WBC)', 'cells/cu.mm', 4000, 11000, '4,000 - 11,000 cells/cu.mm', 2000, 30000, 'Impedance Cell Counter', 2);
      insertParam.run(tenantId, t1, 'Platelet Count', 'lakhs/cu.mm', 1.5, 4.5, '1.5 - 4.5 lakhs/cu.mm', 0.5, 10.0, 'Electrical Impedance', 3);
      insertParam.run(tenantId, t1, 'RBC Count', 'mill/cu.mm', 4.5, 5.9, '4.5 - 5.9 mill/cu.mm', 2.5, 7.0, 'Impedance', 4);
      insertParam.run(tenantId, t1, 'Packed Cell Volume (PCV/HCT)', '%', 40.0, 50.0, '40.0 - 50.0 %', 20.0, 60.0, 'Calculated', 5);
      insertParam.run(tenantId, t1, 'Neutrophils', '%', 40, 70, '40 - 70 %', null, null, 'Flow Cytometry', 6);
      insertParam.run(tenantId, t1, 'Lymphocytes', '%', 20, 45, '20 - 45 %', null, null, 'Flow Cytometry', 7);
      insertParam.run(tenantId, t1, 'Eosinophils', '%', 1, 6, '1 - 6 %', null, null, 'Flow Cytometry', 8);
      insertParam.run(tenantId, t1, 'Monocytes', '%', 2, 8, '2 - 8 %', null, null, 'Flow Cytometry', 9);
      insertParam.run(tenantId, t1, 'ESR (1st Hour)', 'mm/1st hr', 0, 15, '0 - 15 mm/1st hr', null, null, 'Modified Westergren', 10);

      // Test 2: Lipid Profile
      const t2 = insertTest.run(tenantId, 'LIPID', 'Lipid Profile Comprehensive Panel', 'Biochemistry', 'Serum', 'Yellow (SST)', 4, 650, 120, 15, 'Complete cardiovascular lipid risk stratification').lastInsertRowid;
      insertParam.run(tenantId, t2, 'Total Cholesterol', 'mg/dL', 0, 200, '< 200 mg/dL (Desirable)', null, 300, 'CHOD-PAP Enzymatic', 1);
      insertParam.run(tenantId, t2, 'HDL Cholesterol (Good)', 'mg/dL', 40, 60, '> 40 mg/dL', 25, null, 'Direct Immunoinhibition', 2);
      insertParam.run(tenantId, t2, 'LDL Cholesterol (Bad)', 'mg/dL', 0, 100, '< 100 mg/dL (Optimal)', null, 190, 'Direct Enzymatic', 3);
      insertParam.run(tenantId, t2, 'Serum Triglycerides', 'mg/dL', 0, 150, '< 150 mg/dL (Normal)', null, 500, 'GPO-PAP Enzymatic', 4);
      insertParam.run(tenantId, t2, 'VLDL Cholesterol', 'mg/dL', 5, 30, '5 - 30 mg/dL', null, null, 'Calculated', 5);
      insertParam.run(tenantId, t2, 'Total / HDL Ratio', 'ratio', 3.0, 5.0, '3.0 - 5.0', null, null, 'Calculated', 6);

      // Test 3: Liver Function Test (LFT)
      const t3 = insertTest.run(tenantId, 'LFT', 'Liver Function Test (LFT)', 'Biochemistry', 'Serum', 'Red (Plain)', 4, 750, 140, 15, 'Hepatic enzyme and protein profile').lastInsertRowid;
      insertParam.run(tenantId, t3, 'Bilirubin Total', 'mg/dL', 0.2, 1.2, '0.2 - 1.2 mg/dL', null, 5.0, 'Diazo Method', 1);
      insertParam.run(tenantId, t3, 'Bilirubin Direct', 'mg/dL', 0.0, 0.3, '0.0 - 0.3 mg/dL', null, null, 'Diazo Method', 2);
      insertParam.run(tenantId, t3, 'SGOT / AST', 'U/L', 5, 40, '5 - 40 U/L', null, 200, 'IFCC without Pyridoxal', 3);
      insertParam.run(tenantId, t3, 'SGPT / ALT', 'U/L', 5, 45, '5 - 45 U/L', null, 200, 'IFCC without Pyridoxal', 4);
      insertParam.run(tenantId, t3, 'Alkaline Phosphatase (ALP)', 'U/L', 30, 120, '30 - 120 U/L', null, null, 'p-NPP Kinetic', 5);
      insertParam.run(tenantId, t3, 'Total Protein', 'g/dL', 6.0, 8.3, '6.0 - 8.3 g/dL', null, null, 'Biuret', 6);
      insertParam.run(tenantId, t3, 'Serum Albumin', 'g/dL', 3.5, 5.2, '3.5 - 5.2 g/dL', 2.0, null, 'BCG Dye Binding', 7);

      // Test 4: Kidney Function Test (KFT / RFT)
      const t4 = insertTest.run(tenantId, 'KFT', 'Kidney Function Test (KFT/RFT)', 'Biochemistry', 'Serum', 'Red (Plain)', 4, 700, 130, 15, 'Renal function and electrolyte assessment').lastInsertRowid;
      insertParam.run(tenantId, t4, 'Blood Urea', 'mg/dL', 15, 40, '15 - 40 mg/dL', null, 100, 'GLDH Urease Kinetic', 1);
      insertParam.run(tenantId, t4, 'Serum Creatinine', 'mg/dL', 0.6, 1.2, '0.6 - 1.2 mg/dL', null, 4.0, 'Modified Jaffe Kinetic', 2);
      insertParam.run(tenantId, t4, 'Serum Uric Acid', 'mg/dL', 3.5, 7.2, '3.5 - 7.2 mg/dL', null, 10.0, 'Uricase PAP', 3);
      insertParam.run(tenantId, t4, 'Serum Sodium (Na+)', 'mmol/L', 135, 145, '135 - 145 mmol/L', 120, 160, 'Ion Selective Electrode', 4);
      insertParam.run(tenantId, t4, 'Serum Potassium (K+)', 'mmol/L', 3.5, 5.1, '3.5 - 5.1 mmol/L', 2.8, 6.5, 'Ion Selective Electrode', 5);

      // Test 5: Thyroid Profile
      const t5 = insertTest.run(tenantId, 'THYROID', 'Thyroid Profile Total (T3, T4, TSH)', 'Biochemistry', 'Serum', 'Yellow (SST)', 6, 500, 110, 15, 'CLIA Thyroid hormone evaluation').lastInsertRowid;
      insertParam.run(tenantId, t5, 'Total Triiodothyronine (T3)', 'ng/mL', 0.8, 2.0, '0.8 - 2.0 ng/mL', null, null, 'Chemiluminescence (CLIA)', 1);
      insertParam.run(tenantId, t5, 'Total Thyroxine (T4)', 'ug/dL', 5.1, 14.1, '5.1 - 14.1 ug/dL', null, null, 'Chemiluminescence (CLIA)', 2);
      insertParam.run(tenantId, t5, 'Thyroid Stimulating Hormone (TSH)', 'uIU/mL', 0.35, 4.94, '0.35 - 4.94 uIU/mL', 0.1, 20.0, 'Ultrasensitive 3rd Gen CLIA', 3);

      // Test 6: HbA1c
      const t6 = insertTest.run(tenantId, 'HBA1C', 'HbA1c Glycated Hemoglobin', 'Biochemistry', 'EDTA Whole Blood', 'Purple (EDTA)', 3, 550, 90, 15, 'HPLC 3-Month average glycemic control').lastInsertRowid;
      insertParam.run(tenantId, t6, 'HbA1c (Glycated Hb)', '%', 4.0, 5.6, '< 5.7% (Normal), 5.7-6.4% (Pre-diabetic), >= 6.5% (Diabetic)', null, 12.0, 'HPLC Gold Standard', 1);
      insertParam.run(tenantId, t6, 'Estimated Average Glucose (eAG)', 'mg/dL', 68, 114, '68 - 114 mg/dL', null, null, 'Calculated ADAG', 2);

      // Test 7: Blood Sugar Fasting & PP
      const t7 = insertTest.run(tenantId, 'BSF_PP', 'Blood Glucose Fasting & PP', 'Biochemistry', 'Fluoride Plasma', 'Grey (Fluoride)', 2, 120, 25, 10, 'Enzymatic Hexokinase blood glucose monitoring').lastInsertRowid;
      insertParam.run(tenantId, t7, 'Fasting Blood Sugar (FBS)', 'mg/dL', 70, 99, '70 - 99 mg/dL (Normal)', 50, 300, 'Hexokinase UV', 1);
      insertParam.run(tenantId, t7, 'Post Prandial Blood Sugar (PPBS)', 'mg/dL', 80, 140, '< 140 mg/dL (Normal)', null, 350, 'Hexokinase UV', 2);

      // Test 8: Urine Routine & Microscopic (Clinical Pathology)
      const t8 = insertTest.run(tenantId, 'URINE_RE', 'Urine Routine & Microscopic Examination', 'Clinical Pathology', 'Spot Midstream Urine', 'Sterile Container', 2, 180, 30, 10, 'Complete chemical strips & sediment microscopy').lastInsertRowid;
      insertParam.run(tenantId, t8, 'Urine Color', 'text', null, null, 'Pale Yellow', null, null, 'Visual Observation', 1);
      insertParam.run(tenantId, t8, 'Specific Gravity', 'ratio', 1.005, 1.030, '1.005 - 1.030', null, null, 'Refractometer', 2);
      insertParam.run(tenantId, t8, 'Urine pH', 'units', 5.0, 8.0, '5.0 - 8.0', null, null, 'Indicator Strip', 3);
      insertParam.run(tenantId, t8, 'Protein / Albumin', 'text', null, null, 'Nil / Negative', null, null, 'Sulfosalicylic Acid', 4);
      insertParam.run(tenantId, t8, 'Urine Sugar / Glucose', 'text', null, null, 'Nil / Negative', null, null, 'Glucose Oxidase Strip', 5);
      insertParam.run(tenantId, t8, 'Pus Cells (WBCs)', '/hpf', 0, 5, '0 - 5 / hpf', null, 30, 'High Power Microscopy', 6);
      insertParam.run(tenantId, t8, 'Red Blood Cells (RBCs)', '/hpf', 0, 2, '0 - 2 / hpf', null, 15, 'High Power Microscopy', 7);
      insertParam.run(tenantId, t8, 'Epithelial Cells', '/hpf', 0, 5, '0 - 5 / hpf', null, null, 'High Power Microscopy', 8);

      // Test 9: Vitamin D
      const t9 = insertTest.run(tenantId, 'VIT_D', 'Vitamin D Total (25-Hydroxycalciferol)', 'Biochemistry', 'Serum', 'Red (Plain)', 6, 1200, 260, 15, 'ECLIA Quantitative Vitamin D measurement').lastInsertRowid;
      insertParam.run(tenantId, t9, '25-OH Vitamin D Total', 'ng/mL', 30, 100, '< 20 (Deficient), 20-30 (Insufficient), 30-100 (Sufficient)', 10, null, 'ECLIA Immunoassay', 1);

      // 3. Seed Health Checkup Packages
      const insertPkg = db.prepare(`
        INSERT INTO lab_packages (tenant_id, package_code, package_name, description, tests_included, package_price, original_price, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
      `);
      insertPkg.run(
        tenantId,
        'PKG-EXEC-FULL',
        'Executive Full Body Health Checkup (64 Parameters)',
        'Includes CBC with ESR, Lipid Profile, Liver Function (LFT), Kidney Function (KFT), Thyroid Profile, HbA1c, Urine R/E',
        JSON.stringify([t1, t2, t3, t4, t5, t6, t8]),
        1499.0,
        3480.0
      );
      insertPkg.run(
        tenantId,
        'PKG-DIAB-CARE',
        'Comprehensive Diabetic Care Profile',
        'Includes HbA1c Glycated Hemoglobin, Blood Sugar Fasting & PP, Kidney Function Test (KFT), Lipid Profile',
        JSON.stringify([t6, t7, t4, t2]),
        999.0,
        2020.0
      );
      insertPkg.run(
        tenantId,
        'PKG-FEVER-PANEL',
        'Acute Fever & Infection Screen',
        'Includes Complete Blood Count (CBC) with ESR, Urine Routine & Microscopy',
        JSON.stringify([t1, t8]),
        450.0,
        530.0
      );

      // 4. Seed Sample Orders with Real Observations
      const today = new Date().toISOString().slice(0, 10);
      const insertOrder = db.prepare(`
        INSERT INTO lab_orders (
          tenant_id, order_no, barcode, patient_name, patient_age, patient_gender,
          patient_phone, referring_doctor, referring_doctor_commission, total_amount, discount,
          tax_amount, net_amount, paid_amount, balance_due, payment_status, payment_mode,
          order_status, sample_status, phlebotomist, collected_at, reported_at, verified_by, clinical_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertItem = db.prepare(`
        INSERT INTO lab_order_items (tenant_id, order_id, test_id, package_id, item_type, item_name, department, price, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertRes = db.prepare(`
        INSERT INTO lab_order_results (tenant_id, order_id, test_id, parameter_id, parameter_name, result_value, unit, reference_range_text, flag, remarks, entered_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // Order 1: Verified CBC & Lipid for Amit Sharma
      const ord1 = insertOrder.run(
        tenantId,
        `LAB-T${tenantId}-${today.replace(/-/g, '').slice(2)}-001`,
        `SMP-T${tenantId}-89241`,
        'Amit Sharma',
        42,
        'Male',
        '+91 98765 43210',
        'Dr. Sanjay Verma, MD (Internal Med)',
        150.0,
        1000.0,
        0,
        0,
        1000.0,
        1000.0,
        0,
        'paid',
        'upi',
        'verified',
        'collected',
        'Rahul Yadav (Phlebotomist)',
        `${today} 08:30`,
        `${today} 12:45`,
        'Dr. K. L. Mehta, MD (Pathologist) [Reg: MCI-48291]',
        'Routine health checkup. Mild dyslipidemia noted; hemogram within normal limits.'
      ).lastInsertRowid;

      insertItem.run(tenantId, ord1, t1, null, 'test', 'Complete Blood Count (CBC) with ESR', 'Hematology', 350.0, 'completed');
      insertItem.run(tenantId, ord1, t2, null, 'test', 'Lipid Profile Comprehensive Panel', 'Biochemistry', 650.0, 'completed');

      insertRes.run(tenantId, ord1, t1, 1, 'Hemoglobin (Hb)', '14.8', 'g/dL', '13.0 - 17.0 g/dL', 'normal', 'Normal adult male level', 'Lab Tech Amit');
      insertRes.run(tenantId, ord1, t1, 2, 'Total Leucocyte Count (TLC/WBC)', '7200', 'cells/cu.mm', '4,000 - 11,000 cells/cu.mm', 'normal', null, 'Lab Tech Amit');
      insertRes.run(tenantId, ord1, t1, 3, 'Platelet Count', '2.8', 'lakhs/cu.mm', '1.5 - 4.5 lakhs/cu.mm', 'normal', 'Adequate on smear', 'Lab Tech Amit');
      insertRes.run(tenantId, ord1, t1, 10, 'ESR (1st Hour)', '8', 'mm/1st hr', '0 - 15 mm/1st hr', 'normal', null, 'Lab Tech Amit');
      insertRes.run(tenantId, ord1, t2, 11, 'Total Cholesterol', '224', 'mg/dL', '< 200 mg/dL (Desirable)', 'high', 'Borderline elevated', 'Biochemist Neha');
      insertRes.run(tenantId, ord1, t2, 12, 'HDL Cholesterol (Good)', '44', 'mg/dL', '> 40 mg/dL', 'normal', null, 'Biochemist Neha');
      insertRes.run(tenantId, ord1, t2, 13, 'LDL Cholesterol (Bad)', '142', 'mg/dL', '< 100 mg/dL (Optimal)', 'high', 'Elevated LDL', 'Biochemist Neha');
      insertRes.run(tenantId, ord1, t2, 14, 'Serum Triglycerides', '190', 'mg/dL', '< 150 mg/dL (Normal)', 'high', 'Elevated triglycerides', 'Biochemist Neha');

      // Order 2: Diabetic Profile for Sunita Devi
      const ord2 = insertOrder.run(
        tenantId,
        `LAB-T${tenantId}-${today.replace(/-/g, '').slice(2)}-002`,
        `SMP-T${tenantId}-89242`,
        'Sunita Devi',
        56,
        'Female',
        '+91 98123 45678',
        'Dr. Priya Sharma, MBBS, DGO',
        149.0,
        999.0,
        0,
        0,
        999.0,
        999.0,
        0,
        'paid',
        'cash',
        'completed',
        'collected',
        'Kavita Rawat (Phlebotomist)',
        `${today} 09:15`,
        `${today} 14:00`,
        'Dr. K. L. Mehta, MD (Pathologist) [Reg: MCI-48291]',
        'Type-2 Diabetes monitoring. Moderate glycemic control (HbA1c 7.4%).'
      ).lastInsertRowid;

      insertItem.run(tenantId, ord2, null, 2, 'package', 'Comprehensive Diabetic Care Profile', 'Biochemistry', 999.0, 'completed');
      insertRes.run(tenantId, ord2, t6, 28, 'HbA1c (Glycated Hb)', '7.4', '%', '< 5.7% (Normal), >= 6.5% (Diabetic)', 'high', 'Target < 7.0%', 'Biochemist Neha');
      insertRes.run(tenantId, ord2, t6, 29, 'Estimated Average Glucose (eAG)', '166', 'mg/dL', '68 - 114 mg/dL', 'high', null, 'Biochemist Neha');
      insertRes.run(tenantId, ord2, t4, 21, 'Serum Creatinine', '0.9', 'mg/dL', '0.6 - 1.2 mg/dL', 'normal', 'Normal renal clearance', 'Biochemist Neha');

      // Order 3: Sample Collected Walk-in for Vikram Singh
      const ord3 = insertOrder.run(
        tenantId,
        `LAB-T${tenantId}-${today.replace(/-/g, '').slice(2)}-003`,
        `SMP-T${tenantId}-89243`,
        'Vikram Singh',
        31,
        'Male',
        '+91 97654 32109',
        'Self / Direct Walk-in Patient',
        0,
        350.0,
        0,
        0,
        350.0,
        200.0,
        150.0,
        'partial',
        'upi',
        'sample_collected',
        'collected',
        'Rahul Yadav (Phlebotomist)',
        `${today} 11:20`,
        null,
        null,
        'Patient reports fatigue and weakness.'
      ).lastInsertRowid;

      insertItem.run(tenantId, ord3, t1, null, 'test', 'Complete Blood Count (CBC) with ESR', 'Hematology', 350.0, 'pending');
  } catch (err) {
    console.error('Error seeding lab data:', err);
  }
}

function seedImportExportData() {
  try {
    const tenants = db.prepare("SELECT id FROM tenants WHERE business_type IN ('impoexpo', 'exim')").all();
    for (const t of tenants) {
      seedTenantImportExportData(t.id);
    }
  } catch (err) {
    console.error('Error seeding import/export data:', err);
  }
}

function seedTenantImportExportData(tenantId) {
  try {
    const shipmentCount = db.prepare('SELECT COUNT(*) as count FROM exim_shipments WHERE tenant_id = ?').get(tenantId).count;
    if (shipmentCount === 0) {
      const insertShipment = db.prepare(`
        INSERT INTO exim_shipments (
          tenant_id, shipment_number, trade_type, partner_name, partner_country,
          iec_code, incoterm, invoice_number, invoice_value, currency, exchange_rate,
          total_inr_value, port_of_loading, port_of_discharge, bill_of_lading_no,
          container_no, carrier_name, customs_entry_bill_no, customs_duty_amount,
          hs_tariff_code, status, eta_date, cleared_date, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertShipment.run(
        tenantId,
        `IMP-${tenantId}-0042`,
        'IMPORT',
        'Merck Life Science KGaA',
        'Germany',
        '0508012349',
        'CIF',
        'INV-DE-89211',
        14500.00,
        'EUR',
        92.40,
        1339800.00,
        'Hamburg Port (DEHAM)',
        'Nhava Sheva JNPT (INNSA)',
        'HLCUHAM2609012',
        'HLXU-489201-8',
        'Hapag-Lloyd AG',
        'BOE-JNPT-2026-77821',
        147378.00,
        '2933.29.90',
        'customs_cleared',
        '2026-10-04',
        '2026-10-06',
        'High-purity raw pharma ingredients. Customs duty and IGST paid via ICEGATE.'
      );

      insertShipment.run(
        tenantId,
        `IMP-${tenantId}-0058`,
        'IMPORT',
        'Abbott Molecular & Diagnostics Inc.',
        'United States',
        '0508012349',
        'FOB',
        'USA-EXP-55421',
        8200.00,
        'USD',
        84.50,
        692900.00,
        'JFK New York Air Cargo',
        'Delhi IGI Airport Cargo (INDEL)',
        'AWB-020-89104423',
        'TEMP-CONTROLLED-CONTAINER-04',
        'Lufthansa Cargo AG',
        'BOE-DEL-2026-44109',
        51967.50,
        '3822.00.90',
        'in_transit',
        '2026-10-15',
        null,
        'Cold chain reagents (+2°C to +8°C) in transit via Frankfurt hub.'
      );

      insertShipment.run(
        tenantId,
        `EXP-${tenantId}-0019`,
        'EXPORT',
        'Gulf Health Care Medical LLC',
        'United Arab Emirates',
        '0508012349',
        'CIF',
        'EXP-INV-2026-081',
        18500.00,
        'AED',
        23.05,
        426425.00,
        'Mundra Port (INMUN)',
        'Jebel Ali Port Dubai (AEJEA)',
        'MAEU-MUN-26991',
        'MSKU-992140-1',
        'Maersk Line',
        'SB-MUN-2026-19034',
        0.00,
        '3004.90.99',
        'customs_cleared',
        '2026-10-12',
        '2026-10-08',
        'Zero-rated export under GST LUT bond. Phytosanitary & Drug Controller NOC verified.'
      );
    }

    const jobCount = db.prepare('SELECT COUNT(*) as count FROM import_export_jobs WHERE tenant_id = ?').get(tenantId).count;
    if (jobCount === 0) {
      const insertJob = db.prepare(`
        INSERT INTO import_export_jobs (
          tenant_id, job_type, entity_type, file_format, file_name,
          total_records, successful_records, failed_records, status,
          error_summary, executed_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const now = new Date().toISOString();
      insertJob.run(
        tenantId,
        'import',
        'products',
        'csv',
        'pharma_master_catalog_oct2026.csv',
        42,
        42,
        0,
        'completed',
        null,
        'Dr. Sanjay Verma',
        now
      );

      insertJob.run(
        tenantId,
        'export',
        'customers',
        'csv',
        'customer_khata_balances_export.csv',
        18,
        18,
        0,
        'completed',
        null,
        'Accountant Sharma',
        now
      );
    }

    // Seed Sample Products & Batches for Barcode & Billing
    const prodCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE tenant_id = ?').get(tenantId).count;
    if (prodCount === 0) {
      const sampleProds = [
        { name: 'Augmentin 625 Duo Tablet', barcode: '8901088012345', category: 'Antibiotics', brand: 'GSK', hsn: '3004.20.00', gst: 12, mrp: 223.50, buy: 160.00, sell: 205.00, stock: 80, batch: 'AUG-26A' },
        { name: 'Industrial Precision Bearings 6205-2RS', barcode: '8901234560001', category: 'Mechanical EXIM', brand: 'SKF Precision', hsn: '8482.10.10', gst: 18, mrp: 450.00, buy: 320.00, sell: 420.00, stock: 150, batch: 'BRG-26X' },
        { name: 'Stainless Steel Flanges Grade 316L', barcode: '8901234560002', category: 'Industrial Piping', brand: 'Jindal Steel', hsn: '7307.21.00', gst: 18, mrp: 1100.00, buy: 820.00, sell: 1050.00, stock: 45, batch: 'FLG-99A' },
        { name: 'Dolo 650mg Paracetamol', barcode: '8901148201991', category: 'Analgesics', brand: 'Micro Labs', hsn: '3004.90.60', gst: 12, mrp: 34.00, buy: 22.50, sell: 31.00, stock: 240, batch: 'DOL-88B' },
        { name: 'Diagnostic Reagent Test Kit', barcode: '8901234560003', category: 'Diagnostics', brand: 'Roche Diagnostics', hsn: '3822.00.90', gst: 12, mrp: 1450.00, buy: 1050.00, sell: 1380.00, stock: 30, batch: 'REG-77C' }
      ];

      const insProd = db.prepare(`
        INSERT INTO products (tenant_id, name, barcode, category, brand, hsn_code, gst_rate, pack_unit, min_stock_alert)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Unit', 10)
      `);
      const insBatch = db.prepare(`
        INSERT INTO batches (tenant_id, product_id, batch_number, expiry_date, purchase_rate, mrp, selling_rate, stock_units)
        VALUES (?, ?, ?, '2028-12-31', ?, ?, ?, ?)
      `);

      sampleProds.forEach(sp => {
        const pRes = insProd.run(tenantId, sp.name, sp.barcode, sp.category, sp.brand, sp.hsn, sp.gst);
        insBatch.run(tenantId, pRes.lastInsertRowid, sp.batch, sp.buy, sp.mrp, sp.sell, sp.stock);
      });
    }

    // Seed Sample Debtors / Customers
    const custCount = db.prepare('SELECT COUNT(*) as count FROM customers WHERE tenant_id = ?').get(tenantId).count;
    if (custCount === 0) {
      const insCust = db.prepare(`
        INSERT INTO customers (tenant_id, name, phone, address, credit_limit, current_balance)
        VALUES (?, ?, ?, ?, 200000, ?)
      `);
      insCust.run(tenantId, 'Global Dynamics International Corp', '+97148009988', 'Terminal 3, Free Trade Zone, Dubai, UAE', 68500);
      insCust.run(tenantId, 'Al-Futtaim Logistics & Trading LLC', '+97165001122', 'Al Wahda St, Sharjah, UAE', 42000);
      insCust.run(tenantId, 'Apex Freight Forwarders & Co', '+919820099881', 'JNPT Logistics Park, Navi Mumbai, MH', 24500);
    }

    // Seed Sample Invoices
    const invCount = db.prepare('SELECT COUNT(*) as count FROM sales_invoices WHERE tenant_id = ?').get(tenantId).count;
    if (invCount === 0) {
      const insInv = db.prepare(`
        INSERT INTO sales_invoices (
          tenant_id, invoice_number, customer_id, customer_name, customer_phone,
          total_items, subtotal, tax_amount, discount_amount, round_off,
          grand_total, payment_mode, cash_paid, upi_paid, khata_amount, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, 'completed')
      `);
      const insItem = db.prepare(`
        INSERT INTO sales_items (
          tenant_id, invoice_id, product_id, product_name, batch_number,
          quantity, unit_price, mrp, gst_rate, gst_amount, discount, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `);

      const c1 = db.prepare('SELECT * FROM customers WHERE tenant_id = ? LIMIT 1').get(tenantId);
      const prods = db.prepare('SELECT * FROM products WHERE tenant_id = ?').all(tenantId);

      if (c1 && prods.length >= 2) {
        // Invoice 1: Export LUT invoice
        const inv1Res = insInv.run(tenantId, 'EXP-26-000001', c1.id, c1.name, c1.phone, 2, 44500, 0, 44500, 'upi', 0, 44500, 0);
        insItem.run(tenantId, inv1Res.lastInsertRowid, prods[1].id, prods[1].name, 'BRG-26X', 50, 450, 450, 0, 0, 22500);
        insItem.run(tenantId, inv1Res.lastInsertRowid, prods[2].id, prods[2].name, 'FLG-99A', 20, 1100, 1100, 0, 0, 22000);

        // Invoice 2: B2B GST invoice
        const inv2Res = insInv.run(tenantId, 'EXP-26-000002', c1.id, 'Apex Freight Forwarders & Co', '+919820099881', 1, 26000, 3120, 29120, 'bank_wire', 0, 0, 29120);
        insItem.run(tenantId, inv2Res.lastInsertRowid, prods[0].id, prods[0].name, 'AUG-26A', 130, 200, 223.50, 12, 3120, 29120);
      }
    }

    // Seed Sample E-Way Bills
    const ewbCount = db.prepare('SELECT COUNT(*) as count FROM eway_bills WHERE tenant_id = ?').get(tenantId).count;
    if (ewbCount === 0) {
      const insEwb = db.prepare(`
        INSERT INTO eway_bills (
          tenant_id, bill_type, document_type, document_no, document_date,
          eway_bill_no, eway_bill_date, valid_until, from_place, from_pincode,
          to_place, to_pincode, transporter_name, transporter_id, vehicle_no,
          distance_km, taxable_value, cgst_amount, sgst_amount, igst_amount, total_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const today = new Date().toISOString().slice(0, 10);
      const validUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      insEwb.run(
        tenantId, 'export', 'INV', 'EXP-26-000001', today,
        '24' + String(tenantId).padStart(2, '0') + '98112048', today, validUntil, 'JNPT Port CFS', '400707',
        'Ahmedabad ICD Terminal', '382010', 'VRL Logistics EXIM Fleet', 'TRANS-9902', 'MH-04-AZ-9921',
        420, 44500, 0, 0, 0, 44500
      );
      insEwb.run(
        tenantId, 'outward', 'INV', 'EXP-26-000002', today,
        '24' + String(tenantId).padStart(2, '0') + '10882319', today, validUntil, 'Navi Mumbai Hub', '400707',
        'Tughlakabad ICD Depot', '110037', 'Concor Container Freight', 'TRANS-8810', 'MH-01-DR-3310',
        1380, 26000, 1560, 1560, 0, 29120
      );
    }

    // Seed CHA User for ImpoExpo Tenant
    const existingChaUser = db.prepare("SELECT id FROM users WHERE email = 'cha@transglobalexim.com'").get();
    if (!existingChaUser) {
      const pHash = bcrypt.hashSync('ChaBroker@123', 10);
      db.prepare(`
        INSERT INTO users (tenant_id, name, email, password_hash, role, pin_code, status)
        VALUES (?, 'Rajesh Sharma (Customs Broker)', 'cha@transglobalexim.com', ?, 'cha_agent', '5566', 'active')
      `).run(tenantId, pHash);
    } else {
      db.prepare("UPDATE users SET tenant_id = ?, role = 'cha_agent', name = 'Rajesh Sharma (Customs Broker)', pin_code = '5566', status = 'active' WHERE email = 'cha@transglobalexim.com'").run(tenantId);
    }

    // Seed DGFT & Customs Licenses
    const licCount = db.prepare('SELECT COUNT(*) as count FROM exim_licenses WHERE tenant_id = ?').get(tenantId).count;
    if (licCount === 0) {
      const insLic = db.prepare(`
        INSERT INTO exim_licenses (
          tenant_id, license_type, license_number, issuing_authority, issue_date, expiry_date,
          cif_value, fob_obligation_value, obligation_fulfilled_value, status, scrip_balance,
          epc_name, dgft_file_number, eodc_status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // 1. IEC Master Registration
      insLic.run(
        tenantId, 'IEC', '0508012349', 'DGFT', '2021-04-12', '2031-03-31',
        0, 0, 0, 'active', 0,
        'Pharmexcil', 'DGFT/CLA/IEC/0508012349', 'discharged',
        'PAN: AABCT1294F. DGFT Portal status: ACTIVE & VALIDATED. Annual renewal completed for FY 2026-27.'
      );

      // 2. Advance Authorisation (Duty-Free Raw Materials)
      insLic.run(
        tenantId, 'ADVANCE_AUTHORISATION', 'AA-05102026-0941', 'DGFT', '2025-11-15', '2027-05-14',
        10080000, 15120000, 8900000, 'active', 0,
        'Pharmexcil', 'DGFT/MUM/AA/2025/8812', 'pending',
        'Duty-free import of API bulk intermediates for export production of formulation tablets.'
      );

      // 3. EPCG Scheme (Zero Duty Capital Machinery)
      insLic.run(
        tenantId, 'EPCG', 'EPCG-2025-00812', 'DGFT', '2025-03-20', '2031-03-19',
        4250000, 25500000, 14200000, 'active', 0,
        'EEPC India', 'DGFT/CLA/EPCG/00812/25', 'pending',
        'High-speed Rotary Blister Packaging Machine imported at 0% BCD. 6x Export obligation over 6 years.'
      );

      // 4. RoDTEP Electronic Duty Scrip Ledger
      insLic.run(
        tenantId, 'RODTEP', 'RODTEP-26-88120', 'CBIC_CUSTOMS', '2026-01-10', '2027-01-09',
        0, 0, 0, 'active', 142850.00,
        'Customs Icegate', 'ICEGATE/SCRIP/2026/88120', 'discharged',
        'Electronic duty credit scrips earned on export shipping bills. Transferable or usable for Basic Customs Duty.'
      );

      // 5. RCMC Registration
      insLic.run(
        tenantId, 'RCMC', 'PHARMEXCIL/RCMC/2024/9811', 'EPC', '2024-04-01', '2029-03-31',
        0, 0, 0, 'active', 0,
        'Pharmexcil (Pharmaceuticals Export Promotion Council of India)', 'EPC/REG/HYD/9811', 'discharged',
        'Valid for Bulk Drugs, Formulations, Herbal Extracts & Diagnostic Reagents.'
      );

      // 6. GST LUT Bond
      insLic.run(
        tenantId, 'LUT_GST', 'LUT-ARN-AA270326091811', 'GSTN', '2026-04-01', '2027-03-31',
        0, 0, 0, 'active', 0,
        'GST Department', 'GST/LUT/27/2026-27', 'discharged',
        'Letter of Undertaking for zero-rated export supply of goods without payment of IGST under Rule 96A.'
      );

      // 7. AEO Certification
      insLic.run(
        tenantId, 'AEO', 'AEO-T1-INNSA-9021', 'CBIC_CUSTOMS', '2024-08-15', '2027-08-14',
        0, 0, 0, 'active', 0,
        'Indian Customs CBIC', 'CBIC/DIC/AEO-T1/9021', 'discharged',
        'Authorized Economic Operator Tier-1 accreditation. Grants Direct Port Delivery (DPD) & faster green channel clearance.'
      );
    }

    // Ensure Multi-RCMCs and Multi-FSSAI licenses exist for EXIM Tenant
    const checkExtraLic = db.prepare('SELECT COUNT(*) as count FROM exim_licenses WHERE tenant_id = ? AND license_number = ?');
    const insExtraLic = db.prepare(`
      INSERT INTO exim_licenses (
        tenant_id, license_type, license_number, issuing_authority, issue_date, expiry_date,
        cif_value, fob_obligation_value, obligation_fulfilled_value, status, scrip_balance,
        epc_name, dgft_file_number, eodc_status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const extraLicenses = [
      {
        type: 'RCMC',
        num: 'APEDA/RCMC/2024/60192',
        auth: 'EPC',
        issue: '2024-05-10',
        exp: '2029-05-09',
        epc: 'APEDA (Agricultural & Processed Food Products Export Development Authority)',
        file: 'APEDA/NDLS/EXP/60192',
        notes: 'Export registration for Basmati & Non-Basmati Rice, Organic Pulses, Guar Gum, Herbal Teas, Processed Fruits & Purees.'
      },
      {
        type: 'RCMC',
        num: 'EEPC/WR/RCMC/2023/11842',
        auth: 'EPC',
        issue: '2023-09-01',
        exp: '2028-08-31',
        epc: 'EEPC India (Engineering Export Promotion Council)',
        file: 'EEPC/MUM/RCMC/11842',
        notes: 'Engineering goods export certification: SS 316L Reactor vessels, packaging machinery components, industrial filtration cartridges.'
      },
      {
        type: 'RCMC',
        num: 'SPICES-BRD/RCMC/2025/4412',
        auth: 'EPC',
        issue: '2025-01-15',
        exp: '2030-01-14',
        epc: 'Spices Board India (Ministry of Commerce & Industry)',
        file: 'SB/COK/REG/4412',
        notes: 'Certified for Whole & Ground Spices, Turmeric Oleoresin, Cardamom Essential Oil, Ginger & Black Pepper Extracts.'
      },
      {
        type: 'FSSAI_CENTRAL',
        num: '10022026001928',
        auth: 'FSSAI_CENTRAL',
        issue: '2023-09-01',
        exp: '2028-08-31',
        epc: 'Central Licensing Authority - FSSAI Western Region (Mumbai Port & JNPT SEZ)',
        file: 'FSSAI/CLA/WR/10022026001928',
        notes: 'Category: 100% Export Oriented Unit (EOU) & Merchant Exporter. Authorization for Export of Nutraceuticals, Fortified Food Powders & Dietary Supplements via JNPT & Air Cargo.'
      },
      {
        type: 'FSSAI_STATE',
        num: '11521019000342',
        auth: 'FDA_MAHARASHTRA',
        issue: '2023-11-20',
        exp: '2028-11-19',
        epc: 'Food & Drugs Administration (FDA Maharashtra) - Raigad Division',
        file: 'FDA/MAH/MFG/11521019000342',
        notes: 'Category: Food Formulation & Nutraceutical Manufacturing Facility (MIDC Taloja). Clean Room Class 100,000 for botanical tablets & powders.'
      },
      {
        type: 'FSSAI_STATE',
        num: '10723031000881',
        auth: 'FDA_GUJARAT',
        issue: '2024-05-15',
        exp: '2029-05-14',
        epc: 'Food & Drugs Administration (FDA Gujarat) - Valsad Division',
        file: 'FDA/GUJ/WH/10723031000881',
        notes: 'Category: Cold Chain Storage, Secondary Packaging & Reefer Container Stuffing Facility (GIDC Vapi Hub).'
      },
      {
        type: 'CDSCO',
        num: 'CDSCO/WZ/EXP/2026/88102',
        auth: 'CDSCO_CENTRAL',
        issue: '2026-02-01',
        exp: '2027-01-31',
        epc: 'Central Drugs Standard Control Organisation (West Zone)',
        file: 'CDSCO/WZ/DU/88102',
        notes: 'Dual-use chemical NOC for high-purity pharma excipients & food grade stabilizers.'
      },
      {
        type: 'BIS',
        num: 'BIS/CM/L-8829104',
        auth: 'BIS',
        issue: '2024-06-10',
        exp: '2027-06-09',
        epc: 'Bureau of Indian Standards - Western Regional Office',
        file: 'BIS/WRO/CMD/8829104',
        notes: 'IS 15447 compliance for food-contact multi-layer barrier pouches and export cartons.'
      }
    ];

    for (const lic of extraLicenses) {
      if (checkExtraLic.get(tenantId, lic.num).count === 0) {
        insExtraLic.run(
          tenantId, lic.type, lic.num, lic.auth, lic.issue, lic.exp,
          0, 0, 0, 'active', 0, lic.epc, lic.file, 'discharged', lic.notes
        );
      }
    }

    // Seed Gateway Customs Ports & ICDs
    const portCount = db.prepare('SELECT COUNT(*) as count FROM customs_ports WHERE tenant_id = ?').get(tenantId).count;
    if (portCount === 0) {
      const insPort = db.prepare(`
        INSERT INTO customs_ports (
          tenant_id, port_code, port_name, port_type, customs_zone,
          custodian, icegate_enabled, cfs_names, edi_version, contact_phone, contact_email, is_default, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `);

      const standardPorts = [
        {
          code: 'INNSA1',
          name: 'Nhava Sheva (JNPT) Sea Port',
          type: 'SEA',
          zone: 'Mumbai Customs Zone II',
          custodian: 'Jawaharlal Nehru Port Trust (JNPT) & DP World / PSA',
          icegate: 1,
          cfs: 'Gateway Distriparks, Allcargo CFS, Ameya CFS, Seabird Marine, Continental CFS',
          edi: 'ICEGATE 2.0 (Single Window System)',
          phone: '+91 22 2724 4000',
          email: 'commissioner@jnpcustoms.gov.in',
          def: 1
        },
        {
          code: 'INMUN1',
          name: 'Mundra Port & SEZ (Adani Terminal)',
          type: 'SEA',
          zone: 'Gujarat Customs Zone',
          custodian: 'Adani Ports and Special Economic Zone (APSEZ)',
          icegate: 1,
          cfs: 'Adani CFS, Seabird CFS Mundra, MICT Container Freight Station',
          edi: 'ICEGATE 2.0 (Single Window System)',
          phone: '+91 2838 255000',
          email: 'mundra.customs@icegate.gov.in',
          def: 0
        },
        {
          code: 'INDEL4',
          name: 'Delhi Air Cargo Complex (IGI Airport)',
          type: 'AIR',
          zone: 'Delhi Customs Zone',
          custodian: 'Celebi Delhi Cargo Terminal / DIAL',
          icegate: 1,
          cfs: 'Air Cargo Terminal 2 & 3, New Delhi Airport',
          edi: 'ICEGATE 2.0 (Air EDI)',
          phone: '+91 11 2565 2011',
          email: 'aircargo.delhi@gov.in',
          def: 0
        },
        {
          code: 'INBOM4',
          name: 'Mumbai Air Cargo Complex (Sahar Airport)',
          type: 'AIR',
          zone: 'Mumbai Customs Zone III (Air Cargo)',
          custodian: 'Mumbai International Airport Ltd (MIAL)',
          icegate: 1,
          cfs: 'Air Cargo Complex Sahar, Andheri East, Mumbai',
          edi: 'ICEGATE 2.0 (Air EDI)',
          phone: '+91 22 2682 8100',
          email: 'commissioner-accmum@gov.in',
          def: 0
        },
        {
          code: 'INTKD6',
          name: 'ICD Tughlakabad Dry Port (TKD Rail Terminal)',
          type: 'ICD',
          zone: 'Delhi Customs Commissionerate (ICD Tughlakabad)',
          custodian: 'Container Corporation of India (CONCOR)',
          icegate: 1,
          cfs: 'CONCOR TKD Dry Port Yard, Okhla Phase-II Rail Siding',
          edi: 'ICEGATE 2.0 (ICD EDI)',
          phone: '+91 11 2636 9100',
          email: 'icdtkd.customs@gov.in',
          def: 0
        },
        {
          code: 'INMAA1',
          name: 'Chennai Sea Port (Madras Port)',
          type: 'SEA',
          zone: 'Chennai Customs Zone',
          custodian: 'Chennai Port Authority & DP World / PSA Chennai',
          icegate: 1,
          cfs: 'Chennai Port Trust CFS, Sattva CFS, Sanco Trans CFS',
          edi: 'ICEGATE 2.0 (Single Window System)',
          phone: '+91 44 2526 0000',
          email: 'prcommr-chennaisea@gov.in',
          def: 0
        },
        {
          code: 'INCOK1',
          name: 'Cochin Port & ICTT Vallarpadam',
          type: 'SEA',
          zone: 'Cochin Customs Commissionerate',
          custodian: 'India Gateway Terminal (DP World Cochin)',
          icegate: 1,
          cfs: 'Cochin Port Trust CFS, Falcon CFS, MIV Logistics CFS',
          edi: 'ICEGATE 2.0 (Single Window System)',
          phone: '+91 484 266 6422',
          email: 'commr-cochincust@gov.in',
          def: 0
        },
        {
          code: 'INHZR1',
          name: 'Hazira Port & Industrial Terminal',
          type: 'SEA',
          zone: 'Surat Customs Commissionerate',
          custodian: 'Adani Hazira Port Ltd',
          icegate: 1,
          cfs: 'Hazira CFS Terminal, Surat Export SEZ',
          edi: 'ICEGATE 2.0 (Single Window System)',
          phone: '+91 261 280 2000',
          email: 'hazira.customs@icegate.gov.in',
          def: 0
        }
      ];

      for (const p of standardPorts) {
        insPort.run(
          tenantId, p.code, p.name, p.type, p.zone,
          p.custodian, p.icegate, p.cfs, p.edi, p.phone, p.email, p.def
        );
      }
    }

    // Seed CHA Agencies Directory
    const chaCount = db.prepare('SELECT COUNT(*) as count FROM cha_agencies WHERE tenant_id = ?').get(tenantId).count;
    if (chaCount === 0) {
      const insCha = db.prepare(`
        INSERT INTO cha_agencies (
          tenant_id, agency_name, cha_license_no, contact_person, phone, email,
          ports_handled, icegate_id, pan_number, gstin, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `);

      insCha.run(
        tenantId,
        'Maritime & Cargo Customs Brokers LLP',
        '11/0458/JNPT',
        'Rajesh Sharma (Authorized Signatory)',
        '+91 98201 44552',
        'rajesh@maritimecha.com',
        'Nhava Sheva JNPT (INNSA), Mumbai Port (INBOM), Hazira (INHZA)',
        'MCCB_JNPT_99',
        'AABCM9910D',
        '27AABCM9910D1Z5'
      );

      insCha.run(
        tenantId,
        'Air & Sea Apex Logistics CHA Services',
        '08/1190/DEL',
        'Vikramaditya Oberoi',
        '+91 98110 88219',
        'clearing@apexsealogistics.com',
        'Delhi IGI Airport Air Cargo (INDEL4), ICD Tughlakabad (INTKD6), Mundra (INMUN1)',
        'ASAL_DEL_44',
        'AAOCA4412K',
        '07AAOCA4412K1Z8'
      );
    }

    // Seed CHA Customs Clearances
    const clrCount = db.prepare('SELECT COUNT(*) as count FROM cha_clearances WHERE tenant_id = ?').get(tenantId).count;
    if (clrCount === 0) {
      const insClr = db.prepare(`
        INSERT INTO cha_clearances (
          tenant_id, shipment_id, cha_agency_id, clearance_type, doc_number, doc_date,
          port_code, customs_house, icegate_job_no, assessment_status, bcd_amount,
          sws_amount, igst_amount, aidc_amount, total_customs_duty, duty_payment_status,
          icegate_challan_no, cfs_name, gate_in_date, gate_out_date, examination_order,
          ooc_number, leo_number, ooc_leo_date, delivery_order_status, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const ship1 = db.prepare("SELECT id FROM exim_shipments WHERE tenant_id = ? AND trade_type = 'IMPORT' LIMIT 1").get(tenantId);
      const ship2 = db.prepare("SELECT id FROM exim_shipments WHERE tenant_id = ? AND trade_type = 'EXPORT' LIMIT 1").get(tenantId);
      const cha1 = db.prepare("SELECT id FROM cha_agencies WHERE tenant_id = ? LIMIT 1").get(tenantId);

      // Clearance 1: Import Bill of Entry with Out of Charge (OOC)
      insClr.run(
        tenantId,
        ship1 ? ship1.id : null,
        cha1 ? cha1.id : 1,
        'IMPORT_BOE',
        'BOE-8912044',
        '2026-10-02',
        'INNSA1',
        'Nhava Sheva Customs Commissionerate',
        'JOB-ICE-2609012',
        'ooc_given',
        66990.00,
        6699.00,
        73689.00,
        0.00,
        147378.00,
        'paid',
        'CH-ICE-2026-90123',
        'Gateway Distriparks CFS, Nhava Sheva',
        '2026-10-03',
        '2026-10-06',
        'First Check completed. 100% seal intact. Drug Controller NOC verified on ICEGATE Single Window.',
        'OOC-INNSA1-2026-88190',
        null,
        '2026-10-06',
        'cargo_dispatched',
        'Out of Charge (OOC) granted. Cargo released from CFS onto factory transport trailer.'
      );

      // Clearance 2: Export Shipping Bill with Let Export Order (LEO)
      insClr.run(
        tenantId,
        ship2 ? ship2.id : null,
        cha1 ? cha1.id : 1,
        'EXPORT_SB',
        'SB-7190281',
        '2026-10-07',
        'INMUN1',
        'Mundra Port Customs Commissionerate',
        'JOB-ICE-2610088',
        'leo_given',
        0.00,
        0.00,
        0.00,
        0.00,
        0.00,
        'paid',
        null,
        'Mundra International Container Terminal (MICT)',
        '2026-10-07',
        null,
        'Container carting verified. Seal verification passed. LEO issued under LUT bond.',
        null,
        'LEO-INMUN1-2026-55019',
        '2026-10-08',
        'do_received',
        'Let Export Order (LEO) issued. Loaded onto Maersk Line vessel for Dubai voyage.'
      );

      // Clearance 3: Bill of Entry in Examination Stage
      insClr.run(
        tenantId,
        null,
        cha1 ? cha1.id : 1,
        'IMPORT_BOE',
        'BOE-8945112',
        '2026-10-09',
        'INNSA1',
        'Nhava Sheva Customs Commissionerate',
        'JOB-ICE-2610441',
        'under_examination',
        23500.00,
        2350.00,
        26120.00,
        0.00,
        51970.00,
        'challan_generated',
        'CH-ICE-2026-99041',
        'Ameya CFS, Dronagiri Node, Navi Mumbai',
        '2026-10-10',
        null,
        'Cold chain temperature log submitted (+4°C). ADC (Assistant Drug Controller) physical inspection pending.',
        null,
        null,
        null,
        'pending',
        'Assessment finalized. ICEGATE duty challan generated, awaiting physical inspection pass.'
      );
    }

    // Seed Bank Realisations (e-BRC / EDPMS)
    const brcCount = db.prepare('SELECT COUNT(*) as count FROM exim_bank_realizations WHERE tenant_id = ?').get(tenantId).count;
    if (brcCount === 0) {
      const insBrc = db.prepare(`
        INSERT INTO exim_bank_realizations (
          tenant_id, shipping_bill_no, invoice_number, bank_name, authorized_dealer_code,
          firc_number, ebrc_number, realized_amount_fcy, currency, realized_amount_inr,
          realization_date, edpms_status, idpms_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insBrc.run(
        tenantId,
        'SB-7190281',
        'EXP-26-000001',
        'State Bank of India (Forex Overseas Branch, Mumbai)',
        '0210045',
        'FIRC-SBI-2026-00912',
        'SBI-BRC-2026-00412',
        18500.00,
        'AED',
        426425.00,
        '2026-10-09',
        'closed',
        'not_applicable'
      );

      insBrc.run(
        tenantId,
        'SB-MUN-2026-19034',
        'EXP-INV-2026-081',
        'HDFC Bank Ltd (International Trade Services, Fort)',
        '0510022',
        'FIRC-HDFC-2026-88190',
        'HDFC-BRC-2026-11045',
        48500.00,
        'USD',
        4098250.00,
        '2026-10-08',
        'closed',
        'not_applicable'
      );
    }

    // Seed the 4 Organization Personas for EXIM Tenant
    const personaUsers = [
      { email: 'admin@transglobalexim.com', name: 'Vikram Malhotra (Super Admin)', role: 'super_admin', pass: 'Admin@123', pin: '1122' },
      { email: 'accountant@transglobalexim.com', name: 'Sunil Narang (Chief Accountant)', role: 'accountant', pass: 'Accounts@123', pin: '3344' },
      { email: 'logistics@transglobalexim.com', name: 'Ananya Deshmukh (Logistics Exec)', role: 'logistics', pass: 'Logistics@123', pin: '7788' },
      { email: 'cha@transglobalexim.com', name: 'Rajesh Sharma (CHA Partner)', role: 'cha_agent', pass: 'ChaBroker@123', pin: '5566' }
    ];

    const checkUser = db.prepare('SELECT id FROM users WHERE email = ?');
    const insUser = db.prepare("INSERT INTO users (tenant_id, name, email, password_hash, role, pin_code, status) VALUES (?, ?, ?, ?, ?, ?, 'active')");
    const updUser = db.prepare("UPDATE users SET tenant_id = ?, name = ?, role = ?, pin_code = ?, status = 'active' WHERE email = ?");

    for (const u of personaUsers) {
      const existing = checkUser.get(u.email);
      if (!existing) {
        insUser.run(tenantId, u.name, u.email, bcrypt.hashSync(u.pass, 10), u.role, u.pin);
      } else {
        updUser.run(tenantId, u.name, u.role, u.pin, u.email);
      }
    }

    // Seed True Landed Cost Engine
    const landedCount = db.prepare('SELECT COUNT(*) as count FROM exim_landed_costs WHERE tenant_id = ?').get(tenantId).count;
    if (landedCount === 0) {
      const insLanded = db.prepare(`
        INSERT INTO exim_landed_costs (
          tenant_id, shipment_id, shipment_number, invoice_number, currency,
          exchange_rate_booking, exchange_rate_customs, fob_cif_value_fcy, fob_cif_value_inr,
          ocean_air_freight_inr, marine_insurance_inr, terminal_handling_inr, basic_customs_duty_inr,
          sws_surcharge_inr, igst_tax_inr, inland_transport_inr, other_clearance_inr,
          total_landed_cost_inr, total_quantity, landed_cost_per_unit, selling_rate_unit,
          gross_profit_spread, allocation_method, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const ship1 = db.prepare("SELECT id FROM exim_shipments WHERE tenant_id = ? AND trade_type = 'IMPORT' LIMIT 1").get(tenantId);

      // Item 1: Bulk Pharma Intermediate (Nhava Sheva Sea Port)
      insLanded.run(
        tenantId,
        ship1 ? ship1.id : null,
        'IMP-2026-0042',
        'INV-MRK-90812',
        'USD',
        84.50,
        84.80,
        42500.00,
        3591250.00,
        185000.00,
        18000.00,
        34500.00,
        269343.00,
        26934.00,
        703985.00,
        28000.00,
        0.00,
        4857012.00,
        5000,
        971.40,
        1450.00,
        478.60,
        'value_pct',
        'finalized'
      );

      // Item 2: Tokyo Chemical API Intermediates (Air Cargo Sahar)
      insLanded.run(
        tenantId,
        null,
        'IMP-2026-0078',
        'INV-TKY-44102',
        'USD',
        84.20,
        84.50,
        18400.00,
        1554800.00,
        142000.00,
        9200.00,
        18500.00,
        116610.00,
        11661.00,
        304600.00,
        12000.00,
        0.00,
        2169371.00,
        2000,
        1084.68,
        1600.00,
        515.32,
        'value_pct',
        'finalized'
      );
    }

    // Seed Forex Loss/Gain Ledger
    const fxCount = db.prepare('SELECT COUNT(*) as count FROM exim_fx_ledger WHERE tenant_id = ?').get(tenantId).count;
    if (fxCount === 0) {
      const insFx = db.prepare(`
        INSERT INTO exim_fx_ledger (
          tenant_id, shipment_number, invoice_number, currency, fcy_amount,
          booking_date, booking_rate, booking_inr, settlement_date, settlement_rate, settlement_inr,
          fx_gain_loss_inr, booking_type, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insFx.run(
        tenantId, 'EXP-26-000001', 'EXP-INV-2026-081', 'USD', 48500.00,
        '2026-09-15', 84.10, 4078850.00, '2026-10-08', 84.50, 4098250.00,
        19400.00, 'REALIZED', 'Realized FX gain booked on HDFC Overseas Bank e-BRC inward realization.'
      );

      insFx.run(
        tenantId, 'EXP-26-000002', 'EXP-26-000001', 'AED', 18500.00,
        '2026-09-20', 22.80, 421800.00, '2026-10-09', 23.05, 426425.00,
        4625.00, 'REALIZED', 'Realized FX gain booked on SBI Forex branch inward Dubai remittance.'
      );

      insFx.run(
        tenantId, 'IMP-2026-0042', 'INV-MRK-90812', 'USD', 42500.00,
        '2026-09-10', 84.15, 3576375.00, '2026-10-04', 84.65, 3597625.00,
        -21250.00, 'REALIZED', 'Realized FX loss incurred on supplier import payment via wire transfer.'
      );
    }

    // Seed Container Milestone Matrix & Demurrage
    const contCount = db.prepare('SELECT COUNT(*) as count FROM exim_containers WHERE tenant_id = ?').get(tenantId).count;
    if (contCount === 0) {
      const insCont = db.prepare(`
        INSERT INTO exim_containers (
          tenant_id, container_number, container_size_type, shipment_number, carrier_line,
          vessel_name, voyage_no, current_milestone, origin_port, discharge_port, current_location,
          gate_in_origin_date, sailing_date, discharge_date, ooc_date, delivered_date,
          shipping_line_free_days, cfs_free_days, daily_demurrage_rate_usd, daily_demurrage_rate_inr,
          accrued_demurrage_usd, accrued_demurrage_inr, demurrage_status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // Container 1: Safe (10 days remaining)
      insCont.run(
        tenantId, 'MSKU-908123-4', '40HC', 'IMP-2026-0042', 'Maersk Line',
        'Maersk Mc-Kinney Moller', 'V.2610E', 'customs_hold', 'Hamburg Port', 'Nhava Sheva (INNSA1)',
        'Gateway Distriparks CFS, Nhava Sheva',
        '2026-09-12', '2026-09-15', '2026-10-07', '2026-10-09', null,
        14, 3, 65.00, 5500.00,
        0.00, 0.00, 'safe', 'Cargo cleared customs examination. In CFS yard awaiting factory carting.'
      );

      // Container 2: Approaching Expiry (2 days remaining)
      insCont.run(
        tenantId, 'MEDU-441092-8', '40HC', 'IMP-2026-0055', 'MSC Mediterranean',
        'MSC Oscar', 'V.9011W', 'port_arrived', 'Jebel Ali Port', 'Mundra Port (INMUN1)',
        'Adani Mundra International Container Terminal',
        '2026-09-22', '2026-09-25', '2026-09-29', null, null,
        14, 3, 75.00, 6300.00,
        0.00, 0.00, 'approaching_expiry', 'Discharge complete 12 days ago. Free time expires in 2 days. Urgent destuffing required!'
      );

      // Container 3: Overdue Penalty (4 days penalty incurred)
      insCont.run(
        tenantId, 'HLCU-772910-1', '20GP', 'IMP-2026-0031', 'Hapag-Lloyd',
        'Antwerpen Express', 'V.4402', 'customs_hold', 'Antwerp Port', 'ICD Tughlakabad (INTKD6)',
        'CONCOR TKD Dry Port Rail Siding',
        '2026-09-02', '2026-09-06', '2026-09-23', null, null,
        14, 3, 65.00, 5500.00,
        260.00, 22000.00, 'overdue_penalty', 'Container has exceeded 14 shipping line free days by 4 days. Detention liability accruing at $65/day.'
      );
    }

    // Seed Pre-Filing Checklists
    const chkCount = db.prepare('SELECT COUNT(*) as count FROM exim_checklists WHERE tenant_id = ?').get(tenantId).count;
    if (chkCount === 0) {
      const insChk = db.prepare(`
        INSERT INTO exim_checklists (
          tenant_id, shipment_number, clearance_type, document_ref_no, cha_agency_name,
          cha_verifier_name, iec_ad_code_verified, hsn_classification_verified, invoice_packing_list_match,
          origin_cert_verified, fssai_adc_noc_verified, customs_duty_assessed_verified, status,
          verified_at, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insChk.run(
        tenantId, 'IMP-2026-0042', 'IMPORT_BOE', 'BOE-8912044', 'Maritime & Cargo Customs Brokers LLP',
        'Rajesh Sharma (Rule 6 Certified CHA)', 1, 1, 1, 1, 1, 1, 'icegate_filed',
        '2026-10-02 14:30:00', 'Pre-filing checklist 100% verified. Drug Controller NOC verified on ICEGATE Single Window. OOC issued.'
      );

      insChk.run(
        tenantId, 'EXP-26-000001', 'EXPORT_SB', 'SB-7190281', 'Maritime & Cargo Customs Brokers LLP',
        'Rajesh Sharma (Rule 6 Certified CHA)', 1, 1, 1, 1, 1, 1, 'approved_for_filing',
        '2026-10-07 11:15:00', 'Export checklist approved under GST LUT bond. Shipping Bill generated and Let Export Order LEO issued.'
      );

      insChk.run(
        tenantId, 'IMP-2026-0078', 'IMPORT_BOE', 'BOE-8945112', 'Maritime & Cargo Customs Brokers LLP',
        'Rajesh Sharma (Rule 6 Certified CHA)', 1, 1, 1, 1, 0, 1, 'pending_cha_review',
        '2026-10-10 16:45:00', 'Commercial invoice matches packing list. ADC (Assistant Drug Controller) physical inspection pending.'
      );
    }

    // Seed Secure DMS Documents
    const docCount = db.prepare('SELECT COUNT(*) as count FROM exim_documents WHERE tenant_id = ?').get(tenantId).count;
    if (docCount === 0) {
      const insDoc = db.prepare(`
        INSERT INTO exim_documents (
          tenant_id, shipment_number, doc_category, doc_title, file_name,
          file_size_kb, uploaded_by_name, uploaded_by_role, verification_status, verified_by, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insDoc.run(
        tenantId, 'IMP-2026-0042', 'bill_of_lading', 'Master Ocean Bill of Lading (Maersk)',
        'BL-MAEU-9081234.pdf', 385, 'Ananya Deshmukh', 'logistics', 'verified', 'Rajesh Sharma (CHA)',
        'Original negotiable Bill of Lading endorsed and surrendered for Delivery Order.'
      );

      insDoc.run(
        tenantId, 'IMP-2026-0042', 'bill_of_entry', 'Customs Bill of Entry (Out of Charge)',
        'BOE-8912044-OOC.pdf', 412, 'Rajesh Sharma', 'cha_agent', 'verified', 'Customs Appraiser Gr-II',
        'Signed Out of Charge (OOC) copy downloaded from ICEGATE portal.'
      );

      insDoc.run(
        tenantId, 'IMP-2026-0042', 'commercial_invoice', 'Merck KGaA Commercial Invoice',
        'INV-MRK-90812.pdf', 218, 'Sunil Narang', 'accountant', 'verified', 'Rajesh Sharma (CHA)',
        'Original signed Commercial Invoice with CIF valuation.'
      );

      insDoc.run(
        tenantId, 'EXP-26-000001', 'shipping_bill', 'Export Shipping Bill (Let Export Order)',
        'SB-7190281-LEO.pdf', 290, 'Rajesh Sharma', 'cha_agent', 'verified', 'Superintendent of Customs',
        'LEO Shipping Bill stamped under zero-rated export LUT bond.'
      );

      insDoc.run(
        tenantId, 'EXP-26-000001', 'fssai_cert', 'Central FSSAI Export Compliance Certificate',
        'FSSAI-EXP-10022026001928.pdf', 184, 'Ananya Deshmukh', 'logistics', 'verified', 'FSSAI Port Officer',
        'Section 23 statutory compliance certificate for health powders & botanicals.'
      );

      insDoc.run(
        tenantId, 'EXP-26-000001', 'origin_cert', 'Chamber of Commerce Certificate of Origin',
        'COO-IN-2026-88192.pdf', 145, 'Ananya Deshmukh', 'logistics', 'verified', 'FIEO Trade Desk',
        'Non-preferential Certificate of Origin for Dubai Port customs entry.'
      );
    }
  } catch (err) {
    console.error(`Error seeding import/export for tenant ${tenantId}:`, err);
  }
}

initDatabase();

module.exports = {
  db,
  initDatabase,
  dbPath,
  seedTenantLabData,
  seedTenantImportExportData
};
