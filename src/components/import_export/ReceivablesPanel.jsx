import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import {
  Clock,
  MessageCircle,
  AlertCircle,
  CheckCircle,
  Phone,
  Search,
  ExternalLink,
  RefreshCw,
  DollarSign,
  UserCheck,
  Send
} from 'lucide-react';

export function ReceivablesPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadReceivables();
  }, []);

  const loadReceivables = async () => {
    try {
      setLoading(true);
      const res = await api.getTradeReceivables();
      setData(res);
    } catch (err) {
      console.error('Failed to load receivables:', err);
    } finally {
      setLoading(false);
    }
  };

  const debtors = (data?.debtors || []).filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.phone && d.phone.includes(search))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                Receivables & Khata
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                Aging Breakdown
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1 tracking-tight">
              Customer Receivables & Aging
            </h2>
            <p className="text-xs text-slate-400">
              Track outstanding balances across aging buckets and send WhatsApp payment reminders
            </p>
          </div>
        </div>

        <button
          onClick={loadReceivables}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. Aging Buckets Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Outstanding Due</span>
          <div className="text-xl font-black text-rose-400 font-mono mt-1">
            ₹{Number(data?.total_outstanding || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400">{data?.total_debtors || 0} active party accounts</span>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">0 - 30 Days (Current)</span>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">
            ₹{Number(data?.aging_0_30 || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400">Normal trade credit cycle</span>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">31 - 60 Days (Follow-up)</span>
          <div className="text-xl font-black text-amber-400 font-mono mt-1">
            ₹{Number(data?.aging_31_60 || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-amber-400/80 font-medium">Payment follow-up recommended</span>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <span className="text-[10px] text-rose-500 uppercase font-bold tracking-wider">60+ Days (Critical Overdue)</span>
          <div className="text-xl font-black text-rose-500 font-mono mt-1">
            ₹{Number(data?.aging_60_plus || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-rose-400/80 font-medium">Critical recovery action required</span>
        </div>
      </div>

      {/* 3. Debtors List with WhatsApp Reminders */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search debtor name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Showing {debtors.length} parties with pending balances
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Party / Buyer Name</th>
                <th className="py-3 px-4">Phone Contact</th>
                <th className="py-3 px-4 text-right">Outstanding (₹)</th>
                <th className="py-3 px-4 text-center">Overdue Days</th>
                <th className="py-3 px-4 text-center">Aging Status</th>
                <th className="py-3 px-4 text-right">Instant WhatsApp Notice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {debtors.map((d) => {
                const days = d.days_overdue || 10;
                const isCrit = days > 60;
                const isMed = days > 30;

                return (
                  <tr key={d.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4">
                      <span className="font-bold text-white text-xs block">{d.name}</span>
                      <span className="text-[10px] text-slate-500">{d.email || 'Trade Client'}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {d.phone || 'No phone'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-400 text-sm">
                      ₹{Number(d.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-300">
                      {days} Days
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        isCrit
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : isMed
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {isCrit ? 'Critical (>60d)' : isMed ? 'Follow-up (31-60d)' : 'Current (0-30d)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {d.whatsapp_reminder_link ? (
                        <a
                          href={d.whatsapp_reminder_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition text-xs shadow-md shadow-emerald-600/20"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Send WA Reminder</span>
                        </a>
                      ) : (
                        <span className="text-slate-600 text-[10px]">No phone linked</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
