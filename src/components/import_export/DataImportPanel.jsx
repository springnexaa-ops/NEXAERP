import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useApp } from '../../context/AppContext';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Boxes,
  Users,
  Truck,
  FlaskConical,
  Receipt,
  Globe,
  RefreshCw,
  Info,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export function DataImportPanel({ onImportSuccess }) {
  const { showToast } = useApp();
  const [selectedEntity, setSelectedEntity] = useState('products');
  const [template, setTemplate] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  const [inputMode, setInputMode] = useState('file'); // 'file' or 'paste'
  const [file, setFile] = useState(null);
  const [rawText, setRawText] = useState('');
  const [updateExisting, setUpdateExisting] = useState(true);

  const [previewRows, setPreviewRows] = useState([]);
  const [detectedHeaders, setDetectedHeaders] = useState([]);
  const [importing, setImporting] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);

  const entities = [
    {
      id: 'products',
      label: 'Products & Inventory',
      desc: 'Master product catalog, barcodes, HSN, MRP & batch stock',
      icon: Boxes,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      id: 'customers',
      label: 'Customers & Khata',
      desc: 'Customer directory, contact numbers, credit limits & Udhar',
      icon: Users,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      id: 'suppliers',
      label: 'Suppliers & Distributors',
      desc: 'Wholesale distributors, GSTIN numbers & balances',
      icon: Truck,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20'
    },
    {
      id: 'lab_tests',
      label: 'Lab Pathology Tests',
      desc: 'Diagnostic test directory, tube colors, pricing & TAT',
      icon: FlaskConical,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20'
    },
    {
      id: 'expenses',
      label: 'Operational Expenses',
      desc: 'Store expenses, rent, utilities & supplier payment vouchers',
      icon: Receipt,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20'
    },
    {
      id: 'exim_shipments',
      label: 'EXIM Trade Consignments',
      desc: 'International import/export shipments, B/L & customs bills',
      icon: Globe,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10 border-sky-500/20'
    }
  ];

  useEffect(() => {
    loadTemplate(selectedEntity);
    // Reset file and preview on entity switch
    setFile(null);
    setRawText('');
    setPreviewRows([]);
    setDetectedHeaders([]);
    setResultSummary(null);
  }, [selectedEntity]);

  const loadTemplate = async (entity) => {
    try {
      setLoadingTemplate(true);
      const data = await api.getImportTemplate(entity);
      setTemplate(data);
    } catch (err) {
      console.error('Error loading template:', err);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setRawText(content);
        parseAndPreview(content);
      }
    };
    reader.readAsText(selected);
  };

  const handlePasteChange = (e) => {
    const text = e.target.value;
    setRawText(text);
    parseAndPreview(text);
  };

  const parseAndPreview = (csvText) => {
    if (!csvText.trim()) {
      setPreviewRows([]);
      setDetectedHeaders([]);
      return;
    }

    try {
      const lines = [];
      let row = [];
      let inQuotes = false;
      let curVal = '';

      for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            curVal += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          row.push(curVal.trim());
          curVal = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
          if (char === '\r' && nextChar === '\n') i++;
          row.push(curVal.trim());
          if (row.length > 0 && row.some(c => c.length > 0)) lines.push(row);
          row = [];
          curVal = '';
        } else {
          curVal += char;
        }
      }
      if (curVal.length > 0 || row.length > 0) {
        row.push(curVal.trim());
        if (row.length > 0 && row.some(c => c.length > 0)) lines.push(row);
      }

      if (lines.length >= 2) {
        const headers = lines[0].map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
        setDetectedHeaders(headers);

        const rows = [];
        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i];
          const obj = {};
          headers.forEach((h, idx) => {
            obj[h] = vals[idx] !== undefined ? vals[idx] : '';
          });
          rows.push(obj);
        }
        setPreviewRows(rows);
      } else {
        setDetectedHeaders([]);
        setPreviewRows([]);
      }
    } catch (err) {
      console.error('Error parsing preview:', err);
    }
  };

  const executeImport = async () => {
    if (!rawText.trim()) {
      showToast('Please upload a CSV file or paste spreadsheet data first.', 'error');
      return;
    }

    try {
      setImporting(true);
      setResultSummary(null);

      const response = await api.importData(selectedEntity, {
        format: 'csv',
        rawCsv: rawText,
        updateExisting,
        fileName: file ? file.name : `pasted_${selectedEntity}_data.csv`
      });

      setResultSummary(response);
      if (response.successful > 0) {
        showToast(`Successfully imported ${response.successful} ${selectedEntity} records!`, 'success');
        if (onImportSuccess) onImportSuccess();
      } else {
        showToast('Import completed with warnings/errors. Review summary below.', 'error');
      }
    } catch (err) {
      console.error('Import error:', err);
      showToast(err.message || 'Failed to complete bulk import', 'error');
    } finally {
      setImporting(false);
    }
  };

  const fillSampleData = () => {
    if (template && template.sampleRows && template.sampleRows.length > 0) {
      const keys = template.columns.map(c => c.key);
      const headerLine = keys.join(',');
      const rowsLines = template.sampleRows.map(row => {
        return keys.map(k => `"${row[k] !== undefined ? row[k] : ''}"`).join(',');
      });
      const sampleCsv = [headerLine, ...rowsLines].join('\n');
      setRawText(sampleCsv);
      setInputMode('paste');
      parseAndPreview(sampleCsv);
      showToast('Prefilled with valid sample demonstration data.', 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Entity Selection Bar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Step 1: Choose Dataset to Ingest
            </h3>
            <p className="text-xs text-slate-400">
              Select the ERP operational entity you wish to bulk import via CSV or Excel export
            </p>
          </div>
          {template && (
            <a
              href={api.getTemplateDownloadUrl(selectedEntity)}
              download={`nexa_template_${selectedEntity}.csv`}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold border border-slate-700 hover:border-sky-500/40 transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Official CSV Template</span>
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {entities.map(e => {
            const Icon = e.icon;
            const isSelected = selectedEntity === e.id;
            return (
              <button
                key={e.id}
                onClick={() => setSelectedEntity(e.id)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-slate-800 border-sky-500 ring-2 ring-sky-500/20 shadow-lg'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl ${e.bgColor}`}>
                    <Icon className={`w-4 h-4 ${e.color}`} />
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                  )}
                </div>
                <div className="text-xs font-bold text-white truncate">{e.label}</div>
                <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{e.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Upload / Input Area */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Step 2: Provide Spreadsheet or CSV Data
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
              Entity: {selectedEntity}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setInputMode('file')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  inputMode === 'file' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                File Upload
              </button>
              <button
                onClick={() => setInputMode('paste')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  inputMode === 'paste' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Paste CSV / Text
              </button>
            </div>

            <button
              onClick={fillSampleData}
              className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-medium transition"
              title="Click to load prebuilt sample rows into the editor"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Load Sample Rows</span>
            </button>
          </div>
        </div>

        {inputMode === 'file' ? (
          <div className="border-2 border-dashed border-slate-800 hover:border-sky-500/50 rounded-2xl p-6 text-center transition bg-slate-900/30 flex flex-col items-center justify-center">
            <input
              type="file"
              id="csvFileInput"
              accept=".csv,text/csv,application/vnd.ms-excel"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="csvFileInput"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-inner">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-white">
                {file ? file.name : 'Click to select or drop CSV spreadsheet file'}
              </div>
              <div className="text-[11px] text-slate-400 max-w-sm">
                Supports standard RFC-4180 CSV files exported from Excel, Google Sheets, or previous ERP software.
              </div>
            </label>
            {file && (
              <div className="mt-3 flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>File loaded: {(file.size / 1024).toFixed(1)} KB ({previewRows.length} rows detected)</span>
              </div>
            )}
          </div>
        ) : (
          <div>
            <textarea
              value={rawText}
              onChange={handlePasteChange}
              placeholder={`Paste comma-separated data here...\nExample:\nname,barcode,category,mrp,selling_rate,opening_stock\nParacetamol 500mg,8901234,Analgesic,20.00,18.00,100`}
              rows={6}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
            <div className="flex justify-between items-center mt-1 text-[11px] text-slate-400">
              <span>Lines detected: {previewRows.length} data rows</span>
              <button
                onClick={() => { setRawText(''); setPreviewRows([]); }}
                className="text-rose-400 hover:underline"
              >
                Clear Input
              </button>
            </div>
          </div>
        )}

        {/* Options Bar */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={updateExisting}
              onChange={(e) => setUpdateExisting(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
            />
            <span>Update existing records if barcode or primary identifier already exists</span>
          </label>

          <button
            onClick={executeImport}
            disabled={importing || previewRows.length === 0}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {importing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing Bulk Ingestion...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Run Import Migration ({previewRows.length} records)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Result Summary Banner (if executed) */}
      {resultSummary && (
        <div className={`p-4 rounded-2xl border text-xs ${
          resultSummary.failed === 0
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
        }`}>
          <div className="flex items-center space-x-2 font-bold text-sm mb-1">
            {resultSummary.failed === 0 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400" />
            )}
            <span>
              Bulk Ingestion Result: {resultSummary.successful} successfully saved, {resultSummary.failed} skipped
            </span>
          </div>
          <p className="text-slate-300 text-[11px]">
            Processed {resultSummary.total_processed} total records for entity '{resultSummary.entity}'. All records are strictly isolated under tenant storage.
          </p>

          {resultSummary.errors && resultSummary.errors.length > 0 && (
            <div className="mt-3 p-2 bg-slate-950/80 rounded-xl border border-rose-500/30 text-[11px] text-rose-300 max-h-40 overflow-y-auto">
              <div className="font-bold mb-1 text-rose-400">Rejected / Skipped Rows:</div>
              <ul className="space-y-1 list-disc pl-4">
                {resultSummary.errors.map((err, i) => (
                  <li key={i}>
                    <strong>Row {err.row} ({err.item}):</strong> {err.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 4. Live Validation & Preview Table */}
      {previewRows.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                <span>Live Data Preview & Schema Mapping</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Displaying first {Math.min(previewRows.length, 10)} of {previewRows.length} parsed records
              </p>
            </div>
            <div className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
              Columns detected: {detectedHeaders.length}
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-72">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-300 text-[10px] font-bold uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="p-2 border-b border-slate-800">#</th>
                  {detectedHeaders.map((head, idx) => (
                    <th key={idx} className="p-2 border-b border-slate-800 whitespace-nowrap">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200 font-mono text-[11px]">
                {previewRows.slice(0, 10).map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-900/50">
                    <td className="p-2 text-slate-500">{rIdx + 1}</td>
                    {detectedHeaders.map((head, cIdx) => (
                      <td key={cIdx} className="p-2 whitespace-nowrap text-slate-300">
                        {row[head] || <span className="text-slate-600 italic">null</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Expected Template Columns Documentation */}
      {template && (
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 mb-2">
            <Info className="w-4 h-4 text-sky-400" />
            <span>Field Specifications for {template.title}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-[11px]">
            {template.columns.map((col, idx) => (
              <div key={idx} className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-white font-semibold">{col.key}</span>
                  {col.required ? (
                    <span className="text-[9px] text-rose-400 font-bold bg-rose-500/10 px-1 rounded">Required</span>
                  ) : (
                    <span className="text-[9px] text-slate-500">Optional</span>
                  )}
                </div>
                <div className="text-slate-400 text-[10px] mt-0.5">{col.label}</div>
                {col.example && (
                  <div className="text-slate-500 font-mono text-[9px] mt-1 truncate">
                    eg: {col.example}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
