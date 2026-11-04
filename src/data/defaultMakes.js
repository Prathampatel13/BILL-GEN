export const INITIAL_MAKES = [
  { id: 'm-1', name: 'Parcel Cargo', category: 'General' },
  { id: 'm-2', name: 'Textile / Garments', category: 'Goods' },
  { id: 'm-3', name: 'Machinery & Equipment', category: 'Industrial' },
  { id: 'm-4', name: 'Full Truck Load (FTL)', category: 'Transport' },
  { id: 'm-5', name: 'Part Truck Load (PTL)', category: 'Transport' },
  { id: 'm-6', name: 'Hardware & Tools', category: 'Goods' },
  { id: 'm-7', name: 'Chemicals / Raw Material', category: 'Industrial' },
  { id: 'm-8', name: 'General Freight Goods', category: 'General' }
];

export const PAYMENT_METHODS = [
  { id: 'UPI', label: 'UPI (GPay / PhonePe / Paytm / BHIM)', icon: 'QrCode' },
  { id: 'Cash', label: 'Cash', icon: 'Banknote' },
  { id: 'Card', label: 'Debit / Credit Card', icon: 'CreditCard' },
  { id: 'Bank Transfer', label: 'Net Banking (NEFT / RTGS / IMPS)', icon: 'Building2' },
  { id: 'Cheque', label: 'Cheque', icon: 'FileText' }
];

export const PAYMENT_STATUSES = [
  { id: 'Paid', label: 'Paid', color: 'emerald' },
  { id: 'Pending', label: 'Pending', color: 'amber' },
  { id: 'Partially Paid', label: 'Partially Paid', color: 'blue' },
  { id: 'Cancelled', label: 'Cancelled', color: 'rose' }
];

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)' },
  { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham (AED)' },
  { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar (SG$)' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CA$)' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar (AU$)' }
];
