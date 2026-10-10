import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';
import {
  ClipboardCheck,
  Barcode,
  Plus,
  RefreshCw,
  Printer,
  AlertTriangle,
  Package,
  Layers,
  CheckCircle2,
  Trash2,
  Sliders
} from 'lucide-react';

export function StockAuditScreen() {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'barcodes'
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [barcodeItems, setBarcodeItems] = useState([]);
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState('');
  const [labelCopies, setLabelCopies] = useState(6);
  const [loading, setLoading] = useState(false);

  // New Adjustment Modal
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [adjForm, setAdjForm] = useState({
    product_id: '',
    batch_id: '',
    adjustment_type: 'PHYSICAL_AUDIT_DEFICIT', // 'PHYSICAL_AUDIT_DEFICIT', 'PHYSICAL_AUDIT_SURPLUS', 'DAMAGE_WRITEOFF', 'EXPIRED_QUARANTINE'
    system_stock: 0,
    physical_stock: 0,
    quantity: 1,
    reason: 'Count discrepancy during weekly physical cycle count',
    audited_by: 'Inventory Auditor'
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'audit') {
        const [adjData, prodData] = await Promise.all([
          api.getStockAdjustments(),
          api.getProducts()
        ]);
        setAdjustments(adjData || []);
        setProducts(prodData || []);
      } else {
        const data = await api.getBarcodeSheet(selectedProductForBarcode);
        setBarcodeItems(data || []);
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to load stock data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (prodId) => {
    const prod = products.find((p) => p.id === Number(prodId));
    setSelectedProduct(prod || null);
    if (prod && prod.batches && prod.batches.length > 0) {
      const b = prod.batches[0];
      setSelectedBatch(b);
      setAdjForm({
        ...adjForm,
        product_id: prod.id,
        batch_id: b.id,
        system_stock: b.stock_units,
        physical_stock: b.stock_units,
        quantity: 0
      });
    } else {
      setSelectedBatch(null);
      setAdjForm({
        ...adjForm,
        product_id: prod ? prod.id : '',
        batch_id: '',
        system_stock: 0,
        physical_stock: 0,
        quantity: 0
      });
    }
  };

  const handleBatchChange = (batchId) => {
    if (!selectedProduct) return;
    const b = selectedProduct.batches?.find((batch) => batch.id === Number(batchId));
    setSelectedBatch(b || null);
    if (b) {
      setAdjForm({
        ...adjForm,
        batch_id: b.id,
        system_stock: b.stock_units,
        physical_stock: b.stock_units,
        quantity: 0
      });
    }
  };

  const handlePhysicalStockInput = (val) => {
    const phys = Number(val) || 0;
    const sys = Number(adjForm.system_stock) || 0;
    const diff = phys - sys;

    let adjType = 'PHYSICAL_AUDIT_DEFICIT';
    let qty = Math.abs(diff);

    if (diff > 0) {
      adjType = 'PHYSICAL_AUDIT_SURPLUS';
    } else if (diff < 0) {
      adjType = 'PHYSICAL_AUDIT_DEFICIT';
    }

    setAdjForm({
      ...adjForm,
      physical_stock: phys,
      quantity: qty,
      adjustment_type: adjType
    });
  };

  const handleCreateAdjustment = async (e) => {
    e.preventDefault();
    if (!adjForm.product_id || !adjForm.batch_id || adjForm.quantity <= 0) {
      showToast('Specify a valid product, batch and adjustment quantity', 'error');
      return;
    }

    try {
      await api.createStockAdjustment({
        product_id: adjForm.product_id,
        batch_id: adjForm.batch_id,
        adjustment_type: adjForm.adjustment_type,
        quantity: adjForm.quantity,
        reason: adjForm.reason,
        audited_by: adjForm.audited_by
      });

      showToast('Inventory reconciled and stock adjusted', 'success');
      setIsAdjModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to record adjustment', 'error');
    }
  };

  const loadBarcodeSheet = async (prodId) => {
    setSelectedProductForBarcode(prodId);
    try {
      const data = await api.getBarcodeSheet(prodId);
      setBarcodeItems(data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load barcode sheet', 'error');
    }
  };

  const totalLossValue = adjustments.reduce((s, a) => s + (a.loss_value || 0), 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Physical Stock Audit & Barcode Label Studio
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Cycle Count & Print
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Reconcile physical floor counts, record damage write-offs, and print shelf barcode stickers
            </p>
          </div>
        </div>

        {/* View Switchers */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'audit'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Stock Audit Log
            </button>
            <button
              onClick={() => {
                setActiveTab('barcodes');
                loadBarcodeSheet(selectedProductForBarcode);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'barcodes'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Barcode Label Sheet
            </button>
          </div>

          {activeTab === 'audit' ? (
            <button
              onClick={() => setIsAdjModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-amber-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Record Stock Audit</span>
            </button>
          ) : (
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-sky-600/20"
            >
              <Printer className="w-4 h-4" />
              <span>Print Sticker Sheet</span>
            </button>
          )}

          <button
            onClick={loadData}
            title="Refresh"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Audit Variances Logged</span>
            <ClipboardCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {adjustments.length}
          </div>
          <div className="text-[10px] text-amber-400 font-mono mt-0.5">Physical cycle checks</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Inventory Loss / Write-Off</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400 mt-1">
            {formatCurrency(totalLossValue)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Scrap, expired & deficits</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Barcode Ready SKUs</span>
            <Barcode className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-sky-400 mt-1">
            {products.length}
          </div>
          <div className="text-[10px] text-sky-400 font-mono mt-0.5">EAN / UPC / Custom Tags</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Label Compatibility</span>
            <Printer className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            24-up / Roll
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Thermal & Laser Ready</div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {activeTab === 'audit' ? (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-3 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Physical Stock Audit & Variance Journal</span>
              <span className="text-xs text-slate-400">{adjustments.length} adjustment records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-semibold">
                    <th className="p-3">Audit #</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Batch #</th>
                    <th className="p-3">Adjustment Type</th>
                    <th className="p-3 text-right">Units</th>
                    <th className="p-3 text-right">Loss / Cost Value</th>
                    <th className="p-3">Auditor & Reason</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {adjustments.length > 0 ? (
                    adjustments.map((adj) => (
                      <tr key={adj.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 font-mono font-bold text-amber-400">{adj.adjustment_number}</td>
                        <td className="p-3 font-semibold text-white">{adj.product_name}</td>
                        <td className="p-3 font-mono text-slate-300">{adj.batch_number}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              adj.adjustment_type === 'PHYSICAL_AUDIT_SURPLUS'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            }`}
                          >
                            {adj.adjustment_type}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-white">
                          {adj.adjustment_type === 'PHYSICAL_AUDIT_SURPLUS' ? `+${adj.quantity}` : `-${adj.quantity}`}
                        </td>
                        <td className="p-3 text-right font-mono text-rose-400 font-bold">
                          {formatCurrency(adj.loss_value)}
                        </td>
                        <td className="p-3 text-slate-300">
                          <span className="font-semibold text-white">{adj.audited_by}</span>: {adj.reason}
                        </td>
                        <td className="p-3 text-slate-400">{formatDate(adj.created_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-10 text-slate-500">
                        No stock audits or damage write-offs logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Barcode Printing Sheet Studio */
          <div className="space-y-4">
            {/* Filter controls */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-400">Filter Product:</span>
                <select
                  value={selectedProductForBarcode}
                  onChange={(e) => loadBarcodeSheet(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                >
                  <option value="">All Products (Full Sheet)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.barcode || 'No Code'})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                <span className="text-xs font-semibold text-slate-400">Labels Per SKU:</span>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={labelCopies}
                  onChange={(e) => setLabelCopies(Number(e.target.value))}
                  className="w-16 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white font-mono text-center"
                />
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Sheet</span>
                </button>
              </div>
            </div>

            {/* Printable Labels Grid */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 printable-area">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {barcodeItems.flatMap((item, idx) =>
                  Array.from({ length: labelCopies }).map((_, cIdx) => (
                    <div
                      key={`${item.id}-${idx}-${cIdx}`}
                      className="bg-white text-slate-950 p-2.5 rounded-lg border border-slate-300 shadow-sm flex flex-col justify-between text-center select-none"
                    >
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-800 truncate">
                          {item.brand || 'Retail'}
                        </div>
                        <div className="text-[11px] font-bold text-slate-950 leading-tight line-clamp-2 my-1">
                          {item.name}
                        </div>
                      </div>

                      {/* Barcode Pattern */}
                      <div className="my-1.5 px-1 py-1 bg-slate-50 border border-slate-200 rounded flex flex-col items-center">
                        <div className="h-6 w-full flex items-center justify-center space-x-0.5">
                          {Array.from({ length: 22 }).map((_, b) => (
                            <div
                              key={b}
                              className={`h-full ${b % 3 === 0 ? 'w-1 bg-black' : b % 2 === 0 ? 'w-0.5 bg-black' : 'w-0.5 bg-slate-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-[9px] font-mono tracking-widest text-slate-700 mt-0.5">
                          {item.barcode || `NEXA-${item.id}092`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] border-t border-slate-200 pt-1 font-mono">
                        <span className="text-slate-500">MRP: ₹{item.mrp || item.selling_rate}</span>
                        <span className="font-bold text-slate-950">₹{item.selling_rate}</span>
                      </div>
                      {item.batch_number && (
                        <div className="text-[8px] text-slate-500 text-left font-mono mt-0.5 truncate">
                          B: {item.batch_number} {item.expiry_date ? `| EXP: ${item.expiry_date}` : ''}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Record Stock Audit Modal */}
      {isAdjModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-amber-400" />
                Physical Stock Reconciliation
              </h2>
              <button
                onClick={() => setIsAdjModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdjustment} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Select Product *</label>
                <select
                  required
                  value={adjForm.product_id}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="">Select Product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {selectedProduct && selectedProduct.batches && selectedProduct.batches.length > 0 && (
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Select Batch *</label>
                  <select
                    required
                    value={adjForm.batch_id}
                    onChange={(e) => handleBatchChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  >
                    {selectedProduct.batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        Batch #{b.batch_number} (Current Stock: {b.stock_units} units)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block mb-1">System Stock</span>
                  <div className="text-base font-mono font-bold text-sky-400">
                    {adjForm.system_stock} units
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Physical Count Found</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={adjForm.physical_stock}
                    onChange={(e) => handlePhysicalStockInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-mono font-bold text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Adjustment Type</label>
                  <select
                    value={adjForm.adjustment_type}
                    onChange={(e) => setAdjForm({ ...adjForm, adjustment_type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="PHYSICAL_AUDIT_DEFICIT">Shortage / Deficit</option>
                    <option value="PHYSICAL_AUDIT_SURPLUS">Surplus / Extra Count</option>
                    <option value="DAMAGE_WRITEOFF">Damaged / Broken Scrap</option>
                    <option value="EXPIRED_QUARANTINE">Expired Quarantine</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Adjust Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={adjForm.quantity}
                    onChange={(e) => setAdjForm({ ...adjForm, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Reason & Auditor</label>
                <input
                  type="text"
                  placeholder="Cycle count notes..."
                  value={adjForm.reason}
                  onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-lg shadow-amber-600/30"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
