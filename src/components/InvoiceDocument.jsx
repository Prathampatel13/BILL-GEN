import React from 'react';
import { formatDate, formatReceiptDate, amountToRupeesWords, calculateBillTotals } from '../utils/formatters';

export default function InvoiceDocument({
  id = 'invoice-document',
  bill,
  businessProfile = {}
}) {
  if (!bill) return null;

  // Calculate totals across all line items
  const { items, totalAmount } = calculateBillTotals(bill);

  // Dynamic payment method display flags
  const isCheque = bill.paymentMethod === 'Cheque';

  return (
    <div
      id={id}
      className="print-container bg-white border border-slate-300 rounded-sm shadow-md p-6 sm:p-8 flex-1 flex flex-col justify-between text-black font-sans relative"
    >
      <div>
        {/* Company Title & Address Header */}
        <div className="text-center pb-3 border-b-2 border-black space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-black uppercase">
            {businessProfile.name || 'SHREE CARGO'}
          </h1>
          {businessProfile.tagline && (
            <p className="text-xs font-semibold text-black tracking-wide">
              {businessProfile.tagline}
            </p>
          )}
          <div className="text-[11px] sm:text-xs text-black leading-tight pt-0.5 space-y-0.5">
            {businessProfile.address && <p>{businessProfile.address}</p>}
            {businessProfile.city && <p>{businessProfile.city}</p>}
            {businessProfile.taxId && (
              <p className="font-bold pt-0.5">
                GSTIN / Tax ID: <span className="font-mono">{businessProfile.taxId}</span>
              </p>
            )}
          </div>
        </div>

        {/* Bill Metadata: Billed To (Left) & Bill Number / Date / Place (Right) */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 py-3 text-xs text-black font-semibold">
          {/* Left: Customer Info */}
          <div className="sm:col-span-7 space-y-1">
            <div className="flex">
              <span className="w-16 shrink-0 text-black">M/s.</span>
              <span className="mr-1.5">:</span>
              <span className="font-bold text-sm uppercase">{bill.customerName || 'Walk-in Customer'}</span>
            </div>
            {bill.customerGstin && (
              <div className="flex">
                <span className="w-16 shrink-0 text-black">GSTIN</span>
                <span className="mr-1.5">:</span>
                <span className="font-mono font-bold tracking-wider">{bill.customerGstin}</span>
              </div>
            )}
          </div>

          {/* Right: Bill No, Date, Place */}
          <div className="sm:col-span-5 space-y-1 sm:text-right">
            <div className="flex sm:justify-end">
              <span className="w-20 sm:w-auto sm:mr-2 text-black">Bill No.</span>
              <span className="mr-1.5 sm:mr-2">:</span>
              <span className="font-mono font-bold text-sm">{bill.invoiceNumber || ''}</span>
            </div>
            <div className="flex sm:justify-end">
              <span className="w-20 sm:w-auto sm:mr-2 text-black">Date</span>
              <span className="mr-1.5 sm:mr-2">:</span>
              <span className="font-mono">{bill.date ? formatDate(bill.date) : ''}</span>
            </div>
            <div className="flex sm:justify-end">
              <span className="w-20 sm:w-auto sm:mr-2 text-black">Place</span>
              <span className="mr-1.5 sm:mr-2">:</span>
              <span className="font-bold">{businessProfile.city ? businessProfile.city.split(',')[0].trim() : 'Mumbai'}</span>
            </div>
          </div>
        </div>

        {/* Main Freight Bill Table (Exact 1:1 match to WhatsApp receipt photo) */}
        <div className="mt-1 border-2 border-black text-xs bg-white text-black">
          {/* 1. Header Row */}
          <div className="grid grid-cols-12 border-b-2 border-black text-[12px] font-bold text-black uppercase tracking-tight py-2 px-3">
            <div className="col-span-3 text-left">DATE</div>
            <div className="col-span-2 text-center">TOTAL RECIEPT</div>
            <div className="col-span-3 text-center">TOTAL WEIGHT</div>
            <div className="col-span-2 text-center">RATE PER KG</div>
            <div className="col-span-2 text-right">AMOUNT</div>
          </div>

          {/* 2. Items Rows */}
          {items.map((item, idx) => {
            const weight = parseFloat(item.totalWeight);
            const rate = parseFloat(item.ratePerKg);
            const hasWeightRate = !isNaN(weight) && !isNaN(rate) && weight > 0 && rate > 0 && bill.printWeightRate !== false;
            const itemTotal = hasWeightRate
              ? (weight * rate)
              : (parseFloat(item.amount) || 0);

            // Dynamic based on Bill Date and Due Date (reflects only when user selects date!)
            const startDate = bill.date ? formatReceiptDate(bill.date) : '';
            const endDate = bill.dueDate ? formatReceiptDate(bill.dueDate) : '';
            let formattedDateRange = '';
            if (startDate && endDate && startDate !== endDate) {
              formattedDateRange = `${startDate}\nTo\n${endDate}`;
            } else if (startDate) {
              formattedDateRange = startDate;
            } else {
              formattedDateRange = '';
            }

            return (
              <div key={item.id || idx} className="grid grid-cols-12 font-bold text-black text-xs px-3 py-3">
                <div className="col-span-3 text-left whitespace-pre-line leading-relaxed font-mono">
                  {formattedDateRange}
                </div>
                <div className="col-span-2 text-center font-mono">
                  {item.totalReceipts !== undefined && item.totalReceipts !== '' ? item.totalReceipts : ''}
                </div>
                <div className="col-span-3 text-center font-mono">
                  {hasWeightRate ? weight : ''}
                </div>
                <div className="col-span-2 text-center font-mono">
                  {hasWeightRate ? rate : ''}
                </div>
                <div className="col-span-2 text-right font-mono font-bold text-sm">
                  {itemTotal > 0 ? (itemTotal % 1 === 0 ? itemTotal.toFixed(0) : itemTotal.toFixed(2)) : ''}
                </div>
              </div>
            );
          })}

          {/* 3. Middle Empty Area with Centered Underlined GST Notice */}
          <div className="py-20 sm:py-28 text-center border-b-2 border-black flex items-center justify-center">
            <span className="font-bold tracking-widest text-black text-xs sm:text-sm underline uppercase">
              {bill.notes || businessProfile.notes || 'GST PAYABLE BY PARTY'}
            </span>
          </div>

          {/* 4. PAYMENT POSITION (1:1 with photo): Bank details on Left, AMOUNT & TOTAL AMOUNT on Right */}
          <div className="grid grid-cols-12 p-3 border-b-2 border-black text-xs font-bold text-black">
            {/* Left Column: Bank Details from Business Settings */}
            <div className="col-span-7 space-y-1 font-bold">
              <div className="flex">
                <span className="w-20 shrink-0">Bank</span>
                <span className="mr-2">:</span>
                <span>{businessProfile.bankName || bill.bankName || ''}</span>
              </div>
              <div className="flex">
                <span className="w-20 shrink-0">A / C</span>
                <span className="mr-2">:</span>
                <span className="font-mono">{businessProfile.accountNumber || bill.accountNumber || ''}</span>
              </div>
              <div className="flex">
                <span className="w-20 shrink-0">IFSC</span>
                <span className="mr-2">:</span>
                <span className="font-mono uppercase">{businessProfile.ifscCode || bill.ifscCode || ''}</span>
              </div>
              <div className="flex">
                <span className="w-20 shrink-0">BRANCH</span>
                <span className="mr-2">:</span>
                <span>{businessProfile.branch || bill.branch || ''}</span>
              </div>
            </div>

            {/* Right Column: AMOUNT (Top) & TOTAL AMOUNT (Bottom) */}
            <div className="col-span-5 flex flex-col justify-between items-end text-right font-bold">
              <div className="flex justify-between w-full">
                <span className="text-left">AMOUNT</span>
                <span className="font-mono text-sm sm:text-base">
                  {totalAmount > 0 ? (totalAmount % 1 === 0 ? totalAmount.toFixed(0) : totalAmount.toFixed(2)) : ''}
                </span>
              </div>
              <div className="flex justify-between w-full">
                <span className="text-left">TOTAL AMOUNT</span>
                <span className="font-mono text-sm sm:text-base">
                  {totalAmount > 0 ? (totalAmount % 1 === 0 ? totalAmount.toFixed(0) : totalAmount.toFixed(2)) : ''}
                </span>
              </div>
            </div>
          </div>

          {/* 5. Amount in Words Row (Full width) */}
          <div className="px-3 py-2.5 border-b-2 border-black text-xs font-bold text-black min-h-[33px]">
            {totalAmount > 0 ? amountToRupeesWords(totalAmount) : ''}
          </div>

          {/* 6. Cheque / Payment Slip Counterfoil Box */}
          <div className="grid grid-cols-12 min-h-24 sm:min-h-28 p-3 text-xs font-bold text-black">
            {/* Left Column: Bank / Cheque No / Date / Amount - Rendered ONLY if Cheque method is chosen */}
            <div className="col-span-7 space-y-1.5 font-bold">
              <div className="flex items-baseline">
                <span className="w-24 shrink-0">Bank</span>
                <span className="mr-2">:</span>
                <span className="font-medium text-black">{isCheque ? (bill.chequeBank || '') : ''}</span>
              </div>
              <div className="flex items-baseline">
                <span className="w-24 shrink-0">Cheque No.</span>
                <span className="mr-2">:</span>
                <span className="font-mono font-bold text-black">{isCheque ? (bill.chequeNumber || '') : ''}</span>
              </div>
              <div className="flex items-baseline">
                <span className="w-24 shrink-0">Date</span>
                <span className="mr-2">:</span>
                <span className="font-medium text-black">
                  {(isCheque && bill.chequeDate) ? formatDate(bill.chequeDate) : ''}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="w-24 shrink-0">Amount</span>
                <span className="mr-2">:</span>
                <span className="font-mono font-bold text-black">
                  {(isCheque && totalAmount > 0 && (bill.chequeNumber || bill.chequeBank || bill.chequeDate)) ? (totalAmount % 1 === 0 ? totalAmount.toFixed(0) : totalAmount.toFixed(2)) : ''}
                </span>
              </div>
            </div>

            {/* Right Column: Company Name & Authorised Signatory */}
            <div className="col-span-5 flex flex-col justify-between items-end text-right font-bold">
              <p className="uppercase tracking-tight text-xs sm:text-sm">
                {businessProfile.name || 'SHREE CARGO'}
              </p>
              <p className="text-xs">
                Authorised Signatory
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
