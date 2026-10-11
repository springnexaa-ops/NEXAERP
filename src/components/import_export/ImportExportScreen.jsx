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
import { EximPartiesPanel } from './EximPartiesPanel';

// Enterprise Tier & RBAC Panels
import { LandedCostEnginePanel } from './LandedCostEnginePanel';
import { ContainerTrackingMatrixPanel } from './ContainerTrackingMatrixPanel';
import { PreFilingChecklistPanel } from './PreFilingChecklistPanel';
import { DocumentManagementDmsPanel } from './DocumentManagementDmsPanel';
import { UserProvisioningAuditPanel } from './UserProvisioningAuditPanel';

import {
  Anchor,
  Award,
  Building2,
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
  Scale,
  Lock
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

  // Strict Administrator Check: Only Admins can switch personas or access system provisioning
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'store_owner';

  // Real Authenticated User Persona
  const userPersona = user?.role === 'cha_agent' ? 'cha_agent'
    : user?.role === 'accountant' ? 'accountant'
    : user?.role === 'logistics' ? 'logistics'
    : 'super_admin';

  // Active Persona State: Non-admins are strictly locked into userPersona
  const [activePersona, setActivePersona] = useState(userPersona);

  useEffect(() => {
    if (!isAdmin) {
      setActivePersona(userPersona);
    }
  }, [isAdmin, userPersona]);

  // Strict Tab Permission Policy
  const isAllowedTab = (tabId) => {
    if (activePersona === 'super_admin') return true;
    if (activePersona === 'cha_agent') {
      return ['checklists', 'cha', 'dms', 'ports', 'licenses', 'parties', 'fssai_label', 'logs'].includes(tabId);
    }
    if (activePersona === 'accountant') {
      return ['landed_cost', 'billing', 'profit', 'receivables', 'gst', 'parties', 'dms', 'checklists', 'ports', 'licenses', 'exim', 'logs'].includes(tabId);
    }
    if (activePersona === 'logistics') {
      return ['containers', 'exim', 'parties', 'eway', 'fssai_label', 'barcode', 'dms', 'ports', 'licenses', 'import', 'export', 'logs'].includes(tabId);
    }
    return false;
  };

  // Initial activeSubTab based on persona
  const [activeSubTab, setActiveSubTab] = useState(() => {
    if (userPersona === 'cha_agent') return 'checklists';
    if (userPersona === 'accountant') return 'landed_cost';
    if (userPersona === 'logistics') return 'containers';
    return 'landed_cost';
  });

  // Guard: Automatically redirect activeSubTab if disallowed for activePersona
  useEffect(() => {
    if (!isAllowedTab(activeSubTab)) {
      if (activePersona === 'cha_agent') setActiveSubTab('checklists');
      else if (activePersona === 'accountant') setActiveSubTab('landed_cost');
      else if (activePersona === 'logistics') setActiveSubTab('containers');
      else setActiveSubTab('landed_cost');
    }
  }, [activePersona, activeSubTab]);

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

  // Handle Persona Switching: STRICTLY ALLOWED FOR ADMIN ONLY
  const handlePersonaChange = (newPersona) => {
    if (!isAdmin) {
      showToast('Strict Security Enforcement: Role switching is strictly prohibited for non-administrators.', 'error');
      return;
    }
    setActivePersona(newPersona);
    if (newPersona === 'cha_agent') {
      setActiveSubTab('checklists');
      showToast('Simulating Customs House Agent (CHA Partner) — Financial Ledgers Stripped', 'info');
    } else if (newPersona === 'accountant') {
      setActiveSubTab('landed_cost');
      showToast('Simulating Accounts Dept — True Landed Cost & FX Ledger Active', 'info');
    } else if (newPersona === 'logistics') {
      setActiveSubTab('containers');
      showToast('Simulating Logistics / Ops — Container Milestone Matrix Active', 'info');
    } else {
      setActiveSubTab('landed_cost');
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

      {/* 2. Access Tier RBAC Status Banner (Admin Switcher vs. Non-Admin Locked View) */}
      {isAdmin ? (
        /* ADMIN SIMULATION & AUDIT SWITCHER (Only allowed for Super Admin / Admin) */
        <div className="bg-slate-950/90 rounded-3xl border border-amber-500/30 p-4 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Crown className="w-4 h-4" />
              </span>
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  Presentation & Access Tier (Admin Persona Switcher)
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Administrator Only
                  </span>
                </span>
                <p className="text-[11px] text-slate-400">
                  Simulate system presentation and verify RBAC security barriers across organizational tiers
                </p>
              </div>
            </div>

            {/* Active Security Policy Pill */}
            {isCha ? (
              <div className="inline-flex items-center space-x-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-3 py-1 rounded-full text-[11px] font-mono font-bold">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>SIMULATING CHA: Financial Ledgers & Margins Stripped</span>
              </div>
            ) : isAccountant ? (
              <div className="inline-flex items-center space-x-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-3 py-1 rounded-full text-[11px] font-mono font-bold">
                <Calculator className="w-3.5 h-3.5" />
                <span>SIMULATING ACCOUNTS: Landed Cost & FX Engine Active</span>
              </div>
            ) : isLogistics ? (
              <div className="inline-flex items-center space-x-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-3 py-1 rounded-full text-[11px] font-mono font-bold">
                <Truck className="w-3.5 h-3.5" />
                <span>SIMULATING LOGISTICS: Milestone Matrix & Demurrage Live</span>
              </div>
            ) : (
              <div className="inline-flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-[11px] font-mono font-bold">
                <Crown className="w-3.5 h-3.5" />
                <span>SUPER ADMIN: System-Wide Configuration & Audits</span>
              </div>
            )}
          </div>

          {/* Persona Select Buttons (Visible ONLY to Admin) */}
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
      ) : (
        /* NON-ADMIN: STRICT ROLE-BASED ACCESS CONTROL (SWITCHER LOCKED) */
        <div className="bg-slate-950/90 rounded-3xl border border-slate-800 p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-lg ${
              isCha
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10'
                : isAccountant
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-indigo-500/10'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-cyan-500/10'
            }`}>
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                  Strict Role-Based Access Control (RBAC)
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Role: {user?.role || 'Assigned Tier'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-1 flex items-center gap-2">
                <span>Assigned Tier:</span>
                <span className="text-sky-400 font-extrabold">
                  {isCha
                    ? 'Customs House Agent (CHA Partner)'
                    : isAccountant
                    ? 'Accounts Department'
                    : isLogistics
                    ? 'Logistics / Operations Department'
                    : (user?.name || 'Authorized User')}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Logged in as <strong>{user?.name || user?.email}</strong>. Persona switching is locked to Administrators only.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {isCha && (
              <div className="inline-flex items-center space-x-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3.5 py-2 rounded-2xl text-xs font-mono font-bold">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>RBAC BARRIER: Financial Ledgers & Margins Stripped</span>
              </div>
            )}
            {isAccountant && (
              <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-3.5 py-2 rounded-2xl text-xs font-mono font-bold">
                <Calculator className="w-4 h-4 text-indigo-400" />
                <span>ACCOUNTS PRIVILEGE: True Landed Cost & FX Active</span>
              </div>
            )}
            {isLogistics && (
              <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-3.5 py-2 rounded-2xl text-xs font-mono font-bold">
                <Truck className="w-4 h-4 text-cyan-400" />
                <span>LOGISTICS PRIVILEGE: Container Matrix Live</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Navigation Tabs Filtered by Persona RBAC Protocol */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto select-none no-scrollbar">
        {/* TAB 1: True Landed Cost Engine */}
        {isAllowedTab('landed_cost') && (
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

        {/* TAB 2: Container Tracking & Demurrage Matrix */}
        {isAllowedTab('containers') && (
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

        {/* TAB 3: Pre-Filing Checklist Verification */}
        {isAllowedTab('checklists') && (
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
        )}

        {/* TAB 4: Secure Document Management System (DMS) */}
        {isAllowedTab('dms') && (
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
        )}

        {/* TAB 5: CHA Customs Portal */}
        {isAllowedTab('cha') && (
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
        )}

        {/* TAB 6: Customs Ports & ICDs Directory */}
        {isAllowedTab('ports') && (
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
        )}

        {/* TAB 7: DGFT, RCMC & FSSAI Licenses */}
        {isAllowedTab('licenses') && (
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
        )}

        {/* TAB 8: Trade Parties Directory (Giver / Receiver / Another Party) */}
        {isAllowedTab('parties') && (
          <button
            onClick={() => setActiveSubTab('parties')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === 'parties'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-4 h-4 text-amber-300" />
            <span>Trade Parties (Giver / Receiver)</span>
          </button>
        )}

        {/* TAB 9: FSSAI Label Studio */}
        {isAllowedTab('fssai_label') && (
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
        )}

        {/* TAB 10: Shipments & Logistics */}
        {isAllowedTab('exim') && (
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
        )}

        {/* TAB 11: Invoices & Billing */}
        {isAllowedTab('billing') && (
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
        )}

        {/* TAB 12: Barcode Labels */}
        {isAllowedTab('barcode') && (
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
        )}

        {/* TAB 13: E-Way Bills */}
        {isAllowedTab('eway') && (
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
        )}

        {/* TAB 14: Profit & Margins */}
        {isAllowedTab('profit') && (
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
        )}

        {/* TAB 15: Receivables & Khata */}
        {isAllowedTab('receivables') && (
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
        )}

        {/* TAB 16: GST Returns */}
        {isAllowedTab('gst') && (
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
        )}

        {/* TAB 17: Import Data */}
        {isAllowedTab('import') && (
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
        )}

        {/* TAB 18: Export Data */}
        {isAllowedTab('export') && (
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
        )}

        {/* Super Admin Only Tab: User Access & Audit Logs */}
        {isAllowedTab('users_audit') && isSuperAdmin && isAdmin && (
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

        {/* TAB 19: Activity Logs */}
        {isAllowedTab('logs') && (
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
        )}
      </div>

      {/* 4. Tab Body Content */}
      <div className="transition-all">
        {/* Landed Cost Engine */}
        {activeSubTab === 'landed_cost' && isAllowedTab('landed_cost') && (
          <LandedCostEnginePanel activePersona={activePersona} />
        )}

        {/* Container Milestone Matrix */}
        {activeSubTab === 'containers' && isAllowedTab('containers') && (
          <ContainerTrackingMatrixPanel />
        )}

        {/* Pre-Filing Checklists */}
        {activeSubTab === 'checklists' && isAllowedTab('checklists') && (
          <PreFilingChecklistPanel activePersona={activePersona} />
        )}

        {/* DMS Documents */}
        {activeSubTab === 'dms' && isAllowedTab('dms') && (
          <DocumentManagementDmsPanel activePersona={activePersona} />
        )}

        {/* User Provisioning & RBAC */}
        {activeSubTab === 'users_audit' && isAllowedTab('users_audit') && isAdmin && isSuperAdmin && (
          <UserProvisioningAuditPanel />
        )}

        {/* CHA Customs Portal */}
        {activeSubTab === 'cha' && isAllowedTab('cha') && (
          <CHACustomsPortalPanel />
        )}

        {/* Ports Management */}
        {activeSubTab === 'ports' && isAllowedTab('ports') && (
          <PortsManagementPanel />
        )}

        {/* DGFT & Licenses */}
        {activeSubTab === 'licenses' && isAllowedTab('licenses') && (
          <DgftLicensesPanel />
        )}

        {/* Trade Parties Directory (Foreign & Indian Givers / Receivers / Another Party) */}
        {activeSubTab === 'parties' && isAllowedTab('parties') && (
          <EximPartiesPanel />
        )}

        {/* FSSAI Label Generator */}
        {activeSubTab === 'fssai_label' && isAllowedTab('fssai_label') && (
          <FssaiLabelGeneratorPanel />
        )}

        {/* Smart Billing */}
        {activeSubTab === 'billing' && isAllowedTab('billing') && (
          <SmartBillingPanel
            onOpenEwayBill={() => setActiveSubTab('eway')}
          />
        )}

        {/* Barcode Preview */}
        {activeSubTab === 'barcode' && isAllowedTab('barcode') && (
          <BarcodePreviewPanel />
        )}

        {/* E-Way Bill */}
        {activeSubTab === 'eway' && isAllowedTab('eway') && (
          <EWayBillPanel />
        )}

        {/* Profit Analysis */}
        {activeSubTab === 'profit' && isAllowedTab('profit') && (
          <ProfitAnalysisPanel />
        )}

        {/* Receivables */}
        {activeSubTab === 'receivables' && isAllowedTab('receivables') && (
          <ReceivablesPanel />
        )}

        {/* GST Summary */}
        {activeSubTab === 'gst' && isAllowedTab('gst') && (
          <GstSummaryPanel />
        )}

        {/* Exim Shipments */}
        {activeSubTab === 'exim' && isAllowedTab('exim') && (
          <EximTradePanel />
        )}

        {/* Import Data */}
        {activeSubTab === 'import' && isAllowedTab('import') && (
          <DataImportPanel onImportSuccess={loadOverview} />
        )}

        {/* Export Data */}
        {activeSubTab === 'export' && isAllowedTab('export') && (
          <DataExportPanel />
        )}

        {/* Job Audit Logs */}
        {activeSubTab === 'logs' && isAllowedTab('logs') && (
          <JobAuditLogsPanel />
        )}

        {/* Unauthorized Tab Guard Fallback */}
        {!isAllowedTab(activeSubTab) && (
          <div className="bg-rose-950/40 border border-rose-500/30 rounded-3xl p-8 text-center text-rose-300">
            <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">RBAC Access Restricted</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
              Your role ({user?.role || 'authorized user'}) is not permitted to view this module.
              Access to this tier is governed by Enterprise RBAC policies.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
