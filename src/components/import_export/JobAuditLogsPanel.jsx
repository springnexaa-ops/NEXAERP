import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  User,
  ShieldCheck,
  FileCode
} from 'lucide-react';

export function JobAuditLogsPanel() {
  const { showToast } = useApp();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await api.getImportExportJobs();
      setJobs(data || []);
    } catch (err) {
      console.error('Error loading jobs:', err);
      showToast('Failed to load migration audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Data Migration & Export Audit Trail</span>
          </h3>
          <p className="text-xs text-slate-400">
            Immutable log of all universal data porter import migrations and master data extractions
          </p>
        </div>

        <button
          onClick={loadJobs}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Logs</span>
        </button>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-300 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Job ID</th>
                <th className="p-3">Type</th>
                <th className="p-3">Entity</th>
                <th className="p-3">File / Source</th>
                <th className="p-3 text-right">Processed Records</th>
                <th className="p-3 text-right">Success / Failed</th>
                <th className="p-3">Status</th>
                <th className="p-3">Executed By</th>
                <th className="p-3">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    Loading audit trail entries...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No import/export activity recorded yet.
                  </td>
                </tr>
              ) : (
                jobs.map(job => {
                  const isImport = job.job_type === 'import';
                  const isCompleted = job.status === 'completed';
                  const isPartial = job.status === 'partial';

                  return (
                    <tr key={job.id} className="hover:bg-slate-900/50 transition">
                      <td className="p-3 font-mono text-[11px] text-slate-400">
                        #{job.id}
                      </td>

                      <td className="p-3">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          isImport
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {isImport ? <UploadCloud className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                          <span>{job.job_type}</span>
                        </span>
                      </td>

                      <td className="p-3 font-bold text-white uppercase text-[11px]">
                        {job.entity_type}
                      </td>

                      <td className="p-3 font-mono text-[11px] text-slate-300 max-w-[180px] truncate">
                        {job.file_name || `${job.file_format.toUpperCase()} Stream`}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-white">
                        {job.total_records}
                      </td>

                      <td className="p-3 text-right font-mono text-[11px]">
                        <span className="text-emerald-400 font-bold">{job.successful_records}</span>
                        {job.failed_records > 0 && (
                          <span className="text-rose-400 font-bold ml-1">/ -{job.failed_records}</span>
                        )}
                      </td>

                      <td className="p-3">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isPartial
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          <span>{job.status}</span>
                        </span>
                      </td>

                      <td className="p-3 text-slate-300 text-[11px]">
                        <div className="flex items-center space-x-1.5">
                          <User className="w-3 h-3 text-slate-500" />
                          <span className="truncate max-w-[120px]">{job.executed_by || 'Store User'}</span>
                        </div>
                      </td>

                      <td className="p-3 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                        {job.created_at ? new Date(job.created_at).toLocaleString() : 'Recent'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
