import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, Unlock, KeyRound, LogOut, AlertCircle } from 'lucide-react';

export function TerminalLockModal({ isOpen, onUnlock, onLogout }) {
  const { user, verifyPin } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
      setError(null);
    }
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const handleSubmit = async (pinToSubmit = pin) => {
    if (pinToSubmit.length < 4) {
      setError('Please enter complete 4-digit PIN');
      return;
    }
    setLoading(true);
    try {
      await verifyPin(pinToSubmit);
      setPin('');
      setError(null);
      onUnlock();
    } catch (err) {
      setError(err.message || 'Incorrect PIN');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center space-y-4">
        {/* Lock Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center shadow-lg">
          <Lock className="w-7 h-7" />
        </div>

        <div>
          <h3 className="font-extrabold text-white text-base">Terminal Locked</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cashier Shift: <strong className="text-slate-200">{user?.name || 'Staff'}</strong>
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block font-mono">
            Enter 4-Digit Shift PIN (Default: 1234 or 1111)
          </span>
        </div>

        {/* PIN Dots Display */}
        <div className="flex justify-center space-x-3 py-2">
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border transition-all ${
                pin.length > idx
                  ? 'bg-sky-400 border-sky-400 scale-110 shadow-md shadow-sky-400/50'
                  : 'bg-slate-900 border-slate-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center justify-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Number Pad Grid */}
        <div className="grid grid-cols-3 gap-2 pt-1 max-w-[240px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(String(num))}
              className="h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-mono font-bold text-lg active:scale-95 transition-all"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-2xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 text-rose-400 font-bold text-xs active:scale-95 transition-all"
          >
            CLR
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-mono font-bold text-lg active:scale-95 transition-all"
          >
            0
          </button>
          <button
            type="button"
            disabled={pin.length < 4 || loading}
            onClick={() => handleSubmit()}
            className="h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 text-white font-bold text-xs active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center"
          >
            <Unlock className="w-4 h-4" />
          </button>
        </div>

        <div className="pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onLogout}
            className="text-xs text-slate-400 hover:text-rose-400 flex items-center justify-center gap-1.5 mx-auto transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch Cashier / Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
