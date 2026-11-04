# BillCraft - Smart Bill & Invoice Generator

A modern, responsive billing web application created specifically for fast bill generation by selecting a **Make**, entering an **Amount**, and choosing a **Date**.

## 🚀 Quick Start

1. **Double-click `start.bat`** (or run `npm run dev` in terminal)
2. Open your browser at [http://localhost:5173](http://localhost:5173)

---

## ✨ Features

- **Make / Brand Selection**:
  - Filter and select from pre-configured brands across Automotive, Electronics, Appliances, and Services.
  - Add your own custom makes/brands with categories anytime via the **"Add / Manage Makes"** modal.
  - Optional model description & serial/registration fields.
- **Amount & Pricing**:
  - Custom amount input with 1-click quick-amount chips ($50, $100, $250, $500, etc.).
  - Quantity calculation and instant subtotal.
  - Multi-currency support (USD `$`, INR `₹`, EUR `€`, GBP `£`, and more).
- **Date & Timeline**:
  - Billing date picker with quick "Today" shortcut.
  - Due date picker with `+7d` and `+15d` presets.
  - Auto-incrementing invoice numbering (e.g. `INV-2026-0001`).
- **Tax & Discount**:
  - Percentage (%) or fixed amount ($) discounts with 1-click preset chips.
  - Configurable tax/GST/VAT rates (0%, 5%, 10%, 12%, 18%, 28%, or custom).
- **Payment Method & Status**:
  - Select payment method: Cash, Card, UPI / QR, Bank Transfer, Cheque, or Online.
  - Payment status tracking: Paid, Pending, Partially Paid, Cancelled.
- **Live Invoice Preview & PDF Print**:
  - Real-time side-by-side preview formatted as a standard A4 commercial invoice.
  - 1-click **"Print / Save PDF"** button optimized with `@media print` CSS for clean PDF export or printing.
- **Bill History & Dashboard**:
  - Automatic local storage persistence (all bills are saved locally).
  - Summary cards for Total Revenue, Paid Revenue, and Pending Revenue.
  - Search, filter, duplicate, print, and export to CSV spreadsheet.
- **Customizable Business Profile**:
  - Company name, tagline, address, contact details, tax ID, notes, and terms & conditions.
