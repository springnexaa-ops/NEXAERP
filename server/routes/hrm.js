const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { checkStaffQuota } = require('../utils/quotaGuard');

// List Employees
router.get('/employees', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const employees = db.prepare(`
      SELECT e.*,
        (SELECT COUNT(*) FROM employee_attendance WHERE employee_id = e.id AND status = 'PRESENT') as present_days,
        (SELECT COUNT(*) FROM employee_attendance WHERE employee_id = e.id AND status = 'ABSENT') as absent_days
      FROM employees e
      WHERE e.tenant_id = ?
      ORDER BY e.name ASC
    `).all(tenantId);
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Employee
router.post('/employees', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { name, phone, email, designation, salary_type = 'monthly', base_salary, joining_date } = req.body;

    if (!name || !designation || !base_salary) {
      return res.status(400).json({ error: 'Name, designation, and base salary are required' });
    }

    // Enforce Tenant Staff Quota
    const staffCheck = checkStaffQuota(tenantId);
    if (!staffCheck.allowed) {
      return res.status(403).json({ error: staffCheck.error });
    }

    const insert = db.prepare(`
      INSERT INTO employees (tenant_id, name, phone, email, designation, salary_type, base_salary, joining_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      tenantId, name, phone || '', email || '', designation, salary_type,
      Number(base_salary), joining_date || new Date().toISOString().slice(0, 10)
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Employee added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Attendance for a Date
router.get('/attendance', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { date = new Date().toISOString().slice(0, 10) } = req.query;

    const employees = db.prepare("SELECT id, name, designation, base_salary FROM employees WHERE tenant_id = ? AND status = 'active'").all(tenantId);
    const attendanceRecords = db.prepare('SELECT * FROM employee_attendance WHERE tenant_id = ? AND date = ?').all(tenantId, date);

    const result = employees.map(emp => {
      const att = attendanceRecords.find(a => a.employee_id === emp.id);
      return {
        ...emp,
        attendance_status: att ? att.status : 'UNMARKED',
        check_in_time: att ? att.check_in_time : null,
        notes: att ? att.notes : ''
      };
    });

    res.json({ date, records: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark Attendance
router.post('/attendance', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { employee_id, date = new Date().toISOString().slice(0, 10), status, check_in_time, notes } = req.body;

    if (!employee_id || !status) {
      return res.status(400).json({ error: 'Employee and status are required' });
    }

    const upsert = db.prepare(`
      INSERT INTO employee_attendance (tenant_id, employee_id, date, status, check_in_time, notes)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(tenant_id, employee_id, date) DO UPDATE SET
        status = excluded.status,
        check_in_time = excluded.check_in_time,
        notes = excluded.notes
    `);

    upsert.run(tenantId, Number(employee_id), date, status, check_in_time || '09:00 AM', notes || '');
    res.json({ success: true, message: 'Attendance recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Payroll Records & Disbursals
router.get('/payroll', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { month_year = new Date().toISOString().slice(0, 7) } = req.query;

    const payroll = db.prepare(`
      SELECT p.*, e.name as employee_name, e.designation
      FROM payroll_records p
      JOIN employees e ON p.employee_id = e.id AND e.tenant_id = p.tenant_id
      WHERE p.tenant_id = ? AND p.month_year = ?
      ORDER BY p.id DESC
    `).all(tenantId, month_year);

    res.json({ month_year, payroll });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Disburse Salary
router.post('/payroll/disburse', (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { employee_id, month_year, basic_salary, allowance = 0, deductions = 0, payment_mode = 'bank' } = req.body;

    if (!employee_id || !basic_salary) {
      return res.status(400).json({ error: 'Employee and salary are required' });
    }

    const netSalary = Number(basic_salary) + Number(allowance) - Number(deductions);

    db.exec('BEGIN TRANSACTION;');
    try {
      const insert = db.prepare(`
        INSERT INTO payroll_records (
          tenant_id, employee_id, month_year, basic_salary, allowance, deductions,
          net_salary, payment_status, payment_date, payment_mode
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', CURRENT_DATE, ?)
      `);

      const result = insert.run(
        tenantId, Number(employee_id), month_year || new Date().toISOString().slice(0, 7),
        Number(basic_salary), Number(allowance), Number(deductions),
        netSalary, payment_mode
      );

      // Automatically log into operational expenses!
      const emp = db.prepare('SELECT name FROM employees WHERE id = ?').get(employee_id);
      db.prepare(`
        INSERT INTO expenses (tenant_id, category, amount, payment_mode, reference_no, paid_to, notes)
        VALUES (?, 'Salaries', ?, ?, ?, ?, ?)
      `).run(tenantId, netSalary, payment_mode, `PAY-${result.lastInsertRowid}`, emp ? emp.name : 'Staff', `Salary for ${month_year}`);

      db.exec('COMMIT;');
      res.status(201).json({ success: true, message: `Salary disbursed: ₹${netSalary}` });
    } catch (inner) {
      db.exec('ROLLBACK;');
      throw inner;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
