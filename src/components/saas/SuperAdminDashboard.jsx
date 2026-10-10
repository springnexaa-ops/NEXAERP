import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  Plus,
  ExternalLink,
  ShieldCheck,
  Pill,
  ShoppingBag,
  Store,
  CheckCircle,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  Tag,
  Sliders,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  Check,
  FileText,
  RefreshCw,
  AlertTriangle,
  Receipt,
  FlaskConical,
  Activity,
  Microscope,
  Stethoscope,
  QrCode,
  Key,
  KeyRound,
  Lock,
  Unlock,
  Copy,
  Eye,
  UserPlus,
  ShieldAlert,
  Globe
} from 'lucide-react';

export function SuperAdminDashboard() {
  const {
    tenants,
    switchTenant,
    onboardTenant,
    showToast,
    refreshTenants,
    superAdminTab,
    setSuperAdminTab
  } = useApp();
  const activeTab = superAdminTab || 'stores';
  const setActiveTab = setSuperAdminTab;
  const [platformStats, setPlatformStats] = useState(null);
  const [plans, setPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [billingCycleView, setBillingCycleView] = useState('monthly'); // 'monthly' | 'annual'
  const [loading, setLoading] = useState(false);

  // Modals
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null); // null = create new
  const [isTenantSubModalOpen, setIsTenantSubModalOpen] = useState(false);
  const [selectedTenantForSub, setSelectedTenantForSub] = useState(null);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);

  // Tenant User & Password Studio Modal
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [selectedTenantForUsers, setSelectedTenantForUsers] = useState(null);
  const [tenantUsers, setTenantUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [activeResetUserId, setActiveResetUserId] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetPinValue, setResetPinValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'tenant_admin',
    pin_code: '1234'
  });

  // New Tenant Form
  const [onboardForm, setOnboardForm] = useState({
    name: '',
    business_type: 'impoexpo',
    enable_lmis: false,
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    owner_password: 'Nexa' + Math.floor(100000 + Math.random() * 900000),
    owner_pin: '1111',
    plan: 'enterprise',
    monthly_fee: 1999,
    store_address: '',
    gstin: '',
    dl_number: '',
    fssai_number: ''
  });

  // Plan Edit Form
  const [planForm, setPlanForm] = useState({
    name: '',
    code: '',
    description: '',
    business_type: 'all',
    monthly_rate: 999,
    annual_rate: 9999,
    discount_percent: 16.6,
    max_products: 3000,
    max_orders_per_month: 5000,
    max_staff: 5,
    features: '',
    is_popular: false,
    status: 'active'
  });

  // Tenant Subscription & Rate Form
  const [tenantSubForm, setTenantSubForm] = useState({
    plan: 'pro',
    plan_status: 'active',
    billing_cycle: 'monthly',
    has_custom_rate: false,
    custom_monthly_fee: '',
    subscription_renews_at: '',
    admin_notes: ''
  });

  // Record Payment Form
  const [paymentForm, setPaymentForm] = useState({
    tenant_id: '',
    amount: '',
    billing_cycle: 'monthly',
    payment_method: 'upi',
    reference_no: '',
    period_start: new Date().toISOString().slice(0, 10),
    period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  });

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, plansRes, invRes] = await Promise.all([
        api.getPlatformStats(),
        api.getPlans(),
        api.getSubscriptionInvoices()
      ]);
      setPlatformStats(statsRes);
      setPlans(plansRes || []);
      setInvoices(invRes || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load platform data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    setPlanForm({
      name: '',
      code: '',
      description: '',
      business_type: 'all',
      monthly_rate: 999,
      annual_rate: 9999,
      discount_percent: 16.6,
      max_products: 3000,
      max_orders_per_month: 5000,
      max_staff: 5,
      features: 'Counter POS Billing\nMulti-Batch Stock\nCustomer Khata (Udhar)\nBarcode Printing\nP&L Accounting',
      is_popular: false,
      status: 'active'
    });
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (p) => {
    setEditingPlan(p);
    const featureText = Array.isArray(p.features) ? p.features.join('\n') : '';
    setPlanForm({
      name: p.name,
      code: p.code,
      description: p.description || '',
      business_type: p.business_type || 'all',
      monthly_rate: p.monthly_rate,
      annual_rate: p.annual_rate,
      discount_percent: p.discount_percent || 16.6,
      max_products: p.max_products,
      max_orders_per_month: p.max_orders_per_month,
      max_staff: p.max_staff,
      features: featureText,
      is_popular: p.is_popular === 1,
      status: p.status || 'active'
    });
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      const featureArray = planForm.features
        .split('\n')
        .map(f => f.trim())
        .filter(Boolean);

      const payload = {
        ...planForm,
        monthly_rate: Number(planForm.monthly_rate),
        annual_rate: Number(planForm.annual_rate),
        discount_percent: Number(planForm.discount_percent),
        max_products: Number(planForm.max_products),
        max_orders_per_month: Number(planForm.max_orders_per_month),
        max_staff: Number(planForm.max_staff),
        features: featureArray,
        is_popular: planForm.is_popular ? 1 : 0
      };

      if (editingPlan) {
        await api.updatePlan(editingPlan.id, payload);
        showToast(`Plan rates for '${planForm.name}' updated!`, 'success');
      } else {
        await api.createPlan(payload);
        showToast(`New rate plan '${planForm.name}' created!`, 'success');
      }

      setIsPlanModalOpen(false);
      loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to save plan', 'error');
    }
  };

  const handleDeletePlan = async (planId, planName) => {
    if (!confirm(`Are you sure you want to deactivate/delete '${planName}'?`)) return;
    try {
      const res = await api.deletePlan(planId);
      showToast(res.message || 'Plan deleted', 'info');
      loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to delete plan', 'error');
    }
  };

  const handleOpenTenantSubscription = (tenant) => {
    setSelectedTenantForSub(tenant);
    setTenantSubForm({
      plan: tenant.plan || 'pro',
      plan_status: tenant.plan_status || 'active',
      billing_cycle: tenant.billing_cycle || 'monthly',
      has_custom_rate: tenant.custom_monthly_fee !== null && tenant.custom_monthly_fee !== undefined,
      custom_monthly_fee: tenant.custom_monthly_fee || '',
      subscription_renews_at: tenant.subscription_renews_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      admin_notes: tenant.admin_notes || ''
    });
    setIsTenantSubModalOpen(true);
  };

  const handleSaveTenantSubscription = async (e) => {
    e.preventDefault();
    if (!selectedTenantForSub) return;
    try {
      const payload = {
        plan: tenantSubForm.plan,
        plan_status: tenantSubForm.plan_status,
        billing_cycle: tenantSubForm.billing_cycle,
        custom_monthly_fee: tenantSubForm.has_custom_rate ? Number(tenantSubForm.custom_monthly_fee) : null,
        subscription_renews_at: tenantSubForm.subscription_renews_at,
        admin_notes: tenantSubForm.admin_notes
      };

      const res = await api.updateTenantSubscription(selectedTenantForSub.id, payload);
      showToast(res.message || 'Tenant subscription updated!', 'success');
      setIsTenantSubModalOpen(false);
      if (refreshTenants) await refreshTenants();
      loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to update subscription', 'error');
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    try {
      await onboardTenant(onboardForm);
      showToast('Store onboarded successfully with assigned rate plan!', 'success');
      setIsOnboardModalOpen(false);
      loadAllData();
    } catch (err) {
      // handled in context
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      await api.recordSubscriptionInvoice(paymentForm.tenant_id, paymentForm);
      showToast('Subscription payment recorded and ledger updated!', 'success');
      setIsRecordPaymentModalOpen(false);
      loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to record subscription payment', 'error');
    }
  };

  // Tenant User & Password Studio Handlers
  const handleOpenTenantUsers = (tenant, openAddForm = false) => {
    setSelectedTenantForUsers(tenant);
    setIsUsersModalOpen(true);
    setIsAddingUser(openAddForm);
    if (openAddForm) {
      setNewUserForm({
        name: '',
        email: '',
        password: generateRandomPassword(),
        role: tenant.business_type === 'impoexpo' ? 'cashier' : 'cashier',
        pin_code: '1234'
      });
    }
    setActiveResetUserId(null);
    setResetPasswordValue('');
    setResetPinValue('');
    loadTenantUsers(tenant.id);
  };

  const loadTenantUsers = async (tenantId) => {
    setUsersLoading(true);
    try {
      const res = await api.getTenantUsers(tenantId);
      setTenantUsers(res.users || []);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to fetch store users', 'error');
    } finally {
      setUsersLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = 'Nexa';
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pwd += (Math.floor(Math.random() * 90) + 10);
    return pwd;
  };

  const handleCreateTenantUser = async (e) => {
    e.preventDefault();
    if (!selectedTenantForUsers) return;
    try {
      const res = await api.createTenantUser(selectedTenantForUsers.id, newUserForm);
      showToast(res.message || 'User created successfully', 'success');
      setNewUserForm({
        name: '',
        email: '',
        password: '',
        role: 'tenant_admin',
        pin_code: '1234'
      });
      setIsAddingUser(false);
      loadTenantUsers(selectedTenantForUsers.id);
      if (refreshTenants) await refreshTenants();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to create user', 'error');
    }
  };

  const handleSaveUserPassword = async (userId) => {
    if (!selectedTenantForUsers || !resetPasswordValue) {
      showToast('Please enter a new password (min 6 chars)', 'error');
      return;
    }
    try {
      const res = await api.setTenantUserPassword(
        selectedTenantForUsers.id,
        userId,
        resetPasswordValue,
        resetPinValue || null
      );
      showToast(res.message || 'Password updated successfully', 'success');
      setActiveResetUserId(null);
      setResetPasswordValue('');
      setResetPinValue('');
      loadTenantUsers(selectedTenantForUsers.id);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to update password', 'error');
    }
  };

  const handleToggleUserStatus = async (user) => {
    if (!selectedTenantForUsers) return;
    const isLocked = !!(user.locked_until || (user.failed_login_attempts && user.failed_login_attempts > 0));
    const newStatus = user.status === 'active' && !isLocked ? 'suspended' : 'active';
    try {
      const res = await api.setTenantUserStatus(
        selectedTenantForUsers.id,
        user.id,
        newStatus,
        isLocked // unlock if locked
      );
      showToast(res.message || 'User status updated', 'success');
      loadTenantUsers(selectedTenantForUsers.id);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to change status', 'error');
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast('Copied to clipboard', 'info');
  };

  const totalMRR = platformStats?.mrr || 2298;
  const totalARR = platformStats?.arr || Math.round(totalMRR * 12);
  const totalInvoiced = invoices.reduce((s, i) => s + (i.total_amount || 0), 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-y-auto select-none p-4 sm:p-6 space-y-6">
      {/* Platform Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" /> SpringNexa Cloud Platform
            </span>
            <span className="text-xs text-slate-400 font-mono">v2.4 Multi-Tenant SaaS Engine</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1 tracking-tight">
            Nexa ERP — Super Admin Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            SpringNexa Private Limited • Manage Tenant Rate Plans, Custom Store Pricing & SaaS Subscription Invoices
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={handleOpenCreatePlan}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-sky-300 font-bold text-xs border border-sky-500/30 flex items-center space-x-2 transition-all"
          >
            <Tag className="w-4 h-4 text-sky-400" />
            <span>+ Create Rate Plan</span>
          </button>

          <button
            onClick={() => setIsOnboardModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-sky-500/25 flex items-center space-x-2 active:scale-98 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard New Store</span>
          </button>
        </div>
      </div>

      {/* SaaS High-Level Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Registered Stores</span>
            <Building2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white mt-2">
            {platformStats?.total_tenants || tenants.length}
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 block">
            {platformStats?.active_tenants || tenants.length} Active Stores
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Platform MRR</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-2">
            {formatCurrency(totalMRR)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            ARR: {formatCurrency(totalARR)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Tenant Data Privacy</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300 mt-2">
            Isolated
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 block truncate">
            Private Workspaces
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Tenant User Accounts</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black font-mono text-sky-300 mt-2">
            {tenants.reduce((s, t) => s + (t.user_count || 1), 0)} Users
          </div>
          <span className="text-[10px] text-sky-400 mt-1 block truncate">
            Password Studio Active
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Rate Plans Studio</span>
            <Tag className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black font-mono text-purple-300 mt-2">
            {plans.length} Tiers
          </div>
          <span className="text-[10px] text-purple-400 mt-1 block">
            Pharma Pro + Lab MIS
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">SaaS Invoiced</span>
            <Receipt className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-300 mt-2">
            {formatCurrency(totalInvoiced)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {invoices.length} Billings Settled
          </span>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex flex-wrap gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('stores')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'stores'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Store Directory & Passwords ({tenants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'plans'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Rate Plans & Limits Studio ({plans.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'billing'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>SaaS Billing & Invoices ({invoices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'privacy'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Data Privacy & Security</span>
          </button>
        </div>

        <button
          onClick={loadAllData}
          className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* TAB 1: Store Tenants & Rate Assignment Table */}
      {activeTab === 'stores' && (
        <div className="bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-white">Client Store Directory & Assigned Rates</h3>
              <p className="text-xs text-slate-400">
                View assigned plans, override custom negotiated rates per store, and adjust billing status.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
              {tenants.length} Active Stores
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Store Identity & Slug</th>
                  <th className="py-3.5 px-4">Vertical</th>
                  <th className="py-3.5 px-4">Assigned Plan & Rate</th>
                  <th className="py-3.5 px-4">Staff Accounts & Logins</th>
                  <th className="py-3.5 px-4 text-center">Data Privacy Shield</th>
                  <th className="py-3.5 px-4 text-center">Plan Status</th>
                  <th className="py-3.5 px-4">Next Renewal</th>
                  <th className="py-3.5 px-4 text-right">Administrative Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/80">
                {tenants.map(t => {
                  const effectiveFee = t.custom_monthly_fee !== null && t.custom_monthly_fee !== undefined
                    ? t.custom_monthly_fee
                    : t.monthly_fee;
                  const isCustom = t.custom_monthly_fee !== null && t.custom_monthly_fee !== undefined;

                  return (
                    <tr key={t.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white text-sm block">{t.name}</span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {t.slug}.nexa-erp.springnexa.com
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                          t.business_type === 'impoexpo' || t.business_type === 'exim'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : t.business_type === 'lab'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : t.business_type === 'pharma_lab'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : t.business_type === 'pharma'
                            ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                            : t.business_type === 'kiryana' || t.business_type === 'general'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}>
                          {(t.business_type === 'impoexpo' || t.business_type === 'exim') && <Globe className="w-3 h-3 text-sky-400" />}
                          {t.business_type === 'lab' && <FlaskConical className="w-3 h-3 text-rose-400" />}
                          {t.business_type === 'pharma_lab' && <Stethoscope className="w-3 h-3 text-purple-400" />}
                          {t.business_type === 'pharma' && <Pill className="w-3 h-3 text-pink-400" />}
                          {(t.business_type === 'kiryana' || t.business_type === 'general') && <ShoppingBag className="w-3 h-3 text-emerald-400" />}
                          {(t.business_type === 'impoexpo' || t.business_type === 'exim') ? 'ImpoExpo Trade' : t.business_type === 'lab' ? 'Pathology LMIS' : t.business_type === 'pharma_lab' ? 'Pharma + Lab' : t.business_type === 'pharma' ? 'Pharma Retail' : 'General Retail'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold uppercase text-white">{t.plan_name || t.plan}</span>
                          {isCustom && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Custom
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-emerald-400 block font-mono font-bold">
                          {formatCurrency(effectiveFee)} / month
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-xs block">
                            {t.user_count || 1} Registered Staff
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => handleOpenTenantUsers(t, true)}
                            className="text-[11px] px-2 py-0.5 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold flex items-center gap-1 transition shadow-sm"
                            title="Generate a new staff/admin user for this store"
                          >
                            <UserPlus className="w-3 h-3 text-sky-400" />
                            <span>+ Generate User</span>
                          </button>
                          <button
                            onClick={() => handleOpenTenantUsers(t, false)}
                            className="text-[11px] text-slate-400 hover:text-white font-medium flex items-center gap-1 transition"
                            title="Manage logins and passwords"
                          >
                            <KeyRound className="w-3 h-3 text-slate-400" />
                            <span>Manage</span>
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Confidential</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Operational Data Hidden
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.plan_status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : t.plan_status === 'trial'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {t.plan_status || 'active'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">
                        {formatDate(t.subscription_renews_at || '2026-11-08')}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenTenantUsers(t)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all"
                            title="Manage Store Users & Set Passwords"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Users & Passwords</span>
                          </button>

                          <button
                            onClick={() => handleOpenTenantSubscription(t)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 font-bold text-xs flex items-center gap-1 transition-all"
                            title="Manage Plan & Rate"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Rates</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Data Privacy & Tenant Access Policy */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Data Privacy & Access Policy
                </span>
                <span className="text-xs text-slate-400 font-mono">Platform Standard</span>
              </div>
              <h3 className="text-xl font-bold text-white mt-1.5 tracking-tight">
                Tenant Data Confidentiality & Access Control
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Platform administrators manage subscriptions, plan allocations, and user credentials. Tenant operational records (sales invoices, customer balances, purchases, and accounting) remain private and accessible only to tenant users.
              </p>
            </div>

            <div className="flex flex-col items-end space-y-1.5 shrink-0">
              <span className="px-3.5 py-1.5 rounded-2xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-bold flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Tenant Isolation Enforced</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                API Middleware Enforced
              </span>
            </div>
          </div>

          {/* 4 Pillars of Data Governance */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center">
                <Lock className="w-4 h-4 text-rose-400" />
              </div>
              <h4 className="font-bold text-white text-sm">1. Operational Data Masking</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Super Admin requests to all 12 operational endpoints (<code className="text-slate-300">/sales</code>, <code className="text-slate-300">/products</code>, <code className="text-slate-300">/customers</code>, <code className="text-slate-300">/lab</code>, <code className="text-slate-300">/accounting</code>) are intercepted with HTTP 403 Forbidden.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-sky-400" />
              </div>
              <h4 className="font-bold text-white text-sm">2. Password Reset Studio</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Super Admin can provision staff accounts and reset forgotten passwords for store owners/cashiers using the administrative studio without viewing store business transactions.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
              </div>
              <h4 className="font-bold text-white text-sm">3. Administrative Decoupling</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Super Admin acts exclusively as SaaS infrastructure administrator: managing store subscription tiers, billing cycles, negotiated rates, and system health.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center">
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="font-bold text-white text-sm">4. Signed Audit Logging</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every credential reset, lockout event, and tenant configuration adjustment is logged in immutable security audit logs with timestamps, actor IDs, and IP addresses.
              </p>
            </div>
          </div>

          {/* Tenant Privacy Verification Matrix */}
          <div className="bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Store Tenant Privacy Isolation Status Matrix
                </h4>
                <p className="text-xs text-slate-400">
                  Verification of cryptographic boundary isolation across all provisioned client store workspaces.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                All {tenants.length} Tenants Shielded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Store Identity</th>
                    <th className="py-3 px-4">Vertical</th>
                    <th className="py-3 px-4">Assigned Plan</th>
                    <th className="py-3 px-4">Staff User Accounts</th>
                    <th className="py-3 px-4 text-center">Operational Data Access</th>
                    <th className="py-3 px-4 text-right">Credential Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {tenants.map(t => (
                    <tr key={t.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white text-sm block">{t.name}</span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {t.slug}.nexa-erp.springnexa.com
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                          {t.business_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white uppercase font-mono">
                        {t.plan_name || t.plan}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-sky-400 font-mono">
                          {t.user_count || 1} Accounts
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <Lock className="w-3 h-3 text-emerald-400" />
                          Isolated Workspace
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenTenantUsers(t)}
                          className="px-3 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-bold inline-flex items-center gap-1.5 transition-all"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-sky-400" />
                          <span>Set Passwords</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Rate Plans & Pricing Studio */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Plan Studio Header */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-400" />
                Active Subscription Rate Plans (Catalog)
              </h3>
              <p className="text-xs text-slate-400">
                Configure rates, SKU caps, staff user limits and included features for each plan tier
              </p>
            </div>

            {/* Monthly vs Annual Toggle */}
            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-400 font-medium">Billing Period:</span>
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setBillingCycleView('monthly')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    billingCycleView === 'monthly'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Monthly Rates
                </button>
                <button
                  onClick={() => setBillingCycleView('annual')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    billingCycleView === 'annual'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Annual Rates</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded font-extrabold">
                    Save 16%
                  </span>
                </button>
              </div>

              <button
                onClick={handleOpenCreatePlan}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-lg shadow-purple-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Plan</span>
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map(p => {
              const displayRate = billingCycleView === 'annual' ? p.annual_rate : p.monthly_rate;
              const rateSubtext = billingCycleView === 'annual' ? '/ year' : '/ month';

              return (
                <div
                  key={p.id}
                  className={`bg-slate-950 rounded-2xl border p-5 flex flex-col justify-between relative transition-all duration-200 ${
                    p.is_popular
                      ? 'border-purple-500/60 shadow-xl shadow-purple-500/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {p.is_popular === 1 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                      Most Popular
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-base font-bold text-white">{p.name}</h4>
                        <span className="text-[10px] text-purple-400 font-mono">Code: {p.code}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-900 border border-slate-800 text-slate-300">
                        {p.business_type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mb-4 min-h-[32px] line-clamp-2">
                      {p.description || 'Enterprise retail operational tier'}
                    </p>

                    {/* Price Header */}
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 mb-4">
                      <div className="flex items-baseline">
                        <span className="text-2xl font-black font-mono text-white">
                          {formatCurrency(displayRate)}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">{rateSubtext}</span>
                      </div>
                      {billingCycleView === 'annual' && p.discount_percent > 0 && (
                        <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                          Includes {p.discount_percent}% annual prepayment discount
                        </div>
                      )}
                    </div>

                    {/* Plan Limits */}
                    <div className="space-y-1.5 text-xs border-b border-slate-800 pb-3 mb-3 text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Max Products/SKUs:</span>
                        <span className="font-bold font-mono">
                          {p.max_products === -1 ? 'Unlimited' : p.max_products}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Monthly Order Limit:</span>
                        <span className="font-bold font-mono">
                          {p.max_orders_per_month === -1 ? 'Unlimited' : p.max_orders_per_month}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Staff / User Seats:</span>
                        <span className="font-bold font-mono">
                          {p.max_staff === -1 ? 'Unlimited' : `${p.max_staff} Users`}
                        </span>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-1.5 text-xs mb-4">
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                        Included Features:
                      </div>
                      {p.features && p.features.map((feat, i) => (
                        <div key={i} className="flex items-start gap-2 text-slate-300">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-[11px]">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex justify-between items-center text-[11px] text-slate-400 mb-2">
                      <span>Subscribers:</span>
                      <span className="font-bold text-sky-400 font-mono">
                        {p.active_subscribers || 0} Stores
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenEditPlan(p)}
                        className="flex-1 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold text-xs flex items-center justify-center gap-1 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Rates</span>
                      </button>

                      <button
                        onClick={() => handleDeletePlan(p.id, p.name)}
                        className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        title="Deactivate Plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SaaS Billing & Invoicing Ledger */}
      {activeTab === 'billing' && (
        <div className="bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-white">SaaS Subscriptions & Invoice Ledger</h3>
              <p className="text-xs text-slate-400">
                Track subscription renewals, billing cycles, GST tax invoices and store payments.
              </p>
            </div>
            <button
              onClick={() => {
                if (tenants.length > 0) {
                  setPaymentForm({
                    tenant_id: tenants[0].id,
                    amount: tenants[0].monthly_fee || 999,
                    billing_cycle: 'monthly',
                    payment_method: 'upi',
                    reference_no: '',
                    period_start: new Date().toISOString().slice(0, 10),
                    period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
                  });
                  setIsRecordPaymentModalOpen(true);
                }
              }}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Record Subscription Payment</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Store Client</th>
                  <th className="py-3.5 px-4">Plan & Cycle</th>
                  <th className="py-3.5 px-4">Billing Period</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4 text-right">Fee (₹)</th>
                  <th className="py-3.5 px-4 text-right">GST 18%</th>
                  <th className="py-3.5 px-4 text-right">Total (₹)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/80">
                {invoices.length > 0 ? (
                  invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                        {inv.invoice_no}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block">{inv.store_name}</span>
                        <span className="text-[11px] text-slate-400">{inv.owner_name}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white block">{inv.plan_name}</span>
                        <span className="text-[10px] uppercase font-mono text-slate-400">{inv.billing_cycle}</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                        {formatDate(inv.period_start)} → {formatDate(inv.period_end)}
                      </td>

                      <td className="py-3.5 px-4 uppercase font-mono text-[11px] text-slate-400">
                        {inv.payment_method}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {formatCurrency(inv.amount)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-sky-400">
                        {formatCurrency(inv.tax_amount)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                        {formatCurrency(inv.total_amount)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {inv.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-10 text-slate-500">
                      No subscription billing records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Create / Edit Rate Plan Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-base">
                  {editingPlan ? `Edit Rate Plan: ${editingPlan.name}` : 'Create New Subscription Rate Plan'}
                </h3>
                <p className="text-xs text-slate-400">Configure rates, limits and module entitlements</p>
              </div>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleSavePlan} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-slate-300 block mb-1 font-semibold">Plan Name *</label>
                  <input
                    type="text"
                    required
                    value={planForm.name}
                    onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                    placeholder="e.g. Kiryana Retail Pro, Chemist Enterprise"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                {!editingPlan && (
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Unique Plan Code *</label>
                    <input
                      type="text"
                      required
                      value={planForm.code}
                      onChange={e => setPlanForm({ ...planForm, code: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                      placeholder="e.g. kiryana_pro"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                )}

                <div className={editingPlan ? 'col-span-2' : ''}>
                  <label className="text-slate-300 block mb-1 font-semibold">Business Vertical</label>
                  <select
                    value={planForm.business_type}
                    onChange={e => setPlanForm({ ...planForm, business_type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="all">Universal / All Verticals</option>
                    <option value="pharma">💊 Pharma Specialists Only</option>
                    <option value="kiryana">🛒 Kiryana & Provision Stores Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Short Marketing Description</label>
                <input
                  type="text"
                  value={planForm.description}
                  onChange={e => setPlanForm({ ...planForm, description: e.target.value })}
                  placeholder="Target audience and core value proposition"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              {/* Pricing Rates */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Monthly Rate (₹) *</label>
                  <input
                    type="number"
                    required
                    value={planForm.monthly_rate}
                    onChange={e => {
                      const m = Number(e.target.value);
                      const ann = Math.round(m * 12 * 0.834);
                      setPlanForm({ ...planForm, monthly_rate: e.target.value, annual_rate: ann });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Annual Rate (₹) *</label>
                  <input
                    type="number"
                    required
                    value={planForm.annual_rate}
                    onChange={e => setPlanForm({ ...planForm, annual_rate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Annual Disc (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={planForm.discount_percent}
                    onChange={e => setPlanForm({ ...planForm, discount_percent: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-emerald-400 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Usage & Feature Caps */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Max SKUs (-1: Unlim)</label>
                  <input
                    type="number"
                    value={planForm.max_products}
                    onChange={e => setPlanForm({ ...planForm, max_products: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Monthly Orders (-1: Unlim)</label>
                  <input
                    type="number"
                    value={planForm.max_orders_per_month}
                    onChange={e => setPlanForm({ ...planForm, max_orders_per_month: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Staff Seats (-1: Unlim)</label>
                  <input
                    type="number"
                    value={planForm.max_staff}
                    onChange={e => setPlanForm({ ...planForm, max_staff: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Included Features (One feature per line)
                </label>
                <textarea
                  rows="4"
                  value={planForm.features}
                  onChange={e => setPlanForm({ ...planForm, features: e.target.value })}
                  placeholder="POS Counter Billing&#10;Batches & Expiry (FEFO)&#10;Customer Khata&#10;Accounting & P&L"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 self-center">Quick Add:</span>
                  {[
                    'Clinical Laboratory & Pathology MIS (F8)',
                    'NABL-Grade Diagnostic Reports & Verification',
                    'Doctor Commission Ledger & Payouts',
                    'FEFO Medicine Expiry Picking',
                    'Double-Entry Accounting & P&L',
                    'HRM Biometric Attendance & Payroll'
                  ].map((tag, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const lines = planForm.features ? planForm.features.split('\n') : [];
                        if (!lines.includes(tag)) {
                          setPlanForm({ ...planForm, features: [...lines, tag].filter(Boolean).join('\n') });
                        }
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="popularCheck"
                  checked={planForm.is_popular}
                  onChange={e => setPlanForm({ ...planForm, is_popular: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-0"
                />
                <label htmlFor="popularCheck" className="text-slate-300 cursor-pointer font-medium">
                  Highlight as "Most Popular" / Recommended plan tier on pricing screens
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/30 flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{editingPlan ? 'Save Rate Changes' : 'Create Rate Plan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Tenant User Management & Password Reset Studio */}
      {isUsersModalOpen && selectedTenantForUsers && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                  <KeyRound className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-white text-base">
                      Tenant Users & Password Reset Studio
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30">
                      Tenant #{selectedTenantForUsers.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Store: <strong className="text-white">{selectedTenantForUsers.name}</strong> • Slug: <span className="font-mono text-slate-400">{selectedTenantForUsers.slug}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUsersModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Privacy Notice Banner */}
              <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-start space-x-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-white block">
                    User Credential Administration
                  </span>
                  <span className="text-slate-400 leading-relaxed block mt-0.5">
                    Super Admin can provision staff accounts, manage roles, and reset credentials. Tenant operational records remain private to the organization.
                  </span>
                </div>
              </div>

              {/* Toolbar: User Count & + Add New User button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white">Registered Store Staff</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-sky-400 font-mono font-bold border border-slate-700">
                    {tenantUsers.length} Users
                  </span>
                </div>

                <button
                  onClick={() => setIsAddingUser(!isAddingUser)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-md shadow-sky-500/20 active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isAddingUser ? 'Close Form' : '+ Add Store User'}</span>
                </button>
              </div>

              {/* Add User Form (if toggled) */}
              {isAddingUser && (
                <form onSubmit={handleCreateTenantUser} className="p-4 bg-slate-900 rounded-2xl border border-slate-700 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-sky-400" />
                      Create New User Account for {selectedTenantForUsers.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingUser(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      ✕ Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">Staff Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Patel"
                        value={newUserForm.name}
                        onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">Login Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. ramesh@store.com"
                        value={newUserForm.email}
                        onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">Organization Role / Permissions *</label>
                      <select
                        value={newUserForm.role}
                        onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
                      >
                        {selectedTenantForUsers?.business_type === 'impoexpo' || selectedTenantForUsers?.business_type === 'exim' ? (
                          <>
                            <option value="tenant_admin">Director / EXIM Admin</option>
                            <option value="cha_agent">Custom House Agent (CHA Broker)</option>
                            <option value="manager">Trade & Logistics Manager</option>
                            <option value="cashier">Billing & Customs Operator</option>
                            <option value="accountant">Forex Accountant</option>
                          </>
                        ) : selectedTenantForUsers?.business_type === 'lab' ? (
                          <>
                            <option value="tenant_admin">Laboratory Director</option>
                            <option value="pathologist">Senior Pathologist</option>
                            <option value="manager">Lab Manager</option>
                            <option value="cashier">Phlebotomist / Reception</option>
                          </>
                        ) : selectedTenantForUsers?.business_type === 'pharma' ? (
                          <>
                            <option value="tenant_admin">Pharmacy Admin / Owner</option>
                            <option value="manager">Pharmacy Store Manager</option>
                            <option value="cashier">Pharmacist / Cashier</option>
                            <option value="accountant">Accountant</option>
                          </>
                        ) : (
                          <>
                            <option value="tenant_admin">Store Admin / Owner</option>
                            <option value="manager">Store Manager</option>
                            <option value="cashier">Counter Cashier</option>
                            <option value="accountant">Accountant</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">Fast POS PIN (4 Digits)</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="1234"
                        value={newUserForm.pin_code}
                        onChange={e => setNewUserForm({ ...newUserForm, pin_code: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-300 font-semibold">Initial Password * (min 6 chars)</label>
                        <button
                          type="button"
                          onClick={() => {
                            const gen = generateRandomPassword();
                            setNewUserForm({ ...newUserForm, password: gen });
                          }}
                          className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Generate Strong Password
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          required
                          minLength={6}
                          placeholder="Enter password or click Generate"
                          value={newUserForm.password}
                          onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                        />
                        {newUserForm.password && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(newUserForm.password, 'new-user')}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0"
                            title="Copy to clipboard"
                          >
                            {copiedKey === 'new-user' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            <span>{copiedKey === 'new-user' ? 'Copied' : 'Copy'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsAddingUser(false)}
                      className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-600/30"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Save User</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Users List */}
              {usersLoading ? (
                <div className="text-center py-8 text-slate-400 flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
                  <span className="text-xs">Loading store user credentials...</span>
                </div>
              ) : tenantUsers.length === 0 ? (
                <div className="text-center py-8 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                  No users registered for this store yet. Click "+ Add Store User" above to create one.
                </div>
              ) : (
                <div className="space-y-3">
                  {tenantUsers.map(u => {
                    const isLocked = !!(u.locked_until || (u.failed_login_attempts && u.failed_login_attempts >= 5));
                    const isResetting = activeResetUserId === u.id;

                    return (
                      <div
                        key={u.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isResetting
                            ? 'bg-slate-900 border-sky-500/50 shadow-lg'
                            : isLocked
                            ? 'bg-rose-950/20 border-rose-500/30'
                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-sm text-white">{u.name}</span>
                                <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                                  u.role === 'tenant_admin'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : u.role === 'manager'
                                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                    : u.role === 'cha_agent'
                                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                    : u.role === 'pathologist'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                }`}>
                                  {u.role === 'cha_agent' ? 'CHA Broker' : u.role.replace('_', ' ')}
                                </span>
                                <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                                  u.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-rose-500/10 text-rose-400'
                                }`}>
                                  {u.status}
                                </span>
                                {isLocked && (
                                  <span className="px-2 py-0.2 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                    <Lock className="w-3 h-3 text-amber-400" />
                                    Locked ({u.failed_login_attempts || 5} Fails)
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 mt-1">
                                <span className="font-mono text-slate-300">{u.email}</span>
                                <span>•</span>
                                <span>POS PIN: <strong className="font-mono text-slate-200">{u.pin_code || '1234'}</strong></span>
                                <span>•</span>
                                <span>Last Login: <span className="text-slate-300">{u.last_login_at ? formatDate(u.last_login_at) : 'Never'}</span></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            {isLocked && (
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1 transition"
                                title="Clear lockout and reset attempts"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Unlock</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                if (isResetting) {
                                  setActiveResetUserId(null);
                                } else {
                                  setActiveResetUserId(u.id);
                                  setResetPasswordValue('');
                                  setResetPinValue(u.pin_code || '');
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                                isResetting
                                  ? 'bg-slate-800 text-slate-300'
                                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20'
                              }`}
                            >
                              <Key className="w-3.5 h-3.5" />
                              <span>{isResetting ? 'Cancel' : 'Set Password'}</span>
                            </button>

                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                                u.status === 'active'
                                  ? 'bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300'
                                  : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300'
                              }`}
                              title={u.status === 'active' ? 'Suspend User' : 'Activate User'}
                            >
                              {u.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                          </div>
                        </div>

                        {/* Inline Password Reset Form for this user */}
                        {isResetting && (
                          <div className="mt-3 pt-3 border-t border-slate-800 text-xs space-y-3 animate-in fade-in">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sky-300 flex items-center gap-1.5">
                                <KeyRound className="w-4 h-4 text-sky-400" />
                                Set New Credentials for {u.name} ({u.email})
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const gen = generateRandomPassword();
                                  setResetPasswordValue(gen);
                                }}
                                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                Generate Strong Password
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              <div className="sm:col-span-2">
                                <label className="text-slate-400 block mb-1">New Password * (min 6 characters)</label>
                                <div className="relative">
                                  <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    placeholder="Enter new password"
                                    value={resetPasswordValue}
                                    onChange={e => setResetPasswordValue(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 pr-20 text-white font-mono"
                                  />
                                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                                    <button
                                      type="button"
                                      onClick={() => setShowPassword(!showPassword)}
                                      className="p-1 text-slate-400 hover:text-white"
                                      title={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                    {resetPasswordValue && (
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(resetPasswordValue, `pwd-${u.id}`)}
                                        className="p-1 text-slate-400 hover:text-emerald-400"
                                        title="Copy password to clipboard"
                                      >
                                        {copiedKey === `pwd-${u.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label className="text-slate-400 block mb-1">POS PIN (Optional)</label>
                                <input
                                  type="text"
                                  maxLength={6}
                                  placeholder="e.g. 1234"
                                  value={resetPinValue}
                                  onChange={e => setResetPinValue(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[11px] text-slate-400">
                                Saving will automatically unlock the account, reset failed attempts, and refresh active sessions.
                              </span>
                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => setActiveResetUserId(null)}
                                  className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveUserPassword(u.id)}
                                  className="px-4 py-1.5 rounded-xl font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-md shadow-sky-600/30 flex items-center gap-1.5"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Apply & Unlock</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Security Policy: BCrypt Enforced
              </span>
              <button
                onClick={() => setIsUsersModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Manage Tenant Subscription & Rate Override Modal */}
      {isTenantSubModalOpen && selectedTenantForSub && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-base">
                  Manage Store Subscription & Rates
                </h3>
                <p className="text-xs text-purple-400 font-semibold">{selectedTenantForSub.name}</p>
              </div>
              <button onClick={() => setIsTenantSubModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleSaveTenantSubscription} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Select Rate Plan Tier *</label>
                <select
                  value={tenantSubForm.plan}
                  onChange={e => setTenantSubForm({ ...tenantSubForm, plan: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.code}>
                      {p.name} (Std: ₹{p.monthly_rate}/mo • {p.business_type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Negotiated Rate Toggle */}
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-200 font-medium">Custom Negotiated Rate:</span>
                  <input
                    type="checkbox"
                    id="customRateToggle"
                    checked={tenantSubForm.has_custom_rate}
                    onChange={e => setTenantSubForm({ ...tenantSubForm, has_custom_rate: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-0"
                  />
                </div>

                {tenantSubForm.has_custom_rate ? (
                  <div>
                    <label className="text-slate-400 block mb-1">Custom Monthly Fee (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 850"
                      value={tenantSubForm.custom_monthly_fee}
                      onChange={e => setTenantSubForm({ ...tenantSubForm, custom_monthly_fee: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-emerald-400 font-mono font-bold"
                    />
                    <span className="text-[10px] text-amber-400 block mt-1">
                      Overrides the standard plan rate for this store.
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Billed at standard plan rate.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Billing Cycle</label>
                  <select
                    value={tenantSubForm.billing_cycle}
                    onChange={e => setTenantSubForm({ ...tenantSubForm, billing_cycle: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white uppercase font-mono"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual (Prepaid)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Subscription Status</label>
                  <select
                    value={tenantSubForm.plan_status}
                    onChange={e => setTenantSubForm({ ...tenantSubForm, plan_status: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white uppercase font-mono"
                  >
                    <option value="active">Active (Paid)</option>
                    <option value="trial">Trial (14 Days)</option>
                    <option value="past_due">Past Due (Grace)</option>
                    <option value="suspended">Suspended (Locked)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Next Renewal / Expiry Date</label>
                <input
                  type="date"
                  value={tenantSubForm.subscription_renews_at}
                  onChange={e => setTenantSubForm({ ...tenantSubForm, subscription_renews_at: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Admin Contract Notes</label>
                <textarea
                  rows="2"
                  value={tenantSubForm.admin_notes}
                  onChange={e => setTenantSubForm({ ...tenantSubForm, admin_notes: e.target.value })}
                  placeholder="Special pricing agreements, contract tenure..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsTenantSubModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/30 flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Update Subscription</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Record Subscription Payment Modal */}
      {isRecordPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-base">Record Subscription Payment</h3>
                <p className="text-xs text-slate-400">Generate GST Subscription Tax Invoice for Store</p>
              </div>
              <button onClick={() => setIsRecordPaymentModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Store Tenant *</label>
                <select
                  required
                  value={paymentForm.tenant_id}
                  onChange={e => {
                    const selId = Number(e.target.value);
                    const t = tenants.find(tenant => tenant.id === selId);
                    setPaymentForm({
                      ...paymentForm,
                      tenant_id: selId,
                      amount: t ? (t.custom_monthly_fee || t.monthly_fee) : 999
                    });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Plan: {t.plan})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Subscription Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Payment Mode</label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={e => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white uppercase font-mono"
                  >
                    <option value="upi">UPI / QR</option>
                    <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="card">Card / Razorpay</option>
                    <option value="cash">Cash Settlement</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Period Start</label>
                  <input
                    type="date"
                    value={paymentForm.period_start}
                    onChange={e => setPaymentForm({ ...paymentForm, period_start: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Period End (Renew Date)</label>
                  <input
                    type="date"
                    value={paymentForm.period_end}
                    onChange={e => setPaymentForm({ ...paymentForm, period_end: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Bank / UPI Reference No</label>
                <input
                  type="text"
                  placeholder="e.g. UTR-202610080091"
                  value={paymentForm.reference_no}
                  onChange={e => setPaymentForm({ ...paymentForm, reference_no: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRecordPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Issue Invoice & Mark Paid</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Onboard Store Modal (with live rate plans) */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-base">Onboard New Store Tenant</h3>
                <p className="text-xs text-slate-400">Register and configure a new organization workspace</p>
              </div>
              <button onClick={() => setIsOnboardModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleCreateTenant} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="text-slate-300 block mb-1 font-semibold">Store / Business Name *</label>
                  <input
                    type="text"
                    required
                    value={onboardForm.name}
                    onChange={e => setOnboardForm({ ...onboardForm, name: e.target.value })}
                    placeholder="e.g. Apollo Pharmacy, Bharat Kirana Store"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Store Vertical *</label>
                  <select
                    value={onboardForm.business_type}
                    onChange={e => {
                      const type = e.target.value;
                      const isLabType = type === 'lab' || type === 'pharma_lab';
                      const defaultPlanCode = (type === 'impoexpo' || type === 'exim')
                        ? 'enterprise'
                        : (isLabType || type === 'pharma')
                        ? 'pharma_pro'
                        : 'pro';
                      const planMatch = plans.find(p => p.code === defaultPlanCode);
                      setOnboardForm({
                        ...onboardForm,
                        business_type: type,
                        enable_lmis: isLabType || type === 'pharma',
                        plan: defaultPlanCode,
                        monthly_fee: planMatch ? planMatch.monthly_rate : (type === 'impoexpo' ? 1999 : isLabType ? 1299 : 999)
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-medium"
                  >
                    <option value="impoexpo">🌐 ImpoExpo Trade ERP (Global EXIM, Billing & Logistics)</option>
                    <option value="lab">🔬 Clinical Diagnostic Lab & Pathology (LMIS)</option>
                    <option value="pharma_lab">🏥 Integrated Healthcare (Pharma + Lab MIS)</option>
                    <option value="pharma">💊 Pharma / Medical Store</option>
                    <option value="kiryana">🛒 Kiryana / Grocery Store</option>
                    <option value="general">🏬 General Retail</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">SaaS Subscription Rate Plan</label>
                  <select
                    value={onboardForm.plan}
                    onChange={e => {
                      const pCode = e.target.value;
                      const planMatch = plans.find(p => p.code === pCode);
                      setOnboardForm({
                        ...onboardForm,
                        plan: pCode,
                        monthly_fee: planMatch ? planMatch.monthly_rate : 999
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-medium"
                  >
                    {plans.map(p => {
                      const hasLmis = p.features && (Array.isArray(p.features) ? p.features : JSON.parse(p.features || '[]'))
                        .some(f => f.includes('Lab') || f.includes('Diagnostic') || f.includes('Pathology'));
                      return (
                        <option key={p.id} value={p.code}>
                          {p.name} (₹{p.monthly_rate}/mo) {hasLmis ? '• 🧪 LMIS Entitled' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Dedicated LMIS Module Provisioning Card */}
                <div className="sm:col-span-2 p-3.5 bg-gradient-to-r from-rose-950/40 via-slate-900 to-indigo-950/40 border border-rose-500/30 rounded-2xl flex items-center justify-between shadow-lg">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 mt-0.5 shrink-0">
                      <FlaskConical className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-bold text-xs">
                          Clinical Laboratory & Pathology MIS (LMIS)
                        </span>
                        <span className="px-2 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          NABL Ready
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        Automatically provisions 9 NABL Test Master Catalogs (CBC, LFT, KFT, Lipid, HbA1c, Thyroid), 88 Parameters, Phlebotomy Barcodes & Pathology Reports for this store workspace.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                    <input
                      type="checkbox"
                      checked={onboardForm.enable_lmis}
                      onChange={e => setOnboardForm({ ...onboardForm, enable_lmis: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Owner Full Name *</label>
                  <input
                    type="text"
                    required
                    value={onboardForm.owner_name}
                    onChange={e => setOnboardForm({ ...onboardForm, owner_name: e.target.value })}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Owner Email Address *</label>
                  <input
                    type="email"
                    required
                    value={onboardForm.owner_email}
                    onChange={e => setOnboardForm({ ...onboardForm, owner_email: e.target.value })}
                    placeholder="owner@store.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Phone / WhatsApp</label>
                  <input
                    type="tel"
                    value={onboardForm.owner_phone}
                    onChange={e => setOnboardForm({ ...onboardForm, owner_phone: e.target.value })}
                    placeholder="+91 98000 00000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold">Owner Password *</label>
                    <button
                      type="button"
                      onClick={() => setOnboardForm({ ...onboardForm, owner_password: generateRandomPassword() })}
                      className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generate</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={onboardForm.owner_password}
                    onChange={e => setOnboardForm({ ...onboardForm, owner_password: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Fast POS PIN (4 Digits)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={onboardForm.owner_pin}
                    onChange={e => setOnboardForm({ ...onboardForm, owner_pin: e.target.value })}
                    placeholder="1111"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">GSTIN</label>
                  <input
                    type="text"
                    value={onboardForm.gstin}
                    onChange={e => setOnboardForm({ ...onboardForm, gstin: e.target.value })}
                    placeholder="27ABCDE1234F1Z5"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-300 block mb-1 font-semibold">Physical Shop Address</label>
                  <input
                    type="text"
                    value={onboardForm.store_address}
                    onChange={e => setOnboardForm({ ...onboardForm, store_address: e.target.value })}
                    placeholder="Shop address, Street, City"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsOnboardModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-md shadow-sky-600/30 flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Provision Store Tenant</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
