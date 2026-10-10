import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import {
  TrendingUp,
  Percent,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  Sparkles,
  PieChart,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

export function ProfitAnalysisPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfitData();
  }, []);

  const loadProfitData = async () => {
    try {
      setLoading(true);
      const res = await api.getTradeProfitAnalysis();
      setData(res);
    } catch (err) {
      console.error('Failed to load profit analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-400">
        Loading profit & margin analytics...
      </div>
    );
  }

  const bills = data?.bill_wise_profit || [];
  const daily = data?.daily_rollup || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                Profit & Margins
              </span>
              <span className="text-[11px] font-mono text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/20">
                COGS Tracking
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1 tracking-tight">
              Profit & Margin Analysis
            </h2>
            <p className="text-xs text-slate-400">
              Track gross profits, cost of goods sold (COGS), and invoice-level margin percentages
            </p>
          </div>
        </div>

        <button
          onClick={loadProfitData}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Sales Invoiced</span>
          <div className="text-xl font-black text-white font-mono mt-1">
            ₹{Number(data?.total_revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-sky-400 font-medium">Billed revenue across all invoices</span>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Purchase Cost</span>
          <div className="text-xl font-black text-slate-300 font-mono mt-1">
            ₹{Number(data?.total_cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Batch procurement acquisition cost</span>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Net Gross Profit</span>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1 flex items-center">
            ₹{Number(data?.total_profit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            <ArrowUpRight className="w-5 h-5 text-emerald-400 ml-1" />
          </div>
          <span className="text-[10px] text-emerald-500 font-medium">Revenue minus inventory COGS</span>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Overall Margin %</span>
          <div className="text-xl font-black text-teal-400 font-mono mt-1">
            {Number(data?.overall_margin_pct || 0).toFixed(1)}%
          </div>
          <span className="text-[10px] text-teal-500 font-medium">Weighted gross profit margin</span>
        </div>
      </div>

      {/* 3. Bill-Wise Profit Breakdown Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-white">
            <PieChart className="w-4 h-4 text-emerald-400" />
            <span>Bill-Wise Profit Breakdown</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">{bills.length} Invoices Tracked</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Sale Value (₹)</th>
                <th className="py-3 px-4 text-right">Cost Price (₹)</th>
                <th className="py-3 px-4 text-right">Net Profit (₹)</th>
                <th className="py-3 px-4 text-center">Margin %</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {bills.map((b, idx) => {
                const margin = Number(b.margin_pct || 0);
                const isHigh = margin >= 20;
                return (
                  <tr key={idx} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-sky-400">
                      {b.invoice_number}
                    </td>
                    <td className="py-3 px-4 text-white font-medium">
                      {b.customer_name}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {b.invoice_date}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-white">
                      ₹{Number(b.sale_value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      ₹{Number(b.cost_value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      ₹{Number(b.gross_profit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        isHigh ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-semibold ${isHigh ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {isHigh ? 'High Yield' : 'Standard'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Daily Rollup */}
      {daily.length > 0 && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-teal-400" />
            Daily Profit Rollup
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {daily.map((d, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-slate-400 font-semibold">{d.date}</span>
                  <span className="font-mono font-bold text-emerald-400">{d.margin_pct}% margin</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-[11px] text-slate-400">Gross Profit:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    ₹{Number(d.gross_profit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
