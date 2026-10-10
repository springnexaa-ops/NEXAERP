import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { PaymentInModal } from './PaymentInModal';
import {
  BookOpen,
  UserPlus,
  Search,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Smartphone,
  CheckCircle,
  FileText,
  X
} from 'lucide-react';

export function KhataScreen() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals state
  const [paymentModalCustomer, setPaymentModalCustomer] = useState(null);
  const [ledgerCustomer, setLedgerCustomer] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    address: '',
    credit_limit: 5000,
    initial_balance: 0
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.getCustomers();
      setCustomers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLedger = async (customer) => {
    setLedgerCustomer(customer);
    try {
      const res = await api.getCustomerLedger(customer.id);
      setLedgerEntries(res.ledger || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePayment = async (customerId, payload) => {
    try {
      await api.recordCustomerPayment(customerId, payload);
      setPaymentModalCustomer(null);
      loadCustomers();
      if (ledgerCustomer && ledgerCustomer.id === customerId) {
        handleOpenLedger(ledgerCustomer);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      await api.createCustomer(newCustomerForm);
      setIsAddCustomerOpen(false);
      setNewCustomerForm({ name: '', phone: '', address: '', credit_limit: 5000, initial_balance: 0 });
      loadCustomers();
    } catch (err) {
      alert(err.message);
    }
  };

  const sendWhatsAppReminder = (customer) => {
    if (!customer.phone) return;
    const phone = customer.phone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const text = `Namaste ${customer.name} ji, your pending balance at our store is ₹${customer.current_balance}. Kindly settle the bill when convenient. Thank you!`;
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const totalUdhar = customers.reduce((sum, c) => sum + (c.current_balance || 0), 0);
  const debtorCount = customers.filter(c => c.current_balance > 0).length;

  const filteredCustomers = customers.filter(c =>
    (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden select-none">
      {/* KPI Cards Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Total Outstanding Udhar</span>
              <span className="text-xl font-black font-mono text-amber-400 mt-1 block">
                {formatCurrency(totalUdhar)}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Active Debtors</span>
              <span className="text-xl font-black font-mono text-white mt-1 block">
                {debtorCount} <span className="text-xs font-normal text-slate-400">/ {customers.length} total</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Credit Reliability</span>
              <span className="text-xl font-black font-mono text-emerald-400 mt-1 block">
                {customers.length > 0 ? Math.round(((customers.length - debtorCount) / customers.length) * 100) : 100}% Clear
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Search & Add Customer Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search customer by name or phone..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/25 flex items-center justify-center space-x-1.5 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Customer</span>
          </button>
        </div>
      </div>

      {/* Customer Accounts Table */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Contact & Address</th>
                <th className="py-3 px-4 text-right">Credit Limit</th>
                <th className="py-3 px-4 text-right">Outstanding Udhar</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80">
              {filteredCustomers.map(c => {
                const hasDebt = c.current_balance > 0;
                return (
                  <tr key={c.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">{c.name}</div>
                      <div className="text-[11px] text-slate-500">ID #{c.id}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-200">{c.phone || '-'}</div>
                      <div className="text-slate-400 text-[11px] truncate max-w-xs">{c.address || '-'}</div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {formatCurrency(c.credit_limit)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className={`text-sm font-black font-mono ${
                        hasDebt ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {formatCurrency(c.current_balance)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      {hasDebt && (
                        <button
                          onClick={() => setPaymentModalCustomer(c)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all"
                        >
                          Receive Payment
                        </button>
                      )}

                      {hasDebt && c.phone && (
                        <button
                          onClick={() => sendWhatsAppReminder(c)}
                          className="p-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-500/20"
                          title="Send WhatsApp Reminder"
                        >
                          <Smartphone className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenLedger(c)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                      >
                        Ledger
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Ledger Drawer / Modal */}
      {ledgerCustomer && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-end z-50">
          <div className="bg-slate-950 border-l border-slate-800 w-full max-w-lg h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">{ledgerCustomer.name}</h3>
                <p className="text-xs text-slate-400">
                  Phone: {ledgerCustomer.phone} • Current Udhar: <strong className="text-amber-400 font-mono">{formatCurrency(ledgerCustomer.current_balance)}</strong>
                </p>
              </div>
              <button
                onClick={() => setLedgerCustomer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-5 overflow-y-auto space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Statement of Account</h4>
              {ledgerEntries.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">No transaction records yet.</div>
              ) : (
                ledgerEntries.map(entry => {
                  const isDebit = entry.transaction_type === 'DEBIT';
                  return (
                    <div
                      key={entry.id}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isDebit ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {isDebit ? 'BOUGHT ON CREDIT' : 'PAYMENT RECEIVED'}
                          </span>
                          <span className="font-mono text-xs text-slate-300">{entry.reference_id}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{entry.notes || '-'}</p>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {formatDateTime(entry.created_at)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className={`font-mono text-sm font-bold ${
                          isDebit ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {isDebit ? `+${formatCurrency(entry.amount)}` : `-${formatCurrency(entry.amount)}`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center">
              <span className="text-xs text-slate-400">Total Outstanding Balance:</span>
              <span className="text-base font-black font-mono text-amber-400">
                {formatCurrency(ledgerCustomer.current_balance)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Add Customer Account</h3>
              <button onClick={() => setIsAddCustomerOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={newCustomerForm.name}
                  onChange={e => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Mobile Number</label>
                <input
                  type="tel"
                  value={newCustomerForm.phone}
                  onChange={e => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Address / House No.</label>
                <input
                  type="text"
                  value={newCustomerForm.address}
                  onChange={e => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                  placeholder="Apartment, Street address"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={newCustomerForm.credit_limit}
                    onChange={e => setNewCustomerForm({ ...newCustomerForm, credit_limit: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Opening Udhar (₹)</label>
                  <input
                    type="number"
                    value={newCustomerForm.initial_balance}
                    onChange={e => setNewCustomerForm({ ...newCustomerForm, initial_balance: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-md shadow-sky-600/30"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment-In Modal */}
      <PaymentInModal
        isOpen={!!paymentModalCustomer}
        customer={paymentModalCustomer}
        onClose={() => setPaymentModalCustomer(null)}
        onSave={handleSavePayment}
      />
    </div>
  );
}
