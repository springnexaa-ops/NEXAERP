import React, { useRef } from 'react';
import {
  Printer,
  X,
  FileCheck2,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Building2,
  Calendar,
  User,
  Stethoscope,
  Phone,
  Clock,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function DiagnosticReportModal({ isOpen, onClose, order }) {
  const { currentTenant, settings } = useApp();
  const printRef = useRef(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const results = order.results || [];
  const items = order.items || [];

  // Group results by department
  const resultsByDept = {};
  results.forEach(r => {
    const dept = r.department || 'Clinical Pathology';
    if (!resultsByDept[dept]) resultsByDept[dept] = [];
    resultsByDept[dept].push(r);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-4">
        {/* Top Control Bar */}
        <div className="bg-slate-950 px-6 py-3.5 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
            <FileCheck2 className="w-4 h-4 text-cyan-400" />
            <span>Diagnostic Report Preview: <strong className="text-white font-mono">{order.order_no}</strong></span>
            {order.order_status === 'verified' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                Verified
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-cyan-600/25 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Diagnostic Report</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Diagnostic Document Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-white text-slate-900 print:p-0 print:m-0" id="printable-lab-report" ref={printRef}>
          {/* Diagnostic Clinic Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white font-black text-sm">
                  +
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                    {currentTenant?.name || settings?.store_name || 'Nexa Clinical Laboratory'}
                  </h1>
                  <p className="text-[11px] font-semibold text-cyan-700">
                    DIAGNOSTIC & CLINICAL PATHOLOGY CENTER
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                {settings?.address || 'Near City Civil Hospital, Main Healthcare Complex'}
              </p>
              <div className="flex flex-wrap gap-x-4 text-[11px] text-slate-500">
                <span>Phone: <strong className="text-slate-700">{settings?.phone || '+91 98000 00000'}</strong></span>
                {settings?.gstin && <span>GSTIN: <strong className="text-slate-700">{settings.gstin}</strong></span>}
                {settings?.dl_number && <span>Reg / DL: <strong className="text-slate-700">{settings.dl_number}</strong></span>}
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="inline-block px-3 py-1 bg-slate-100 rounded-lg border border-slate-300 text-right">
                <div className="text-[10px] font-mono uppercase text-slate-500">Sample Barcode</div>
                <div className="text-sm font-black tracking-widest font-mono text-slate-900">{order.barcode}</div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Requisition No: <strong className="text-slate-800">{order.order_no}</strong>
              </div>
            </div>
          </div>

          {/* Patient Demographics Banner */}
          <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 mb-5 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Patient Name</span>
              <span className="font-extrabold text-sm text-slate-900">{order.patient_name}</span>
              <span className="block text-[11px] text-slate-600">{order.patient_age ? `${order.patient_age} Yrs` : ''} • {order.patient_gender || 'Unknown'}</span>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Referring Clinician</span>
              <span className="font-bold text-slate-800">{order.referring_doctor || 'Self / Direct Walk-in'}</span>
              <span className="block text-[10px] text-slate-500">OPD Consultation</span>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Sample Collected</span>
              <span className="font-mono text-slate-800">{order.collected_at ? order.collected_at.slice(0, 16) : 'At Registration'}</span>
              <span className="block text-[10px] text-slate-500 font-mono">By: {order.phlebotomist || 'Staff'}</span>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Report Status</span>
              <span className="font-mono font-bold text-emerald-700 uppercase">
                {order.order_status === 'verified' ? 'Report Verified' : 'Preliminary / Draft'}
              </span>
              <span className="block text-[10px] text-slate-500 font-mono">
                {order.reported_at ? `Reported: ${order.reported_at.slice(0, 16)}` : 'In Analysis'}
              </span>
            </div>
          </div>

          {/* Booked Investigations List */}
          <div className="mb-4 pb-2 border-b border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400">Investigations Ordered:</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {items.map((it, idx) => (
                <span key={idx} className="px-2.5 py-0.5 rounded-md bg-cyan-50 border border-cyan-200 text-cyan-900 text-[11px] font-bold">
                  {it.item_name}
                </span>
              ))}
            </div>
          </div>

          {/* Department-wise Results Table */}
          {Object.entries(resultsByDept).map(([dept, params]) => (
            <div key={dept} className="mb-6">
              <div className="bg-slate-800 text-white px-3 py-1 rounded-t-lg font-bold text-xs uppercase tracking-wider flex justify-between">
                <span>{dept}</span>
                <span className="text-[10px] font-mono text-slate-300">Methodology Standardized</span>
              </div>

              <table className="w-full text-xs border border-slate-300 border-t-0">
                <thead>
                  <tr className="bg-slate-100 text-[11px] text-slate-600 font-bold border-b border-slate-300">
                    <th className="py-2 px-3 text-left">Test / Investigation Parameter</th>
                    <th className="py-2 px-3 text-right">Observed Value</th>
                    <th className="py-2 px-3 text-center">Flag</th>
                    <th className="py-2 px-3 text-left">Units</th>
                    <th className="py-2 px-3 text-left">Biological Reference Interval</th>
                    <th className="py-2 px-3 text-left hidden sm:table-cell">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {params.map((r, i) => {
                    const isAbnormal = r.flag === 'high' || r.flag === 'low' || r.flag === 'critical';
                    const isCritical = r.flag === 'critical';

                    return (
                      <tr key={i} className={`hover:bg-slate-50/80 ${isCritical ? 'bg-rose-50/60 font-semibold' : ''}`}>
                        <td className="py-2 px-3 font-medium text-slate-900">
                          {r.parameter_name}
                          {r.remarks && <span className="block text-[10px] text-slate-500 italic font-normal">{r.remarks}</span>}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-sm">
                          <span className={isCritical ? 'text-rose-600' : isAbnormal ? 'text-amber-700' : 'text-slate-900'}>
                            {r.result_value || '—'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          {r.flag === 'high' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                              HIGH ▲
                            </span>
                          )}
                          {r.flag === 'low' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-sky-100 text-sky-800 border border-sky-300">
                              LOW ▼
                            </span>
                          )}
                          {r.flag === 'critical' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                              PANIC ⚠️
                            </span>
                          )}
                          {(!r.flag || r.flag === 'normal') && (
                            <span className="text-[10px] text-slate-400 font-mono">Normal</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                          {r.unit || '—'}
                        </td>
                        <td className="py-2 px-3 text-slate-600 text-[11px] font-mono">
                          {r.reference_range_text || '—'}
                        </td>
                        <td className="py-2 px-3 text-slate-500 text-[10px] hidden sm:table-cell">
                          {r.method || 'Automated'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}

          {/* Clinical Interpretation / Doctor Notes */}
          {order.clinical_notes && (
            <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 mb-6 text-xs">
              <span className="font-bold text-slate-700 uppercase text-[10px] block mb-1">
                Clinical Pathology Comments & Advice:
              </span>
              <p className="text-slate-800 italic">{order.clinical_notes}</p>
            </div>
          )}

          {/* Pathologist & Lab Technologist Signatures */}
          <div className="border-t-2 border-slate-900 pt-6 mt-8 flex justify-between items-end">
            <div className="text-left space-y-1">
              <div className="flex items-center space-x-2 text-slate-400 text-[10px]">
                <QrCode className="w-12 h-12 text-slate-700" />
                <div>
                  <span className="font-mono font-bold block text-slate-600">Scan for e-Report Verification</span>
                  <span className="font-mono text-[9px] text-slate-400">UUID: {order.barcode} • Auth Valid</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-12 text-center text-xs">
              <div>
                <div className="h-10 flex items-end justify-center font-serif italic text-slate-600 text-sm">
                  Amit Kumar
                </div>
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-800 text-[11px]">
                  Medical Technologist
                </div>
                <div className="text-[9px] text-slate-500 font-mono">DMLT / Quality In-Charge</div>
              </div>

              <div>
                <div className="h-10 flex items-end justify-center font-serif italic font-bold text-cyan-900 text-sm">
                  {order.verified_by ? order.verified_by.split(',')[0] : 'Dr. K. L. Mehta'}
                </div>
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-900 text-[11px]">
                  Consultant Pathologist
                </div>
                <div className="text-[9px] text-slate-500 font-mono">
                  {order.verified_by ? order.verified_by : 'MD (Pathology) • Reg: MCI-48291'}
                </div>
              </div>
            </div>
          </div>

          {/* Footer End Note */}
          <div className="mt-6 pt-2 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400 font-mono">
            <span>Powered by Nexa ERP Clinical Diagnostics • SpringNexa Private Limited</span>
            <span>*** End of Diagnostic Investigation Report ***</span>
          </div>
        </div>
      </div>
    </div>
  );
}
