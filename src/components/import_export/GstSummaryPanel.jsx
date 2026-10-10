import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import {
  FileSpreadsheet,
  Download,
  ShieldCheck,
  CheckCircle2,
  FileText,
  TrendingUp,
  Receipt,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export function GstSummaryPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGst();
  }, []);

  const loadGst = async () => {
    try {
      setLoading(true);
      const res = await api.getTradeGstSummary();
      setData(res);
    } catch (err) {
      console.error('Failed to load GST summary:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-400">
        Loading GST & GSTR-1 filing reports...
      </div>
    );
  }

  const gstr1 = data?.gstr1 || {};
  const gstr3b = data?.gstr3b || {};
  const hsn = data?.hsn_summary || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/20">
                Tax Reports
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                GSTR-1 & 3B
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1 tracking-tight">
              GST Filing & Returns
            </h2>
            <p className="text-xs text-slate-400">
              GSTR-1 outward supplies, GSTR-3B liabilities, Table 6A exports under LUT, and HSN summaries
            </p>
          </div>
        </div>

        <button
          onClick={loadGst}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. GSTR-1 & GSTR-3B Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GSTR-1 Return Box */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                GSTR-1 Outward Supplies Summary
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              {gstr1.lut_bond_status}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-900 text-slate-400">
              <span>Total Invoices Registered:</span>
              <span className="font-mono font-bold text-white">{gstr1.total_invoices || 0}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900 text-slate-400">
              <span>Table 4: B2B Registered Sales:</span>
              <span className="font-mono font-bold text-sky-400">₹{Number(gstr1.b2b_invoices_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900 text-slate-400">
              <span>Table 5: B2C Large & Retail Sales:</span>
              <span className="font-mono font-bold text-slate-300">₹{Number(gstr1.b2c_invoices_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-1.5 bg-indigo-950/40 px-3 rounded-xl border border-indigo-800/40 text-indigo-300 font-semibold">
              <span>Table 6A: Exports Under LUT (Zero-Rated):</span>
              <span className="font-mono font-bold text-emerald-400">₹{Number(gstr1.table_6a_exports_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* GSTR-3B Tax Liability Box */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                GSTR-3B Monthly Tax Liability
              </h3>
            </div>
            <span className="text-[10px] font-mono text-sky-400">Auto-Computed</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-900 text-slate-400">
              <span>Total Taxable Turnover:</span>
              <span className="font-mono font-bold text-white">₹{Number(gstr3b.total_taxable_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900 text-slate-400">
              <span>CGST (Central GST) Payable:</span>
              <span className="font-mono font-semibold text-slate-300">₹{Number(gstr3b.cgst_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900 text-slate-400">
              <span>SGST (State GST) Payable:</span>
              <span className="font-mono font-semibold text-slate-300">₹{Number(gstr3b.sgst_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900 text-slate-400">
              <span>IGST (Integrated GST):</span>
              <span className="font-mono font-semibold text-slate-300">₹{Number(gstr3b.igst_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-1.5 bg-slate-900 px-3 rounded-xl border border-slate-800 text-white font-bold">
              <span>Total Net GST Liability:</span>
              <span className="font-mono text-emerald-400">₹{Number(gstr3b.total_tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. HSN/SAC Summary Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-white">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Table 12: HSN Summary of Outward Supplies</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">{hsn.length} HSN Categories</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">HSN Code</th>
                <th className="py-3 px-4">Description of Goods</th>
                <th className="py-3 px-4 text-center">UQC</th>
                <th className="py-3 px-4 text-right">Total Qty</th>
                <th className="py-3 px-4 text-right">Total Value (₹)</th>
                <th className="py-3 px-4 text-center">Rate</th>
                <th className="py-3 px-4 text-right">Tax Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {hsn.map((h, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-sky-400">
                    {h.hsn_code}
                  </td>
                  <td className="py-3 px-4 text-white font-medium">
                    {h.description}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-400">
                    {h.uqc}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-white">
                    {h.total_qty}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-white">
                    ₹{Number(h.total_value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-400">
                    {h.tax_rate}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                    ₹{Number(h.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
