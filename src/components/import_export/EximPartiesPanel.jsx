import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  Globe,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  Search,
  Plus,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Landmark,
  ShieldCheck,
  CreditCard,
  Copy,
  Edit2,
  Trash2,
  CheckCircle2,
  Layers,
  Sparkles,
  ArrowLeftRight,
  Compass,
  FileText
} from 'lucide-react';

const COUNTRIES = [
  'India',
  'United Arab Emirates',
  'Germany',
  'United States',
  'United Kingdom',
  'Singapore',
  'China',
  'Saudi Arabia',
  'Japan',
  'Netherlands',
  'Australia',
  'Canada',
  'France',
  'Italy',
  'South Korea',
  'Switzerland'
];

export function EximPartiesPanel() {
  const { currentTenant, currencySymbol, showToast } = useApp();
  const [parties, setParties] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // 'ALL' | 'FOREIGN' | 'INDIAN'
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'GIVER' | 'RECEIVER' | 'ANOTHER_PARTY'
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState(null);

  // Form State
  const [form, setForm] = useState({
    party_name: '',
    party_code: '',
    party_category: 'FOREIGN',
    party_role: 'GIVER',
    country: 'United Arab Emirates',
    tax_id: '',
    iec_number: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    port_code: 'AEJEA',
    currency: 'USD',
    bank_name: '',
    bank_swift_bic: '',
    bank_iban_account: '',
    credit_terms_days: 30,
    notes: ''
  });

  useEffect(() => {
    loadParties();
  }, [categoryFilter, roleFilter, searchQuery]);

  const loadParties = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await api.getEximParties(params);
      setParties(res.parties || []);
      setStats(res.stats || null);
    } catch (err) {
      console.error('Error loading trade parties:', err);
      showToast('Error loading parties directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = (presetRole = 'GIVER', presetCategory = 'FOREIGN') => {
    setEditingParty(null);
    setForm({
      party_name: '',
      party_code: `PRT-${presetCategory.slice(0, 3)}-${Date.now().toString().slice(-4)}`,
      party_category: presetCategory,
      party_role: presetRole,
      country: presetCategory === 'INDIAN' ? 'India' : 'United Arab Emirates',
      tax_id: '',
      iec_number: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      port_code: presetCategory === 'INDIAN' ? 'INNSA' : 'AEJEA',
      currency: presetCategory === 'INDIAN' ? 'INR' : 'USD',
      bank_name: '',
      bank_swift_bic: '',
      bank_iban_account: '',
      credit_terms_days: 30,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (party) => {
    setEditingParty(party);
    setForm({
      party_name: party.party_name || '',
      party_code: party.party_code || '',
      party_category: party.party_category || 'FOREIGN',
      party_role: party.party_role || 'GIVER',
      country: party.country || 'India',
      tax_id: party.tax_id || '',
      iec_number: party.iec_number || '',
      contact_person: party.contact_person || '',
      email: party.email || '',
      phone: party.phone || '',
      address: party.address || '',
      city: party.city || '',
      state: party.state || '',
      postal_code: party.postal_code || '',
      port_code: party.port_code || '',
      currency: party.currency || 'USD',
      bank_name: party.bank_name || '',
      bank_swift_bic: party.bank_swift_bic || '',
      bank_iban_account: party.bank_iban_account || '',
      credit_terms_days: party.credit_terms_days || 30,
      notes: party.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingParty) {
        await api.updateEximParty(editingParty.id, form);
        showToast(`Trade party ${form.party_name} updated!`, 'success');
      } else {
        await api.createEximParty(form);
        showToast(`New trade party ${form.party_name} registered!`, 'success');
      }
      setIsModalOpen(false);
      loadParties();
    } catch (err) {
      showToast(err.message || 'Failed to save trade party', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.deleteEximParty(id);
      showToast(`Party ${name} removed`, 'info');
      loadParties();
    } catch (err) {
      showToast(err.message || 'Failed to delete party', 'error');
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950/80 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-sky-600/30">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/20">
                EXIM Master Registry
              </span>
              <span className="text-[11px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                Foreign & Indian Entity Management
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Trade Parties Directory (Giver, Receiver & Another Party)</h2>
            <p className="text-xs text-slate-400">
              Manage Indian & Foreign suppliers (Givers), buyers (Receivers), and intermediate Notify Parties / secondary consignees
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenAdd('GIVER', 'FOREIGN')}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white px-3.5 py-2 rounded-2xl text-xs font-bold shadow-lg shadow-sky-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Giver (Supplier)</span>
          </button>

          <button
            onClick={() => handleOpenAdd('RECEIVER', 'FOREIGN')}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-3.5 py-2 rounded-2xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Receiver (Buyer)</span>
          </button>

          <button
            onClick={() => handleOpenAdd('ANOTHER_PARTY', 'FOREIGN')}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-3.5 py-2 rounded-2xl text-xs font-bold shadow-lg shadow-purple-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Another Party</span>
          </button>

          <button
            onClick={loadParties}
            disabled={loading}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-2xl border border-slate-800 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 shadow-md">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Entities</div>
            <div className="text-xl font-bold font-mono text-white mt-1">{stats.total}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Master Registry</div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 shadow-md">
            <div className="text-[10px] uppercase font-bold text-sky-400">Foreign Givers</div>
            <div className="text-xl font-bold font-mono text-sky-300 mt-1">{stats.foreign_givers}</div>
            <div className="text-[10px] text-sky-500/70 mt-0.5">Overseas Suppliers</div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 shadow-md">
            <div className="text-[10px] uppercase font-bold text-emerald-400">Foreign Receivers</div>
            <div className="text-xl font-bold font-mono text-emerald-300 mt-1">{stats.foreign_receivers}</div>
            <div className="text-[10px] text-emerald-500/70 mt-0.5">Overseas Buyers</div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 shadow-md">
            <div className="text-[10px] uppercase font-bold text-indigo-400">Indian Givers</div>
            <div className="text-xl font-bold font-mono text-indigo-300 mt-1">{stats.indian_givers}</div>
            <div className="text-[10px] text-indigo-500/70 mt-0.5">Domestic Suppliers</div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 shadow-md">
            <div className="text-[10px] uppercase font-bold text-teal-400">Indian Receivers</div>
            <div className="text-xl font-bold font-mono text-teal-300 mt-1">{stats.indian_receivers}</div>
            <div className="text-[10px] text-teal-500/70 mt-0.5">Domestic Consignees</div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 shadow-md">
            <div className="text-[10px] uppercase font-bold text-purple-400">Another Parties</div>
            <div className="text-xl font-bold font-mono text-purple-300 mt-1">{stats.another_parties}</div>
            <div className="text-[10px] text-purple-500/70 mt-0.5">Notify & Intermediaries</div>
          </div>
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/70 p-4 rounded-3xl border border-slate-800">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search party name, code, tax ID, country, or contact person..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Role & Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Toggle */}
          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1 rounded-xl font-semibold transition ${
                categoryFilter === 'ALL' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Origins
            </button>
            <button
              onClick={() => setCategoryFilter('FOREIGN')}
              className={`px-3 py-1 rounded-xl font-semibold transition ${
                categoryFilter === 'FOREIGN' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Foreign (Overseas)
            </button>
            <button
              onClick={() => setCategoryFilter('INDIAN')}
              className={`px-3 py-1 rounded-xl font-semibold transition ${
                categoryFilter === 'INDIAN' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Indian (Domestic)
            </button>
          </div>

          {/* Role Toggle */}
          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1 rounded-xl font-semibold transition ${
                roleFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Roles
            </button>
            <button
              onClick={() => setRoleFilter('GIVER')}
              className={`px-3 py-1 rounded-xl font-semibold transition ${
                roleFilter === 'GIVER' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Giver (Supplier)
            </button>
            <button
              onClick={() => setRoleFilter('RECEIVER')}
              className={`px-3 py-1 rounded-xl font-semibold transition ${
                roleFilter === 'RECEIVER' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Receiver (Buyer)
            </button>
            <button
              onClick={() => setRoleFilter('ANOTHER_PARTY')}
              className={`px-3 py-1 rounded-xl font-semibold transition ${
                roleFilter === 'ANOTHER_PARTY' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Another Party
            </button>
          </div>
        </div>
      </div>

      {/* Parties Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {parties.map((p) => {
          const isForeign = p.party_category === 'FOREIGN';
          const isGiver = p.party_role === 'GIVER' || p.party_role === 'BOTH';
          const isReceiver = p.party_role === 'RECEIVER' || p.party_role === 'BOTH';
          const isAnother = p.party_role === 'ANOTHER_PARTY';

          let badgeColor = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
          let roleLabel = 'Giver (Supplier)';
          if (isAnother) {
            badgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            roleLabel = 'Another Party (Notify Party)';
          } else if (isReceiver) {
            badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            roleLabel = 'Receiver (Consignee / Buyer)';
          }

          return (
            <div
              key={p.id}
              className="bg-slate-950/80 rounded-3xl border border-slate-800 hover:border-slate-700 p-5 shadow-xl transition space-y-3.5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header: Name, Code & Origin Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                        {roleLabel}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isForeign
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                      }`}>
                        {isForeign ? '🌐 Foreign' : '🇮🇳 Indian'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white tracking-tight leading-snug" title={p.party_name}>
                      {p.party_name}
                    </h3>
                    <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-2">
                      <span className="font-bold text-sky-400">{p.party_code}</span>
                      <span>•</span>
                      <span>{p.country}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      title="Edit Party"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.party_name)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                      title="Delete Party"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Tax ID, IEC & Port */}
                <div className="bg-slate-900/60 p-2.5 rounded-2xl border border-slate-850 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      {isForeign ? 'Tax ID / VAT' : 'GSTIN / PAN'}
                    </span>
                    <div className="flex items-center space-x-1 font-mono font-bold text-white">
                      <span>{p.tax_id || 'N/A'}</span>
                      {p.tax_id && (
                        <button
                          onClick={() => copyToClipboard(p.tax_id, 'Tax ID')}
                          className="text-slate-500 hover:text-sky-400"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Port of Operation</span>
                    <span className="font-mono text-sky-300 font-semibold">{p.port_code || 'INNSA'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Settlement Currency</span>
                    <span className="font-mono text-emerald-400 font-bold">{p.currency} ({p.credit_terms_days} Days Credit)</span>
                  </div>
                </div>

                {/* Address & Contact */}
                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex items-start space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{p.address}, {p.city} {p.postal_code}</span>
                  </div>

                  {p.contact_person && (
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{p.contact_person} {p.phone ? `(${p.phone})` : ''}</span>
                    </div>
                  )}

                  {p.email && (
                    <div className="flex items-center space-x-1.5 font-mono text-[11px] text-slate-400">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{p.email}</span>
                    </div>
                  )}
                </div>

                {/* Bank Details */}
                {p.bank_name && (
                  <div className="p-2 rounded-xl bg-slate-900/40 border border-slate-850 text-[11px] text-slate-400 font-mono space-y-0.5">
                    <div className="flex items-center space-x-1 text-slate-300 font-semibold">
                      <Landmark className="w-3 h-3 text-sky-400" />
                      <span className="truncate">{p.bank_name}</span>
                    </div>
                    {p.bank_swift_bic && <div>SWIFT: <span className="text-white font-bold">{p.bank_swift_bic}</span></div>}
                    {p.bank_iban_account && <div className="truncate">IBAN: <span className="text-white">{p.bank_iban_account}</span></div>}
                  </div>
                )}
              </div>

              {/* Card Footer Status */}
              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-500 font-mono">
                  {p.notes ? `Note: ${p.notes.slice(0, 35)}...` : 'Active Trade Account'}
                </span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  Verified Active
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add / Edit Trade Party */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingParty ? 'Edit Trade Party' : 'Register New Trade Party'}
                  </h3>
                  <p className="text-xs text-slate-400">Configure Indian / Foreign Giver, Receiver, or Another Party (Notify Party)</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: Party Role & Origin Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Party Role / Direction *</label>
                  <select
                    value={form.party_role}
                    onChange={(e) => setForm({ ...form, party_role: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-bold"
                  >
                    <option value="GIVER">📤 GIVER (Supplier / Shipper / Consignor / Manufacturer)</option>
                    <option value="RECEIVER">📥 RECEIVER (Buyer / Consignee / Customer / Importer)</option>
                    <option value="ANOTHER_PARTY">🔄 ANOTHER PARTY (Notify Party / Intermediate Consignee / Agent)</option>
                    <option value="BOTH">↔️ BOTH (Dual Giver & Receiver)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Jurisdiction / Origin *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, party_category: 'FOREIGN', country: form.country === 'India' ? 'United Arab Emirates' : form.country, currency: 'USD' })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                        form.party_category === 'FOREIGN'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>🌐 Foreign (Overseas)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, party_category: 'INDIAN', country: 'India', currency: 'INR' })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                        form.party_category === 'INDIAN'
                          ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>🇮🇳 Indian (Domestic)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Name, Code & Country */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Legal Entity / Company Name *</label>
                  <input
                    type="text"
                    required
                    value={form.party_name}
                    onChange={(e) => setForm({ ...form, party_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-bold"
                    placeholder="e.g. Al-Bahar Foodstuff LLC or Merck KGaA"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Party Short Code</label>
                  <input
                    type="text"
                    value={form.party_code}
                    onChange={(e) => setForm({ ...form, party_code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                    placeholder="e.g. ALBAHAR-DXB"
                  />
                </div>
              </div>

              {/* Row 3: Country, Tax ID & IEC */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Country *</label>
                  <select
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {form.party_category === 'INDIAN' ? 'GSTIN / PAN' : 'VAT ID / Tax Reg / TRN'}
                  </label>
                  <input
                    type="text"
                    value={form.tax_id}
                    onChange={(e) => setForm({ ...form, tax_id: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                    placeholder={form.party_category === 'INDIAN' ? 'e.g. 27AAACT9921E1Z8' : 'e.g. TRN 10029814400003'}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {form.party_category === 'INDIAN' ? 'IEC Code (DGFT)' : 'Overseas Business Reg #' }
                  </label>
                  <input
                    type="text"
                    value={form.iec_number}
                    onChange={(e) => setForm({ ...form, iec_number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                    placeholder="e.g. 0508012349"
                  />
                </div>
              </div>

              {/* Row 4: Port, Currency & Credit Terms */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Customs Port Code (POL/POD)</label>
                  <input
                    type="text"
                    value={form.port_code}
                    onChange={(e) => setForm({ ...form, port_code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                    placeholder="e.g. INNSA, AEJEA, DEHAM"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="AED">AED (د.إ)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="SGD">SGD (S$)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="CNY">CNY (¥)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Credit Terms (Days)</label>
                  <input
                    type="number"
                    value={form.credit_terms_days}
                    onChange={(e) => setForm({ ...form, credit_terms_days: parseInt(e.target.value) || 30 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              {/* Row 5: Corporate Address */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Corporate Registered Address *</label>
                <textarea
                  required
                  rows="2"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  placeholder="Street address, building, industrial zone..."
                />
              </div>

              {/* Row 6: City, State, Postal Code */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">State / Province</label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Postal / ZIP Code</label>
                  <input
                    type="text"
                    value={form.postal_code}
                    onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              {/* Row 7: Contact Person, Phone, Email */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={form.contact_person}
                    onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Official Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Official Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              {/* Row 8: Bank SWIFT/BIC & IBAN */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-850">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={form.bank_name}
                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">SWIFT / BIC Code</label>
                  <input
                    type="text"
                    value={form.bank_swift_bic}
                    onChange={(e) => setForm({ ...form, bank_swift_bic: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">IBAN / Account #</label>
                  <input
                    type="text"
                    value={form.bank_iban_account}
                    onChange={(e) => setForm({ ...form, bank_iban_account: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow-lg shadow-sky-600/30 transition flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingParty ? 'Save Changes' : 'Register Trade Party'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
