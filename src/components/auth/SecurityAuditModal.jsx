import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { formatDateTime } from '../../utils/formatters';
import { ShieldCheck, X, AlertTriangle, CheckCircle, Lock, UserCheck } from 'lucide-react';

export function SecurityAuditModal({ isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-white text-base">Security Audit Logs</h3>
              <p className="text-xs text-slate-400">Real-time authentication events, failed attempts, and role access logs</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="p-4 max-h-[65vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-10 text-xs text-slate-400">Loading security logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500">No security events recorded.</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px] sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Event Type</th>
                  <th className="py-2.5 px-3">User / Email</th>
                  <th className="py-2.5 px-3">Details</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3 text-right">Timestamp</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/80 font-mono">
                {logs.map(log => {
                  const isSuccess = log.event_type === 'LOGIN_SUCCESS';
                  const isFailed = log.event_type === 'LOGIN_FAILED' || log.event_type === 'ACCOUNT_LOCKED' || log.event_type === 'UNAUTHORIZED_ACCESS';

                  return (
                    <tr key={log.id} className="hover:bg-slate-950/40 text-[11px]">
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isSuccess
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isFailed
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-sky-500/20 text-sky-300'
                        }`}>
                          {log.event_type}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-white font-semibold">
                        {log.email || '-'}
                      </td>

                      <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">
                        {log.details || '-'}
                      </td>

                      <td className="py-2.5 px-3 text-slate-500 text-[10px]">
                        {log.ip_address || '127.0.0.1'}
                      </td>

                      <td className="py-2.5 px-3 text-right text-slate-400 text-[10px]">
                        {formatDateTime(log.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
