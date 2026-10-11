import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useApp } from '../../context/AppContext';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Building2,
  FileText,
  AlertCircle,
  Plus,
  RefreshCw,
  Send,
  ExternalLink,
  Award,
  Stamp
} from 'lucide-react';

export function PreFilingChecklistPanel({ activePersona = 'cha_agent' }) {
  const { currentTenant, showToast, user } = useApp();
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form for New Checklist
  const [form, setForm] = useState({
    shipment_number: 'SHP-2026-IMP-8821',
    declaration_type: 'bill_of_entry',
    document_ref_number: 'BOE-DEL-2026-004812',
    cha_agency_name: 'FastTrack Customs Clearance Services',
    cha_agency_code: 'CHA-DEL-9921',
    verified_by_cha: 'Rajesh Sharma (Lic # 11/2012)',
    iec_ad_code_verified: 1,
    hsn_tariff_verified: 1,
    invoice_packing_match: 1,
    origin_certificate_verified: 1,
    regulatory_noc_verified: 1,
    duty_cess_verified: 1,
    notes: 'All 6 compliance criteria verified against ICEGATE v2.0 portal.'
  });

  useEffect(() => {
    loadChecklists();
  }, [activePersona]);

  const loadChecklists = async () => {
    try {
      setLoading(true);
      // If CHA agent, filter by their agency or view all assigned checklists
      const agencyFilter = activePersona === 'cha_agent' ? 'FastTrack Customs Clearance Services' : null;
      const res = await api.getChecklists(agencyFilter);
      setChecklists(res.checklists || []);
    } catch (err) {
      console.error('Error loading pre-filing checklists:', err);
      showToast('Error loading pre-filing checklists', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id, status) => {
    try {
      await api.verifyChecklist(id, {
        status,
        verified_by_cha: user?.name || 'Rajesh Sharma (CHA Partner)',
        notes: `Checklist certified and signed by CHA at ${new Date().toLocaleTimeString()}`
      });
      showToast(`Checklist status updated to ${status}!`, 'success');
      loadChecklists();
    } catch (err) {
      showToast(err.message || 'Verification failed', 'error');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createChecklist(form);
      showToast(`Checklist for ${form.document_ref_number} created!`, 'success');
      setShowAddModal(false);
      loadChecklists();
    } catch (err) {
      showToast(err.message || 'Failed to create checklist', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950/80 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                Customs & Compliance Tier
              </span>
              <span className="text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md">
                ICEGATE v2.0 EDI Compliance
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">6-Point Pre-Filing Checklist Verification</h2>
            <p className="text-xs text-slate-400">
              Verify BOE / Shipping Bill declarations before transmission to Indian Customs ICEGATE server
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Pre-Filing Audit</span>
          </button>

          <button
            onClick={loadChecklists}
            disabled={loading}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-2xl border border-slate-800 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 6-Point Compliance Standards Banner */}
      <div className="bg-slate-950/70 p-4 rounded-3xl border border-slate-800 grid grid-cols-2 md:grid-cols-6 gap-3 text-center text-xs">
        <div className="p-2.5 bg-slate-900/60 rounded-2xl border border-slate-800">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Point 1</div>
          <div className="font-bold text-sky-400 mt-1">IEC & AD Code</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Customs Port EDI Link</div>
        </div>
        <div className="p-2.5 bg-slate-900/60 rounded-2xl border border-slate-800">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Point 2</div>
          <div className="font-bold text-sky-400 mt-1">HSN 8-Digit Match</div>
          <div className="text-[10px] text-slate-500 mt-0.5">CBIC Tariff Notifications</div>
        </div>
        <div className="p-2.5 bg-slate-900/60 rounded-2xl border border-slate-800">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Point 3</div>
          <div className="font-bold text-sky-400 mt-1">Invoice & Packing</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Gross/Net Weight Harmony</div>
        </div>
        <div className="p-2.5 bg-slate-900/60 rounded-2xl border border-slate-800">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Point 4</div>
          <div className="font-bold text-sky-400 mt-1">Origin Cert (COO)</div>
          <div className="text-[10px] text-slate-500 mt-0.5">FTA / Preferential Tariff</div>
        </div>
        <div className="p-2.5 bg-slate-900/60 rounded-2xl border border-slate-800">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Point 5</div>
          <div className="font-bold text-sky-400 mt-1">FSSAI / ADC NOC</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Single Window Release</div>
        </div>
        <div className="p-2.5 bg-slate-900/60 rounded-2xl border border-slate-800">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Point 6</div>
          <div className="font-bold text-sky-400 mt-1">Duty Assessment</div>
          <div className="text-[10px] text-slate-500 mt-0.5">BCD + SWS + IGST Accrual</div>
        </div>
      </div>

      {/* Checklist Cards */}
      <div className="space-y-4">
        {checklists.map((item) => {
          const checks = [
            { key: 'iec_ad_code_verified', label: 'IEC & AD Code Linked with Port EDI' },
            { key: 'hsn_tariff_verified', label: '8-Digit HSN Classification & Duty Schedule' },
            { key: 'invoice_packing_match', label: 'Invoice & Packing List Gross/Net Weight Match' },
            { key: 'origin_certificate_verified', label: 'Certificate of Origin (COO / Form A) Attached' },
            { key: 'regulatory_noc_verified', label: 'FSSAI / ADC / Phytosanitary Regulatory NOC' },
            { key: 'duty_cess_verified', label: 'Customs Duty, SWS (10%) & IGST Assessed' }
          ];

          const passedCount = checks.filter(c => Number(item[c.key]) === 1).length;
          const isAllPassed = passedCount === checks.length;

          return (
            <div
              key={item.id}
              className={`bg-slate-950/80 rounded-3xl border p-5 shadow-xl transition space-y-4 ${
                item.status === 'icegate_filed'
                  ? 'border-purple-500/50 shadow-purple-950/20'
                  : item.status === 'verified_by_cha'
                  ? 'border-emerald-500/50 shadow-emerald-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs ${
                    item.declaration_type === 'bill_of_entry'
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {item.declaration_type === 'bill_of_entry' ? 'BOE' : 'SB'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-bold text-white font-mono">{item.document_ref_number}</span>
                      <span className="text-[11px] font-mono text-slate-300 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                        {item.shipment_number}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2">
                      <span>Agency: {item.cha_agency_name} ({item.cha_agency_code})</span>
                      {item.verified_by_cha && <span>• Certified by: {item.verified_by_cha}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      item.status === 'icegate_filed'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : item.status === 'verified_by_cha'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {item.status === 'icegate_filed' ? 'ICEGATE FILED & TRANSMITTED' :
                       item.status === 'verified_by_cha' ? 'VERIFIED BY CHA BROKER' :
                       'PENDING CHA REVIEW'}
                    </span>
                    <div className="text-[11px] text-slate-400 mt-1 font-mono">
                      Compliance: {passedCount} / 6 Criteria Verified
                    </div>
                  </div>

                  {item.status !== 'icegate_filed' && (
                    <div className="flex items-center space-x-2">
                      {item.status !== 'verified_by_cha' && (
                        <button
                          onClick={() => handleVerify(item.id, 'verified_by_cha')}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-1 shadow-md shadow-emerald-600/30"
                        >
                          <Stamp className="w-4 h-4" />
                          <span>Sign & Verify</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleVerify(item.id, 'icegate_filed')}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-1 shadow-md shadow-purple-600/30"
                      >
                        <Send className="w-4 h-4" />
                        <span>File to ICEGATE</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 6-Point Criteria Interactive Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 border-t border-slate-900">
                {checks.map((c, i) => {
                  const isVerified = Number(item[c.key]) === 1;
                  return (
                    <div
                      key={c.key}
                      className={`flex items-start space-x-2.5 p-2.5 rounded-xl border text-xs ${
                        isVerified
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      {isVerified ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-semibold text-white">Criterion #{i + 1}</div>
                        <div className="text-[11px] text-slate-300 mt-0.5">{c.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {item.notes && (
                <div className="text-xs text-slate-400 bg-slate-900/40 p-2.5 rounded-xl border border-slate-850">
                  <span className="font-bold text-slate-300">CHA Notes:</span> {item.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: New Checklist */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Draft Pre-Filing Customs Checklist</h3>
                  <p className="text-xs text-slate-400">Initialize 6-point verification for Bill of Entry / Shipping Bill</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Declaration Type</label>
                  <select
                    value={form.declaration_type}
                    onChange={(e) => setForm({ ...form, declaration_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="bill_of_entry">Bill of Entry (Import Clearance)</option>
                    <option value="shipping_bill">Shipping Bill (Export Clearance)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Document Reference #</label>
                  <input
                    type="text"
                    value={form.document_ref_number}
                    onChange={(e) => setForm({ ...form, document_ref_number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                    placeholder="e.g. BOE-DEL-2026-004812"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Shipment Reference</label>
                  <input
                    type="text"
                    value={form.shipment_number}
                    onChange={(e) => setForm({ ...form, shipment_number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">CHA Agency Name</label>
                  <input
                    type="text"
                    value={form.cha_agency_name}
                    onChange={(e) => setForm({ ...form, cha_agency_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="text-xs font-bold text-emerald-400 mb-2">Checklist Verification Verification Points:</div>
                {[
                  { key: 'iec_ad_code_verified', label: '1. IEC & Authorized Dealer (AD) Code active on Port EDI' },
                  { key: 'hsn_tariff_verified', label: '2. 8-Digit HSN & CBIC Customs Tariff rate verified' },
                  { key: 'invoice_packing_match', label: '3. Commercial Invoice and Packing List quantities harmonize' },
                  { key: 'origin_certificate_verified', label: '4. Certificate of Origin (COO / FTA) document attached' },
                  { key: 'regulatory_noc_verified', label: '5. FSSAI / ADC / Phytosanitary NOC obtained' },
                  { key: 'duty_cess_verified', label: '6. Basic Customs Duty (BCD), SWS & IGST verified' }
                ].map(c => (
                  <label key={c.key} className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Number(form[c.key]) === 1}
                      onChange={(e) => setForm({ ...form, [c.key]: e.target.checked ? 1 : 0 })}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Compliance Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows="2"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Verification notes or discrepancy notes"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-600/30 transition flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create Pre-Filing Checklist</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
