import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Anchor,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  DollarSign,
  Building2,
  Ship,
  Truck,
  ExternalLink,
  Sparkles,
  Calculator,
  X,
  FileCheck2,
  BadgeCheck
} from 'lucide-react';

export function CHACustomsPortalPanel() {
  const { showToast, currencySymbol } = useApp();
  const [clearances, setClearances] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [isFilingModalOpen, setIsFilingModalOpen] = useState(false);
  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
  const [statusUpdateItem, setStatusUpdateItem] = useState(null);
  const [dutyCalcOpen, setDutyCalcOpen] = useState(false);

  // Form states
  const [filingForm, setFilingForm] = useState({
    clearance_type: 'IMPORT_BOE',
    doc_number: '',
    doc_date: new Date().toISOString().slice(0, 10),
    port_code: 'INNSA1',
    customs_house: 'Nhava Sheva Customs Commissionerate',
    cha_agency_id: '',
    icegate_job_no: '',
    assessment_status: 'filed',
    bcd_amount: '',
    sws_amount: '',
    igst_amount: '',
    aidc_amount: '',
    duty_payment_status: 'unpaid',
    icegate_challan_no: '',
    cfs_name: 'Gateway Distriparks CFS, Nhava Sheva',
    gate_in_date: '',
    remarks: ''
  });

  const [agencyForm, setAgencyForm] = useState({
    agency_name: '',
    cha_license_no: '',
    contact_person: '',
    phone: '',
    email: '',
    ports_handled: 'Nhava Sheva (INNSA), Mumbai Port (INBOM)',
    icegate_id: '',
    pan_number: '',
    gstin: ''
  });

  // Duty Calculator State
  const [calcAssessable, setCalcAssessable] = useState(500000);
  const [calcBcdRate, setCalcBcdRate] = useState(7.5);
  const [calcIgstRate, setCalcIgstRate] = useState(12);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clrData, agData] = await Promise.all([
        api.getChaClearances(),
        api.getChaAgencies()
      ]);
      setClearances(clrData.clearances || []);
      setStats(clrData.stats || null);
      setAgencies(agData || []);
    } catch (err) {
      console.error('Error loading CHA data:', err);
      showToast('Failed to load CHA Customs clearances', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFiling = async (e) => {
    e.preventDefault();
    if (!filingForm.doc_number) {
      showToast('Please enter Bill of Entry or Shipping Bill number', 'error');
      return;
    }
    try {
      await api.createChaClearance(filingForm);
      showToast(`Customs filing ${filingForm.doc_number} registered!`, 'success');
      setIsFilingModalOpen(false);
      setFilingForm({
        clearance_type: 'IMPORT_BOE',
        doc_number: '',
        doc_date: new Date().toISOString().slice(0, 10),
        port_code: 'INNSA1',
        customs_house: 'Nhava Sheva Customs Commissionerate',
        cha_agency_id: '',
        icegate_job_no: '',
        assessment_status: 'filed',
        bcd_amount: '',
        sws_amount: '',
        igst_amount: '',
        aidc_amount: '',
        duty_payment_status: 'unpaid',
        icegate_challan_no: '',
        cfs_name: 'Gateway Distriparks CFS, Nhava Sheva',
        gate_in_date: '',
        remarks: ''
      });
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to file clearance', 'error');
    }
  };

  const handleCreateAgency = async (e) => {
    e.preventDefault();
    if (!agencyForm.agency_name || !agencyForm.cha_license_no) {
      showToast('Please enter Agency Name and CHA License No', 'error');
      return;
    }
    try {
      await api.createChaAgency(agencyForm);
      showToast(`CHA Agency ${agencyForm.agency_name} added!`, 'success');
      setIsAgencyModalOpen(false);
      setAgencyForm({
        agency_name: '',
        cha_license_no: '',
        contact_person: '',
        phone: '',
        email: '',
        ports_handled: 'Nhava Sheva (INNSA), Mumbai Port (INBOM)',
        icegate_id: '',
        pan_number: '',
        gstin: ''
      });
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to register agency', 'error');
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!statusUpdateItem) return;
    try {
      await api.updateChaClearance(statusUpdateItem.id, statusUpdateItem);
      showToast(`Clearance ${statusUpdateItem.doc_number} updated!`, 'success');
      setStatusUpdateItem(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update clearance', 'error');
    }
  };

  // Duty Calculator computations
  const calcBcd = Number(((calcAssessable * calcBcdRate) / 100).toFixed(2));
  const calcSws = Number(((calcBcd * 10) / 100).toFixed(2)); // 10% Social Welfare Surcharge on BCD
  const calcBaseForIgst = calcAssessable + calcBcd + calcSws;
  const calcIgst = Number(((calcBaseForIgst * calcIgstRate) / 100).toFixed(2));
  const calcTotalDuty = Number((calcBcd + calcSws + calcIgst).toFixed(2));

  // Filtered clearances
  const filteredClearances = clearances.filter(c => {
    if (typeFilter !== 'ALL' && c.clearance_type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && c.assessment_status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchDoc = c.doc_number?.toLowerCase().includes(q);
      const matchPort = c.port_code?.toLowerCase().includes(q);
      const matchAgency = c.agency_name?.toLowerCase().includes(q);
      const matchShip = c.shipment_number?.toLowerCase().includes(q);
      return matchDoc || matchPort || matchAgency || matchShip;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
              <Anchor className="w-3 h-3 text-sky-400" /> Customs House Agent (CHA) Portal
            </span>
            <span className="text-[11px] text-slate-400 font-mono">ICEGATE Port EDI 2.0</span>
          </div>
          <h2 className="text-lg font-black text-white mt-1 tracking-tight">
            Customs Clearances, Duty Assessment & Cargo Out-of-Charge
          </h2>
          <p className="text-xs text-slate-400">
            File Bill of Entry (BoE), Shipping Bills (SB), track ICEGATE duty payment challans, and container CFS gate movements
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setDutyCalcOpen(!dutyCalcOpen)}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-sky-500/30 text-sky-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Calculator className="w-3.5 h-3.5 text-sky-400" />
            <span>Duty Calculator</span>
          </button>

          <button
            onClick={() => setIsAgencyModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>+ CHA Agency</span>
          </button>

          <button
            onClick={() => setIsFilingModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-sky-600/20 active:scale-98 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ File BoE / Shipping Bill</span>
          </button>
        </div>
      </div>

      {/* 2. Live Duty Calculator Popup Widget */}
      {dutyCalcOpen && (
        <div className="p-4 bg-sky-950/70 border border-sky-500/40 rounded-2xl space-y-3 backdrop-blur-xl animate-in zoom-in-95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-200">
              <Calculator className="w-4 h-4 text-sky-400" />
              <span>Indian Customs Duty Interactive Assessment Engine (Sec 12 Customs Act)</span>
            </div>
            <button
              onClick={() => setDutyCalcOpen(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Assessable CIF Value (₹)</label>
              <input
                type="number"
                value={calcAssessable}
                onChange={e => setCalcAssessable(Number(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-sky-500/30 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">BCD Rate (%)</label>
              <input
                type="number"
                value={calcBcdRate}
                onChange={e => setCalcBcdRate(Number(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-sky-500/30 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">IGST Rate (%)</label>
              <input
                type="number"
                value={calcIgstRate}
                onChange={e => setCalcIgstRate(Number(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-sky-500/30 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
            <div className="bg-slate-900/90 border border-sky-400/30 p-2.5 rounded-xl flex flex-col justify-center">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total Duty Payable</div>
              <div className="text-base font-black text-emerald-400 font-mono">
                {formatCurrency(calcTotalDuty)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-sky-500/20 text-slate-300 font-mono">
            <div>BCD: <strong>{formatCurrency(calcBcd)}</strong> ({calcBcdRate}%)</div>
            <div>SWS (10% of BCD): <strong>{formatCurrency(calcSws)}</strong></div>
            <div>IGST: <strong>{formatCurrency(calcIgst)}</strong> ({calcIgstRate}%)</div>
          </div>
        </div>
      )}

      {/* 3. Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Filings</span>
            <FileText className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1 font-mono">
            {stats?.total || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Bills of Entry & Shipping Bills</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Duty Assessed</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 mt-1 font-mono">
            {formatCurrency(stats?.total_duty_assessed || 0)}
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5">
            Paid: {formatCurrency(stats?.total_duty_paid || 0)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>OOC / LEO Cleared</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
            {(stats?.ooc_count || 0) + (stats?.leo_count || 0)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            OOC: {stats?.ooc_count || 0} • LEO: {stats?.leo_count || 0}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Under Examination</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">
            {stats?.under_examination || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">CFS Inspection Queue</div>
        </div>
      </div>

      {/* 4. Filter & Search Controls */}
      <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search BoE, SB, Port, CHA Agency..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-white font-semibold focus:outline-none"
          >
            <option value="ALL">All Document Types</option>
            <option value="IMPORT_BOE">Bill of Entry (Import)</option>
            <option value="EXPORT_SB">Shipping Bill (Export)</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-white font-semibold focus:outline-none"
          >
            <option value="ALL">All Assessment Statuses</option>
            <option value="filed">Filed on ICEGATE</option>
            <option value="under_examination">Under Physical Exam</option>
            <option value="duty_paid">Duty Paid</option>
            <option value="ooc_given">Out of Charge (OOC)</option>
            <option value="leo_given">Let Export Order (LEO)</option>
          </select>
        </div>
      </div>

      {/* 5. Clearances Master Table */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-3.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between">
          <span className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
            <Anchor className="w-3.5 h-3.5 text-sky-400" />
            Active Customs Clearances & ICEGATE Jobs ({filteredClearances.length})
          </span>
          <span className="text-[10px] text-emerald-400 font-mono font-bold">ICEGATE EDI LINKED</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
              <tr>
                <th className="p-3">Doc No & Type</th>
                <th className="p-3">Port & Customs House</th>
                <th className="p-3">CHA Broker Agency</th>
                <th className="p-3">Assessment Status</th>
                <th className="p-3">Customs Duty</th>
                <th className="p-3">CFS & Delivery</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredClearances.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500 text-xs">
                    No customs clearances matching filter criteria. Click "+ File BoE / Shipping Bill" to record one.
                  </td>
                </tr>
              ) : (
                filteredClearances.map(clr => {
                  const isImport = clr.clearance_type === 'IMPORT_BOE';

                  return (
                    <tr key={clr.id} className="hover:bg-slate-900/50 transition">
                      <td className="p-3">
                        <div className="font-bold text-white text-xs">{clr.doc_number}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                            isImport ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {isImport ? 'IMPORT BoE' : 'EXPORT SB'}
                          </span>
                          <span className="text-[10px] text-slate-400">{clr.doc_date}</span>
                        </div>
                        {clr.icegate_job_no && (
                          <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                            Job: {clr.icegate_job_no}
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-200">{clr.port_code}</div>
                        <div className="text-[11px] text-slate-400 leading-tight">{clr.customs_house}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-200">{clr.agency_name || 'Direct Importer'}</div>
                        {clr.cha_license_no && (
                          <div className="text-[10px] text-slate-500 font-mono">Lic: {clr.cha_license_no}</div>
                        )}
                      </td>

                      <td className="p-3">
                        {clr.assessment_status === 'ooc_given' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 className="w-3 h-3" /> Out of Charge (OOC)
                          </span>
                        )}
                        {clr.assessment_status === 'leo_given' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                            <CheckCircle2 className="w-3 h-3" /> Let Export Order (LEO)
                          </span>
                        )}
                        {clr.assessment_status === 'under_examination' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <Clock className="w-3 h-3" /> Under Examination
                          </span>
                        )}
                        {clr.assessment_status === 'duty_paid' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                            <BadgeCheck className="w-3 h-3" /> Duty Paid
                          </span>
                        )}
                        {clr.assessment_status === 'filed' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                            <FileCheck2 className="w-3 h-3" /> Checklist Filed
                          </span>
                        )}
                        {clr.ooc_number && (
                          <div className="text-[10px] text-emerald-400 font-mono mt-1">OOC #{clr.ooc_number}</div>
                        )}
                        {clr.leo_number && (
                          <div className="text-[10px] text-teal-400 font-mono mt-1">LEO #{clr.leo_number}</div>
                        )}
                      </td>

                      <td className="p-3 font-mono">
                        <div className="font-bold text-white text-xs">
                          {formatCurrency(clr.total_customs_duty || 0)}
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          clr.duty_payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {clr.duty_payment_status}
                        </span>
                        {clr.icegate_challan_no && (
                          <div className="text-[9px] text-slate-500 mt-0.5">Challan: {clr.icegate_challan_no}</div>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="text-[11px] text-slate-300 truncate max-w-[170px]">
                          {clr.cfs_name || 'Direct Port Delivery (DPD)'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          DO: {clr.delivery_order_status.replace('_', ' ')}
                        </div>
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => setStatusUpdateItem({ ...clr })}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-sky-500/40 text-sky-300 font-bold text-xs transition"
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. CHA Agencies Directory Section */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Registered Custom House Agent (CHA) Agencies & Customs Brokers
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">{agencies.length} Licensed Brokers</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {agencies.map(ag => (
            <div key={ag.id} className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">{ag.agency_name}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ACTIVE
                </span>
              </div>
              <div className="text-[11px] text-sky-300 font-mono">Lic: {ag.cha_license_no}</div>
              <div className="text-slate-400 text-[11px]">Contact: <strong className="text-slate-200">{ag.contact_person}</strong></div>
              <div className="text-slate-500 text-[10px]">Ports: {ag.ports_handled}</div>
              <div className="text-slate-500 text-[10px] font-mono">ICEGATE ID: {ag.icegate_id || 'Not Set'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= MODAL: FILE BILL OF ENTRY / SHIPPING BILL ================= */}
      {isFilingModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-sky-500/30 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 p-5 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-black text-white text-sm flex items-center gap-2">
                  <Anchor className="w-4 h-4 text-sky-400" /> File Customs Clearance (Bill of Entry / Shipping Bill)
                </h3>
                <p className="text-[11px] text-slate-400">Record ICEGATE single window filing, assessment duties, and port CFS</p>
              </div>
              <button onClick={() => setIsFilingModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFiling} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Document Type</label>
                  <select
                    value={filingForm.clearance_type}
                    onChange={e => setFilingForm({ ...filingForm, clearance_type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="IMPORT_BOE">Bill of Entry (Import)</option>
                    <option value="EXPORT_SB">Shipping Bill (Export)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Doc Number (BoE / SB No) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BOE-8912044 or SB-7190281"
                    value={filingForm.doc_number}
                    onChange={e => setFilingForm({ ...filingForm, doc_number: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Port Code (EDI Location)</label>
                  <input
                    type="text"
                    value={filingForm.port_code}
                    onChange={e => setFilingForm({ ...filingForm, port_code: e.target.value })}
                    placeholder="e.g. INNSA1 (Nhava Sheva Sea), INDEL4 (Delhi Air)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Customs Commissionerate</label>
                  <input
                    type="text"
                    value={filingForm.customs_house}
                    onChange={e => setFilingForm({ ...filingForm, customs_house: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Assigned CHA Agency</label>
                  <select
                    value={filingForm.cha_agency_id}
                    onChange={e => setFilingForm({ ...filingForm, cha_agency_id: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="">Select CHA Broker Agency</option>
                    {agencies.map(ag => (
                      <option key={ag.id} value={ag.id}>{ag.agency_name} ({ag.cha_license_no})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">ICEGATE Job No</label>
                  <input
                    type="text"
                    value={filingForm.icegate_job_no}
                    onChange={e => setFilingForm({ ...filingForm, icegate_job_no: e.target.value })}
                    placeholder="e.g. JOB-ICE-2609012"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Duty Breakdown */}
              <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl space-y-2">
                <span className="font-bold text-white text-xs block">Customs Duty Assessment Breakdown</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-slate-400 block text-[10px]">BCD Amount (₹)</label>
                    <input
                      type="number"
                      value={filingForm.bcd_amount}
                      onChange={e => setFilingForm({ ...filingForm, bcd_amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block text-[10px]">SWS Amount (₹)</label>
                    <input
                      type="number"
                      value={filingForm.sws_amount}
                      onChange={e => setFilingForm({ ...filingForm, sws_amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block text-[10px]">IGST Amount (₹)</label>
                    <input
                      type="number"
                      value={filingForm.igst_amount}
                      onChange={e => setFilingForm({ ...filingForm, igst_amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block text-[10px]">Payment Status</label>
                    <select
                      value={filingForm.duty_payment_status}
                      onChange={e => setFilingForm({ ...filingForm, duty_payment_status: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
                    >
                      <option value="unpaid">Unpaid</option>
                      <option value="challan_generated">Challan Generated</option>
                      <option value="paid">Paid on ICEGATE</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Container Freight Station (CFS) Name</label>
                  <input
                    type="text"
                    value={filingForm.cfs_name}
                    onChange={e => setFilingForm({ ...filingForm, cfs_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">ICEGATE Challan No</label>
                  <input
                    type="text"
                    value={filingForm.icegate_challan_no}
                    onChange={e => setFilingForm({ ...filingForm, icegate_challan_no: e.target.value })}
                    placeholder="e.g. CH-ICE-2026-90123"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Examination & Drug Controller Notes</label>
                <textarea
                  rows="2"
                  value={filingForm.remarks}
                  onChange={e => setFilingForm({ ...filingForm, remarks: e.target.value })}
                  placeholder="e.g. ADC NOC received, cold chain temperature verified, seal intact."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFilingModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold shadow-lg"
                >
                  Save & File Clearance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REGISTER CHA BROKER AGENCY ================= */}
      {isAgencyModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-950 border border-indigo-500/30 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 p-5 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-black text-white text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" /> Register Custom House Agent (CHA) Agency
                </h3>
                <p className="text-[11px] text-slate-400">Customs Broker License and ICEGATE Partner Details</p>
              </div>
              <button onClick={() => setIsAgencyModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAgency} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">CHA Agency / Firm Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maritime & Cargo Customs Brokers LLP"
                  value={agencyForm.agency_name}
                  onChange={e => setAgencyForm({ ...agencyForm, agency_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">CHA License No *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 11/0458/JNPT"
                    value={agencyForm.cha_license_no}
                    onChange={e => setAgencyForm({ ...agencyForm, cha_license_no: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">ICEGATE ID</label>
                  <input
                    type="text"
                    placeholder="e.g. MCCB_JNPT_99"
                    value={agencyForm.icegate_id}
                    onChange={e => setAgencyForm({ ...agencyForm, icegate_id: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Sharma"
                    value={agencyForm.contact_person}
                    onChange={e => setAgencyForm({ ...agencyForm, contact_person: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98200 00000"
                    value={agencyForm.phone}
                    onChange={e => setAgencyForm({ ...agencyForm, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Ports Handled</label>
                <input
                  type="text"
                  placeholder="e.g. Nhava Sheva (INNSA), Mundra (INMUN)"
                  value={agencyForm.ports_handled}
                  onChange={e => setAgencyForm({ ...agencyForm, ports_handled: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAgencyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Register CHA Agency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: UPDATE CLEARANCE STATUS ================= */}
      {statusUpdateItem && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-950 border border-sky-500/30 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-xs">
                  Update Clearance: {statusUpdateItem.doc_number}
                </h3>
                <span className="text-[10px] text-slate-400">{statusUpdateItem.port_code} • {statusUpdateItem.agency_name}</span>
              </div>
              <button onClick={() => setStatusUpdateItem(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-4 space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Assessment Status</label>
                <select
                  value={statusUpdateItem.assessment_status}
                  onChange={e => setStatusUpdateItem({ ...statusUpdateItem, assessment_status: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="filed">Filed on ICEGATE</option>
                  <option value="under_examination">Under Physical Examination</option>
                  <option value="duty_paid">Duty Paid</option>
                  <option value="ooc_given">Out of Charge (OOC Given - Cargo Released)</option>
                  <option value="leo_given">Let Export Order (LEO Given - Vessel Loaded)</option>
                  <option value="cleared">Cargo Cleared & Delivered</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Duty Payment Status</label>
                <select
                  value={statusUpdateItem.duty_payment_status}
                  onChange={e => setStatusUpdateItem({ ...statusUpdateItem, duty_payment_status: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="challan_generated">Challan Generated</option>
                  <option value="paid">Paid on ICEGATE</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">OOC Number</label>
                  <input
                    type="text"
                    value={statusUpdateItem.ooc_number || ''}
                    onChange={e => setStatusUpdateItem({ ...statusUpdateItem, ooc_number: e.target.value })}
                    placeholder="e.g. OOC-INNSA1-2026-881"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">LEO Number</label>
                  <input
                    type="text"
                    value={statusUpdateItem.leo_number || ''}
                    onChange={e => setStatusUpdateItem({ ...statusUpdateItem, leo_number: e.target.value })}
                    placeholder="e.g. LEO-INMUN1-2026-550"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Delivery Order Status</label>
                <select
                  value={statusUpdateItem.delivery_order_status}
                  onChange={e => setStatusUpdateItem({ ...statusUpdateItem, delivery_order_status: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="do_received">Delivery Order (DO) Received</option>
                  <option value="cargo_dispatched">Cargo Dispatched from CFS</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Customs Examination Remarks</label>
                <textarea
                  rows="2"
                  value={statusUpdateItem.remarks || ''}
                  onChange={e => setStatusUpdateItem({ ...statusUpdateItem, remarks: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStatusUpdateItem(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
