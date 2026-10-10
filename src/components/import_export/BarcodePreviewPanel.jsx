import React, { useState, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { api } from '../../utils/api';
import {
  Barcode,
  Printer,
  Sparkles,
  Layers,
  Search,
  Scan,
  CheckCircle2,
  Package,
  Tag,
  DollarSign,
  Boxes,
  RefreshCw,
  Sliders,
  Copy
} from 'lucide-react';

export function BarcodePreviewPanel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [labelConfig, setLabelConfig] = useState({
    title: 'Augmentin 625 Duo Tablet',
    code: '8901088012345',
    mrp: '223.50',
    batch: 'AUG-26A',
    showMrp: true,
    showCode: true,
    showBatch: true,
    sheetFormat: '24', // '24', '40', 'thermal'
    printCopies: 12
  });

  const [scanInput, setScanInput] = useState('');
  const [scannedResult, setScannedResult] = useState(null);
  const previewSvgRef = useRef(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getTradeBarcodeProducts();
      setProducts(data || []);
      if (data && data.length > 0) {
        selectProductForLabel(data[0]);
      }
    } catch (err) {
      console.error('Failed to load barcode products:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectProductForLabel = (prod) => {
    setSelectedProduct(prod);
    setLabelConfig(prev => ({
      ...prev,
      title: prod.name,
      code: prod.barcode || `890100${prod.id}992`,
      mrp: String(prod.mrp || 150.00),
      batch: prod.batch_number || 'LOT-2026'
    }));
  };

  // Render main preview barcode
  useEffect(() => {
    if (previewSvgRef.current && labelConfig.code) {
      try {
        JsBarcode(previewSvgRef.current, String(labelConfig.code), {
          format: 'CODE128',
          lineColor: '#0f172a',
          width: 1.8,
          height: 48,
          displayValue: false, // We render custom stylized text below
          margin: 0
        });
      } catch (err) {
        console.error('Barcode render error:', err);
      }
    }
  }, [labelConfig.code]);

  const handleScanLookup = (e) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    const match = products.find(p =>
      (p.barcode && p.barcode.toLowerCase() === scanInput.trim().toLowerCase()) ||
      (p.name && p.name.toLowerCase().includes(scanInput.trim().toLowerCase()))
    );

    if (match) {
      setScannedResult(match);
      selectProductForLabel(match);
    } else {
      setScannedResult({
        name: 'Unregistered Barcode Scanned',
        barcode: scanInput.trim(),
        mrp: 0,
        stock: 0,
        isUnknown: true
      });
    }
  };

  const handlePrintSheet = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    // Render an array of labels
    const count = Number(labelConfig.printCopies) || 12;
    const labelsHtml = Array.from({ length: count }).map((_, i) => `
      <div class="sticker">
        <div class="title">${labelConfig.title}</div>
        <div class="row">
          ${labelConfig.showMrp ? `<span class="mrp">MRP: ₹${Number(labelConfig.mrp).toFixed(2)}</span>` : ''}
          ${labelConfig.showBatch ? `<span class="batch">B: ${labelConfig.batch}</span>` : ''}
        </div>
        <svg id="bc-${i}" class="barcode-svg"></svg>
        ${labelConfig.showCode ? `<div class="code">${labelConfig.code}</div>` : ''}
      </div>
    `).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode Label Print</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <style>
            @page { size: A4; margin: 8mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 10px; background: white; }
            .grid {
              display: grid;
              grid-template-columns: repeat(${labelConfig.sheetFormat === '40' ? '4' : '3'}, 1fr);
              gap: 4mm;
            }
            .sticker {
              border: 1px dashed #cbd5e1;
              border-radius: 6px;
              padding: 6px;
              text-align: center;
              box-sizing: border-box;
              height: 38mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              overflow: hidden;
            }
            .title { font-size: 11px; font-weight: bold; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .row { display: flex; justify-content: space-between; font-size: 10px; font-weight: 700; color: #0284c7; }
            .barcode-svg { width: 90%; height: 28px; margin: 2px auto; display: block; }
            .code { font-family: monospace; font-size: 10px; color: #475569; letter-spacing: 1px; }
          </style>
        </head>
        <body>
          <div class="grid">
            ${labelsHtml}
          </div>
          <script>
            window.onload = function() {
              for (var i = 0; i < ${count}; i++) {
                try {
                  JsBarcode("#bc-" + i, "${labelConfig.code}", {
                    format: "CODE128",
                    lineColor: "#000",
                    width: 1.5,
                    height: 28,
                    displayValue: false,
                    margin: 0
                  });
                } catch(e) {}
              }
              setTimeout(function() {
                window.print();
                window.close();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
            <Barcode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/20">
                Barcode Labels
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                Code 128 / EAN-13
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1 tracking-tight">
              Barcode & Label Management
            </h2>
            <p className="text-xs text-slate-400">
              Generate barcode stickers, print multi-label sheets, and verify products with barcode lookup
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrintSheet}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-md shadow-sky-600/20"
          >
            <Printer className="w-4 h-4" />
            <span>Print {labelConfig.printCopies} Labels</span>
          </button>
        </div>
      </div>

      {/* 2. Top Interactive Barcode Scanner Simulator */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-4 shadow-xl">
        <form onSubmit={handleScanLookup} className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex items-center space-x-2 w-full md:w-auto flex-1">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-sky-400 shrink-0">
              <Scan className="w-5 h-5 animate-pulse" />
            </div>
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Scan or type Barcode (e.g. 8901088012345 or item name) and press Enter..."
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
              />
              <button
                type="submit"
                className="absolute right-2 top-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-[11px] font-bold transition"
              >
                Scan
              </button>
            </div>
          </div>

          {scannedResult && (
            <div className="w-full md:w-auto flex items-center space-x-3 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-2xl text-xs">
              <span className={`w-2 h-2 rounded-full ${scannedResult.isUnknown ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              <div>
                <span className="font-bold text-white">{scannedResult.name}</span>
                <span className="text-slate-400 ml-2 font-mono">Stock: {scannedResult.stock}</span>
                <span className="text-emerald-400 ml-2 font-mono font-bold">₹{scannedResult.mrp}</span>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* 3. Main Split View: Left Controls & Right Live Flyer Label Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Label Customizer & Catalog Selector (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Label Configuration Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-white">
                <Sliders className="w-4 h-4 text-sky-400" />
                <span>Label Customizer</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Code 128 Standard</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Product Title</label>
                <input
                  type="text"
                  value={labelConfig.title}
                  onChange={(e) => setLabelConfig({ ...labelConfig, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Barcode String</label>
                  <input
                    type="text"
                    value={labelConfig.code}
                    onChange={(e) => setLabelConfig({ ...labelConfig, code: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    value={labelConfig.mrp}
                    onChange={(e) => setLabelConfig({ ...labelConfig, mrp: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={labelConfig.batch}
                    onChange={(e) => setLabelConfig({ ...labelConfig, batch: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Sheet Format</label>
                  <select
                    value={labelConfig.sheetFormat}
                    onChange={(e) => setLabelConfig({ ...labelConfig, sheetFormat: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="24">24 Labels (A4 Sheet 3x8)</option>
                    <option value="40">40 Labels (A4 Sheet 4x10)</option>
                    <option value="thermal">Thermal Roll (50mm x 25mm)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Copies to Print</label>
                <div className="flex items-center space-x-3">
                  {[6, 12, 24, 48].map(qty => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setLabelConfig({ ...labelConfig, printCopies: qty })}
                      className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition ${
                        labelConfig.printCopies === qty
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {qty}
                    </button>
                  ))}
                  <input
                    type="number"
                    value={labelConfig.printCopies}
                    onChange={(e) => setLabelConfig({ ...labelConfig, printCopies: Number(e.target.value) || 1 })}
                    className="w-16 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-center text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-800/80">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={labelConfig.showMrp}
                    onChange={(e) => setLabelConfig({ ...labelConfig, showMrp: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-sky-600 focus:ring-0"
                  />
                  <span className="text-slate-300 text-xs">Show MRP</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={labelConfig.showCode}
                    onChange={(e) => setLabelConfig({ ...labelConfig, showCode: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-sky-600 focus:ring-0"
                  />
                  <span className="text-slate-300 text-xs">Show Code</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={labelConfig.showBatch}
                    onChange={(e) => setLabelConfig({ ...labelConfig, showBatch: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-sky-600 focus:ring-0"
                  />
                  <span className="text-slate-300 text-xs">Show Batch</span>
                </label>
              </div>
            </div>
          </div>

          {/* Product Quick-Select Catalog */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-emerald-400" />
                Select Product for Label
              </span>
              <span className="text-[10px] text-slate-400">{products.length} Items</span>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {products.map(p => (
                <button
                  key={p.id}
                  onClick={() => selectProductForLabel(p)}
                  className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between text-xs ${
                    selectedProduct?.id === p.id
                      ? 'bg-sky-500/10 border-sky-500/40 text-white'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div className="truncate mr-2">
                    <p className="font-semibold truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Barcode: {p.barcode || 'Auto'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold font-mono text-emerald-400">₹{p.mrp}</span>
                    <span className="block text-[10px] text-slate-500">{p.stock} in stock</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: The Flyer "BARCODE PREVIEW" Showcase (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center">
            {/* Sub-Header */}
            <div className="w-full flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Label Preview
                </h3>
              </div>
              <span className="text-[11px] font-mono font-medium text-slate-300 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                A4 & Thermal Roll Ready
              </span>
            </div>

            {/* Single Sticker Presentation */}
            <div className="w-full max-w-sm bg-white text-slate-900 rounded-2xl p-5 shadow-xl border border-slate-200 flex flex-col items-center relative overflow-hidden">
              {/* Product Name */}
              <h4 className="font-bold text-slate-900 text-sm md:text-base text-center line-clamp-2 px-2 mt-2 leading-tight">
                {labelConfig.title}
              </h4>

              {/* MRP & Details Bar */}
              <div className="w-full flex items-center justify-between px-3 mt-2 text-xs font-bold text-slate-700">
                {labelConfig.showMrp && (
                  <span className="text-emerald-700 font-extrabold text-sm">
                    MRP: ₹{Number(labelConfig.mrp).toFixed(2)}
                  </span>
                )}
                {labelConfig.showBatch && (
                  <span className="text-[11px] text-slate-500 font-mono">
                    Batch: {labelConfig.batch}
                  </span>
                )}
              </div>

              {/* High-Resolution Barcode SVG */}
              <div className="my-3 py-1 px-2 bg-white rounded flex justify-center w-full">
                <svg ref={previewSvgRef} className="w-full h-14" />
              </div>

              {/* Code string underneath */}
              {labelConfig.showCode && (
                <div className="font-mono text-xs font-bold tracking-widest text-slate-700">
                  {labelConfig.code}
                </div>
              )}

              {/* Bottom Tagline */}
              <div className="mt-3 pt-2 border-t border-slate-200 w-full text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Product SKU Label
              </div>
            </div>

            {/* Sheet Preview Grid */}
            <div className="w-full mt-6 pt-5 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span className="font-semibold text-slate-300">Sheet Layout ({labelConfig.sheetFormat} per A4)</span>
                <span className="font-mono text-sky-400 font-bold">{labelConfig.printCopies} labels ready</span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {Array.from({ length: Math.min(6, labelConfig.printCopies) }).map((_, i) => (
                  <div key={i} className="bg-white/95 rounded-lg p-2 text-slate-900 text-[10px] text-center shadow-sm border border-slate-200">
                    <p className="font-bold truncate">{labelConfig.title}</p>
                    <p className="text-emerald-700 font-bold font-mono">₹{labelConfig.mrp}</p>
                    <div className="w-full h-3 bg-slate-800/10 rounded my-1 flex items-center justify-center">
                      <span className="text-[8px] font-mono tracking-tighter text-slate-600">|||| | ||||| ||</span>
                    </div>
                    <p className="text-[9px] font-mono text-slate-500">{labelConfig.code}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
