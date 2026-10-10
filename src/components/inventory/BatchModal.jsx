import React, { useState } from 'react';
import { X, Check, Layers } from 'lucide-react';

export function BatchModal({ isOpen, onClose, product, onSave }) {
  const [formData, setFormData] = useState({
    batch_number: '',
    mfg_date: '',
    expiry_date: '',
    purchase_rate: '',
    mrp: '',
    selling_rate: '',
    stock_units: ''
  });

  if (!isOpen || !product) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(product.id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-sm">Add New Batch / Lot</h3>
            <p className="text-xs text-sky-400 font-medium">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Batch Number *</label>
            <input
              type="text"
              required
              value={formData.batch_number}
              onChange={e => setFormData({ ...formData, batch_number: e.target.value })}
              placeholder="e.g. DL25C10"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Expiry Date *</label>
              <input
                type="date"
                required
                value={formData.expiry_date}
                onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Stock Quantity</label>
              <input
                type="number"
                required
                value={formData.stock_units}
                onChange={e => setFormData({ ...formData, stock_units: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Purchase Rate (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.purchase_rate}
                onChange={e => setFormData({ ...formData, purchase_rate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Selling Rate (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.selling_rate}
                onChange={e => setFormData({ ...formData, selling_rate: e.target.value, mrp: formData.mrp || e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
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
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Add Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
