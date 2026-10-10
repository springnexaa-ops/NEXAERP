import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import {
  BarChart3,
  Calendar,
  DollarSign,
  CreditCard,
  Banknote,
  BookOpen,
  Printer,
  FileSpreadsheet
} from 'lucide-react';

export function ReportsScreen() {
  const [activeReport, setActiveReport] = useState('daily'); // 'daily' | 'gst'
  const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10));
  const [dailyData, setDailyData] = useState(null);
  const [gstData, setGstData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeReport === 'daily') {
      loadDailyRegister();
    } else {
      loadGstReport();
    }
  }, [activeReport, targetDate]);

  const loadDailyRegister = async () => {
    setLoading(true);
    try {
      const data = await api.getDailyRegister(targetDate);
      setDailyData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadGstReport = async () => {
    setLoading(true);
    try {
      const data = await api.getGstReport();
      setGstData(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const summary = dailyData?.summary || {};
  const udharCollected = dailyData?.udharSettledToday || 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden select-none">
      {/* Top Bar */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-400" />
            Financial Analytics & Day Closing (Z-Report)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cash drawer settlement, payment reconciliations, and HSN-wise GST tax registers
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeReport === 'daily' && (
            <div className="flex items-center space-x-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="bg-transparent text-white font-mono focus:outline-none"
              />
            </div>
          )}

          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex text-xs">
            <button
              onClick={() => setActiveReport('daily')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeReport === 'daily'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Day Closing / Z-Report
            </button>
            <button
              onClick={() => setActiveReport('gst')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeReport === 'gst'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              GST HSN Summary
            </button>
          </div>
        </div>
      </div>

      {activeReport === 'daily' ? (
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {/* Cash Drawer Reconciliation KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Cash Collected in Drawer</span>
              <span className="text-lg font-black font-mono text-emerald-400 mt-1 block">
                {formatCurrency(summary.cash_collected || 0)}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Physical Cash Counter</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">UPI / Digital Payments</span>
              <span className="text-lg font-black font-mono text-sky-400 mt-1 block">
                {formatCurrency(summary.upi_collected || 0)}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Bank / QR Code verified</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">New Udhar Issued</span>
              <span className="text-lg font-black font-mono text-amber-400 mt-1 block">
                {formatCurrency(summary.udhar_issued || 0)}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Debit added to Khatas</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Udhar Settle Collected</span>
              <span className="text-lg font-black font-mono text-teal-400 mt-1 block">
                {formatCurrency(udharCollected)}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Payment-In received</span>
            </div>
          </div>

          {/* Daily Totals Banner */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs gap-3">
            <div>
              <span className="text-slate-400 font-medium">Total Billed Invoices for {formatDate(targetDate)}:</span>{' '}
              <strong className="text-white text-sm ml-1">{summary.total_invoices || 0} Bills</strong>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-slate-400">Total GST Tax: <strong className="text-slate-200">{formatCurrency(summary.total_tax || 0)}</strong></span>
              <span className="text-slate-400">Total Discounts: <strong className="text-slate-200">{formatCurrency(summary.total_discount || 0)}</strong></span>
              <span className="text-slate-200 font-bold text-sm">
                Total Day Sales:{' '}
                <strong className="text-emerald-400 font-mono text-base ml-1">
                  {formatCurrency(summary.total_sales || 0)}
                </strong>
              </span>
            </div>
          </div>

          {/* Day's Invoices List */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3 bg-slate-900 border-b border-slate-800 text-xs font-bold text-slate-300">
              Sales Ledger Register for {formatDate(targetDate)}
            </div>

            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-center">Payment Mode</th>
                  <th className="py-3 px-4 text-right">Tax (₹)</th>
                  <th className="py-3 px-4 text-right">Total (₹)</th>
                  <th className="py-3 px-4 text-right">Time</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/80">
                {dailyData?.invoices?.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-slate-500">
                      No sales recorded for this date.
                    </td>
                  </tr>
                ) : (
                  dailyData?.invoices?.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white">{inv.invoice_number}</td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{inv.customer_name || 'Walk-in'}</td>
                      <td className="py-3 px-4 text-center">{inv.total_items}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          inv.payment_mode === 'cash' ? 'bg-emerald-500/20 text-emerald-300' :
                          inv.payment_mode === 'upi' ? 'bg-sky-500/20 text-sky-300' :
                          inv.payment_mode === 'khata' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-indigo-500/20 text-indigo-300'
                        }`}>
                          {inv.payment_mode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">{formatCurrency(inv.tax_amount)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                        {formatCurrency(inv.grand_total)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400">
                        {inv.created_at ? new Date(inv.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GST Summary Report Table */
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">
                HSN-wise GST Outward Tax Summary (Ready for GSTR-1 Reconciliation)
              </span>
              <span className="text-slate-400">CGST (50%) + SGST (50%)</span>
            </div>

            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-3 px-4">HSN Code</th>
                  <th className="py-3 px-4 text-center">GST Rate (%)</th>
                  <th className="py-3 px-4 text-center">Total Quantity</th>
                  <th className="py-3 px-4 text-right">Taxable Value</th>
                  <th className="py-3 px-4 text-right">CGST</th>
                  <th className="py-3 px-4 text-right">SGST</th>
                  <th className="py-3 px-4 text-right">Total Invoice Value</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/80">
                {gstData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">
                      No GST transaction records available.
                    </td>
                  </tr>
                ) : (
                  gstData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white">{row.hsn_code || 'General'}</td>
                      <td className="py-3 px-4 text-center font-mono">{row.gst_rate}%</td>
                      <td className="py-3 px-4 text-center font-mono">{row.total_quantity}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatCurrency(row.taxable_amount)}</td>
                      <td className="py-3 px-4 text-right font-mono text-sky-400">{formatCurrency(row.cgst)}</td>
                      <td className="py-3 px-4 text-right font-mono text-sky-400">{formatCurrency(row.sgst)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                        {formatCurrency(row.total_value)}
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
