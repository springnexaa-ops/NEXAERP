import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { Zap, Plus } from 'lucide-react';

export function QuickPicksGrid({ quickPickProducts, onSelectProduct }) {
  const { vertical } = useApp();

  if (!quickPickProducts || quickPickProducts.length === 0) return null;

  return (
    <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-800 shadow-md">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-400">
          <Zap className="w-3.5 h-3.5" />
          <span>FAST QUICK-PICKS {vertical === 'kiryana' ? '(DAILY STAPLES)' : '(TOP MOVING)'}</span>
        </div>
        <span className="text-[11px] text-slate-400">Click tile to add</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {quickPickProducts.map(product => {
          const rate = product.min_selling_rate || (product.batches && product.batches[0] ? product.batches[0].selling_rate : 0);
          const stock = product.total_stock;
          const isOutOfStock = stock <= 0;

          return (
            <button
              key={product.id}
              disabled={isOutOfStock}
              onClick={() => onSelectProduct(product)}
              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all duration-150 relative group ${
                isOutOfStock
                  ? 'bg-slate-950/40 border-slate-800/60 opacity-50 cursor-not-allowed'
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 hover:border-sky-500/60 hover:shadow-lg hover:shadow-sky-500/10 cursor-pointer active:scale-98'
              }`}
            >
              <div>
                <span className="font-semibold text-xs text-white line-clamp-1 block group-hover:text-sky-300">
                  {product.name}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {product.brand || product.category || (product.is_loose_item ? 'Loose/Kg' : 'Unit')}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-slate-700/60 pt-1.5">
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {formatCurrency(rate)}
                </span>
                <span className={`text-[10px] px-1 rounded font-medium ${
                  stock < 5 ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400'
                }`}>
                  {stock} {product.unit_type || 'pcs'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
