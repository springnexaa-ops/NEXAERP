import React, { useState } from 'react';
import { formatCurrency, getExpiryStatus } from '../../utils/formatters';
import { X, Check, AlertCircle, Sparkles, Layers } from 'lucide-react';

export function BatchSelectorModal({ product, onClose, onConfirm }) {
  const [selectedBatch, setSelectedBatch] = useState(
    product.batches && product.batches.length > 0
      ? product.batches.find(b => b.stock_units > 0) || product.batches[0]
      : null
  );
  const [quantity, setQuantity] = useState(1);
  const [isLoose, setIsLoose] = useState(false);

  if (!product) return null;

  const handleConfirm = () => {
    if (!selectedBatch) return;
    onConfirm(product, selectedBatch, Number(quantity), isLoose);
  };

  const subUnits = product.sub_units_per_pack || 1;
  const canSellLoose = product.allow_loose_sale && subUnits > 1;

  const unitRate = isLoose && selectedBatch
    ? (selectedBatch.selling_rate / subUnits).toFixed(2)
    : (selectedBatch ? selectedBatch.selling_rate : 0);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-white text-base leading-tight">{product.name}</h3>
              {product.schedule_type && product.schedule_type !== 'Regular' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                  {product.schedule_type}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {product.salt_composition || product.category || 'Select Batch & Packaging'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Batch Selection Table */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              Available Batches (FEFO Sorted - First Expiry First Out)
            </label>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {product.batches && product.batches.length > 0 ? (
                product.batches.map((batch, index) => {
                  const expiryInfo = getExpiryStatus(batch.expiry_date);
                  const isSelected = selectedBatch?.id === batch.id;
                  const isFEFO = index === 0;

                  return (
                    <div
                      key={batch.id}
                      onClick={() => setSelectedBatch(batch)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-sky-950/60 border-sky-500 ring-1 ring-sky-500/50 shadow-md'
                          : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/70'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-sky-400 bg-sky-500 text-white' : 'border-slate-500'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-white text-xs">{batch.batch_number}</span>
                            {isFEFO && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" /> FEFO
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Stock: <strong className="text-slate-200">{batch.stock_units}</strong> {product.pack_unit || 'units'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-[11px] px-2 py-0.5 rounded border inline-block ${expiryInfo.color}`}>
                          {expiryInfo.label}
                        </span>
                        <div className="text-xs font-mono font-bold text-emerald-400 mt-1">
                          {formatCurrency(batch.selling_rate)}
                          <span className="text-[10px] text-slate-400 line-through ml-1.5">
                            {formatCurrency(batch.mrp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 bg-slate-800/40 rounded-xl text-center text-xs text-slate-400">
                  No batch found for this item. Default pricing will apply.
                </div>
              )}
            </div>
          </div>

          {/* Unit Conversion: Full Pack vs Loose Tablets (Pharma) */}
          {canSellLoose && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white block">Loose Tablet / Unit Sale</span>
                <span className="text-[11px] text-slate-400">
                  1 {product.pack_unit} = {subUnits} tablets (@ {formatCurrency(unitRate)} each)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsLoose(false)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                    !isLoose
                      ? 'bg-sky-600 text-white border-sky-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Full {product.pack_unit}
                </button>
                <button
                  type="button"
                  onClick={() => setIsLoose(true)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                    isLoose
                      ? 'bg-amber-600 text-white border-amber-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Loose Tablets
                </button>
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center justify-between pt-2">
            <label className="text-xs font-semibold text-slate-300">
              Quantity {isLoose ? `(Tablets)` : `(${product.pack_unit || 'Pcs'})`}:
            </label>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center justify-center font-bold"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                step={product.is_loose_item ? "0.05" : "1"}
                value={quantity}
                onChange={e => setQuantity(Math.max(0.01, parseFloat(e.target.value) || 1))}
                className="w-20 bg-slate-950 border border-slate-700 rounded-lg py-1.5 text-center text-sm font-bold font-mono text-white focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center justify-center font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs">
            <span className="text-slate-400">Total: </span>
            <strong className="text-emerald-400 text-sm font-mono">
              {formatCurrency(unitRate * quantity)}
            </strong>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-600/30 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Add to Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
