import React from 'react';
import { useApp } from '../context/AppContext';
import {
  ShoppingCart,
  Boxes,
  BookOpen,
  Truck,
  AlertTriangle,
  BarChart3,
  Settings,
  Sparkles,
  PieChart,
  Users,
  RotateCcw,
  ClipboardCheck,
  Gift,
  FlaskConical,
  Store,
  Tag,
  Receipt,
  ShieldCheck,
  Lock,
  FileText,
  KeyRound,
  ArrowLeftRight,
  Pill,
  Globe,
  Building2,
  Anchor,
  Award
} from 'lucide-react';

export function Sidebar({ activeTab, setActiveTab }) {
  const {
    vertical,
    currentTenant,
    isSuperAdminView,
    setIsSuperAdminView,
    user,
    superAdminTab,
    setSuperAdminTab,
    tenants,
    setIsAuditModalOpen,
    setIsIsolationModalOpen
  } = useApp();

  const isSuperAdmin = user?.role === 'super_admin';

  // 1. Super Admin Navigation (Tenant data restricted)
  if (isSuperAdmin) {
    const superAdminModules = [
      {
        id: 'stores',
        label: 'Store Directory & Passwords',
        shortcut: 'F1',
        icon: Store,
        color: 'text-sky-400',
        badge: `${tenants.length} Stores`
      },
      {
        id: 'plans',
        label: 'Rate Plans & Limits',
        shortcut: 'F2',
        icon: Tag,
        color: 'text-purple-400'
      },
      {
        id: 'billing',
        label: 'SaaS Invoices & Billings',
        shortcut: 'F3',
        icon: Receipt,
        color: 'text-emerald-400'
      },
      {
        id: 'privacy',
        label: 'Privacy & Security',
        shortcut: 'F4',
        icon: ShieldCheck,
        color: 'text-indigo-400',
        badge: 'Enforced'
      }
    ];

    return (
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-2.5 select-none shrink-0 h-[calc(100vh-53px)] overflow-hidden">
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Header Console Badge */}
          <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                Super Admin Console
              </span>
            </div>
            <p className="text-xs text-white font-bold mt-1">
              Platform Administration
            </p>
            <p className="text-[10px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400 inline" />
              Tenant Privacy Enforced
            </p>
          </div>

          {/* Super Admin Platform Modules */}
          <div>
            <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Management Modules
            </div>
            <div className="space-y-1 mt-1">
              {superAdminModules.map(item => {
                const Icon = item.icon;
                const isActive = superAdminTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setIsSuperAdminView(true);
                      setSuperAdminTab(item.id);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-600/20 font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.color}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0 ml-1">
                      {item.badge && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      {item.shortcut && (
                        <kbd className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${
                          isActive
                            ? 'bg-white/10 text-white border-white/20'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}>
                          {item.shortcut}
                        </kbd>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Security & Isolation Dialogs */}
          <div>
            <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Security & Isolation
            </div>
            <div className="space-y-1 mt-1">
              <button
                onClick={() => setIsAuditModalOpen(true)}
                className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900/80 transition-all"
              >
                <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Security Audit Trail</span>
              </button>

              <button
                onClick={() => setIsIsolationModalOpen(true)}
                className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900/80 transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tenant Isolation & Quotas</span>
              </button>
            </div>
          </div>
        </div>

        {/* Super Admin Bottom Status Card */}
        <div className="pt-2 border-t border-slate-800/80 shrink-0">
          <div className="p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-[11px]">
              <Lock className="w-3.5 h-3.5" />
              <span>Tenant Privacy Enforced</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Tenant operational data (invoices, customers, inventory, and ledgers) is restricted to each tenant's workspace.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  // 2. ISOLATED DEDICATED STORE ERP EDITIONS (Strict Separation)
  const normVertical = (vertical || currentTenant?.business_type || 'pharma').toLowerCase();
  const isPharmaERP = normVertical === 'pharma';
  const isImpoExpoERP = normVertical === 'impoexpo' || normVertical === 'exim';
  const isLMISERP = normVertical === 'lmis' || normVertical === 'lab';
  const isGeneralERP = !isPharmaERP && !isImpoExpoERP && !isLMISERP;

  let erpEditionInfo = {
    title: 'Pharma ERP Edition',
    subtitle: 'Pharmacy Retail & Rx Dispensing',
    tag: 'Schedule H1 & FEFO Expiry',
    icon: Pill,
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  };

  let erpCoreModules = [];
  let erpOperationModules = [];

  if (isPharmaERP) {
    erpEditionInfo = {
      title: 'Pharma ERP Edition',
      subtitle: 'Pharmacy Retail & Rx Dispensing',
      tag: 'Schedule H1 & FEFO Expiry',
      icon: Pill,
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    };
    erpCoreModules = [
      { id: 'pos', label: 'Counter POS & Rx', shortcut: 'F1', icon: ShoppingCart, color: 'text-sky-400' },
      { id: 'inventory', label: 'Medicine Stock & Batches', shortcut: 'F2', icon: Boxes, color: 'text-emerald-400' },
      { id: 'expiry', label: 'FEFO Expiry & Drug Register', shortcut: 'F5', icon: AlertTriangle, color: 'text-rose-400', badge: 'FEFO' },
      { id: 'purchases', label: 'Distributor Purchases', shortcut: 'F4', icon: Truck, color: 'text-indigo-400' },
      { id: 'khata', label: 'Patient Khata (Udhar)', shortcut: 'F3', icon: BookOpen, color: 'text-amber-400' }
    ];
    erpOperationModules = [
      { id: 'returns', label: 'Distributor Claims & Returns', shortcut: 'Claims', icon: RotateCcw, color: 'text-rose-400' },
      { id: 'accounting', label: 'Pharmacy P&L & Accounts', shortcut: 'F9', icon: PieChart, color: 'text-emerald-400' },
      { id: 'users', label: 'Organization Users & Team', shortcut: 'F8', icon: Users, color: 'text-pink-400' },
      { id: 'reports', label: 'Reports & Day Closing', shortcut: 'F6', icon: BarChart3, color: 'text-teal-400' },
      { id: 'settings', label: 'Pharmacy Profile & DL', shortcut: 'F7', icon: Settings, color: 'text-slate-400' }
    ];
  } else if (isImpoExpoERP) {
    erpEditionInfo = {
      title: 'ImpoExpo Trade ERP',
      subtitle: 'Global Trade & Invoicing',
      tag: 'CHA • DGFT • IEC • B/L',
      icon: Globe,
      badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20'
    };
    erpCoreModules = [
      { id: 'import_export', label: 'CHA Customs & DGFT Hub', shortcut: 'F1', icon: Anchor, color: 'text-sky-400', badge: 'CHA' },
      { id: 'purchases', label: 'Procurement & Overseas Vendors', shortcut: 'F4', icon: Truck, color: 'text-indigo-400' }
    ];
    erpOperationModules = [
      { id: 'accounting', label: 'Trade P&L & Forex Ledger', shortcut: 'F9', icon: PieChart, color: 'text-emerald-400' },
      { id: 'reports', label: 'e-BRC & Customs Realisation', shortcut: 'F6', icon: BarChart3, color: 'text-teal-400' },
      { id: 'users', label: 'Organization Team & CHA Access', shortcut: 'F8', icon: Users, color: 'text-sky-400' },
      { id: 'settings', label: 'DGFT Profile & IEC Settings', shortcut: 'F7', icon: Settings, color: 'text-slate-400' }
    ];
  } else if (isLMISERP) {
    erpEditionInfo = {
      title: 'LMIS Diagnostic ERP',
      subtitle: 'Clinical Pathology & Laboratory',
      tag: 'Requisitions & NABL Reports',
      icon: FlaskConical,
      badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    };
    erpCoreModules = [
      { id: 'lab', label: 'Lab Orders & Requisitions', shortcut: 'F1', icon: FlaskConical, color: 'text-cyan-400', badge: 'MIS' },
      { id: 'accounting', label: 'Reagents & Lab Expenses', shortcut: 'F9', icon: PieChart, color: 'text-emerald-400' }
    ];
    erpOperationModules = [
      { id: 'hrm', label: 'Lab Technicians & Phlebotomists', shortcut: 'F10', icon: Users, color: 'text-indigo-400' },
      { id: 'users', label: 'Organization Users & Team', shortcut: 'F8', icon: Users, color: 'text-cyan-400' },
      { id: 'reports', label: 'Diagnostic Reports & Register', shortcut: 'F6', icon: BarChart3, color: 'text-teal-400' },
      { id: 'settings', label: 'Lab Profile & NABL Settings', shortcut: 'F7', icon: Settings, color: 'text-slate-400' }
    ];
  } else {
    // General ERP (Retail, FMCG, Supermarket, Provision)
    erpEditionInfo = {
      title: 'General Retail ERP',
      subtitle: 'Supermarket & FMCG Store',
      tag: 'Fast POS, Weighing & Udhar',
      icon: ShoppingCart,
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    };
    erpCoreModules = [
      { id: 'pos', label: 'Counter POS & Barcode', shortcut: 'F1', icon: ShoppingCart, color: 'text-sky-400' },
      { id: 'inventory', label: 'Store Inventory & Stock', shortcut: 'F2', icon: Boxes, color: 'text-emerald-400' },
      { id: 'khata', label: 'Customer Khata (Udhar)', shortcut: 'F3', icon: BookOpen, color: 'text-amber-400' },
      { id: 'purchases', label: 'Vendor Purchases & Inwards', shortcut: 'F4', icon: Truck, color: 'text-indigo-400' }
    ];
    erpOperationModules = [
      { id: 'hrm', label: 'HRM & Staff Payroll', shortcut: 'F10', icon: Users, color: 'text-indigo-400' },
      { id: 'adjustments', label: 'Stock Audit & Damage', shortcut: 'Audit', icon: ClipboardCheck, color: 'text-amber-400' },
      { id: 'promotions', label: 'Coupons & Loyalty', shortcut: 'Promo', icon: Gift, color: 'text-purple-400' },
      { id: 'accounting', label: 'P&L & Store Expenses', shortcut: 'F9', icon: PieChart, color: 'text-emerald-400' },
      { id: 'users', label: 'Organization Users & Team', shortcut: 'F8', icon: Users, color: 'text-amber-400' },
      { id: 'reports', label: 'Reports & Day Closing', shortcut: 'F6', icon: BarChart3, color: 'text-teal-400' },
      { id: 'settings', label: 'Store Settings & Profile', shortcut: 'F7', icon: Settings, color: 'text-slate-400' }
    ];
  }

  const renderModuleButton = (item) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => {
          setIsSuperAdminView(false);
          setActiveTab(item.id);
        }}
        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
          isActive
            ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-600/20 font-semibold'
            : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
        }`}
      >
        <div className="flex items-center space-x-2.5 truncate">
          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.color}`} />
          <span className="truncate">{item.label}</span>
        </div>
        <div className="flex items-center space-x-1 shrink-0 ml-1">
          {item.badge && (
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
              isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}>
              {item.badge}
            </span>
          )}
          {item.shortcut && (
            <kbd className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${
              isActive
                ? 'bg-white/10 text-white border-white/20'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}>
              {item.shortcut}
            </kbd>
          )}
        </div>
      </button>
    );
  };

  const HeaderIcon = erpEditionInfo.icon;

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-2.5 select-none shrink-0 h-[calc(100vh-53px)] overflow-hidden">
      {/* Scrollable Navigation Sections */}
      <div className="space-y-3 overflow-y-auto pr-1 flex-1">
        {/* Dedicated ERP Edition Header Badge */}
        <div className="p-3 bg-gradient-to-r from-slate-900 to-slate-950 rounded-2xl border border-slate-800">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-lg border ${erpEditionInfo.badgeColor}`}>
              <HeaderIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 block leading-tight">
                {erpEditionInfo.title}
              </span>
              <span className="text-[9px] text-slate-500 font-mono block leading-none mt-0.5">
                {erpEditionInfo.tag}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-300 font-semibold mt-2 truncate">
            {currentTenant ? currentTenant.name : 'Dedicated Store Workspace'}
          </p>
        </div>

        {/* Core Modules for this ERP */}
        <div>
          <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
            <span>Primary Operations</span>
            {currentTenant && (
              <span className="text-[9px] text-sky-400 font-mono">
                Store #{currentTenant.id}
              </span>
            )}
          </div>
          <div className="space-y-1 mt-1">
            {erpCoreModules.map(renderModuleButton)}
          </div>
        </div>

        {/* Enterprise Operations for this ERP */}
        <div>
          <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
            <span>Management & Registers</span>
            <span className="text-[9px] text-emerald-400 font-mono">Dedicated</span>
          </div>
          <div className="space-y-1 mt-1">
            {erpOperationModules.map(renderModuleButton)}
          </div>
        </div>
      </div>

      {/* Store Tenant Identity in Bottom Sidebar */}
      {currentTenant && (
        <div className="pt-2 border-t border-slate-800/80 shrink-0">
          <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/80 text-[11px]">
            <div className="flex items-center justify-between text-slate-400">
              <span className="truncate font-semibold text-slate-200">{currentTenant.name}</span>
              <span className="text-[10px] uppercase font-bold text-sky-400">{currentTenant.plan}</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5 flex items-center justify-between">
              <span>Active Workspace</span>
              <span className="uppercase text-[9px] text-slate-400 font-bold">{normVertical}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
