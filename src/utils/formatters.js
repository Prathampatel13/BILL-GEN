export function formatCurrency(amount, currencySymbol = '₹') {
  const num = Number(amount) || 0;
  // Use en-IN locale for Indian numbering formatting (e.g. 1,50,000.00)
  const formattedNumber = num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currencySymbol}${formattedNumber}`;
}

export function isoToDMY(val) {
  if (!val) return '';
  const trimmed = String(val).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parts = trimmed.split('-');
    return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
  }
  const clean = trimmed.replace(/[-.]/g, '/');
  const parts = clean.split('/');
  if (parts.length === 3) {
    let [d, m, y] = parts;
    if (y.length === 2) y = '20' + y;
    if (y.length === 4) {
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
  }
  return trimmed;
}

export function dmyToISO(val) {
  if (!val) return '';
  const trimmed = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const clean = trimmed.replace(/[-.]/g, '/');
  const parts = clean.split('/');
  if (parts.length === 3) {
    let [d, m, y] = parts;
    if (y.length === 2) y = '20' + y;
    if (y.length === 4 && d.length >= 1 && m.length >= 1) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  return trimmed;
}

export function formatDate(dateString) {
  if (!dateString) return '';
  return isoToDMY(dateString);
}

/**
 * Formats a date string into standard dd/mm/yyyy format.
 */
export function formatReceiptDate(dateString) {
  if (!dateString) return '';
  return isoToDMY(dateString);
}

export function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysToDate(dateString, days) {
  try {
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    date.setDate(date.getDate() + days);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  } catch {
    return dateString;
  }
}

export function generateInvoiceNumber(sequence = 1) {
  const year = new Date().getFullYear();
  const seqStr = String(sequence).padStart(4, '0');
  return `INV-${year}-${seqStr}`;
}

// Convert amount in Rupees to words (Indian numbering system: Thousand, Lakh, Crore)
export function amountToRupeesWords(amount) {
  const num = Math.round(Number(amount) || 0);
  if (num === 0) return 'Rupees Zero Only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n) {
    if (n === 0) return '';
    if (n < 20) return units[n];
    const t = Math.floor(n / 10);
    const u = n % 10;
    return tens[t] + (u !== 0 ? ' ' + units[u] : '');
  }

  function convertThreeDigits(n) {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) {
      res += units[hundred] + ' Hundred';
      if (rest > 0) res += ' ';
    }
    if (rest > 0) {
      res += convertTwoDigits(rest);
    }
    return res;
  }

  const crore = Math.floor(num / 10000000);
  let rem = num % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  const hundredAndBelow = rem % 1000;

  let words = '';
  if (crore > 0) {
    words += convertTwoDigits(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertTwoDigits(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertTwoDigits(thousand) + ' Thousand ';
  }
  if (hundredAndBelow > 0) {
    words += convertThreeDigits(hundredAndBelow) + ' ';
  }

  return `Rupees ${words.trim()} only.`;
}

/**
 * Calculates subtotal, discount, tax, and final total across multiple line items.
 * Supports automatic calculation based on Total Weight (KG) * Rate per KG.
 */
export function calculateBillTotals(bill) {
  const items = (bill?.items && bill.items.length > 0)
    ? bill.items
    : [{
        id: 'item-default',
        make: bill?.make || 'Parcel Cargo',
        modelOrItem: bill?.modelOrItem || '',
        dateRange: bill?.dateRange || '',
        totalReceipts: bill?.totalReceipts !== undefined ? bill.totalReceipts : '',
        totalWeight: bill?.totalWeight !== undefined ? bill.totalWeight : '',
        ratePerKg: bill?.ratePerKg !== undefined ? bill.ratePerKg : '',
        amount: bill?.amount || '',
        quantity: bill?.quantity || 1,
      }];

  const subtotal = items.reduce((sum, item) => {
    let itemAmt = 0;
    const w = parseFloat(item.totalWeight);
    const r = parseFloat(item.ratePerKg);
    const rc = parseFloat(item.totalReceipts);
    const isMm = /^(mm|min|minimum)$/i.test(String(item.totalWeight || '').trim());

    if (!isNaN(w) && !isNaN(r) && w > 0 && r > 0) {
      itemAmt = w * r;
    } else if (isMm && !isNaN(rc) && !isNaN(r) && rc > 0 && r > 0) {
      // Minimum charge line: Receipts * Rate
      itemAmt = rc * r;
    } else {
      itemAmt = parseFloat(item.amount) || 0;
    }
    return sum + itemAmt;
  }, 0);

  let discountAmount = 0;
  if (bill?.discountType === 'percent') {
    discountAmount = (subtotal * (parseFloat(bill?.discountValue) || 0)) / 100;
  } else {
    discountAmount = parseFloat(bill?.discountValue) || 0;
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  // In freight bill, GST is payable by party (0% tax on bill)
  const taxRate = bill?.gstPayableByParty ? 0 : (parseFloat(bill?.taxRate) || 0);
  const taxAmount = (taxableAmount * taxRate) / 100;
  const totalAmount = taxableAmount + taxAmount;

  return {
    items,
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    totalAmount
  };
}
