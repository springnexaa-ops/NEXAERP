import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [tenants, setTenants] = useState([]);
  const [currentTenant, setCurrentTenant] = useState(null);
  const [isSuperAdminView, setIsSuperAdminView] = useState(false);
  const [superAdminTab, setSuperAdminTab] = useState('stores');
  const [activeTab, setActiveTab] = useState('pos');
  const [vertical, setVerticalState] = useState('pharma');

  // Authentication & Security State
  const [user, setUser] = useState(null);
  const [isTerminalLocked, setIsTerminalLocked] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isIsolationModalOpen, setIsIsolationModalOpen] = useState(false);

  const [settings, setSettings] = useState({
    store_name: 'Nexa ERP Store',
    phone: '+91 98000 00000',
    gstin: '',
    dl_number: '',
    fssai_number: '',
    upi_id: 'nexa@upi',
    currency_symbol: '₹',
    printer_format: 'thermal80',
    footer_message: 'Thank you for your visit! Powered by Nexa ERP (SpringNexa)'
  });

  const [cart, setCart] = useState([]);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [doctorName, setDoctorName] = useState('');
  const [patientName, setPatientName] = useState('');
  const [heldBillsCount, setHeldBillsCount] = useState(0);
  const [toast, setToast] = useState(null);

  // Background Theme Engine (Defaults to Sky Blue Radiant)
  const [bgTheme, setBgTheme] = useState(() => {
    return localStorage.getItem('nexa_bg_theme') || 'sky-radiant';
  });

  const changeBgTheme = (themeId) => {
    setBgTheme(themeId);
    localStorage.setItem('nexa_bg_theme', themeId);
  };

  useEffect(() => {
    document.body.classList.remove('theme-sky-radiant', 'theme-sky-deep', 'theme-sky-light', 'theme-midnight-slate');
    document.body.classList.add(`theme-${bgTheme}`);
  }, [bgTheme]);

  // Bootstrap SaaS and Check Session
  useEffect(() => {
    bootstrapSaaS();
  }, []);

  const bootstrapSaaS = async () => {
    try {
      const allTenants = await api.getTenants();
      setTenants(allTenants || []);

      // Check current auth session
      if (api.getAuthToken()) {
        try {
          const meData = await api.getMe();
          if (meData?.user) {
            setUser(meData.user);
            if (meData.user.role === 'super_admin') {
              setIsSuperAdminView(true);
            }
          }
        } catch {
          api.setAuthToken(null);
        }
      } else {
        // Default demo login as Super Admin for instant convenience if no session
        try {
          const loginData = await api.login('admin@springnexa.com', 'AdminPassword@123');
          if (loginData?.user) {
            setUser(loginData.user);
            setIsSuperAdminView(true);
          }
        } catch {
          // ignore
        }
      }

      const savedTenantId = api.getActiveTenantId();
      const active = (allTenants && allTenants.find(t => String(t.id) === String(savedTenantId))) || allTenants[0];

      if (active) {
        setCurrentTenant(active);
        setVerticalState(active.business_type || 'pharma');
        api.setActiveTenantId(active.id);
        const defTab = active.business_type === 'impoexpo' ? 'import_export' : (active.business_type === 'lmis' ? 'lab' : 'pos');
        setActiveTab(defTab);
        await loadTenantSettings(active.id);
      }
      updateHeldCount();
    } catch (err) {
      console.error('Failed to bootstrap SaaS:', err);
    }
  };

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setUser(data.user);
    if (data.user.role === 'super_admin') {
      setIsSuperAdminView(true);
    } else if (data.tenant) {
      setCurrentTenant(data.tenant);
      setVerticalState(data.tenant.business_type);
      api.setActiveTenantId(data.tenant.id);
      setIsSuperAdminView(false);
      const defTab = data.tenant.business_type === 'impoexpo' ? 'import_export' : (data.tenant.business_type === 'lmis' ? 'lab' : 'pos');
      setActiveTab(defTab);
      await loadTenantSettings(data.tenant.id);
    }
    showToast(`Signed in as: ${data.user.name} (${data.user.role.toUpperCase()})`, 'success');
    return data;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setIsLoginModalOpen(true);
    showToast('Signed out successfully', 'info');
  };

  const verifyPin = async (pin) => {
    const res = await api.verifyPin(pin, user?.id);
    setIsTerminalLocked(false);
    showToast('Terminal unlocked', 'success');
    return res;
  };

  const loadTenantSettings = async (tenantId) => {
    try {
      const data = await api.getSettings();
      if (data) {
        setSettings(prev => ({
          ...prev,
          ...data,
          store_name: currentTenant ? currentTenant.name : (data.store_name || prev.store_name)
        }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const switchTenant = async (tenantId, targetTab = 'pos') => {
    if (user?.role === 'super_admin') {
      showToast('Access Restricted: Platform administrators cannot access private tenant workspaces.', 'warning');
      setIsSuperAdminView(true);
      return;
    }

    // Strict Tenant Isolation: Organization users are locked to their assigned organization
    if (user && user.tenant_id && Number(tenantId) !== Number(user.tenant_id)) {
      showToast('Tenant Isolation Enforced: Your account is locked strictly to your organization.', 'error');
      return;
    }

    const target = tenants.find(t => String(t.id) === String(tenantId));
    if (!target) return;

    api.setActiveTenantId(target.id);
    setCurrentTenant(target);
    setVerticalState(target.business_type);
    setIsSuperAdminView(false);
    const defTab = target.business_type === 'impoexpo' ? 'import_export' : (target.business_type === 'lmis' ? 'lab' : 'pos');
    setActiveTab(targetTab === 'pos' ? defTab : targetTab);
    clearCart();
    setActiveCustomer(null);

    await loadTenantSettings(target.id);
    updateHeldCount();
    showToast(`Switched workspace to: ${target.name} (${target.business_type.toUpperCase()})`, 'success');
  };

  const onboardTenant = async (tenantData) => {
    try {
      const res = await api.createTenant(tenantData);
      const allTenants = await api.getTenants();
      setTenants(allTenants);

      if (res.tenant && user?.role === 'super_admin') {
        showToast(`Store '${tenantData.name}' onboarded successfully with assigned rate plan!`, 'success');
      } else if (res.tenant) {
        await switchTenant(res.tenant.id);
      }
      return res.tenant;
    } catch (err) {
      showToast(err.message || 'Failed to onboard tenant', 'error');
      throw err;
    }
  };

  const updateHeldCount = async () => {
    try {
      const held = await api.getHeldBills();
      setHeldBillsCount(held?.length || 0);
    } catch {
      // ignore
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const normalizeVertical = (type) => {
    if (!type) return 'pharma';
    const t = String(type).toLowerCase();
    if (t === 'pharma') return 'pharma';
    if (t === 'impoexpo' || t === 'exim') return 'impoexpo';
    if (t === 'lmis' || t === 'lab') return 'lmis';
    return 'general';
  };

  const switchVertical = async (newVertical) => {
    const norm = normalizeVertical(newVertical);
    setVerticalState(norm);
    try {
      await api.updateSettings({ business_type: norm });
      if (currentTenant) {
        setCurrentTenant(prev => ({ ...prev, business_type: norm }));
      }
    } catch (err) {
      console.error('Failed to save vertical in settings:', err);
    }
  };

  const switchERP = async (erpType) => {
    // Organization users cannot switch away from their assigned ERP
    if (user?.role !== 'super_admin') {
      showToast('ERP Edition is locked strictly to your organization.', 'info');
      return;
    }
    const norm = normalizeVertical(erpType);
    let targetTab = 'pos';
    if (norm === 'impoexpo') targetTab = 'import_export';
    else if (norm === 'lmis') targetTab = 'lab';

    const matchingTenant = tenants.find(t => normalizeVertical(t.business_type) === norm);
    if (matchingTenant) {
      await switchTenant(matchingTenant.id, targetTab);
    } else {
      setVerticalState(norm);
      setActiveTab(targetTab);
    }
  };

  const addToCart = (product, selectedBatch = null, qty = 1, isLoose = false) => {
    const batch = selectedBatch || (product.batches && product.batches.length > 0
      ? product.batches.find(b => b.stock_units > 0) || product.batches[0]
      : null);

    const unitPrice = isLoose && product.sub_units_per_pack > 1 && batch
      ? Number((batch.selling_rate / product.sub_units_per_pack).toFixed(2))
      : (batch ? batch.selling_rate : 0);

    const mrp = isLoose && product.sub_units_per_pack > 1 && batch
      ? Number((batch.mrp / product.sub_units_per_pack).toFixed(2))
      : (batch ? batch.mrp : 0);

    setCart(prevCart => {
      const existingIdx = prevCart.findIndex(item =>
        item.product_id === product.id &&
        item.batch_id === (batch ? batch.id : null) &&
        item.is_loose === isLoose
      );

      if (existingIdx >= 0) {
        const next = [...prevCart];
        const currentQty = Number(next[existingIdx].quantity);
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: Number((currentQty + Number(qty)).toFixed(3))
        };
        return next;
      }

      const newItem = {
        product_id: product.id,
        product_name: product.name,
        barcode: product.barcode,
        brand: product.brand,
        hsn_code: product.hsn_code,
        gst_rate: Number(product.gst_rate) || 0,
        salt_composition: product.salt_composition,
        schedule_type: product.schedule_type,
        pack_unit: product.pack_unit,
        unit_type: product.unit_type,
        sub_units_per_pack: product.sub_units_per_pack || 1,
        allow_loose_sale: product.allow_loose_sale,
        is_loose: isLoose,
        batch_id: batch ? batch.id : null,
        batch_number: batch ? batch.batch_number : '',
        expiry_date: batch ? batch.expiry_date : '',
        unit_price: unitPrice,
        mrp: mrp,
        discount: 0,
        quantity: Number(qty)
      };

      return [...prevCart, newItem];
    });

    showToast(`Added ${product.name} to bill`, 'success');
  };

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateCartItem = (index, updates) => {
    setCart(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const clearCart = () => {
    setCart([]);
    setDoctorName('');
    setPatientName('');
  };

  const cartTotals = cart.reduce((acc, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    const disc = Number(item.discount) || 0;
    const lineTotal = (qty * price) - disc;
    const gstRate = Number(item.gst_rate) || 0;
    const gstAmount = (lineTotal * gstRate) / (100 + gstRate);

    acc.subtotal += lineTotal;
    acc.tax += gstAmount;
    acc.discount += disc;
    acc.itemsCount += 1;
    acc.totalQty += qty;
    return acc;
  }, { subtotal: 0, tax: 0, discount: 0, itemsCount: 0, totalQty: 0 });

  const grandTotal = Math.round(cartTotals.subtotal);
  const roundOff = Number((grandTotal - cartTotals.subtotal).toFixed(2));

  return (
    <AppContext.Provider
      value={{
        // Auth & Security
        user,
        login,
        logout,
        verifyPin,
        isTerminalLocked,
        setIsTerminalLocked,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isAuditModalOpen,
        setIsAuditModalOpen,
        isIsolationModalOpen,
        setIsIsolationModalOpen,

        // Multi-Tenant
        tenants,
        currentTenant,
        switchTenant,
        onboardTenant,
        isSuperAdminView,
        setIsSuperAdminView,
        superAdminTab,
        setSuperAdminTab,
        activeTab,
        setActiveTab,
        vertical,
        switchVertical,
        switchERP,
        normalizeVertical,
        settings,
        setSettings,
        cart,
        setCart,
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
        cartTotals: { ...cartTotals, grandTotal, roundOff },
        activeCustomer,
        setActiveCustomer,
        doctorName,
        setDoctorName,
        patientName,
        setPatientName,
        heldBillsCount,
        updateHeldCount,
        toast,
        showToast,
        bgTheme,
        changeBgTheme
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
