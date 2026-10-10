const express = require('express');
const router = express.Router();
const { db } = require('../db');

// =========================================================================
// 1. LAB MIS ANALYTICS & EXECUTIVE DASHBOARD
// =========================================================================
router.get('/analytics', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const today = new Date().toISOString().slice(0, 10);

    // Order & Revenue KPIs
    const totalOrders = db.prepare('SELECT COUNT(*) as c FROM lab_orders WHERE tenant_id = ?').get(tenantId).c;
    const todayOrders = db.prepare('SELECT COUNT(*) as c FROM lab_orders WHERE tenant_id = ? AND date(created_at) = ?').get(tenantId, today).c;
    
    const pendingSamples = db.prepare("SELECT COUNT(*) as c FROM lab_orders WHERE tenant_id = ? AND sample_status = 'pending'").get(tenantId).c;
    const processingOrders = db.prepare("SELECT COUNT(*) as c FROM lab_orders WHERE tenant_id = ? AND order_status IN ('registered', 'sample_collected', 'processing')").get(tenantId).c;
    const completedReports = db.prepare("SELECT COUNT(*) as c FROM lab_orders WHERE tenant_id = ? AND order_status IN ('completed', 'verified', 'delivered')").get(tenantId).c;
    const verifiedReports = db.prepare("SELECT COUNT(*) as c FROM lab_orders WHERE tenant_id = ? AND order_status = 'verified'").get(tenantId).c;

    const financialStats = db.prepare(`
      SELECT 
        COALESCE(SUM(net_amount), 0) as total_revenue,
        COALESCE(SUM(paid_amount), 0) as total_collected,
        COALESCE(SUM(balance_due), 0) as total_due,
        COALESCE(SUM(referring_doctor_commission), 0) as total_commission
      FROM lab_orders
      WHERE tenant_id = ?
    `).get(tenantId);

    const todayStats = db.prepare(`
      SELECT 
        COALESCE(SUM(net_amount), 0) as today_revenue,
        COALESCE(SUM(paid_amount), 0) as today_collected
      FROM lab_orders
      WHERE tenant_id = ? AND date(created_at) = ?
    `).get(tenantId, today);

    // Department Distribution
    const departmentBreakdown = db.prepare(`
      SELECT 
        COALESCE(i.department, 'General') as department,
        COUNT(*) as test_count,
        COALESCE(SUM(i.price), 0) as revenue
      FROM lab_order_items i
      WHERE i.tenant_id = ?
      GROUP BY i.department
      ORDER BY test_count DESC
    `).all(tenantId);

    // Top Booked Tests
    const topTests = db.prepare(`
      SELECT 
        item_name,
        department,
        COUNT(*) as order_count,
        COALESCE(SUM(price), 0) as total_amount
      FROM lab_order_items
      WHERE tenant_id = ?
      GROUP BY item_name
      ORDER BY order_count DESC
      LIMIT 5
    `).all(tenantId);

    // Recent 5 Orders
    const recentOrders = db.prepare(`
      SELECT *
      FROM lab_orders
      WHERE tenant_id = ?
      ORDER BY id DESC
      LIMIT 6
    `).all(tenantId);

    res.json({
      success: true,
      kpis: {
        totalOrders,
        todayOrders,
        pendingSamples,
        processingOrders,
        completedReports,
        verifiedReports,
        tatCompliancePercent: totalOrders > 0 ? Math.round((verifiedReports / totalOrders) * 100) : 100,
        ...financialStats,
        ...todayStats
      },
      departmentBreakdown,
      topTests,
      recentOrders
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 2. LAB TEST CATALOG & PARAMETERS
// =========================================================================
// List all tests
router.get('/tests', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { department, search } = req.query;

    let sql = `
      SELECT t.*, 
        (SELECT COUNT(*) FROM lab_test_parameters WHERE test_id = t.id) as parameter_count
      FROM lab_tests t
      WHERE t.tenant_id = ?
    `;
    const params = [tenantId];

    if (department && department !== 'all') {
      sql += ' AND t.department = ?';
      params.push(department);
    }
    if (search) {
      sql += ' AND (t.test_code LIKE ? OR t.test_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY t.department ASC, t.test_name ASC';

    const tests = db.prepare(sql).all(...params);
    res.json(tests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single test with parameters
router.get('/tests/:id', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const test = db.prepare('SELECT * FROM lab_tests WHERE id = ? AND tenant_id = ?').get(req.params.id, tenantId);
    if (!test) return res.status(404).json({ error: 'Test not found' });

    const parameters = db.prepare(`
      SELECT * FROM lab_test_parameters 
      WHERE test_id = ? AND tenant_id = ? 
      ORDER BY sort_order ASC, id ASC
    `).all(test.id, tenantId);

    res.json({ ...test, parameters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new lab test with parameters
router.post('/tests', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const {
      test_code,
      test_name,
      department,
      sample_type,
      tube_color,
      tat_hours,
      price,
      cost,
      doctor_commission_percent,
      description,
      parameters
    } = req.body;

    if (!test_code || !test_name || !department || !sample_type || price === undefined) {
      return res.status(400).json({ error: 'Test code, name, department, sample type, and price are required' });
    }

    const insertTest = db.prepare(`
      INSERT INTO lab_tests (
        tenant_id, test_code, test_name, department, sample_type, tube_color,
        tat_hours, price, cost, doctor_commission_percent, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertTest.run(
      tenantId,
      String(test_code).toUpperCase().trim(),
      String(test_name).trim(),
      department,
      sample_type,
      tube_color || 'Purple (EDTA)',
      Number(tat_hours) || 4,
      Number(price),
      Number(cost) || 0,
      Number(doctor_commission_percent) || 15,
      description || null
    );

    const testId = result.lastInsertRowid;

    if (Array.isArray(parameters) && parameters.length > 0) {
      const insertParam = db.prepare(`
        INSERT INTO lab_test_parameters (
          tenant_id, test_id, parameter_name, unit, reference_range_min,
          reference_range_max, reference_range_text, critical_low, critical_high,
          method, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      parameters.forEach((p, idx) => {
        insertParam.run(
          tenantId,
          testId,
          p.parameter_name,
          p.unit || null,
          p.reference_range_min !== undefined ? p.reference_range_min : null,
          p.reference_range_max !== undefined ? p.reference_range_max : null,
          p.reference_range_text || null,
          p.critical_low !== undefined ? p.critical_low : null,
          p.critical_high !== undefined ? p.critical_high : null,
          p.method || null,
          p.sort_order || idx + 1
        );
      });
    }

    const created = db.prepare('SELECT * FROM lab_tests WHERE id = ?').get(testId);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update test
router.put('/tests/:id', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const testId = req.params.id;
    const {
      test_code,
      test_name,
      department,
      sample_type,
      tube_color,
      tat_hours,
      price,
      cost,
      doctor_commission_percent,
      description,
      status
    } = req.body;

    db.prepare(`
      UPDATE lab_tests SET
        test_code = COALESCE(?, test_code),
        test_name = COALESCE(?, test_name),
        department = COALESCE(?, department),
        sample_type = COALESCE(?, sample_type),
        tube_color = COALESCE(?, tube_color),
        tat_hours = COALESCE(?, tat_hours),
        price = COALESCE(?, price),
        cost = COALESCE(?, cost),
        doctor_commission_percent = COALESCE(?, doctor_commission_percent),
        description = COALESCE(?, description),
        status = COALESCE(?, status)
      WHERE id = ? AND tenant_id = ?
    `).run(
      test_code, test_name, department, sample_type, tube_color,
      tat_hours, price, cost, doctor_commission_percent, description,
      status, testId, tenantId
    );

    const updated = db.prepare('SELECT * FROM lab_tests WHERE id = ?').get(testId);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 3. LAB PACKAGES & HEALTH CHECKUP PROFILES
// =========================================================================
router.get('/packages', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const packages = db.prepare('SELECT * FROM lab_packages WHERE tenant_id = ? ORDER BY id DESC').all(tenantId);
    
    // Parse tests included and expand names
    const expanded = packages.map(pkg => {
      let testIds = [];
      try { testIds = JSON.parse(pkg.tests_included); } catch {}
      let tests = [];
      if (testIds.length > 0) {
        const placeholders = testIds.map(() => '?').join(',');
        tests = db.prepare(`SELECT id, test_code, test_name, department, price FROM lab_tests WHERE id IN (${placeholders})`).all(...testIds);
      }
      return {
        ...pkg,
        testIds,
        tests
      };
    });

    res.json(expanded);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/packages', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { package_code, package_name, description, tests_included, package_price, original_price } = req.body;

    if (!package_code || !package_name || !package_price) {
      return res.status(400).json({ error: 'Package code, name, and package price are required' });
    }

    const result = db.prepare(`
      INSERT INTO lab_packages (
        tenant_id, package_code, package_name, description, tests_included, package_price, original_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      tenantId,
      String(package_code).toUpperCase().trim(),
      String(package_name).trim(),
      description || null,
      JSON.stringify(tests_included || []),
      Number(package_price),
      Number(original_price) || Number(package_price)
    );

    const created = db.prepare('SELECT * FROM lab_packages WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 4. PATIENT LAB ORDERS / TEST REQUISITIONS
// =========================================================================
router.get('/orders', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { status, date, search } = req.query;

    let sql = 'SELECT * FROM lab_orders WHERE tenant_id = ?';
    const params = [tenantId];

    if (status && status !== 'all') {
      sql += ' AND order_status = ?';
      params.push(status);
    }
    if (date) {
      sql += ' AND date(created_at) = ?';
      params.push(date);
    }
    if (search) {
      sql += ' AND (order_no LIKE ? OR patient_name LIKE ? OR barcode LIKE ? OR patient_phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY id DESC LIMIT 100';

    const orders = db.prepare(sql).all(...params);

    // Attach items preview to each order
    const withItems = orders.map(ord => {
      const items = db.prepare('SELECT item_name, department, price FROM lab_order_items WHERE order_id = ?').all(ord.id);
      return {
        ...ord,
        items
      };
    });

    res.json(withItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Single Order with full details, parameters and results
router.get('/orders/:id', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const order = db.prepare('SELECT * FROM lab_orders WHERE id = ? AND tenant_id = ?').get(req.params.id, tenantId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const items = db.prepare('SELECT * FROM lab_order_items WHERE order_id = ?').all(order.id);
    const results = db.prepare(`
      SELECT r.*, p.unit, p.reference_range_text, p.method, p.sort_order, t.test_name, t.department
      FROM lab_order_results r
      LEFT JOIN lab_test_parameters p ON r.parameter_id = p.id
      LEFT JOIN lab_tests t ON r.test_id = t.id
      WHERE r.order_id = ? AND r.tenant_id = ?
      ORDER BY t.department ASC, r.test_id ASC, p.sort_order ASC
    `).all(order.id, tenantId);

    res.json({
      ...order,
      items,
      results
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Book New Patient Lab Requisition
router.post('/orders', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const {
      patient_name,
      patient_age,
      patient_gender,
      patient_phone,
      patient_email,
      patient_address,
      referring_doctor,
      doctor_id,
      selected_tests = [],   // Array of test objects { id, name, department, price }
      selected_packages = [],// Array of package objects { id, name, price, testIds }
      discount = 0,
      paid_amount = 0,
      payment_mode = 'cash',
      phlebotomist,
      clinical_notes
    } = req.body;

    if (!patient_name) {
      return res.status(400).json({ error: 'Patient name is required' });
    }
    if (selected_tests.length === 0 && selected_packages.length === 0) {
      return res.status(400).json({ error: 'At least one test or health package must be selected' });
    }

    // Generate unique order number and sample barcode
    const today = new Date().toISOString().slice(0, 10);
    const datePrefix = today.replace(/-/g, '').slice(2);
    const orderCountToday = db.prepare('SELECT COUNT(*) as c FROM lab_orders WHERE tenant_id = ? AND date(created_at) = ?')
      .get(tenantId, today).c;
    const order_no = `LAB-T${tenantId}-${datePrefix}-${String(orderCountToday + 1).padStart(3, '0')}`;
    const barcode = `SMP-T${tenantId}-${Math.floor(10000 + Math.random() * 90000)}`;

    // Calculate totals
    const testTotal = selected_tests.reduce((sum, t) => sum + Number(t.price || 0), 0);
    const packageTotal = selected_packages.reduce((sum, p) => sum + Number(p.package_price || p.price || 0), 0);
    const subtotal = testTotal + packageTotal;
    const disc = Number(discount) || 0;
    const net_amount = Math.max(0, subtotal - disc);
    const paid = Number(paid_amount) || 0;
    const balance_due = Math.max(0, net_amount - paid);
    const payment_status = balance_due === 0 ? 'paid' : (paid > 0 ? 'partial' : 'pending');

    // Doctor commission calculation
    let refDoctorName = referring_doctor || 'Self / Direct Walk-in Patient';
    let docCommissionAmount = 0;

    let docRecord = null;
    if (doctor_id) {
      docRecord = db.prepare('SELECT * FROM lab_referral_doctors WHERE id = ? AND tenant_id = ?').get(doctor_id, tenantId);
    } else if (referring_doctor) {
      docRecord = db.prepare('SELECT * FROM lab_referral_doctors WHERE doctor_name = ? AND tenant_id = ?').get(referring_doctor, tenantId);
    }

    if (docRecord && docRecord.commission_percent > 0) {
      refDoctorName = docRecord.doctor_name;
      docCommissionAmount = Number(((net_amount * docRecord.commission_percent) / 100).toFixed(2));
    }

    // Insert order
    const insertOrder = db.prepare(`
      INSERT INTO lab_orders (
        tenant_id, order_no, barcode, patient_name, patient_age, patient_gender,
        patient_phone, patient_email, patient_address, referring_doctor, referring_doctor_commission,
        total_amount, discount, tax_amount, net_amount, paid_amount, balance_due,
        payment_status, payment_mode, order_status, sample_status, phlebotomist, collected_at, clinical_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
    `);

    const orderRes = insertOrder.run(
      tenantId,
      order_no,
      barcode,
      patient_name,
      patient_age ? Number(patient_age) : null,
      patient_gender || 'Other',
      patient_phone || null,
      patient_email || null,
      patient_address || null,
      refDoctorName,
      docCommissionAmount,
      subtotal,
      disc,
      0,
      net_amount,
      paid,
      balance_due,
      payment_status,
      payment_mode,
      'registered',
      'collected',
      phlebotomist || 'Counter Phlebotomist',
      clinical_notes || null
    );

    const orderId = orderRes.lastInsertRowid;

    // Collect all tests to generate parameter slots
    const allTestIdsToInstantiate = new Set();

    // Insert items for tests
    const insertItem = db.prepare(`
      INSERT INTO lab_order_items (tenant_id, order_id, test_id, package_id, item_type, item_name, department, price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `);

    for (const test of selected_tests) {
      insertItem.run(tenantId, orderId, test.id, null, 'test', test.test_name, test.department, Number(test.price));
      allTestIdsToInstantiate.add(test.id);
    }

    // Insert items for packages
    for (const pkg of selected_packages) {
      insertItem.run(tenantId, orderId, null, pkg.id, 'package', pkg.package_name, 'Health Profile', Number(pkg.package_price || pkg.price));
      let pkgTestIds = [];
      try {
        pkgTestIds = Array.isArray(pkg.tests_included) ? pkg.tests_included : JSON.parse(pkg.tests_included);
      } catch {}
      pkgTestIds.forEach(tId => allTestIdsToInstantiate.add(tId));
    }

    // Auto-instantiate parameter results
    const insertResult = db.prepare(`
      INSERT INTO lab_order_results (
        tenant_id, order_id, test_id, parameter_id, parameter_name, result_value,
        unit, reference_range_text, flag, remarks, entered_by
      ) VALUES (?, ?, ?, ?, ?, '', ?, ?, 'normal', null, null)
    `);

    for (const tId of allTestIdsToInstantiate) {
      const params = db.prepare('SELECT * FROM lab_test_parameters WHERE test_id = ? AND tenant_id = ? ORDER BY sort_order ASC').all(tId, tenantId);
      for (const p of params) {
        insertResult.run(
          tenantId,
          orderId,
          tId,
          p.id,
          p.parameter_name,
          p.unit || '',
          p.reference_range_text || ''
        );
      }
    }

    // Update Doctor Ledger if applicable
    if (docRecord && docCommissionAmount > 0) {
      db.prepare(`
        UPDATE lab_referral_doctors SET
          total_referred_orders = total_referred_orders + 1,
          total_commission_earned = total_commission_earned + ?,
          balance_payable = balance_payable + ?
        WHERE id = ? AND tenant_id = ?
      `).run(docCommissionAmount, docCommissionAmount, docRecord.id, tenantId);
    }

    const createdOrder = db.prepare('SELECT * FROM lab_orders WHERE id = ?').get(orderId);
    res.status(201).json(createdOrder);
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update Order Workflow Status
router.put('/orders/:id/status', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { order_status, sample_status, phlebotomist, clinical_notes } = req.body;

    db.prepare(`
      UPDATE lab_orders SET
        order_status = COALESCE(?, order_status),
        sample_status = COALESCE(?, sample_status),
        phlebotomist = COALESCE(?, phlebotomist),
        clinical_notes = COALESCE(?, clinical_notes)
      WHERE id = ? AND tenant_id = ?
    `).run(order_status, sample_status, phlebotomist, clinical_notes, req.params.id, tenantId);

    const updated = db.prepare('SELECT * FROM lab_orders WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 5. CLINICAL RESULTS ENTRY & PATHOLOGIST VERIFICATION
// =========================================================================
// Save observed values with auto-flagging
router.post('/orders/:id/results', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const orderId = req.params.id;
    const { observations = [], entered_by, clinical_notes } = req.body;

    const updateRes = db.prepare(`
      UPDATE lab_order_results SET
        result_value = ?,
        flag = ?,
        remarks = ?,
        entered_by = COALESCE(?, entered_by)
      WHERE id = ? AND order_id = ? AND tenant_id = ?
    `);

    for (const obs of observations) {
      const paramInfo = db.prepare('SELECT * FROM lab_test_parameters WHERE id = ?').get(obs.parameter_id);
      let calculatedFlag = 'normal';

      if (obs.result_value !== '' && paramInfo) {
        const numVal = parseFloat(obs.result_value);
        if (!isNaN(numVal)) {
          if (paramInfo.critical_low !== null && numVal <= paramInfo.critical_low) {
            calculatedFlag = 'critical';
          } else if (paramInfo.critical_high !== null && numVal >= paramInfo.critical_high) {
            calculatedFlag = 'critical';
          } else if (paramInfo.reference_range_min !== null && numVal < paramInfo.reference_range_min) {
            calculatedFlag = 'low';
          } else if (paramInfo.reference_range_max !== null && numVal > paramInfo.reference_range_max) {
            calculatedFlag = 'high';
          }
        }
      }

      updateRes.run(
        String(obs.result_value || ''),
        obs.flag || calculatedFlag,
        obs.remarks || null,
        entered_by || 'Lab Technician',
        obs.id,
        orderId,
        tenantId
      );
    }

    // Advance order status to completed if not yet verified
    db.prepare(`
      UPDATE lab_orders SET
        order_status = CASE WHEN order_status = 'verified' THEN 'verified' ELSE 'completed' END,
        clinical_notes = COALESCE(?, clinical_notes)
      WHERE id = ? AND tenant_id = ?
    `).run(clinical_notes || null, orderId, tenantId);

    res.json({ success: true, message: 'Clinical observations saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pathologist Report Verification & Sign-off
router.post('/orders/:id/verify', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const orderId = req.params.id;
    const { verified_by = 'Dr. K. L. Mehta, MD (Pathologist) [Reg: MCI-48291]' } = req.body;

    db.prepare(`
      UPDATE lab_orders SET
        order_status = 'verified',
        verified_by = ?,
        reported_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `).run(verified_by, orderId, tenantId);

    const verified = db.prepare('SELECT * FROM lab_orders WHERE id = ?').get(orderId);
    res.json({ success: true, message: 'Report verified and signed off by Pathologist', order: verified });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 6. DOCTOR REFERRALS & COMMISSION LEDGER
// =========================================================================
router.get('/doctors', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const doctors = db.prepare('SELECT * FROM lab_referral_doctors WHERE tenant_id = ? ORDER BY total_referred_orders DESC').all(tenantId);
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/doctors', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { doctor_name, clinic_hospital, phone, commission_percent } = req.body;

    if (!doctor_name) {
      return res.status(400).json({ error: 'Doctor name is required' });
    }

    const result = db.prepare(`
      INSERT INTO lab_referral_doctors (tenant_id, doctor_name, clinic_hospital, phone, commission_percent)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      tenantId,
      doctor_name.trim(),
      clinic_hospital || null,
      phone || null,
      Number(commission_percent) || 15
    );

    const created = db.prepare('SELECT * FROM lab_referral_doctors WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/doctors/:id/payout', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const doctorId = req.params.id;
    const { payout_amount, payment_mode, reference } = req.body;

    const amount = Number(payout_amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid payout amount is required' });
    }

    db.prepare(`
      UPDATE lab_referral_doctors SET
        total_commission_paid = total_commission_paid + ?,
        balance_payable = MAX(0, balance_payable - ?)
      WHERE id = ? AND tenant_id = ?
    `).run(amount, amount, doctorId, tenantId);

    const updated = db.prepare('SELECT * FROM lab_referral_doctors WHERE id = ?').get(doctorId);
    res.json({ success: true, message: `Disbursed ₹${amount} to ${updated.doctor_name}`, doctor: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
