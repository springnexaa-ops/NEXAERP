import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useApp } from '../../context/AppContext';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Lock,
  Key,
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  Sliders,
  FileCheck2,
  History,
  Crown,
  Calculator,
  Truck,
  Anchor
} from 'lucide-react';

const ROLE_DEFINITIONS = [
  {
    role: 'super_admin',
    title: 'Super Admin (Management)',
    icon: Crown,
    color: 'from-amber-500 to-orange-600',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    desc: 'Full system provisioning, workflow overrides, audit logs, and global enterprise configurations.'
  },
  {
    role: 'accountant',
    title: 'Accounts Dept (Accountant)',
    icon: Calculator,
    color: 'from-indigo-500 to-sky-600',
    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    desc: 'True landed cost calculations, Forex loss/gain booking, custom duty payments, and duty drawback ledgers.'
  },
  {
    role: 'logistics',
    title: 'Logistics / Operations Exec',
    icon: Truck,
    color: 'from-cyan-500 to-blue-600',
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    desc: 'PO/SO creation, commercial invoices, container milestone matrix, live demurrage tracking, and freight bookings.'
  },
  {
    role: 'cha_agent',
    title: 'Customs House Agent (CHA Partner)',
    icon: Anchor,
    color: 'from-emerald-500 to-teal-600',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    desc: 'Pre-filing checklist verification, BOE/SB submissions, and clearing document uploads. Internal ledgers stripped.'
  }
];

export function UserProvisioningAuditPanel() {
  const { currentTenant, showToast } = useApp();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New User Form
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'logistics',
    password: 'Password@123',
    pin_code: '1234'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getEximUsers();
      setUsers(res.users || []);
    } catch (err) {
      console.error('Error loading organization users:', err);
      showToast('Error loading users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createEximUser(form);
      showToast(`User ${form.name} provisioned successfully!`, 'success');
      setShowAddModal(false);
      setForm({ name: '', email: '', role: 'logistics', password: 'Password@123', pin_code: '1234' });
      loadUsers();
    } catch (err) {
      showToast(err.message || 'Failed to provision user', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950/80 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-lg border border-purple-500/20">
                System Configuration Tier
              </span>
              <span className="text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md">
                Active Directory / RBAC Gateway
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">User Access Provisioning & RBAC Control</h2>
            <p className="text-xs text-slate-400">
              Provision Super Admin, Accountant, Logistics Executive, and Customs Broker (CHA) credentials
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-lg shadow-purple-600/30 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision User</span>
          </button>

          <button
            onClick={loadUsers}
            disabled={loading}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-2xl border border-slate-800 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Role vs Function Architectural Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ROLE_DEFINITIONS.map(def => {
          const Icon = def.icon;
          const count = users.filter(u => u.role === def.role).length;
          return (
            <div key={def.role} className="bg-slate-950/70 p-4 rounded-3xl border border-slate-800 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${def.color} text-white flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${def.badge}`}>
                  {count} Assigned
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">{def.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{def.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Provisioned Users Table */}
      <div className="bg-slate-950/70 rounded-3xl border border-slate-800 p-5 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-purple-400" />
          <span>Active Organization Users & RBAC Bindings</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
                <th className="py-3 px-3">User & Email</th>
                <th className="py-3 px-3">Persona Role</th>
                <th className="py-3 px-3">Gate PIN</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Last Login</th>
                <th className="py-3 px-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {users.map(u => {
                const def = ROLE_DEFINITIONS.find(d => d.role === u.role) || {
                  title: u.role,
                  badge: 'bg-slate-800 text-slate-300'
                };

                return (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${def.badge}`}>
                        {def.title}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-purple-300">
                      {u.pin_code ? `•••• (${u.pin_code})` : '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {u.status || 'active'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {u.last_login_at || 'Never'}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Provision User */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Provision Organization User</h3>
                  <p className="text-xs text-slate-400">Assign role and credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  placeholder="e.g. Rahul Verma"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Corporate Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  placeholder="e.g. r.verma@transglobalexim.com"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Assign User Role (RBAC Tier)</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="super_admin">👑 Super Admin (Management & Overrides)</option>
                  <option value="accountant">📊 Accounts Dept (Accountant & True Landed Cost)</option>
                  <option value="logistics">🚢 Logistics / Operations Exec (WMS & Tracking)</option>
                  <option value="cha_agent">⚓ Customs House Agent (CHA Partner - Masked)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Quick PIN (POS/Gate)</label>
                  <input
                    type="text"
                    maxLength="6"
                    value={form.pin_code}
                    onChange={(e) => setForm({ ...form, pin_code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-lg shadow-purple-600/30 transition flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Provision Credentials</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
