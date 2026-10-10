import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { Truck, Plus, Check, Trash2, Calendar, FileText } from 'lucide-react';

export function PurchasesScreen() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [supplierId, setSupplierId] = useState('');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [items, setItems] = useState([
    {
      product_id: '',
      batch_number: 'LOT-' + Date.now().toString().slice(-4),
      expiry_date: '2028-12-31',
      purchase_rate: 0,
      mrp: 0,
      selling_rate: 0,
      quantity: 10
    }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [purData, supData, prodData] = await Promise.all([
        api.getPurchases(),
        api.getSuppliers(),
        api.getProducts()
      ]);
      setPurchases(purData || []);
      setSuppliers(supData || []);
      setProducts(prodData || []);
      if (supData?.length > 0) setSupplierId(supData[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        product_id: products[0]?.id || '',
        batch_number: 'LOT-' + Date.now().toString().slice(-4),
        expiry_date: '2028-12-31',
        purchase_rate: 0,
        mrp: 0,
        selling_rate: 0,
        quantity: 10
      }
    ]);
  };

  const removeItemRow = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItemRow = (idx, field, value) => {
    const next = [...items];
    next[idx][field] = value;
    setItems(next);
  };

  const totalPurchaseAmount = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.purchase_rate)), 0);

  const handleSubmitPurchase = async (e) => {
    e.preventDefault();
    if (items.some(i => !i.product_id)) {
      alert('Please select a product for all rows.');
      return;
    }

    try {
      await api.createPurchase({
        supplier_id: supplierId,
        supplier_invoice_no: supplierInvoiceNo,
        items,
        total_amount: totalPurchaseAmount,
        payment_status: paymentStatus
      });

      setIsNewEntryOpen(false);
      loadData();
      alert('Purchase entry saved! Batches and stock updated.');
    } catch (err) {
      alert(err.message || 'Failed to save purchase');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden select-none">
      {/* Top Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-400" />
            Purchases & Inward Stock Register
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log inward invoices from distributors & wholesalers to update batches and inventory
          </p>
        </div>

        <button
          onClick={() => setIsNewEntryOpen(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Inward Purchase Entry</span>
        </button>
      </div>

      {/* History Table */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-3 px-4">PO Reference</th>
                <th className="py-3 px-4">Supplier / Agency</th>
                <th className="py-3 px-4">Supplier Bill No</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Invoice Amount</th>
                <th className="py-3 px-4 text-right">Inward Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">Loading purchase entries...</td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No inward purchases logged yet. Click "New Inward Purchase Entry" above to add stock from suppliers.
                  </td>
                </tr>
              ) : (
                purchases.map(p => (
                  <tr key={p.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">{p.purchase_number}</td>
                    <td className="py-3 px-4 font-semibold text-slate-200">{p.supplier_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{p.supplier_invoice_no || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {p.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(p.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      {formatDateTime(p.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Entry Modal */}
      {isNewEntryOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl my-8 overflow-hidden">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-400" />
                Inward Purchase Invoice Entry (Stock Inward)
              </h3>
              <button onClick={() => setIsNewEntryOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmitPurchase} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Select Supplier / Wholesaler *</label>
                  <select
                    value={supplierId}
                    onChange={e => setSupplierId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Supplier Bill / Invoice No *</label>
                  <input
                    type="text"
                    required
                    value={supplierInvoiceNo}
                    onChange={e => setSupplierInvoiceNo(e.target.value)}
                    placeholder="e.g. MED-INV-8491"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={e => setPaymentStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="paid">Paid (Cash/Bank)</option>
                    <option value="credit">Credit (Added to Supplier Payable)</option>
                  </select>
                </div>
              </div>

              {/* Items Line Grid */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-indigo-400 uppercase tracking-wider text-[11px]">Items to Inward</h4>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="px-3 py-1 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold hover:bg-indigo-600/30"
                  >
                    + Add Line Item
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-3">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Product</label>
                        <select
                          value={item.product_id}
                          onChange={e => updateItemRow(idx, 'product_id', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs"
                        >
                          <option value="">Select Item</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Batch No</label>
                        <input
                          type="text"
                          value={item.batch_number}
                          onChange={e => updateItemRow(idx, 'batch_number', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono text-xs"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Expiry Date</label>
                        <input
                          type="date"
                          value={item.expiry_date}
                          onChange={e => updateItemRow(idx, 'expiry_date', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono text-xs"
                        />
                      </div>

                      <div className="col-span-1">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Qty</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => updateItemRow(idx, 'quantity', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono text-xs"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Cost Rate (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.purchase_rate}
                          onChange={e => updateItemRow(idx, 'purchase_rate', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono text-xs"
                        />
                      </div>

                      <div className="col-span-1">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Sell (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.selling_rate}
                          onChange={e => updateItemRow(idx, 'selling_rate', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono text-xs"
                        />
                      </div>

                      <div className="col-span-1 text-center pt-3">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400 text-xs">Total Inward Purchase Value:</span>
                <span className="text-xl font-black font-mono text-emerald-400">
                  {formatCurrency(totalPurchaseAmount)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewEntryOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Save & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
