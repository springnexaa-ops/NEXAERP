import React, { useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  Share2,
  X,
  FileCheck2,
  Building2,
  QrCode,
  Truck,
  CheckCircle,
  ExternalLink,
  MessageCircle
} from 'lucide-react';

export function BillPreviewModal({ isOpen, onClose, invoice, businessInfo, onOpenEwayBill, onOpenQR }) {
  const qrCanvasRef = useRef(null);

  const inv = invoice || {};
  const business = businessInfo || {
    name: 'TransGlobal Cargo & EXIM Trade Corp',
    address: 'Plot 44-B, Jawaharlal Nehru Port SEZ, Navi Mumbai, MH 400707',
    phone: '+91 98200 12345',
    email: 'billing@transglobal-exim.com',
    gstin: '27AABCT9982Q1Z4',
    iec_code: '0308019924',
    bank_name: 'ICICI Bank Ltd (SEZ Trade Branch)',
    account_no: '001105029384',
    ifsc: 'ICIC0000011',
    upi_id: 'eximtrade@icici'
  };

  const grandTotal = Number(inv.grand_total || inv.total_amount || 0);
  const subtotal = Number(inv.subtotal || 0);
  const taxAmount = Number(inv.tax_amount || 0);
  const discount = Number(inv.discount_amount || 0);
  const items = Array.isArray(inv.items) && inv.items.length > 0 ? inv.items : [
    {
      name: 'Industrial Precision Bearings 6205-2RS',
      hsn_code: '8482.10.10',
      quantity: 50,
      unit: 'NOS',
      rate: 450,
      discount: 0,
      taxable: 22500,
      gst_rate: 18,
      cgst_amount: 0,
      sgst_amount: 0,
      igst_amount: 4050,
      total: 26550
    },
    {
      name: 'Stainless Steel Flanges Grade 316L',
      hsn_code: '7307.21.00',
      quantity: 20,
      unit: 'PCS',
      rate: 1100,
      discount: 0,
      taxable: 22000,
      gst_rate: 18,
      cgst_amount: 0,
      sgst_amount: 0,
      igst_amount: 3960,
      total: 25960
    }
  ];

  const isExport = inv.is_export || (inv.customer_name && inv.customer_name.toLowerCase().includes('export')) || inv.export_type === 'LUT';

  useEffect(() => {
    if (!isOpen) return;
    if (qrCanvasRef.current) {
      const upiUrl = `upi://pay?pa=${business.upi_id}&pn=${encodeURIComponent(business.name)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Inv ${inv.invoice_number || 'INV'}`)}`;
      QRCode.toCanvas(
        qrCanvasRef.current,
        upiUrl,
        {
          width: 96,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' }
        },
        (err) => {
          if (err) console.error('Invoice QR generation error:', err);
        }
      );
    }
  }, [isOpen, inv, business, grandTotal]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const phone = (inv.customer_phone || '').replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      `Hello ${inv.customer_name || 'Valued Customer'},\n\nHere is your Tax Invoice #${inv.invoice_number || 'INV-001'} from ${business.name}.\n\nTotal Amount: ₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\nDate: ${inv.invoice_date || new Date().toISOString().split('T')[0]}\nPayment Status: ${inv.payment_status || 'Pending'}\n\nPay online via UPI: ${business.upi_id}\nThank you for doing business with us!`
    );
    const url = phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Control Bar (Screen Only) */}
        <div className="print:hidden flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <FileCheck2 className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Tax Invoice Preview
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {inv.invoice_number || 'EXP/2026-001'}
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenQR && (
              <button
                onClick={() => onOpenQR(inv)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold border border-slate-700 transition"
                title="View Fullscreen Dynamic UPI QR Code"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>UPI QR</span>
              </button>
            )}

            {onOpenEwayBill && (
              <button
                onClick={() => onOpenEwayBill(inv)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 text-xs font-semibold border border-indigo-700/50 transition"
                title="Generate Government E-Way Bill"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>E-Way Bill</span>
              </button>
            )}

            <button
              onClick={handleWhatsAppShare}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Share WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-lg shadow-sky-600/20"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Bill</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Bill Document */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-900/50 flex justify-center">
          <div
            id="printable-bill"
            className="w-full max-w-3xl bg-white text-slate-900 p-6 md:p-8 rounded-2xl shadow-xl border border-slate-200 font-sans text-xs leading-relaxed"
          >
            {/* 1. Header & Business Profile */}
            <div className="border-b-2 border-slate-900 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="inline-block bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded mb-1">
                    {isExport ? 'EXPORT TAX INVOICE (LUT ZERO-RATED)' : 'TAX INVOICE'}
                  </div>
                  <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                    {business.name}
                  </h1>
                  <p className="text-slate-600 text-[11px] max-w-md">{business.address}</p>
                  <p className="text-slate-600 text-[11px] font-mono mt-0.5">
                    Phone: {business.phone} • Email: {business.email}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold text-slate-800 mt-1">
                    <span>GSTIN: <strong className="font-mono text-sky-800">{business.gstin}</strong></span>
                    {business.iec_code && (
                      <span>IEC Code: <strong className="font-mono text-indigo-800">{business.iec_code}</strong></span>
                    )}
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-left min-w-[170px] space-y-1">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Invoice No</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {inv.invoice_number || 'EXP/2026-001'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Date</span>
                      <span className="font-mono font-semibold text-slate-800 text-xs">
                        {inv.invoice_date || new Date().toISOString().split('T')[0]}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Mode of Payment</span>
                      <span className="font-semibold text-slate-800 text-xs capitalize">
                        {inv.payment_mode || 'Bank Wire / UPI'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Bill To & Shipping / Customs Information */}
            <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-300">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Bill To (Consignee)</span>
                <p className="font-bold text-slate-900 text-xs">{inv.customer_name || 'Global Dynamics International Corp'}</p>
                <p className="text-slate-600 text-[11px]">{inv.customer_address || 'Terminal 3, Free Trade Logistics Zone, Dubai, UAE'}</p>
                <p className="text-slate-600 text-[11px]">Phone: {inv.customer_phone || '+971 4 800 9988'}</p>
                <p className="text-[11px] font-mono font-semibold text-slate-800">
                  GSTIN / VAT ID: {inv.customer_gstin || 'ARE1092881920'}
                </p>
              </div>

              <div className="space-y-0.5 pl-4 border-l border-slate-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Logistics & Compliance</span>
                <p className="text-slate-700 text-[11px]">
                  <strong>Place of Supply:</strong> {inv.place_of_supply || (isExport ? 'Outside India (97-Export)' : 'Maharashtra (27)')}
                </p>
                <p className="text-slate-700 text-[11px]">
                  <strong>Port of Loading:</strong> {inv.port_of_loading || 'Nhava Sheva (INNSA1)'}
                </p>
                <p className="text-slate-700 text-[11px]">
                  <strong>Port of Discharge:</strong> {inv.port_of_discharge || 'Jebel Ali (AEJEA)'}
                </p>
                <p className="text-slate-700 text-[11px]">
                  <strong>LUT / Bond Ref:</strong> <span className="font-mono font-bold text-emerald-700">{inv.lut_number || 'LUT-2026-9811 (Active)'}</span>
                </p>
              </div>
            </div>

            {/* 3. Items Table */}
            <div className="my-3 overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-100 border-y border-slate-300 font-bold text-slate-700">
                    <th className="py-2 px-1 text-center w-8">#</th>
                    <th className="py-2 px-2">Description of Goods</th>
                    <th className="py-2 px-2 text-center">HSN/SAC</th>
                    <th className="py-2 px-2 text-right">Qty</th>
                    <th className="py-2 px-2 text-right">Rate (₹)</th>
                    <th className="py-2 px-2 text-right">Taxable (₹)</th>
                    <th className="py-2 px-1 text-center">GST%</th>
                    <th className="py-2 px-2 text-right">Tax (₹)</th>
                    <th className="py-2 px-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item, idx) => {
                    const itemQty = Number(item.quantity) || 1;
                    const itemRate = Number(item.rate || item.selling_rate || 0);
                    const itemTaxable = Number(item.taxable || (itemQty * itemRate));
                    const itemGst = Number(item.gst_rate || 18);
                    const itemTax = Number(item.igst_amount || item.tax_amount || ((itemTaxable * itemGst) / 100));
                    const itemTotal = Number(item.total || (itemTaxable + itemTax));

                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-1 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-2 font-medium text-slate-900">
                          {item.name || item.product_name}
                          {item.batch_number && (
                            <span className="block text-[10px] text-slate-500 font-mono">
                              Batch: {item.batch_number}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-slate-600">{item.hsn_code || '8482.10'}</td>
                        <td className="py-2 px-2 text-right font-mono font-semibold">
                          {itemQty} {item.unit || item.pack_unit || 'NOS'}
                        </td>
                        <td className="py-2 px-2 text-right font-mono">{itemRate.toFixed(2)}</td>
                        <td className="py-2 px-2 text-right font-mono">{itemTaxable.toFixed(2)}</td>
                        <td className="py-2 px-1 text-center font-mono text-slate-600">{itemGst}%</td>
                        <td className="py-2 px-2 text-right font-mono text-slate-600">{itemTax.toFixed(2)}</td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">{itemTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 4. Calculations Summary & Amount in Words */}
            <div className="grid grid-cols-12 gap-4 pt-3 border-t-2 border-slate-900">
              {/* Left Column: Amount in Words, Bank Details, and Embedded QR */}
              <div className="col-span-7 space-y-3">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Amount in Words</span>
                  <p className="font-semibold text-slate-800 text-[11px] italic mt-0.5">
                    {inv.amount_in_words || 'Rupees Fifty-Two Thousand Five Hundred Ten Only'}
                  </p>
                </div>

                <div className="flex gap-3 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {/* Dynamic Embedded QR Code */}
                  <div className="shrink-0 bg-white p-1 rounded border border-slate-300 text-center">
                    <canvas ref={qrCanvasRef} className="block w-20 h-20" />
                    <span className="text-[9px] font-black text-slate-600 block leading-tight mt-0.5">UPI Pay</span>
                  </div>

                  <div className="text-[10px] space-y-0.5 leading-tight flex-1">
                    <span className="font-bold uppercase text-slate-700 block">Bank Account & UPI Settlement</span>
                    <p className="text-slate-600"><strong>Bank:</strong> {business.bank_name}</p>
                    <p className="text-slate-600"><strong>A/C No:</strong> <span className="font-mono font-bold text-slate-900">{business.account_no}</span></p>
                    <p className="text-slate-600"><strong>IFSC:</strong> <span className="font-mono font-bold text-slate-900">{business.ifsc}</span></p>
                    <p className="text-slate-600"><strong>UPI VPA:</strong> <span className="font-mono font-bold text-sky-800">{business.upi_id}</span></p>
                    <p className="text-[9px] text-emerald-700 font-semibold mt-1">
                      Scan QR with GPay, PhonePe, Paytm, or BHIM UPI
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Mathematical Breakup */}
              <div className="col-span-5 space-y-1.5 text-[11px]">
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Subtotal (Taxable Value):</span>
                  <span className="font-mono font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between py-1 text-emerald-600">
                    <span>Discount:</span>
                    <span className="font-mono font-semibold">-₹{discount.toFixed(2)}</span>
                  </div>
                )}

                {!isExport ? (
                  <>
                    <div className="flex justify-between py-1 text-slate-600">
                      <span>CGST (Central Tax):</span>
                      <span className="font-mono font-semibold">₹{(taxAmount / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 text-slate-600">
                      <span>SGST (State Tax):</span>
                      <span className="font-mono font-semibold">₹{(taxAmount / 2).toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between py-1 text-indigo-700">
                    <span>Integrated Tax (IGST / LUT 0%):</span>
                    <span className="font-mono font-semibold">₹{taxAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-center text-sm font-black text-slate-900">
                  <span>Grand Total:</span>
                  <span className="font-mono text-base text-slate-900">
                    ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Terms & Signatures */}
            <div className="mt-6 pt-4 border-t border-slate-300 grid grid-cols-2 gap-4 text-[10px] text-slate-500">
              <div>
                <p className="font-bold text-slate-700 uppercase">Terms & Conditions:</p>
                <ol className="list-decimal list-inside space-y-0.5 mt-0.5">
                  <li>Goods once sold will be accepted back only subject to standard EXIM warranty.</li>
                  <li>Interest @ 18% p.a. will be charged if payment is delayed beyond due date.</li>
                  <li>Subject to Mumbai jurisdiction only.</li>
                </ol>
              </div>

              <div className="text-right flex flex-col justify-end items-end space-y-12">
                <span className="font-bold text-slate-700">For {business.name}</span>
                <div className="border-t border-slate-400 pt-1 text-center min-w-[140px]">
                  <span className="text-slate-600 font-semibold">Authorized Signatory</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Bottom */}
        <div className="print:hidden px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>GST & E-Way Bill Compliant Tax Invoice</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
