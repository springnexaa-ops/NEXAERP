import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useApp } from '../../context/AppContext';
import {
  Globe,
  Ship,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  DollarSign,
  ShieldCheck,
  Trash2,
  ExternalLink,
  Anchor,
  Layers,
  Sparkles,
  X
} from 'lucide-react';

export function EximTradePanel() {
  const { showToast, currencySymbol } = useApp();
  const [shipments, setShipments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [parties, setParties] = useState([]);

  const [tradeFilter, setTradeFilter] = useState('ALL'); // 'ALL', 'IMPORT', 'EXPORT'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasAnotherParty, setHasAnotherParty] = useState(false);
  const [formData, setFormData] = useState({
    trade_type: 'IMPORT',
    partner_name: '',
    partner_country: 'Germany',
    iec_code: '0508012349',
    incoterm: 'CIF',
    invoice_number: '',
    invoice_value: '',
    currency: 'USD',
    exchange_rate: 84.50,
    port_of_loading: '',
    port_of_discharge: 'Nhava Sheva JNPT (INNSA)',
    carrier_name: 'Maersk Line',
    bill_of_lading_no: '',
    container_no: '',
    customs_entry_bill_no: '',
    customs_duty_amount: '',
    hs_tariff_code: '3004.90.99',
    status: 'in_transit',
    eta_date: '',
    notes: '',
    giver_party_name: '',
    giver_party_country: '',
    receiver_party_name: '',
    receiver_party_country: '',
    another_party_name: '',
    another_party_role: 'Notify Party',
    another_party_country: ''
  });

  useEffect(() => {
    loadShipments();
    loadParties();
  }, [tradeFilter, statusFilter, searchTerm]);

  const loadParties = async () => {
    try {
      const data = await api.getEximParties();
      setParties(data.parties || []);
    } catch (err) {
      console.error('Error loading trade parties:', err);
    }
  };

  const loadShipments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (tradeFilter !== 'ALL') params.trade_type = tradeFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const data = await api.getEximShipments(params);
      setShipments(data.shipments || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Error loading EXIM shipments:', err);
      showToast('Failed to load EXIM trade consignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyChange = (curr) => {
    let rate = 84.50;
    if (curr === 'EUR') rate = 92.40;
    else if (curr === 'AED') rate = 23.05;
    else if (curr === 'GBP') rate = 110.20;
    else if (curr === 'SGD') rate = 64.80;
    else if (curr === 'INR') rate = 1.00;

    setFormData(prev => ({
      ...prev,
      currency: curr,
      exchange_rate: rate
    }));
  };

  const handleSelectParty = (partyId) => {
    if (!partyId) return;
    const p = parties.find(x => String(x.id) === String(partyId));
    if (!p) return;

    const isImp = formData.trade_type === 'IMPORT';
    let fxRate = formData.exchange_rate;
    if (p.currency === 'EUR') fxRate = 92.40;
    else if (p.currency === 'AED') fxRate = 23.05;
    else if (p.currency === 'GBP') fxRate = 110.20;
    else if (p.currency === 'SGD') fxRate = 64.80;
    else if (p.currency === 'INR') fxRate = 1.00;
    else if (p.currency === 'USD') fxRate = 84.50;

    setFormData(prev => ({
      ...prev,
      partner_name: p.party_name,
      partner_country: p.country,
      iec_code: p.iec_number || (p.country === 'India' ? '0508012349' : prev.iec_code),
      currency: p.currency || prev.currency,
      exchange_rate: fxRate,
      port_of_loading: isImp ? (p.port_code || prev.port_of_loading) : prev.port_of_loading,
      port_of_discharge: !isImp ? (p.port_code || prev.port_of_discharge) : prev.port_of_discharge,
      giver_party_name: isImp ? p.party_name : prev.giver_party_name,
      giver_party_country: isImp ? p.country : prev.giver_party_country,
      receiver_party_name: !isImp ? p.party_name : prev.receiver_party_name,
      receiver_party_country: !isImp ? p.country : prev.receiver_party_country
    }));
  };

  const handleSelectAnotherParty = (partyId) => {
    if (!partyId) return;
    const p = parties.find(x => String(x.id) === String(partyId));
    if (!p) return;
    setFormData(prev => ({
      ...prev,
      another_party_name: p.party_name,
      another_party_country: p.country,
      another_party_role: p.party_role === 'ANOTHER_PARTY' ? 'Notify Party / Agent' : p.party_role
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.partner_name || !formData.invoice_value) {
        showToast('Please fill all required partner and invoice fields', 'error');
        return;
      }

      const payload = {
        ...formData,
        another_party_name: hasAnotherParty ? formData.another_party_name : null,
        another_party_role: hasAnotherParty ? formData.another_party_role : null,
        another_party_country: hasAnotherParty ? formData.another_party_country : null
      };

      await api.createEximShipment(payload);
      showToast('International trade shipment created successfully', 'success');
      setIsModalOpen(false);
      loadShipments();
    } catch (err) {
      console.error('Error creating shipment:', err);
      showToast(err.message || 'Failed to create shipment', 'error');
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.updateEximShipment(id, { status: newStatus });
      showToast(`Shipment status updated to ${newStatus.replace('_', ' ')}`, 'success');
      loadShipments();
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this EXIM consignment record?')) return;
    try {
      await api.deleteEximShipment(id);
      showToast('Consignment deleted successfully', 'success');
      loadShipments();
    } catch (err) {
      showToast(err.message || 'Failed to delete consignment', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Globe className="w-4 h-4 text-sky-400" />
            <span>EXIM Global Trade & Customs Consignments</span>
          </h3>
          <p className="text-xs text-slate-400">
            Track cross-border pharmaceutical imports, commercial export consignments, customs duties and B/L logistics
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-600/20 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Consignment</span>
        </button>
      </div>

      {/* 2. Top Metric Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Trade Volume (INR)
            </div>
            <div className="text-lg font-black text-white mt-1">
              {currencySymbol} {(stats.totalInrVolume || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center space-x-1">
              <span>Imports + Exports Portfolios</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Customs Duties Sunk
            </div>
            <div className="text-lg font-black text-emerald-400 mt-1">
              {currencySymbol} {(stats.totalDutyPaid || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              BOE & ICEGATE Cleared
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              In Transit Consignments
            </div>
            <div className="text-lg font-black text-sky-400 mt-1 flex items-center space-x-2">
              <span>{stats.inTransitCount || 0}</span>
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              On Sea / Air Cargo Hubs
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Customs Cleared
            </div>
            <div className="text-lg font-black text-teal-400 mt-1">
              {stats.clearedCount || 0} / {stats.totalShipments || 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Delivered to Warehouse
            </div>
          </div>
        </div>
      )}

      {/* 3. Filters & Search */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Trade Type Filter */}
          <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setTradeFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition ${
                tradeFilter === 'ALL' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Trades
            </button>
            <button
              onClick={() => setTradeFilter('IMPORT')}
              className={`px-3 py-1 rounded-lg transition ${
                tradeFilter === 'IMPORT' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Imports (Inward)
            </button>
            <button
              onClick={() => setTradeFilter('EXPORT')}
              className={`px-3 py-1 rounded-lg transition ${
                tradeFilter === 'EXPORT' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Exports (Outward)
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="in_transit">In Transit</option>
            <option value="customs_hold">Customs Hold</option>
            <option value="customs_cleared">Customs Cleared</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search shipment, partner, BL, container..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* 4. Shipments List Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading consignments...</div>
        ) : shipments.length === 0 ? (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-8 text-center">
            <Globe className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-400">No EXIM consignments found</div>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
              Register cross-border import consignments or export orders to track logistics, B/L documentation, and customs clearance.
            </p>
          </div>
        ) : (
          shipments.map(s => {
            const isImport = s.trade_type === 'IMPORT';
            const isCleared = s.status === 'customs_cleared' || s.status === 'delivered';
            const isHold = s.status === 'customs_hold';

            return (
              <div
                key={s.id}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 transition shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  {/* Left Title & Partner */}
                  <div className="flex items-start space-x-3">
                    <div className={`p-2.5 rounded-xl ${
                      isImport ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {isImport ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-white">
                          {s.shipment_number}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                          isImport ? 'bg-sky-500/20 text-sky-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {s.trade_type}
                        </span>
                        <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-bold">
                          Incoterm: {s.incoterm || 'CIF'}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-slate-100 mt-1 flex items-center space-x-2">
                        <span>{s.partner_name}</span>
                        <span className="text-xs text-slate-400 font-normal">({s.partner_country})</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Commercial Totals & Status */}
                  <div className="flex items-center space-x-3 self-end md:self-auto">
                    <div className="text-right">
                      <div className="text-xs font-black text-white">
                        {currencySymbol} {Number(s.total_inr_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {s.currency} {Number(s.invoice_value).toLocaleString()} @ {s.exchange_rate}
                      </div>
                    </div>

                    <div className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center space-x-1.5 ${
                      isCleared
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : isHold
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                    }`}>
                      {isCleared ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : isHold ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                      )}
                      <span className="uppercase">{s.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                {/* Logistics & Customs Meta Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mt-3 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="text-slate-400 text-[10px]">Route</div>
                    <div className="text-slate-200 font-medium truncate mt-0.5">
                      {s.port_of_loading || 'Loading Port'} ➔ {s.port_of_discharge || 'Discharge Port'}
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="text-slate-400 text-[10px]">Carrier & B/L No</div>
                    <div className="text-slate-200 font-mono font-medium truncate mt-0.5">
                      {s.carrier_name || 'Carrier'}: {s.bill_of_lading_no || 'Pending BL'}
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="text-slate-400 text-[10px]">Container / AWB</div>
                    <div className="text-slate-200 font-mono font-medium truncate mt-0.5">
                      {s.container_no || 'LCL / Air cargo'}
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="text-slate-400 text-[10px]">Customs BOE & Duty</div>
                    <div className="text-emerald-400 font-mono font-medium truncate mt-0.5">
                      {s.customs_entry_bill_no || 'BOE-Pending'} ({currencySymbol} {s.customs_duty_amount || 0})
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="text-slate-400 text-[10px]">HS Tariff Code</div>
                    <div className="text-indigo-300 font-mono font-medium truncate mt-0.5">
                      {s.hs_tariff_code || '3004.90.99'}
                    </div>
                  </div>
                </div>

                {/* Another Party Badge (if present) */}
                {s.another_party_name && (
                  <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-wrap items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-2">
                      <span className="text-amber-400 font-bold uppercase text-[10px]">
                        {s.another_party_role || 'Notify Party'} (Another Party):
                      </span>
                      <span className="text-amber-200 font-semibold">{s.another_party_name}</span>
                    </div>
                    {s.another_party_country && (
                      <span className="text-slate-400 font-mono text-[10px]">
                        Country: {s.another_party_country}
                      </span>
                    )}
                  </div>
                )}

                {/* Bottom Actions */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400">
                    {s.eta_date && <span>ETA Arrival: <strong>{s.eta_date}</strong> • </span>}
                    {s.notes && <span>{s.notes}</span>}
                  </div>

                  <div className="flex items-center space-x-2">
                    {!isCleared && (
                      <button
                        onClick={() => updateStatus(s.id, 'customs_cleared')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition flex items-center space-x-1"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>Clear Customs</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition"
                      title="Delete shipment record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Register New Shipment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  <Ship className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Register International Consignment</h3>
                  <p className="text-[11px] text-slate-400">Enter overseas commercial invoice, Incoterms, and logistics data</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              {/* Registered Trade Party Quick Selection */}
              {parties.length > 0 && (
                <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-2xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-indigo-300 text-[11px] font-bold uppercase flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Auto-Fill from Registered Trade Parties</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {parties.length} parties registered
                    </span>
                  </div>
                  <select
                    onChange={(e) => handleSelectParty(e.target.value)}
                    className="w-full bg-slate-900 border border-indigo-700/50 rounded-xl px-3 py-2 text-white text-xs font-semibold"
                    defaultValue=""
                  >
                    <option value="">-- Choose Party to Auto-Populate Details --</option>
                    <optgroup label="Foreign Trade Parties (Giver / Receiver)">
                      {parties.filter(p => p.party_category === 'FOREIGN').map(p => (
                        <option key={p.id} value={p.id}>
                          {p.party_name} ({p.country} • {p.party_role})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Indian Trade Parties (Giver / Receiver)">
                      {parties.filter(p => p.party_category === 'INDIAN').map(p => (
                        <option key={p.id} value={p.id}>
                          {p.party_name} ({p.city || 'India'} • {p.party_role})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              )}

              {/* Row 1: Trade Type & Partner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 text-[11px] font-bold uppercase mb-1">
                    Trade Flow
                  </label>
                  <select
                    value={formData.trade_type}
                    onChange={(e) => setFormData({ ...formData, trade_type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="IMPORT">IMPORT (Inward Foreign)</option>
                    <option value="EXPORT">EXPORT (Outward Foreign)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-400 text-[11px] font-bold uppercase mb-1">
                    Overseas Partner Enterprise *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Merck KGaA or Gulf Healthcare LLC"
                    value={formData.partner_name}
                    onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Row 2: Country, IEC & Incoterm */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 text-[11px] font-bold uppercase mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Germany, USA, UAE"
                    value={formData.partner_country}
                    onChange={(e) => setFormData({ ...formData, partner_country: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] font-bold uppercase mb-1">
                    IEC Code
                  </label>
                  <input
                    type="text"
                    value={formData.iec_code}
                    onChange={(e) => setFormData({ ...formData, iec_code: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] font-bold uppercase mb-1">
                    Incoterm
                  </label>
                  <select
                    value={formData.incoterm}
                    onChange={(e) => setFormData({ ...formData, incoterm: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                    <option value="FOB">FOB (Free on Board)</option>
                    <option value="EXW">EXW (Ex Works)</option>
                    <option value="CFR">CFR (Cost & Freight)</option>
                    <option value="DDP">DDP (Delivered Duty Paid)</option>
                  </select>
                </div>
              </div>

              {/* Multi-Party Section: Another Party (Notify Party / Secondary Consignee / CFS Agent) */}
              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="has_another_party_shipment"
                      checked={hasAnotherParty}
                      onChange={(e) => setHasAnotherParty(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700 focus:ring-amber-500 cursor-pointer"
                    />
                    <label htmlFor="has_another_party_shipment" className="text-slate-300 font-bold text-xs cursor-pointer select-none">
                      Add Another Party (Notify Party / Secondary Consignee / Clearing Agent)
                    </label>
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono">B/L Multi-Party Flow</span>
                </div>

                {hasAnotherParty && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-800 animate-in fade-in duration-150">
                    {parties.length > 0 && (
                      <div>
                        <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                          Select from Registered Parties
                        </label>
                        <select
                          onChange={(e) => handleSelectAnotherParty(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs font-semibold"
                          defaultValue=""
                        >
                          <option value="">-- Choose Registered Party --</option>
                          {parties.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.party_name} ({p.country} • {p.party_role})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="md:col-span-2">
                        <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                          Another Party Enterprise Name *
                        </label>
                        <input
                          type="text"
                          required={hasAnotherParty}
                          placeholder="e.g. Pacific Orient Express Logistics / Gateway CFS"
                          value={formData.another_party_name}
                          onChange={(e) => setFormData({ ...formData, another_party_name: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                          Party Role
                        </label>
                        <select
                          value={formData.another_party_role}
                          onChange={(e) => setFormData({ ...formData, another_party_role: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white font-bold"
                        >
                          <option value="Notify Party">Notify Party</option>
                          <option value="Secondary Consignee">Secondary Consignee</option>
                          <option value="Clearing CHA Partner">Clearing CHA Partner</option>
                          <option value="Intermediate Transshipper">Intermediate Transshipper</option>
                          <option value="CFS Warehouse">CFS Warehouse</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                          Party Country
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Singapore, UAE, India"
                          value={formData.another_party_country}
                          onChange={(e) => setFormData({ ...formData, another_party_country: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 3: Commercial Invoice, Currency & FX Rate */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-slate-400 text-[11px] font-bold uppercase mb-1">
                    Invoice Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 15000"
                    value={formData.invoice_value}
                    onChange={(e) => setFormData({ ...formData, invoice_value: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] font-bold uppercase mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="USD">USD ($ US Dollar)</option>
                    <option value="EUR">EUR (€ Euro)</option>
                    <option value="AED">AED (Dirham)</option>
                    <option value="GBP">GBP (£ British Pound)</option>
                    <option value="SGD">SGD (Singapore Dollar)</option>
                    <option value="INR">INR (₹ Indian Rupee)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] font-bold uppercase mb-1">
                    Forex Exchange Rate
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.exchange_rate}
                    onChange={(e) => setFormData({ ...formData, exchange_rate: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div className="md:col-span-3 text-[11px] text-emerald-400 font-mono flex items-center justify-between pt-1">
                  <span>Computed Domestic Value:</span>
                  <span className="font-bold text-sm">
                    {currencySymbol} {(Number(formData.invoice_value || 0) * Number(formData.exchange_rate || 1)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Row 4: Ports & Logistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[11px] font-bold uppercase mb-1">
                    Port of Loading
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hamburg Port / JFK Cargo"
                    value={formData.port_of_loading}
                    onChange={(e) => setFormData({ ...formData, port_of_loading: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] font-bold uppercase mb-1">
                    Port of Discharge
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Nhava Sheva JNPT (INNSA)"
                    value={formData.port_of_discharge}
                    onChange={(e) => setFormData({ ...formData, port_of_discharge: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Row 5: Carrier, B/L & Container */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 text-[11px] font-bold uppercase mb-1">
                    Carrier / Line
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Maersk / Hapag-Lloyd"
                    value={formData.carrier_name}
                    onChange={(e) => setFormData({ ...formData, carrier_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] font-bold uppercase mb-1">
                    Bill of Lading / AWB
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MAEU-291044"
                    value={formData.bill_of_lading_no}
                    onChange={(e) => setFormData({ ...formData, bill_of_lading_no: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] font-bold uppercase mb-1">
                    Container No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MSKU-89210-4"
                    value={formData.container_no}
                    onChange={(e) => setFormData({ ...formData, container_no: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Row 6: Customs Duty & Tariff */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 text-[11px] font-bold uppercase mb-1">
                    Customs Bill of Entry
                  </label>
                  <input
                    type="text"
                    placeholder="BOE-JNPT-2026-XXXX"
                    value={formData.customs_entry_bill_no}
                    onChange={(e) => setFormData({ ...formData, customs_entry_bill_no: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] font-bold uppercase mb-1">
                    Customs Duty Paid (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 145000"
                    value={formData.customs_duty_amount}
                    onChange={(e) => setFormData({ ...formData, customs_duty_amount: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] font-bold uppercase mb-1">
                    HS Tariff Code
                  </label>
                  <input
                    type="text"
                    value={formData.hs_tariff_code}
                    onChange={(e) => setFormData({ ...formData, hs_tariff_code: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Row 7: ETA Date & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[11px] font-bold uppercase mb-1">
                    ETA Arrival Date
                  </label>
                  <input
                    type="date"
                    value={formData.eta_date}
                    onChange={(e) => setFormData({ ...formData, eta_date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] font-bold uppercase mb-1">
                    Initial Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="in_transit">In Transit / On Water</option>
                    <option value="customs_hold">Customs Inspection Hold</option>
                    <option value="customs_cleared">Customs Cleared</option>
                    <option value="delivered">Delivered to Warehouse</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-sky-600/20"
                >
                  Save Consignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
