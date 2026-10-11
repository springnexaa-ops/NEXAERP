import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useApp } from '../../context/AppContext';
import {
  Anchor,
  Plane,
  TrainTrack,
  Building,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Star,
  Edit2,
  Trash2,
  Phone,
  Mail,
  ExternalLink,
  ShieldCheck,
  Globe,
  X,
  Filter,
  Layers
} from 'lucide-react';

export function PortsManagementPanel() {
  const { showToast } = useApp();
  const [ports, setPorts] = useState([]);
  const [stats, setStats] = useState({ total: 0, sea: 0, air: 0, icd: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPort, setEditingPort] = useState(null);

  // Form State
  const [form, setForm] = useState({
    port_code: '',
    port_name: '',
    port_type: 'SEA',
    customs_zone: '',
    custodian: '',
    icegate_enabled: 1,
    cfs_names: '',
    edi_version: 'ICEGATE 2.0',
    contact_phone: '',
    contact_email: '',
    is_default: 0
  });

  useEffect(() => {
    loadPorts();
  }, [selectedType]);

  const loadPorts = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomsPorts({
        search: searchQuery,
        type: selectedType === 'all' ? undefined : selectedType
      });
      setPorts(res.ports || []);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      console.error('Failed to load customs ports:', err);
      showToast('Failed to load customs ports directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadPorts();
  };

  const handleOpenAddModal = () => {
    setForm({
      port_code: '',
      port_name: '',
      port_type: 'SEA',
      customs_zone: '',
      custodian: '',
      icegate_enabled: 1,
      cfs_names: '',
      edi_version: 'ICEGATE 2.0',
      contact_phone: '',
      contact_email: '',
      is_default: 0
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (port) => {
    setEditingPort(port);
    setForm({
      port_code: port.port_code,
      port_name: port.port_name,
      port_type: port.port_type,
      customs_zone: port.customs_zone || '',
      custodian: port.custodian || '',
      icegate_enabled: port.icegate_enabled ? 1 : 0,
      cfs_names: port.cfs_names || '',
      edi_version: port.edi_version || 'ICEGATE 2.0',
      contact_phone: port.contact_phone || '',
      contact_email: port.contact_email || '',
      is_default: port.is_default ? 1 : 0
    });
  };

  const handleCreatePort = async (e) => {
    e.preventDefault();
    if (!form.port_code || !form.port_name) {
      showToast('Please enter both Port Code and Port Name', 'error');
      return;
    }
    try {
      await api.createCustomsPort(form);
      showToast(`Customs Port ${form.port_code.toUpperCase()} registered successfully!`, 'success');
      setIsAddModalOpen(false);
      loadPorts();
    } catch (err) {
      showToast(err.message || 'Failed to add customs port', 'error');
    }
  };

  const handleUpdatePort = async (e) => {
    e.preventDefault();
    if (!editingPort) return;
    try {
      await api.updateCustomsPort(editingPort.id, form);
      showToast(`Customs Port ${form.port_code.toUpperCase()} updated successfully!`, 'success');
      setEditingPort(null);
      loadPorts();
    } catch (err) {
      showToast(err.message || 'Failed to update customs port', 'error');
    }
  };

  const handleSetDefault = async (portId, portCode) => {
    try {
      await api.setDefaultCustomsPort(portId);
      showToast(`${portCode} is now your default gateway port`, 'success');
      loadPorts();
    } catch (err) {
      showToast(err.message || 'Failed to set default port', 'error');
    }
  };

  const handleDeletePort = async (portId, portCode) => {
    if (!window.confirm(`Are you sure you want to remove customs port ${portCode}?`)) return;
    try {
      await api.deleteCustomsPort(portId);
      showToast(`Port ${portCode} removed from directory`, 'success');
      loadPorts();
    } catch (err) {
      showToast(err.message || 'Failed to remove port', 'error');
    }
  };

  const getPortTypeBadge = (type) => {
    switch (type) {
      case 'SEA':
        return {
          label: 'Sea Port',
          icon: <Anchor className="w-3.5 h-3.5 text-sky-400" />,
          color: 'bg-sky-500/10 text-sky-300 border-sky-500/30'
        };
      case 'AIR':
        return {
          label: 'Air Cargo',
          icon: <Plane className="w-3.5 h-3.5 text-indigo-400" />,
          color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
        };
      case 'ICD':
        return {
          label: 'ICD Dry Port',
          icon: <TrainTrack className="w-3.5 h-3.5 text-amber-400" />,
          color: 'bg-amber-500/10 text-amber-300 border-amber-500/30'
        };
      case 'SEZ':
        return {
          label: 'SEZ Port',
          icon: <Building className="w-3.5 h-3.5 text-purple-400" />,
          color: 'bg-purple-500/10 text-purple-300 border-purple-500/30'
        };
      default:
        return {
          label: type,
          icon: <Globe className="w-3.5 h-3.5 text-emerald-400" />,
          color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
        };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950/30 p-5 rounded-3xl border border-sky-500/20 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
              <Anchor className="w-3 h-3 text-sky-400" /> ICEGATE UNECE Port Directory
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Customs Clearance Gateways</span>
          </div>
          <h2 className="text-lg font-black text-white mt-1 tracking-tight">
            Customs Ports & Inland Container Depots (ICDs)
          </h2>
          <p className="text-xs text-slate-400">
            Manage Sea Ports, Air Cargo Terminals, CFS linkages, and set primary discharge/loading ports for Shipping Bills & Bills of Entry
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-600/25 active:scale-98 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Add New Customs Port / ICD</span>
          </button>
        </div>
      </div>

      {/* 2. Statistical Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Registered Ports</span>
            <Globe className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1 font-mono">
            {stats.total || ports.length}
          </div>
          <div className="text-[10px] text-sky-400 mt-0.5">ICEGATE 2.0 Connected</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Sea Ports (Gateways)</span>
            <Anchor className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-300 mt-1 font-mono">
            {stats.sea || ports.filter(p => p.port_type === 'SEA').length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Container & Bulk Terminals</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Air Cargo Terminals</span>
            <Plane className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-300 mt-1 font-mono">
            {stats.air || ports.filter(p => p.port_type === 'AIR').length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Express Air Freight EDI</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Inland Container Depots</span>
            <TrainTrack className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 mt-1 font-mono">
            {stats.icd || ports.filter(p => p.port_type === 'ICD').length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">CONCOR Dry Ports & Rail</div>
        </div>
      </div>

      {/* 3. Search & Type Filtering Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search port code (e.g. INNSA1), name, customs zone, or CFS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-20 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[10px] font-bold"
          >
            Search
          </button>
        </form>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Gateways' },
            { id: 'SEA', label: 'Sea Ports' },
            { id: 'AIR', label: 'Air Cargo' },
            { id: 'ICD', label: 'Dry Ports (ICD)' },
            { id: 'SEZ', label: 'SEZ Terminals' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedType === tab.id
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Ports Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          Loading customs ports directory...
        </div>
      ) : ports.length === 0 ? (
        <div className="p-12 text-center bg-slate-950/60 rounded-3xl border border-dashed border-slate-800 text-slate-400">
          <Anchor className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <div className="font-bold text-white text-sm">No Customs Ports Found</div>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or register a new port.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ports.map((port) => {
            const badge = getPortTypeBadge(port.port_type);
            const isDefault = Number(port.is_default) === 1;

            return (
              <div
                key={port.id}
                className={`p-4 rounded-3xl bg-slate-950/80 border transition flex flex-col justify-between ${
                  isDefault
                    ? 'border-sky-500/60 shadow-lg shadow-sky-950/40'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-white tracking-wider">
                        {port.port_code}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${badge.color}`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>

                    {isDefault && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> DEFAULT PORT
                      </span>
                    )}
                  </div>

                  {/* Port Name & Customs Zone */}
                  <h3 className="font-bold text-sm text-white line-clamp-1">{port.port_name}</h3>
                  <div className="text-[11px] text-sky-400 font-medium mt-0.5">
                    {port.customs_zone || 'Customs Commissionerate'}
                  </div>

                  {/* Custodian & CFS */}
                  <div className="mt-3 space-y-1.5 text-[11px] text-slate-300">
                    {port.custodian && (
                      <div className="flex items-start gap-1.5 text-slate-400">
                        <span className="font-semibold text-slate-400">Custodian:</span>
                        <span className="text-slate-200 line-clamp-1">{port.custodian}</span>
                      </div>
                    )}

                    {port.cfs_names && (
                      <div className="flex items-start gap-1.5 text-slate-400">
                        <span className="font-semibold text-slate-400">CFS Links:</span>
                        <span className="text-slate-300 line-clamp-2 text-[10px]">{port.cfs_names}</span>
                      </div>
                    )}
                  </div>

                  {/* Contact Phone & Email */}
                  {(port.contact_phone || port.contact_email) && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
                      {port.contact_phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{port.contact_phone}</span>
                        </div>
                      )}
                      {port.contact_email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[140px]">{port.contact_email}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    {!isDefault ? (
                      <button
                        onClick={() => handleSetDefault(port.id, port.port_code)}
                        className="text-[11px] font-bold text-slate-400 hover:text-sky-300 flex items-center gap-1 transition"
                      >
                        <Star className="w-3 h-3" />
                        <span>Set as Default</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-sky-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-sky-400" /> Primary Port
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(port)}
                      title="Edit port details"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!isDefault && (
                      <button
                        onClick={() => handleDeletePort(port.id, port.port_code)}
                        title="Delete customs port"
                        className="p-1.5 rounded-lg text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL: ADD CUSTOMS PORT ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-sky-500/30 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8 animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-slate-950 p-5 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-black text-white text-sm flex items-center gap-2">
                  <Anchor className="w-4 h-4 text-sky-400" /> Add New Customs Port / ICD
                </h3>
                <p className="text-[11px] text-slate-400">Register port code for ICEGATE customs clearance</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePort} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Port Code (UNECE / ICEGATE) *</label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    placeholder="e.g. INNSA1, INDEL4"
                    value={form.port_code}
                    onChange={(e) => setForm({ ...form, port_code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Port Gateway Type *</label>
                  <select
                    value={form.port_type}
                    onChange={(e) => setForm({ ...form, port_type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="SEA">Sea Port (Gateway)</option>
                    <option value="AIR">Air Cargo Terminal</option>
                    <option value="ICD">Inland Container Depot (Dry Port)</option>
                    <option value="LCS">Land Customs Station (Border)</option>
                    <option value="SEZ">Special Economic Zone (SEZ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Port / Terminal Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nhava Sheva (JNPT) Container Sea Port"
                  value={form.port_name}
                  onChange={(e) => setForm({ ...form, port_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Customs Commissionerate / Zone</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai Customs Zone II"
                    value={form.customs_zone}
                    onChange={(e) => setForm({ ...form, customs_zone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Port Custodian</label>
                  <input
                    type="text"
                    placeholder="e.g. JNPT / DP World / CONCOR"
                    value={form.custodian}
                    onChange={(e) => setForm({ ...form, custodian: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Connected CFS / Container Depots</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Gateway Distriparks, Allcargo CFS, Ameya CFS"
                  value={form.cfs_names}
                  onChange={(e) => setForm({ ...form, cfs_names: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 22 2724 4000"
                    value={form.contact_phone}
                    onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Customs / CFS Email</label>
                  <input
                    type="email"
                    placeholder="e.g. port.customs@icegate.gov.in"
                    value={form.contact_email}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_default_check"
                  checked={Boolean(form.is_default)}
                  onChange={(e) => setForm({ ...form, is_default: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 bg-slate-900 border-slate-700"
                />
                <label htmlFor="is_default_check" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Set as Primary Gateway Port for Consignments
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold"
                >
                  Save Customs Port
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT CUSTOMS PORT ================= */}
      {editingPort && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-sky-500/30 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8 animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-slate-950 p-5 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-black text-white text-sm flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-sky-400" /> Edit Customs Port ({editingPort.port_code})
                </h3>
                <p className="text-[11px] text-slate-400">Update port details and logistics linkages</p>
              </div>
              <button onClick={() => setEditingPort(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePort} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Port Code</label>
                  <input
                    type="text"
                    disabled
                    value={form.port_code}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Port Type *</label>
                  <select
                    value={form.port_type}
                    onChange={(e) => setForm({ ...form, port_type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="SEA">Sea Port (Gateway)</option>
                    <option value="AIR">Air Cargo Terminal</option>
                    <option value="ICD">Inland Container Depot (Dry Port)</option>
                    <option value="LCS">Land Customs Station (Border)</option>
                    <option value="SEZ">Special Economic Zone (SEZ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Port Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.port_name}
                  onChange={(e) => setForm({ ...form, port_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Customs Zone</label>
                  <input
                    type="text"
                    value={form.customs_zone}
                    onChange={(e) => setForm({ ...form, customs_zone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Custodian</label>
                  <input
                    type="text"
                    value={form.custodian}
                    onChange={(e) => setForm({ ...form, custodian: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Connected CFS / Depots</label>
                <textarea
                  rows="2"
                  value={form.cfs_names}
                  onChange={(e) => setForm({ ...form, cfs_names: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Contact Phone</label>
                  <input
                    type="text"
                    value={form.contact_phone}
                    onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Contact Email</label>
                  <input
                    type="email"
                    value={form.contact_email}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="edit_is_default_check"
                  checked={Boolean(form.is_default)}
                  onChange={(e) => setForm({ ...form, is_default: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 bg-slate-900 border-slate-700"
                />
                <label htmlFor="edit_is_default_check" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Set as Primary Gateway Port for Consignments
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPort(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold"
                >
                  Update Port
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
