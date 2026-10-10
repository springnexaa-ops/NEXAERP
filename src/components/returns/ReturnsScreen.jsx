import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';
import {
  RotateCcw,
  FileText,
  Truck,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  ArrowRight
} from 'lucide-react';

export function ReturnsScreen() {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'suppliers'
  const [salesReturns, setSalesReturns] = useState([]);
  const [supplierReturns, setSupplierReturns] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Sales Return Modal
  const [isSalesReturnModalOpen, setIsSalesReturnModalOpen] = useState(false);
  const [salesReturnForm, setSalesReturnForm] = useState({
    invoice_number: '',
    customer_name: 'Walk-in Customer',
    refund_mode: 'cash', // 'cash', 'khata', 'credit_note'
    reason: 'Defective / Damaged',
    items: [
      {
        product_id: '',
        product_name: '',
        batch_id: '',
        batch_number: '',
        quantity: 1,
        unit_price: 0,
        restock_item: true
      }
    ]
  });

  // New Supplier Debit Note Modal
  const [isSupplierReturnModalOpen, setIsSupplierReturnModalOpen] = useState(false);
  const [supplierReturnForm, setSupplierReturnForm] = useState({
    supplier_id: '',
    total_amount: '',
    reason: 'Damaged / Near-Expiry stock returned to distributor'
  });

  useEffect(() => {
    loadData();
    loadPrerequisites();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sales') {
        const data = await api.getSalesReturns();
        setSalesReturns(data || []);
      } else {
        const data = await api.getSupplierReturns();
        setSupplierReturns(data || []);
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to load returns data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPrerequisites = async () => {
    try {
      const [prodRes, supRes] = await Promise.all([
        api.getProducts(),
        api.getSuppliers()
      ]);
      setProducts(prodRes || []);
      setSuppliers(supRes || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProductSelect = (index, productId) => {
    const prod = products.find((p) => p.id === Number(productId));
    if (!prod) return;

    const firstBatch = prod.batches && prod.batches.length > 0 ? prod.batches[0] : null;
    const newItems = [...salesReturnForm.items];
    newItems[index] = {
      ...newItems[index],
      product_id: prod.id,
      product_name: prod.name,
      batch_id: firstBatch ? firstBatch.id : '',
      batch_number: firstBatch ? firstBatch.batch_number : '',
      unit_price: firstBatch ? firstBatch.selling_rate : (prod.selling_rate || 0),
      quantity: 1
    };
    setSalesReturnForm({ ...salesReturnForm, items: newItems });
  };

  const updateItemQty = (index, qty) => {
    const newItems = [...salesReturnForm.items];
    newItems[index].quantity = Number(qty);
    setSalesReturnForm({ ...salesReturnForm, items: newItems });
  };

  const addItemRow = () => {
    setSalesReturnForm({
      ...salesReturnForm,
      items: [
        ...salesReturnForm.items,
        {
          product_id: '',
          product_name: '',
          batch_id: '',
          batch_number: '',
          quantity: 1,
          unit_price: 0,
          restock_item: true
        }
      ]
    });
  };

  const removeItemRow = (index) => {
    if (salesReturnForm.items.length <= 1) return;
    const newItems = salesReturnForm.items.filter((_, i) => i !== index);
    setSalesReturnForm({ ...salesReturnForm, items: newItems });
  };

  const calculateReturnTotal = () => {
    return salesReturnForm.items.reduce((sum, item) => {
      return sum + (Number(item.quantity || 0) * Number(item.unit_price || 0));
    }, 0);
  };

  const handleCreateSalesReturn = async (e) => {
    e.preventDefault();
    const totalRefund = calculateReturnTotal();
    if (totalRefund <= 0) {
      showToast('Return items cannot have zero amount', 'error');
      return;
    }

    try {
      const payload = {
        invoice_number: salesReturnForm.invoice_number,
        customer_name: salesReturnForm.customer_name,
        refund_mode: salesReturnForm.refund_mode,
        reason: salesReturnForm.reason,
        total_refund_amount: totalRefund,
        items: salesReturnForm.items
      };

      await api.createSalesReturn(payload);
      showToast('Sales Return processed & stock updated', 'success');
      setIsSalesReturnModalOpen(false);
      setSalesReturnForm({
        invoice_number: '',
        customer_name: 'Walk-in Customer',
        refund_mode: 'cash',
        reason: 'Defective / Damaged',
        items: [
          {
            product_id: '',
            product_name: '',
            batch_id: '',
            batch_number: '',
            quantity: 1,
            unit_price: 0,
            restock_item: true
          }
        ]
      });
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to process return', 'error');
    }
  };

  const handleCreateSupplierDebitNote = async (e) => {
    e.preventDefault();
    if (!supplierReturnForm.supplier_id || !supplierReturnForm.total_amount) {
      showToast('Supplier and total claim amount are required', 'error');
      return;
    }

    try {
      await api.createSupplierDebitNote(supplierReturnForm);
      showToast('Supplier Debit Note issued & payables adjusted', 'success');
      setIsSupplierReturnModalOpen(false);
      setSupplierReturnForm({
        supplier_id: '',
        total_amount: '',
        reason: 'Damaged / Near-Expiry stock returned to distributor'
      });
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to issue Debit Note', 'error');
    }
  };

  const totalSalesReturnAmount = salesReturns.reduce((s, r) => s + (r.total_refund_amount || 0), 0);
  const totalDebitNoteAmount = supplierReturns.reduce((s, r) => s + (r.total_amount || 0), 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Returns & Credit / Debit Notes
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                RMA & Claims
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Customer Sales Returns, Inventory Restocking, and Distributor Debit Claims
            </p>
          </div>
        </div>

        {/* View Switchers & Action */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'sales'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sales Returns (RMA)
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'suppliers'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Supplier Debit Notes
            </button>
          </div>

          {activeTab === 'sales' ? (
            <button
              onClick={() => setIsSalesReturnModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-rose-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>New Sales Return</span>
            </button>
          ) : (
            <button
              onClick={() => setIsSupplierReturnModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-amber-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Debit Note</span>
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

      {/* KPI Cards */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Sales Returns Refunded</span>
            <RotateCcw className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400 mt-1">
            {formatCurrency(totalSalesReturnAmount)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{salesReturns.length} Return Invoices</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Supplier Debit Notes</span>
            <Truck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400 mt-1">
            {formatCurrency(totalDebitNoteAmount)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{supplierReturns.length} Supplier Claims</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Restocked Inventory</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            Active
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Automated batch stock reload</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Khata Credit Sync</span>
            <FileText className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-sky-400 mt-1">
            Linked
          </div>
          <div className="text-[10px] text-sky-400 font-mono mt-0.5">Automated Udhar deductions</div>
        </div>
      </div>

      {/* Main Content Table */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {activeTab === 'sales' ? (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-3 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Customer Sales Return Register</span>
              <span className="text-xs text-slate-400">{salesReturns.length} records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-semibold">
                    <th className="p-3">Return #</th>
                    <th className="p-3">Orig. Invoice #</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Refund Mode</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3 text-right">Refund Amount</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {salesReturns.length > 0 ? (
                    salesReturns.map((ret) => (
                      <tr key={ret.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 font-mono font-bold text-rose-400">{ret.return_number}</td>
                        <td className="p-3 font-mono text-slate-300">{ret.invoice_number}</td>
                        <td className="p-3 font-semibold text-white">{ret.customer_name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            {ret.refund_mode}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{ret.reason}</td>
                        <td className="p-3 text-right font-mono font-bold text-rose-400">
                          {formatCurrency(ret.total_refund_amount)}
                        </td>
                        <td className="p-3 text-slate-400">{formatDate(ret.created_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-10 text-slate-500">
                        No customer sales returns recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-3 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Supplier Debit Notes (Distributor Return Register)</span>
              <span className="text-xs text-slate-400">{supplierReturns.length} records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-semibold">
                    <th className="p-3">Debit Note #</th>
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3">Claim Reason</th>
                    <th className="p-3 text-right">Debit Claim Amount</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {supplierReturns.length > 0 ? (
                    supplierReturns.map((dn) => (
                      <tr key={dn.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 font-mono font-bold text-amber-400">{dn.debit_note_no}</td>
                        <td className="p-3 font-semibold text-white">{dn.supplier_name}</td>
                        <td className="p-3 text-slate-400">{dn.reason}</td>
                        <td className="p-3 text-right font-mono font-bold text-amber-400">
                          {formatCurrency(dn.total_amount)}
                        </td>
                        <td className="p-3 text-slate-400">{formatDate(dn.created_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-10 text-slate-500">
                        No supplier debit notes recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* New Sales Return Modal */}
      {isSalesReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-400" />
                Process Customer Sales Return (RMA)
              </h2>
              <button
                onClick={() => setIsSalesReturnModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSalesReturn} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Original Invoice Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-20261006-001"
                    value={salesReturnForm.invoice_number}
                    onChange={(e) => setSalesReturnForm({ ...salesReturnForm, invoice_number: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Customer Name</label>
                  <input
                    type="text"
                    placeholder="Walk-in Customer"
                    value={salesReturnForm.customer_name}
                    onChange={(e) => setSalesReturnForm({ ...salesReturnForm, customer_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Items returning */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-300 font-semibold">Returning Items & Quantities</label>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold"
                  >
                    + Add Another Item
                  </button>
                </div>

                <div className="space-y-2">
                  {salesReturnForm.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Product</label>
                          <select
                            value={item.product_id}
                            onChange={(e) => handleProductSelect(idx, e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white"
                          >
                            <option value="">Select Product...</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.brand || 'Generic'})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-2">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Return Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemQty(idx, e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Rate (₹)</label>
                          <input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => {
                              const newItems = [...salesReturnForm.items];
                              newItems[idx].unit_price = Number(e.target.value);
                              setSalesReturnForm({ ...salesReturnForm, items: newItems });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Subtotal</label>
                          <div className="py-1.5 font-mono font-bold text-rose-400">
                            {formatCurrency(Number(item.quantity || 0) * Number(item.unit_price || 0))}
                          </div>
                        </div>

                        <div className="col-span-1 text-right">
                          <label className="text-[10px] text-transparent block mb-0.5">Del</label>
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="text-rose-400 hover:text-rose-300 font-bold p-1"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-1">
                        <input
                          type="checkbox"
                          id={`restock-${idx}`}
                          checked={item.restock_item}
                          onChange={(e) => {
                            const newItems = [...salesReturnForm.items];
                            newItems[idx].restock_item = e.target.checked;
                            setSalesReturnForm({ ...salesReturnForm, items: newItems });
                          }}
                          className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                        />
                        <label htmlFor={`restock-${idx}`} className="text-[11px] text-slate-300 cursor-pointer">
                          Put item back into batch inventory stock
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Refund Mode</label>
                  <select
                    value={salesReturnForm.refund_mode}
                    onChange={(e) => setSalesReturnForm({ ...salesReturnForm, refund_mode: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="cash">Cash Refund to Customer</option>
                    <option value="khata">Credit to Customer's Khata (Udhar Deduct)</option>
                    <option value="credit_note">Store Credit Voucher</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Return Reason</label>
                  <select
                    value={salesReturnForm.reason}
                    onChange={(e) => setSalesReturnForm({ ...salesReturnForm, reason: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Defective / Damaged">Defective / Damaged</option>
                    <option value="Wrong Item Dispatched">Wrong Item Dispatched</option>
                    <option value="Near Expiry / Expired">Near Expiry / Expired</option>
                    <option value="Customer Exchange / Return">Customer Exchange / Return</option>
                  </select>
                </div>
              </div>

              {/* Total Refund Banner */}
              <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl flex justify-between items-center">
                <span className="text-slate-300 font-medium">Total Refund Amount:</span>
                <span className="text-lg font-mono font-bold text-rose-400">
                  {formatCurrency(calculateReturnTotal())}
                </span>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSalesReturnModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-lg shadow-rose-600/30"
                >
                  Confirm & Process Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Supplier Debit Note Modal */}
      {isSupplierReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                Issue Supplier Debit Note
              </h2>
              <button
                onClick={() => setIsSupplierReturnModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSupplierDebitNote} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Select Supplier / Distributor *</label>
                <select
                  required
                  value={supplierReturnForm.supplier_id}
                  onChange={(e) => setSupplierReturnForm({ ...supplierReturnForm, supplier_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="">Select Supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Balance: ₹{s.current_balance})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Claim Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 1250"
                  value={supplierReturnForm.total_amount}
                  onChange={(e) => setSupplierReturnForm({ ...supplierReturnForm, total_amount: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Reason for Debit Note</label>
                <textarea
                  rows="3"
                  value={supplierReturnForm.reason}
                  onChange={(e) => setSupplierReturnForm({ ...supplierReturnForm, reason: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSupplierReturnModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-lg shadow-amber-600/30"
                >
                  Generate Debit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
