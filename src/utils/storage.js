import { INITIAL_MAKES } from '../data/defaultMakes';

const STORAGE_KEYS = {
  BILLS: 'billcraft_saved_bills',
  MAKES: 'billcraft_makes',
  BUSINESS: 'billcraft_business_profile',
  SETTINGS: 'billcraft_settings',
  SEQ: 'billcraft_invoice_seq',
  CUSTOMERS: 'billcraft_saved_customers'
};

export const DEFAULT_BUSINESS_PROFILE = {
  name: 'SHREE CARGO',
  tagline: 'Transport & Logistics Services',
  address: '174-C, Damodar Bhuvan, Cavel X Lane No. 7, Dr. Vigas Steet, Near Royal Avenue Tower',
  city: 'Mumbai, Maharashtra 400002',
  taxId: '27ABROP4207H1ZF',
  bankName: 'GP PARSIK BANK',
  accountNumber: '024011300000316',
  ifscCode: 'PJSB0000023',
  branch: 'KALBADEVI, MUMBAI',
  gstPayableByParty: true,
  notes: 'GST PAYABLE BY PARTY',
  terms: '1. Goods carried at owner risk. 2. Subject to local jurisdiction.'
};

export const DEFAULT_SETTINGS = {
  currency: 'INR',
  currencySymbol: '₹',
  taxRate: 0,
  taxName: 'GST'
};

export function getStoredBills() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BILLS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Sanitize: filter out any corrupted or event objects that may have leaked in
    return parsed
      .filter(b => b && typeof b === 'object' && b.id && !b._reactName && !b.nativeEvent)
      .map(b => {
        const cleanMake = (!b.make || b.make === 'Maruti Suzuki') ? 'Freight Transport' : b.make;
        const cleanItems = (b.items || []).map(item => ({
          ...item,
          make: (!item.make || item.make === 'Maruti Suzuki') ? 'Freight Transport' : item.make,
          modelOrItem: (!item.modelOrItem || item.modelOrItem === 'Parcel Transport') ? 'Parcel Cargo' : item.modelOrItem
        }));
        return {
          ...b,
          make: cleanMake,
          modelOrItem: (!b.modelOrItem || b.modelOrItem === 'Parcel Transport') ? 'Parcel Cargo' : b.modelOrItem,
          items: cleanItems.length > 0 ? cleanItems : undefined
        };
      });
  } catch (e) {
    console.error('Failed to load bills:', e);
    return [];
  }
}

export function saveBill(bill) {
  if (!bill || typeof bill !== 'object' || bill._reactName || bill.nativeEvent) {
    console.warn('Attempted to save invalid bill object:', bill);
    return getStoredBills();
  }

  const bills = getStoredBills();
  const existingIndex = bills.findIndex(b => b.id === bill.id);
  let updated;
  if (existingIndex >= 0) {
    updated = [...bills];
    updated[existingIndex] = { ...bill, updatedAt: new Date().toISOString() };
  } else {
    updated = [bill, ...bills];
  }
  localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(updated));

  // Automatically save customer details along with their payment preferences
  if (bill.customerName && bill.customerName.trim() && bill.customerName.trim().toLowerCase() !== 'walk-in customer') {
    saveCustomer({
      name: bill.customerName,
      phone: bill.customerPhone || '',
      email: bill.customerEmail || '',
      address: bill.customerAddress || '',
      paymentMethod: bill.paymentMethod || 'Bank Transfer',
      bankName: bill.bankName || '',
      accountNumber: bill.accountNumber || '',
      ifscCode: bill.ifscCode || '',
      branch: bill.branch || '',
      chequeBank: bill.chequeBank || '',
      chequeNumber: bill.chequeNumber || '',
      transactionRef: bill.transactionRef || ''
    });
  }

  return updated;
}

export function getStoredCustomers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (raw) return JSON.parse(raw);

    // Also extract past customers from stored bills if customers store is empty
    const bills = getStoredBills();
    const extracted = [];
    const seen = new Set();
    for (const b of bills) {
      if (b.customerName && b.customerName.trim() && b.customerName.trim().toLowerCase() !== 'walk-in customer') {
        const key = b.customerName.trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          extracted.push({
            id: `cust-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: b.customerName.trim(),
            phone: b.customerPhone || '',
            email: b.customerEmail || '',
            address: b.customerAddress || '',
            createdAt: b.date || new Date().toISOString()
          });
        }
      }
    }
    if (extracted.length > 0) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(extracted));
    }
    return extracted;
  } catch (e) {
    console.error('Failed to load customers:', e);
    return [];
  }
}

export function saveCustomer(customer) {
  if (!customer.name || !customer.name.trim()) return getStoredCustomers();
  const customers = getStoredCustomers();
  const trimmedName = customer.name.trim();
  const existingIdx = customers.findIndex(
    c => c.name.toLowerCase() === trimmedName.toLowerCase() ||
         (customer.phone && c.phone && c.phone.trim() === customer.phone.trim())
  );

  let updated;
  if (existingIdx >= 0) {
    updated = [...customers];
    updated[existingIdx] = {
      ...updated[existingIdx],
      name: trimmedName,
      phone: customer.phone || updated[existingIdx].phone || '',
      email: customer.email || updated[existingIdx].email || '',
      address: customer.address || updated[existingIdx].address || '',
      paymentMethod: customer.paymentMethod || updated[existingIdx].paymentMethod || 'Bank Transfer',
      bankName: customer.bankName || updated[existingIdx].bankName || '',
      accountNumber: customer.accountNumber || updated[existingIdx].accountNumber || '',
      ifscCode: customer.ifscCode || updated[existingIdx].ifscCode || '',
      branch: customer.branch || updated[existingIdx].branch || '',
      chequeBank: customer.chequeBank || updated[existingIdx].chequeBank || '',
      chequeNumber: customer.chequeNumber || updated[existingIdx].chequeNumber || '',
      transactionRef: customer.transactionRef || updated[existingIdx].transactionRef || '',
      updatedAt: new Date().toISOString()
    };
  } else {
    const newCust = {
      id: `cust-${Date.now()}`,
      name: trimmedName,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      paymentMethod: customer.paymentMethod || 'Bank Transfer',
      bankName: customer.bankName || '',
      accountNumber: customer.accountNumber || '',
      ifscCode: customer.ifscCode || '',
      branch: customer.branch || '',
      chequeBank: customer.chequeBank || '',
      chequeNumber: customer.chequeNumber || '',
      transactionRef: customer.transactionRef || '',
      createdAt: new Date().toISOString()
    };
    updated = [newCust, ...customers];
  }

  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updated));
  return updated;
}

export function deleteCustomer(id) {
  const customers = getStoredCustomers();
  const filtered = customers.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(filtered));
  return filtered;
}

export function deleteBill(billId) {
  const bills = getStoredBills();
  const filtered = bills.filter(b => b.id !== billId);
  localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(filtered));
  return filtered;
}

export function getStoredMakes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MAKES);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Automatically migrate and clear old automotive brands if found
      const hasCarBrands = Array.isArray(parsed) && parsed.some(m =>
        m.name === 'Maruti Suzuki' || m.name === 'Hyundai' || m.name === 'Tata Motors'
      );
      if (hasCarBrands) {
        saveStoredMakes(INITIAL_MAKES);
        return INITIAL_MAKES;
      }
      return parsed;
    }
    return INITIAL_MAKES;
  } catch (e) {
    console.error('Failed to load makes:', e);
    return INITIAL_MAKES;
  }
}

export function saveStoredMakes(makes) {
  localStorage.setItem(STORAGE_KEYS.MAKES, JSON.stringify(makes));
}

export function getBusinessProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BUSINESS);
    const profile = raw ? { ...DEFAULT_BUSINESS_PROFILE, ...JSON.parse(raw) } : { ...DEFAULT_BUSINESS_PROFILE };
    delete profile.phone;
    delete profile.email;
    delete profile.website;
    return profile;
  } catch {
    return { ...DEFAULT_BUSINESS_PROFILE };
  }
}

export function saveBusinessProfile(profile) {
  const clean = { ...profile };
  delete clean.phone;
  delete clean.email;
  delete clean.website;
  localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(clean));
}

export function getStoredSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      currency: 'INR',
      currencySymbol: '₹',
      taxRate: 0 // In freight billing, GST is payable by party
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings) {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function getNextInvoiceSequence() {
  const raw = localStorage.getItem(STORAGE_KEYS.SEQ);
  const current = raw ? parseInt(raw, 10) : 1;
  localStorage.setItem(STORAGE_KEYS.SEQ, String(current + 1));
  return current;
}
