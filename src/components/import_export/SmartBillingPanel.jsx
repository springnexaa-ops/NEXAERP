import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import {
  FileText,
  Plus,
  QrCode,
  Printer,
  Share2,
  Trash2,
  DollarSign,
  TrendingUp,
  Boxes,
  ShieldCheck,
  CheckCircle2,
  Search,
  RefreshCw,
  ExternalLink,
  Percent,
  Truck,
  MessageCircle
} from 'lucide-react';
import { BillPreviewModal } from './BillPreviewModal';
import { QRCodePreviewModal } from './QRCodePreviewModal';

export function SmartBillingPanel({ onOpenEwayBill }) {
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isBillPreviewOpen, setIsBillPreviewOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);

  // New Invoice Form state
  const [customerName, setCustomerName] = useState('Global Dynamics International Corp');
  const [customerPhone, setCustomerPhone] = useState('+971 4 800 9988');
  const [customerAddress, setCustomerAddress] = useState('Terminal 3, Free Trade Logistics Zone, Dubai, UAE');
  const [isExport, setIsExport] = useState(true);
  const [lutNumber, setLutNumber] = useState('LUT-2026-9811');
  const [paymentMode, setPaymentMode] = useState('upi');
  const [items, setItems] = useState([
    {
      product_id: 1,
      name: 'Industrial Precision Bearings 6205-2RS',
      hsn_code: '8482.10.10',
      quantity: 50,
      rate: 450,
      cost_price: 360,
      gst_rate: 18
    }
  ]);

  useEffect(() => {
    loadInvoices();
    loadProducts();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await api.getTradeInvoices();
      setInvoices(data || []);
    } catch (err) {
      console.error('Failed to load trade invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await api.getTradeBarcodeProducts();
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        product_id: products[0]?.id || null,
        name: products[0]?.name || 'New Item',
        hsn_code: products[0]?.hsn_code || '8482.10',
        quantity: 1,
        rate: products[0]?.mrp || 100,
        cost_price: (products[0]?.mrp || 100) * 0.75,
        gst_rate: 18
      }
    ]);
  };

  const removeItemRow = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItemRow = (idx, field, value) => {
    const updated = [...items];
    updated[idx][field] = value;
    if (field === 'product_id') {
      const p = products.find(x => String(x.id) === String(value));
      if (p) {
        updated[idx].name = p.name;
        updated[idx].hsn_code = p.hsn_code || '8482.10';
        updated[idx].rate = p.mrp || 100;
        updated[idx].cost_price = (p.mrp || 100) * 0.75;
      }
    }
    setItems(updated);
  };

  // Calculations for new invoice
  const subtotal = items.reduce((acc, it) => acc + (Number(it.quantity) * Number(it.rate)), 0);
  const taxAmount = isExport ? 0 : items.reduce((acc, it) => {
    const lineVal = Number(it.quantity) * Number(it.rate);
    return acc + ((lineVal * Number(it.gst_rate || 0)) / 100);
  }, 0);
  const grandTotal = subtotal + taxAmount;

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        is_export: isExport,
        export_type: isExport ? 'LUT' : 'TAX',
        lut_number: isExport ? lutNumber : null,
        payment_mode: paymentMode,
        items
      };

      const res = await api.createTradeInvoice(payload);
      setIsNewInvoiceOpen(false);
      await loadInvoices();

      // Open the bill preview immediately for the created invoice!
      setSelectedInvoice(res.invoice);
      setIsBillPreviewOpen(true);
    } catch (err) {
      alert(err.message || 'Failed to create invoice');
    }
  };

  const filteredInvoices = invoices.filter(inv =>
    (inv.invoice_number && inv.invoice_number.toLowerCase().includes(search.toLowerCase())) ||
    (inv.customer_name && inv.customer_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/20">
                Invoicing
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                GST & LUT Ready
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1 tracking-tight">
              Invoices & Billing
            </h2>
            <p className="text-xs text-slate-400">
              Domestic tax invoices and zero-rated export bills with payment QR and WhatsApp sharing
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsNewInvoiceOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-md shadow-sky-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {/* 2. Invoices List with Quick Action Triggers */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search invoice # or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400 font-medium">
              {filteredInvoices.length} invoices
            </span>
            <button
              onClick={loadInvoices}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition"
              title="Refresh Invoices"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading invoices...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <p>No invoices recorded yet.</p>
            <button
              onClick={() => setIsNewInvoiceOpen(true)}
              className="text-sky-400 underline hover:text-sky-300"
            >
              Create an invoice
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Taxable</th>
                  <th className="py-3 px-4 text-right">Tax</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Margin</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInvoices.map((inv) => {
                  const margin = Number(inv.margin_pct || 22.4);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-sky-400">
                        {inv.invoice_number || `INV-${inv.id}`}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white block">{inv.customer_name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{inv.customer_phone || 'No Phone'}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {inv.invoice_date || 'Today'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        ₹{Number(inv.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        ₹{Number(inv.tax_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white text-sm">
                        ₹{Number(inv.grand_total || inv.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {margin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* 1. Bill Preview Action */}
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setIsBillPreviewOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold transition inline-flex items-center space-x-1"
                            title="Bill Preview"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>

                          {/* 2. QR Code Preview Action */}
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setIsQRModalOpen(true);
                            }}
                            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700 transition"
                            title="Dynamic UPI QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          {/* 3. WhatsApp Share Action */}
                          {inv.customer_phone && (
                            <a
                              href={`https://wa.me/${inv.customer_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Dear ${inv.customer_name}, here is your Tax Invoice #${inv.invoice_number || inv.id} for ₹${Number(inv.grand_total || inv.total_amount).toFixed(2)}. Pay via UPI: eximtrade@icici. Thank you!`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition"
                              title="Share on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Create Invoice Modal Form */}
      {isNewInvoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-100 max-h-[90vh] flex flex-col">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-sky-400" />
              Generate GST & Commercial Tax Invoice
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Add products, select domestic or export supply, and produce instant Bill Preview with Dynamic QR.
            </p>

            <form onSubmit={handleCreateInvoice} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* Party Information */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300">Customer & Consignee Details</span>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isExport}
                      onChange={(e) => setIsExport(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-sky-600 focus:ring-0"
                    />
                    <span className="text-sky-400 font-semibold">Zero-Rated Export (LUT)</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Customer / Buyer Name</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Phone Number (For WhatsApp)</label>
                    <input
                      type="text"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Delivery / Port Address</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {isExport && (
                  <div>
                    <label className="block text-slate-400 mb-1">LUT / Bond ARN Reference</label>
                    <input
                      type="text"
                      value={lutNumber}
                      onChange={(e) => setLutNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Items Section */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300">Invoice Items List</span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="flex items-center space-x-1 text-sky-400 hover:text-sky-300 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Item Name"
                          value={it.name}
                          onChange={(e) => updateItemRow(idx, 'name', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                        />
                      </div>
                      <div className="w-20">
                        <input
                          type="text"
                          placeholder="HSN"
                          value={it.hsn_code}
                          onChange={(e) => updateItemRow(idx, 'hsn_code', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono"
                        />
                      </div>
                      <div className="w-16">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={it.quantity}
                          onChange={(e) => updateItemRow(idx, 'quantity', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono"
                        />
                      </div>
                      <div className="w-20">
                        <input
                          type="number"
                          placeholder="Rate"
                          value={it.rate}
                          onChange={(e) => updateItemRow(idx, 'rate', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono"
                        />
                      </div>
                      {!isExport && (
                        <div className="w-16">
                          <input
                            type="number"
                            placeholder="GST%"
                            value={it.gst_rate}
                            onChange={(e) => updateItemRow(idx, 'gst_rate', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono"
                          />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length <= 1}
                        className="text-slate-500 hover:text-rose-400 p-1 transition disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Totals Summary */}
                <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-xs">
                  <span className="text-slate-400">
                    Items: {items.length} • Taxable: ₹{subtotal.toFixed(2)} {isExport ? '(LUT 0% Tax)' : `• GST: ₹${taxAmount.toFixed(2)}`}
                  </span>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Grand Total</span>
                    <span className="font-mono font-black text-emerald-400 text-sm">
                      ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewInvoiceOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition shadow-lg shadow-sky-600/20"
                >
                  Save & Open Bill Preview
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill Preview Modal */}
      <BillPreviewModal
        isOpen={isBillPreviewOpen}
        onClose={() => setIsBillPreviewOpen(false)}
        invoice={selectedInvoice}
        onOpenQR={(inv) => {
          setSelectedInvoice(inv);
          setIsQRModalOpen(true);
        }}
        onOpenEwayBill={onOpenEwayBill}
      />

      {/* Standalone Dynamic QR Code Modal */}
      <QRCodePreviewModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        invoice={selectedInvoice}
      />
    </div>
  );
}
