import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';
import {
  Banknote,
  QrCode,
  BookOpen,
  CreditCard,
  X,
  Check,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export function PaymentModal({ grandTotal, customer, onComplete, onClose, isProcessing }) {
  const { settings } = useApp();
  const [mode, setMode] = useState('cash'); // 'cash' | 'upi' | 'khata' | 'card' | 'split'
  const [tenderedCash, setTenderedCash] = useState(grandTotal);
  const [cashSplit, setCashSplit] = useState(Math.floor(grandTotal / 2));
  const [upiSplit, setUpiSplit] = useState(grandTotal - Math.floor(grandTotal / 2));

  // Cash change calculation
  const changeDue = Math.max(0, tenderedCash - grandTotal);

  // Khata validation
  const currentUdhar = customer ? customer.current_balance : 0;
  const creditLimit = customer ? customer.credit_limit : 5000;
  const newUdharTotal = currentUdhar + grandTotal;
  const isCreditExceeded = customer && newUdharTotal > creditLimit;

  // Dynamic UPI URL for QR code
  const upiId = settings.upi_id || 'omnistore@upi';
  const upiPayString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(settings.store_name)}&am=${grandTotal}&cu=INR&tn=Invoice`;
  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiPayString)}`;

  const handleSubmit = () => {
    let payload = {
      payment_mode: mode,
      cash_paid: 0,
      upi_paid: 0,
      khata_amount: 0
    };

    if (mode === 'cash') {
      payload.cash_paid = grandTotal;
    } else if (mode === 'upi') {
      payload.upi_paid = grandTotal;
    } else if (mode === 'card') {
      payload.cash_paid = grandTotal; // recorded as digital card
    } else if (mode === 'khata') {
      payload.khata_amount = grandTotal;
    } else if (mode === 'split') {
      payload.cash_paid = Number(cashSplit) || 0;
      payload.upi_paid = Number(upiSplit) || 0;
    }

    onComplete(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Select Payment Mode</h3>
            <p className="text-xs text-slate-400">Total Payable Amount</p>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-emerald-400 font-mono">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-4 p-3 bg-slate-950/60 border-b border-slate-800 gap-1.5">
          <button
            onClick={() => setMode('cash')}
            className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
              mode === 'cash'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>Cash</span>
          </button>

          <button
            onClick={() => setMode('upi')}
            className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
              mode === 'upi'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>UPI QR</span>
          </button>

          <button
            onClick={() => setMode('khata')}
            className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
              mode === 'khata'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Udhar / Khata</span>
          </button>

          <button
            onClick={() => setMode('split')}
            className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
              mode === 'split'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Split Pay</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {mode === 'cash' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Cash Tendered by Customer
                </label>
                <input
                  type="number"
                  value={tenderedCash}
                  onChange={e => setTenderedCash(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xl font-bold font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-2">
                {[grandTotal, 100, 200, 500, 1000, 2000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTenderedCash(val)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-semibold text-slate-200 border border-slate-700"
                  >
                    ₹{val}
                  </button>
                ))}
              </div>

              {/* Return Change Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">Change Return to Customer:</span>
                <span className={`text-lg font-black font-mono ${changeDue > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {formatCurrency(changeDue)}
                </span>
              </div>
            </div>
          )}

          {mode === 'upi' && (
            <div className="text-center space-y-3">
              <div className="inline-block p-3 bg-white rounded-2xl shadow-lg shadow-sky-500/10">
                <img
                  src={upiQrUrl}
                  alt="UPI QR Code"
                  className="w-36 h-36 mx-auto rounded-lg"
                />
              </div>
              <div>
                <p className="font-bold text-sm text-white">Scan to Pay via Any UPI App</p>
                <p className="text-xs text-slate-400">GPay • PhonePe • Paytm • BHIM</p>
                <p className="text-xs font-mono text-sky-400 mt-1">UPI ID: {upiId}</p>
                <p className="text-xs font-bold text-emerald-400 mt-0.5">Amount: {formatCurrency(grandTotal)}</p>
              </div>
            </div>
          )}

          {mode === 'khata' && (
            <div className="space-y-4">
              {!customer ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center text-xs text-amber-300">
                  <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                  Please select an existing customer on the POS screen first to add this bill to their Khata / Udhar book.
                </div>
              ) : (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Customer:</span>
                    <span className="font-bold text-white">{customer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-mono text-slate-300">{customer.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Outstanding Udhar:</span>
                    <span className="font-bold text-amber-400 font-mono">{formatCurrency(currentUdhar)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Credit Limit:</span>
                    <span className="font-mono text-slate-300">{formatCurrency(creditLimit)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between font-bold">
                    <span className="text-slate-300">New Outstanding Balance:</span>
                    <span className={`font-mono ${isCreditExceeded ? 'text-rose-400' : 'text-amber-400'}`}>
                      {formatCurrency(newUdharTotal)}
                    </span>
                  </div>

                  {isCreditExceeded && (
                    <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-[11px] text-rose-300 flex items-center gap-1.5 mt-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                      Warning: Customer is exceeding their ₹{creditLimit} credit limit.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {mode === 'split' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Cash Portion (₹)
                </label>
                <input
                  type="number"
                  value={cashSplit}
                  onChange={e => {
                    const val = Number(e.target.value) || 0;
                    setCashSplit(val);
                    setUpiSplit(grandTotal - val);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  UPI / Digital Portion (₹)
                </label>
                <input
                  type="number"
                  value={upiSplit}
                  onChange={e => {
                    const val = Number(e.target.value) || 0;
                    setUpiSplit(val);
                    setCashSplit(grandTotal - val);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between">
                <span className="text-slate-400">Total Check:</span>
                <span className="font-bold font-mono text-emerald-400">
                  {formatCurrency((Number(cashSplit) || 0) + (Number(upiSplit) || 0))} / {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={isProcessing || (mode === 'khata' && !customer)}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-600/30 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{isProcessing ? 'Processing Bill...' : 'Complete & Print Bill'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
