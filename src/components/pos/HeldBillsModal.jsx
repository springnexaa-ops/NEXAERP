import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { X, Play, Trash2, Clock, ShoppingCart } from 'lucide-react';

export function HeldBillsModal({ isOpen, onClose, onRecallBill }) {
  const [heldBills, setHeldBills] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHeldBills();
    }
  }, [isOpen]);

  const loadHeldBills = async () => {
    setLoading(true);
    try {
      const data = await api.getHeldBills();
      setHeldBills(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteHeldBill(id);
      setHeldBills(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Held / Suspended Bills</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">Loading held bills...</div>
          ) : heldBills.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-500" />
              No active held bills. Press [F8] on POS to hold any pending customer cart.
            </div>
          ) : (
            heldBills.map(bill => {
              const items = bill.cart_data || [];
              const totalAmount = items.reduce((s, i) => s + (Number(i.quantity) * Number(i.unit_price) - (Number(i.discount) || 0)), 0);

              return (
                <div
                  key={bill.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all"
                >
                  <div>
                    <span className="font-bold text-sm text-white block">
                      {bill.reference_name}
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      {items.length} items • Total: <strong className="text-emerald-400 font-mono">{formatCurrency(totalAmount)}</strong>
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Held at: {formatDateTime(bill.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDelete(bill.id)}
                      className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-all"
                      title="Discard Bill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        onRecallBill(bill);
                        handleDelete(bill.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center space-x-1 shadow-md shadow-sky-600/20"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Resume</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
