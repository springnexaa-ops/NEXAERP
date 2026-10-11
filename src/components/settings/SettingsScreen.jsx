import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Globe,
  Anchor,
  FlaskConical,
  Award,
  FileText,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Lock,
  FileCheck2,
  Compass
} from 'lucide-react';

export function SettingsScreen() {
  const { vertical, settings, setSettings, showToast, bgTheme, changeBgTheme, currentTenant } = useApp();
  
  const normVertical = (vertical || currentTenant?.business_type || 'pharma').toLowerCase();
  const isPharma = normVertical === 'pharma';
  const isImpoExpo = normVertical === 'impoexpo' || normVertical === 'exim';
  const isLMIS = normVertical === 'lmis' || normVertical === 'lab';
  const isGeneral = !isPharma && !isImpoExpo && !isLMIS;

  const [formData, setFormData] = useState({
    ...settings,
    store_name: currentTenant?.name || settings?.store_name || '',
    store_address: currentTenant?.store_address || settings?.store_address || '',
    phone: currentTenant?.owner_phone || settings?.phone || '',
    gstin: currentTenant?.gstin || settings?.gstin || '',
    // ImpoExpo defaults
    iec_code: settings?.iec_code || '0508012349',
    ad_code: settings?.ad_code || '02100450019281',
    ad_bank_name: settings?.ad_bank_name || 'State Bank of India, Overseas Branch, Mumbai',
    rcmc_number: settings?.rcmc_number || 'PHARMEXCIL/RCMC/2024/9811',
    epc_name: settings?.epc_name || 'Pharmexcil',
    gst_lut_arn: settings?.gst_lut_arn || 'LUT-ARN-AA270326091811',
    aeo_number: settings?.aeo_number || 'AEO-T1-INNSA-9021',
    icegate_id: settings?.icegate_id || 'ICE_TG_EXP_26',
    default_port: settings?.default_port || 'INNSA1 (Nhava Sheva, JNPT)',
    default_currency: settings?.default_currency || 'USD',
    default_incoterm: settings?.default_incoterm || 'FOB',
    invoice_declaration: settings?.invoice_declaration || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
    signatory_name: settings?.signatory_name || 'Rajesh Sharma, Director / Authorized Signatory',
    // Pharma defaults
    dl_20b: settings?.dl_20b || currentTenant?.dl_number?.split(',')[0]?.trim() || 'DL-20B/Verma-9812',
    dl_21b: settings?.dl_21b || currentTenant?.dl_number?.split(',')[1]?.trim() || 'DL-21B/Verma-9813',
    dl_wholesale: settings?.dl_wholesale || '',
    pharmacist_name: settings?.pharmacist_name || 'Dr. Sanjay Verma, B.Pharm',
    pharmacist_reg_no: settings?.pharmacist_reg_no || 'MPPC-48190 / PCI-2018',
    pharmacy_council_state: settings?.pharmacy_council_state || 'Maharashtra State Pharmacy Council',
    prescription_warning: settings?.prescription_warning || 'Warning: To be sold by retail on the prescription of a Registered Medical Practitioner only.',
    // LMIS defaults
    cea_reg_no: settings?.cea_reg_no || 'CEA/MH/2024/0912',
    nabl_cert_no: settings?.nabl_cert_no || 'MC-4912 / NABL-2025',
    pathologist_name: settings?.pathologist_name || 'Dr. K. L. Mehta, MD (Pathology)',
    mci_reg_no: settings?.mci_reg_no || 'MCI-48291',
    lab_tech_incharge: settings?.lab_tech_incharge || 'Rahul Yadav, DMLT (Senior Phlebotomist)',
    bmw_auth_no: settings?.bmw_auth_no || 'BMW/MPCB/2025/1109',
    report_header_margin: settings?.report_header_margin || '45',
    report_verify_url: settings?.report_verify_url || 'https://verify.apexdiagnostics.com/report/',
    normal_range_layout: settings?.normal_range_layout || 'standard_table',
    report_disclaimer: settings?.report_disclaimer || 'Reports to be interpreted by a qualified clinician in clinical context.',
    // Retail & General defaults
    fssai_number: currentTenant?.fssai_number || settings?.fssai_number || '11521019000342',
    shop_act_reg: settings?.shop_act_reg || 'SHOP/MUM/2023/8812',
    ward_zone: settings?.ward_zone || 'Zone 4 / Ward K-West',
    khata_reminder_msg: settings?.khata_reminder_msg || 'Dear customer, your pending balance at our store is Rs {balance}. Kindly clear your due. Thank you!',
    upi_id: currentTenant?.upi_id || settings?.upi_id || 'nexa@upi',
    printer_format: settings?.printer_format || 'thermal80',
    footer_message: settings?.footer_message || 'Thank you for your visit! Powered by Nexa ERP (SpringNexa)'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        ...settings,
        store_name: currentTenant?.name || settings.store_name || prev.store_name,
        store_address: currentTenant?.store_address || settings.store_address || prev.store_address,
        phone: currentTenant?.owner_phone || settings.phone || prev.phone,
        gstin: currentTenant?.gstin || settings.gstin || prev.gstin
      }));
    }
  }, [settings, currentTenant]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.updateSettings(formData);
      setSettings(res.settings);
      showToast('Organization settings & regulatory profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSeed = async () => {
    if (!window.confirm(`Are you sure you want to reset & reload the standard sample catalog for ${currentTenant?.name || 'this store'}?`)) {
      return;
    }
    setIsSeeding(true);
    try {
      await api.seedDatabase();
      showToast('Sample catalog reloaded successfully!', 'success');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      showToast('Failed to reset demo data', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  // Vertical Header Metadata
  const getVerticalMeta = () => {
    if (isImpoExpo) {
      return {
        title: 'Global Trade Entity & Customs Compliance Profile',
        subtitle: 'Directorate General of Foreign Trade (DGFT), ICEGATE Port AD Codes & Export Councils',
        icon: Globe,
        editionName: 'ImpoExpo Trade ERP',
        badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30'
      };
    }
    if (isPharma) {
      return {
        title: 'Pharmacy Legal Profile & Drug Regulatory Compliance (FDA)',
        subtitle: 'Drugs & Cosmetics Act 1940, Form 20-B/21-B Retail Licences & State Pharmacy Council Registration',
        icon: Pill,
        editionName: 'Pharma ERP',
        badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      };
    }
    if (isLMIS) {
      return {
        title: 'Clinical Laboratory Profile & NABL Diagnostic Standards',
        subtitle: 'Clinical Establishments Act, NABL ISO 15189:2022 Accreditation & Pathologist Medical Council Credentials',
        icon: FlaskConical,
        editionName: 'LMIS Pathology Diagnostic ERP',
        badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
      };
    }
    return {
      title: 'Retail Superstore Profile & Food Safety Compliance',
      subtitle: 'FSSAI Food Safety License, Shop & Establishment Act & Counter POS Layout',
      icon: ShoppingCart,
      editionName: 'General Retail ERP',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    };
  };

  const vMeta = getVerticalMeta();
  const VerticalIcon = vMeta.icon;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-y-auto select-none p-4 sm:p-6 space-y-6">
      {/* 1. Dedicated Header Banner */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-sky-600/25">
            <VerticalIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${vMeta.badgeColor}`}>
                {vMeta.editionName}
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Workspace #{currentTenant?.id}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-1">
              {vMeta.title}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {vMeta.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strict Isolation Active</span>
          </span>
        </div>
      </div>

      {/* 2. Primary Form: Strictly Vertical-Specific Settings */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* BLOCK A: Entity Legal & Premises Identity */}
        <div className="bg-slate-950/80 rounded-3xl border border-slate-800 p-6 space-y-4 shadow-xl text-xs">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-white">
                {isImpoExpo ? '1. Global Trade Entity Details' : isPharma ? '1. Pharmacy Legal Identity' : isLMIS ? '1. Diagnostic Facility Profile' : '1. Store Enterprise Identity'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Legal firm name, contact numbers, and premises registered for tax & statutory purposes.
              </p>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-600/25 flex items-center gap-1.5 transition active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving Profile...' : 'Save Changes'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">
                {isImpoExpo ? 'Export Firm / Corporate Legal Name *' : isPharma ? 'Pharmacy / Medical Store Name *' : isLMIS ? 'Laboratory / Diagnostic Centre Name *' : 'Store / Supermarket Name *'}
              </label>
              <input
                type="text"
                required
                value={formData.store_name || ''}
                onChange={e => setFormData({ ...formData, store_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">
                Official Contact Phone Number *
              </label>
              <input
                type="text"
                required
                value={formData.phone || ''}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">GSTIN (GST Number) *</label>
              <input
                type="text"
                value={formData.gstin || ''}
                onChange={e => setFormData({ ...formData, gstin: e.target.value })}
                placeholder="e.g. 27AABCT1294F1Z8"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500 uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-slate-300 block mb-1 font-semibold">
                {isImpoExpo ? 'Corporate Head Office / SEZ Terminal Address *' : isPharma ? 'Licensed Premises Physical Address *' : isLMIS ? 'Clinical Laboratory Facility Address *' : 'Store Premises Physical Address *'}
              </label>
              <input
                type="text"
                value={formData.store_address || ''}
                onChange={e => setFormData({ ...formData, store_address: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">
                {isImpoExpo ? 'Official Trade Email' : isLMIS ? 'Clinical Helpline Email' : 'Store Billing Email'}
              </label>
              <input
                type="email"
                value={formData.email || formData.exim_email || ''}
                onChange={e => setFormData({ ...formData, email: e.target.value, exim_email: e.target.value })}
                placeholder="contact@organization.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {/* BLOCK B: VERTICAL REGULATORY REGISTRATIONS & STATUTORY CODES */}
        <div className="bg-slate-950/80 rounded-3xl border border-slate-800 p-6 space-y-4 shadow-xl text-xs">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              {isImpoExpo ? '2. DGFT & Customs Statutory Registrations' : isPharma ? '2. Drugs Control Authority (FDA) Registrations' : isLMIS ? '2. Clinical Establishments & NABL Accreditation' : '2. Food Safety & Municipal Trade Licenses'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isImpoExpo
                ? 'Statutory registrations filed on DGFT single window, ICEGATE EDI, and Export Promotion Councils.'
                : isPharma
                ? 'Mandatory drug sale licences and registered pharmacist credentials under the Drugs & Cosmetics Act.'
                : isLMIS
                ? 'Accreditation certificates, pathologist registration, and statutory biomedical waste permits.'
                : 'FSSAI food hygiene registration and local municipal shop licenses.'}
            </p>
          </div>

          {/* IMPOEXPO SPECIFIC FIELDS */}
          {isImpoExpo && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  IEC (Import Export Code) * <span className="text-sky-400 font-normal">(10-Digit DGFT PAN Code)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.iec_code || ''}
                  onChange={e => setFormData({ ...formData, iec_code: e.target.value })}
                  placeholder="e.g. 0508012349"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-sky-500 uppercase"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Authorized Dealer (AD) Code <span className="text-sky-400 font-normal">(14-Digit ICEGATE Bank Code)</span>
                </label>
                <input
                  type="text"
                  value={formData.ad_code || ''}
                  onChange={e => setFormData({ ...formData, ad_code: e.target.value })}
                  placeholder="e.g. 02100450019281"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">AD Bank Name & Branch</label>
                <input
                  type="text"
                  value={formData.ad_bank_name || ''}
                  onChange={e => setFormData({ ...formData, ad_bank_name: e.target.value })}
                  placeholder="e.g. State Bank of India, Overseas Branch"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">RCMC Registration Certificate No.</label>
                <input
                  type="text"
                  value={formData.rcmc_number || ''}
                  onChange={e => setFormData({ ...formData, rcmc_number: e.target.value })}
                  placeholder="e.g. PHARMEXCIL/RCMC/2024/9811"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500 uppercase"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Export Promotion Council (EPC)</label>
                <select
                  value={formData.epc_name || 'Pharmexcil'}
                  onChange={e => setFormData({ ...formData, epc_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-semibold"
                >
                  <option value="Pharmexcil">Pharmexcil (Pharmaceuticals)</option>
                  <option value="EEPC India">EEPC India (Engineering Goods)</option>
                  <option value="FIEO">FIEO (Federation of Indian Export Organisations)</option>
                  <option value="APEDA">APEDA (Agricultural & Processed Food)</option>
                  <option value="CLE">CLE (Council for Leather Exports)</option>
                  <option value="TEXPROCIL">TEXPROCIL (Cotton Textiles)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">GST LUT (Letter of Undertaking) Bond ARN</label>
                <input
                  type="text"
                  value={formData.gst_lut_arn || ''}
                  onChange={e => setFormData({ ...formData, gst_lut_arn: e.target.value })}
                  placeholder="e.g. LUT-ARN-AA270326091811"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500 uppercase"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">AEO (Authorized Economic Operator) No.</label>
                <input
                  type="text"
                  value={formData.aeo_number || ''}
                  onChange={e => setFormData({ ...formData, aeo_number: e.target.value })}
                  placeholder="e.g. AEO-T1-INNSA-9021"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500 uppercase"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">ICEGATE EDI User ID / DSC Profile</label>
                <input
                  type="text"
                  value={formData.icegate_id || ''}
                  onChange={e => setFormData({ ...formData, icegate_id: e.target.value })}
                  placeholder="e.g. ICE_TG_EXP_26"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Corporate PAN Number</label>
                <input
                  type="text"
                  value={formData.pan_number || 'AABCT1294F'}
                  onChange={e => setFormData({ ...formData, pan_number: e.target.value })}
                  placeholder="e.g. AABCT1294F"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500 uppercase"
                />
              </div>
            </div>
          )}

          {/* PHARMA SPECIFIC FIELDS */}
          {isPharma && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Drug License Form 20-B * <span className="text-emerald-400 font-normal">(Retail Allopathic)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.dl_20b || ''}
                  onChange={e => setFormData({ ...formData, dl_20b: e.target.value, dl_number: `${e.target.value}, ${formData.dl_21b || ''}` })}
                  placeholder="e.g. DL-20B/Verma-9812"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Drug License Form 21-B * <span className="text-emerald-400 font-normal">(Schedule C & C1)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.dl_21b || ''}
                  onChange={e => setFormData({ ...formData, dl_21b: e.target.value, dl_number: `${formData.dl_20b || ''}, ${e.target.value}` })}
                  placeholder="e.g. DL-21B/Verma-9813"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Wholesale Drug License (Form 20-D / 21-D)</label>
                <input
                  type="text"
                  value={formData.dl_wholesale || ''}
                  onChange={e => setFormData({ ...formData, dl_wholesale: e.target.value })}
                  placeholder="Optional wholesale permit"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Registered Pharmacist In-Charge *
                </label>
                <input
                  type="text"
                  required
                  value={formData.pharmacist_name || ''}
                  onChange={e => setFormData({ ...formData, pharmacist_name: e.target.value })}
                  placeholder="e.g. Dr. Sanjay Verma, B.Pharm"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  State Pharmacy Council Reg. No. *
                </label>
                <input
                  type="text"
                  required
                  value={formData.pharmacist_reg_no || ''}
                  onChange={e => setFormData({ ...formData, pharmacist_reg_no: e.target.value })}
                  placeholder="e.g. MPPC-48190 / PCI-2018"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">State Pharmacy Council Authority</label>
                <input
                  type="text"
                  value={formData.pharmacy_council_state || ''}
                  onChange={e => setFormData({ ...formData, pharmacy_council_state: e.target.value })}
                  placeholder="e.g. Maharashtra State Pharmacy Council"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          )}

          {/* LMIS SPECIFIC FIELDS */}
          {isLMIS && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Clinical Establishments Act Reg. No. *
                </label>
                <input
                  type="text"
                  required
                  value={formData.cea_reg_no || ''}
                  onChange={e => setFormData({ ...formData, cea_reg_no: e.target.value })}
                  placeholder="e.g. CEA/MH/2024/0912"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-sky-500 uppercase"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  NABL Accreditation Certificate No. <span className="text-cyan-400 font-normal">(ISO 15189:2022)</span>
                </label>
                <input
                  type="text"
                  value={formData.nabl_cert_no || ''}
                  onChange={e => setFormData({ ...formData, nabl_cert_no: e.target.value })}
                  placeholder="e.g. MC-4912 / NABL-2025"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500 uppercase"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Chief Pathologist In-Charge *
                </label>
                <input
                  type="text"
                  required
                  value={formData.pathologist_name || ''}
                  onChange={e => setFormData({ ...formData, pathologist_name: e.target.value })}
                  placeholder="e.g. Dr. K. L. Mehta, MD (Pathology)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Medical Council Registration No. *
                </label>
                <input
                  type="text"
                  required
                  value={formData.mci_reg_no || ''}
                  onChange={e => setFormData({ ...formData, mci_reg_no: e.target.value })}
                  placeholder="e.g. MCI-48291"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Senior Lab Technologist In-Charge</label>
                <input
                  type="text"
                  value={formData.lab_tech_incharge || ''}
                  onChange={e => setFormData({ ...formData, lab_tech_incharge: e.target.value })}
                  placeholder="e.g. Rahul Yadav, DMLT"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Biomedical Waste (BMW) Authorization No.</label>
                <input
                  type="text"
                  value={formData.bmw_auth_no || ''}
                  onChange={e => setFormData({ ...formData, bmw_auth_no: e.target.value })}
                  placeholder="e.g. BMW/MPCB/2025/1109"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500 uppercase"
                />
              </div>
            </div>
          )}

          {/* GENERAL RETAIL & KIRYANA SPECIFIC FIELDS */}
          {isGeneral && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  FSSAI Food License Number * <span className="text-amber-400 font-normal">(14 Digits)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fssai_number || ''}
                  onChange={e => setFormData({ ...formData, fssai_number: e.target.value })}
                  placeholder="e.g. 11521019000342"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Shop & Establishment Act Trade Reg. No.
                </label>
                <input
                  type="text"
                  value={formData.shop_act_reg || ''}
                  onChange={e => setFormData({ ...formData, shop_act_reg: e.target.value })}
                  placeholder="e.g. SHOP/MUM/2023/8812"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Municipal Ward / Trading Zone</label>
                <input
                  type="text"
                  value={formData.ward_zone || ''}
                  onChange={e => setFormData({ ...formData, ward_zone: e.target.value })}
                  placeholder="e.g. Zone 4 / Ward K-West"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* BLOCK C: VERTICAL OPERATIONAL PARAMETERS & INVOICING/REPORT LAYOUT */}
        <div className="bg-slate-950/80 rounded-3xl border border-slate-800 p-6 space-y-4 shadow-xl text-xs">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Printer className="w-4 h-4 text-sky-400" />
              {isImpoExpo ? '3. Default Trade Terms & Commercial Invoice Declarations' : isPharma ? '3. POS Thermal Billing & Schedule H1 Warnings' : isLMIS ? '3. Diagnostic Report Layout & NABL Header Settings' : '3. Counter POS Billing & Payment Layout'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isImpoExpo
                ? 'Configure default Incoterms, settlement currencies, customs port codes, and legal declarations printed on commercial invoices.'
                : isPharma
                ? 'Thermal receipt formats, Schedule H1 mandatory warnings, and Rx dispensing settings.'
                : isLMIS
                ? 'Configure letterhead margins for clinical reports, verification URLs, and diagnostic disclaimers.'
                : 'Configure thermal printer paper width, UPI QR codes, and Khata payment reminder messages.'}
            </p>
          </div>

          {/* IMPOEXPO TRADE PARAMETERS */}
          {isImpoExpo && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Default Gateway Port / ICD</label>
                <select
                  value={formData.default_port || 'INNSA1 (Nhava Sheva, JNPT)'}
                  onChange={e => setFormData({ ...formData, default_port: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-semibold"
                >
                  <option value="INNSA1 (Nhava Sheva, JNPT)">Nhava Sheva Sea Port (INNSA1, JNPT)</option>
                  <option value="INMUN1 (Mundra Port)">Mundra Sea Port (INMUN1, Gujarat)</option>
                  <option value="INDEL4 (Delhi Air Cargo)">Delhi Air Cargo Complex (INDEL4)</option>
                  <option value="INBOM4 (Mumbai Air Cargo)">Mumbai Air Cargo Complex (INBOM4)</option>
                  <option value="INMAA1 (Chennai Sea Port)">Chennai Sea Port (INMAA1)</option>
                  <option value="INTKD6 (Tughlakabad ICD)">Tughlakabad Concor ICD (INTKD6)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Default Trade Settlement Currency</label>
                <select
                  value={formData.default_currency || 'USD'}
                  onChange={e => setFormData({ ...formData, default_currency: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-semibold"
                >
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="AED">AED (AED) - UAE Dirham</option>
                  <option value="INR">INR (₹) - Indian Rupee (Rupee Trade)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Default Incoterm</label>
                <select
                  value={formData.default_incoterm || 'FOB'}
                  onChange={e => setFormData({ ...formData, default_incoterm: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-semibold"
                >
                  <option value="FOB">FOB - Free on Board</option>
                  <option value="CIF">CIF - Cost, Insurance & Freight</option>
                  <option value="CFR">CFR - Cost and Freight</option>
                  <option value="EXW">EXW - Ex Works</option>
                  <option value="DDP">DDP - Delivered Duty Paid</option>
                  <option value="CIP">CIP - Carriage & Insurance Paid to</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-300 block mb-1 font-semibold">Commercial Invoice Legal Declaration</label>
                <textarea
                  rows="2"
                  value={formData.invoice_declaration || ''}
                  onChange={e => setFormData({ ...formData, invoice_declaration: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Authorized Signatory Name & Designation</label>
                <input
                  type="text"
                  value={formData.signatory_name || ''}
                  onChange={e => setFormData({ ...formData, signatory_name: e.target.value })}
                  placeholder="e.g. Rajesh Sharma, Partner / Director"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          )}

          {/* PHARMA PARAMETERS */}
          {isPharma && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Store UPI ID (For Live POS QR)</label>
                <input
                  type="text"
                  value={formData.upi_id || ''}
                  onChange={e => setFormData({ ...formData, upi_id: e.target.value })}
                  placeholder="e.g. sanjeevani@upi"
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

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Prescription Receipt Footer Message</label>
                <input
                  type="text"
                  value={formData.footer_message || ''}
                  onChange={e => setFormData({ ...formData, footer_message: e.target.value })}
                  placeholder="e.g. Get well soon! Wishing you speedy recovery."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-slate-300 block mb-1 font-semibold">Schedule H1 Prescription Caution Warning</label>
                <input
                  type="text"
                  value={formData.prescription_warning || ''}
                  onChange={e => setFormData({ ...formData, prescription_warning: e.target.value })}
                  placeholder="Warning: To be sold by retail on the prescription of a Registered Medical Practitioner only."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-rose-300 focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>
            </div>
          )}

          {/* LMIS PARAMETERS */}
          {isLMIS && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Report Top Margin (mm)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.report_header_margin || '45'}
                  onChange={e => setFormData({ ...formData, report_header_margin: e.target.value })}
                  placeholder="45"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">Top gap left blank for pre-printed laboratory letterheads</span>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Online Report Verification Domain / URL</label>
                <input
                  type="url"
                  value={formData.report_verify_url || ''}
                  onChange={e => setFormData({ ...formData, report_verify_url: e.target.value })}
                  placeholder="https://verify.apexdiagnostics.com/report/"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Default Reference Range Layout</label>
                <select
                  value={formData.normal_range_layout || 'standard_table'}
                  onChange={e => setFormData({ ...formData, normal_range_layout: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-semibold"
                >
                  <option value="standard_table">Standard Reference Range Column</option>
                  <option value="stratified">Age & Gender Stratified Range</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="text-slate-300 block mb-1 font-semibold">Clinical Diagnostic Report Disclaimer Note</label>
                <input
                  type="text"
                  value={formData.report_disclaimer || ''}
                  onChange={e => setFormData({ ...formData, report_disclaimer: e.target.value })}
                  placeholder="Reports to be interpreted by a qualified clinician in clinical context."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          )}

          {/* GENERAL RETAIL & KIRYANA PARAMETERS */}
          {isGeneral && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Store UPI ID (For Live POS QR)</label>
                <input
                  type="text"
                  value={formData.upi_id || ''}
                  onChange={e => setFormData({ ...formData, upi_id: e.target.value })}
                  placeholder="e.g. laxmi@upi"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Default Thermal Printer Format</label>
                <select
                  value={formData.printer_format || 'thermal80'}
                  onChange={e => setFormData({ ...formData, printer_format: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="thermal80">80mm Thermal Receipt (ESC/POS)</option>
                  <option value="thermal58">58mm Thermal Receipt</option>
                  <option value="a4">Standard A4 GST Tax Invoice</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Receipt Footer Greetings</label>
                <input
                  type="text"
                  value={formData.footer_message || ''}
                  onChange={e => setFormData({ ...formData, footer_message: e.target.value })}
                  placeholder="e.g. Thank you for shopping with us! Visit again."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-slate-300 block mb-1 font-semibold">WhatsApp Customer Khata (Udhar) Reminder Message</label>
                <input
                  type="text"
                  value={formData.khata_reminder_msg || ''}
                  onChange={e => setFormData({ ...formData, khata_reminder_msg: e.target.value })}
                  placeholder="Dear customer, your pending balance at our store is Rs {balance}. Kindly clear your due. Thank you!"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          )}

          {/* Form Submit Button (Bottom) */}
          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-600/25 flex items-center gap-1.5 transition active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving Profile...' : 'Save Profile & Settings'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* 3. Display Background & Color Aesthetics (Sky Blue Themes) */}
      <div className="bg-slate-950/80 rounded-3xl border border-slate-800 p-6 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-sky-400" />
            Display Background & Color Aesthetics
          </h3>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
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
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
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
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
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
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
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
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
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

      {/* 4. Offline Data Resilience & Isolated Backup */}
      <div className="bg-slate-950/80 rounded-3xl border border-slate-800 p-6 space-y-3 shadow-xl">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          Offline Data Resilience & Local SQLite Engine
        </h3>
        <p className="text-xs text-slate-400">
          Your entire ERP data is stored in an offline SQLite database. Backups exported here contain exclusively records belonging to <strong className="text-white">{currentTenant?.name}</strong>.
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
            <span>{isSeeding ? 'Reloading...' : `Reset & Reload ${vMeta.editionName} Catalog`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
