import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  UploadCloud,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  FileCheck2,
  FolderOpen,
  FileCode,
  Tag
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Documents' },
  { id: 'bill_of_lading', label: 'Bill of Lading (BoL/AWB)' },
  { id: 'shipping_bill', label: 'Shipping Bill (SB)' },
  { id: 'bill_of_entry', label: 'Bill of Entry (BOE)' },
  { id: 'commercial_invoice', label: 'Commercial Invoice' },
  { id: 'packing_list', label: 'Packing List' },
  { id: 'certificate_of_origin', label: 'Certificate of Origin (COO)' },
  { id: 'fssai_certificate', label: 'FSSAI / Regulatory NOC' }
];

export function DocumentManagementDmsPanel({ activePersona = 'logistics' }) {
  const { currentTenant, showToast, user } = useApp();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form
  const [form, setForm] = useState({
    shipment_number: 'SHP-2026-IMP-8821',
    doc_category: 'bill_of_lading',
    doc_title: 'Original Ocean Bill of Lading (3/3 Set)',
    file_name: 'BL_MAEU992014_Original.pdf',
    file_size_kb: 420,
    uploaded_by_name: user?.name || 'Logistics Operations',
    uploaded_by_role: activePersona,
    notes: 'Surrendered Sea Waybill copy verified by shipping line.'
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.getDmsDocuments();
      setDocuments(res.documents || []);
    } catch (err) {
      console.error('Error loading DMS documents:', err);
      showToast('Error loading documents from DMS', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.uploadDmsDocument({
        ...form,
        uploaded_by_name: user?.name || form.uploaded_by_name,
        uploaded_by_role: activePersona
      });
      showToast(`Document ${form.file_name} vaulted in DMS!`, 'success');
      setShowUploadModal(false);
      loadDocuments();
    } catch (err) {
      showToast(err.message || 'Failed to upload document', 'error');
    }
  };

  const handleDownload = (doc) => {
    showToast(`Downloading secure vault copy of ${doc.file_name}...`, 'info');
  };

  const filteredDocs = documents.filter(doc => {
    const matchCat = selectedCategory === 'all' || doc.doc_category === selectedCategory;
    const matchSearch = !searchQuery ||
      doc.shipment_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.doc_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.file_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950/80 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-lg border border-blue-500/20">
                Data & Storage Tier
              </span>
              <span className="text-[11px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                Encrypted DMS Vault
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Secure Document Management System (DMS)</h2>
            <p className="text-xs text-slate-400">
              Centralized repository for Bills of Lading, Shipping Bills, Bills of Entry, Invoices, and Regulatory NOCs
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/30 transition"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Vault New Document</span>
          </button>

          <button
            onClick={loadDocuments}
            disabled={loading}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-2xl border border-slate-800 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/70 p-4 rounded-3xl border border-slate-800">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by shipment #, document name, or file..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="bg-slate-950/80 rounded-3xl border border-slate-800 hover:border-slate-700 p-5 shadow-xl transition space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                      {doc.doc_category.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md">
                      {doc.shipment_number}
                    </span>
                  </div>
                </div>

                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified</span>
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white line-clamp-1" title={doc.doc_title}>
                  {doc.doc_title}
                </h4>
                <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center space-x-2">
                  <span>{doc.file_name}</span>
                  <span>•</span>
                  <span>{doc.file_size_kb} KB</span>
                </div>
              </div>

              {doc.notes && (
                <p className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded-xl border border-slate-850">
                  {doc.notes}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-900 flex items-center justify-between">
              <div className="text-[11px] text-slate-400">
                <span>By: {doc.uploaded_by_name}</span>
                <span className="text-[10px] text-slate-500 block">({doc.uploaded_by_role})</span>
              </div>

              <button
                onClick={() => handleDownload(doc)}
                className="bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Vault New Document */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Vault Document to DMS</h3>
                  <p className="text-xs text-slate-400">Attach compliance document to consignment file</p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Shipment Reference</label>
                <input
                  type="text"
                  value={form.shipment_number}
                  onChange={(e) => setForm({ ...form, shipment_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Document Category</label>
                <select
                  value={form.doc_category}
                  onChange={(e) => setForm({ ...form, doc_category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="bill_of_lading">Bill of Lading / Air Waybill</option>
                  <option value="shipping_bill">Shipping Bill (SB)</option>
                  <option value="bill_of_entry">Bill of Entry (BOE)</option>
                  <option value="commercial_invoice">Commercial Invoice</option>
                  <option value="packing_list">Packing List</option>
                  <option value="certificate_of_origin">Certificate of Origin (COO)</option>
                  <option value="fssai_certificate">FSSAI / Regulatory NOC</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Document Title / Description</label>
                <input
                  type="text"
                  value={form.doc_title}
                  onChange={(e) => setForm({ ...form, doc_title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">File Name</label>
                  <input
                    type="text"
                    value={form.file_name}
                    onChange={(e) => setForm({ ...form, file_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">File Size (KB)</label>
                  <input
                    type="number"
                    value={form.file_size_kb}
                    onChange={(e) => setForm({ ...form, file_size_kb: parseInt(e.target.value) || 120 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Notes / Remarks</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows="2"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-600/30 transition flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Vault Document</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
