import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../utils/api';
import { formatCurrency, formatDate, getExpiryStatus } from '../../utils/formatters';
import { QuickPicksGrid } from './QuickPicksGrid';
import { BatchSelectorModal } from './BatchSelectorModal';
import { PaymentModal } from './PaymentModal';
import { HeldBillsModal } from './HeldBillsModal';
import { ReceiptModal } from './ReceiptModal';
import {
  Search,
  Barcode,
  Trash2,
  Plus,
  Minus,
  Pause,
  Play,
  RotateCcw,
  CheckCircle2,
  User,
  Stethoscope,
  Sparkles,
  AlertCircle,
  Pill,
  ShoppingBag,
  Tag
} from 'lucide-react';

export function POSScreen() {
  const {
    vertical,
    cart,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    cartTotals,
    activeCustomer,
    setActiveCustomer,
    doctorName,
    setDoctorName,
    patientName,
    setPatientName,
    updateHeldCount,
    showToast
  } = useApp();

  const [products, setProducts] = useState([]);
  const [quickPicks, setQuickPicks] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [substituteResults, setSubstituteResults] = useState(null);

  // Modals state
  const [batchModalProduct, setBatchModalProduct] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
  const [lastInvoiceData, setLastInvoiceData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const searchInputRef = useRef(null);

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data || []);
      setQuickPicks(data.filter(p => p.is_quick_pick === 1));
    } catch (err) {
      console.error(err);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await api.getCustomers();
      setCustomers(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Keyboard shortcut listener for F-keys and shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F8') {
        e.preventDefault();
        handleHoldBill();
      } else if (e.key === 'F12') {
        e.preventDefault();
        if (cart.length > 0) setIsPaymentModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, activeCustomer]);

  // Live product search & barcode scan detection
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      const q = searchQuery.toLowerCase().trim();

      // Check exact barcode match first (barcode scanner input)
      const exactBarcodeMatch = products.find(p => p.barcode && p.barcode.toLowerCase() === q);
      if (exactBarcodeMatch && q.length >= 6) {
        handleProductSelect(exactBarcodeMatch);
        setSearchQuery('');
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      // Filter products by name, barcode, salt composition (for Pharma) or brand
      const filtered = products.filter(p => {
        return (
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)) ||
          (p.salt_composition && p.salt_composition.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
        );
      });

      setSearchResults(filtered.slice(0, 8));
      setIsSearching(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery, products]);

  const handleProductSelect = (product) => {
    // If Pharma mode and product has multiple batches, open batch selection modal
    if (vertical === 'pharma' && product.batches && product.batches.length > 1) {
      setBatchModalProduct(product);
    } else {
      addToCart(product);
    }
    setSearchQuery('');
    setSearchResults([]);
    setSubstituteResults(null);
  };

  // Substitute salt search (Pharma specific)
  const handleFindSubstitutes = async (product) => {
    if (!product.salt_composition) return;
    try {
      const subs = await api.getSubstitutes(product.salt_composition, product.id);
      setSubstituteResults({ original: product, substitutes: subs });
    } catch (err) {
      console.error(err);
    }
  };

  // Hold current cart
  const handleHoldBill = async () => {
    if (cart.length === 0) {
      showToast('Cart is empty, nothing to hold', 'info');
      return;
    }
    try {
      const refName = activeCustomer ? `Hold - ${activeCustomer.name}` : `Held #${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
      await api.holdBill({
        reference_name: refName,
        cart_data: cart,
        customer_data: activeCustomer
      });
      clearCart();
      setActiveCustomer(null);
      updateHeldCount();
      showToast('Bill held successfully [F8]', 'success');
    } catch (err) {
      showToast('Failed to hold bill', 'error');
    }
  };

  // Recall held cart
  const handleRecallBill = (heldBill) => {
    if (heldBill.cart_data) {
      clearCart();
      heldBill.cart_data.forEach(item => {
        // Re-construct line item
        addToCart(
          {
            id: item.product_id,
            name: item.product_name,
            barcode: item.barcode,
            brand: item.brand,
            hsn_code: item.hsn_code,
            gst_rate: item.gst_rate,
            salt_composition: item.salt_composition,
            schedule_type: item.schedule_type,
            pack_unit: item.pack_unit,
            unit_type: item.unit_type,
            sub_units_per_pack: item.sub_units_per_pack,
            allow_loose_sale: item.allow_loose_sale,
            batches: [{ id: item.batch_id, batch_number: item.batch_number, expiry_date: item.expiry_date, selling_rate: item.unit_price, mrp: item.mrp }]
          },
          { id: item.batch_id, batch_number: item.batch_number, expiry_date: item.expiry_date, selling_rate: item.unit_price, mrp: item.mrp },
          item.quantity,
          item.is_loose
        );
      });
      if (heldBill.customer_data && heldBill.customer_data.id) {
        setActiveCustomer(heldBill.customer_data);
      }
      updateHeldCount();
      showToast('Held bill restored', 'success');
    }
  };

  // Execute Final Checkout
  const handleCompletePayment = async (paymentDetails) => {
    setIsProcessing(true);
    try {
      const payload = {
        customer_id: activeCustomer ? activeCustomer.id : null,
        customer_name: activeCustomer ? activeCustomer.name : 'Walk-in Customer',
        customer_phone: activeCustomer ? activeCustomer.phone : '',
        doctor_name: doctorName || null,
        patient_name: patientName || null,
        items: cart,
        subtotal: cartTotals.subtotal,
        tax_amount: cartTotals.tax,
        discount_amount: cartTotals.discount,
        round_off: cartTotals.roundOff,
        grand_total: cartTotals.grandTotal,
        ...paymentDetails
      };

      const result = await api.checkout(payload);

      setIsProcessing(false);
      setIsPaymentModalOpen(false);
      clearCart();
      loadProducts(); // refresh stock numbers
      loadCustomers(); // refresh customer balances

      // Open printable receipt modal
      setLastInvoiceData(result);
      showToast('Invoice generated successfully! Ready to print.', 'success');
    } catch (err) {
      setIsProcessing(false);
      showToast(err.message || 'Checkout failed', 'error');
    }
  };

  const hasScheduledDrug = cart.some(item => item.schedule_type && item.schedule_type !== 'Regular');

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-slate-900 select-none">
      {/* Left/Main Column: Search, Quick-Picks & Cart Table */}
      <div className="flex-1 flex flex-col h-full border-r border-slate-800 overflow-hidden">
        {/* Search Bar & Barcode Scanner Input */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 space-y-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={
                vertical === 'pharma'
                  ? "Scan Barcode or Search Medicine Name / Salt (e.g. Paracetamol) [F1]..."
                  : "Scan Barcode or Search Item / Brand (e.g. Atta, Oil, Sugar) [F1]..."
              }
              className="w-full pl-10 pr-24 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-400 font-medium focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 shadow-inner"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                <Barcode className="w-3.5 h-3.5 text-sky-400" /> Scanner Auto
              </span>
            </div>
          </div>

          {/* Live Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-800 z-30">
              {searchResults.map(item => {
                const bestBatch = item.batches && item.batches[0];
                const expInfo = bestBatch ? getExpiryStatus(bestBatch.expiry_date) : null;
                const price = bestBatch ? bestBatch.selling_rate : item.min_selling_rate;

                return (
                  <div
                    key={item.id}
                    className="p-3 hover:bg-slate-800/80 flex items-center justify-between cursor-pointer transition-colors"
                    onClick={() => handleProductSelect(item)}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-white">{item.name}</span>
                        {item.schedule_type && item.schedule_type !== 'Regular' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {item.schedule_type}
                          </span>
                        )}
                        {item.is_loose_item === 1 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-emerald-500/20 text-emerald-300">
                            Loose / Kg
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 flex items-center space-x-2">
                        {item.salt_composition && (
                          <span className="text-sky-300/90 font-medium">{item.salt_composition}</span>
                        )}
                        {item.brand && <span>• {item.brand}</span>}
                        {item.barcode && <span className="font-mono text-slate-500">[{item.barcode}]</span>}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-right">
                      {item.salt_composition && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFindSubstitutes(item);
                          }}
                          className="px-2 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center gap-1"
                          title="Find generic/other brand substitutes with same salt"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          <span>Substitutes</span>
                        </button>
                      )}

                      <div>
                        <div className="font-bold font-mono text-sm text-emerald-400">
                          {formatCurrency(price)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Stock: <strong className="text-slate-200">{item.total_stock}</strong> {item.unit_type || 'pcs'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pharma Medicine Substitute Recommendations Panel */}
          {substituteResults && (
            <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Available Substitutes for: <em>"{substituteResults.original.salt_composition}"</em>
                </span>
                <button
                  onClick={() => setSubstituteResults(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {substituteResults.substitutes.length === 0 ? (
                <p className="text-xs text-slate-400">No other brands with this salt in stock.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {substituteResults.substitutes.map(sub => (
                    <div
                      key={sub.id}
                      onClick={() => handleProductSelect(sub)}
                      className="p-2 bg-slate-900 border border-slate-700 rounded-lg flex justify-between items-center cursor-pointer hover:border-indigo-400"
                    >
                      <div>
                        <span className="text-xs font-bold text-white block">{sub.name}</span>
                        <span className="text-[10px] text-slate-400">{sub.brand} • Stock: {sub.total_stock}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-emerald-400">{formatCurrency(sub.min_selling_rate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Picks Shelf */}
        <div className="p-3 pb-0">
          <QuickPicksGrid
            quickPickProducts={quickPicks}
            onSelectProduct={handleProductSelect}
          />
        </div>

        {/* Active Cart Line Items Table */}
        <div className="flex-1 p-3 overflow-hidden flex flex-col">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-inner">
            <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 grid grid-cols-12 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span className="col-span-5">Item Details</span>
              <span className="col-span-3 text-center">Quantity</span>
              <span className="col-span-2 text-right">Rate</span>
              <span className="col-span-2 text-right">Total</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center mb-3 text-slate-600 border border-slate-800">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <p className="font-semibold text-slate-400 text-sm">Active Bill is Empty</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Scan items using barcode scanner, click any quick-pick tile above, or press [F1] to search products.
                  </p>
                </div>
              ) : (
                cart.map((item, index) => {
                  const lineTotal = (Number(item.quantity) * Number(item.unit_price)) - (Number(item.discount) || 0);

                  return (
                    <div
                      key={index}
                      className="px-4 py-2.5 grid grid-cols-12 items-center text-xs hover:bg-slate-900/60 transition-colors"
                    >
                      {/* Name & Metadata */}
                      <div className="col-span-5 pr-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white text-sm line-clamp-1">{item.product_name}</span>
                          {item.is_loose && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-amber-300">
                              Loose Tab
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                          {item.batch_number && (
                            <span className="font-mono text-slate-300">B: {item.batch_number}</span>
                          )}
                          {item.expiry_date && (
                            <span className="text-slate-400">Exp: {formatDate(item.expiry_date)}</span>
                          )}
                          {item.gst_rate > 0 && (
                            <span className="text-slate-500 font-mono">GST {item.gst_rate}%</span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="col-span-3 flex items-center justify-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity <= 1) {
                              removeFromCart(index);
                            } else {
                              updateCartItem(index, { quantity: Number((item.quantity - 1).toFixed(3)) });
                            }
                          }}
                          className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step={item.unit_type === 'kg' ? "0.05" : "1"}
                          value={item.quantity}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            if (val <= 0) {
                              removeFromCart(index);
                            } else {
                              updateCartItem(index, { quantity: val });
                            }
                          }}
                          className="w-14 bg-slate-900 border border-slate-700 rounded-md py-1 text-center font-bold font-mono text-white text-xs focus:outline-none focus:border-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => updateCartItem(index, { quantity: Number((item.quantity + 1).toFixed(3)) })}
                          className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>

                      {/* Unit Price */}
                      <div className="col-span-2 text-right font-mono">
                        <span className="text-white font-bold">{formatCurrency(item.unit_price)}</span>
                        {item.mrp > item.unit_price && (
                          <div className="text-[10px] text-slate-500 line-through">
                            {formatCurrency(item.mrp)}
                          </div>
                        )}
                      </div>

                      {/* Total & Remove */}
                      <div className="col-span-2 flex items-center justify-end space-x-2">
                        <span className="font-bold font-mono text-emerald-400 text-sm">
                          {formatCurrency(lineTotal)}
                        </span>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded-md transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Customer Khata, Pharma Prescriptions & Settle Panel */}
      <div className="w-full lg:w-80 bg-slate-950 p-4 flex flex-col justify-between shrink-0 border-t lg:border-t-0 select-none overflow-y-auto">
        <div className="space-y-4">
          {/* Customer Selection (Khata Udhar integration) */}
          <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-400" />
                Customer Account
              </label>
              {activeCustomer && (
                <button
                  onClick={() => setActiveCustomer(null)}
                  className="text-[10px] text-rose-400 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            <select
              value={activeCustomer ? activeCustomer.id : ''}
              onChange={e => {
                const cId = Number(e.target.value);
                const selected = customers.find(c => c.id === cId) || null;
                setActiveCustomer(selected);
              }}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-sky-500"
            >
              <option value="">Walk-in Customer (No Khata)</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.current_balance > 0 ? `(Udhar: ₹${c.current_balance})` : ''}
                </option>
              ))}
            </select>

            {activeCustomer && (
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-mono text-slate-200">{activeCustomer.phone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Udhar:</span>
                  <span className={`font-bold font-mono ${activeCustomer.current_balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {formatCurrency(activeCustomer.current_balance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Credit Limit:</span>
                  <span className="font-mono text-slate-300">{formatCurrency(activeCustomer.credit_limit)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Pharma Mode Doctor & Prescription Details */}
          {vertical === 'pharma' && (
            <div className={`p-3 rounded-2xl border transition-all ${
              hasScheduledDrug
                ? 'bg-rose-950/20 border-rose-500/40'
                : 'bg-slate-900/90 border-slate-800'
            } space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-rose-400" />
                  Prescription Details
                </span>
                {hasScheduledDrug && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Schedule H in Cart
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Doctor Name (e.g. Dr. V. K. Mehta)"
                  value={doctorName}
                  onChange={e => setDoctorName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
                <input
                  type="text"
                  placeholder="Patient Name"
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          )}

          {/* Bill Summary Calculations */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2 text-xs font-medium">
            <div className="flex justify-between text-slate-400">
              <span>Items / Total Units:</span>
              <span className="font-mono text-slate-200">
                {cartTotals.itemsCount} items ({cartTotals.totalQty} qty)
              </span>
            </div>

            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono text-slate-200">{formatCurrency(cartTotals.subtotal)}</span>
            </div>

            {cartTotals.tax > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>GST Tax Incl:</span>
                <span className="font-mono text-slate-300">{formatCurrency(cartTotals.tax)}</span>
              </div>
            )}

            {cartTotals.roundOff !== 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Round Off:</span>
                <span className="font-mono text-slate-300">{cartTotals.roundOff > 0 ? `+₹${cartTotals.roundOff}` : `-₹${Math.abs(cartTotals.roundOff)}`}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
              <span className="text-sm font-bold text-white">GRAND TOTAL:</span>
              <span className="text-2xl font-black font-mono text-emerald-400">
                {formatCurrency(cartTotals.grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Hold, Clear, Settle */}
        <div className="space-y-2 pt-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleHoldBill}
              disabled={cart.length === 0}
              className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 hover:border-amber-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Hold Bill [F8]</span>
            </button>

            <button
              type="button"
              onClick={() => setIsHeldModalOpen(true)}
              className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Recall Bills</span>
            </button>
          </div>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={clearCart}
              disabled={cart.length === 0}
              className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 flex items-center justify-center disabled:opacity-40"
              title="Clear Cart"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(true)}
              disabled={cart.length === 0}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
              <span>Pay & Settle [F12]</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {batchModalProduct && (
        <BatchSelectorModal
          product={batchModalProduct}
          onClose={() => setBatchModalProduct(null)}
          onConfirm={(prod, batch, qty, isLoose) => {
            addToCart(prod, batch, qty, isLoose);
            setBatchModalProduct(null);
          }}
        />
      )}

      {isPaymentModalOpen && (
        <PaymentModal
          grandTotal={cartTotals.grandTotal}
          customer={activeCustomer}
          onClose={() => setIsPaymentModalOpen(false)}
          onComplete={handleCompletePayment}
          isProcessing={isProcessing}
        />
      )}

      <HeldBillsModal
        isOpen={isHeldModalOpen}
        onClose={() => setIsHeldModalOpen(false)}
        onRecallBill={handleRecallBill}
      />

      {lastInvoiceData && (
        <ReceiptModal
          invoiceData={lastInvoiceData}
          onClose={() => setLastInvoiceData(null)}
        />
      )}
    </div>
  );
}
