import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';
import {
  Tag,
  Gift,
  Plus,
  RefreshCw,
  Percent,
  Coins,
  CheckCircle2,
  Users,
  Search,
  Award,
  Sparkles
} from 'lucide-react';

export function PromotionsScreen() {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState('coupons'); // 'coupons' | 'loyalty'
  const [promotions, setPromotions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Coupon Modal
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    title: '',
    discount_type: 'PERCENTAGE', // 'PERCENTAGE' | 'FLAT'
    discount_value: '',
    min_order_amount: 0,
    max_discount: 0
  });

  // Test coupon simulator
  const [testCode, setTestCode] = useState('');
  const [testSubtotal, setTestSubtotal] = useState(1000);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [promos, custs] = await Promise.all([
        api.getPromotions(),
        api.getCustomers()
      ]);
      setPromotions(promos || []);
      setCustomers(custs || []);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to load promotions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.title || !couponForm.discount_value) {
      showToast('Please fill all required coupon fields', 'error');
      return;
    }

    try {
      await api.createPromotion(couponForm);
      showToast(`Coupon ${couponForm.code.toUpperCase()} created!`, 'success');
      setIsCouponModalOpen(false);
      setCouponForm({
        code: '',
        title: '',
        discount_type: 'PERCENTAGE',
        discount_value: '',
        min_order_amount: 0,
        max_discount: 0
      });
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to create coupon', 'error');
    }
  };

  const handleTestCoupon = async () => {
    if (!testCode) return;
    try {
      const res = await api.applyCoupon(testCode, testSubtotal);
      setTestResult(res);
      showToast(res.message, 'success');
    } catch (err) {
      setTestResult({ error: err.message });
      showToast(err.message, 'error');
    }
  };

  const totalPoints = customers.reduce((sum, c) => sum + (c.loyalty_points || 0), 0);
  const totalPointsValue = totalPoints * 0.5; // ₹0.50 per point

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Promotions, Coupons & Loyalty Program
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Growth Engine
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Manage discount campaigns, festive promo codes and customer cashback reward balances
            </p>
          </div>
        </div>

        {/* View Switchers */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('coupons')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'coupons'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Promo Coupons
            </button>
            <button
              onClick={() => setActiveTab('loyalty')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'loyalty'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Loyalty Points
            </button>
          </div>

          <button
            onClick={() => setIsCouponModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Coupon</span>
          </button>

          <button
            onClick={loadData}
            title="Refresh"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Coupons</span>
            <Tag className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {promotions.length}
          </div>
          <div className="text-[10px] text-purple-400 font-mono mt-0.5">Discounts enabled</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Loyalty Points Issued</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400 mt-1 font-mono">
            {totalPoints.toLocaleString('en-IN')} pts
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Across {customers.length} customers</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Points Cash Value</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
            {formatCurrency(totalPointsValue)}
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">1 Point = ₹0.50 cash discount</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Customer Retention</span>
            <Sparkles className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-sky-400 mt-1">
            Tier-1 Active
          </div>
          <div className="text-[10px] text-sky-400 font-mono mt-0.5">Automatic points on billing</div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {activeTab === 'coupons' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left 2 Cols: Coupons Table */}
            <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
              <div className="p-3 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Active Campaign Coupons</span>
                <span className="text-xs text-slate-400">{promotions.length} coupons</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-semibold">
                      <th className="p-3">Coupon Code</th>
                      <th className="p-3">Campaign Title</th>
                      <th className="p-3">Discount</th>
                      <th className="p-3">Min Order</th>
                      <th className="p-3">Max Cap</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {promotions.length > 0 ? (
                      promotions.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="p-3 font-mono font-bold text-purple-400 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" />
                            {p.code}
                          </td>
                          <td className="p-3 font-semibold text-white">{p.title}</td>
                          <td className="p-3 font-mono font-bold text-emerald-400">
                            {p.discount_type === 'PERCENTAGE' ? `${p.discount_value}% OFF` : `₹${p.discount_value} FLAT`}
                          </td>
                          <td className="p-3 font-mono text-slate-400">
                            {p.min_order_amount > 0 ? formatCurrency(p.min_order_amount) : 'None'}
                          </td>
                          <td className="p-3 font-mono text-slate-400">
                            {p.max_discount > 0 ? formatCurrency(p.max_discount) : 'Unlimited'}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              ACTIVE
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-10 text-slate-500">
                          No coupon codes created yet. Click "Create Coupon" to launch a campaign.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right 1 Col: Test Coupon Calculator */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-400" />
                  Test Coupon
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Verify discount calculation against a cart subtotal
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Coupon Code</label>
                    <input
                      type="text"
                      placeholder="e.g. WELCOME10"
                      value={testCode}
                      onChange={(e) => setTestCode(e.target.value.toUpperCase())}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Cart Subtotal (₹)</label>
                    <input
                      type="number"
                      value={testSubtotal}
                      onChange={(e) => setTestSubtotal(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs"
                    />
                  </div>

                  <button
                    onClick={handleTestCoupon}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-purple-600/20"
                  >
                    Calculate Discount
                  </button>
                </div>

                {testResult && (
                  <div className={`mt-4 p-3 rounded-xl border text-xs ${
                    testResult.valid
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                  }`}>
                    {testResult.valid ? (
                      <div className="space-y-1">
                        <div className="font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Valid Promotion Applied!
                        </div>
                        <div className="text-slate-300">Discount: <span className="font-mono font-bold text-emerald-400">₹{testResult.discountAmount}</span></div>
                        <div className="text-slate-300">Final Bill: <span className="font-mono font-bold text-white">₹{(testSubtotal - testResult.discountAmount).toFixed(2)}</span></div>
                      </div>
                    ) : (
                      <div>{testResult.error}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Customer Loyalty Leaderboard */
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-3 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Customer Loyalty Rewards & Cash Points</span>
              <span className="text-xs text-slate-400">{customers.length} registered customers</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-semibold">
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3 text-right">Points Earned</th>
                    <th className="p-3 text-right">Redeemable Cash (₹)</th>
                    <th className="p-3">Loyalty Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {customers.length > 0 ? (
                    customers.map((c) => {
                      const pts = c.loyalty_points || 0;
                      const val = pts * 0.5;
                      const tier = pts > 500 ? 'Platinum VIP' : pts > 200 ? 'Gold Club' : 'Silver Member';
                      return (
                        <tr key={c.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="p-3 font-semibold text-white flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-300 font-bold flex items-center justify-center text-[10px]">
                              {c.name.charAt(0)}
                            </div>
                            {c.name}
                          </td>
                          <td className="p-3 text-slate-400 font-mono">{c.phone || '-'}</td>
                          <td className="p-3 text-right font-mono font-bold text-amber-400">
                            {pts} pts
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-400">
                            {formatCurrency(val)}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              pts > 500
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                : pts > 200
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {tier}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-10 text-slate-500">
                        No customers found in ledger.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Coupon Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-purple-400" />
                Create Promotional Coupon
              </h2>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FESTIVE20, DIWALI500, PHARMA10"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono uppercase font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Campaign Description / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Festival 20% Off Storewide"
                  value={couponForm.title}
                  onChange={(e) => setCouponForm({ ...couponForm, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Discount Type</label>
                  <select
                    value={couponForm.discount_type}
                    onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Cash (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    {couponForm.discount_type === 'PERCENTAGE' ? 'Discount % *' : 'Discount ₹ *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder={couponForm.discount_type === 'PERCENTAGE' ? '10' : '100'}
                    value={couponForm.discount_value}
                    onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Min Order Value (₹)</label>
                  <input
                    type="number"
                    value={couponForm.min_order_amount}
                    onChange={(e) => setCouponForm({ ...couponForm, min_order_amount: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    value={couponForm.max_discount}
                    onChange={(e) => setCouponForm({ ...couponForm, max_discount: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-600/30"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
