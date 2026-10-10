import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../utils/api';
import {
  Users,
  UserPlus,
  KeyRound,
  ShieldCheck,
  Lock,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  UserX,
  Sparkles,
  Eye,
  EyeOff,
  Globe,
  Pill,
  FlaskConical,
  ShoppingCart
} from 'lucide-react';

export function OrganizationUsersScreen() {
  const { currentTenant, vertical, user, showToast } = useApp();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add User Form State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('cashier');
  const [newUserPin, setNewUserPin] = useState('1234');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset Password State
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetPinValue, setResetPinValue] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Copied State
  const [copiedText, setCopiedText] = useState(null);

  // Newly Created User Credential Banner
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const tenantId = currentTenant?.id || user?.tenant_id;
  const normVertical = (vertical || currentTenant?.business_type || 'general').toLowerCase();

  const getErpMeta = () => {
    if (normVertical === 'impoexpo' || normVertical === 'exim') {
      return { title: 'ImpoExpo Trade ERP', icon: Globe, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
    }
    if (normVertical === 'pharma') {
      return { title: 'Pharma ERP', icon: Pill, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    }
    if (normVertical === 'lmis' || normVertical === 'lab') {
      return { title: 'LMIS Pathology ERP', icon: FlaskConical, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
    }
    return { title: 'General Retail ERP', icon: ShoppingCart, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
  };

  const erpMeta = getErpMeta();
  const ErpIcon = erpMeta.icon;

  useEffect(() => {
    if (tenantId) {
      loadUsers();
    }
  }, [tenantId]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getTenantUsers(tenantId);
      setUsers(res.users || []);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to load organization users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = 'Nexa';
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pwd += (Math.floor(Math.random() * 90) + 10);
    return pwd;
  };

  const handleOpenAddModal = () => {
    const randomPwd = generateStrongPassword();
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole(normVertical === 'impoexpo' ? 'cashier' : 'cashier');
    setNewUserPin(String(Math.floor(1000 + Math.random() * 9000)));
    setNewUserPassword(randomPwd);
    setCreatedCredentials(null);
    setIsAddUserModalOpen(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: newUserName.trim(),
        email: newUserEmail.toLowerCase().trim(),
        role: newUserRole,
        password: newUserPassword.trim(),
        pin_code: newUserPin || '1234'
      };

      const res = await api.createTenantUser(tenantId, payload);
      showToast(res.message || 'Organization user created successfully!', 'success');
      setCreatedCredentials({
        name: payload.name,
        email: payload.email,
        password: payload.password,
        role: payload.role,
        pin: payload.pin_code
      });
      setIsAddUserModalOpen(false);
      loadUsers();
    } catch (err) {
      showToast(err.message || 'Failed to create user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenResetModal = (u) => {
    setSelectedUserForReset(u);
    setResetPasswordValue(generateStrongPassword());
    setResetPinValue(u.pin_code || '1234');
  };

  const handleSaveResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedUserForReset || !resetPasswordValue) return;

    setIsResetting(true);
    try {
      await api.setTenantUserPassword(tenantId, selectedUserForReset.id, resetPasswordValue, resetPinValue);
      showToast(`Password updated for ${selectedUserForReset.name}`, 'success');
      setSelectedUserForReset(null);
      loadUsers();
    } catch (err) {
      showToast(err.message || 'Failed to reset password', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleUnlockUser = async (targetUser) => {
    try {
      await api.setTenantUserStatus(tenantId, targetUser.id, 'active', true);
      showToast(`Account unlocked for ${targetUser.name}`, 'success');
      loadUsers();
    } catch (err) {
      showToast(err.message || 'Failed to unlock account', 'error');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (targetUser.id === user?.id) {
      showToast('You cannot delete your own active account.', 'error');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user ${targetUser.name} (${targetUser.email})?`)) {
      return;
    }

    try {
      await api.deleteTenantUser(tenantId, targetUser.id);
      showToast(`User ${targetUser.name} deleted successfully.`, 'info');
      loadUsers();
    } catch (err) {
      showToast(err.message || 'Failed to delete user', 'error');
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
    showToast(`Copied ${label} to clipboard!`, 'info');
  };

  const getRoleLabel = (role) => {
    if (normVertical === 'impoexpo' || normVertical === 'exim') {
      if (role === 'tenant_admin') return { label: 'Director / EXIM Admin', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
      if (role === 'cha_agent') return { label: 'Custom House Agent (CHA Broker)', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
      if (role === 'manager') return { label: 'Trade & Logistics Manager', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
      if (role === 'cashier') return { label: 'Billing & Customs Operator', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      if (role === 'accountant') return { label: 'Forex Accountant', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    } else if (normVertical === 'pharma') {
      if (role === 'tenant_admin') return { label: 'Pharmacy Owner / Admin', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      if (role === 'manager') return { label: 'Store Manager', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
      if (role === 'cashier') return { label: 'Pharmacist / Cashier', badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30' };
    } else if (normVertical === 'lmis' || normVertical === 'lab') {
      if (role === 'tenant_admin') return { label: 'Laboratory Director', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
      if (role === 'pathologist') return { label: 'Senior Pathologist', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      if (role === 'cashier') return { label: 'Phlebotomist / Reception', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
    }
    if (role === 'cha_agent') return { label: 'Custom House Agent (CHA Broker)', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
    if (role === 'tenant_admin') return { label: 'Store Owner / Admin', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
    if (role === 'manager') return { label: 'Store Manager', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    return { label: 'POS Cashier / Operator', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-y-auto select-none p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Organization Users & Staff Accounts
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${erpMeta.color}`}>
                <ErpIcon className="w-3 h-3" />
                {erpMeta.title}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Organization: <strong className="text-slate-200">{currentTenant?.name}</strong> • Workspace #{tenantId}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            title="Refresh Users List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-sky-600/20 active:scale-95 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Generate Organization User</span>
          </button>
        </div>
      </div>

      {/* Newly Created Credentials Banner */}
      {createdCredentials && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 animate-in fade-in space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-300 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>User Account Successfully Provisioned</span>
            </div>
            <button
              onClick={() => setCreatedCredentials(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-slate-300">
            Share these login credentials with <strong className="text-white">{createdCredentials.name}</strong>:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Login Email</span>
              <span className="text-white font-semibold">{createdCredentials.email}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Password</span>
              <span className="text-emerald-400 font-bold">{createdCredentials.password}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Fast PIN</span>
              <span className="text-sky-300 font-bold">{createdCredentials.pin}</span>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(`Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nPIN: ${createdCredentials.pin}`, 'Credentials')}
            className="text-xs px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1.5 transition"
          >
            {copiedText === 'Credentials' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Login Credentials</span>
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-sm text-white">Active Team Members & Logins</h3>
            <p className="text-xs text-slate-400">
              Users belong exclusively to {currentTenant?.name}. Cross-organization access is prohibited.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
            {users.length} Active Accounts
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-7 h-7 text-sky-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading organization team...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No staff members created yet</p>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition"
            >
              + Generate First User Account
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Member Name & Email</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4 text-center">Fast POS PIN</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {users.map(u => {
                  const roleMeta = getRoleLabel(u.role);
                  const isLocked = u.locked_until && new Date(u.locked_until) > new Date();

                  return (
                    <tr key={u.id} className="hover:bg-slate-900/60 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-sm">{u.name}</div>
                        <div className="text-slate-400 font-mono text-[11px]">{u.email}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${roleMeta.badge}`}>
                          {roleMeta.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-300">
                        {u.pin_code || '—'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isLocked ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Locked Out
                          </span>
                        ) : u.status === 'active' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            Suspended
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleString('en-IN') : 'Never'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {isLocked && (
                            <button
                              onClick={() => handleUnlockUser(u)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold text-[11px] transition"
                            >
                              Unlock
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenResetModal(u)}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-400 hover:text-sky-300 border border-slate-800 font-semibold text-[11px] flex items-center gap-1 transition"
                          >
                            <KeyRound className="w-3 h-3" />
                            <span>Reset Password</span>
                          </button>

                          {u.id !== user?.id && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition"
                              title="Delete User"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Generate User */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Generate Organization User</h3>
                  <p className="text-xs text-slate-400">{currentTenant?.name} • {erpMeta.title}</p>
                </div>
              </div>
              <button onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Staff Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Singhania"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Login Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. vikram@transglobalexim.com"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Designated Role *</label>
                  <select
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-semibold"
                  >
                    {normVertical === 'impoexpo' || normVertical === 'exim' ? (
                      <>
                        <option value="tenant_admin">Director / EXIM Admin</option>
                        <option value="cha_agent">Custom House Agent (CHA Broker)</option>
                        <option value="manager">Trade & Logistics Manager</option>
                        <option value="cashier">Billing & Customs Operator</option>
                        <option value="accountant">Forex Accountant</option>
                      </>
                    ) : normVertical === 'pharma' ? (
                      <>
                        <option value="tenant_admin">Pharmacy Admin / Owner</option>
                        <option value="manager">Pharmacy Store Manager</option>
                        <option value="cashier">Pharmacist / Cashier</option>
                        <option value="accountant">Accountant</option>
                      </>
                    ) : normVertical === 'lmis' || normVertical === 'lab' ? (
                      <>
                        <option value="tenant_admin">Laboratory Director</option>
                        <option value="pathologist">Senior Pathologist</option>
                        <option value="manager">Lab Manager</option>
                        <option value="cashier">Phlebotomist / Reception</option>
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
                    value={newUserPin}
                    onChange={e => setNewUserPin(e.target.value)}
                    placeholder="1234"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">Login Password * (min 6 chars)</label>
                  <button
                    type="button"
                    onClick={() => setNewUserPassword(generateStrongPassword())}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Strong Password</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newUserPassword}
                    onChange={e => setNewUserPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono pr-16"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-slate-400 hover:text-white"
                      title={showPassword ? 'Hide' : 'Show'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(newUserPassword, 'Password')}
                      className="p-1 text-slate-400 hover:text-white"
                      title="Copy Password"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-sky-600/30 disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>Generate User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Reset Password */}
      {selectedUserForReset && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-base">Reset User Password</h3>
                <p className="text-xs text-slate-400">{selectedUserForReset.name} ({selectedUserForReset.email})</p>
              </div>
              <button onClick={() => setSelectedUserForReset(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveResetPassword} className="p-6 space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">New Password *</label>
                  <button
                    type="button"
                    onClick={() => setResetPasswordValue(generateStrongPassword())}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Strong Password</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={resetPasswordValue}
                    onChange={e => setResetPasswordValue(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(resetPasswordValue, 'Password')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Fast POS PIN</label>
                <input
                  type="text"
                  maxLength={6}
                  value={resetPinValue}
                  onChange={e => setResetPinValue(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForReset(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-sky-600/30 disabled:opacity-50"
                >
                  {isResetting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                  <span>Save New Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
