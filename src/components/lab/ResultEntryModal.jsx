import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  FlaskConical,
  Save,
  ShieldCheck,
  Stethoscope,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../../utils/api';
import { useApp } from '../../context/AppContext';

export function ResultEntryModal({ isOpen, onClose, orderId, onSaved }) {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState(null);
  const [observations, setObservations] = useState([]);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [verifiedBy, setVerifiedBy] = useState('Dr. K. L. Mehta, MD (Pathologist) [Reg: MCI-48291]');

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrderDetails();
    }
  }, [isOpen, orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const data = await api.getLabOrder(orderId);
      setOrder(data);
      setClinicalNotes(data.clinical_notes || '');
      if (data.verified_by) setVerifiedBy(data.verified_by);

      const obsList = (data.results || []).map(r => ({
        id: r.id,
        test_id: r.test_id,
        test_name: r.test_name,
        department: r.department,
        parameter_id: r.parameter_id,
        parameter_name: r.parameter_name,
        result_value: r.result_value || '',
        unit: r.unit || '',
        reference_range_text: r.reference_range_text || '',
        flag: r.flag || 'normal',
        remarks: r.remarks || ''
      }));
      setObservations(obsList);
    } catch (err) {
      showToast(err.message || 'Failed to load order for result entry', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleValueChange = (idx, val) => {
    const updated = [...observations];
    updated[idx].result_value = val;
    setObservations(updated);
  };

  const handleRemarksChange = (idx, remarks) => {
    const updated = [...observations];
    updated[idx].remarks = remarks;
    setObservations(updated);
  };

  const handleSaveObservations = async (andVerify = false) => {
    try {
      setSaving(true);
      await api.saveLabOrderResults(orderId, {
        observations,
        clinical_notes: clinicalNotes,
        entered_by: 'Laboratory Technologist'
      });

      if (andVerify) {
        await api.verifyLabOrder(orderId, { verified_by: verifiedBy });
        showToast('Report verified and signed off by Pathologist!', 'success');
      } else {
        showToast('Clinical observations saved successfully!', 'success');
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to save results', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/60 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-white">Clinical Result Entry & Analysis</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                  {order?.order_no || 'Loading...'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Patient: <strong className="text-slate-200">{order?.patient_name}</strong> ({order?.patient_age}Y, {order?.patient_gender}) • Ref: {order?.referring_doctor}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-200">
          {loading ? (
            <div className="py-20 text-center text-slate-400 font-mono">
              Loading investigation parameters...
            </div>
          ) : (
            <>
              {/* Parameter Entry Table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Investigation Parameter</th>
                      <th className="py-2.5 px-3 text-left w-36">Observed Value *</th>
                      <th className="py-2.5 px-3 text-left w-24">Units</th>
                      <th className="py-2.5 px-3 text-left">Biological Reference Interval</th>
                      <th className="py-2.5 px-3 text-left w-48">Clinician Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                    {observations.map((obs, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-medium text-white">
                          <div>{obs.parameter_name}</div>
                          <div className="text-[10px] text-cyan-400 font-normal">{obs.test_name}</div>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder="Value"
                            value={obs.result_value}
                            onChange={e => handleValueChange(idx, e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:outline-none focus:border-cyan-500 text-xs"
                          />
                        </td>
                        <td className="py-2 px-3 text-slate-400 font-mono">
                          {obs.unit || '—'}
                        </td>
                        <td className="py-2 px-3 text-slate-300 font-mono text-[11px]">
                          {obs.reference_range_text || '—'}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder="Optional notes"
                            value={obs.remarks}
                            onChange={e => handleRemarksChange(idx, e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white text-[11px] focus:outline-none focus:border-cyan-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pathologist Remarks & Sign-off Details */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                  Pathologist Clinical Comments & Sign-off
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Diagnostic Interpretation / Remarks</label>
                    <textarea
                      rows="2"
                      placeholder="e.g. Findings consistent with iron deficiency anemia. Clinical correlation recommended."
                      value={clinicalNotes}
                      onChange={e => setClinicalNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Authorizing Consultant Pathologist</label>
                    <input
                      type="text"
                      value={verifiedBy}
                      onChange={e => setVerifiedBy(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500 text-xs font-semibold"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Name, qualifications and MCI/state medical council registration number
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={() => handleSaveObservations(false)}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft Observations</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveObservations(true)}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center space-x-2 shadow-lg shadow-cyan-600/25 transition disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify & Authorize Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
