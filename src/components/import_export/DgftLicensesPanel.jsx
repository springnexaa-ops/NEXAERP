import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  Building2,
  Award,
  BadgeCheck,
  Coins,
  TrendingUp,
  Landmark,
  FileText,
  ExternalLink,
  Sparkles,
  X,
  Layers,
  Percent,
  Check,
  AlertCircle,
  Trash2,
  Filter
} from 'lucide-react';

export function DgftLicensesPanel() {
  const { showToast, currencySymbol } = useApp();
  const [licenses, setLicenses] = useState([]);
  const [iecProfile, setIecProfile] = useState(null);
  const [realizations, setRealizations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tab: 'licenses', 'ebrc'
  const [activeTab, setActiveTab] = useState('licenses');
  const [filterCategory, setFilterCategory] = useState('all');

  // Modals
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [isBrcModalOpen, setIsBrcModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState(null);

  // License Form State
  const [licenseForm, setLicenseForm] = useState({
    license_type: 'RCMC',
    license_number: '',
    issuing_authority: 'EPC',
    issue_date: new Date().toISOString().slice(0, 10),
    expiry_date: '',
    cif_value: '',
    fob_obligation_value: '',
    obligation_fulfilled_value: '0',
    status: 'active',
    scrip_balance: '0',
    epc_name: 'APEDA (Agricultural & Processed Food Products Export Development Authority)',
    dgft_file_number: '',
    eodc_status: 'pending',
    notes: ''
  });

  // e-BRC Form State
  const [brcForm, setBrcForm] = useState({
    shipping_bill_no: '',
    invoice_number: '',
    bank_name: 'State Bank of India (Overseas Branch)',
    authorized_dealer_code: '0210045',
    firc_number: '',
    ebrc_number: '',
    realized_amount_fcy: '',
    currency: 'USD',
    realized_amount_inr: '',
    realization_date: new Date().toISOString().slice(0, 10),
    edpms_status: 'closed'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [licData, iecData, brcData] = await Promise.all([
        api.getDgftLicenses(),
        api.getIecProfile(),
        api.getBankRealizations()
      ]);
      setLicenses(licData.licenses || []);
      setStats(licData.stats || null);
      setIecProfile(iecData || null);
      setRealizations(brcData.realizations || []);
    } catch (err) {
      console.error('Error loading DGFT data:', err);
      showToast('Failed to load DGFT licenses and schemes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLicense = async (e) => {
    e.preventDefault();
    if (!licenseForm.license_number) {
      showToast('Please enter License / Registration Number', 'error');
      return;
    }
    try {
      await api.createDgftLicense(licenseForm);
      showToast(`${licenseForm.license_type} registered successfully!`, 'success');
      setIsLicenseModalOpen(false);
      setLicenseForm({
        license_type: 'ADVANCE_AUTHORISATION',
        license_number: '',
        issuing_authority: 'DGFT',
        issue_date: new Date().toISOString().slice(0, 10),
        expiry_date: '',
        cif_value: '',
        fob_obligation_value: '',
        obligation_fulfilled_value: '0',
        status: 'active',
        scrip_balance: '0',
        epc_name: 'Pharmexcil',
        dgft_file_number: '',
        eodc_status: 'pending',
        notes: ''
      });
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to register license', 'error');
    }
  };

  const handleCreateBrc = async (e) => {
    e.preventDefault();
    if (!brcForm.shipping_bill_no || !brcForm.realized_amount_fcy) {
      showToast('Please enter Shipping Bill No and Realized Amount', 'error');
      return;
    }
    try {
      await api.createBankRealization(brcForm);
      showToast(`e-BRC recorded for SB #${brcForm.shipping_bill_no}!`, 'success');
      setIsBrcModalOpen(false);
      setBrcForm({
        shipping_bill_no: '',
        invoice_number: '',
        bank_name: 'State Bank of India (Overseas Branch)',
        authorized_dealer_code: '0210045',
        firc_number: '',
        ebrc_number: '',
        realized_amount_fcy: '',
        currency: 'USD',
        realized_amount_inr: '',
        realization_date: new Date().toISOString().slice(0, 10),
        edpms_status: 'closed'
      });
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to record bank realization', 'error');
    }
  };

  const handleUpdateLicense = async (e) => {
    e.preventDefault();
    if (!editingLicense) return;
    try {
      await api.updateDgftLicense(editingLicense.id, editingLicense);
      showToast('License details updated successfully', 'success');
      setEditingLicense(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update license', 'error');
    }
  };

  const handleDeleteLicense = async (licId, licNumber) => {
    if (!window.confirm(`Are you sure you want to remove statutory registration #${licNumber}?`)) return;
    try {
      await api.deleteDgftLicense(licId);
      showToast(`Registration #${licNumber} removed successfully`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete license', 'error');
    }
  };

  const getSchemeBadge = (type) => {
    switch (type) {
      case 'IEC':
        return { label: 'IEC Code', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
      case 'RCMC':
        return { label: 'RCMC Council', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
      case 'FSSAI_CENTRAL':
        return { label: 'FSSAI Central Export', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'FSSAI_STATE':
        return { label: 'FSSAI State Unit', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' };
      case 'ADVANCE_AUTHORISATION':
        return { label: 'Advance Auth (AA)', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'EPCG':
        return { label: 'EPCG Scheme', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'RODTEP':
        return { label: 'RoDTEP Scrips', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'LUT_GST':
        return { label: 'GST LUT Bond', color: 'bg-green-500/20 text-green-300 border-green-500/30' };
      case 'AEO':
        return { label: 'AEO Tier-1', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
      case 'CDSCO':
        return { label: 'CDSCO Export NOC', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      case 'BIS':
        return { label: 'BIS Quality Cert', color: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30' };
      default:
        return { label: type, color: 'bg-slate-700 text-slate-300 border-slate-600' };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-emerald-400" /> Directorate General of Foreign Trade (DGFT)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Foreign Trade Policy (FTP 2023-28)</span>
          </div>
          <h2 className="text-lg font-black text-white mt-1 tracking-tight">
            DGFT Licenses, IEC Registration, Export Schemes & e-BRC Realization
          </h2>
          <p className="text-xs text-slate-400">
            Monitor Advance Authorisation inputs, EPCG machinery obligations, RoDTEP duty credits, RCMC certifications, and RBI EDPMS status
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsBrcModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Landmark className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Record e-BRC</span>
          </button>

          <button
            onClick={() => setIsLicenseModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 active:scale-98 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Register License / Scheme</span>
          </button>
        </div>
      </div>

      {/* 2. IEC (Import Export Code) DGFT Master Profile Card */}
      {iecProfile && (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/40 border border-sky-500/30 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-sky-600/30">
                IEC
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-base font-extrabold text-white tracking-wider">
                    {iecProfile.iec_number}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" /> DGFT VALIDATED & ACTIVE
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-semibold mt-0.5">
                  {iecProfile.firm_name} • PAN: <strong className="font-mono text-sky-300">{iecProfile.pan}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800 text-xs">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Annual Renewal Status</div>
                <div className="font-bold text-emerald-400">{iecProfile.annual_renewal_fy}</div>
              </div>
              <div className="w-px h-6 bg-slate-800 mx-1" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Next Window Due</div>
                <div className="font-mono text-slate-200">{iecProfile.renewal_due_date}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registered Address</span>
              <p className="text-[11px] text-slate-300 leading-snug">{iecProfile.registered_address}</p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Factory Branches & SEZ</span>
              <div className="space-y-1 text-[11px] text-slate-300">
                {iecProfile.factory_branches.map((b, i) => (
                  <div key={i} className="flex justify-between items-center font-mono">
                    <span>Br #{b.code}: {b.city}</span>
                    <span className="text-[9px] text-sky-400">{b.activity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Digital Signature (DSC) & EDI</span>
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{iecProfile.dsc_esign_status}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{iecProfile.notes}</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Scheme Statistics Overview */}
      {(() => {
        const rcmcCount = licenses.filter(l => l.license_type === 'RCMC').length;
        const fssaiCount = licenses.filter(l => l.license_type && l.license_type.startsWith('FSSAI')).length;
        const schemesCount = licenses.filter(l => ['ADVANCE_AUTHORISATION', 'EPCG', 'RODTEP'].includes(l.license_type)).length;
        const regulatoryCount = licenses.filter(l => ['LUT_GST', 'AEO', 'CDSCO', 'BIS', 'IEC'].includes(l.license_type)).length;

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-md">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Multiple RCMCs</span>
                  <Award className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-xl font-black text-indigo-300 mt-1 font-mono">
                  {rcmcCount} Active
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">APEDA, Pharmexcil, EEPC</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-md">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Multiple FSSAIs</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-black text-emerald-300 mt-1 font-mono">
                  {fssaiCount} Licenses
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Central Export & State</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-md">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Advance Auth</span>
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-xl font-black text-white mt-1 font-mono truncate">
                  {formatCurrency(stats?.aa_fulfilled_total || 0)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  Obl: {formatCurrency(stats?.aa_obligation_total || 0)}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-md">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>EPCG Machinery</span>
                  <Award className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-xl font-black text-white mt-1 font-mono truncate">
                  {formatCurrency(stats?.epcg_fulfilled_total || 0)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  Obl: {formatCurrency(stats?.epcg_obligation_total || 0)}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-md">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>RoDTEP Scrips</span>
                  <Coins className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-black text-amber-300 mt-1 font-mono truncate">
                  {formatCurrency(stats?.rodtep_balance_total || 0)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Usable for BCD duty</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-md">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>e-BRC Desk</span>
                  <Landmark className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-xl font-black text-sky-300 mt-1 font-mono">
                  {realizations.length} Realized
                </div>
                <div className="text-[10px] text-emerald-400 mt-0.5">
                  {realizations.filter(r => r.edpms_status === 'closed').length} EDPMS Closed
                </div>
              </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setActiveTab('licenses')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'licenses'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Statutory Licenses & Schemes ({licenses.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('ebrc')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'ebrc'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Landmark className="w-4 h-4" />
                <span>e-BRC Bank Realisations & EDPMS ({realizations.length})</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* 5. TAB 1: DGFT LICENSES TABLE */}
      {activeTab === 'licenses' && (
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Top Filter Bar */}
          <div className="p-3 bg-slate-900/60 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: `All Registrations (${licenses.length})` },
                { id: 'rcmc', label: `Multiple RCMCs (${licenses.filter(l => l.license_type === 'RCMC').length})` },
                { id: 'fssai', label: `Multiple FSSAIs (${licenses.filter(l => l.license_type && l.license_type.startsWith('FSSAI')).length})` },
                { id: 'schemes', label: `DGFT Schemes (${licenses.filter(l => ['ADVANCE_AUTHORISATION', 'EPCG', 'RODTEP'].includes(l.license_type)).length})` },
                { id: 'regulatory', label: `Bonds & Quality (${licenses.filter(l => ['LUT_GST', 'AEO', 'CDSCO', 'BIS', 'IEC'].includes(l.license_type)).length})` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterCategory(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    filterCategory === f.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">FTP 2023 & FSSAI COMPLIANT</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
                <tr>
                  <th className="p-3">Registration & Number</th>
                  <th className="p-3">Issuing Authority / Council</th>
                  <th className="p-3">Validity Window</th>
                  <th className="p-3">CIF / Duty Value</th>
                  <th className="p-3">Export Obligation</th>
                  <th className="p-3">Status & EODC</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {licenses
                  .filter(lic => {
                    if (filterCategory === 'all') return true;
                    if (filterCategory === 'rcmc') return lic.license_type === 'RCMC';
                    if (filterCategory === 'fssai') return lic.license_type && lic.license_type.startsWith('FSSAI');
                    if (filterCategory === 'schemes') return ['ADVANCE_AUTHORISATION', 'EPCG', 'RODTEP'].includes(lic.license_type);
                    if (filterCategory === 'regulatory') return ['LUT_GST', 'AEO', 'CDSCO', 'BIS', 'IEC'].includes(lic.license_type);
                    return true;
                  })
                  .map(lic => {
                    const badge = getSchemeBadge(lic.license_type);

                    return (
                      <tr key={lic.id} className="hover:bg-slate-900/50 transition">
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${badge.color}`}>
                            {badge.label}
                          </span>
                          <div className="font-bold text-white text-xs mt-1 font-mono">
                            {lic.license_number}
                          </div>
                          {lic.epc_name && (
                            <div className="text-[10px] text-slate-400 leading-snug">{lic.epc_name}</div>
                          )}
                        </td>

                        <td className="p-3">
                          <div className="font-semibold text-slate-200">{lic.issuing_authority}</div>
                          {lic.dgft_file_number && (
                            <div className="text-[10px] text-slate-500 font-mono">{lic.dgft_file_number}</div>
                          )}
                        </td>

                        <td className="p-3">
                          <div className="text-slate-300">Issued: {lic.issue_date}</div>
                          <div className="text-slate-400 text-[11px]">Expires: {lic.expiry_date || 'Permanent'}</div>
                        </td>

                        <td className="p-3 font-mono">
                          {lic.license_type === 'RODTEP' ? (
                            <div>
                              <div className="text-amber-400 font-bold">{formatCurrency(lic.scrip_balance)}</div>
                              <span className="text-[9px] text-slate-500">Scrip Balance</span>
                            </div>
                          ) : (
                            <div>
                              <div className="text-slate-200">{formatCurrency(lic.cif_value)}</div>
                              <span className="text-[9px] text-slate-500">Duty-free CIF</span>
                            </div>
                          )}
                        </td>

                        <td className="p-3 font-mono">
                          {lic.fob_obligation_value > 0 ? (
                            <div>
                              <div className="font-bold text-emerald-400">
                                {formatCurrency(lic.obligation_fulfilled_value)} / {formatCurrency(lic.fob_obligation_value)}
                              </div>
                              <div className="w-28 bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full rounded-full"
                                  style={{
                                    width: `${Math.min(100, Math.round(((lic.obligation_fulfilled_value || 0) / lic.fob_obligation_value) * 100))}%`
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500">N/A</span>
                          )}
                        </td>

                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            lic.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700 text-slate-400'
                          }`}>
                            {lic.status.toUpperCase()}
                          </span>
                          {lic.eodc_status && lic.fob_obligation_value > 0 && (
                            <div className="text-[10px] text-slate-400 mt-1">
                              EODC: <strong className="text-slate-200">{lic.eodc_status}</strong>
                            </div>
                          )}
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingLicense({ ...lic })}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition"
                            >
                              Update
                            </button>
                            <button
                              onClick={() => handleDeleteLicense(lic.id, lic.license_number)}
                              title="Remove statutory registration"
                              className="p-1 rounded-lg bg-slate-900 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TAB 2: e-BRC BANK REALISATION DESK */}
      {activeTab === 'ebrc' && (
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-3">
          <div className="p-3.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between">
            <span className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-sky-400" />
              RBI EDPMS Export Realisation & Bank e-BRC Desk
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">FEMA 1999 COMPLIANT</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
                <tr>
                  <th className="p-3">Shipping Bill & Invoice</th>
                  <th className="p-3">Authorized Dealer Bank</th>
                  <th className="p-3">e-BRC / FIRC Number</th>
                  <th className="p-3">Realized Amount (FCY & INR)</th>
                  <th className="p-3">Realization Date</th>
                  <th className="p-3">RBI EDPMS Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {realizations.map(r => (
                  <tr key={r.id} className="hover:bg-slate-900/50 transition">
                    <td className="p-3 font-mono">
                      <div className="font-bold text-white text-xs">{r.shipping_bill_no}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Inv: {r.invoice_number}</div>
                    </td>

                    <td className="p-3">
                      <div className="font-semibold text-slate-200">{r.bank_name}</div>
                      {r.authorized_dealer_code && (
                        <div className="text-[10px] text-slate-500 font-mono">AD Code: {r.authorized_dealer_code}</div>
                      )}
                    </td>

                    <td className="p-3 font-mono">
                      <div className="text-emerald-400 font-bold">{r.ebrc_number || 'Pending'}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">FIRC: {r.firc_number}</div>
                    </td>

                    <td className="p-3 font-mono">
                      <div className="font-bold text-white text-xs">
                        {r.currency} {Number(r.realized_amount_fcy).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatCurrency(r.realized_amount_inr)}
                      </div>
                    </td>

                    <td className="p-3 text-slate-300">
                      {r.realization_date}
                    </td>

                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.edpms_status === 'closed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        EDPMS {r.edpms_status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL: REGISTER DGFT LICENSE ================= */}
      {isLicenseModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-emerald-500/30 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-8 animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 p-5 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-black text-white text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" /> Register DGFT License / Export Promotion Scheme
                </h3>
                <p className="text-[11px] text-slate-400">Advance Authorisation, EPCG, RoDTEP, RCMC, and GST LUT</p>
              </div>
              <button onClick={() => setIsLicenseModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLicense} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Registration / License Type *</label>
                  <select
                    value={licenseForm.license_type}
                    onChange={e => {
                      const t = e.target.value;
                      let defaultAuth = 'DGFT';
                      let defaultEpc = licenseForm.epc_name;
                      if (t === 'RCMC') {
                        defaultAuth = 'EPC';
                        defaultEpc = 'APEDA (Agricultural & Processed Food Products Export Development Authority)';
                      } else if (t === 'FSSAI_CENTRAL') {
                        defaultAuth = 'FSSAI_CENTRAL';
                        defaultEpc = 'Central Licensing Authority - FSSAI (100% EOU & Merchant Exporter)';
                      } else if (t === 'FSSAI_STATE') {
                        defaultAuth = 'FDA_STATE';
                        defaultEpc = 'Food & Drugs Administration (State Manufacturing Unit)';
                      } else if (t === 'LUT_GST') {
                        defaultAuth = 'GSTN';
                      } else if (t === 'AEO') {
                        defaultAuth = 'CBIC_CUSTOMS';
                      } else if (t === 'CDSCO') {
                        defaultAuth = 'CDSCO_CENTRAL';
                      } else if (t === 'BIS') {
                        defaultAuth = 'BIS';
                      }
                      setLicenseForm({
                        ...licenseForm,
                        license_type: t,
                        issuing_authority: defaultAuth,
                        epc_name: defaultEpc
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="RCMC">RCMC (Export Promotion Council Membership)</option>
                    <option value="FSSAI_CENTRAL">Central FSSAI License (100% EOU / Merchant Exporter)</option>
                    <option value="FSSAI_STATE">State FSSAI License (Manufacturing / Packing Unit)</option>
                    <option value="ADVANCE_AUTHORISATION">Advance Authorisation (AA Duty-Free Inputs)</option>
                    <option value="EPCG">EPCG Capital Goods Scheme</option>
                    <option value="RODTEP">RoDTEP Duty Credit Scrips</option>
                    <option value="LUT_GST">GST LUT Export Bond (Rule 96A)</option>
                    <option value="AEO">AEO Tier-1/2 Accreditation</option>
                    <option value="CDSCO">CDSCO Dual-Use & Export Clearance NOC</option>
                    <option value="BIS">Bureau of Indian Standards (BIS) Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">
                    {licenseForm.license_type.startsWith('FSSAI')
                      ? '14-Digit FSSAI License Number *'
                      : 'License / Registration Number *'}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={licenseForm.license_type.startsWith('FSSAI') ? 14 : 40}
                    placeholder={licenseForm.license_type.startsWith('FSSAI') ? 'e.g. 10022026001928 (14 digits)' : 'e.g. APEDA/RCMC/2026/8812'}
                    value={licenseForm.license_number}
                    onChange={e => setLicenseForm({ ...licenseForm, license_number: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* RCMC Specific Council Selector */}
              {licenseForm.license_type === 'RCMC' && (
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Select Export Promotion Council (RCMC) *</label>
                  <select
                    value={licenseForm.epc_name}
                    onChange={e => setLicenseForm({ ...licenseForm, epc_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="APEDA (Agricultural & Processed Food Products Export Development Authority)">APEDA - Agri, Rice & Processed Foods</option>
                    <option value="Pharmexcil (Pharmaceuticals Export Promotion Council of India)">Pharmexcil - Bulk Drugs & Pharmaceuticals</option>
                    <option value="EEPC India (Engineering Export Promotion Council)">EEPC India - Engineering Machinery & Equipment</option>
                    <option value="Spices Board India (Ministry of Commerce & Industry)">Spices Board - Cardamom, Pepper & Spices</option>
                    <option value="FIEO (Federation of Indian Export Organisations)">FIEO - Apex Exporters Body (Multi-Product)</option>
                    <option value="MPEDA (Marine Products Export Development Authority)">MPEDA - Marine & Seafood Exports</option>
                    <option value="Tea Board of India">Tea Board of India</option>
                    <option value="Coffee Board of India">Coffee Board of India</option>
                    <option value="Chemexcil (Basic Chemicals, Cosmetics & Dyes)">Chemexcil - Basic Chemicals & Formulations</option>
                  </select>
                </div>
              )}

              {/* FSSAI Authority Details */}
              {(licenseForm.license_type === 'FSSAI_CENTRAL' || licenseForm.license_type === 'FSSAI_STATE') && (
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-300">FSSAI Authority Division / Unit Location</span>
                    <span className="text-emerald-400 font-mono">14-DIGIT VERIFIED</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Central Licensing Authority WR (JNPT SEZ) or State FDA MIDC Taloja"
                    value={licenseForm.epc_name}
                    onChange={e => setLicenseForm({ ...licenseForm, epc_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                  <p className="text-[10px] text-slate-400">
                    * This FSSAI license will immediately link to the <strong>FSSAI Label Generator</strong> for 1-click statutory export sticker printing.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Issue Date</label>
                  <input
                    type="date"
                    value={licenseForm.issue_date}
                    onChange={e => setLicenseForm({ ...licenseForm, issue_date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Expiry / Validity Date</label>
                  <input
                    type="date"
                    value={licenseForm.expiry_date}
                    onChange={e => setLicenseForm({ ...licenseForm, expiry_date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {licenseForm.license_type === 'ADVANCE_AUTHORISATION' || licenseForm.license_type === 'EPCG' ? (
                <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div>
                    <label className="text-slate-400 block mb-1">Duty-Free CIF Value (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5000000"
                      value={licenseForm.cif_value}
                      onChange={e => setLicenseForm({ ...licenseForm, cif_value: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">FOB Export Obligation (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 7500000"
                      value={licenseForm.fob_obligation_value}
                      onChange={e => setLicenseForm({ ...licenseForm, fob_obligation_value: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>
              ) : null}

              {licenseForm.license_type === 'RODTEP' && (
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Scrip Credit Balance (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 150000"
                    value={licenseForm.scrip_balance}
                    onChange={e => setLicenseForm({ ...licenseForm, scrip_balance: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              )}

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Issuing Authority / Portal Reference</label>
                <input
                  type="text"
                  placeholder="e.g. DGFT, CBIC Customs, FSSAI Central, GSTN, EPC"
                  value={licenseForm.issuing_authority}
                  onChange={e => setLicenseForm({ ...licenseForm, issuing_authority: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Commodity Scope, File Reference & Notes</label>
                <textarea
                  rows="2"
                  placeholder="Commodity coverage, ARN number, authorized premises address"
                  value={licenseForm.notes}
                  onChange={e => setLicenseForm({ ...licenseForm, notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLicenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Register License / Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: RECORD e-BRC REALISATION ================= */}
      {isBrcModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-sky-500/30 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8 animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-slate-950 p-5 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-black text-white text-sm flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-sky-400" /> Record Bank Realisation (e-BRC / EDPMS)
                </h3>
                <p className="text-[11px] text-slate-400">Foreign inward remittance certificate and RBI closure</p>
              </div>
              <button onClick={() => setIsBrcModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBrc} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Shipping Bill No *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SB-7190281"
                    value={brcForm.shipping_bill_no}
                    onChange={e => setBrcForm({ ...brcForm, shipping_bill_no: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Invoice Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EXP-26-000001"
                    value={brcForm.invoice_number}
                    onChange={e => setBrcForm({ ...brcForm, invoice_number: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Authorized Dealer (AD) Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. State Bank of India, Overseas Branch"
                  value={brcForm.bank_name}
                  onChange={e => setBrcForm({ ...brcForm, bank_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">AD Bank Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 0210045"
                    value={brcForm.authorized_dealer_code}
                    onChange={e => setBrcForm({ ...brcForm, authorized_dealer_code: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">e-BRC Number</label>
                  <input
                    type="text"
                    placeholder="e.g. SBI-BRC-2026-00412"
                    value={brcForm.ebrc_number}
                    onChange={e => setBrcForm({ ...brcForm, ebrc_number: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Realized Amount (FCY) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 18500"
                    value={brcForm.realized_amount_fcy}
                    onChange={e => setBrcForm({ ...brcForm, realized_amount_fcy: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Currency</label>
                  <select
                    value={brcForm.currency}
                    onChange={e => setBrcForm({ ...brcForm, currency: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="AED">AED (د.إ)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Realization Date</label>
                  <input
                    type="date"
                    value={brcForm.realization_date}
                    onChange={e => setBrcForm({ ...brcForm, realization_date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">RBI EDPMS Status</label>
                  <select
                    value={brcForm.edpms_status}
                    onChange={e => setBrcForm({ ...brcForm, edpms_status: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="closed">Closed (Settled)</option>
                    <option value="open">Open (Partially Realized)</option>
                    <option value="extension_sought">Extension Sought</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBrcModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold"
                >
                  Save e-BRC Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: UPDATE OBLIGATION / STATUS ================= */}
      {editingLicense && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-950 border border-emerald-500/30 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-xs">
                  Update Scheme: {editingLicense.license_number}
                </h3>
                <span className="text-[10px] text-slate-400">{editingLicense.license_type}</span>
              </div>
              <button onClick={() => setEditingLicense(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUpdateLicense} className="p-4 space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">License Status</label>
                <select
                  value={editingLicense.status}
                  onChange={e => setEditingLicense({ ...editingLicense, status: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="active">Active</option>
                  <option value="utilized">Fully Utilized</option>
                  <option value="expired">Expired</option>
                  <option value="surrendered">Surrendered</option>
                </select>
              </div>

              {editingLicense.fob_obligation_value > 0 && (
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Fulfilled Obligation (₹)</label>
                  <input
                    type="number"
                    value={editingLicense.obligation_fulfilled_value || 0}
                    onChange={e => setEditingLicense({ ...editingLicense, obligation_fulfilled_value: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                  <div className="text-[10px] text-slate-400 mt-1">
                    Total Obligation: {formatCurrency(editingLicense.fob_obligation_value)}
                  </div>
                </div>
              )}

              {editingLicense.license_type === 'RODTEP' && (
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Scrip Credit Balance (₹)</label>
                  <input
                    type="number"
                    value={editingLicense.scrip_balance || 0}
                    onChange={e => setEditingLicense({ ...editingLicense, scrip_balance: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              )}

              {editingLicense.fob_obligation_value > 0 && (
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">EODC Redemption Status</label>
                  <select
                    value={editingLicense.eodc_status || 'pending'}
                    onChange={e => setEditingLicense({ ...editingLicense, eodc_status: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="pending">Pending (Obligation Incomplete)</option>
                    <option value="applied">Applied to DGFT (Redemption Requested)</option>
                    <option value="discharged">Discharged (EODC Certificate Issued)</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingLicense(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
