import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { X, Check, Banknote, Share2 } from 'lucide-react';

export function PaymentInModal({ isOpen, customer, onClose, onSave }) {
  const [amount, setAmount] = useState(customer ? customer.current_balance : '');
  const [paymentMode, setPaymentMode] = useState('cash'); // cash, upi, bank
  const [notes, setNotes] = useState('');

  if (!isOpen || !customer) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(customer.id, {
      amount: Number(amount),
      payment_mode: paymentMode,
      notes
    });
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Receive Payment (Payment-In)</h3>
            <p className="text-xs text-slate-400">{customer.name} • {customer.phone || 'No phone'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Balance info */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Total Outstanding Udhar:</span>
            <span className="text-base font-black font-mono text-amber-400">
              {formatCurrency(customer.current_balance)}
            </span>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Amount Received (₹) *</label>
            <input
              type="number"
              step="1"
              required
              min="1"
              max={customer.current_balance > 0 ? customer.current_balance * 2 : 100000}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-lg font-bold font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Payment Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {['cash', 'upi', 'bank'].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMode(m)}
                  className={`py-2 rounded-xl font-bold uppercase text-xs border ${
                    paymentMode === m
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Notes / Reference</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Cleared Diwali ration balance, Google Pay #1029"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Confirm Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
