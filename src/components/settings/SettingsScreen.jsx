import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../utils/api';
import {
  Settings,
  Pill,
  ShoppingBag,
  Store,
  Database,
  Download,
  RotateCcw,
  Check,
  Save,
  Printer,
  Palette,
  Sparkles
} from 'lucide-react';

export function SettingsScreen() {
  const { vertical, switchVertical, settings, setSettings, showToast, bgTheme, changeBgTheme } = useApp();
  const [formData, setFormData] = useState({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.updateSettings(formData);
      setSettings(res.settings);
      showToast('Store settings saved successfully!', 'success');
    } catch (err) {
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSeed = async () => {
    if (!window.confirm('Are you sure you want to re-seed the sample database? All test sales will be reset with demo Pharma and Kiryana products.')) {
      return;
    }
    setIsSeeding(true);
    try {
      await api.seedDatabase();
      showToast('Sample Pharma and Kiryana demo data reloaded!', 'success');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      showToast('Failed to reset demo data', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-y-auto select-none p-4 sm:p-6 space-y-6">
      {/* Top Banner */}
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-400" />
          ERP System Configuration & Business Profile
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure vertical adaptations, store tax credentials, thermal printer layouts, and offline backups
        </p>
      </div>

      {/* 1. Business Profile Vertical Switcher */}
      <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-5 space-y-3 shadow-xl">
        <h3 className="font-bold text-sm text-white">Primary Business Vertical</h3>
        <p className="text-xs text-slate-400">
          Switching your business type dynamically toggles regulatory checks, POS table layouts, and unit converters.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Pharma Mode Card */}
          <div
            onClick={() => switchVertical('pharma')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              vertical === 'pharma'
                ? 'bg-rose-950/30 border-rose-500 ring-1 ring-rose-500/50 shadow-lg'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
              <Pill className="w-4 h-4" />
              <span>Pharma / Medical Store</span>
            </div>
            <ul className="text-[11px] text-slate-400 space-y-1 mt-2.5 list-disc list-inside">
              <li>Batch numbers & Expiry FEFO logic</li>
              <li>Salt / Molecule generic substitute search</li>
              <li>Schedule H, H1 & Narcotic registers</li>
              <li>Strip vs loose tablet unit conversion</li>
              <li>Doctor & patient prescription logging</li>
            </ul>
          </div>

          {/* Kiryana Mode Card */}
          <div
            onClick={() => switchVertical('kiryana')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              vertical === 'kiryana'
                ? 'bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500/50 shadow-lg'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <ShoppingBag className="w-4 h-4" />
              <span>Kiryana / Grocery Store</span>
            </div>
            <ul className="text-[11px] text-slate-400 space-y-1 mt-2.5 list-disc list-inside">
              <li>High-speed barcode scanner checkout</li>
              <li>Weighing scale decimal items (kg/g/L)</li>
              <li>Fast Quick-Pick grid for daily staples</li>
              <li>Customer Udhar (Khata book) ledger</li>
              <li>One-click WhatsApp payment reminders</li>
            </ul>
          </div>

          {/* General Retail Mode Card */}
          <div
            onClick={() => switchVertical('general')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              vertical === 'general'
                ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
              <Store className="w-4 h-4" />
              <span>General Retail Store</span>
            </div>
            <ul className="text-[11px] text-slate-400 space-y-1 mt-2.5 list-disc list-inside">
              <li>Multi-category retail inventory</li>
              <li>Barcode scanning & low-stock alerts</li>
              <li>GST invoice printing (80mm & A4)</li>
              <li>Cash, UPI, Card, and Udhar payments</li>
              <li>Daily sales register & day closing</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 2. Store Profile & Tax Credentials Form */}
      <form onSubmit={handleSaveSettings} className="bg-slate-950/80 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <h3 className="font-bold text-sm text-white">Store Profile & Invoice Details</h3>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/25 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Store / Shop Name *</label>
            <input
              type="text"
              required
              value={formData.store_name || ''}
              onChange={e => setFormData({ ...formData, store_name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Contact Phone Number *</label>
            <input
              type="text"
              required
              value={formData.phone || ''}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">GSTIN (GST Number)</label>
            <input
              type="text"
              value={formData.gstin || ''}
              onChange={e => setFormData({ ...formData, gstin: e.target.value })}
              placeholder="e.g. 27ABCDE1234F1Z5"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-slate-300 block mb-1 font-semibold">Shop Address</label>
            <input
              type="text"
              value={formData.store_address || ''}
              onChange={e => setFormData({ ...formData, store_address: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Drug License Number (Pharma)</label>
            <input
              type="text"
              value={formData.dl_number || ''}
              onChange={e => setFormData({ ...formData, dl_number: e.target.value })}
              placeholder="e.g. DL-20B/12948, DL-21B/12949"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">FSSAI License Number (Kiryana)</label>
            <input
              type="text"
              value={formData.fssai_number || ''}
              onChange={e => setFormData({ ...formData, fssai_number: e.target.value })}
              placeholder="e.g. 11521019000342"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Store UPI ID (For Live POS QR)</label>
            <input
              type="text"
              value={formData.upi_id || ''}
              onChange={e => setFormData({ ...formData, upi_id: e.target.value })}
              placeholder="e.g. yourstore@upi"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Default Printer Format</label>
            <select
              value={formData.printer_format || 'thermal80'}
              onChange={e => setFormData({ ...formData, printer_format: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            >
              <option value="thermal80">80mm Thermal Receipt (ESC/POS)</option>
              <option value="thermal58">58mm Thermal Receipt</option>
              <option value="a4">Standard A4 / A5 GST Tax Invoice</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-slate-300 block mb-1 font-semibold">Receipt Footer Greetings</label>
            <input
              type="text"
              value={formData.footer_message || ''}
              onChange={e => setFormData({ ...formData, footer_message: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </form>

      {/* 3. Display Background & Color Aesthetics */}
      <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-sky-400" />
            Display Background & Color Aesthetics
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            SKY BLUE ACTIVE
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Personalize the look and feel of your ERP workstation. High-contrast sky blue gradients and glassmorphism improve focus and ease eye strain.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Theme 1: Sky Blue Radiant */}
          <div
            onClick={() => {
              changeBgTheme('sky-radiant');
              showToast('Set to Radiant Sky Blue', 'info');
            }}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              bgTheme === 'sky-radiant'
                ? 'bg-sky-950/60 border-sky-400 ring-2 ring-sky-400/50 shadow-lg shadow-sky-500/20'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-sky-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                Radiant Sky Blue
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                Default
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-snug">
              Luminous radial sky glow with frosted glass panels and high clarity.
            </p>
          </div>

          {/* Theme 2: Deep Ocean Sky */}
          <div
            onClick={() => {
              changeBgTheme('sky-deep');
              showToast('Set to Deep Ocean Sky', 'info');
            }}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              bgTheme === 'sky-deep'
                ? 'bg-sky-950/60 border-sky-400 ring-2 ring-sky-400/50 shadow-lg shadow-sky-500/20'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="font-bold text-xs text-sky-300 flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-sky-700 border border-sky-500" />
              Deep Ocean Sky
            </span>
            <p className="text-[11px] text-slate-400 mt-2 leading-snug">
              Rich saturated azure blue gradient for maximum contrast and elegance.
            </p>
          </div>

          {/* Theme 3: Sky Blue Daylight */}
          <div
            onClick={() => {
              changeBgTheme('sky-light');
              showToast('Set to Sky Blue Daylight', 'info');
            }}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              bgTheme === 'sky-light'
                ? 'bg-sky-950/60 border-sky-400 ring-2 ring-sky-400/50 shadow-lg shadow-sky-500/20'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="font-bold text-xs text-sky-200 flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-sky-200 border border-sky-400" />
              Sky Blue Daylight
            </span>
            <p className="text-[11px] text-slate-400 mt-2 leading-snug">
              Soft daylight pastel blue for bright, daytime office environments.
            </p>
          </div>

          {/* Theme 4: Midnight Slate */}
          <div
            onClick={() => {
              changeBgTheme('midnight-slate');
              showToast('Set to Midnight Slate', 'info');
            }}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              bgTheme === 'midnight-slate'
                ? 'bg-slate-900 border-slate-500 ring-2 ring-slate-400/50 shadow-lg'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="font-bold text-xs text-slate-300 flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-slate-800 border border-slate-600" />
              Midnight Slate
            </span>
            <p className="text-[11px] text-slate-400 mt-2 leading-snug">
              Deep dark charcoal slate theme for minimal light emission.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Database Maintenance & Offline Backup */}
      <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-5 space-y-3 shadow-xl">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          Offline Data Resilience & Local SQLite Engine
        </h3>
        <p className="text-xs text-slate-400">
          Your entire ERP data (inventory, batches, customers, invoices) is stored natively on this machine in an offline SQLite database.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href={api.getBackupUrl()}
            download
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            title="Download isolated SQLite database containing strictly this store's records"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download Isolated Store Vault (.sqlite)</span>
          </a>

          <button
            type="button"
            onClick={handleResetSeed}
            disabled={isSeeding}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 font-bold text-xs flex items-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>{isSeeding ? 'Reloading...' : 'Reset & Reload Demo Catalog'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
