import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { formatCurrency, formatDate, getExpiryStatus } from '../../utils/formatters';
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  FileCheck2,
  Phone,
  RefreshCw,
  Search,
  CheckCircle2
} from 'lucide-react';

export function ExpiryScreen() {
  const [activeTab, setActiveTab] = useState('expiry'); // 'expiry' | 'schedule'
  const [expiryFilter, setExpiryFilter] = useState('all'); // 'all', 'expired', '30days', '60days', '90days'
  const [batches, setBatches] = useState([]);
  const [scheduleDrugs, setScheduleDrugs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'expiry') {
      loadExpiryReport();
    } else {
      loadScheduleReport();
    }
  }, [activeTab, expiryFilter]);

  const loadExpiryReport = async () => {
    setLoading(true);
    try {
      const data = await api.getExpiryReport(expiryFilter);
      setBatches(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadScheduleReport = async () => {
    setLoading(true);
    try {
      const data = await api.getScheduleDrugs();
      setScheduleDrugs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalRiskValue = batches.reduce((sum, b) => sum + (Number(b.risk_value) || 0), 0);
  const expiredCount = batches.filter(b => b.days_to_expiry <= 0).length;
  const nearExpiryCount = batches.filter(b => b.days_to_expiry > 0 && b.days_to_expiry <= 60).length;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden select-none">
      {/* Top Banner & Mode Toggle */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            Expiry Risk & Regulatory Compliance Center
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            FEFO batch monitoring, supplier return debit notes, and Schedule H/H1 inspection audit logs
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex text-xs">
          <button
            onClick={() => setActiveTab('expiry')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'expiry'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Near Expiry & Quarantine ({batches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'schedule'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Schedule H / H1 Register</span>
          </button>
        </div>
      </div>

      {activeTab === 'expiry' ? (
        <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-4">
          {/* KPI Risk Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium">Capital at Risk (Cost Value)</span>
                <span className="text-lg font-black font-mono text-rose-400 mt-1 block">
                  {formatCurrency(totalRiskValue)}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium">Expired Batches (Quarantine)</span>
                <span className="text-lg font-black font-mono text-white mt-1 block">
                  {expiredCount} <span className="text-xs font-normal text-rose-400">batches</span>
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium">Expiring within 60 Days</span>
                <span className="text-lg font-black font-mono text-amber-400 mt-1 block">
                  {nearExpiryCount} <span className="text-xs font-normal text-slate-400">batches</span>
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-medium">Filter Expiry:</span>
            {[
              { id: 'all', label: 'All (< 90 Days)' },
              { id: 'expired', label: 'Expired Only' },
              { id: '30days', label: '< 30 Days' },
              { id: '60days', label: '< 60 Days' },
              { id: '90days', label: '< 90 Days' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setExpiryFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                  expiryFilter === f.id
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Expiry Table */}
          <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px] sticky top-0">
                <tr>
                  <th className="py-3 px-4">Medicine / Item</th>
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4 text-center">Remaining Stock</th>
                  <th className="py-3 px-4 text-right">Cost at Risk</th>
                  <th className="py-3 px-4">Supplier for Return / Debit Note</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">Loading batch expiry data...</td>
                  </tr>
                ) : batches.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-emerald-400 font-medium">
                      ✓ No batches found matching the selected expiry threshold!
                    </td>
                  </tr>
                ) : (
                  batches.map(b => {
                    const expInfo = getExpiryStatus(b.expiry_date);
                    return (
                      <tr key={b.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-white text-sm">{b.product_name}</span>
                          <span className="text-[11px] text-slate-400 block">{b.salt_composition || '-'}</span>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-200">
                          {b.batch_number}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded border inline-block text-[11px] ${expInfo.color}`}>
                            {expInfo.label}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="font-bold font-mono text-white text-sm">
                            {b.stock_units}
                          </span>{' '}
                          <span className="text-slate-400 text-[11px]">{b.pack_unit || 'units'}</span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-400 text-sm">
                          {formatCurrency(b.risk_value)}
                        </td>

                        <td className="py-3 px-4">
                          {b.supplier_name ? (
                            <div>
                              <span className="text-slate-200 font-semibold">{b.supplier_name}</span>
                              {b.supplier_phone && (
                                <a
                                  href={`tel:${b.supplier_phone}`}
                                  className="text-[11px] text-sky-400 flex items-center gap-1 hover:underline mt-0.5"
                                >
                                  <Phone className="w-3 h-3" /> {b.supplier_phone}
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500">Unassigned</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Schedule H & H1 Inspection Audit Table */
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">
                Statutory Drug Inspector Compliance Register (Schedule H / H1 / Narcotic sales)
              </span>
              <span className="text-slate-400 font-mono">Showing last {scheduleDrugs.length} records</span>
            </div>

            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Invoice # & Date</th>
                  <th className="py-3 px-4">Prescribing Doctor</th>
                  <th className="py-3 px-4">Patient / Customer</th>
                  <th className="py-3 px-4">Scheduled Drug</th>
                  <th className="py-3 px-4">Schedule Category</th>
                  <th className="py-3 px-4 text-center">Batch / Exp</th>
                  <th className="py-3 px-4 text-right">Qty Dispensed</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/80">
                {scheduleDrugs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">
                      No Schedule H or H1 medicines billed yet.
                    </td>
                  </tr>
                ) : (
                  scheduleDrugs.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-white block">{row.invoice_number}</span>
                        <span className="text-[11px] text-slate-400">{formatDate(row.created_at)}</span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-sky-300">
                        {row.doctor_name || 'Dr. Not Specified'}
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-white font-medium block">{row.patient_name || row.customer_name}</span>
                        <span className="text-[11px] font-mono text-slate-400">{row.customer_phone || '-'}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-white block">{row.product_name}</span>
                        <span className="text-[11px] text-slate-400">{row.salt_composition}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {row.schedule_type}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono">
                        <span className="text-slate-200">{row.batch_number}</span>
                        <span className="text-[10px] text-slate-400 block">{row.expiry_date}</span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-white text-sm">
                        {row.quantity}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
