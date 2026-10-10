import React, { useState } from 'react';
import {
  X,
  Plus,
  Search,
  User,
  Phone,
  Stethoscope,
  CreditCard,
  Boxes,
  CheckCircle2,
  Trash2,
  Layers,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { api } from '../../utils/api';
import { useApp } from '../../context/AppContext';

export function NewRequisitionModal({ isOpen, onClose, onCreated, tests = [], packages = [], doctors = [] }) {
  const { showToast } = useApp();

  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Male');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAddress, setPatientAddress] = useState('');
  const [referringDoctor, setReferringDoctor] = useState(doctors[0]?.doctor_name || 'Self / Direct Walk-in Patient');

  const [selectedTests, setSelectedTests] = useState([]);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [testSearch, setTestSearch] = useState('');

  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [phlebotomist, setPhlebotomist] = useState('Counter Phlebotomist');
  const [clinicalNotes, setClinicalNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleTest = (test) => {
    if (selectedTests.some(t => t.id === test.id)) {
      setSelectedTests(selectedTests.filter(t => t.id !== test.id));
    } else {
      setSelectedTests([...selectedTests, test]);
    }
  };

  const togglePackage = (pkg) => {
    if (selectedPackages.some(p => p.id === pkg.id)) {
      setSelectedPackages(selectedPackages.filter(p => p.id !== pkg.id));
    } else {
      setSelectedPackages([...selectedPackages, pkg]);
    }
  };

  const testSubtotal = selectedTests.reduce((acc, t) => acc + Number(t.price || 0), 0);
  const packageSubtotal = selectedPackages.reduce((acc, p) => acc + Number(p.package_price || p.price || 0), 0);
  const subtotal = testSubtotal + packageSubtotal;
  const netAmount = Math.max(0, subtotal - Number(discount || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) {
      showToast('Patient name is required', 'error');
      return;
    }
    if (selectedTests.length === 0 && selectedPackages.length === 0) {
      showToast('Please select at least one test or health package', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const effectivePaid = paidAmount === '' ? netAmount : Number(paidAmount);

      const orderData = {
        patient_name: patientName.trim(),
        patient_age: patientAge ? Number(patientAge) : null,
        patient_gender: patientGender,
        patient_phone: patientPhone.trim(),
        patient_address: patientAddress.trim(),
        referring_doctor: referringDoctor,
        selected_tests: selectedTests,
        selected_packages: selectedPackages,
        discount: Number(discount) || 0,
        paid_amount: effectivePaid,
        payment_mode: paymentMode,
        phlebotomist: phlebotomist.trim(),
        clinical_notes: clinicalNotes.trim()
      };

      const newOrder = await api.createLabOrder(orderData);
      showToast(`Diagnostic order ${newOrder.order_no} booked successfully!`, 'success');
      if (onCreated) onCreated(newOrder);
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to book lab order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTests = tests.filter(t =>
    t.test_name.toLowerCase().includes(testSearch.toLowerCase()) ||
    t.test_code.toLowerCase().includes(testSearch.toLowerCase()) ||
    t.department.toLowerCase().includes(testSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/60 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black">
              +
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Book New Diagnostic Requisition</h2>
              <p className="text-xs text-slate-400">Patient Registration • Investigation Ordering • Billing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-200">
          {/* 1. Patient Demographics */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
              1. Patient Demographics & Clinician
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Age (Years)</label>
                  <input
                    type="number"
                    placeholder="e.g. 45"
                    value={patientAge}
                    onChange={e => setPatientAge(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Gender</label>
                  <select
                    value={patientGender}
                    onChange={e => setPatientGender(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Contact Mobile</label>
                <input
                  type="text"
                  placeholder="+91 98000 00000"
                  value={patientPhone}
                  onChange={e => setPatientPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Referring Clinician / Doctor</label>
                <select
                  value={referringDoctor}
                  onChange={e => setReferringDoctor(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Self / Direct Walk-in Patient">Self / Direct Walk-in Patient</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.doctor_name}>
                      {d.doctor_name} ({d.commission_percent}% Ref)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Phlebotomist / Collector</label>
                <input
                  type="text"
                  value={phlebotomist}
                  onChange={e => setPhlebotomist(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Health Packages Selector */}
          {packages.length > 0 && (
            <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                2. Select Health Checkup Packages (Optional)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {packages.map(pkg => {
                  const isSelected = selectedPackages.some(p => p.id === pkg.id);
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => togglePackage(pkg)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-xs">{pkg.package_name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-sm font-black text-amber-300 font-mono">₹{pkg.package_price}</span>
                        {pkg.original_price > pkg.package_price && (
                          <span className="text-[10px] line-through text-slate-500 font-mono">₹{pkg.original_price}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1 line-clamp-1">{pkg.description}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Individual Test Investigations */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                3. Individual Test Investigations Catalog
              </span>
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search test name or code..."
                  value={testSearch}
                  onChange={e => setTestSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-1">
              {filteredTests.map(test => {
                const isSelected = selectedTests.some(t => t.id === test.id);
                return (
                  <div
                    key={test.id}
                    onClick={() => toggleTest(test)}
                    className={`p-2.5 rounded-xl border cursor-pointer flex justify-between items-center transition-all ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-500/60 text-white'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs flex items-center space-x-1.5">
                        <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 font-mono text-cyan-300">{test.test_code}</span>
                        <span className="truncate max-w-[150px]">{test.test_name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {test.department} • <strong className="text-white font-mono">₹{test.price}</strong>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 ml-1" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Billing & Settlement */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
              4. Requisition Summary & Payment Settlement
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Subtotal</span>
                <span className="text-base font-black text-white font-mono">₹{subtotal.toFixed(2)}</span>
                <span className="text-[10px] text-slate-500">{selectedTests.length} tests, {selectedPackages.length} pkgs</span>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Discount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Net Payable</span>
                <span className="text-lg font-black text-emerald-400 font-mono">₹{netAmount.toFixed(2)}</span>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Advance Paid (₹)</label>
                <input
                  type="number"
                  placeholder={String(netAmount)}
                  value={paidAmount}
                  onChange={e => setPaidAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="cash">Cash Counter</option>
                  <option value="upi">UPI / QR Code</option>
                  <option value="card">Debit / Credit Card</option>
                  <option value="udhar">Patient Credit (Khata)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Clinical Complaints / History</label>
                <input
                  type="text"
                  placeholder="e.g. History of fever 4 days, joint pain"
                  value={clinicalNotes}
                  onChange={e => setClinicalNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold shadow-lg shadow-cyan-600/25 flex items-center space-x-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Generating Order...' : 'Confirm Requisition & Print Barcode'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
