import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useApp } from '../../context/AppContext';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ArrowRight,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  Layers,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Percent,
  Coins,
  Receipt,
  Scale
} from 'lucide-react';

export function LandedCostEnginePanel({ activePersona = 'accountant' }) {
  const { currentTenant, currencySymbol, showToast } = useApp();
  const [landedCosts, setLandedCosts] = useState([]);
  const [costStats, setCostStats] = useState(null);
  const [fxLedger, setFxLedger] = useState([]);
  const [fxStats, setFxStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubView, setActiveSubView] = useState('engine'); // 'engine' | 'fx_ledger' | 'schemes'
  const [showComputeModal, setShowComputeModal] = useState(false);

  // Landed Cost Form State
  const [form, setForm] = useState({
    shipment_number: 'SHP-2026-IMP-8821',
    invoice_number: 'INV-SGP-9921',
    currency: 'USD',
    exchange_rate_booking: 84.50,
    exchange_rate_customs: 84.85,
    fob_cif_value_fcy: 45000,
    ocean_air_freight_inr: 185000,
    marine_insurance_inr: 22000,
    terminal_handling_inr: 48000,
    bcd_rate_pct: 7.5,
    igst_rate_pct: 18.0,
    inland_transport_inr: 35000,
    other_clearance_inr: 15000,
    total_quantity: 500,
    selling_rate_unit: 9200,
    allocation_method: 'value_pct'
  });

  const isChaRestricted = activePersona === 'cha_agent';

  useEffect(() => {
    if (!isChaRestricted) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [activePersona]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [costRes, fxRes] = await Promise.all([
        api.getLandedCosts(activePersona).catch(() => ({ records: [], stats: null })),
        api.getFxLedger(activePersona).catch(() => ({ records: [], stats: null }))
      ]);

      setLandedCosts(costRes.records || []);
      setCostStats(costRes.stats || null);
      setFxLedger(fxRes.records || []);
      setFxStats(fxRes.stats || null);
    } catch (err) {
      console.error('Error loading landed costs / fx ledger:', err);
      showToast('Error loading financial calculations', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Live Calculator
  const fxCustoms = Number(form.exchange_rate_customs) || 84.85;
  const fcyVal = Number(form.fob_cif_value_fcy) || 0;
  const assessableCifInr = fcyVal * fxCustoms;
  const bcdInr = (assessableCifInr * (Number(form.bcd_rate_pct) || 0)) / 100;
  const swsInr = bcdInr * 0.10; // 10% SWS on BCD
  const igstAssessable = assessableCifInr + bcdInr + swsInr;
  const igstInr = (igstAssessable * (Number(form.igst_rate_pct) || 0)) / 100;
  const totalCustomsDutyInr = bcdInr + swsInr + igstInr;

  const freightThcInlandInr = (Number(form.ocean_air_freight_inr) || 0) +
    (Number(form.marine_insurance_inr) || 0) +
    (Number(form.terminal_handling_inr) || 0) +
    (Number(form.inland_transport_inr) || 0) +
    (Number(form.other_clearance_inr) || 0);

  const trueTotalLandedCost = assessableCifInr + totalCustomsDutyInr + freightThcInlandInr;
  const qty = Math.max(1, Number(form.total_quantity) || 1);
  const landedCostPerUnit = trueTotalLandedCost / qty;
  const sellRateUnit = Number(form.selling_rate_unit) || 0;
  const grossProfitSpread = sellRateUnit > 0 ? (sellRateUnit - landedCostPerUnit) : 0;
  const grossMarginPct = sellRateUnit > 0 ? ((grossProfitSpread / sellRateUnit) * 100) : 0;

  const handleComputeSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createLandedCost(form, activePersona);
      showToast('True Landed Cost calculated & booked to ledger!', 'success');
      setShowComputeModal(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to save landed cost calculation', 'error');
    }
  };

  if (isChaRestricted) {
    return (
      <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-8 text-center max-w-2xl mx-auto shadow-2xl space-y-4 my-8">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="inline-block bg-red-500/10 text-red-400 text-xs font-mono font-bold px-3 py-1 rounded-full border border-red-500/20">
          RBAC GATEWAY ENFORCEMENT
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">Financial Ledgers Stripped for External CHA</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          In compliance with enterprise security protocols, external Customs House Agents (CHA) are strictly restricted from accessing product landed costs, supplier purchase rates, profit margins, and currency ledger accounts.
        </p>
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 font-mono text-left">
          <div className="text-amber-400 font-bold mb-1">Permitted CHA Interfaces:</div>
          <div>✓ Pre-filing Checklist Verification</div>
          <div>✓ Bill of Entry & Shipping Bill Customs Clearance</div>
          <div>✓ Secure Document Uploads (DMS)</div>
          <div>✓ Ports & ICDs Terminal Directory</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Controls & Persona Indicator */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950/80 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-600/30">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/20">
                Accounts & Finance Tier
              </span>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                Indian Customs Tariff (CBIC)
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">True Landed Cost Engine & FX Ledger</h2>
            <p className="text-xs text-slate-400">
              Distribute ocean freight, marine insurance, THC, BCD, SWS & IGST per SKU for accurate unit costing
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveSubView('engine')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeSubView === 'engine'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Landed Cost Calculator
            </button>
            <button
              onClick={() => setActiveSubView('fx_ledger')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeSubView === 'fx_ledger'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Forex Gain/Loss Ledger
            </button>
            <button
              onClick={() => setActiveSubView('schemes')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeSubView === 'schemes'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Duty Scrips & Drawbacks
            </button>
          </div>

          <button
            onClick={() => setShowComputeModal(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-lg shadow-sky-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Calculation</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-2xl border border-slate-800 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Overview Statistics Cards */}
      {costStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-950/70 p-4 rounded-3xl border border-slate-800 shadow-md">
            <div className="text-[11px] uppercase font-bold text-slate-400">Total CIF Value</div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              ₹{Number(costStats.total_cif_inr || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-sky-400 mt-1">Assessable Customs Value</div>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-3xl border border-slate-800 shadow-md">
            <div className="text-[11px] uppercase font-bold text-slate-400">Total Duty Paid</div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1">
              ₹{Number(costStats.total_duty_inr || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-amber-400/80 mt-1">BCD + SWS + IGST Accrued</div>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-3xl border border-slate-800 shadow-md">
            <div className="text-[11px] uppercase font-bold text-slate-400">Freight & THC Overhead</div>
            <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
              ₹{Number(costStats.total_freight_thc_inr || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-cyan-400/80 mt-1">Ocean, Terminal & CFS</div>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-3xl border border-slate-800 shadow-md">
            <div className="text-[11px] uppercase font-bold text-slate-400">Total Landed Capital</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              ₹{Number(costStats.total_landed_inr || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-emerald-400/80 mt-1">Comprehensive Acquisition Cost</div>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-3xl border border-slate-800 shadow-md">
            <div className="text-[11px] uppercase font-bold text-slate-400">Avg Duty Overhead</div>
            <div className="text-xl font-bold font-mono text-purple-400 mt-1">
              {costStats.avg_duty_overhead_pct}%
            </div>
            <div className="text-[10px] text-purple-400/80 mt-1">Tax burden on CIF baseline</div>
          </div>
        </div>
      )}

      {/* VIEW 1: Landed Cost Engine Table & Calculations */}
      {activeSubView === 'engine' && (
        <div className="bg-slate-950/70 rounded-3xl border border-slate-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Scale className="w-5 h-5 text-sky-400" />
              <span>Consignment Landed Cost Records</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {landedCosts.length} Consignments Computed
            </span>
          </div>

          {landedCosts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No landed cost calculations recorded yet. Click "New Calculation" above to compute your first consignment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
                    <th className="py-3 px-3">Shipment / Invoice</th>
                    <th className="py-3 px-3">FCY & Customs Rate</th>
                    <th className="py-3 px-3">CIF Value (INR)</th>
                    <th className="py-3 px-3">BCD + SWS + IGST</th>
                    <th className="py-3 px-3">Freight & THC</th>
                    <th className="py-3 px-3">Total Landed</th>
                    <th className="py-3 px-3">Cost / Unit</th>
                    <th className="py-3 px-3">Selling / Unit</th>
                    <th className="py-3 px-3">Profit Spread</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {landedCosts.map((item) => {
                    const dutyTotal = (Number(item.basic_customs_duty_inr) || 0) +
                      (Number(item.sws_surcharge_inr) || 0) +
                      (Number(item.igst_tax_inr) || 0);
                    const logisticsTotal = (Number(item.ocean_air_freight_inr) || 0) +
                      (Number(item.terminal_handling_inr) || 0) +
                      (Number(item.inland_transport_inr) || 0) +
                      (Number(item.marine_insurance_inr) || 0);

                    return (
                      <tr key={item.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 px-3">
                          <div className="font-bold text-white font-mono">{item.shipment_number}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{item.invoice_number}</div>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <div className="text-sky-300 font-bold">
                            {item.currency} {Number(item.fob_cif_value_fcy).toLocaleString()}
                          </div>
                          <div className="text-[11px] text-slate-400">@ ₹{item.exchange_rate_customs}</div>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-white">
                          ₹{Number(item.fob_cif_value_inr).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 font-mono text-amber-400">
                          <div>₹{dutyTotal.toLocaleString('en-IN')}</div>
                          <div className="text-[10px] text-slate-400">
                            BCD: ₹{Number(item.basic_customs_duty_inr).toLocaleString('en-IN')}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-cyan-300">
                          ₹{logisticsTotal.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                          ₹{Number(item.total_landed_cost_inr).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-sky-400 bg-sky-500/5 px-2 rounded-lg">
                          ₹{Number(item.landed_cost_per_unit).toFixed(2)}
                          <span className="text-[10px] text-slate-400 block font-normal">
                            ({item.total_quantity} units)
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-slate-300">
                          ₹{Number(item.selling_rate_unit).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {Number(item.gross_profit_spread) >= 0 ? (
                            <span className="text-emerald-400 font-bold flex items-center space-x-1">
                              <TrendingUp className="w-3.5 h-3.5 inline" />
                              <span>+₹{Number(item.gross_profit_spread).toFixed(2)}</span>
                            </span>
                          ) : (
                            <span className="text-red-400 font-bold flex items-center space-x-1">
                              <TrendingDown className="w-3.5 h-3.5 inline" />
                              <span>-₹{Math.abs(Number(item.gross_profit_spread)).toFixed(2)}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Forex Loss/Gain Booking Ledger */}
      {activeSubView === 'fx_ledger' && (
        <div className="space-y-4">
          {fxStats && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950/70 p-4 rounded-3xl border border-slate-800">
                <div className="text-[11px] font-bold uppercase text-slate-400">Total FX Gain Booked</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  +₹{Number(fxStats.total_gains_inr || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-emerald-500/70 mt-1">Appreciation on Export Realization</div>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-3xl border border-slate-800">
                <div className="text-[11px] font-bold uppercase text-slate-400">Total FX Loss Booked</div>
                <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                  -₹{Number(fxStats.total_losses_inr || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-rose-500/70 mt-1">Import Payment Slippage</div>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-3xl border border-slate-800">
                <div className="text-[11px] font-bold uppercase text-slate-400">Net FX Balance</div>
                <div className={`text-xl font-bold font-mono mt-1 ${Number(fxStats.net_fx_inr || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {Number(fxStats.net_fx_inr || 0) >= 0 ? '+' : ''}₹{Number(fxStats.net_fx_inr || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Transferred to P&L Forex Account</div>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-3xl border border-slate-800">
                <div className="text-[11px] font-bold uppercase text-slate-400">Settled Transactions</div>
                <div className="text-xl font-bold font-mono text-purple-400 mt-1">
                  {fxStats.total_transactions || 0} Entries
                </div>
                <div className="text-[10px] text-purple-400/70 mt-1">Bank EEFC & Forward Covers</div>
              </div>
            </div>
          )}

          <div className="bg-slate-950/70 rounded-3xl border border-slate-800 p-5 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
              <Coins className="w-5 h-5 text-indigo-400" />
              <span>Realized Forex Gain / Loss Register</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
                    <th className="py-3 px-3">Shipment / Invoice</th>
                    <th className="py-3 px-3">FCY Amount</th>
                    <th className="py-3 px-3">Booking Rate & INR</th>
                    <th className="py-3 px-3">Settlement Rate & INR</th>
                    <th className="py-3 px-3">Settlement Date</th>
                    <th className="py-3 px-3">Realized P&L Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {fxLedger.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white font-mono">{row.shipment_number}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{row.invoice_number}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-sky-300">
                        {row.currency} {Number(row.fcy_amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <div>₹{row.booking_rate}</div>
                        <div className="text-[11px] text-slate-400">₹{Number(row.booking_inr).toLocaleString('en-IN')}</div>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <div>₹{row.settlement_rate}</div>
                        <div className="text-[11px] text-slate-400">₹{Number(row.settlement_inr).toLocaleString('en-IN')}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {row.settlement_date || 'Pending'}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        {Number(row.fx_gain_loss_inr) >= 0 ? (
                          <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 inline-flex items-center space-x-1">
                            <TrendingUp className="w-3.5 h-3.5 inline mr-1" />
                            Gain: +₹{Number(row.fx_gain_loss_inr).toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20 inline-flex items-center space-x-1">
                            <TrendingDown className="w-3.5 h-3.5 inline mr-1" />
                            Loss: -₹{Math.abs(Number(row.fx_gain_loss_inr)).toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Duty Credit Scrips & Drawbacks */}
      {activeSubView === 'schemes' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-950/70 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                RoDTEP Scrips
              </span>
              <span className="text-xs text-slate-400 font-mono">Active</span>
            </div>
            <h4 className="text-base font-bold text-white">Duty Credit Scrip Balance</h4>
            <div className="text-2xl font-bold font-mono text-emerald-400">₹4,25,000</div>
            <p className="text-xs text-slate-400">
              Remission of Duties and Taxes on Exported Products e-scrip ledger on ICEGATE. Ready for offset against Basic Customs Duty.
            </p>
          </div>

          <div className="bg-slate-950/70 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-xl border border-sky-500/20">
                Advance Authorisation
              </span>
              <span className="text-xs text-slate-400 font-mono">DFIA Master</span>
            </div>
            <h4 className="text-base font-bold text-white">Duty Exemption Utilized</h4>
            <div className="text-2xl font-bold font-mono text-sky-400">₹18,50,000</div>
            <p className="text-xs text-slate-400">
              Duty-free import of raw materials for export production. Export obligation (EO) progress: 74% completed.
            </p>
          </div>

          <div className="bg-slate-950/70 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                Section 74/75 Drawback
              </span>
              <span className="text-xs text-slate-400 font-mono">Pending Bank Credit</span>
            </div>
            <h4 className="text-base font-bold text-white">Customs Duty Drawback (DBK)</h4>
            <div className="text-2xl font-bold font-mono text-amber-400">₹2,84,000</div>
            <p className="text-xs text-slate-400">
              Direct refund of customs duties paid on imported inputs upon export of finished goods, routed to RBI Authorized Dealer account.
            </p>
          </div>
        </div>
      )}

      {/* Modal: New Landed Cost Calculation */}
      {showComputeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Compute True Landed Cost (Per SKU)</h3>
                  <p className="text-xs text-slate-400">Indian Customs formula: Assessable CIF + BCD + SWS + IGST + Freight + Port THC</p>
                </div>
              </div>
              <button
                onClick={() => setShowComputeModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleComputeSubmit} className="space-y-5">
              {/* Row 1: Identifiers & Currency */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Shipment Reference</label>
                  <input
                    type="text"
                    value={form.shipment_number}
                    onChange={(e) => setForm({ ...form, shipment_number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Commercial Invoice #</label>
                  <input
                    type="text"
                    value={form.invoice_number}
                    onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="AED">AED - UAE Dirham</option>
                    <option value="SGD">SGD - Singapore Dollar</option>
                    <option value="CNY">CNY - Chinese Yuan</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Customs Notified FX (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.exchange_rate_customs}
                    onChange={(e) => setForm({ ...form, exchange_rate_customs: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Value, Duty & Taxes */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Invoice Value ({form.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.fob_cif_value_fcy}
                    onChange={(e) => setForm({ ...form, fob_cif_value_fcy: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">BCD Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.bcd_rate_pct}
                    onChange={(e) => setForm({ ...form, bcd_rate_pct: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">SWS (10% of BCD)</label>
                  <input
                    type="text"
                    disabled
                    value={`₹${swsInr.toFixed(2)}`}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">IGST Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.igst_rate_pct}
                    onChange={(e) => setForm({ ...form, igst_rate_pct: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              {/* Row 3: Logistics Overheads */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Ocean/Air Freight (₹)</label>
                  <input
                    type="number"
                    value={form.ocean_air_freight_inr}
                    onChange={(e) => setForm({ ...form, ocean_air_freight_inr: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Marine Insurance (₹)</label>
                  <input
                    type="number"
                    value={form.marine_insurance_inr}
                    onChange={(e) => setForm({ ...form, marine_insurance_inr: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Terminal THC / CFS (₹)</label>
                  <input
                    type="number"
                    value={form.terminal_handling_inr}
                    onChange={(e) => setForm({ ...form, terminal_handling_inr: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Inland Transport (₹)</label>
                  <input
                    type="number"
                    value={form.inland_transport_inr}
                    onChange={(e) => setForm({ ...form, inland_transport_inr: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              {/* Row 4: SKU Allocation & Margin Target */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Total Quantity (Units)</label>
                  <input
                    type="number"
                    value={form.total_quantity}
                    onChange={(e) => setForm({ ...form, total_quantity: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Target Selling Price / Unit (₹)</label>
                  <input
                    type="number"
                    value={form.selling_rate_unit}
                    onChange={(e) => setForm({ ...form, selling_rate_unit: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Cost Allocation Method</label>
                  <select
                    value={form.allocation_method}
                    onChange={(e) => setForm({ ...form, allocation_method: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="value_pct">Value Percentage (Ad-Valorem)</option>
                    <option value="weight">Gross Weight Ratio</option>
                    <option value="quantity">Equal Unit Quantity</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Recalculation Preview Banner */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950/30 p-4 rounded-2xl border border-sky-500/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Assessable CIF</div>
                  <div className="text-sm font-bold font-mono text-white mt-0.5">
                    ₹{assessableCifInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-amber-400 uppercase font-bold">Duty + SWS + IGST</div>
                  <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">
                    ₹{totalCustomsDutyInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-emerald-400 uppercase font-bold">True Landed Cost / SKU</div>
                  <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                    ₹{landedCostPerUnit.toFixed(2)}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-purple-400 uppercase font-bold">Gross Profit Margin</div>
                  <div className="text-sm font-bold font-mono text-purple-400 mt-0.5">
                    +{grossMarginPct.toFixed(1)}% (₹{grossProfitSpread.toFixed(2)})
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowComputeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow-lg shadow-sky-600/30 transition flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Finalize & Book to Relational Ledger</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
