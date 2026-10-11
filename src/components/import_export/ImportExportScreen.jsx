import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useApp } from '../../context/AppContext';
import { SmartBillingPanel } from './SmartBillingPanel';
import { BarcodePreviewPanel } from './BarcodePreviewPanel';
import { EWayBillPanel } from './EWayBillPanel';
import { ProfitAnalysisPanel } from './ProfitAnalysisPanel';
import { ReceivablesPanel } from './ReceivablesPanel';
import { GstSummaryPanel } from './GstSummaryPanel';
import { DataImportPanel } from './DataImportPanel';
import { DataExportPanel } from './DataExportPanel';
import { EximTradePanel } from './EximTradePanel';
import { CHACustomsPortalPanel } from './CHACustomsPortalPanel';
import { DgftLicensesPanel } from './DgftLicensesPanel';
import { PortsManagementPanel } from './PortsManagementPanel';
import { FssaiLabelGeneratorPanel } from './FssaiLabelGeneratorPanel';
import { JobAuditLogsPanel } from './JobAuditLogsPanel';
import {
  Anchor,
  Award,
  ArrowLeftRight,
  UploadCloud,
  Download,
  Globe,
  FileText,
  Boxes,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Layers,
  Barcode,
  Truck,
  TrendingUp,
  Clock,
  Receipt,
  FileCheck2,
  CheckCircle2,
  Ship,
  Utensils
} from 'lucide-react';

export function ImportExportScreen() {
  const { currentTenant, currencySymbol, showToast, user } = useApp();
  // Default to CHA portal if CHA user or standard EXIM view
  const [activeSubTab, setActiveSubTab] = useState(() => {
    return user?.role === 'cha_agent' ? 'cha' : 'cha';
  });
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      setLoadingOverview(true);
      const data = await api.getImportExportOverview();
      setOverview(data);
    } catch (err) {
      console.error('Error loading import/export overview:', err);
    } finally {
      setLoadingOverview(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-900 text-slate-100 p-4 md:p-6 space-y-6">
      {/* 1. Header & System Identity Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-sky-600/30">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/20">
                EXIM Trade & Invoicing
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1 tracking-tight">
              Trade Billing & Logistics Management
            </h1>
            <p className="text-xs text-slate-400">
              GST tax invoices, barcode labels, E-Way bills, profit analysis, and customs shipments
            </p>
          </div>
        </div>

        {/* Quick Summary Pill Counters */}
        {overview && (
          <div className="flex items-center space-x-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 text-xs">
            <div className="px-3 py-1 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Imported</div>
              <div className="font-mono font-bold text-sky-400">{overview.totalImportedRecords || 0}</div>
            </div>
            <div className="w-px h-6 bg-slate-800"></div>
            <div className="px-3 py-1 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Exported</div>
              <div className="font-mono font-bold text-emerald-400">{overview.totalExportedRecords || 0}</div>
            </div>
            <div className="w-px h-6 bg-slate-800"></div>
            <div className="px-3 py-1 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Active EXIM</div>
              <div className="font-mono font-bold text-purple-400">{overview.activeEximConsignments || 0}</div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Navigation Tabs (Horizontal Scrollable) */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto select-none no-scrollbar">
        <button
          onClick={() => setActiveSubTab('cha')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === 'cha'
              ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Anchor className="w-4 h-4 text-sky-300" />
          <span>CHA Customs Portal</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ports')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === 'ports'
              ? 'bg-gradient-to-r from-sky-500 to-cyan-600 text-white shadow-md shadow-sky-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Ship className="w-4 h-4 text-sky-300" />
          <span>Customs Ports & ICDs</span>
        </button>

        <button
          onClick={() => setActiveSubTab('licenses')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === 'licenses'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Award className="w-4 h-4 text-emerald-300" />
          <span>DGFT, RCMC & FSSAI</span>
        </button>

        <button
          onClick={() => setActiveSubTab('fssai_label')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === 'fssai_label'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Utensils className="w-4 h-4 text-emerald-300" />
          <span>FSSAI Label Studio</span>
        </button>

        <button
          onClick={() => setActiveSubTab('exim')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === 'exim'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Shipments & Logistics</span>
        </button>

        <button
          onClick={() => setActiveSubTab('billing')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === 'billing'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Invoices & Billing</span>
        </button>

        <button
          onClick={() => setActiveSubTab('barcode')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === 'barcode'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Barcode className="w-4 h-4" />
          <span>Barcode Labels</span>
        </button>

        <button
          onClick={() => setActiveSubTab('eway')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === 'eway'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>E-Way Bills</span>
        </button>

        <button
          onClick={() => setActiveSubTab('profit')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === 'profit'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Profit & Margins</span>
        </button>

        <button
          onClick={() => setActiveSubTab('receivables')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === 'receivables'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Receivables & Khata</span>
        </button>

        <button
          onClick={() => setActiveSubTab('gst')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === 'gst'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>GST Returns</span>
        </button>

        <button
          onClick={() => setActiveSubTab('import')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === 'import'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Import Data</span>
        </button>

        <button
          onClick={() => setActiveSubTab('export')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === 'export'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Export Data</span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === 'logs'
              ? 'bg-slate-700 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Activity Logs</span>
        </button>
      </div>

      {/* 3. Tab Body Content */}
      <div className="transition-all">
        {activeSubTab === 'cha' && (
          <CHACustomsPortalPanel />
        )}
        {activeSubTab === 'ports' && (
          <PortsManagementPanel />
        )}
        {activeSubTab === 'licenses' && (
          <DgftLicensesPanel />
        )}
        {activeSubTab === 'fssai_label' && (
          <FssaiLabelGeneratorPanel />
        )}
        {activeSubTab === 'billing' && (
          <SmartBillingPanel
            onOpenEwayBill={() => setActiveSubTab('eway')}
          />
        )}
        {activeSubTab === 'barcode' && (
          <BarcodePreviewPanel />
        )}
        {activeSubTab === 'eway' && (
          <EWayBillPanel />
        )}
        {activeSubTab === 'profit' && (
          <ProfitAnalysisPanel />
        )}
        {activeSubTab === 'receivables' && (
          <ReceivablesPanel />
        )}
        {activeSubTab === 'gst' && (
          <GstSummaryPanel />
        )}
        {activeSubTab === 'exim' && (
          <EximTradePanel />
        )}
        {activeSubTab === 'import' && (
          <DataImportPanel onImportSuccess={loadOverview} />
        )}
        {activeSubTab === 'export' && (
          <DataExportPanel />
        )}
        {activeSubTab === 'logs' && (
          <JobAuditLogsPanel />
        )}
      </div>
    </div>
  );
}
