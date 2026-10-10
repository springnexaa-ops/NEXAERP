import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  X,
  Copy,
  Check,
  Printer,
  Smartphone,
  ShieldCheck,
  CreditCard,
  ExternalLink
} from 'lucide-react';

export function QRCodePreviewModal({ isOpen, onClose, invoice, businessInfo }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [upiUrl, setUpiUrl] = useState('');

  const payeeName = businessInfo?.name || 'TransGlobal Cargo EXIM Corp';
  const upiId = businessInfo?.upi_id || 'eximtrade@icici';
  const amount = Number(invoice?.grand_total || invoice?.total_amount || 0).toFixed(2);
  const invNo = invoice?.invoice_number || invoice?.id || 'INV-001';

  useEffect(() => {
    if (!isOpen) return;

    // Standard NPCI UPI URI Scheme
    const payload = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Inv ${invNo}`)}`;
    setUpiUrl(payload);

    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        payload,
        {
          width: 240,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        },
        (error) => {
          if (error) console.error('Failed to generate UPI QR:', error);
        }
      );
    }
  }, [isOpen, invoice, payeeName, upiId, amount, invNo]);

  if (!isOpen) return null;

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintQR = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas ? canvas.toDataURL() : '';

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>UPI QR Standee - ${invNo}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; text-align: center; padding: 40px; margin: 0; }
            .card { border: 2px solid #0284c7; border-radius: 16px; padding: 24px; max-width: 320px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .badge { background: #0284c7; color: white; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
            h2 { margin: 12px 0 4px; font-size: 18px; color: #0f172a; }
            p.sub { font-size: 12px; color: #64748b; margin: 0 0 16px; }
            img { width: 220px; height: 220px; margin: 8px 0; }
            .amount { font-size: 24px; font-weight: bold; color: #059669; margin: 12px 0 4px; }
            .upi-id { font-family: monospace; font-size: 12px; color: #475569; background: #f1f5f9; padding: 4px 8px; border-radius: 6px; display: inline-block; }
            .apps { display: flex; justify-content: center; gap: 8px; font-size: 10px; color: #64748b; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">Scan & Pay</span>
            <h2>${payeeName}</h2>
            <p class="sub">Invoice #${invNo}</p>
            <img src="${dataUrl}" alt="UPI QR Code" />
            <div class="amount">₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div class="upi-id">${upiId}</div>
            <div class="apps">GPay • PhonePe • Paytm • BHIM UPI • Any Bank</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Dynamic UPI QR Code</h3>
              <p className="text-[11px] text-slate-400">Scan & Pay for Invoice #{invNo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body QR Presentation Card */}
        <div className="p-6 flex flex-col items-center">
          <div className="w-full bg-white text-slate-900 rounded-2xl p-6 shadow-inner flex flex-col items-center text-center border-2 border-sky-500/30">
            <div className="flex items-center space-x-1.5 bg-sky-50 text-sky-700 px-3 py-1 rounded-full text-[11px] font-bold mb-2">
              <Smartphone className="w-3.5 h-3.5" />
              <span>UPI Scan & Pay</span>
            </div>

            <h4 className="font-bold text-slate-900 text-sm">{payeeName}</h4>
            <p className="text-xs text-slate-500 font-mono">Invoice: {invNo}</p>

            {/* QR Canvas */}
            <div className="my-3 p-2 bg-white rounded-xl shadow-sm border border-slate-200">
              <canvas ref={canvasRef} className="block mx-auto rounded-lg" />
            </div>

            {/* Amount Badge */}
            <div className="text-2xl font-black text-emerald-600 tracking-tight">
              ₹{Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Total Payable</p>

            {/* UPI ID Chip */}
            <div className="mt-3 flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700">
              <span>{upiId}</span>
              <button
                onClick={handleCopyUPI}
                className="text-sky-600 hover:text-sky-700 transition"
                title="Copy UPI ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Accepted UPI Apps Banner */}
            <div className="mt-4 pt-3 border-t border-slate-200 w-full flex items-center justify-center space-x-3 text-[10px] font-bold text-slate-600">
              <span className="text-indigo-600">PhonePe</span>
              <span className="text-slate-300">•</span>
              <span className="text-sky-600">Google Pay</span>
              <span className="text-slate-300">•</span>
              <span className="text-cyan-600">Paytm</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-600">BHIM UPI</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secure UPI Payment</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrintQR}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Standee</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-lg shadow-sky-600/20"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
