const bcrypt = require('bcryptjs');
const { db } = require('./db');

function seedDatabase() {
  console.log('Seeding Nexa ERP Enterprise Suite (SpringNexa Private Limited)...');

  // Clear existing tables
  db.exec(`
    DELETE FROM security_audit_logs;
    DELETE FROM active_sessions;
    DELETE FROM sales_items;
    DELETE FROM sales_invoices;
    DELETE FROM customer_ledger;
    DELETE FROM batches;
    DELETE FROM products;
    DELETE FROM customers;
    DELETE FROM suppliers;
    DELETE FROM held_bills;
    DELETE FROM settings;
    DELETE FROM users;
    DELETE FROM tenants;
    DELETE FROM expenses;
    DELETE FROM chart_of_accounts;
    DELETE FROM employees;
    DELETE FROM employee_attendance;
    DELETE FROM payroll_records;
    DELETE FROM sales_returns;
    DELETE FROM sales_return_items;
    DELETE FROM supplier_returns;
    DELETE FROM stock_adjustments;
    DELETE FROM promotions;
  `);

  const salt = bcrypt.genSaltSync(10);
  const hashSuperAdmin = bcrypt.hashSync('AdminPassword@123', salt);
  const hashPharmaOwner = bcrypt.hashSync('PharmaOwner@123', salt);
  const hashKiranaOwner = bcrypt.hashSync('KiranaOwner@123', salt);
  const hashCashier = bcrypt.hashSync('Cashier@123', salt);

  // 1. Super Admin User
  db.prepare(`
    INSERT INTO users (tenant_id, name, email, password_hash, role, pin_code, status)
    VALUES (NULL, 'SpringNexa Super Admin', 'admin@springnexa.com', ?, 'super_admin', '9999', 'active')
  `).run(hashSuperAdmin);

  const insertTenant = db.prepare(`
    INSERT INTO tenants (
      slug, name, business_type, owner_name, owner_email, owner_phone,
      plan, plan_status, monthly_fee, store_address, gstin, dl_number, fssai_number, upi_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const setSetting = db.prepare('INSERT INTO settings (tenant_id, key, value) VALUES (?, ?, ?)');

  // ==========================================
  // TENANT 1: Sanjeevani Medicos (Pharma SaaS)
  // ==========================================
  const t1 = insertTenant.run(
    'sanjeevani-pharma', 'Sanjeevani Medicos & Healthcare', 'pharma',
    'Dr. Sanjay Verma', 'sanjay@sanjeevanimeds.in', '+91 98111 22334',
    'pro', 'active', 1499,
    'Shop 4, Civil Hospital Road, Central Market', '27AABCV1234F1Z5',
    'DL-20B/Verma-9812, DL-21B/Verma-9813', null, 'sanjeevani@upi'
  );
  const tenant1Id = t1.lastInsertRowid;

  setSetting.run(tenant1Id, 'business_type', 'pharma');
  setSetting.run(tenant1Id, 'store_name', 'Sanjeevani Medicos & Healthcare');
  setSetting.run(tenant1Id, 'phone', '+91 98111 22334');
  setSetting.run(tenant1Id, 'store_address', 'Shop 4, Civil Hospital Road, Central Market');
  setSetting.run(tenant1Id, 'gstin', '27AABCV1234F1Z5');
  setSetting.run(tenant1Id, 'dl_number', 'DL-20B/Verma-9812, DL-21B/Verma-9813');
  setSetting.run(tenant1Id, 'upi_id', 'sanjeevani@upi');
  setSetting.run(tenant1Id, 'printer_format', 'thermal80');
  setSetting.run(tenant1Id, 'footer_message', 'Get well soon! Powered by Nexa ERP (SpringNexa)');

  db.prepare(`
    INSERT INTO users (tenant_id, name, email, password_hash, role, pin_code, status)
    VALUES (?, 'Dr. Sanjay Verma (Owner)', 'sanjay@sanjeevanimeds.in', ?, 'tenant_admin', '1111', 'active')
  `).run(tenant1Id, hashPharmaOwner);

  db.prepare(`
    INSERT INTO users (tenant_id, name, email, password_hash, role, pin_code, status)
    VALUES (?, 'Rohan Sharma (Cashier)', 'rohan@sanjeevanimeds.in', ?, 'cashier', '1234', 'active')
  `).run(tenant1Id, hashCashier);

  const sup1 = db.prepare(`
    INSERT INTO suppliers (tenant_id, name, phone, email, address, gstin, current_balance)
    VALUES (?, 'Medico Life Pharma Agency', '9811122233', 'orders@medicolife.in', 'G-4 Medicine Market', '27AABCM1122P1Z4', 12500)
  `).run(tenant1Id).lastInsertRowid;

  const c1 = db.prepare(`
    INSERT INTO customers (tenant_id, name, phone, address, credit_limit, current_balance, loyalty_points)
    VALUES (?, 'Ramesh Sharma', '9823011223', 'Flat 402, Green Valley Apts', 5000, 1420, 45)
  `).run(tenant1Id).lastInsertRowid;

  const c2 = db.prepare(`
    INSERT INTO customers (tenant_id, name, phone, address, credit_limit, current_balance, loyalty_points)
    VALUES (?, 'Priya Patel', '9876123450', 'B-12 Shanti Nagar', 3000, 450, 20)
  `).run(tenant1Id).lastInsertRowid;

  const insertProd = db.prepare(`
    INSERT INTO products (
      tenant_id, name, barcode, category, brand, hsn_code, gst_rate,
      salt_composition, schedule_type, pack_unit, sub_units_per_pack, allow_loose_sale,
      unit_type, is_loose_item, is_quick_pick, min_stock_alert
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBatch = db.prepare(`
    INSERT INTO batches (
      tenant_id, product_id, batch_number, mfg_date, expiry_date,
      purchase_rate, mrp, selling_rate, stock_units, loose_stock_units, supplier_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const pDolo = insertProd.run(
    tenant1Id, 'Dolo 650 Tablet', '8901117101234', 'Analgesic / Antipyretic', 'Micro Labs', '3004', 12,
    'Paracetamol 650mg', 'Regular', 'Strip', 15, 1, 'pcs', 0, 1, 10
  ).lastInsertRowid;
  insertBatch.run(tenant1Id, pDolo, 'DL24A01', '2024-05-01', '2026-11-20', 22.0, 34.50, 31.00, 14, 0, sup1);
  insertBatch.run(tenant1Id, pDolo, 'DL24B09', '2025-01-10', '2027-12-31', 22.5, 34.50, 31.00, 85, 0, sup1);

  const pAug = insertProd.run(
    tenant1Id, 'Augmentin 625 Duo Tablet', '8901117202345', 'Antibiotic', 'GSK', '3004', 12,
    'Amoxicillin 500mg + Clavulanic Acid 125mg', 'Schedule H', 'Strip', 10, 1, 'pcs', 0, 1, 5
  ).lastInsertRowid;
  insertBatch.run(tenant1Id, pAug, 'AUG9912', '2025-02-01', '2027-08-31', 145.0, 204.00, 185.00, 22, 0, sup1);

  const pPan = insertProd.run(
    tenant1Id, 'Pan 40 Tablet', '8901117303456', 'Antacid / PPI', 'Alkem', '3004', 12,
    'Pantoprazole Sodium 40mg', 'Regular', 'Strip', 15, 1, 'pcs', 0, 1, 10
  ).lastInsertRowid;
  insertBatch.run(tenant1Id, pPan, 'PAN4402', '2025-01-15', '2027-06-30', 98.0, 155.00, 140.00, 40, 0, sup1);

  // Tenant 1 Enterprise Data: Expenses, Employees, Promotions
  db.prepare(`
    INSERT INTO expenses (tenant_id, category, amount, payment_mode, reference_no, paid_to, notes, expense_date)
    VALUES (?, 'Rent', 18000, 'bank', 'RENT-OCT', 'Market Complex Landlord', 'Monthly Pharmacy Store Rent', '2026-10-01')
  `).run(tenant1Id);
  db.prepare(`
    INSERT INTO expenses (tenant_id, category, amount, payment_mode, reference_no, paid_to, notes, expense_date)
    VALUES (?, 'Electricity', 3200, 'upi', 'ELEC-9912', 'State Power Distribution', 'Air conditioner and refrigerator bill', '2026-10-03')
  `).run(tenant1Id);

  // Employees
  const emp1 = db.prepare(`
    INSERT INTO employees (tenant_id, name, phone, email, designation, base_salary, joining_date)
    VALUES (?, 'Rohan Sharma', '+91 98222 11001', 'rohan@sanjeevanimeds.in', 'Counter Pharmacist', 22000, '2024-01-15')
  `).run(tenant1Id).lastInsertRowid;
  const emp2 = db.prepare(`
    INSERT INTO employees (tenant_id, name, phone, email, designation, base_salary, joining_date)
    VALUES (?, 'Kavita Joshi', '+91 98333 22002', 'kavita@sanjeevanimeds.in', 'Inventory Manager', 25000, '2023-06-01')
  `).run(tenant1Id).lastInsertRowid;

  // Attendance
  db.prepare(`
    INSERT INTO employee_attendance (tenant_id, employee_id, date, status, check_in_time, notes)
    VALUES (?, ?, CURRENT_DATE, 'PRESENT', '09:00 AM', 'On shift at counter 1')
  `).run(tenant1Id, emp1);
  db.prepare(`
    INSERT INTO employee_attendance (tenant_id, employee_id, date, status, check_in_time, notes)
    VALUES (?, ?, CURRENT_DATE, 'PRESENT', '08:45 AM', 'Warehouse inspection')
  `).run(tenant1Id, emp2);

  // Promotions
  db.prepare(`
    INSERT INTO promotions (tenant_id, code, title, discount_type, discount_value, min_order_amount, max_discount)
    VALUES (?, 'HEALTH10', '10% Off on Wellness & OTC', 'PERCENTAGE', 10, 500, 150)
  `).run(tenant1Id);

  // ==========================================
  // TENANT 2: Laxmi Kirana (Kiryana SaaS)
  // ==========================================
  const t2 = insertTenant.run(
    'laxmi-kirana', 'Laxmi Kirana & Provision Superstore', 'kiryana',
    'Rajesh Agarwal', 'rajesh@laxmikirana.in', '+91 98222 33445',
    'starter', 'active', 799,
    'Plot 18, APMC Market Gate 2, Navi Bazaar', '27AABCR9988C1Z3',
    null, '11521019000888', 'laxmikirana@upi'
  );
  const tenant2Id = t2.lastInsertRowid;

  setSetting.run(tenant2Id, 'business_type', 'kiryana');
  setSetting.run(tenant2Id, 'store_name', 'Laxmi Kirana & Provision Superstore');
  setSetting.run(tenant2Id, 'phone', '+91 98222 33445');
  setSetting.run(tenant2Id, 'store_address', 'Plot 18, APMC Market Gate 2, Navi Bazaar');
  setSetting.run(tenant2Id, 'gstin', '27AABCR9988C1Z3');
  setSetting.run(tenant2Id, 'fssai_number', '11521019000888');
  setSetting.run(tenant2Id, 'upi_id', 'laxmikirana@upi');
  setSetting.run(tenant2Id, 'printer_format', 'thermal80');
  setSetting.run(tenant2Id, 'footer_message', 'Thank you for shopping at Laxmi Kirana! Powered by Nexa ERP (SpringNexa)');

  db.prepare(`
    INSERT INTO users (tenant_id, name, email, password_hash, role, pin_code, status)
    VALUES (?, 'Rajesh Agarwal (Owner)', 'rajesh@laxmikirana.in', ?, 'tenant_admin', '2222', 'active')
  `).run(tenant2Id, hashKiranaOwner);

  db.prepare(`
    INSERT INTO users (tenant_id, name, email, password_hash, role, pin_code, status)
    VALUES (?, 'Anil Kumar (Cashier)', 'anil@laxmikirana.in', ?, 'cashier', '1234', 'active')
  `).run(tenant2Id, hashCashier);

  const sup2 = db.prepare(`
    INSERT INTO suppliers (tenant_id, name, phone, email, address, gstin, current_balance)
    VALUES (?, 'Apex FMCG Wholesalers', '9822233344', 'sales@apexfmcg.com', 'APMC Grain Yard', '27AABCA9988G1Z1', 8400)
  `).run(tenant2Id).lastInsertRowid;

  const c3 = db.prepare(`
    INSERT INTO customers (tenant_id, name, phone, address, credit_limit, current_balance, loyalty_points)
    VALUES (?, 'Sunita Gupta', '9898981234', 'Near Jain Temple', 4000, 2850, 110)
  `).run(tenant2Id).lastInsertRowid;

  const pAtta = insertProd.run(
    tenant2Id, 'Aashirvaad Shudh Chakki Atta 10kg', '8901030382341', 'Flours & Grains', 'ITC', '1101', 5,
    null, 'Regular', 'Bag', 1, 0, 'packet', 0, 1, 10
  ).lastInsertRowid;
  insertBatch.run(tenant2Id, pAtta, 'AT2026', '2026-08-01', '2027-02-28', 390.0, 480.00, 445.00, 30, 0, sup2);

  const pOil = insertProd.run(
    tenant2Id, 'Fortune Sunlite Refined Sunflower Oil 1L', '8906007280014', 'Edible Oils', 'Adani Wilmar', '1512', 5,
    null, 'Regular', 'Pouch', 1, 0, 'packet', 0, 1, 15
  ).lastInsertRowid;
  insertBatch.run(tenant2Id, pOil, 'FOR771', '2026-07-01', '2027-04-30', 112.0, 145.00, 132.00, 45, 0, sup2);

  const pRice = insertProd.run(
    tenant2Id, 'Loose Premium Basmati Rice (per kg)', null, 'Rice & Grains', 'Local Wholesale', '1006', 0,
    null, 'Regular', 'Kg', 1, 0, 'kg', 1, 1, 50
  ).lastInsertRowid;
  insertBatch.run(tenant2Id, pRice, 'LOT-RICE-OCT', '2026-09-01', '2027-09-01', 75.0, 110.00, 95.00, 240, 0, sup2);

  const pSugar = insertProd.run(
    tenant2Id, 'Loose Premium Sugar M-30 (per kg)', null, 'Staples & Sweeteners', 'Co-op Mill', '1701', 5,
    null, 'Regular', 'Kg', 1, 0, 'kg', 1, 1, 100
  ).lastInsertRowid;
  insertBatch.run(tenant2Id, pSugar, 'LOT-SUGAR-01', '2026-08-15', '2027-08-15', 38.0, 48.00, 44.00, 450, 0, sup2);

  // Tenant 2 Enterprise Expenses & Promo
  db.prepare(`
    INSERT INTO expenses (tenant_id, category, amount, payment_mode, reference_no, paid_to, notes, expense_date)
    VALUES (?, 'Rent', 12000, 'cash', 'RENT-KIRANA', 'Bazaar Trust', 'APMC Shop rent', '2026-10-01')
  `).run(tenant2Id);
  db.prepare(`
    INSERT INTO expenses (tenant_id, category, amount, payment_mode, reference_no, paid_to, notes, expense_date)
    VALUES (?, 'Delivery', 1400, 'cash', 'DEL-01', 'Auto Rickshaw Cargo', 'Bulk flour & oil transport from mandi', '2026-10-04')
  `).run(tenant2Id);

  db.prepare(`
    INSERT INTO promotions (tenant_id, code, title, discount_type, discount_value, min_order_amount)
    VALUES (?, 'RATION50', 'Flat ₹50 Off on Monthly Ration above ₹1500', 'FLAT', 50, 1500)
  `).run(tenant2Id);

  // Sample Stock Adjustment Log (Physical audit & damage)
  db.prepare(`
    INSERT INTO stock_adjustments (tenant_id, adjustment_number, product_id, product_name, batch_id, batch_number, adjustment_type, quantity, loss_value, reason, audited_by)
    VALUES (?, 'ADJ-1029', ?, 'Loose Premium Sugar M-30 (per kg)', 4, 'LOT-SUGAR-01', 'DAMAGE_WRITEOFF', 2.5, 95, 'Bag torn during unloading', 'Rajesh Agarwal')
  `).run(tenant2Id, pSugar);

  console.log('Nexa ERP Enterprise Database Seeded with Accounting, HRM, Audits, and Promotions!');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
