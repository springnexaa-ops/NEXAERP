import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Lock,
  Database,
  Download,
  AlertTriangle,
  Layers,
  Cpu,
  RefreshCw,
  X,
  FileText,
  Boxes,
  Users,
  Receipt,
  Truck,
  CheckCircle2,
  HardDriveDownload,
  Building2
} from 'lucide-react';

export function TenantIsolationModal({ isOpen, onClose }) {
  const { currentTenant, isSuperAdminView, showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen, currentTenant?.id]);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getIsolationStatus();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch isolation status');
    } finally {
      setLoading(false);
    }
  };

  const handleExportVault = async () => {
    try {
      setIsExporting(true);
      showToast('Generating database backup for your store...', 'info');

      // Use a link element to trigger the download of the database backup
      const downloadUrl = api.getBackupUrl();
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${currentTenant?.slug || 'tenant'}-backup.sqlite`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Database backup downloaded successfully.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to export store backup', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  const quota = data?.quota;
  const iso = data?.isolation;
  const counts = data?.counts || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 p-6 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Tenant Isolation & Security
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  Enforced
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Nexa ERP SaaS • Multi-Tenant Partitioning
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadStatus}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
              title="Refresh Isolation Status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {loading && !data ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
              <p className="text-sm text-slate-400 font-mono">Verifying store isolation boundary...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center space-x-3 text-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* Isolation Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 mb-1">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>Data Isolation</span>
                  </div>
                  <div>
                    <div className="text-base font-bold text-white">Multi-Tenant Partitioned</div>
                    <div className="text-[11px] text-emerald-400 font-mono mt-0.5">Tenant Scoped</div>
                  </div>
                  <div className="mt-3 text-[10px] text-slate-400 border-t border-slate-800/80 pt-2">
                    Enforces strict tenant scoping at the database and API layer.
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 mb-1">
                    <Cpu className="w-4 h-4 text-sky-400" />
                    <span>Access Control</span>
                  </div>
                  <div>
                    <div className="text-base font-bold text-white">Request Verification</div>
                    <div className="text-[11px] text-sky-400 font-mono mt-0.5">Authorization Middleware</div>
                  </div>
                  <div className="mt-3 text-[10px] text-slate-400 border-t border-slate-800/80 pt-2">
                    Unauthorized cross-organization requests are blocked and logged.
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 mb-1">
                    <Building2 className="w-4 h-4 text-violet-400" />
                    <span>Organization</span>
                  </div>
                  <div>
                    <div className="text-base font-bold text-white truncate">
                      {iso?.tenantName || currentTenant?.name}
                    </div>
                    <div className="text-[11px] text-violet-400 font-mono mt-0.5">
                      ID #{iso?.tenantId || currentTenant?.id} • {iso?.businessVertical?.toUpperCase() || currentTenant?.business_type?.toUpperCase()}
                    </div>
                  </div>
                  <div className="mt-3 text-[10px] text-slate-400 border-t border-slate-800/80 pt-2">
                    Plan: <span className="text-white font-semibold">{iso?.currentPlan?.toUpperCase()}</span> (₹{iso?.effectiveRate}/mo)
                  </div>
                </div>
              </div>

              {/* Plan Quotas & Entitlements Section */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Subscription Plan Quota & Usage Meter
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-bold">
                    {quota?.planName || quota?.plan?.name || `${currentTenant?.plan?.toUpperCase()} Plan`}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Products / SKUs Quota */}
                  {(() => {
                    const current = quota?.products?.current ?? quota?.usage?.products ?? 0;
                    const max = quota?.products?.max ?? quota?.limits?.max_products ?? -1;
                    const percent = quota?.products?.percentUsed ?? quota?.percentages?.products ?? 0;
                    const remaining = max > 0 ? Math.max(0, max - current) : 'Unlimited';

                    return (
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                            <Boxes className="w-3.5 h-3.5 text-sky-400" />
                            Products / SKU Catalog
                          </span>
                          <span className="font-mono text-white font-bold">
                            {current.toLocaleString()} / {max > 0 ? max.toLocaleString() : '∞'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              percent > 90 ? 'bg-rose-500' : percent > 75 ? 'bg-amber-500' : 'bg-sky-500'
                            }`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                          <span>{percent}% Allocated</span>
                          <span>{typeof remaining === 'number' ? remaining.toLocaleString() : remaining} remaining</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Staff Seats Quota */}
                  {(() => {
                    const current = quota?.staff?.current ?? quota?.usage?.staff ?? 0;
                    const max = quota?.staff?.max ?? quota?.limits?.max_staff ?? -1;
                    const percent = quota?.staff?.percentUsed ?? quota?.percentages?.staff ?? 0;
                    const remaining = max > 0 ? Math.max(0, max - current) : 'Unlimited';

                    return (
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-emerald-400" />
                            Staff / Cashier User Seats
                          </span>
                          <span className="font-mono text-white font-bold">
                            {current.toLocaleString()} / {max > 0 ? max.toLocaleString() : '∞'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              percent > 90 ? 'bg-rose-500' : percent > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                          <span>{percent}% Allocated</span>
                          <span>{typeof remaining === 'number' ? remaining.toLocaleString() : remaining} remaining</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Isolated Table Row Counts */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Store Data Records Summary
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Tenant Filtered
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">SKU Inventory</div>
                    <div className="text-lg font-black text-white font-mono mt-0.5">{counts.products ?? 0}</div>
                    <div className="text-[10px] text-slate-500">{counts.batches ?? 0} active batches</div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">POS Sales Invoices</div>
                    <div className="text-lg font-black text-white font-mono mt-0.5">{counts.invoices ?? 0}</div>
                    <div className="text-[10px] text-slate-500">Retail billed orders</div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Customers (Khata)</div>
                    <div className="text-lg font-black text-white font-mono mt-0.5">{counts.customers ?? 0}</div>
                    <div className="text-[10px] text-slate-500">Store-specific ledgers</div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Suppliers & Stock-In</div>
                    <div className="text-lg font-black text-white font-mono mt-0.5">{counts.suppliers ?? 0}</div>
                    <div className="text-[10px] text-slate-500">{counts.purchases ?? 0} purchase bills</div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Staff & Payroll</div>
                    <div className="text-lg font-black text-white font-mono mt-0.5">{counts.employees ?? 0}</div>
                    <div className="text-[10px] text-slate-500">Store personnel only</div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Expenses & Returns</div>
                    <div className="text-lg font-black text-white font-mono mt-0.5">{counts.expenses ?? 0}</div>
                    <div className="text-[10px] text-slate-500">{counts.salesReturns ?? 0} customer returns</div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Stock Audits</div>
                    <div className="text-lg font-black text-white font-mono mt-0.5">{counts.stockAdjustments ?? 0}</div>
                    <div className="text-[10px] text-slate-500">Audits & barcode logs</div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Security Audits</div>
                    <div className="text-lg font-black text-white font-mono mt-0.5">{counts.auditLogs ?? 0}</div>
                    <div className="text-[10px] text-emerald-400 font-semibold">Active logs</div>
                  </div>
                </div>
              </div>

              {/* Database Backup Export Section */}
              <div className="bg-gradient-to-r from-indigo-950/40 to-slate-950/60 border border-indigo-500/20 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start space-x-2 text-white font-bold text-sm">
                    <HardDriveDownload className="w-4 h-4 text-indigo-400" />
                    <span>Download Store Database Backup</span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                    Exports a standalone SQLite database backup containing all records for{' '}
                    <strong className="text-slate-200">{iso?.tenantName || currentTenant?.name}</strong>.
                  </p>
                </div>

                <button
                  onClick={handleExportVault}
                  disabled={isExporting}
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition flex-shrink-0 disabled:opacity-50"
                >
                  <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
                  <span>{isExporting ? 'Exporting...' : 'Export Backup (.sqlite)'}</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Nexa ERP Multi-Tenant Architecture</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
