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

// Enterprise Tier & RBAC Panels
import { LandedCostEnginePanel } from './LandedCostEnginePanel';
import { ContainerTrackingMatrixPanel } from './ContainerTrackingMatrixPanel';
import { PreFilingChecklistPanel } from './PreFilingChecklistPanel';
import { DocumentManagementDmsPanel } from './DocumentManagementDmsPanel';
import { UserProvisioningAuditPanel } from './UserProvisioningAuditPanel';

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
  Utensils,
  Calculator,
  FolderOpen,
  Users,
  Crown,
  ShieldAlert,
  Sliders,
  Scale
} from 'lucide-react';

const PERSONAS = [
  {
    id: 'super_admin',
    label: 'Super Admin',
    subtext: 'Management & Overrides',
    icon: Crown,
    color: 'from-amber-500 to-orange-600',
    ring: 'border-amber-500 text-amber-400 bg-amber-500/10'
  },
  {
    id: 'accountant',
    label: 'Accounts Dept',
    subtext: 'True Landed Cost & FX',
    icon: Calculator,
    color: 'from-indigo-500 to-sky-600',
    ring: 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
  },
  {
    id: 'logistics',
    label: 'Logistics / Ops',
    subtext: 'Containers & Demurrage',
    icon: Truck,
    color: 'from-cyan-500 to-blue-600',
    ring: 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
  },
  {
    id: 'cha_agent',
    label: 'Customs House Agent',
    subtext: 'CHA Partner (Masked)',
    icon: Anchor,
    color: 'from-emerald-500 to-teal-600',
    ring: 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
  }
];

export function ImportExportScreen() {
  const { currentTenant, currencySymbol, showToast, user } = useApp();

  // Active Persona State for RBAC Simulation
  const [activePersona, setActivePersona] = useState(() => {
    if (user?.role === 'cha_agent') return 'cha_agent';
    if (user?.role === 'accountant') return 'accountant';
    if (user?.role === 'logistics') return 'logistics';
    return 'super_admin';
  });

  // Default to Landed Cost or Containers or CHA portal based on persona
  const [activeSubTab, setActiveSubTab] = useState(() => {
    if (user?.role === 'cha_agent') return 'checklists';
    if (user?.role === 'accountant') return 'landed_cost';
    if (user?.role === 'logistics') return 'containers';
    return 'landed_cost';
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

  // Handle Persona Switching with automatic tab adjustment
  const handlePersonaChange = (newPersona) => {
    setActivePersona(newPersona);
    if (newPersona === 'cha_agent') {
      const allowedChaTabs = ['checklists', 'cha', 'dms', 'ports', 'licenses', 'fssai_label'];
      if (!allowedChaTabs.includes(activeSubTab)) {
        setActiveSubTab('checklists');
      }
      showToast('Switched to Customs House Agent (CHA Partner) — Financial Ledgers Stripped', 'info');
    } else if (newPersona === 'accountant') {
      const allowedAccountsTabs = ['landed_cost', 'billing', 'profit', 'receivables', 'gst', 'dms', 'checklists', 'ports'];
      if (!allowedAccountsTabs.includes(activeSubTab)) {
        setActiveSubTab('landed_cost');
      }
      showToast('Switched to Accounts Dept — True Landed Cost & FX Ledger Active', 'info');
    } else if (newPersona === 'logistics') {
      const allowedLogisticsTabs = ['containers', 'exim', 'eway', 'fssai_label', 'barcode', 'dms', 'ports', 'import', 'export'];
      if (!allowedLogisticsTabs.includes(activeSubTab)) {
        setActiveSubTab('containers');
      }
      showToast('Switched to Logistics / Ops — Container Milestone Matrix & Demurrage Active', 'info');
    } else {
      showToast('Switched to Super Admin — Full Platform Access Granted', 'success');
    }
  };

  const isCha = activePersona === 'cha_agent';
  const isAccountant = activePersona === 'accountant';
  const isLogistics = activePersona === 'logistics';
  const isSuperAdmin = activePersona === 'super_admin';

  return (
    <div className="flex-1 overflow-y-auto bg-slate-900 text-slate-100 p-4 md:p-6 space-y-6">
      {/* 1. Top Header Banner with 3-Tier Identity */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-sky-600/30">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/20">
                Enterprise EXIM ERP
              </span>
              <span className="text-[11px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                3-Tier Presentation & RBAC
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1 tracking-tight">
              Import / Export & Customs Logistics Management
            </h1>
            <p className="text-xs text-slate-400">
              True landed cost engine, container milestone tracking, pre-filing checklists, and secure DMS
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

      {/* 2. Interactive RBAC Persona Switcher (Presentation & Access Tier) */}
      <div className="bg-slate-950/90 rounded-3xl border border-slate-800 p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-2.5">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Presentation & Access Tier (RBAC Persona Switcher)
            </span>
          </div>

          {/* Active Security Policy Pill */}
          {isCha ? (
            <div className="inline-flex items-center space-x-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-3 py-1 rounded-full text-[11px] font-mono font-bold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>RBAC BARRIER: Financial Ledgers & Margins Stripped</span>
            </div>
          ) : isAccountant ? (
            <div className="inline-flex items-center space-x-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-3 py-1 rounded-full text-[11px] font-mono font-bold">
              <Calculator className="w-3.5 h-3.5" />
              <span>ACCOUNTS PRIVILEGE: Landed Cost & FX Engine Active</span>
            </div>
          ) : isLogistics ? (
            <div className="inline-flex items-center space-x-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-3 py-1 rounded-full text-[11px] font-mono font-bold">
              <Truck className="w-3.5 h-3.5" />
              <span>LOGISTICS PRIVILEGE: Milestone Matrix & Demurrage Live</span>
            </div>
          ) : (
            <div className="inline-flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-[11px] font-mono font-bold">
              <Crown className="w-3.5 h-3.5" />
              <span>SUPER ADMIN: System-Wide Configuration & Audits</span>
            </div>
          )}
        </div>

        {/* Persona Select Buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PERSONAS.map(p => {
            const Icon = p.icon;
            const isSelected = activePersona === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handlePersonaChange(p.id)}
                className={`p-3 rounded-2xl border text-left transition flex items-center space-x-3 ${
                  isSelected
                    ? `${p.ring} shadow-lg ring-1`
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-white/10' : 'bg-slate-800'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="font-bold text-xs truncate text-white">{p.label}</div>
                  <div className="text-[10px] text-slate-400 truncate">{p.subtext}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Navigation Tabs Filtered by Persona RBAC Protocol */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto select-none no-scrollbar">
        {/* TAB 1: True Landed Cost Engine (Accounts & Super Admin only) */}
        {!isCha && (
          <button
            onClick={() => setActiveSubTab('landed_cost')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === 'landed_cost'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Scale className="w-4 h-4 text-sky-300" />
            <span>True Landed Cost Engine</span>
          </button>
        )}

        {/* TAB 2: Container Tracking & Demurrage Matrix (Logistics & Super Admin) */}
        {!isCha && (
          <button
            onClick={() => setActiveSubTab('containers')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === 'containers'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Boxes className="w-4 h-4 text-cyan-300" />
            <span>Container Matrix & Demurrage</span>
          </button>
        )}

        {/* TAB 3: Pre-Filing Checklist Verification (CHA & Super Admin & Accounts) */}
        <button
          onClick={() => setActiveSubTab('checklists')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === 'checklists'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-emerald-300" />
          <span>Pre-Filing Checklists</span>
        </button>

        {/* TAB 4: Secure Document Management System (DMS) */}
        <button
          onClick={() => setActiveSubTab('dms')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === 'dms'
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FolderOpen className="w-4 h-4 text-blue-300" />
          <span>DMS Document Vault</span>
        </button>

        {/* TAB 5: CHA Customs Portal */}
        <button
          onClick={() => setActiveSubTab('cha')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeSubTab === 'cha'
              ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Anchor className="w-4 h-4 text-sky-300" />
          <span>CHA Customs Clearance Desk</span>
        </button>

        {/* TAB 6: Customs Ports & ICDs Directory */}
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

        {/* TAB 7: DGFT, RCMC & FSSAI Licenses */}
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

        {/* TAB 8: FSSAI Label Studio */}
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

        {/* Financial & Logistics Tabs (Hidden from external CHA) */}
        {!isCha && (
          <>
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
          </>
        )}

        {/* Super Admin Only Tab: User Access & Audit Logs */}
        {isSuperAdmin && (
          <button
            onClick={() => setActiveSubTab('users_audit')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === 'users_audit'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4 text-purple-300" />
            <span>User Provisioning & RBAC</span>
          </button>
        )}

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

      {/* 4. Tab Body Content */}
      <div className="transition-all">
        {/* Landed Cost Engine */}
        {activeSubTab === 'landed_cost' && (
          <LandedCostEnginePanel activePersona={activePersona} />
        )}

        {/* Container Milestone Matrix */}
        {activeSubTab === 'containers' && (
          <ContainerTrackingMatrixPanel />
        )}

        {/* Pre-Filing Checklists */}
        {activeSubTab === 'checklists' && (
          <PreFilingChecklistPanel activePersona={activePersona} />
        )}

        {/* DMS Documents */}
        {activeSubTab === 'dms' && (
          <DocumentManagementDmsPanel activePersona={activePersona} />
        )}

        {/* User Provisioning & RBAC */}
        {activeSubTab === 'users_audit' && (
          <UserProvisioningAuditPanel />
        )}

        {/* CHA Customs Portal */}
        {activeSubTab === 'cha' && (
          <CHACustomsPortalPanel />
        )}

        {/* Ports Management */}
        {activeSubTab === 'ports' && (
          <PortsManagementPanel />
        )}

        {/* DGFT & Licenses */}
        {activeSubTab === 'licenses' && (
          <DgftLicensesPanel />
        )}

        {/* FSSAI Label Generator */}
        {activeSubTab === 'fssai_label' && (
          <FssaiLabelGeneratorPanel />
        )}

        {/* Smart Billing */}
        {activeSubTab === 'billing' && !isCha && (
          <SmartBillingPanel
            onOpenEwayBill={() => setActiveSubTab('eway')}
          />
        )}

        {/* Barcode Preview */}
        {activeSubTab === 'barcode' && !isCha && (
          <BarcodePreviewPanel />
        )}

        {/* E-Way Bill */}
        {activeSubTab === 'eway' && !isCha && (
          <EWayBillPanel />
        )}

        {/* Profit Analysis */}
        {activeSubTab === 'profit' && !isCha && (
          <ProfitAnalysisPanel />
        )}

        {/* Receivables */}
        {activeSubTab === 'receivables' && !isCha && (
          <ReceivablesPanel />
        )}

        {/* GST Summary */}
        {activeSubTab === 'gst' && !isCha && (
          <GstSummaryPanel />
        )}

        {/* Exim Shipments */}
        {activeSubTab === 'exim' && !isCha && (
          <EximTradePanel />
        )}

        {/* Import Data */}
        {activeSubTab === 'import' && !isCha && (
          <DataImportPanel onImportSuccess={loadOverview} />
        )}

        {/* Export Data */}
        {activeSubTab === 'export' && !isCha && (
          <DataExportPanel />
        )}

        {/* Job Audit Logs */}
        {activeSubTab === 'logs' && (
          <JobAuditLogsPanel />
        )}
      </div>
    </div>
  );
}
