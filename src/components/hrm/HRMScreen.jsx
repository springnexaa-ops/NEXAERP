import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';
import {
  Users,
  UserPlus,
  CalendarCheck,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  RefreshCw,
  Search,
  DollarSign
} from 'lucide-react';

export function HRMScreen() {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'attendance' | 'payroll'
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10));
  const [targetMonth, setTargetMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Employee Modal
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    phone: '',
    email: '',
    designation: 'Pharmacist',
    salary_type: 'monthly',
    base_salary: '',
    joining_date: new Date().toISOString().slice(0, 10)
  });

  // Disburse Payroll Modal
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [selectedEmpForPayroll, setSelectedEmpForPayroll] = useState(null);
  const [payrollForm, setPayrollForm] = useState({
    employee_id: '',
    month_year: new Date().toISOString().slice(0, 7),
    basic_salary: 0,
    allowance: 0,
    deductions: 0,
    payment_mode: 'bank'
  });

  useEffect(() => {
    loadData();
  }, [activeTab, targetDate, targetMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'directory') {
        const data = await api.getEmployees();
        setEmployees(data || []);
      } else if (activeTab === 'attendance') {
        const data = await api.getAttendance(targetDate);
        setAttendanceRecords(data?.records || []);
      } else if (activeTab === 'payroll') {
        const [empData, payData] = await Promise.all([
          api.getEmployees(),
          api.getPayroll(targetMonth)
        ]);
        setEmployees(empData || []);
        setPayrollRecords(payData?.payroll || []);
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to load HRM data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!employeeForm.name || !employeeForm.base_salary) {
      showToast('Name and base salary are required', 'error');
      return;
    }

    try {
      await api.createEmployee(employeeForm);
      showToast('Employee successfully registered', 'success');
      setIsEmployeeModalOpen(false);
      setEmployeeForm({
        name: '',
        phone: '',
        email: '',
        designation: 'Staff',
        salary_type: 'monthly',
        base_salary: '',
        joining_date: new Date().toISOString().slice(0, 10)
      });
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to add employee', 'error');
    }
  };

  const handleMarkAttendance = async (employeeId, status) => {
    try {
      await api.markAttendance({
        employee_id: employeeId,
        date: targetDate,
        status,
        check_in_time: status === 'PRESENT' ? '09:00 AM' : null
      });
      showToast(`Marked ${status}`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update attendance', 'error');
    }
  };

  const openPayrollModal = (emp) => {
    setSelectedEmpForPayroll(emp);
    setPayrollForm({
      employee_id: emp.id,
      month_year: targetMonth,
      basic_salary: emp.base_salary,
      allowance: 0,
      deductions: 0,
      payment_mode: 'bank'
    });
    setIsPayrollModalOpen(true);
  };

  const handleDisbursePayroll = async (e) => {
    e.preventDefault();
    try {
      await api.disburseSalary(payrollForm);
      showToast('Salary disbursed and recorded in expense ledger', 'success');
      setIsPayrollModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to disburse salary', 'error');
    }
  };

  const filteredEmployees = employees.filter((e) =>
    e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.phone?.includes(searchQuery)
  );

  const totalPayrollMonthly = employees.reduce((s, e) => s + (e.base_salary || 0), 0);
  const presentCount = attendanceRecords.filter((a) => a.attendance_status === 'PRESENT').length;
  const absentCount = attendanceRecords.filter((a) => a.attendance_status === 'ABSENT').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              HRM, Attendance & Payroll Management
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Staff & Payroll
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Shift Timings, Employee Rostering, Biometric/Daily Registers and Salary Disbursals
            </p>
          </div>
        </div>

        {/* View Switchers */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'directory'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Staff Directory
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'attendance'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Daily Attendance
            </button>
            <button
              onClick={() => setActiveTab('payroll')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'payroll'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Payroll Processing
            </button>
          </div>

          <button
            onClick={() => setIsEmployeeModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff</span>
          </button>

          <button
            onClick={loadData}
            title="Refresh"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Headcount</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {employees.length}
          </div>
          <div className="text-[10px] text-indigo-400 font-mono mt-0.5">Active Staff Members</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Present Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {presentCount}
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Checked In on {targetDate}</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Absent / On Leave</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400 mt-1">
            {absentCount}
          </div>
          <div className="text-[10px] text-rose-400 font-mono mt-0.5">Unexcused / Leave</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Monthly Payroll Liability</span>
            <CreditCard className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300 mt-1">
            {formatCurrency(totalPayrollMonthly)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Base Monthly Wages</div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {activeTab === 'directory' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-3 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search staff by name, role or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="text-xs text-slate-400">
                Staff Directory: <span className="text-white font-bold">{filteredEmployees.length}</span> members
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-semibold">
                    <th className="p-3">Staff Name</th>
                    <th className="p-3">Designation / Role</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Salary Type</th>
                    <th className="p-3">Monthly Wage</th>
                    <th className="p-3">Joined On</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 font-semibold text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-xs">
                            {emp.name.charAt(0)}
                          </div>
                          {emp.name}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {emp.designation}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300 font-mono">
                          {emp.phone || '-'}
                          {emp.email && <span className="block text-[10px] text-slate-500">{emp.email}</span>}
                        </td>
                        <td className="p-3 uppercase font-mono text-[11px] text-slate-400">
                          {emp.salary_type}
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-400">
                          {formatCurrency(emp.base_salary)}
                        </td>
                        <td className="p-3 text-slate-400">{formatDate(emp.joining_date)}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => openPayrollModal(emp)}
                            className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-lg text-[11px] font-semibold transition-all border border-indigo-500/30"
                          >
                            Pay Salary
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-10 text-slate-500">
                        No employees found. Click "Add Staff" to register your workforce.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-3 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-300">Attendance Date:</span>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="text-xs text-slate-400">
                Click status below to mark attendance for each staff member
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-semibold">
                    <th className="p-3">Staff Name</th>
                    <th className="p-3">Designation</th>
                    <th className="p-3">Current Status</th>
                    <th className="p-3">Check-In Time</th>
                    <th className="p-3 text-right">Mark Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {attendanceRecords.length > 0 ? (
                    attendanceRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 font-semibold text-white">{record.name}</td>
                        <td className="p-3 text-slate-400">{record.designation}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              record.attendance_status === 'PRESENT'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : record.attendance_status === 'HALF_DAY'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : record.attendance_status === 'ABSENT'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {record.attendance_status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300 font-mono">
                          {record.check_in_time || '-'}
                        </td>
                        <td className="p-3 text-right">
                          <div className="inline-flex space-x-1.5">
                            <button
                              onClick={() => handleMarkAttendance(record.id, 'PRESENT')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                record.attendance_status === 'PRESENT'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-emerald-950'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(record.id, 'HALF_DAY')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                record.attendance_status === 'HALF_DAY'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-slate-900 border border-slate-800 text-amber-400 hover:bg-amber-950'
                              }`}
                            >
                              Half Day
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(record.id, 'ABSENT')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                record.attendance_status === 'ABSENT'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-900 border border-slate-800 text-rose-400 hover:bg-rose-950'
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-10 text-slate-500">
                        No employees registered to mark attendance.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="space-y-4">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Payroll Cycle</h3>
                  <p className="text-xs text-slate-400">Generate payslips and disburse bank/cash salaries</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Month:</span>
                <input
                  type="month"
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Payroll History Table */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-3 bg-slate-900/70 border-b border-slate-800 text-xs font-bold text-slate-300">
                Disbursement History for {targetMonth}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-semibold">
                      <th className="p-3">Staff Member</th>
                      <th className="p-3">Designation</th>
                      <th className="p-3">Basic Pay</th>
                      <th className="p-3">Allowance</th>
                      <th className="p-3">Deductions</th>
                      <th className="p-3">Net Disbursed</th>
                      <th className="p-3">Payment Mode</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {payrollRecords.length > 0 ? (
                      payrollRecords.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="p-3 font-semibold text-white">{p.employee_name}</td>
                          <td className="p-3 text-slate-400">{p.designation}</td>
                          <td className="p-3 font-mono text-slate-300">{formatCurrency(p.basic_salary)}</td>
                          <td className="p-3 font-mono text-emerald-400">+{formatCurrency(p.allowance)}</td>
                          <td className="p-3 font-mono text-rose-400">-{formatCurrency(p.deductions)}</td>
                          <td className="p-3 font-mono font-bold text-emerald-400">{formatCurrency(p.net_salary)}</td>
                          <td className="p-3 font-mono uppercase text-slate-400">{p.payment_mode}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              PAID
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center py-8 text-slate-500">
                          No salary disbursements recorded for {targetMonth} yet. Go to Staff Directory to disburse.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                Register Staff Member
              </h2>
              <button
                onClick={() => setIsEmployeeModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Designation / Role *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chief Pharmacist, Billing Cashier"
                    value={employeeForm.designation}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, designation: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Base Salary (₹/month) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 25000"
                    value={employeeForm.base_salary}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, base_salary: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Joining Date</label>
                  <input
                    type="date"
                    value={employeeForm.joining_date}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, joining_date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. staff@springnexa.com"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg shadow-indigo-600/30"
                >
                  Register Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disburse Payroll Modal */}
      {isPayrollModalOpen && selectedEmpForPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                Disburse Monthly Salary
              </h2>
              <button
                onClick={() => setIsPayrollModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
              <div className="text-white font-semibold text-sm">{selectedEmpForPayroll.name}</div>
              <div className="text-slate-400">{selectedEmpForPayroll.designation} • Cycle: {payrollForm.month_year}</div>
            </div>

            <form onSubmit={handleDisbursePayroll} className="space-y-3.5 mt-4 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Basic Salary</label>
                  <input
                    type="number"
                    value={payrollForm.basic_salary}
                    onChange={(e) => setPayrollForm({ ...payrollForm, basic_salary: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Allowances (+)</label>
                  <input
                    type="number"
                    value={payrollForm.allowance}
                    onChange={(e) => setPayrollForm({ ...payrollForm, allowance: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-emerald-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Deductions (-)</label>
                  <input
                    type="number"
                    value={payrollForm.deductions}
                    onChange={(e) => setPayrollForm({ ...payrollForm, deductions: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-rose-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Payment Mode</label>
                <select
                  value={payrollForm.payment_mode}
                  onChange={(e) => setPayrollForm({ ...payrollForm, payment_mode: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="bank">Bank Transfer (NEFT / IMPS)</option>
                  <option value="cash">Store Petty Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="upi">UPI</option>
                </select>
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex justify-between items-center">
                <span className="text-slate-300 font-medium">Net Disbursal Amount:</span>
                <span className="text-base font-mono font-bold text-emerald-400">
                  {formatCurrency(Number(payrollForm.basic_salary) + Number(payrollForm.allowance) - Number(payrollForm.deductions))}
                </span>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPayrollModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/30"
                >
                  Confirm Disbursal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
