# Nexa ERP — Multi-Tenant SaaS Platform
### Developed by **SpringNexa Private Limited**

**Nexa ERP** is a modern, high-performance **Multi-Tenant SaaS ERP & Point of Sale (POS)** designed for retail enterprises, pharmacies, grocery chains, and supermarkets.

---

## 🏢 SpringNexa Multi-Tenant Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                      SpringNexa SaaS Cloud Gateway                     │
│                (Nexa ERP • SpringNexa Private Limited)                 │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
┌─────────────────────────────────┐             ┌────────────────────────────────┐
│   SpringNexa Super Admin Portal │             │       Tenant Store Gateway     │
│  • Global Client Directory      │             │  • Scoped by 'x-tenant-id'     │
│  • MRR & SaaS Subscription Hub  │             │  • Custom Domain / Slug        │
│  • Cross-Tenant Platform GMV    │             │  • Multi-Role Staff Access     │
│  • Instant 1-Click Provisioning │             │  • Isolated Invoices & Khatas  │
└─────────────────────────────────┘             └───────────────┬────────────────┘
                                                                │
           ┌────────────────────────────────────────────────────┴───────────────────────────────────┐
           ▼                                                                                        ▼
┌────────────────────────────────────────┐                               ┌────────────────────────────────────────┐
│     Tenant 1: Sanjeevani Medicos       │                               │     Tenant 2: Laxmi Kirana Store       │
│        (Pharma SaaS Client)            │                               │        (Kiryana SaaS Client)           │
│  • FEFO Batch Auto-Selection           │                               │  • Barcode Scanner Auto-Addition       │
│  • Salt / Generic Molecule Search      │                               │  • Loose Weighing Scale Decimals (Kg)  │
│  • Schedule H & H1 Regulatory Logs     │                               │  • Daily Staples Quick-Picks Shelf     │
│  • Strip vs Tablet Unit Conversion     │                               │  • Customer Udhar (Khata Book) Ledger  │
│  • Doctor Prescription Billing         │                               │  • Instant WhatsApp Payment Reminders  │
└────────────────────────────────────────┘                               └────────────────────────────────────────┘
```

---

## ⚡ SaaS Platform Capabilities

### 👑 SpringNexa Super Admin Command Center
- **Tenant Directory:** Monitor all client stores with live metrics (orders, GMV, inventory count).
- **SaaS Subscription Plans:** Manage **Starter (₹799/mo)**, **Professional (₹1,499/mo)**, and **Enterprise (₹2,999/mo)** tiers.
- **Automated Provisioning:** Onboard any new store tenant in under 5 seconds with automated vertical defaults and catalog seeding.
- **Tenant Workspace Switcher:** Seamlessly jump between tenant workspaces without logging out.

### 💊 Pharma / Chemist Mode (Tenant Scoped)
- **FEFO Engine:** Recommends earliest-expiring active batches first.
- **Drug Salt Substitution:** 1-click discovery of alternate brand generic substitutes for out-of-stock items.
- **Regulatory Registers:** Prescribing Doctor and Patient logging with an audit register for statutory Drug Inspector audits.
- **Packaging Conversion:** Sell full packs (Strips, Bottles) or loose units (Tablets) with automated fractional price formulas.

### 🛒 Kiryana / Grocery Mode (Tenant Scoped)
- **High-Speed Counter POS:** Sub-second barcode scanner auto-add and keyboard-only checkout.
- **Loose Items & Decimal Quantities:** Decimal weighing scale support (e.g. `0.250 kg`, `1.750 kg`) with per-Kg pricing.
- **Quick-Picks Shelf:** 1-click visual tiles for high-frequency daily staples (Atta, Sugar, Dal, Oil, Tata Salt, Maggi).
- **Customer Udhar (Khata Book):** Real-time balance checks, credit limits, and WhatsApp reminder generation.

---

## ⌨️ Global Keyboard Shortcuts

| Shortcut | Function |
| :--- | :--- |
| **`F1`** | Counter POS Billing (Focuses Search / Barcode Bar) |
| **`F2`** | Products & Inventory Catalog |
| **`F3`** | Customer Khata (Udhar / Credit Book) |
| **`F4`** | Purchases & Stock Inward Entry |
| **`F5`** | Expiry Alerts & Drug Regulatory Register |
| **`F6`** | Financial Reports & Day Closing (Z-Report) |
| **`F7`** | Store Settings & Profile |
| **`F8`** | Hold / Suspend Active Customer Cart |
| **`F12`** | Pay & Settle Invoice (Opens Payment Dialog) |

---

## 🚀 How to Run

1. **Launch Server and Web Client:**
   ```powershell
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

2. **Launch as Desktop Application:**
   ```powershell
   npm start
   ```

3. **Reset / Re-seed Multi-Tenant Database:**
   ```powershell
   npm run seed
   ```
   *(Pre-seeds Sanjeevani Medicos, Laxmi Kirana, Metro HyperMart, and SpringNexa Super Admin).*

---

© 2026 **SpringNexa Private Limited**. All Rights Reserved.  
*Nexa ERP is an enterprise multi-tenant cloud & on-premise SaaS software product.*
