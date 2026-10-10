import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import {
  Truck,
  Plus,
  Printer,
  ShieldCheck,
  Calendar,
  MapPin,
  CheckCircle2,
  FileText,
  Clock,
  ArrowRight,
  RefreshCw,
  Search
} from 'lucide-react';

export function EWayBillPanel({ onSelectInvoice }) {
  const [ewayBills, setEwayBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    invoice_id: '',
    vehicle_number: 'MH-04-AZ-9921',
    transporter_name: 'VRL Logistics EXIM Fleet',
    transporter_id: 'TRANS-9902',
    from_pincode: '400707',
    to_pincode: '382010',
    distance_km: 420
  });

  useEffect(() => {
    loadEwayBills();
  }, []);

  const loadEwayBills = async () => {
    try {
      setLoading(true);
      const data = await api.getTradeEwayBills();
      setEwayBills(data || []);
    } catch (err) {
      console.error('Failed to load e-way bills:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createTradeEwayBill(formData);
      setShowModal(false);
      loadEwayBills();
    } catch (err) {
      alert(err.message || 'Failed to generate E-Way Bill');
    }
  };

  const handlePrintSlip = (ewb) => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>E-Way Bill Slip - ${ewb.eway_bill_number}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #0f172a; }
            .border-box { border: 2px solid #0f172a; padding: 16px; border-radius: 8px; max-width: 650px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
            .header h2 { margin: 0; font-size: 18px; text-transform: uppercase; }
            .header p { margin: 4px 0 0; font-size: 11px; color: #475569; }
            .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #cbd5e1; font-size: 12px; }
            .label { font-weight: bold; color: #334155; }
            .val { font-family: monospace; font-weight: bold; }
            .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="border-box">
            <div class="header">
              <h2>National E-Way Bill System (NIC Portal)</h2>
              <p>Government of India • Central Board of Indirect Taxes and Customs</p>
            </div>
            <div class="row">
              <span class="label">E-Way Bill Number:</span>
              <span class="val" style="font-size: 15px; color: #0284c7;">${ewb.eway_bill_number}</span>
            </div>
            <div class="row">
              <span class="label">Generated Date & Time:</span>
              <span class="val">${ewb.generated_at || new Date().toISOString()}</span>
            </div>
            <div class="row">
              <span class="label">Valid Until:</span>
              <span class="val" style="color: #059669;">${ewb.valid_until || '2026-10-15'}</span>
            </div>
            <div class="row">
              <span class="label">Invoice / Doc Ref:</span>
              <span class="val">#${ewb.invoice_id || 'INV-2026-091'}</span>
            </div>
            <div class="row">
              <span class="label">Vehicle Number:</span>
              <span class="val">${ewb.vehicle_number}</span>
            </div>
            <div class="row">
              <span class="label">Transporter ID & Name:</span>
              <span class="val">${ewb.transporter_id} - ${ewb.transporter_name}</span>
            </div>
            <div class="row">
              <span class="label">Route Pin Codes:</span>
              <span class="val">${ewb.from_pincode} ➔ ${ewb.to_pincode}</span>
            </div>
            <div class="row">
              <span class="label">Approx Distance:</span>
              <span class="val">${ewb.distance_km} KM</span>
            </div>
            <div class="footer">
              Valid for transport with registered goods. Scan QR code on physical transit checkposts.
            </div>
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
                Logistics & Transit
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                E-Way Bill Ready
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1 tracking-tight">
              E-Way Bills & Transit
            </h2>
            <p className="text-xs text-slate-400">
              Generate 12-digit E-Way bills, assign transport vehicles, and print transit slips
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>New E-Way Bill</span>
          </button>
        </div>
      </div>

      {/* 2. E-Way Bills Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-white">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>E-Way Bills Register</span>
          </div>
          <button
            onClick={loadEwayBills}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading E-Way Bills...</div>
        ) : ewayBills.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Truck className="w-8 h-8 text-slate-600 mx-auto" />
            <p>No E-Way Bills issued yet.</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-indigo-400 underline hover:text-indigo-300"
            >
              Generate your first E-Way Bill now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">EWB Number</th>
                  <th className="py-3 px-4">Vehicle No</th>
                  <th className="py-3 px-4">Transporter</th>
                  <th className="py-3 px-4">Route Pincodes</th>
                  <th className="py-3 px-4">Distance</th>
                  <th className="py-3 px-4">Generated Date</th>
                  <th className="py-3 px-4">Validity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {ewayBills.map((ewb) => (
                  <tr key={ewb.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-sky-400 tracking-wider">
                        {ewb.eway_bill_number}
                      </span>
                      {ewb.invoice_id && (
                        <span className="block text-[10px] text-slate-500 font-mono">
                          Inv #{ewb.invoice_id}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-white">
                      {ewb.vehicle_number}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{ewb.transporter_name}</div>
                      <span className="text-[10px] text-slate-500 font-mono">{ewb.transporter_id}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {ewb.from_pincode} ➔ {ewb.to_pincode}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {ewb.distance_km} KM
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {ewb.generated_at ? ewb.generated_at.split('T')[0] : 'Today'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {ewb.valid_until ? ewb.valid_until.split('T')[0] : 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handlePrintSlip(ewb)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700 font-medium transition text-xs inline-flex items-center space-x-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Slip</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. New E-Way Bill Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-100">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Truck className="w-5 h-5 text-indigo-400" />
              Generate Official E-Way Bill
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter transport details to assign a 12-digit government compliant E-Way Bill Number.
            </p>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH-04-AZ-9921"
                    value={formData.vehicle_number}
                    onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Distance (KM)</label>
                  <input
                    type="number"
                    required
                    value={formData.distance_km}
                    onChange={(e) => setFormData({ ...formData, distance_km: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Transporter Name</label>
                  <input
                    type="text"
                    required
                    value={formData.transporter_name}
                    onChange={(e) => setFormData({ ...formData, transporter_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Transporter ID (TRANSIN)</label>
                  <input
                    type="text"
                    required
                    value={formData.transporter_id}
                    onChange={(e) => setFormData({ ...formData, transporter_id: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">From Pincode (Origin)</label>
                  <input
                    type="text"
                    required
                    value={formData.from_pincode}
                    onChange={(e) => setFormData({ ...formData, from_pincode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">To Pincode (Destination)</label>
                  <input
                    type="text"
                    required
                    value={formData.to_pincode}
                    onChange={(e) => setFormData({ ...formData, to_pincode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/20"
                >
                  Generate E-Way Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
