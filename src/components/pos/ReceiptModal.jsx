import React, { useState } from 'react';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { Printer, Share2, X, CheckCircle, FileText, Smartphone } from 'lucide-react';

export function ReceiptModal({ invoiceData, onClose }) {
  const [printFormat, setPrintFormat] = useState('thermal80'); // 'thermal80' | 'a4'

  if (!invoiceData) return null;
  const { invoice, items = [], settings = {} } = invoiceData;

  const handlePrint = () => {
    window.print();
  };

  const getWhatsAppShareUrl = () => {
    if (!invoice.customer_phone) return null;
    const phone = invoice.customer_phone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;

    const text = `*Bill from ${settings.store_name}*\n` +
      `Invoice: ${invoice.invoice_number}\n` +
      `Date: ${formatDate(invoice.created_at)}\n` +
      `Total Items: ${invoice.total_items}\n` +
      `Grand Total: ₹${invoice.grand_total}\n` +
      `Payment Mode: ${invoice.payment_mode?.toUpperCase()}\n` +
      (invoice.khata_amount > 0 ? `Udhar Added: ₹${invoice.khata_amount}\n` : '') +
      `\nThank you for shopping with us!`;

    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-white text-sm">Invoice #{invoice.invoice_number}</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Format toggle */}
            <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex text-xs">
              <button
                onClick={() => setPrintFormat('thermal80')}
                className={`px-2 py-1 rounded-md font-medium ${
                  printFormat === 'thermal80' ? 'bg-sky-600 text-white' : 'text-slate-400'
                }`}
              >
                80mm Thermal
              </button>
              <button
                onClick={() => setPrintFormat('a4')}
                className={`px-2 py-1 rounded-md font-medium ${
                  printFormat === 'a4' ? 'bg-sky-600 text-white' : 'text-slate-400'
                }`}
              >
                A4 / GST Bill
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-4 sm:p-6 bg-slate-950/60 max-h-[75vh] overflow-y-auto flex justify-center">
          <div
            id="printable-receipt"
            className={`bg-white text-black font-mono shadow-xl p-5 text-xs transition-all ${
              printFormat === 'thermal80' ? 'w-[320px]' : 'w-full max-w-2xl'
            }`}
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-gray-400">
              <h2 className="font-black text-base uppercase tracking-tight">{settings.store_name}</h2>
              <p className="text-[11px] text-gray-700 leading-tight mt-0.5">{settings.store_address}</p>
              <p className="text-[11px] text-gray-700">Phone: {settings.phone}</p>
              {settings.gstin && <p className="text-[11px] font-bold">GSTIN: {settings.gstin}</p>}
              {settings.dl_number && <p className="text-[10px] text-gray-700">Drug Lic: {settings.dl_number}</p>}
              {settings.fssai_number && <p className="text-[10px] text-gray-700">FSSAI: {settings.fssai_number}</p>}
            </div>

            {/* Bill Meta */}
            <div className="py-2.5 border-b border-dashed border-gray-400 text-[11px] space-y-0.5">
              <div className="flex justify-between font-bold">
                <span>Invoice: {invoice.invoice_number}</span>
                <span>{formatDateTime(invoice.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer: {invoice.customer_name || 'Walk-in Customer'}</span>
                <span>{invoice.customer_phone || ''}</span>
              </div>
              {(invoice.doctor_name || invoice.patient_name) && (
                <div className="pt-1 text-[10px] border-t border-gray-200 mt-1">
                  {invoice.doctor_name && <div><strong>Doctor:</strong> {invoice.doctor_name}</div>}
                  {invoice.patient_name && <div><strong>Patient:</strong> {invoice.patient_name}</div>}
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2 border-b border-dashed border-gray-400">
              <div className="grid grid-cols-12 font-bold text-[10px] pb-1 border-b border-gray-300 uppercase">
                <span className="col-span-6">Item / Batch</span>
                <span className="col-span-2 text-right">Qty</span>
                <span className="col-span-2 text-right">Rate</span>
                <span className="col-span-2 text-right">Total</span>
              </div>

              <div className="space-y-1.5 pt-1.5">
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-[11px] leading-tight">
                    <div className="col-span-6 pr-1">
                      <div className="font-semibold text-gray-900 line-clamp-1">{item.product_name}</div>
                      {(item.batch_number || item.expiry_date) && (
                        <div className="text-[9px] text-gray-600">
                          {item.batch_number ? `B: ${item.batch_number}` : ''}{' '}
                          {item.expiry_date ? `Exp: ${item.expiry_date.slice(0, 7)}` : ''}
                        </div>
                      )}
                    </div>
                    <div className="col-span-2 text-right font-mono">
                      {item.quantity} {item.is_loose ? 'tab' : ''}
                    </div>
                    <div className="col-span-2 text-right font-mono">
                      ₹{item.unit_price}
                    </div>
                    <div className="col-span-2 text-right font-bold font-mono">
                      ₹{item.total}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Calculation */}
            <div className="py-2 border-b border-dashed border-gray-400 text-[11px] space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Subtotal ({invoice.total_items} items):</span>
                <span>₹{invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount:</span>
                  <span>-₹{invoice.discount_amount.toFixed(2)}</span>
                </div>
              )}
              {invoice.tax_amount > 0 && (
                <div className="flex justify-between text-gray-600 text-[10px]">
                  <span>GST Incl. (CGST+SGST):</span>
                  <span>₹{invoice.tax_amount.toFixed(2)}</span>
                </div>
              )}
              {invoice.round_off !== 0 && (
                <div className="flex justify-between text-[10px] text-gray-600">
                  <span>Round Off:</span>
                  <span>{invoice.round_off > 0 ? `+₹${invoice.round_off}` : `-₹${Math.abs(invoice.round_off)}`}</span>
                </div>
              )}

              <div className="flex justify-between font-black text-sm pt-1 border-t border-gray-400">
                <span>GRAND TOTAL:</span>
                <span>₹{invoice.grand_total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2 border-b border-dashed border-gray-400 text-[10px] space-y-0.5">
              <div className="flex justify-between font-bold">
                <span>Payment Mode:</span>
                <span className="uppercase">{invoice.payment_mode}</span>
              </div>
              {invoice.cash_paid > 0 && <div className="flex justify-between"><span>Cash Paid:</span><span>₹{invoice.cash_paid}</span></div>}
              {invoice.upi_paid > 0 && <div className="flex justify-between"><span>UPI Paid:</span><span>₹{invoice.upi_paid}</span></div>}
              {invoice.khata_amount > 0 && (
                <div className="flex justify-between font-bold text-red-700">
                  <span>Udhar / Khata Amount:</span>
                  <span>₹{invoice.khata_amount}</span>
                </div>
              )}
            </div>

            {/* Footer Message */}
            <div className="text-center pt-3 text-[10px] text-gray-600">
              <p>{settings.footer_message || 'Thank you for your visit!'}</p>
              <p className="text-[9px] mt-0.5 font-semibold">Powered by Nexa ERP • SpringNexa Private Limited</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between no-print">
          <div>
            {getWhatsAppShareUrl() && (
              <a
                href={getWhatsAppShareUrl()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30"
              >
                <Smartphone className="w-4 h-4" />
                <span>WhatsApp Bill</span>
              </a>
            )}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-600/30 flex items-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
