import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  ChevronDown,
  Sparkles,
  Clock,
  Pill,
  ShoppingBag,
  ShieldCheck,
  Lock,
  LogOut,
  User,
  KeyRound,
  FileText,
  Check,
  FlaskConical,
  Globe,
  ShoppingCart,
  ArrowLeftRight,
  Palette
} from 'lucide-react';

export function Navbar({ activeTab, setActiveTab }) {
  const {
    tenants,
    currentTenant,
    switchTenant,
    isSuperAdminView,
    setIsSuperAdminView,
    vertical,
    switchERP,
    normalizeVertical,
    heldBillsCount,
    user,
    logout,
    setIsTerminalLocked,
    setIsLoginModalOpen,
    setIsAuditModalOpen,
    setIsIsolationModalOpen,
    bgTheme,
    changeBgTheme,
    showToast
  } = useApp();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTenantDropdownOpen, setIsTenantDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isErpDropdownOpen, setIsErpDropdownOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);

  const themeOptions = [
    {
      id: 'sky-radiant',
      label: 'Radiant Sky Blue (Default)',
      desc: 'Ambient luminous sky blue with glassmorphism',
      dotColor: 'bg-sky-400 ring-2 ring-sky-300 shadow-sm shadow-sky-400'
    },
    {
      id: 'sky-deep',
      label: 'Deep Ocean Sky',
      desc: 'High-contrast vibrant azure blue gradient',
      dotColor: 'bg-sky-700 ring-1 ring-sky-500'
    },
    {
      id: 'sky-light',
      label: 'Sky Blue Daylight',
      desc: 'Clean executive light sky blue theme',
      dotColor: 'bg-sky-200 ring-2 ring-sky-400'
    },
    {
      id: 'midnight-slate',
      label: 'Midnight Slate',
      desc: 'Classic deep dark slate interface',
      dotColor: 'bg-slate-800 ring-1 ring-slate-600'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const normVertical = (vertical || currentTenant?.business_type || 'pharma').toLowerCase();
  const erpOptions = [
    {
      id: 'pharma',
      title: 'Pharma ERP',
      desc: 'Prescription dispensing, Salt substitutes & FEFO Expiry register',
      icon: Pill,
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      tenantName: 'Sanjeevani Medicos'
    },
    {
      id: 'impoexpo',
      title: 'ImpoExpo ERP',
      desc: 'Global EXIM shipments, Incoterms CIF/FOB, B/L & Customs duties',
      icon: Globe,
      badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      tenantName: 'TransGlobal Cargo'
    },
    {
      id: 'lmis',
      title: 'LMIS Diagnostic ERP',
      desc: 'Patient pathology requisitions, sample tubes & NABL verification',
      icon: FlaskConical,
      badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      tenantName: 'Apex Diagnostic Labs'
    },
    {
      id: 'general',
      title: 'General Retail ERP',
      desc: 'Fast barcode POS, loose weighing items, staff payroll & Khata',
      icon: ShoppingCart,
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      tenantName: 'Laxmi Superstore'
    }
  ];

  const currentErpMeta = erpOptions.find(e => e.id === normVertical) || (
    normVertical === 'lab' ? erpOptions[2] : normVertical === 'kiryana' ? erpOptions[3] : erpOptions[0]
  );
  const CurrentErpIcon = currentErpMeta.icon;

  const getRoleBadge = (role) => {
    if (role === 'super_admin') {
      return { label: 'SUPER ADMIN', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    } else if (role === 'tenant_admin') {
      return { label: 'STORE OWNER', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    } else {
      return { label: 'CASHIER', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
    }
  };

  const roleInfo = getRoleBadge(user?.role || 'cashier');
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <header className="bg-slate-950 border-b border-slate-800 text-slate-100 px-4 py-2.5 flex items-center justify-between shadow-lg select-none sticky top-0 z-40">
      {/* Brand & SpringNexa SaaS Identity */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
          N
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-sm tracking-tight text-white leading-tight">
              Nexa ERP
            </h1>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-800 text-slate-300 border border-slate-700">
              Enterprise
            </span>
          </div>
        </div>
      </div>

      {/* Center: Tenant Workspace Switcher */}
      <div className="flex items-center space-x-2">
        <div className="relative">
          <button
            onClick={() => setIsTenantDropdownOpen(!isTenantDropdownOpen)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isSuperAdmin
                ? 'bg-slate-900 border-slate-700 text-indigo-300'
                : 'bg-slate-900 border-slate-700/80 hover:border-slate-600 text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <div className="text-left">
              <span className="block text-[10px] text-slate-400 font-normal leading-none">
                {isSuperAdmin ? 'Platform Console' : 'Active Organization'}
              </span>
              <span className="font-bold text-xs leading-tight">
                {isSuperAdmin ? 'Super Admin' : (currentTenant?.name || 'Select Store')}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {isTenantDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-1.5 z-50 divide-y divide-slate-800 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>{isSuperAdmin ? 'Platform Scope' : 'Current Workspace'}</span>
                <span className="text-[9px] text-emerald-400 font-mono">ENFORCED</span>
              </div>

              {isSuperAdmin ? (
                <div className="p-3 space-y-2.5">
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Tenant Data Privacy</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Super Admin is restricted to infrastructure, subscription billing, and user management. Tenant operational records remain private.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setIsSuperAdminView(true);
                      setIsTenantDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                      isSuperAdminView
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-800 hover:bg-slate-700 text-indigo-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-400" />
                      <span>Platform Admin Dashboard</span>
                    </div>
                    {isSuperAdminView && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>

                  <button
                    onClick={() => {
                      setIsIsolationModalOpen(true);
                      setIsTenantDropdownOpen(false);
                    }}
                    className="w-full text-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>View Tenant Isolation Policy</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{currentTenant?.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Organization #{currentTenant?.id} • Plan: <strong className="text-slate-300">{currentTenant?.plan?.toUpperCase()}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsIsolationModalOpen(true);
                      setIsTenantDropdownOpen(false);
                    }}
                    className="w-full text-center px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Security & Plan Quotas</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tenant Scope Badge */}
        <button
          onClick={() => setIsIsolationModalOpen(true)}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition"
          title={isSuperAdmin ? "Platform Scope" : "Current Organization"}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline text-[11px]">
            {isSuperAdmin ? 'Platform Scope' : (currentTenant?.name || 'Workspace')}
          </span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
            {isSuperAdmin ? 'Admin' : `#${currentTenant?.id || '1'}`}
          </span>
        </button>

        {/* Active Dedicated ERP Edition Badge (Locked & Isolated to Organization) */}
        {!isSuperAdmin && (
          <div
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs select-none shadow-sm"
            title={`Workspace locked strictly to ${currentErpMeta.title}`}
          >
            <div className={`p-1 rounded-lg border ${currentErpMeta.badgeColor}`}>
              <CurrentErpIcon className="w-3.5 h-3.5" />
            </div>
            <div className="text-left hidden lg:block">
              <span className="block text-[8px] text-slate-400 uppercase font-black tracking-wider leading-none">ERP Edition</span>
              <span className="font-bold text-[11px] text-white leading-tight">{currentErpMeta.title}</span>
            </div>
          </div>
        )}
      </div>

      {/* Right Controls: User Security Badge, Shift Lock & Clock */}
      <div className="flex items-center space-x-3">
        {/* Held Bills Notification */}
        {heldBillsCount > 0 && !isSuperAdminView && (
          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium animate-pulse"
          >
            <span>{heldBillsCount} Held Bill{heldBillsCount > 1 ? 's' : ''}</span>
          </button>
        )}

        {/* Sky Blue Background / Theme Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-200 text-xs font-semibold transition-all shadow-sm shadow-sky-500/20"
            title="Sky Blue Background Theme Settings"
          >
            <Palette className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span className="hidden md:inline text-[11px] font-bold">Sky Blue</span>
            <ChevronDown className="w-3 h-3 text-sky-300 ml-0.5" />
          </button>

          {isThemeDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-950/95 border border-sky-500/40 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl">
              <div className="px-2 py-1.5 text-[10px] font-bold text-sky-300 uppercase tracking-wider flex items-center justify-between border-b border-sky-500/20 pb-2 mb-2">
                <span className="flex items-center gap-1.5">
                  <Palette className="w-3 h-3 text-sky-400" />
                  Sky Blue Background
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono font-bold">
                  ACTIVE
                </span>
              </div>

              <div className="space-y-1.5">
                {themeOptions.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      changeBgTheme(t.id);
                      setIsThemeDropdownOpen(false);
                      showToast(`Background set to ${t.label}`, 'info');
                    }}
                    className={`w-full text-left p-2 rounded-xl text-xs transition-all flex items-start justify-between gap-2 ${
                      bgTheme === t.id
                        ? 'bg-sky-600/90 text-white font-bold shadow-md shadow-sky-600/30 ring-1 ring-sky-300'
                        : 'text-slate-300 hover:text-white hover:bg-sky-950/60'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5">
                      <div className={`w-3.5 h-3.5 mt-0.5 rounded-full shrink-0 ${t.dotColor}`} />
                      <div>
                        <div className="text-[11px] font-bold leading-tight">{t.label}</div>
                        <div className={`text-[10px] mt-0.5 leading-snug ${bgTheme === t.id ? 'text-sky-100 font-normal' : 'text-slate-400'}`}>
                          {t.desc}
                        </div>
                      </div>
                    </div>
                    {bgTheme === t.id && <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lock Terminal (PIN) Button */}
        <button
          onClick={() => setIsTerminalLocked(true)}
          className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 hover:text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-all"
          title="Lock Terminal Shift (Requires 4-Digit PIN to unlock)"
        >
          <Lock className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Lock Shift</span>
        </button>

        {/* User Profile & Security Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800/80 p-1.5 pr-2.5 rounded-xl border border-slate-800 transition-all"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <span className="font-bold text-xs text-white block leading-tight truncate max-w-[110px]">
                {user?.name || 'User'}
              </span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border leading-none ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isUserDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-1.5 z-50 divide-y divide-slate-800 animate-in fade-in zoom-in-95 text-xs">
              <div className="p-3 space-y-1">
                <span className="font-bold text-white block">{user?.name}</span>
                <span className="text-[11px] text-slate-400 font-mono block truncate">{user?.email}</span>
                <span className="text-[10px] text-emerald-400 block font-semibold">Shift: Active • Authenticated</span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsAuditModalOpen(true);
                    setIsUserDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Security Audit Logs</span>
                </button>

                <button
                  onClick={() => {
                    setIsLoginModalOpen(true);
                    setIsUserDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
                >
                  <KeyRound className="w-4 h-4 text-sky-400" />
                  <span>Switch User / Role</span>
                </button>
              </div>

              <div className="p-1">
                <button
                  onClick={() => {
                    logout();
                    setIsUserDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
