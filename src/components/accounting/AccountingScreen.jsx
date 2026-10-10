import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  Plus,
  Filter,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Building,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

export function AccountingScreen() {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState('pl'); // 'pl' | 'expenses'
  const [summary, setSummary] = useState(null);
  const [plData, setPlData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // New Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'Rent',
    amount: '',
    payment_mode: 'cash',
    reference_no: '',
    paid_to: '',
    notes: '',
    expense_date: new Date().toISOString().slice(0, 10)
  });

  const categories = [
    'Rent',
    'Salaries',
    'Electricity',
    'Packaging',
    'Transportation',
    'Maintenance',
    'Marketing',
    'Tax & Legal',
    'Miscellaneous'
  ];

  useEffect(() => {
    loadData();
  }, [categoryFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, plRes, expRes] = await Promise.all([
        api.getFinancialSummary(),
        api.getPLStatement(),
        api.getExpenses(categoryFilter)
      ]);
      setSummary(sumRes);
      setPlData(plRes);
      setExpenses(expRes || []);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to load accounting data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
      showToast('Enter a valid expense amount', 'error');
      return;
    }

    try {
      await api.createExpense(expenseForm);
      showToast('Expense recorded successfully', 'success');
      setIsExpenseModalOpen(false);
      setExpenseForm({
        category: 'Rent',
        amount: '',
        payment_mode: 'cash',
        reference_no: '',
        paid_to: '',
        notes: '',
        expense_date: new Date().toISOString().slice(0, 10)
      });
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to record expense', 'error');
    }
  };

  const revenue = Number(summary?.revenue || 0);
  const cogs = Number(summary?.cogs || 0);
  const grossProfit = Number(summary?.grossProfit || 0);
  const operatingExpenses = Number(summary?.operatingExpenses || 0);
  const netProfit = Number(summary?.netProfit || 0);
  const grossMargin = revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : '0.0';
  const netMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : '0.0';

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Financial Accounting & P&L Statement
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Double Entry
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Live Cash Flow, Operating Expenses, COGS and Net Profit Margins
            </p>
          </div>
        </div>

        {/* View Switcher & Action */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('pl')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'pl'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              P&L Statement
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'expenses'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Expense Ledger
            </button>
          </div>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>

          <button
            onClick={loadData}
            title="Refresh Ledger"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-lg font-bold text-white mt-1">
            {formatCurrency(revenue)}
          </div>
          <div className="text-[10px] text-sky-400 font-mono mt-0.5">Total Sales Billed</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>COGS (Cost)</span>
            <ArrowDownRight className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-slate-200 mt-1">
            {formatCurrency(cogs)}
          </div>
          <div className="text-[10px] text-amber-400 font-mono mt-0.5">Inventory Acquisition</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Gross Profit</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 mt-1">
            {formatCurrency(grossProfit)}
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">{grossMargin}% Margin</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Operating Expenses</span>
            <Receipt className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-lg font-bold text-rose-400 mt-1">
            {formatCurrency(operatingExpenses)}
          </div>
          <div className="text-[10px] text-rose-400 font-mono mt-0.5">Rent, Salaries, Power</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Net Bottom Line</span>
            {netProfit >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className={`text-lg font-bold mt-1 ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(netProfit)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{netMargin}% Net Margin</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Udhar Receivables</span>
            <Wallet className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-lg font-bold text-indigo-300 mt-1">
            {formatCurrency(summary?.receivables || 0)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Payables: {formatCurrency(summary?.payables || 0)}</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {activeTab === 'pl' ? (
          /* P&L Statement Detailed View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left 2 Cols: Statement Table */}
            <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden p-5 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Profit & Loss Statement (Income & Expense)
                  </h3>
                  <p className="text-xs text-slate-400">Audited Accrual Summary for Current Financial Cycle</p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Print P&L</span>
                </button>
              </div>

              {/* Revenue Section */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span>1. Trading Income / Revenue</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-300 py-1 border-b border-slate-900">
                    <span className="pl-3">Gross Sales Turnover</span>
                    <span className="font-mono">{formatCurrency(plData?.revenue?.total_sales || 0)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 py-1 border-b border-slate-900">
                    <span className="pl-3">Less: Discounts & Concessions</span>
                    <span className="font-mono text-rose-400">- {formatCurrency(plData?.revenue?.total_discounts || 0)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 py-1 border-b border-slate-900">
                    <span className="pl-3">GST / Tax Liability Collected</span>
                    <span className="font-mono text-sky-400">{formatCurrency(plData?.revenue?.total_tax || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-white bg-slate-900/60 p-2 rounded-lg">
                    <span>Net Operating Revenue</span>
                    <span className="font-mono text-emerald-400">{formatCurrency(revenue)}</span>
                  </div>
                </div>
              </div>

              {/* COGS Section */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span>2. Cost of Sales (COGS)</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-300 py-1 border-b border-slate-900">
                    <span className="pl-3">Direct Stock Purchase Consumption</span>
                    <span className="font-mono">{formatCurrency(cogs)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-white bg-slate-900/60 p-2 rounded-lg">
                    <span>Gross Trading Profit (Revenue - COGS)</span>
                    <span className="font-mono text-emerald-400">{formatCurrency(grossProfit)} ({grossMargin}%)</span>
                  </div>
                </div>
              </div>

              {/* Operating Expenses Section */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span>3. Operating Overhead Expenses</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  {plData?.expenseCategories && plData.expenseCategories.length > 0 ? (
                    plData.expenseCategories.map((cat, i) => (
                      <div key={i} className="flex justify-between text-slate-300 py-1 border-b border-slate-900">
                        <span className="pl-3">{cat.category}</span>
                        <span className="font-mono text-rose-300">{formatCurrency(cat.total)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 py-2 pl-3 italic">No expenses recorded yet.</div>
                  )}
                  <div className="flex justify-between font-bold text-white bg-slate-900/60 p-2 rounded-lg">
                    <span>Total Operating Overheads</span>
                    <span className="font-mono text-rose-400">{formatCurrency(operatingExpenses)}</span>
                  </div>
                </div>
              </div>

              {/* Net Profit Summary */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-950 border border-emerald-500/30 flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Net Profit Before Taxes & Retained Earnings
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Gross Profit ₹{grossProfit.toLocaleString('en-IN')} - OpEx ₹{operatingExpenses.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className={`text-2xl font-black font-mono ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(netProfit)}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Expense Category Distribution */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Expense Breakdown</h3>
                <p className="text-xs text-slate-400 mb-4">Allocation by category</p>

                <div className="space-y-3">
                  {plData?.expenseCategories && plData.expenseCategories.length > 0 ? (
                    plData.expenseCategories.map((c, i) => {
                      const pct = operatingExpenses > 0 ? ((c.total / operatingExpenses) * 100).toFixed(1) : 0;
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-300 font-medium">{c.category}</span>
                            <span className="text-slate-400 font-mono">
                              {formatCurrency(c.total)} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-500">
                      No expense data logged yet
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
                <button
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-600/20"
                >
                  + Record Office / Store Expense
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Expense Ledger Table View */
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
            {/* Table Filter Controls */}
            <div className="p-3 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-300">Category Filter:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-slate-400">
                Total Expenses: <span className="font-bold text-white">{expenses.length}</span> entries
              </div>
            </div>

            {/* Expenses Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-semibold">
                    <th className="p-3">Ref #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Paid To / Vendor</th>
                    <th className="p-3">Payment Mode</th>
                    <th className="p-3">Notes</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {expenses.length > 0 ? (
                    expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 font-mono text-sky-400 font-semibold">{exp.reference_no}</td>
                        <td className="p-3 text-slate-300">{formatDate(exp.expense_date)}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {exp.category}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-white">{exp.paid_to || '-'}</td>
                        <td className="p-3 uppercase font-mono text-[11px] text-slate-400">
                          {exp.payment_mode}
                        </td>
                        <td className="p-3 text-slate-400 max-w-xs truncate">{exp.notes || '-'}</td>
                        <td className="p-3 text-right font-mono font-bold text-rose-400">
                          {formatCurrency(exp.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-10 text-slate-500">
                        No expense records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Record Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                Record Store Expense
              </h2>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Expense Category *</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 5000"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Payment Mode</label>
                  <select
                    value={expenseForm.payment_mode}
                    onChange={(e) => setExpenseForm({ ...expenseForm, payment_mode: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI / Online</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Expense Date</label>
                  <input
                    type="date"
                    value={expenseForm.expense_date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Paid To / Recipient</label>
                <input
                  type="text"
                  placeholder="e.g. Landlord, State Electricity Board, Staff"
                  value={expenseForm.paid_to}
                  onChange={(e) => setExpenseForm({ ...expenseForm, paid_to: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Notes / Description</label>
                <textarea
                  rows="2"
                  placeholder="Invoice or receipt details..."
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-lg shadow-emerald-600/30"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
