import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../utils/api';
import { formatCurrency, formatDate, getExpiryStatus } from '../../utils/formatters';
import { ProductModal } from './ProductModal';
import { BatchModal } from './BatchModal';
import {
  Search,
  Plus,
  Boxes,
  Layers,
  Filter,
  AlertTriangle,
  Pill,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  Sparkles
} from 'lucide-react';

export function InventoryScreen() {
  const { vertical, showToast } = useApp();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // all, low, out

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [batchModalProduct, setBatchModalProduct] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    loadProducts();
    loadSuppliers();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts();
      setProducts(data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const data = await api.getSuppliers();
      setSuppliers(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProduct = async (productData) => {
    try {
      await api.createProduct(productData);
      setIsAddModalOpen(false);
      loadProducts();
      showToast('Product added successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save product', 'error');
    }
  };

  const handleSaveBatch = async (productId, batchData) => {
    try {
      await api.addBatch(productId, batchData);
      setBatchModalProduct(null);
      loadProducts();
      showToast('New batch added successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to add batch', 'error');
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.salt_composition && p.salt_composition.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = !selectedCategory || p.category === selectedCategory;

    const matchesStock =
      stockFilter === 'all'
        ? true
        : stockFilter === 'low'
        ? p.total_stock <= p.min_stock_alert && p.total_stock > 0
        : stockFilter === 'out'
        ? p.total_stock <= 0
        : true;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden select-none">
      {/* Top Controls Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={
                vertical === 'pharma'
                  ? "Search by Medicine Name, Salt or Barcode..."
                  : "Search Products, Brands, Barcodes..."
              }
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={e => setStockFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Stock</option>
            <option value="low">Low Stock Alert</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/25 flex items-center justify-center space-x-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New {vertical === 'pharma' ? 'Medicine' : 'Product'}</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-3 px-4">Item Identity</th>
                {vertical === 'pharma' && <th className="py-3 px-4">Salt & Schedule</th>}
                <th className="py-3 px-4">Category / Brand</th>
                <th className="py-3 px-4">Packaging Unit</th>
                {vertical === 'pharma' && <th className="py-3 px-4">FEFO Next Expiry</th>}
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-center">Total Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    Loading inventory catalog...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const bestBatch = p.batches && p.batches[0];
                  const expiryInfo = bestBatch ? getExpiryStatus(bestBatch.expiry_date) : null;
                  const price = bestBatch ? bestBatch.selling_rate : p.min_selling_rate;
                  const isExpanded = expandedRow === p.id;
                  const isLow = p.total_stock <= p.min_stock_alert;

                  return (
                    <React.Fragment key={p.id}>
                      <tr className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white text-sm">{p.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {p.barcode ? `Barcode: ${p.barcode}` : 'No Barcode'}
                          </div>
                        </td>

                        {vertical === 'pharma' && (
                          <td className="py-3 px-4">
                            <div className="text-sky-300 font-medium line-clamp-1">
                              {p.salt_composition || '-'}
                            </div>
                            {p.schedule_type && p.schedule_type !== 'Regular' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 inline-block mt-0.5">
                                {p.schedule_type}
                              </span>
                            )}
                          </td>
                        )}

                        <td className="py-3 px-4">
                          <span className="text-slate-200">{p.category || '-'}</span>
                          {p.brand && <span className="text-slate-400 block text-[11px]">{p.brand}</span>}
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-slate-300 font-medium">
                            {p.pack_unit || p.unit_type || 'pcs'}
                          </span>
                          {p.allow_loose_sale === 1 && (
                            <span className="text-[10px] text-amber-400 block mt-0.5 font-medium">
                              Loose (1/{p.sub_units_per_pack})
                            </span>
                          )}
                          {p.is_loose_item === 1 && (
                            <span className="text-[10px] text-emerald-400 block mt-0.5 font-medium">
                              Loose Weighing (Kg)
                            </span>
                          )}
                        </td>

                        {vertical === 'pharma' && (
                          <td className="py-3 px-4">
                            {expiryInfo ? (
                              <span className={`px-2 py-0.5 rounded border inline-block text-[11px] font-medium ${expiryInfo.color}`}>
                                {expiryInfo.label}
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                        )}

                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                          {formatCurrency(price)}
                          {bestBatch && bestBatch.mrp > price && (
                            <div className="text-[10px] text-slate-500 line-through">
                              {formatCurrency(bestBatch.mrp)}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full font-bold font-mono text-xs ${
                            isLow
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-900 text-slate-200 border border-slate-800'
                          }`}>
                            {p.total_stock} {p.unit_type || 'pcs'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => setBatchModalProduct(p)}
                            className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold"
                            title="Add fresh batch"
                          >
                            + Batch
                          </button>
                          <button
                            onClick={() => setExpandedRow(isExpanded ? null : p.id)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                          >
                            Batches ({p.batches?.length || 0})
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Batches Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-950/90">
                          <td colSpan="8" className="p-4">
                            <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                              <h5 className="font-bold text-xs text-sky-400 mb-2 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5" />
                                All Batches for {p.name}
                              </h5>
                              {p.batches && p.batches.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                  {p.batches.map(b => (
                                    <div key={b.id} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1 text-[11px]">
                                      <div className="flex justify-between font-bold">
                                        <span className="font-mono text-white">{b.batch_number}</span>
                                        <span className={getExpiryStatus(b.expiry_date).color}>
                                          Exp: {formatDate(b.expiry_date)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-slate-400">
                                        <span>Stock: <strong className="text-white">{b.stock_units}</strong></span>
                                        <span className="font-mono text-emerald-400 font-bold">Rate: {formatCurrency(b.selling_rate)}</span>
                                      </div>
                                      <div className="flex justify-between text-slate-500 text-[10px]">
                                        <span>Cost: {formatCurrency(b.purchase_rate)}</span>
                                        <span>MRP: {formatCurrency(b.mrp)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400">No batches recorded.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveProduct}
        suppliers={suppliers}
      />

      <BatchModal
        isOpen={!!batchModalProduct}
        product={batchModalProduct}
        onClose={() => setBatchModalProduct(null)}
        onSave={handleSaveBatch}
      />
    </div>
  );
}
