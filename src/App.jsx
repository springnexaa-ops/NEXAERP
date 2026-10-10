import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { POSScreen } from './components/pos/POSScreen';
import { InventoryScreen } from './components/inventory/InventoryScreen';
import { KhataScreen } from './components/khata/KhataScreen';
import { PurchasesScreen } from './components/purchases/PurchasesScreen';
import { ExpiryScreen } from './components/expiry/ExpiryScreen';
import { ReportsScreen } from './components/reports/ReportsScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { AccountingScreen } from './components/accounting/AccountingScreen';
import { HRMScreen } from './components/hrm/HRMScreen';
import { ReturnsScreen } from './components/returns/ReturnsScreen';
import { StockAuditScreen } from './components/adjustments/StockAuditScreen';
import { PromotionsScreen } from './components/promotions/PromotionsScreen';
import { LabMISScreen } from './components/lab/LabMISScreen';
import { ImportExportScreen } from './components/import_export/ImportExportScreen';
import { SuperAdminDashboard } from './components/saas/SuperAdminDashboard';
import { OrganizationUsersScreen } from './components/users/OrganizationUsersScreen';
import { LoginModal } from './components/auth/LoginModal';
import { TerminalLockModal } from './components/auth/TerminalLockModal';
import { SecurityAuditModal } from './components/auth/SecurityAuditModal';
import { TenantIsolationModal } from './components/auth/TenantIsolationModal';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

function ERPDashboard() {
  const {
    activeTab,
    setActiveTab,
    toast,
    user,
    logout,
    isSuperAdminView,
    setIsSuperAdminView,
    isTerminalLocked,
    setIsTerminalLocked,
    isLoginModalOpen,
    setIsLoginModalOpen,
    isAuditModalOpen,
    setIsAuditModalOpen,
    isIsolationModalOpen,
    setIsIsolationModalOpen,
    superAdminTab,
    setSuperAdminTab,
    vertical,
    bgTheme
  } = useApp();

  const normVertical = (vertical || 'pharma').toLowerCase();

  // Ensure default screen matches active ERP vertical
  useEffect(() => {
    if (user?.role === 'super_admin') return;
    if ((normVertical === 'impoexpo' || normVertical === 'exim') && (activeTab === 'pos' || activeTab === 'lab')) {
      setActiveTab('import_export');
    } else if ((normVertical === 'lmis' || normVertical === 'lab') && (activeTab === 'pos' || activeTab === 'import_export')) {
      setActiveTab('lab');
    }
  }, [normVertical, user]);

  // Global F-key navigation
  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey || isTerminalLocked) return;

      // Super Admin specific keyboard shortcuts (stays inside Super Admin Console)
      if (user?.role === 'super_admin') {
        if (e.key === 'F1') {
          e.preventDefault();
          setSuperAdminTab('stores');
        } else if (e.key === 'F2') {
          e.preventDefault();
          setSuperAdminTab('plans');
        } else if (e.key === 'F3') {
          e.preventDefault();
          setSuperAdminTab('billing');
        } else if (e.key === 'F4') {
          e.preventDefault();
          setSuperAdminTab('privacy');
        } else if (e.key === 'F11') {
          e.preventDefault();
          setIsTerminalLocked(true);
        }
        return;
      }

      // ImpoExpo ERP specific shortcuts
      if (normVertical === 'impoexpo' || normVertical === 'exim') {
        if (e.key === 'F1') { e.preventDefault(); setIsSuperAdminView(false); setActiveTab('import_export'); }
        else if (e.key === 'F4') { e.preventDefault(); setIsSuperAdminView(false); setActiveTab('purchases'); }
        else if (e.key === 'F6') { e.preventDefault(); setIsSuperAdminView(false); setActiveTab('reports'); }
        else if (e.key === 'F7') { e.preventDefault(); setIsSuperAdminView(false); setActiveTab('settings'); }
        else if (e.key === 'F8') { e.preventDefault(); setIsSuperAdminView(false); setActiveTab('users'); }
        else if (e.key === 'F9') { e.preventDefault(); setIsSuperAdminView(false); setActiveTab('accounting'); }
        else if (e.key === 'F11') { e.preventDefault(); setIsTerminalLocked(true); }
        return;
      }

      // LMIS ERP specific shortcuts
      if (normVertical === 'lmis' || normVertical === 'lab') {
        if (e.key === 'F1') { e.preventDefault(); setIsSuperAdminView(false); setActiveTab('lab'); }
        else if (e.key === 'F6') { e.preventDefault(); setIsSuperAdminView(false); setActiveTab('reports'); }
        else if (e.key === 'F7') { e.preventDefault(); setIsSuperAdminView(false); setActiveTab('settings'); }
        else if (e.key === 'F8') { e.preventDefault(); setIsSuperAdminView(false); setActiveTab('users'); }
        else if (e.key === 'F9') { e.preventDefault(); setIsSuperAdminView(false); setActiveTab('accounting'); }
        else if (e.key === 'F10') { e.preventDefault(); setIsSuperAdminView(false); setActiveTab('hrm'); }
        else if (e.key === 'F11') { e.preventDefault(); setIsTerminalLocked(true); }
        return;
      }

      // Pharma and General ERP shortcuts
      if (e.key === 'F1') {
        e.preventDefault();
        setIsSuperAdminView(false);
        setActiveTab('pos');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setIsSuperAdminView(false);
        setActiveTab('inventory');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setIsSuperAdminView(false);
        setActiveTab('khata');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setIsSuperAdminView(false);
        setActiveTab('purchases');
      } else if (e.key === 'F5') {
        e.preventDefault();
        setIsSuperAdminView(false);
        setActiveTab('expiry');
      } else if (e.key === 'F6') {
        e.preventDefault();
        setIsSuperAdminView(false);
        setActiveTab('reports');
      } else if (e.key === 'F7') {
        e.preventDefault();
        setIsSuperAdminView(false);
        setActiveTab('settings');
      } else if (e.key === 'F8') {
        e.preventDefault();
        setIsSuperAdminView(false);
        setActiveTab('users');
      } else if (e.key === 'F9') {
        e.preventDefault();
        setIsSuperAdminView(false);
        setActiveTab('accounting');
      } else if (e.key === 'F10') {
        e.preventDefault();
        setIsSuperAdminView(false);
        setActiveTab('hrm');
      } else if (e.key === 'F11') {
        e.preventDefault();
        setIsTerminalLocked(true);
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [setIsSuperAdminView, isTerminalLocked, setIsTerminalLocked, user, setSuperAdminTab, normVertical, setActiveTab]);

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${bgTheme === 'midnight-slate' ? 'bg-slate-900' : 'bg-transparent'} text-slate-100`}>
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {isSuperAdminView || user?.role === 'super_admin' ? (
            <SuperAdminDashboard />
          ) : (
            <>
              {activeTab === 'pos' && <POSScreen />}
              {activeTab === 'inventory' && <InventoryScreen />}
              {activeTab === 'khata' && <KhataScreen />}
              {activeTab === 'purchases' && <PurchasesScreen />}
              {activeTab === 'expiry' && <ExpiryScreen />}
              {activeTab === 'accounting' && <AccountingScreen />}
              {activeTab === 'hrm' && <HRMScreen />}
              {activeTab === 'returns' && <ReturnsScreen />}
              {activeTab === 'adjustments' && <StockAuditScreen />}
              {activeTab === 'promotions' && <PromotionsScreen />}
              {activeTab === 'lab' && <LabMISScreen />}
              {activeTab === 'import_export' && <ImportExportScreen />}
              {activeTab === 'reports' && <ReportsScreen />}
              {activeTab === 'users' && <OrganizationUsersScreen />}
              {activeTab === 'settings' && <SettingsScreen />}
            </>
          )}

          {/* Floating Toast Notification */}
          {toast && (
            <div className="absolute bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl text-xs font-semibold text-white animate-in slide-in-from-bottom-5 duration-150">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400" />}
              <span>{toast.message}</span>
            </div>
          )}
        </main>
      </div>

      {/* Security Modals */}
      <LoginModal
        isOpen={isLoginModalOpen || !user}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <TerminalLockModal
        isOpen={isTerminalLocked}
        onUnlock={() => setIsTerminalLocked(false)}
        onLogout={() => {
          setIsTerminalLocked(false);
          logout();
        }}
      />

      <SecurityAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      <TenantIsolationModal
        isOpen={isIsolationModalOpen}
        onClose={() => setIsIsolationModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ERPDashboard />
    </AppProvider>
  );
}
