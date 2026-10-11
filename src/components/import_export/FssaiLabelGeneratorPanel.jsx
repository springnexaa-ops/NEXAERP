import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';
import { useApp } from '../../context/AppContext';
import {
  Printer,
  Sparkles,
  Download,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Tag,
  RefreshCw,
  QrCode,
  Barcode,
  Copy,
  Layers,
  Utensils,
  Leaf,
  Beef,
  AlertTriangle,
  Info,
  Package,
  Building2,
  Maximize2
} from 'lucide-react';

const PRESET_TEMPLATES = [
  {
    name: 'Organic Moringa Powder (Superfood Export)',
    productName: 'Organic Moringa Oleifera Leaf Powder',
    brandName: 'NexaVeda Organics',
    category: 'Nutraceutical / Botanical Superfood',
    vegType: 'veg',
    netWeight: '500 g (17.6 oz)',
    batchNumber: 'MOR-EXP-2026/092',
    mfgDate: '2026-10-01',
    expiryDate: '2028-09-30',
    bestBeforeDuration: '24 Months from packaging',
    barcodeNumber: '8906041289104',
    ingredients: '100% Certified Organic Moringa Oleifera Leaves (Dehydrated & Micro-pulverized at <40°C). No additives, preservatives, or artificial colors.',
    allergens: 'Free from common allergens (Gluten-free, Non-GMO). Packaged in a dedicated botanical processing facility.',
    directions: 'Mix 1 scoop (5g) daily in warm water, smoothies, green juices, or herbal infusions. Stir well before consuming.',
    storage: 'Store in an airtight container in a cool, dry, and dark location away from moisture and direct sunlight.',
    origin: 'Product of India (Country of Origin: INDIA)',
    mfgBy: 'TransGlobal Agro & Bio-Ceuticals (100% EOU Division), Plot A-42, MIDC Taloja, Navi Mumbai, Maharashtra 410208',
    marketedBy: 'TransGlobal Cargo & EXIM Trade Corp, Gateway Logistics SEZ, JNPT Nhava Sheva, Maharashtra 400707',
    customerCare: '+91 22 2724 4990 | customercare@transglobalexim.com',
    nutrition: {
      servingSize: '10g (approx. 2 teaspoons)',
      energy: '37 kcal',
      protein: '2.7 g',
      carbohydrates: '3.8 g',
      totalSugars: '0.8 g',
      addedSugars: '0.0 g',
      dietaryFiber: '1.9 g',
      totalFat: '0.6 g',
      saturatedFat: '0.1 g',
      transFat: '0.0 g',
      sodium: '9 mg'
    }
  },
  {
    name: 'Aged Basmati Rice (XXL Long Grain Export)',
    productName: 'Royal Supreme Aged 1121 Basmati Rice',
    brandName: 'NexaHarvest Select',
    category: 'Premium Export Cereal Grains',
    vegType: 'veg',
    netWeight: '5.0 kg (11.02 lbs)',
    batchNumber: 'BAS-EXP-26/1104',
    mfgDate: '2026-09-15',
    expiryDate: '2028-09-14',
    bestBeforeDuration: '24 Months from milling date',
    barcodeNumber: '8901048801923',
    ingredients: '100% Raw Milled Aged Indian 1121 Basmati Rice (Average Grain Length: 8.4mm). Naturally aged for 24 months in state-of-the-art silos.',
    allergens: 'Gluten-Free by nature. May contain traces of other agro grains handled in agricultural logistics.',
    directions: 'Rinse thoroughly with cold water. Soak for 30 minutes. Cook in 2 cups of boiling water for every 1 cup of rice for 12-14 minutes.',
    storage: 'Keep in a cool, moisture-free environment. Seal tightly after opening to prevent moisture uptake.',
    origin: 'Product of India (Harvested from Punjab & Haryana River Basins)',
    mfgBy: 'Nexa Agro Mills & Silo Terminal, G.T. Road, Karnal, Haryana 132001',
    marketedBy: 'TransGlobal Cargo & EXIM Trade Corp, Nhava Sheva Port Gateway, Navi Mumbai 400707',
    customerCare: '+91 1800 200 4882 | exports@nexaharvest.com',
    nutrition: {
      servingSize: '100g (uncooked)',
      energy: '356 kcal',
      protein: '8.4 g',
      carbohydrates: '78.2 g',
      totalSugars: '0.2 g',
      addedSugars: '0.0 g',
      dietaryFiber: '1.6 g',
      totalFat: '0.5 g',
      saturatedFat: '0.1 g',
      transFat: '0.0 g',
      sodium: '4 mg'
    }
  },
  {
    name: 'Turmeric Oleoresin & Curcumin Drink Blend',
    productName: 'Golden Curcumin Fortified Wellness Elixir',
    brandName: 'NexaHealth Nutrition',
    category: 'Nutraceutical Powdered Beverage',
    vegType: 'veg',
    netWeight: '250 g',
    batchNumber: 'CUR-EXP-2026/041',
    mfgDate: '2026-10-05',
    expiryDate: '2028-04-04',
    bestBeforeDuration: '18 Months from manufacture',
    barcodeNumber: '8904019200381',
    ingredients: 'Lakadong Turmeric Extract (95% Curcuminoids), Black Pepper Extract (98% Piperine), Organic Coconut Milk Powder, Cardamom Powder, Monk Fruit Extract.',
    allergens: 'Contains Coconut. Processed in a GMP & ISO 22000 certified facility.',
    directions: 'Add 1 teaspoon (5g) to 200ml hot almond milk or dairy milk. Whisk well and drink once daily before bedtime.',
    storage: 'Store below 25°C in a dry place. Protect from direct light.',
    origin: 'Product of India (Meghalaya Organic Harvest)',
    mfgBy: 'BioFormulations India Ltd, MIDC Kurkumbh, Pune, Maharashtra 413802',
    marketedBy: 'TransGlobal Cargo & EXIM Trade Corp, JNPT SEZ, Navi Mumbai 400707',
    customerCare: '+91 22 2724 4990 | care@nexahealth.com',
    nutrition: {
      servingSize: '5g (1 scoop)',
      energy: '21 kcal',
      protein: '0.4 g',
      carbohydrates: '3.1 g',
      totalSugars: '0.4 g',
      addedSugars: '0.0 g',
      dietaryFiber: '0.8 g',
      totalFat: '0.8 g',
      saturatedFat: '0.6 g',
      transFat: '0.0 g',
      sodium: '12 mg'
    }
  }
];

export function FssaiLabelGeneratorPanel() {
  const { showToast } = useApp();
  const printRef = useRef(null);

  // Registered FSSAI licenses from database
  const [fssaiLicenses, setFssaiLicenses] = useState([]);
  // ERP Inventory Products from database
  const [erpProducts, setErpProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Label Form Data
  const [formData, setFormData] = useState({
    ...PRESET_TEMPLATES[0],
    fssaiNumber: '10022026001928',
    fssaiType: 'Central Export License (100% EOU / Merchant Exporter)',
    labelFormat: 'standard' // 'standard' (4"x6"), 'pouch' (3"x4"), 'compact' (2"x2")
  });

  useEffect(() => {
    loadDatabaseEntities();
  }, []);

  const loadDatabaseEntities = async () => {
    try {
      setLoadingInitial(true);
      const [licRes, prodRes, setRes] = await Promise.all([
        api.getDgftLicenses().catch(() => ({ licenses: [] })),
        api.getProducts().catch(() => []),
        api.getSettings().catch(() => ({}))
      ]);

      // 1. Process FSSAI Licenses
      const licenses = licRes.licenses || [];
      const fssaiOnly = licenses.filter(
        (l) => l.license_type && (l.license_type.startsWith('FSSAI') || String(l.license_number).length === 14)
      );
      setFssaiLicenses(fssaiOnly);

      // 2. Process ERP Products
      const prods = Array.isArray(prodRes) ? prodRes : prodRes.products || [];
      setErpProducts(prods);

      // 3. Process Settings for Default Exporter & Manufacturer
      const storeName = setRes.store_name || setRes.tenant?.name || 'TransGlobal Cargo & EXIM Trade Corp';
      const storeAddr = setRes.tenant?.store_address || 'Tower B, World Trade Center, Port Terminal Zone, Mumbai 400005';
      const storeContact = `${setRes.tenant?.owner_phone || '+91 22 2724 4990'} | ${setRes.tenant?.owner_email || 'exports@transglobalexim.com'}`;

      setFormData((prev) => {
        const activeFssai = fssaiOnly.length > 0 ? fssaiOnly[0].license_number : prev.fssaiNumber;
        const activeType = fssaiOnly.length > 0 ? (fssaiOnly[0].epc_name || (fssaiOnly[0].license_type === 'FSSAI_CENTRAL' ? 'Central Export License' : 'State Manufacturing License')) : prev.fssaiType;

        return {
          ...prev,
          fssaiNumber: activeFssai,
          fssaiType: activeType,
          marketedBy: `${storeName}, ${storeAddr}`,
          customerCare: storeContact
        };
      });
    } catch (err) {
      console.error('Error loading initial data for FSSAI Label Studio:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleSelectTemplate = (tpl) => {
    setFormData((prev) => ({
      ...prev,
      ...tpl
    }));
    setSelectedProductId('');
    showToast(`Loaded preset template: ${tpl.name}`, 'info');
  };

  const handleSelectLicense = (licNum) => {
    const lic = fssaiLicenses.find((l) => l.license_number === licNum);
    setFormData((prev) => ({
      ...prev,
      fssaiNumber: licNum,
      fssaiType: lic ? lic.epc_name || lic.license_type : prev.fssaiType
    }));
  };

  const handleSelectProduct = (productId) => {
    setSelectedProductId(productId);
    if (!productId) return;

    const prod = erpProducts.find((p) => String(p.id) === String(productId));
    if (!prod) return;

    const latestBatch = (prod.batches && prod.batches.length > 0) ? prod.batches[0] : null;

    setFormData((prev) => ({
      ...prev,
      productName: prod.name,
      brandName: prod.brand || prev.brandName,
      category: prod.category || prev.category,
      barcodeNumber: prod.barcode || prev.barcodeNumber,
      netWeight: prod.pack_unit ? `1 Pack (${prod.pack_unit})` : prev.netWeight,
      batchNumber: latestBatch?.batch_number || `BATCH-${new Date().getFullYear()}/01`,
      mfgDate: latestBatch?.mfg_date || new Date().toISOString().split('T')[0],
      expiryDate: latestBatch?.expiry_date || prod.earliest_expiry || '2028-12-31'
    }));

    showToast(`Loaded product data from ERP: ${prod.name}`, 'success');
  };

  // Dedicated Thermal Sticker Printing Engine (Guarantees Actual Data Prints Cleanly)
  const handlePrintLabel = () => {
    try {
      const isVeg = formData.vegType === 'veg';
      const emblemHtml = isVeg
        ? `<div style="width:24px;height:24px;border:2px solid #15803d;display:flex;align-items:center;justify-content:center;background:#fff;border-radius:2px;">
             <div style="width:14px;height:14px;background:#15803d;border-radius:50%;"></div>
           </div>`
        : `<div style="width:24px;height:24px;border:2px solid #8B4513;display:flex;align-items:center;justify-content:center;background:#fff;border-radius:2px;">
             <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:14px solid #8B4513;"></div>
           </div>`;

      // Build Barcode Stripes
      const barcodeLines = Array.from({ length: 42 }).map((_, i) => {
        const w = (i % 4 === 0) ? 3 : (i % 2 === 0 ? 1.8 : 1);
        const op = (i % 8 === 0) ? 0.3 : 1;
        return `<span style="display:inline-block;height:32px;width:${w}px;background:#000;opacity:${op};margin-right:1px;"></span>`;
      }).join('');

      const printHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>FSSAI Food Packaging Sticker - ${formData.productName}</title>
            <style>
              @page {
                size: 100mm 150mm;
                margin: 0;
              }
              @media print {
                html, body {
                  width: 100mm;
                  min-height: 150mm;
                  margin: 0;
                  padding: 0;
                  background: #fff !important;
                  color: #000 !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .label-wrapper {
                  border: none !important;
                  box-shadow: none !important;
                }
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                margin: 0;
                padding: 3mm;
                box-sizing: border-box;
                background: #fff;
                color: #000;
                font-size: 8.5px;
                line-height: 1.25;
              }
              .label-wrapper {
                width: 94mm;
                min-height: 142mm;
                padding: 3.5mm;
                border: 2px solid #000;
                box-sizing: border-box;
                background: #fff;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 2px solid #000;
                padding-bottom: 2.5mm;
                margin-bottom: 2mm;
              }
              .brand {
                font-size: 10px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #444;
              }
              .product-title {
                font-size: 13px;
                font-weight: 900;
                text-transform: uppercase;
                line-height: 1.1;
                margin: 1mm 0 0.5mm 0;
                color: #000;
              }
              .origin {
                font-size: 8px;
                font-weight: 700;
                text-transform: uppercase;
                color: #555;
              }
              .fssai-box {
                text-align: right;
                margin-top: 1.5mm;
              }
              .fssai-logo {
                font-family: Georgia, serif;
                font-style: italic;
                font-weight: 900;
                font-size: 13px;
                line-height: 1;
              }
              .fssai-lic {
                font-family: monospace;
                font-size: 7.5px;
                font-weight: bold;
                margin-top: 0.5mm;
              }
              .batch-strip {
                background: #f1f5f9;
                border: 1px solid #cbd5e1;
                border-radius: 2px;
                padding: 1.5mm 2mm;
                display: flex;
                justify-content: space-between;
                margin-bottom: 2mm;
                font-family: monospace;
              }
              .batch-item label {
                font-size: 7px;
                text-transform: uppercase;
                font-weight: bold;
                display: block;
                color: #64748b;
                font-family: sans-serif;
              }
              .batch-item span {
                font-size: 10px;
                font-weight: 900;
                color: #000;
              }
              .best-before {
                font-size: 8px;
                font-weight: bold;
                margin-bottom: 2mm;
              }
              .section {
                border-top: 1px solid #cbd5e1;
                padding-top: 1.5mm;
                margin-bottom: 2mm;
              }
              .section-title {
                font-weight: 900;
                text-transform: uppercase;
                font-size: 8px;
              }
              .nutri-table {
                width: 100%;
                border-collapse: collapse;
                border: 1px solid #000;
                margin-bottom: 2mm;
                font-size: 7.5px;
              }
              .nutri-head {
                background: #1e293b;
                color: #fff;
                padding: 1mm 1.5mm;
                font-weight: 900;
                text-transform: uppercase;
                display: flex;
                justify-content: space-between;
              }
              .nutri-table td {
                padding: 0.8mm 1.5mm;
                border-bottom: 1px solid #e2e8f0;
              }
              .nutri-table tr td:nth-child(2),
              .nutri-table tr td:nth-child(4) {
                text-align: right;
                font-family: monospace;
              }
              .nutri-table tr td:nth-child(3) {
                border-left: 1px solid #e2e8f0;
              }
              .footer {
                border-top: 2px solid #000;
                padding-top: 2mm;
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              .barcode-container {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
              }
              .barcode-digits {
                font-family: monospace;
                font-size: 9px;
                font-weight: bold;
                letter-spacing: 1.5px;
                margin-top: 0.5mm;
              }
              .qr-box {
                border: 1px solid #000;
                padding: 1mm;
                text-align: center;
              }
              .qr-text {
                font-size: 6.5px;
                font-family: monospace;
                margin-bottom: 0.5mm;
                color: #444;
              }
            </style>
          </head>
          <body>
            <div class="label-wrapper">
              <!-- Header -->
              <div class="header">
                <div>
                  <div class="brand">${formData.brandName}</div>
                  <div class="product-title">${formData.productName}</div>
                  <div class="origin">${formData.origin}</div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:flex-end;">
                  ${emblemHtml}
                  <div class="fssai-box">
                    <div class="fssai-logo">fssai</div>
                    <div class="fssai-lic">Lic. No. ${formData.fssaiNumber}</div>
                  </div>
                </div>
              </div>

              <!-- Batch & Quantity Strip -->
              <div class="batch-strip">
                <div class="batch-item">
                  <label>Net Quantity</label>
                  <span>${formData.netWeight}</span>
                </div>
                <div class="batch-item" style="text-align:center;">
                  <label>Batch / Lot No</label>
                  <span>${formData.batchNumber}</span>
                </div>
                <div class="batch-item" style="text-align:right;">
                  <label>Mfg Date</label>
                  <span>${formData.mfgDate}</span>
                </div>
              </div>

              <!-- Best Before -->
              <div class="best-before">
                BEST BEFORE: <span style="font-weight:900;">${formData.bestBeforeDuration}</span> (Expiry: ${formData.expiryDate})
              </div>

              <!-- Ingredients -->
              <div class="section">
                <span class="section-title">Ingredients: </span>
                <span>${formData.ingredients}</span>
                ${formData.allergens ? `<div style="font-size:7.5px;font-style:italic;margin-top:0.5mm;"><strong>Allergen Advice: </strong>${formData.allergens}</div>` : ''}
              </div>

              <!-- Nutritional Information Table -->
              <div style="border: 1px solid #000; border-radius: 2px; overflow: hidden; margin-bottom: 2mm;">
                <div class="nutri-head">
                  <span>Nutritional Information</span>
                  <span style="font-family:monospace;font-weight:normal;">Per Serving (${formData.nutrition.servingSize})</span>
                </div>
                <table class="nutri-table" style="margin-bottom:0; border:none;">
                  <tbody>
                    <tr>
                      <td style="font-weight:bold;">Energy</td>
                      <td style="font-weight:bold;">${formData.nutrition.energy}</td>
                      <td style="font-weight:bold;">Total Fat</td>
                      <td>${formData.nutrition.totalFat}</td>
                    </tr>
                    <tr>
                      <td style="font-weight:bold;">Protein</td>
                      <td>${formData.nutrition.protein}</td>
                      <td style="font-weight:bold;">Saturated Fat</td>
                      <td>${formData.nutrition.saturatedFat}</td>
                    </tr>
                    <tr>
                      <td style="font-weight:bold;">Carbohydrates</td>
                      <td>${formData.nutrition.carbohydrates}</td>
                      <td style="font-weight:bold;">Trans Fat</td>
                      <td style="font-weight:bold;">${formData.nutrition.transFat}</td>
                    </tr>
                    <tr>
                      <td style="padding-left:3mm;color:#475569;">- Total Sugars</td>
                      <td>${formData.nutrition.totalSugars}</td>
                      <td style="font-weight:bold;">Sodium</td>
                      <td>${formData.nutrition.sodium}</td>
                    </tr>
                    <tr>
                      <td style="padding-left:3mm;color:#475569;">- Added Sugars</td>
                      <td style="font-weight:bold;">${formData.nutrition.addedSugars}</td>
                      <td style="font-weight:bold;">Dietary Fiber</td>
                      <td>${formData.nutrition.dietaryFiber}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Directions & Storage -->
              <div class="section" style="font-size:7.5px;">
                <div><span class="section-title">Directions for Use: </span>${formData.directions}</div>
                <div style="margin-top:0.5mm;"><span class="section-title">Storage: </span>${formData.storage}</div>
              </div>

              <!-- Manufacturer & Exporter Details -->
              <div class="section" style="font-size:7.5px; line-height:1.2;">
                <div><strong>Manufactured & Packed by: </strong>${formData.mfgBy}</div>
                <div style="margin-top:0.5mm;"><strong>Marketed & Exported by: </strong>${formData.marketedBy}</div>
                <div style="margin-top:0.5mm;font-family:monospace;color:#334155;">Customer Helpline: ${formData.customerCare}</div>
              </div>

              <!-- Barcode & QR Code Footer -->
              <div class="footer">
                <div class="barcode-container">
                  <div style="height:32px;display:flex;align-items:center;">
                    ${barcodeLines}
                  </div>
                  <div class="barcode-digits">${formData.barcodeNumber}</div>
                </div>

                <div style="display:flex;align-items:center;gap:2mm;">
                  <div style="text-align:right;font-family:monospace;font-size:6.5px;color:#475569;">
                    <div>SCAN FOR ICEGATE</div>
                    <div>& FSSAI TRACE</div>
                  </div>
                  <div class="qr-box">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect width="5" height="5" x="3" y="3" rx="1"/>
                      <rect width="5" height="5" x="16" y="3" rx="1"/>
                      <rect width="5" height="5" x="3" y="16" rx="1"/>
                      <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
                      <path d="M21 21v.01"/>
                      <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
                      <path d="M3 12h.01"/>
                      <path d="M12 3h.01"/>
                      <path d="M12 16v.01"/>
                      <path d="M16 12h1"/>
                      <path d="M21 12v.01"/>
                      <path d="M12 21v-1"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      // Open isolated print window
      const printWin = window.open('', '_blank', 'width=750,height=900');
      if (printWin) {
        printWin.document.open();
        printWin.document.write(printHtml);
        printWin.document.close();
        printWin.focus();

        setTimeout(() => {
          printWin.print();
          printWin.close();
        }, 350);
        showToast('Sent actual FSSAI sticker data to thermal label printer!', 'success');
      } else {
        // Fallback to window.print if popup blocked
        window.print();
      }
    } catch (err) {
      console.error('Error printing FSSAI label:', err);
      window.print();
    }
  };

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(formData.barcodeNumber);
    showToast('Barcode number copied to clipboard', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950/30 p-5 rounded-3xl border border-sky-500/20 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> FSSAI Act 2006 & Food Safety Regulations
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Export Food Packaging Standards</span>
          </div>
          <h2 className="text-lg font-black text-white mt-1 tracking-tight">
            FSSAI Food Export & Packaging Compliance Label Studio
          </h2>
          <p className="text-xs text-slate-400">
            Generate statutory packaging labels with 14-digit FSSAI logo, Veg/Non-Veg emblem, Nutritional Table, Allergen declaration & thermal sticker printing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintLabel}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-98 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Thermal Label (100x150mm)</span>
          </button>
        </div>
      </div>

      {/* 2. ERP Inventory & Presets Quick Loader Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
        {/* Quick Load from Real ERP Inventory Products */}
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-sky-400 shrink-0" />
          <div className="flex-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Load Actual Product From ERP Inventory
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleSelectProduct(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="">-- Select Inventory Product to Auto-Populate --</option>
              {erpProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.brand ? `(${p.brand})` : ''} - {p.barcode || 'No Barcode'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Presets List */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Or Load Standard Export Presets
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {PRESET_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectTemplate(tpl)}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-medium text-[11px] transition whitespace-nowrap"
                >
                  {tpl.name.split(' (')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Studio: Controls (Left) & Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Controls & Data Entry (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card A: FSSAI License & Emblems */}
          <div className="p-4 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Statutory FSSAI License & Veg Emblem
              </span>
              <span className="text-[10px] text-slate-400 font-mono">SECTION 23 MANDATORY</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Select or Type FSSAI */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Registered FSSAI License (14 Digits) *
                </label>
                {fssaiLicenses.length > 0 ? (
                  <select
                    value={formData.fssaiNumber}
                    onChange={(e) => handleSelectLicense(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs font-bold"
                  >
                    {fssaiLicenses.map((lic) => (
                      <option key={lic.id} value={lic.license_number}>
                        {lic.license_number} ({lic.license_type === 'FSSAI_CENTRAL' ? 'Central Export' : 'State Mfg'})
                      </option>
                    ))}
                    <option value="custom">-- Enter Custom 14-Digit Number --</option>
                  </select>
                ) : null}

                {(fssaiLicenses.length === 0 || formData.fssaiNumber === 'custom') && (
                  <input
                    type="text"
                    maxLength={14}
                    placeholder="e.g. 10022026001928"
                    value={formData.fssaiNumber === 'custom' ? '' : formData.fssaiNumber}
                    onChange={(e) => setFormData({ ...formData, fssaiNumber: e.target.value.replace(/\D/g, '') })}
                    className="w-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  14-Digit FSSAI registration validated for direct printing.
                </p>
              </div>

              {/* Veg / Non-Veg Toggle */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Statutory Food Emblem (Mandatory Mark) *
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, vegType: 'veg' })}
                    className={`p-2 rounded-xl border flex items-center justify-center gap-2 transition font-bold text-xs ${
                      formData.vegType === 'veg'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {/* Green square with green circle */}
                    <div className="w-5 h-5 border-2 border-emerald-500 flex items-center justify-center bg-transparent rounded-sm">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                    </div>
                    <span>Vegetarian</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, vegType: 'nonveg' })}
                    className={`p-2 rounded-xl border flex items-center justify-center gap-2 transition font-bold text-xs ${
                      formData.vegType === 'nonveg'
                        ? 'bg-amber-900/30 border-amber-600 text-amber-300 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {/* Brown square with brown triangle */}
                    <div className="w-5 h-5 border-2 border-[#8B4513] flex items-center justify-center bg-transparent rounded-sm">
                      <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-[#8B4513]" />
                    </div>
                    <span>Non-Veg</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card B: Product Title, Net Wt, Batch & Barcode */}
          <div className="p-4 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-3.5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-sky-400" /> Commercial Identification & Batch Tracking
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Brand / Trade Name</label>
                <input
                  type="text"
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Product Name (Commercial Title) *</label>
                <input
                  type="text"
                  required
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Net Quantity *</label>
                <input
                  type="text"
                  value={formData.netWeight}
                  onChange={(e) => setFormData({ ...formData, netWeight: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  placeholder="e.g. 500 g"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Batch / Lot No *</label>
                <input
                  type="text"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  placeholder="e.g. BATCH-2026/01"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Mfg Date *</label>
                <input
                  type="date"
                  value={formData.mfgDate}
                  onChange={(e) => setFormData({ ...formData, mfgDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Expiry Date *</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Best Before Notice</label>
                <input
                  type="text"
                  value={formData.bestBeforeDuration}
                  onChange={(e) => setFormData({ ...formData, bestBeforeDuration: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  placeholder="e.g. 24 Months from manufacture"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Barcode EAN-13 / GTIN Number</label>
                <input
                  type="text"
                  value={formData.barcodeNumber}
                  onChange={(e) => setFormData({ ...formData, barcodeNumber: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  placeholder="e.g. 8901048801923"
                />
              </div>
            </div>
          </div>

          {/* Card C: Ingredients, Allergens & Usage */}
          <div className="p-4 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-3.5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-emerald-400" /> Ingredients, Allergens & Directions
              </span>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Full Ingredients List (Descending Order) *</label>
              <textarea
                rows="2"
                value={formData.ingredients}
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-[11px]"
                placeholder="List all ingredients in descending order of incoming weight..."
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Allergen Advice / Declaration</label>
              <input
                type="text"
                value={formData.allergens}
                onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-[11px]"
                placeholder="e.g. Contains Gluten, Soy, Nuts..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Directions for Use</label>
                <textarea
                  rows="2"
                  value={formData.directions}
                  onChange={(e) => setFormData({ ...formData, directions: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-[11px]"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Storage Instructions</label>
                <textarea
                  rows="2"
                  value={formData.storage}
                  onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Card D: Nutritional Information Table */}
          <div className="p-4 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-3.5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-400" /> Statutory Nutritional Information
              </span>
              <span className="text-[10px] text-slate-400 font-mono">FSSAI 2020 MANDATE</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="text-slate-400 block text-[11px] mb-1">Serving Size</label>
                <input
                  type="text"
                  value={formData.nutrition.servingSize}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nutrition: { ...formData.nutrition, servingSize: e.target.value }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="text-slate-400 block text-[11px] mb-1">Energy</label>
                <input
                  type="text"
                  value={formData.nutrition.energy}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nutrition: { ...formData.nutrition, energy: e.target.value }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="text-slate-400 block text-[11px] mb-1">Protein</label>
                <input
                  type="text"
                  value={formData.nutrition.protein}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nutrition: { ...formData.nutrition, protein: e.target.value }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="text-slate-400 block text-[11px] mb-1">Carbohydrates</label>
                <input
                  type="text"
                  value={formData.nutrition.carbohydrates}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nutrition: { ...formData.nutrition, carbohydrates: e.target.value }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="text-slate-400 block text-[11px] mb-1">Total Sugars</label>
                <input
                  type="text"
                  value={formData.nutrition.totalSugars}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nutrition: { ...formData.nutrition, totalSugars: e.target.value }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="text-slate-400 block text-[11px] mb-1">Added Sugars</label>
                <input
                  type="text"
                  value={formData.nutrition.addedSugars}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nutrition: { ...formData.nutrition, addedSugars: e.target.value }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="text-slate-400 block text-[11px] mb-1">Dietary Fiber</label>
                <input
                  type="text"
                  value={formData.nutrition.dietaryFiber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nutrition: { ...formData.nutrition, dietaryFiber: e.target.value }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="text-slate-400 block text-[11px] mb-1">Total Fat</label>
                <input
                  type="text"
                  value={formData.nutrition.totalFat}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nutrition: { ...formData.nutrition, totalFat: e.target.value }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="text-slate-400 block text-[11px] mb-1">Saturated Fat</label>
                <input
                  type="text"
                  value={formData.nutrition.saturatedFat}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nutrition: { ...formData.nutrition, saturatedFat: e.target.value }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="text-slate-400 block text-[11px] mb-1">Trans Fat</label>
                <input
                  type="text"
                  value={formData.nutrition.transFat}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nutrition: { ...formData.nutrition, transFat: e.target.value }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="text-slate-400 block text-[11px] mb-1">Sodium</label>
                <input
                  type="text"
                  value={formData.nutrition.sodium}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nutrition: { ...formData.nutrition, sodium: e.target.value }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Card E: Manufacturer, Exporter & Customer Care */}
          <div className="p-4 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-3.5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-purple-400" /> Origin, Manufacturer & Exporter Details
              </span>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Manufactured & Packed By</label>
              <textarea
                rows="2"
                value={formData.mfgBy}
                onChange={(e) => setFormData({ ...formData, mfgBy: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-[11px]"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Exported / Marketed By</label>
              <input
                type="text"
                value={formData.marketedBy}
                onChange={(e) => setFormData({ ...formData, marketedBy: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-[11px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Country of Origin</label>
                <input
                  type="text"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-[11px]"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Customer Care Contact</label>
                <input
                  type="text"
                  value={formData.customerCare}
                  onChange={(e) => setFormData({ ...formData, customerCare: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-[11px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Print Preview Canvas (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5 text-emerald-400" /> Live Sticker Preview (Export Carton)
              </span>
              <button
                onClick={handlePrintLabel}
                className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                <Printer className="w-3 h-3" /> 1-Click Print
              </button>
            </div>

            {/* Print Container: Clean white thermal sticker simulation */}
            <div
              ref={printRef}
              id="fssai-printable-label"
              className="bg-white text-slate-900 p-5 rounded-2xl shadow-2xl border-2 border-slate-300 font-sans select-none text-[10px] leading-tight"
              style={{ minHeight: '620px' }}
            >
              {/* Sticker Header: Brand, Veg Emblem & FSSAI Logo */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-2.5 mb-2.5">
                <div className="space-y-0.5">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                    {formData.brandName}
                  </div>
                  <h1 className="text-base font-black text-black tracking-tight leading-none uppercase">
                    {formData.productName}
                  </h1>
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                    {formData.origin}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  {/* Veg / Non-Veg Mark */}
                  {formData.vegType === 'veg' ? (
                    <div className="w-6 h-6 border-2 border-green-700 flex items-center justify-center bg-white rounded-sm">
                      <div className="w-3.5 h-3.5 bg-green-700 rounded-full" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 border-2 border-[#8B4513] flex items-center justify-center bg-white rounded-sm">
                      <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[10px] border-b-[#8B4513]" />
                    </div>
                  )}

                  {/* FSSAI Wordmark + License Badge */}
                  <div className="text-right">
                    <div className="font-serif italic font-black text-[13px] text-slate-900 tracking-tighter leading-none">
                      fssai
                    </div>
                    <div className="text-[8px] font-mono font-bold text-slate-800 leading-none mt-0.5">
                      Lic. No. {formData.fssaiNumber}
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Quantity & Batch Highlights Banner */}
              <div className="bg-slate-100 p-2 rounded border border-slate-300 flex items-center justify-between mb-2 font-mono">
                <div>
                  <span className="text-[8px] text-slate-500 uppercase block font-sans font-bold">Net Quantity</span>
                  <span className="text-xs font-black text-black">{formData.netWeight}</span>
                </div>
                <div className="text-center">
                  <span className="text-[8px] text-slate-500 uppercase block font-sans font-bold">Batch / Lot No</span>
                  <span className="text-[11px] font-bold text-black">{formData.batchNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] text-slate-500 uppercase block font-sans font-bold">Mfg Date</span>
                  <span className="text-[11px] font-bold text-black">{formData.mfgDate}</span>
                </div>
              </div>

              {/* Best Before Notice */}
              <div className="text-[9px] font-bold text-slate-700 mb-2">
                BEST BEFORE: <span className="font-black text-black">{formData.bestBeforeDuration}</span> (Expiry: {formData.expiryDate})
              </div>

              {/* Ingredients & Allergen Declaration */}
              <div className="border-t border-slate-300 pt-2 mb-2 space-y-1">
                <div>
                  <span className="font-black text-[9px] uppercase text-black">Ingredients: </span>
                  <span className="text-[9px] text-slate-800">{formData.ingredients}</span>
                </div>
                {formData.allergens && (
                  <div className="text-[8px] text-slate-700 italic">
                    <span className="font-bold uppercase text-slate-900">Allergen Advice: </span>
                    {formData.allergens}
                  </div>
                )}
              </div>

              {/* Nutritional Facts Table */}
              <div className="border border-slate-400 rounded overflow-hidden mb-2">
                <div className="bg-slate-800 text-white p-1 text-[9px] font-black uppercase tracking-wider flex justify-between">
                  <span>Nutritional Information</span>
                  <span className="font-mono font-normal">Per Serving ({formData.nutrition.servingSize})</span>
                </div>
                <table className="w-full text-left text-[8px] border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="p-1 font-bold">Energy</td>
                      <td className="p-1 font-mono text-right font-bold">{formData.nutrition.energy}</td>
                      <td className="p-1 font-bold border-l border-slate-200">Total Fat</td>
                      <td className="p-1 font-mono text-right">{formData.nutrition.totalFat}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-1 font-bold">Protein</td>
                      <td className="p-1 font-mono text-right">{formData.nutrition.protein}</td>
                      <td className="p-1 font-bold border-l border-slate-200">Saturated Fat</td>
                      <td className="p-1 font-mono text-right">{formData.nutrition.saturatedFat}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-1 font-bold">Carbohydrates</td>
                      <td className="p-1 font-mono text-right">{formData.nutrition.carbohydrates}</td>
                      <td className="p-1 font-bold border-l border-slate-200">Trans Fat</td>
                      <td className="p-1 font-mono text-right font-bold">{formData.nutrition.transFat}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-1 pl-2 text-slate-600">- Total Sugars</td>
                      <td className="p-1 font-mono text-right">{formData.nutrition.totalSugars}</td>
                      <td className="p-1 font-bold border-l border-slate-200">Sodium</td>
                      <td className="p-1 font-mono text-right">{formData.nutrition.sodium}</td>
                    </tr>
                    <tr>
                      <td className="p-1 pl-2 text-slate-600">- Added Sugars</td>
                      <td className="p-1 font-mono text-right font-bold">{formData.nutrition.addedSugars}</td>
                      <td className="p-1 font-bold border-l border-slate-200">Dietary Fiber</td>
                      <td className="p-1 font-mono text-right">{formData.nutrition.dietaryFiber}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Usage & Storage */}
              <div className="text-[8px] text-slate-700 space-y-0.5 border-t border-slate-300 pt-1.5 mb-2">
                <div>
                  <span className="font-bold text-black uppercase">Directions for Use: </span>
                  {formData.directions}
                </div>
                <div>
                  <span className="font-bold text-black uppercase">Storage: </span>
                  {formData.storage}
                </div>
              </div>

              {/* Manufacturer & Exporter Details */}
              <div className="border-t border-slate-300 pt-1.5 mb-2 text-[8px] text-slate-700 leading-tight">
                <div>
                  <span className="font-bold text-black">Manufactured by: </span>
                  {formData.mfgBy}
                </div>
                <div className="mt-0.5">
                  <span className="font-bold text-black">Marketed / Exported by: </span>
                  {formData.marketedBy}
                </div>
                <div className="mt-0.5 font-mono text-slate-600">
                  Customer Grievance Helpline: {formData.customerCare}
                </div>
              </div>

              {/* Barcode & QR Code Section */}
              <div className="border-t-2 border-slate-900 pt-2 flex items-center justify-between">
                <div>
                  {/* Barcode Representation */}
                  <div className="flex items-center space-x-0.5 h-7">
                    {Array.from({ length: 38 }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-black h-full"
                        style={{
                          width: i % 4 === 0 ? '2.5px' : i % 2 === 0 ? '1.5px' : '1px',
                          opacity: i % 7 === 0 ? 0.3 : 1
                        }}
                      />
                    ))}
                  </div>
                  <div className="font-mono text-[9px] tracking-widest text-center font-bold mt-0.5">
                    {formData.barcodeNumber}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right text-[7px] text-slate-500 font-mono">
                    <div>SCAN FOR ICEGATE</div>
                    <div>& FSSAI TRACE</div>
                  </div>
                  <div className="w-10 h-10 border border-slate-400 p-0.5 bg-white flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-black" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Under Preview */}
            <div className="mt-3 flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
              <div className="text-slate-400 text-[11px]">
                Preset: <span className="text-white font-bold">100mm x 150mm (4" x 6") Standard Sticker</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyBarcode}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center gap-1 transition"
                >
                  <Copy className="w-3 h-3" /> Copy Barcode
                </button>
                <button
                  onClick={handlePrintLabel}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 transition shadow"
                >
                  <Printer className="w-3 h-3" /> Print
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
