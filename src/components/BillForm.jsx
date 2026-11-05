import React, { useState } from 'react';
import {
  IndianRupee,
  Calendar,
  CreditCard,
  Hash,
  Sparkles,
  Printer,
  Save,
  RotateCcw,
  ChevronDown,
  Loader2,
  Users,
  UserCheck,
  Bookmark,
  X,
  Scale,
  Receipt,
  Calculator,
  Landmark,
  MapPin,
  Plus,
  Trash2
} from 'lucide-react';
import { PAYMENT_METHODS } from '../data/defaultMakes';
import { getTodayDateString, formatCurrency, calculateBillTotals } from '../utils/formatters';
import SavedCustomersModal from './SavedCustomersModal';
import DateInput from './DateInput';

export default function BillForm({
  bill,
  onChange,
  _makes,
  customers = [],
  onSaveCustomer,
  onDeleteCustomer,
  onSavePdf,
  onSave,
  onNewBill,
  settings,
  isGeneratingPdf,
  isSaving
}) {
  const [showAdvancedCustomer, setShowAdvancedCustomer] = useState(true);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);

  const currencySymbol = bill.currencySymbol || settings.currencySymbol || '₹';

  // Ensure items array is always available
  const items = (bill.items && bill.items.length > 0)
    ? bill.items
    : [{
        id: 'item-1',
        make: bill.make || 'Freight Transport',
        modelOrItem: bill.modelOrItem || 'Parcel Cargo',
        serialOrRef: bill.serialOrRef || '',
        totalReceipts: bill.totalReceipts !== undefined ? bill.totalReceipts : '',
        totalWeight: bill.totalWeight !== undefined ? bill.totalWeight : '',
        ratePerKg: bill.ratePerKg !== undefined ? bill.ratePerKg : '',
        amount: bill.amount || '',
        quantity: bill.quantity || 1,
        notes: ''
      }];

  // Handle updates to specific line item
  // Automatically calculates Amount:
  // - If Total Weight > 0 & Rate > 0 => Amount = Weight * Rate
  // - If Total Weight is 'mm' (or empty) & Receipts > 0 & Rate > 0 => Amount = Receipts * Rate
  const handleUpdateItem = (index, field, value) => {
    const updated = [...items];
    const currentItem = { ...updated[index], [field]: value };

    const weightVal = field === 'totalWeight' ? value : currentItem.totalWeight;
    const rateVal = field === 'ratePerKg' ? value : currentItem.ratePerKg;
    const receiptsVal = field === 'totalReceipts' ? value : currentItem.totalReceipts;

    // Automatically calculate Amount when weight, rate, or receipts are modified
    if (field === 'totalWeight' || field === 'ratePerKg' || field === 'totalReceipts') {
      const w = parseFloat(weightVal);
      const r = parseFloat(rateVal);
      const rc = parseFloat(receiptsVal);
      const isMm = /^(mm|min|minimum)$/i.test(String(weightVal || '').trim());

      if (isMm && !isNaN(rc) && !isNaN(r) && rc > 0 && r > 0) {
        // Minimum charge: Total Receipts * Minimum Rate (e.g. 2 * 200 = 400)
        const res = rc * r;
        currentItem.amount = res % 1 === 0 ? res.toFixed(0) : res.toFixed(2);
      } else if (!isNaN(w) && !isNaN(r) && w > 0 && r > 0) {
        // Standard: Weight * Rate (e.g. 857 * 10 = 8570)
        const res = w * r;
        currentItem.amount = res % 1 === 0 ? res.toFixed(0) : res.toFixed(2);
      } else if (!weightVal || !rateVal) {
        if (!isMm) {
          currentItem.amount = '';
        }
      }
    }

    updated[index] = currentItem;
    const first = updated[0] || {};
    onChange({
      ...bill,
      items: updated,
      // Keep primary fields synced
      make: first.make || '',
      modelOrItem: first.modelOrItem || '',
      serialOrRef: first.serialOrRef || '',
      totalReceipts: first.totalReceipts !== undefined ? first.totalReceipts : '',
      totalWeight: first.totalWeight !== undefined ? first.totalWeight : '',
      ratePerKg: first.ratePerKg !== undefined ? first.ratePerKg : '',
      amount: first.amount || '',
      quantity: first.quantity || 1
    });
  };

  const handleAddItem = (defaultWeight = 'mm') => {
    const newItem = {
      id: `item-${Date.now()}-${items.length + 1}`,
      make: 'Freight Transport',
      modelOrItem: 'Parcel Cargo',
      serialOrRef: '',
      totalReceipts: '',
      totalWeight: defaultWeight,
      ratePerKg: '',
      amount: '',
      quantity: 1,
      notes: ''
    };
    const updated = [...items, newItem];
    onChange({ ...bill, items: updated });
  };

  const handleRemoveItem = (index) => {
    if (index === 0 || items.length <= 1) return; // Main Freight (index 0) cannot be removed or deleted
    const updated = items.filter((_, idx) => idx !== index);
    const first = updated[0] || {};
    onChange({
      ...bill,
      items: updated,
      totalReceipts: first.totalReceipts !== undefined ? first.totalReceipts : '',
      totalWeight: first.totalWeight !== undefined ? first.totalWeight : '',
      ratePerKg: first.ratePerKg !== undefined ? first.ratePerKg : '',
      amount: first.amount || ''
    });
  };

  // Handle general field change (tax, discount, dates, customer)
  const handleChange = (field, value) => {
    onChange({ ...bill, [field]: value });
  };

  // Handle multiple field updates atomically without race condition
  const handleMultiChange = (updates) => {
    onChange({ ...bill, ...updates });
  };

  // Customer selection (Auto-fills contact + saved payment & bank details)
  const handleSelectCustomer = (customer) => {
    onChange({
      ...bill,
      customerName: customer.name,
      customerGstin: customer.gstin || customer.customerGstin || '',
      ...(customer.paymentMethod ? { paymentMethod: customer.paymentMethod } : {}),
      ...(customer.bankName ? { bankName: customer.bankName } : {}),
      ...(customer.accountNumber ? { accountNumber: customer.accountNumber } : {}),
      ...(customer.ifscCode ? { ifscCode: customer.ifscCode } : {}),
      ...(customer.branch ? { branch: customer.branch } : {}),
      ...(customer.chequeBank ? { chequeBank: customer.chequeBank } : {}),
      ...(customer.chequeNumber ? { chequeNumber: customer.chequeNumber } : {}),
      ...(customer.transactionRef ? { transactionRef: customer.transactionRef } : {})
    });
    setShowNameSuggestions(false);
  };

  const handleClearCustomer = () => {
    onChange({
      ...bill,
      customerName: '',
      customerGstin: ''
    });
  };

  // Suggestions while typing customer name
  const nameQuery = (bill.customerName || '').trim().toLowerCase();
  const matchingSuggestions = nameQuery
    ? customers.filter(
        c => c.name.toLowerCase().includes(nameQuery) &&
        c.name.toLowerCase() !== nameQuery
      )
    : [];

  // Compute live calculations
  const { subtotal } = calculateBillTotals({
    ...bill,
    items
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar (Sticky in left scroll container) */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs p-2.5 flex items-center gap-2 transition-colors">
        <button
          type="button"
          onClick={onNewBill}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/70 dark:border-slate-700/80 rounded-xl transition-all whitespace-nowrap cursor-pointer shadow-2xs"
          title="Start a new blank bill"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Bill</span>
        </button>
        <button
          type="button"
          onClick={() => onSave && onSave()}
          disabled={isSaving}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap cursor-pointer shadow-2xs ${
            isSaving
              ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
              : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border-emerald-200/80 dark:border-emerald-800/60'
          }`}
          title="Save bill to invoices history"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => onSavePdf && onSavePdf()}
          disabled={isGeneratingPdf}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all whitespace-nowrap disabled:opacity-50 cursor-pointer"
          title="Automatically compiles and downloads this bill as a single-page A4 PDF file"
        >
          {isGeneratingPdf ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving A4 PDF...</span>
            </>
          ) : (
            <>
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save A4 PDF</span>
            </>
          )}
        </button>
      </div>

      {/* SECTION 1: Product / Freight Calculation Details */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs p-5 space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Product & Freight Details</h3>
            </div>
          </div>
          <span className="text-xs font-mono font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-850/60 px-2.5 py-0.5 rounded-md">
            Subtotal: {formatCurrency(subtotal, currencySymbol)}
          </span>
        </div>

        {/* Freight Calculation Fields (Supports Row 1 Weight Freight + Row 2 Minimum / mm Charge) */}
        <div className="space-y-3">
          {items.map((item, index) => {
            const isMm = String(item.totalWeight || '').trim().toLowerCase() === 'mm';
            const weightNum = parseFloat(item.totalWeight);
            const rateNum = parseFloat(item.ratePerKg);
            const rcNum = parseFloat(item.totalReceipts);
            const hasWeightCalc = !isNaN(weightNum) && !isNaN(rateNum) && weightNum > 0 && rateNum > 0;
            const hasMmCalc = isMm && !isNaN(rcNum) && !isNaN(rateNum) && rcNum > 0 && rateNum > 0;

            return (
              <div
                key={item.id || index}
                className="p-4 bg-slate-50/70 dark:bg-[#0f172a]/70 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 transition-colors relative"
              >
                {/* Row Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Line {index + 1} {index === 0 ? '(Main Freight)' : '(Minimum / Extra Line)'}
                    </span>
                    {isMm && (
                      <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                        ⚡ mm Minimum Charge
                      </span>
                    )}
                  </div>

                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                      title="Remove this freight line"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* 1. Total Receipt */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Total Receipt
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="e.g. 8"
                      value={item.totalReceipts ?? ''}
                      onChange={(e) => handleUpdateItem(index, 'totalReceipts', e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] font-mono"
                    />
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">LR count / slips</span>
                  </div>

                  {/* 2. Total Weight */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Total Weight
                      </label>
                      <button
                        type="button"
                        onClick={() => handleUpdateItem(index, 'totalWeight', item.totalWeight === 'mm' ? '' : 'mm')}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                          isMm
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60'
                        }`}
                        title="Click to set weight as mm (Minimum charge)"
                      >
                        mm (Min)
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. 857 or mm"
                        value={item.totalWeight ?? ''}
                        onChange={(e) => handleUpdateItem(index, 'totalWeight', e.target.value)}
                        className="w-full pl-3 pr-10 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] font-mono"
                      />
                      <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                        {isMm ? 'MIN' : 'KG'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                      {isMm ? 'Minimum flat charge' : 'In Kilograms'}
                    </span>
                  </div>

                  {/* 3. Rate */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      {isMm ? 'Rate / Min (₹)' : 'Rate per KG (₹)'}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-xs font-semibold text-slate-400 dark:text-slate-500 font-mono">
                        {currencySymbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder={isMm ? 'e.g. 200' : 'e.g. 10'}
                        value={item.ratePerKg ?? ''}
                        onChange={(e) => handleUpdateItem(index, 'ratePerKg', e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-full pl-7 pr-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] font-mono"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                      {isMm ? 'Price per receipt' : 'Price per KG'}
                    </span>
                  </div>

                  {/* 4. Amount (₹) - Auto or Direct */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Calculator className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Amount (₹)
                      </span>
                      <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-md">
                        ⚡ Auto
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                        {currencySymbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={item.amount ?? ''}
                        onChange={(e) => handleUpdateItem(index, 'amount', e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-full pl-7 pr-3 py-2 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 block">
                      {hasWeightCalc ? 'Auto (Weight × Rate)' : hasMmCalc ? 'Auto (Receipts × Rate)' : 'Auto / Direct'}
                    </span>
                  </div>
                </div>

                {/* Pricing Banner per line */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-100/80 dark:border-emerald-900/40 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-200 text-[11px]">
                    {hasWeightCalc ? (
                      <>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">Formula:</span>
                        <span className="font-mono">
                          {item.totalWeight} KG × {currencySymbol}{item.ratePerKg}/KG ={' '}
                          <strong className="text-emerald-950 dark:text-emerald-100 font-bold">
                            {currencySymbol}{item.amount || '0.00'}
                          </strong>
                        </span>
                      </>
                    ) : hasMmCalc ? (
                      <>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">Minimum Charge:</span>
                        <span className="font-mono">
                          {item.totalReceipts} Slips × {currencySymbol}{item.ratePerKg} (mm) ={' '}
                          <strong className="text-emerald-950 dark:text-emerald-100 font-bold">
                            {currencySymbol}{item.amount || '0.00'}
                          </strong>
                        </span>
                      </>
                    ) : parseFloat(item.amount) > 0 ? (
                      <>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">Line Amount:</span>
                        <span className="font-mono">
                          {currencySymbol}{item.amount}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Enter numbers above to auto-calculate amount
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/50 px-2 py-0.5 rounded-md">
                    {hasWeightCalc ? '✓ Weight × Rate' : hasMmCalc ? '✓ mm Minimum' : 'Line Total'}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Add Line Action Button */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => handleAddItem('mm')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Line (e.g. Minimum Charge / Row 2)</span>
            </button>

            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
              Total: {formatCurrency(subtotal, currencySymbol)}
            </span>
          </div>

          {/* Print Column Toggle */}
          <div className="flex items-center justify-end pt-0.5">
            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={bill.printWeightRate !== false}
                onChange={(e) => handleChange('printWeightRate', e.target.checked)}
                className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-emerald-500 cursor-pointer"
              />
              <span>Print Weight & Rate on Bill</span>
            </label>
          </div>
        </div>

        {/* Billing Date, Bill No. & Place */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Bill Details & Reference
            </label>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Choose dates individually</span>
          </div>

          <div className="space-y-3">
            {/* 1. Date Fields: Choose every date individually with calendar pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Bill Date (Top Right on Invoice) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Bill Date (Top Right)</span>
                  <button
                    type="button"
                    onClick={() => handleChange('date', getTodayDateString())}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
                  >
                    Today
                  </button>
                </div>
                <DateInput
                  value={bill.date || ''}
                  onChange={(val) => handleChange('date', val)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 font-medium"
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                  Printed at top right Date :
                </span>
              </div>

              {/* Table Date From (First line in table DATE column) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Table Date (From)</span>
                  <button
                    type="button"
                    onClick={() => handleChange('tableStartDate', getTodayDateString())}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
                  >
                    Today
                  </button>
                </div>
                <DateInput
                  value={bill.tableStartDate !== undefined ? bill.tableStartDate : (bill.date || '')}
                  onChange={(val) => handleChange('tableStartDate', val)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 font-medium"
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                  First date in table DATE column
                </span>
              </div>

              {/* Table Date To (Second line in table DATE column) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Table Date (To)</span>
                  {(bill.tableEndDate || bill.dueDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        handleChange('tableEndDate', '');
                        handleChange('dueDate', '');
                      }}
                      className="text-[10px] text-rose-500 hover:underline font-medium cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <DateInput
                  value={bill.tableEndDate !== undefined ? bill.tableEndDate : (bill.dueDate || '')}
                  onChange={(val) => {
                    handleChange('tableEndDate', val);
                    handleChange('dueDate', val);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 font-medium"
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                  End date after "To" in table
                </span>
              </div>
            </div>

            {/* 2. Bill Number & Place */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Bill / Invoice Number */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Bill No.</span>
                  <Hash className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  type="text"
                  placeholder="Enter Bill No."
                  value={bill.invoiceNumber || ''}
                  onChange={(e) => handleChange('invoiceNumber', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 font-mono font-medium"
                />
              </div>

              {/* Place */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Place</span>
                  <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  type="text"
                  placeholder="Mumbai"
                  value={bill.place !== undefined ? bill.place : 'Mumbai'}
                  onChange={(e) => handleChange('place', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>
            </div>

            {/* Transport Route / Title */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Transport Route / Title</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">e.g. SURAT TO MUMBAI (centered & underlined)</span>
              </div>
              <input
                type="text"
                placeholder="SURAT TO MUMBAI"
                value={bill.route !== undefined ? bill.route : 'SURAT TO MUMBAI'}
                onChange={(e) => handleChange('route', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 font-bold uppercase tracking-wider"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Payment Method & Transaction Details */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs p-5 space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Payment Method & Transaction</h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
            {bill.paymentMethod || 'Cash'}
          </span>
        </div>

        {/* Payment Method Selector Buttons */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Select Payment Method <span className="text-slate-400 dark:text-slate-500 font-normal">(Click any method to enter transaction details)</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PAYMENT_METHODS.map(method => (
              <button
                key={method.id}
                type="button"
                onClick={() => handleChange('paymentMethod', method.id)}
                className={`px-3 py-2.5 rounded-xl text-xs font-medium text-center border transition-all cursor-pointer ${
                  bill.paymentMethod === method.id
                    ? 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-xs'
                    : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Transaction Detail Card for Selected Payment Method */}
        <div className="p-4 bg-slate-50/80 dark:bg-[#0f172a]/70 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in zoom-in-95 duration-150 transition-colors">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{bill.paymentMethod || 'Payment'} Transaction Details</span>
            </div>
          </div>

          {/* 1. If CHEQUE is selected */}
          {bill.paymentMethod === 'Cheque' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Hash className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Cheque Number *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter Cheque Number"
                    value={bill.chequeNumber || ''}
                    onChange={(e) => {
                      const cleanDigits = e.target.value.replace(/\D/g, '').slice(0, 6);
                      handleMultiChange({
                        chequeNumber: cleanDigits,
                        transactionRef: cleanDigits
                      });
                    }}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 font-mono font-bold tracking-wider"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Strictly 6-digit cheque number</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      Cheque Date
                    </label>
                    {bill.chequeDate && (
                      <button
                        type="button"
                        onClick={() => handleChange('chequeDate', '')}
                        className="text-[10px] text-rose-500 hover:text-rose-700 dark:text-rose-400 hover:underline font-medium cursor-pointer"
                      >
                        Clear Date
                      </button>
                    )}
                  </div>
                  <DateInput
                    value={bill.chequeDate || ''}
                    onChange={(val) => handleChange('chequeDate', val)}
                    placeholder="dd/mm/yyyy"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Landmark className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Drawee Bank Name
                  </label>
                  <input
                    type="text"
                    maxLength={50}
                    placeholder="Enter Bank Name"
                    value={bill.chequeBank || ''}
                    onChange={(e) => handleChange('chequeBank', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50/70 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200/80 dark:border-emerald-800/60 flex items-center gap-1.5">
                <span>✓</span> Cheque number, date & bank automatically print on the bottom cheque slip.
              </p>
            </div>
          )}

          {/* 2. If UPI is selected */}
          {bill.paymentMethod === 'UPI' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  UPI UTR / Transaction ID (12-Digit)
                </label>
                <input
                  type="text"
                  placeholder="Enter 12-digit UTR ID"
                  value={bill.transactionRef || ''}
                  onChange={(e) => handleChange('transactionRef', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 font-mono font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  UPI App / VPA (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Enter UPI App / VPA (Optional)"
                  value={bill.upiApp || ''}
                  onChange={(e) => handleChange('upiApp', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {/* 3. If NET BANKING (NEFT / RTGS) is selected */}
          {bill.paymentMethod === 'Bank Transfer' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  NEFT / RTGS / IMPS UTR Number
                </label>
                <input
                  type="text"
                  placeholder="Enter UTR Number"
                  value={bill.transactionRef || ''}
                  onChange={(e) => handleChange('transactionRef', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 font-mono font-medium uppercase"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Remitter / Sender Bank Name
                </label>
                <input
                  type="text"
                  placeholder="Enter Bank Name"
                  value={bill.transactionBank || ''}
                  onChange={(e) => handleChange('transactionBank', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {/* 4. If CARD is selected */}
          {bill.paymentMethod === 'Card' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Card Last 4 Digits
                </label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="Enter Last 4 Digits"
                  value={bill.cardLast4 || ''}
                  onChange={(e) => handleChange('cardLast4', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Card Slip / Auth Code
                </label>
                <input
                  type="text"
                  placeholder="Enter Auth / Slip Code"
                  value={bill.transactionRef || ''}
                  onChange={(e) => handleChange('transactionRef', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
            </div>
          )}

          {/* 5. If CASH is selected */}
          {bill.paymentMethod === 'Cash' && (
            <div className="py-2.5 px-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
              <span className="font-bold text-sm">✓</span>
              <span>Cash payment selected. No additional transaction or receipt details required.</span>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: Customer Information (With Unclipped Full Directory Modal & Autocomplete) */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs transition-colors">
        <div className="p-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0f172a]/50 rounded-t-2xl">
          <button
            type="button"
            onClick={() => setShowAdvancedCustomer(!showAdvancedCustomer)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left cursor-pointer"
          >
            <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center">
              3
            </span>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                Customer Information
                {customers.length > 0 && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                    {customers.length} saved
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {bill.customerName ? `Billed to: ${bill.customerName}` : 'Walk-in Customer (or select saved customer)'}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            {/* Quick button to open Saved Customers Directory */}
            {customers.length > 0 && (
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl transition-all cursor-pointer shadow-2xs"
                title="View full customer directory to select"
              >
                <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Saved Customers ({customers.length})</span>
              </button>
            )}

            {/* Save current customer manually */}
            {bill.customerName && bill.customerName.trim() && (
              <button
                type="button"
                onClick={() =>
                  onSaveCustomer({
                    name: bill.customerName,
                    phone: bill.customerPhone,
                    email: bill.customerEmail,
                    address: bill.customerAddress,
                    paymentMethod: bill.paymentMethod,
                    bankName: bill.bankName,
                    accountNumber: bill.accountNumber,
                    ifscCode: bill.ifscCode,
                    branch: bill.branch,
                    chequeBank: bill.chequeBank,
                    chequeNumber: bill.chequeNumber,
                    transactionRef: bill.transactionRef
                  })
                }
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl transition-colors cursor-pointer"
                title="Save this customer's details and payment preferences for future bills"
              >
                <Bookmark className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Save</span>
              </button>
            )}

            {/* Clear details */}
            {bill.customerName && (
              <button
                type="button"
                onClick={handleClearCustomer}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Clear customer fields"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowAdvancedCustomer(!showAdvancedCustomer)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-transform cursor-pointer"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showAdvancedCustomer ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>

        {showAdvancedCustomer && (
          <div className="p-5 space-y-4 bg-slate-50/40 dark:bg-[#0f172a]/40 rounded-b-2xl transition-colors">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer Name with Smart Autocomplete */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Customer Name</label>
                  {customers.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsCustomerModalOpen(true)}
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
                    >
                      Browse Directory ({customers.length})
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Enter Customer Name"
                  value={bill.customerName || ''}
                  onChange={(e) => {
                    handleChange('customerName', e.target.value);
                    setShowNameSuggestions(true);
                  }}
                  onFocus={() => setShowNameSuggestions(true)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-slate-100"
                />

                {/* Autocomplete suggestions dropdown when typing */}
                {showNameSuggestions && matchingSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 custom-scrollbar">
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                      <span>Matching Customers:</span>
                      <button
                        type="button"
                        onClick={() => setShowNameSuggestions(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    {matchingSuggestions.map((cust) => (
                      <button
                        key={cust.id || cust.name}
                        type="button"
                        onClick={() => handleSelectCustomer(cust)}
                        className="w-full text-left px-3 py-2.5 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                            {cust.name}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                            {cust.gstin ? `GSTIN: ${cust.gstin} ` : ''}
                            {cust.paymentMethod ? `• Payment: ${cust.paymentMethod}` : ''}
                          </span>
                        </div>
                        <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer GSTIN */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">GSTIN</label>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                    {bill.customerGstin ? (
                      bill.customerGstin.length === 15 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ 15 Characters</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">{bill.customerGstin.length}/15 chars</span>
                      )
                    ) : (
                      <span>15 characters</span>
                    )}
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="GSTIN ID"
                  value={bill.customerGstin || ''}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 15);
                    handleChange('customerGstin', clean);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 font-mono uppercase tracking-wider font-semibold"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Directory Modal (No clipping, full proper details!) */}
      <SavedCustomersModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customers={customers}
        onSelectCustomer={handleSelectCustomer}
        onDeleteCustomer={onDeleteCustomer}
      />
    </div>
  );
}
