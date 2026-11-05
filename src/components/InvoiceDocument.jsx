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

        {/* Route / Consignment Title if provided (e.g. SURAT TO MUMBAI) */}
        {bill.route && (
          <div className="text-center pt-2 pb-0.5">
            <span className="font-black text-xs sm:text-sm tracking-wider uppercase underline">
              {bill.route}
            </span>
          </div>
        )}

        {/* Bill Metadata: Left side has M/s., Bill No., Place. Right side has Date */}
        <div className="py-2.5 text-xs text-black font-semibold flex justify-between items-start">
          <div className="space-y-1">
            {/* 1. Customer Name */}
            <div className="flex items-center">
              <span className="w-16 shrink-0 text-black font-bold">M/s.</span>
              <span className="mr-2 font-bold">:</span>
              <span className="font-bold text-sm uppercase">{bill.customerName || 'WALK-IN CUSTOMER'}</span>
            </div>

            {/* Customer GSTIN if present */}
            {bill.customerGstin && (
              <div className="flex items-center">
                <span className="w-16 shrink-0 text-black font-bold">GSTIN</span>
                <span className="mr-2 font-bold">:</span>
                <span className="font-mono font-bold tracking-wider">{bill.customerGstin}</span>
              </div>
            )}

            {/* 2. Bill No. */}
            <div className="flex items-center">
              <span className="w-16 shrink-0 text-black font-bold">Bill No.</span>
              <span className="mr-2 font-bold">:</span>
              <span className="font-mono font-bold text-sm">{bill.invoiceNumber || ''}</span>
            </div>

            {/* 3. Place */}
            <div className="flex items-center">
              <span className="w-16 shrink-0 text-black font-bold">Place</span>
              <span className="mr-2 font-bold">:</span>
              <span className="font-bold">{bill.place || (businessProfile.city ? businessProfile.city.split(',')[0].trim() : 'Mumbai')}</span>
            </div>
          </div>

          {/* Right Side: Date */}
          <div className="text-right pt-0.5">
            <div className="flex items-center justify-end">
              <span className="text-black font-bold">Date</span>
              <span className="mx-2 font-bold">:</span>
              <span className="font-mono font-bold text-sm">{bill.date ? formatDate(bill.date) : ''}</span>
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
            const weightNum = parseFloat(item.totalWeight);
            const rateNum = parseFloat(item.ratePerKg);
            const rcNum = parseFloat(item.totalReceipts);
            const isMmWeight = /^(mm|min|minimum)$/i.test(String(item.totalWeight || '').trim());
            const hasWeightRate = !isNaN(weightNum) && !isNaN(rateNum) && weightNum > 0 && rateNum > 0;
            const hasReceiptRate = isMmWeight && !isNaN(rcNum) && !isNaN(rateNum) && rcNum > 0 && rateNum > 0;

            let itemTotal = 0;
            if (hasWeightRate) {
              itemTotal = weightNum * rateNum;
            } else if (hasReceiptRate) {
              itemTotal = rcNum * rateNum;
            } else {
              itemTotal = parseFloat(item.amount) || 0;
            }

            // Date range: if custom dateRange is entered for this line, display it; otherwise line 1 defaults to bill dates
            let formattedDateRange = '';
            const customDate = (item.dateRange !== undefined && item.dateRange !== null) ? String(item.dateRange).trim() : '';
            if (customDate) {
              if (customDate.toLowerCase().includes(' to ')) {
                const parts = customDate.split(/\s+to\s+/i);
                formattedDateRange = `${parts[0]}\nTo\n${parts.slice(1).join(' To ')}`;
              } else {
                formattedDateRange = customDate;
              }
            } else if (idx === 0) {
              const startDate = bill.date ? formatReceiptDate(bill.date) : '';
              const endDate = bill.dueDate ? formatReceiptDate(bill.dueDate) : '';
              if (startDate && endDate && startDate !== endDate) {
                formattedDateRange = `${startDate}\nTo\n${endDate}`;
              } else if (startDate) {
                formattedDateRange = startDate;
              }
            }

            return (
              <div key={item.id || idx} className="grid grid-cols-12 font-bold text-black text-xs px-3 py-2.5">
                <div className="col-span-3 text-left whitespace-pre-line leading-relaxed font-mono">
                  {formattedDateRange}
                </div>
                <div className="col-span-2 text-center font-mono">
                  {item.totalReceipts !== undefined && item.totalReceipts !== '' ? item.totalReceipts : ''}
                </div>
                <div className="col-span-3 text-center font-mono">
                  {item.totalWeight !== undefined && item.totalWeight !== '' ? item.totalWeight : ''}
                </div>
                <div className="col-span-2 text-center font-mono">
                  {item.ratePerKg !== undefined && item.ratePerKg !== '' ? item.ratePerKg : ''}
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
