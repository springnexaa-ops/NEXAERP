import React, { useState } from 'react';
import { api } from '../../utils/api';
import { useApp } from '../../context/AppContext';
import {
  Download,
  FileSpreadsheet,
  FileCode,
  Calendar,
  Filter,
  Boxes,
  Users,
  Truck,
  Receipt,
  ShoppingCart,
  FlaskConical,
  Globe,
  CheckCircle2,
  ExternalLink,
  Eye,
  RefreshCw
} from 'lucide-react';

export function DataExportPanel() {
  const { showToast } = useApp();
  const [selectedEntity, setSelectedEntity] = useState('products');
  const [format, setFormat] = useState('csv');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('');

  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const exportDatasets = [
    {
      id: 'products',
      title: 'Products, Pricing & Batch Stocks',
      desc: 'Complete inventory catalog with batch numbers, expiry dates, selling rates and current warehouse quantities.',
      icon: Boxes,
      color: 'text-emerald-400',
      badge: 'Inventory Master'
    },
    {
      id: 'sales',
      title: 'Sales Invoices & Billing Register',
      desc: 'All customer billing transactions, item counts, cash/UPI splits, discounts, taxes and invoice timestamps.',
      icon: ShoppingCart,
      color: 'text-sky-400',
      badge: 'Revenue Stream'
    },
    {
      id: 'customers',
      title: 'Customer Directory & Udhar Ledgers',
      desc: 'Customer phone contacts, addresses, credit limits, outstanding balances and accumulated loyalty reward points.',
      icon: Users,
      color: 'text-amber-400',
      badge: 'Khata Balances'
    },
    {
      id: 'suppliers',
      title: 'Wholesale Suppliers & Balances',
      desc: 'Registered distributor contacts, GSTIN numbers, warehouse addresses and open payable credit balances.',
      icon: Truck,
      color: 'text-indigo-400',
      badge: 'Procurement'
    },
    {
      id: 'expenses',
      title: 'Operational Overhead Expenses',
      desc: 'Store expense vouchers, rent, electricity, courier logistics, repair maintenance and supplier payment entries.',
      icon: Receipt,
      color: 'text-rose-400',
      badge: 'P&L Accounting'
    },
    {
      id: 'lab_orders',
      title: 'Lab & Diagnostics Patient MIS',
      desc: 'Requisition orders, barcode identifiers, patient demographics, referring doctors, test fees and delivery status.',
      icon: FlaskConical,
      color: 'text-cyan-400',
      badge: 'Pathology Reports'
    },
    {
      id: 'exim_shipments',
      title: 'EXIM International Trade Consignments',
      desc: 'Import/Export overseas shipments, B/L numbers, container tracking, customs duty paid and HS tariff codes.',
      icon: Globe,
      color: 'text-purple-400',
      badge: 'Global Supply Chain'
    }
  ];

  const handleDownload = () => {
    const params = { format };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (category) params.category = category;

    const url = api.getExportUrl(selectedEntity, params);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexa_export_${selectedEntity}_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Initiated export download for ${selectedEntity} (${format.toUpperCase()})`, 'success');
  };

  const handlePreview = async () => {
    try {
      setLoadingPreview(true);
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (category) params.category = category;

      const res = await api.exportDataJson(selectedEntity, params);
      setPreviewData(res);
      showToast(`Loaded ${res.total_records} export records preview`, 'info');
    } catch (err) {
      console.error('Export preview error:', err);
      showToast(err.message || 'Failed to load export preview', 'error');
    } finally {
      setLoadingPreview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Dataset Selection Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Step 1: Select Master Dataset to Export
            </h3>
            <p className="text-xs text-slate-400">
              Extract compliant audit records, spreadsheet reports, or raw JSON for analytics and backup
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {exportDatasets.map(ds => {
            const Icon = ds.icon;
            const isSelected = selectedEntity === ds.id;
            return (
              <button
                key={ds.id}
                onClick={() => {
                  setSelectedEntity(ds.id);
                  setPreviewData(null);
                }}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-slate-800 border-sky-500 ring-2 ring-sky-500/20 shadow-xl'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <Icon className={`w-5 h-5 ${ds.color}`} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                      {ds.badge}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></span>
                  )}
                </div>

                <div className="text-xs font-bold text-white">{ds.title}</div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {ds.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Export Configuration & Filter Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
        <div className="text-xs font-bold text-white uppercase tracking-wider mb-3">
          Step 2: Export Format & Range Filters
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          {/* Format Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              File Format
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setFormat('csv')}
                className={`flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  format === 'csv'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>CSV / Excel</span>
              </button>
              <button
                onClick={() => setFormat('json')}
                className={`flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  format === 'json'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>JSON API</span>
              </button>
            </div>
          </div>

          {/* Date Filters */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              From Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              To Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={handlePreview}
              disabled={loadingPreview}
              className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition"
            >
              {loadingPreview ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-sky-400" />
              )}
              <span>Preview</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Live Preview Drawer */}
      {previewData && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Export Dataset Preview ({previewData.total_records} records found)</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Sample preview of fields and values included in the generated export file
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Complete File ({format.toUpperCase()})</span>
            </button>
          </div>

          {previewData.data && previewData.data.length > 0 ? (
            <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-72">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-300 text-[10px] font-bold uppercase sticky top-0">
                  <tr>
                    <th className="p-2 border-b border-slate-800">#</th>
                    {Object.keys(previewData.data[0]).map((key, idx) => (
                      <th key={idx} className="p-2 border-b border-slate-800 whitespace-nowrap">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200 font-mono text-[11px]">
                  {previewData.data.slice(0, 10).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-900/50">
                      <td className="p-2 text-slate-500">{rIdx + 1}</td>
                      {Object.values(row).map((val, cIdx) => (
                        <td key={cIdx} className="p-2 whitespace-nowrap text-slate-300">
                          {val !== null && val !== undefined ? String(val) : <span className="text-slate-600 italic">null</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs">
              No matching records found for the selected entity and date filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
