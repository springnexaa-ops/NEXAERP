import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  FileCheck2,
  AlertTriangle,
  Stethoscope,
  Users,
  DollarSign,
  TrendingUp,
  Boxes,
  RefreshCw,
  Sparkles,
  QrCode,
  ShieldCheck,
  Building2,
  Activity,
  Layers,
  ChevronRight,
  HardDriveDownload,
  Calendar,
  CreditCard
} from 'lucide-react';
import { api } from '../../utils/api';
import { useApp } from '../../context/AppContext';
import { NewRequisitionModal } from './NewRequisitionModal';
import { ResultEntryModal } from './ResultEntryModal';
import { DiagnosticReportModal } from './DiagnosticReportModal';

export function LabMISScreen() {
  const { currentTenant, showToast } = useApp();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [tests, setTests] = useState([]);
  const [packages, setPackages] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Search & Filter
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  // Modals
  const [isNewRequisitionOpen, setIsNewRequisitionOpen] = useState(false);
  const [resultEntryOrderId, setResultEntryOrderId] = useState(null);
  const [selectedReportOrder, setSelectedReportOrder] = useState(null);

  // Doctor Payout Modal
  const [payoutDoctor, setPayoutDoctor] = useState(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [currentTenant?.id]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [analyticsData, ordersData, testsData, packagesData, doctorsData] = await Promise.all([
        api.getLabAnalytics().catch(() => null),
        api.getLabOrders().catch(() => []),
        api.getLabTests().catch(() => []),
        api.getLabPackages().catch(() => []),
        api.getLabDoctors().catch(() => [])
      ]);

      setAnalytics(analyticsData);
      setOrders(ordersData || []);
      setTests(testsData || []);
      setPackages(packagesData || []);
      setDoctors(doctorsData || []);
    } catch (err) {
      showToast('Error loading Lab MIS data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.updateLabOrderStatus(orderId, { order_status: newStatus });
      showToast(`Order status updated to: ${newStatus}`, 'success');
      loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to update order status', 'error');
    }
  };

  const handleViewReport = async (orderId) => {
    try {
      const fullOrder = await api.getLabOrder(orderId);
      setSelectedReportOrder(fullOrder);
    } catch (err) {
      showToast(err.message || 'Failed to load report', 'error');
    }
  };

  const handleDoctorPayout = async (e) => {
    e.preventDefault();
    if (!payoutDoctor || !payoutAmount || Number(payoutAmount) <= 0) return;
    try {
      setPayoutSubmitting(true);
      await api.recordLabDoctorPayout(payoutDoctor.id, {
        payout_amount: Number(payoutAmount),
        payment_mode: 'cash'
      });
      showToast(`Disbursed ₹${payoutAmount} to ${payoutDoctor.doctor_name}`, 'success');
      setPayoutDoctor(null);
      setPayoutAmount('');
      loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to record payout', 'error');
    } finally {
      setPayoutSubmitting(false);
    }
  };

  const kpis = analytics?.kpis || {};
  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'all' || o.order_status === statusFilter;
    const matchesSearch = !orderSearch ||
      o.order_no.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.patient_name.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.barcode && o.barcode.toLowerCase().includes(orderSearch.toLowerCase())) ||
      (o.patient_phone && o.patient_phone.includes(orderSearch));
    return matchesStatus && matchesSearch;
  });

  const filteredTests = tests.filter(t => {
    const matchesDept = deptFilter === 'all' || t.department === deptFilter;
    const matchesSearch = !catalogSearch ||
      t.test_name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      t.test_code.toLowerCase().includes(catalogSearch.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Top Banner / Navigation */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-extrabold text-white tracking-tight">
                Laboratory & Diagnostic MIS
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                NABL Standard Architecture
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Integrated Diagnostic Wing • <strong className="text-slate-300">{currentTenant?.name}</strong>
            </p>
          </div>
        </div>

        {/* Tab Switcher & Action Button */}
        <div className="flex items-center space-x-2">
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex space-x-1 text-xs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'dashboard' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'orders' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Patient Requisitions</span>
            </button>
            <button
              onClick={() => setActiveTab('phlebotomy')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'phlebotomy' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Phlebotomy & Samples</span>
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'catalog' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Test Directory</span>
            </button>
            <button
              onClick={() => setActiveTab('doctors')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'doctors' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor Referral Commissions</span>
            </button>
          </div>

          <button
            onClick={() => setIsNewRequisitionOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-lg shadow-cyan-600/25 transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Requisition</span>
          </button>

          <button
            onClick={loadAllData}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            title="Refresh Lab Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* =================================================================== */}
        {/* 1. MIS EXECUTIVE DASHBOARD TAB */}
        {/* =================================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-slate-400">Total Requisitions</span>
                <div className="text-2xl font-black text-white font-mono mt-1">{kpis.totalOrders ?? 0}</div>
                <span className="text-[10px] text-cyan-400 font-medium mt-2">{kpis.todayOrders ?? 0} booked today</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-slate-400">Lab Diagnostic Revenue</span>
                <div className="text-2xl font-black text-emerald-400 font-mono mt-1">₹{(kpis.total_revenue ?? 0).toLocaleString()}</div>
                <span className="text-[10px] text-emerald-400 font-medium mt-2">₹{(kpis.today_revenue ?? 0).toLocaleString()} today</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-slate-400">Pending Samples</span>
                <div className="text-2xl font-black text-amber-400 font-mono mt-1">{kpis.pendingSamples ?? 0}</div>
                <span className="text-[10px] text-amber-400/80 font-medium mt-2">Specimen accession queue</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-slate-400">In Analysis</span>
                <div className="text-2xl font-black text-sky-400 font-mono mt-1">{kpis.processingOrders ?? 0}</div>
                <span className="text-[10px] text-sky-400 font-medium mt-2">Under bench observation</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-slate-400">Verified Reports</span>
                <div className="text-2xl font-black text-indigo-400 font-mono mt-1">{kpis.verifiedReports ?? 0}</div>
                <span className="text-[10px] text-indigo-300 font-medium mt-2">Pathologist signed</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-slate-400">TAT Compliance</span>
                <div className="text-2xl font-black text-purple-400 font-mono mt-1">{kpis.tatCompliancePercent ?? 100}%</div>
                <span className="text-[10px] text-purple-300 font-medium mt-2">Within standard TAT</span>
              </div>
            </div>

            {/* Department Breakdown & Top Tests */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Department Distribution */}
              <div className="bg-slate-950/50 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-extrabold text-white">Department Revenue Distribution</h3>
                  <span className="text-[10px] font-mono text-slate-400">Real-Time MIS</span>
                </div>

                <div className="space-y-3">
                  {(analytics?.departmentBreakdown || []).map((dept, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-white">{dept.department}</div>
                        <div className="text-[10px] text-slate-400">{dept.test_count} tests executed</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-emerald-400">₹{dept.revenue.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Billed</div>
                      </div>
                    </div>
                  ))}
                  {(!analytics?.departmentBreakdown || analytics.departmentBreakdown.length === 0) && (
                    <div className="py-6 text-center text-xs text-slate-500">No departmental test activity recorded yet.</div>
                  )}
                </div>
              </div>

              {/* Top Billed Tests */}
              <div className="bg-slate-950/50 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-extrabold text-white">Top Ordered Investigations</h3>
                  <span className="text-[10px] font-mono text-slate-400">High Volume</span>
                </div>

                <div className="space-y-3">
                  {(analytics?.topTests || []).map((t, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-white">{t.item_name}</div>
                        <div className="text-[10px] text-cyan-400">{t.department}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-black text-white">{t.order_count} bookings</div>
                        <div className="text-[10px] text-emerald-400 font-mono">₹{t.total_amount.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                  {(!analytics?.topTests || analytics.topTests.length === 0) && (
                    <div className="py-6 text-center text-xs text-slate-500">No test orders registered yet.</div>
                  )}
                </div>
              </div>

              {/* Doctor Referral Commission Summary */}
              <div className="bg-slate-950/50 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-extrabold text-white">Doctor Referral Overview</h3>
                  <span className="text-[10px] font-mono text-cyan-400">{doctors.length} Registered Clinicians</span>
                </div>

                <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Total Commissions Accrued:</span>
                    <span className="font-mono font-bold text-amber-400">₹{(kpis.total_commission ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Outstanding Balance Payable:</span>
                    <span className="font-mono font-bold text-rose-400">
                      ₹{doctors.reduce((acc, d) => acc + (d.balance_payable || 0), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <button
                      onClick={() => setActiveTab('doctors')}
                      className="w-full py-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1 transition"
                    >
                      <span>Manage Clinician Ledgers</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Top Referring Doctors:</span>
                  {doctors.slice(0, 3).map((d, i) => (
                    <div key={i} className="flex justify-between items-center text-xs text-slate-300 py-1 border-b border-slate-800/60">
                      <span className="truncate max-w-[170px]">{d.doctor_name}</span>
                      <span className="font-mono text-cyan-400">{d.total_referred_orders} orders</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Orders Queue */}
            <div className="bg-slate-950/50 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-white">Recent Diagnostic Requisitions</h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold flex items-center gap-1"
                >
                  <span>View All Requisitions</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Order No / Barcode</th>
                      <th className="py-2.5 px-3">Patient Name</th>
                      <th className="py-2.5 px-3">Referring Clinician</th>
                      <th className="py-2.5 px-3">Net Amount</th>
                      <th className="py-2.5 px-3">Payment</th>
                      <th className="py-2.5 px-3">Workflow Status</th>
                      <th className="py-2.5 px-3 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(analytics?.recentOrders || []).map((o, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-3 font-mono font-bold text-white">
                          <div>{o.order_no}</div>
                          <div className="text-[10px] text-cyan-400 font-normal">{o.barcode}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-200">{o.patient_name}</div>
                          <div className="text-[10px] text-slate-400">{o.patient_age ? `${o.patient_age}Y, ` : ''}{o.patient_gender}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 truncate max-w-[150px]">{o.referring_doctor}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">₹{o.net_amount}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            o.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {o.payment_status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            o.order_status === 'verified' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                            o.order_status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                            o.order_status === 'sample_collected' ? 'bg-cyan-500/20 text-cyan-300' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {o.order_status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-1.5">
                          <button
                            onClick={() => setResultEntryOrderId(o.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-[11px]"
                          >
                            Enter Results
                          </button>
                          <button
                            onClick={() => handleViewReport(o.id)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px]"
                          >
                            Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 2. PATIENT REQUISITIONS & ORDERS TAB */}
        {/* =================================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2.5 flex-1 min-w-[280px]">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by order no, patient name, barcode, or mobile..."
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  {['all', 'registered', 'sample_collected', 'completed', 'verified'].map(st => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg font-bold uppercase text-[10px] transition ${
                        statusFilter === st ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {st === 'sample_collected' ? 'Collected' : st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-slate-400 text-xs font-mono">
                Showing <strong>{filteredOrders.length}</strong> patient requisitions
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Accession Barcode</th>
                    <th className="py-3 px-4">Patient Information</th>
                    <th className="py-3 px-4">Investigations Booked</th>
                    <th className="py-3 px-4">Referring Clinician</th>
                    <th className="py-3 px-4">Billed & Paid</th>
                    <th className="py-3 px-4">Workflow Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredOrders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-900/60">
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-white text-sm tracking-wide">{o.barcode}</div>
                        <div className="text-[10px] text-cyan-400 mt-0.5">{o.order_no}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-white text-xs">{o.patient_name}</div>
                        <div className="text-[11px] text-slate-400">
                          {o.patient_age ? `${o.patient_age}Y • ` : ''}{o.patient_gender} • {o.patient_phone || 'No Phone'}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {(o.items || []).map((it, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-cyan-300 font-medium truncate max-w-[160px]">
                              {it.item_name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-300 font-medium truncate max-w-[140px]">{o.referring_doctor}</div>
                        {o.referring_doctor_commission > 0 && (
                          <div className="text-[10px] text-amber-400/80 font-mono">₹{o.referring_doctor_commission} comm.</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-white">₹{o.net_amount}</div>
                        <div className="text-[10px] text-emerald-400">Paid: ₹{o.paid_amount}</div>
                        {o.balance_due > 0 && (
                          <div className="text-[10px] text-rose-400 font-bold">Due: ₹{o.balance_due}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block ${
                          o.order_status === 'verified' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                          o.order_status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                          o.order_status === 'sample_collected' ? 'bg-cyan-500/20 text-cyan-300' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {o.order_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => setResultEntryOrderId(o.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-[11px]"
                          title="Record Observed Parameter Values"
                        >
                          Results
                        </button>
                        <button
                          onClick={() => handleViewReport(o.id)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px]"
                          title="View & Print Diagnostic Report"
                        >
                          Report
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-500">
                        No diagnostic orders match the current criteria. Click "New Requisition" to book a patient test.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 3. PHLEBOTOMY & SAMPLE ACCESSIONING TAB */}
        {/* =================================================================== */}
        {activeTab === 'phlebotomy' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
              <div>
                <h3 className="font-bold text-white text-sm">Phlebotomy Specimen Accession Queue</h3>
                <p className="text-slate-400 mt-0.5">Vacutainer tube management, sample collection timestamps, and barcode verification</p>
              </div>
              <span className="text-xs font-mono bg-cyan-500/10 text-cyan-300 px-3 py-1 rounded-xl border border-cyan-500/30 font-bold">
                {orders.filter(o => o.sample_status === 'collected').length} Samples Accessioned
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map(o => (
                <div key={o.id} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-black text-white font-mono">{o.barcode}</div>
                      <div className="text-xs font-bold text-slate-200 mt-0.5">{o.patient_name}</div>
                      <div className="text-[11px] text-slate-400">{o.patient_age ? `${o.patient_age}Y, ` : ''}{o.patient_gender}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      o.sample_status === 'collected' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      o.sample_status === 'in_transit' ? 'bg-sky-500/20 text-sky-300' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {o.sample_status}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Collector:</span>
                      <span className="font-semibold text-slate-200">{o.phlebotomist || 'Counter Staff'}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Collected At:</span>
                      <span className="font-mono text-slate-200">{o.collected_at ? o.collected_at.slice(0, 16) : 'At Registration'}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Specimens Required:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(o.items || []).map((it, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-cyan-300 text-[10px] font-bold">
                          {it.item_name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                    <button
                      onClick={() => handleUpdateOrderStatus(o.id, 'processing')}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-bold text-[11px] transition"
                    >
                      Receive in Lab Bench
                    </button>
                    <button
                      onClick={() => handleViewReport(o.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] transition"
                    >
                      Print Slip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 4. TEST DIRECTORY & PACKAGES TAB */}
        {/* =================================================================== */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            {/* Health Packages Showcase */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Health Checkup Bundles & Profiles ({packages.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packages.map(pkg => (
                  <div key={pkg.id} className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                          {pkg.package_code}
                        </span>
                        <h4 className="font-extrabold text-sm text-white mt-1.5">{pkg.package_name}</h4>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{pkg.description}</p>

                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
                      <span className="text-lg font-black text-amber-300 font-mono">₹{pkg.package_price}</span>
                      {pkg.original_price > pkg.package_price && (
                        <span className="text-xs line-through text-slate-500 font-mono">₹{pkg.original_price}</span>
                      )}
                      <span className="text-[10px] text-emerald-400 font-bold ml-auto">
                        Save {Math.round(((pkg.original_price - pkg.package_price) / pkg.original_price) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Tests Catalog */}
            <div className="space-y-3">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search test catalog by name or code..."
                      value={catalogSearch}
                      onChange={e => setCatalogSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <select
                    value={deptFilter}
                    onChange={e => setDeptFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="all">All Departments</option>
                    <option value="Hematology">Hematology</option>
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Clinical Pathology">Clinical Pathology</option>
                  </select>
                </div>

                <div className="text-slate-400 font-mono">
                  <strong>{filteredTests.length}</strong> standardized tests active
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredTests.map(test => (
                  <div key={test.id} className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-2 hover:border-slate-700 transition">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                        {test.test_code}
                      </span>
                      <span className="text-sm font-black text-white font-mono">₹{test.price}</span>
                    </div>

                    <div className="font-extrabold text-sm text-slate-100">{test.test_name}</div>
                    <div className="text-xs text-slate-400">{test.description}</div>

                    <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <div>
                        <span className="text-slate-500 block">Specimen:</span>
                        <span className="font-semibold text-slate-300">{test.sample_type}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Container:</span>
                        <span className="font-semibold text-slate-300">{test.tube_color}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Standard TAT:</span>
                        <span className="font-semibold text-slate-300">{test.tat_hours} Hours</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Parameters:</span>
                        <span className="font-semibold text-cyan-300">{test.parameter_count || 1} Parameters</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 5. DOCTOR REFERRAL COMMISSIONS TAB */}
        {/* =================================================================== */}
        {activeTab === 'doctors' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
              <div>
                <h3 className="font-bold text-white text-sm">Referring Clinician Directory & Commission Ledgers</h3>
                <p className="text-slate-400 mt-0.5">Automated referral incentive calculations, order audit trails, and payout settlements</p>
              </div>
              <span className="text-xs font-mono bg-cyan-500/10 text-cyan-300 px-3 py-1 rounded-xl border border-cyan-500/30 font-bold">
                {doctors.length} Registered Clinicians
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map(doc => (
                <div key={doc.id} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-sm text-white">{doc.doctor_name}</h4>
                      <p className="text-xs text-cyan-400">{doc.clinic_hospital || 'Private Clinic'}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{doc.phone || 'No phone'}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {doc.commission_percent}% Cut
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Total Referred Orders:</span>
                      <span className="font-mono font-bold text-white">{doc.total_referred_orders}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Total Commission Earned:</span>
                      <span className="font-mono font-bold text-emerald-400">₹{doc.total_commission_earned.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Paid Out:</span>
                      <span className="font-mono font-bold text-slate-300">₹{doc.total_commission_paid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800 font-semibold">
                      <span>Balance Payable:</span>
                      <span className="font-mono font-black text-rose-400 text-sm">₹{doc.balance_payable.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => {
                        setPayoutDoctor(doc);
                        setPayoutAmount(String(doc.balance_payable));
                      }}
                      disabled={doc.balance_payable <= 0}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-cyan-600/25 transition disabled:opacity-50"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Settle Commission Payout</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* MODALS */}
      {/* =================================================================== */}
      <NewRequisitionModal
        isOpen={isNewRequisitionOpen}
        onClose={() => setIsNewRequisitionOpen(false)}
        onCreated={() => loadAllData()}
        tests={tests}
        packages={packages}
        doctors={doctors}
      />

      <ResultEntryModal
        isOpen={Boolean(resultEntryOrderId)}
        onClose={() => setResultEntryOrderId(null)}
        orderId={resultEntryOrderId}
        onSaved={() => loadAllData()}
      />

      <DiagnosticReportModal
        isOpen={Boolean(selectedReportOrder)}
        onClose={() => setSelectedReportOrder(null)}
        order={selectedReportOrder}
      />

      {/* Doctor Payout Modal */}
      {payoutDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white">Settle Clinician Incentive Payout</h3>
              <button onClick={() => setPayoutDoctor(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDoctorPayout} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Clinician Name</label>
                <input
                  type="text"
                  disabled
                  value={payoutDoctor.doctor_name}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-semibold"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex justify-between">
                <span className="text-slate-400">Current Outstanding Balance:</span>
                <span className="font-mono font-bold text-rose-400">₹{payoutDoctor.balance_payable}</span>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Payout Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={payoutDoctor.balance_payable}
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayoutDoctor(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payoutSubmitting}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/25 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{payoutSubmitting ? 'Disbursing...' : 'Confirm Cash Payout'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
