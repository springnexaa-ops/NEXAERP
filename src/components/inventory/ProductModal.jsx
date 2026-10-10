import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Check, Boxes, Pill, ShoppingBag } from 'lucide-react';

export function ProductModal({ isOpen, onClose, onSave, suppliers = [] }) {
  const { vertical } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: vertical === 'pharma' ? 'Medicines' : 'Groceries',
    brand: '',
    hsn_code: vertical === 'pharma' ? '3004' : '1001',
    gst_rate: 12,
    // Pharma
    salt_composition: '',
    schedule_type: 'Regular',
    pack_unit: 'Strip',
    sub_units_per_pack: 10,
    allow_loose_sale: true,
    // Kiryana
    unit_type: 'pcs',
    is_loose_item: false,
    is_quick_pick: false,
    min_stock_alert: 5,
    // Initial Batch
    batch_number: 'BATCH-01',
    mfg_date: '',
    expiry_date: '2028-12-31',
    purchase_rate: '',
    mrp: '',
    selling_rate: '',
    initial_stock: '',
    supplier_id: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {vertical === 'pharma' ? (
              <Pill className="w-5 h-5 text-rose-400" />
            ) : (
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
            )}
            <h3 className="font-bold text-white text-base">
              Add New {vertical === 'pharma' ? 'Medicine / Pharma Item' : 'Grocery / Kiryana Item'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Basic Details */}
          <div className="space-y-3">
            <h4 className="font-bold text-sky-400 uppercase tracking-wider text-[11px]">1. Product Identity</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Item Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder={vertical === 'pharma' ? "e.g. Dolo 650 Tablet" : "e.g. Aashirvaad Atta 10kg"}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Barcode / SKU</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Scan or enter barcode"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Brand / Manufacturer</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={e => setFormData({ ...formData, brand: e.target.value })}
                  placeholder={vertical === 'pharma' ? "e.g. Micro Labs, GSK, Cipla" : "e.g. ITC, Tata, Nestle"}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Analgesic, Edible Oil, Grains"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Pharma Specific Fields */}
          {vertical === 'pharma' && (
            <div className="p-3.5 bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-3">
              <h4 className="font-bold text-rose-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5" /> Pharma Drug Specifications
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-slate-300 block mb-1 font-semibold">
                    Salt / Active Molecule Composition (For Generic Substitutions)
                  </label>
                  <input
                    type="text"
                    value={formData.salt_composition}
                    onChange={e => setFormData({ ...formData, salt_composition: e.target.value })}
                    placeholder="e.g. Paracetamol 650mg, Amoxicillin 500mg"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Schedule Category</label>
                  <select
                    value={formData.schedule_type}
                    onChange={e => setFormData({ ...formData, schedule_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="Regular">Regular / OTC</option>
                    <option value="Schedule H">Schedule H (Prescription Required)</option>
                    <option value="Schedule H1">Schedule H1 (Critical Antibiotics)</option>
                    <option value="Narcotic">Narcotic / NDPS</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Pack Packaging Unit</label>
                  <select
                    value={formData.pack_unit}
                    onChange={e => setFormData({ ...formData, pack_unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="Strip">Strip</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Box">Box</option>
                    <option value="Tube">Tube</option>
                    <option value="Vial">Vial / Injection</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Tablets/Units per Pack</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.sub_units_per_pack}
                    onChange={e => setFormData({ ...formData, sub_units_per_pack: Number(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allow_loose_sale}
                      onChange={e => setFormData({ ...formData, allow_loose_sale: e.target.checked })}
                      className="rounded border-slate-700 text-rose-500 focus:ring-rose-500"
                    />
                    <span className="text-slate-200 font-semibold">Allow Selling Loose Tablets</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Kiryana Specific Fields */}
          {vertical === 'kiryana' && (
            <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-3">
              <h4 className="font-bold text-emerald-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" /> Kiryana Grocery Specifications
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Measurement Unit</label>
                  <select
                    value={formData.unit_type}
                    onChange={e => setFormData({ ...formData, unit_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="pcs">Pieces / Packet</option>
                    <option value="kg">Kilogram (Kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="liter">Liter (L)</option>
                    <option value="ml">Milliliter (ml)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5 space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_loose_item}
                      onChange={e => setFormData({ ...formData, is_loose_item: e.target.checked })}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-slate-200 font-semibold">Loose Weight Scale (Decimals)</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_quick_pick}
                      onChange={e => setFormData({ ...formData, is_quick_pick: e.target.checked })}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-slate-200 font-semibold">POS Quick-Pick Tile</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Initial Stock & Batch Details */}
          <div className="space-y-3">
            <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">2. Initial Batch & Pricing</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Batch No *</label>
                <input
                  type="text"
                  value={formData.batch_number}
                  onChange={e => setFormData({ ...formData, batch_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Expiry Date *</label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Purchase Cost (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.purchase_rate}
                  onChange={e => setFormData({ ...formData, purchase_rate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">MRP (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.mrp}
                  onChange={e => setFormData({ ...formData, mrp: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Initial Stock Qty</label>
                <input
                  type="number"
                  value={formData.initial_stock}
                  onChange={e => setFormData({ ...formData, initial_stock: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">GST Rate (%)</label>
                <select
                  value={formData.gst_rate}
                  onChange={e => setFormData({ ...formData, gst_rate: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                >
                  <option value={0}>0% (Exempt)</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Supplier / Vendor</label>
                <select
                  value={formData.supplier_id}
                  onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-600/30 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
