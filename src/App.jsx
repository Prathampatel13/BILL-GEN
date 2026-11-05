import React, { useState, useEffect } from 'react';
import {
  FileText,
  History,
  Settings,
  PlusCircle,
  ReceiptText,
  CheckCircle,
  AlertCircle,
  Sun,
  Moon
} from 'lucide-react';
import BillForm from './components/BillForm';
import InvoicePreview from './components/InvoicePreview';
import BillHistory from './components/BillHistory';
import ManageMakesModal from './components/ManageMakesModal';
import BusinessSettingsModal from './components/BusinessSettingsModal';
import {
  getStoredBills,
  saveBill,
  deleteBill as removeStoredBill,
  getStoredMakes,
  saveStoredMakes,
  getBusinessProfile,
  saveBusinessProfile,
  getStoredSettings,
  saveStoredSettings,
  getNextInvoiceSequence,
  getStoredCustomers,
  saveCustomer as storeCustomer,
  deleteCustomer as removeStoredCustomer
} from './utils/storage';
import { generateInvoiceNumber, calculateBillTotals, getTodayDateString } from './utils/formatters';
import { downloadInvoiceAsPDF } from './utils/pdfGenerator';

const CURRENT_YEAR = new Date().getFullYear();

export default function App() {
  // App settings & profile
  const [settings, setSettings] = useState(() => getStoredSettings());
  const [businessProfile, setBusinessProfile] = useState(() => getBusinessProfile());
  const [makes, setMakes] = useState(() => getStoredMakes());
  const [bills, setBills] = useState(() => getStoredBills());
  const [customers, setCustomers] = useState(() => getStoredCustomers());

  // Dark / Light Mode Theme State with LocalStorage & OS Preference sync
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('billgen_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('billgen_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error('Failed to sync theme:', e);
    }
  }, [theme]);

  const handleSaveCustomer = (customerData) => {
    if (!customerData.name || !customerData.name.trim()) {
      showToast('Please enter a customer name to save.', 'error');
      return;
    }
    const updated = storeCustomer(customerData);
    setCustomers(updated);
    showToast(`Customer "${customerData.name.trim()}" saved for future bills!`, 'success');
  };

  const handleDeleteCustomer = (id) => {
    const updated = removeStoredCustomer(id);
    setCustomers(updated);
    showToast('Customer removed from directory.');
  };

  // Navigation tab: 'generator' | 'history'
  const [activeTab, setActiveTab] = useState('generator');

  // Modals
  const [isMakesModalOpen, setIsMakesModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Toast notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Helper to create a fresh new bill object
  const createNewBill = () => {
    const defaultMake = 'Freight Transport';
    const defaultItem = {
      id: `item-${Date.now()}-1`,
      make: defaultMake,
      modelOrItem: 'Parcel Cargo',
      serialOrRef: '',
      totalReceipts: '',
      totalWeight: '',
      ratePerKg: '',
      amount: '',
      quantity: 1,
      notes: ''
    };
    return {
      id: `bill-${Date.now()}`,
      invoiceNumber: generateInvoiceNumber(getNextInvoiceSequence(bills || [])),
      items: [defaultItem],
      make: defaultMake,
      modelOrItem: 'Parcel Cargo',
      serialOrRef: '',
      totalReceipts: '',
      totalWeight: '',
      ratePerKg: '',
      amount: '',
      printWeightRate: true,
      quantity: 1,
      date: getTodayDateString(),
      tableStartDate: getTodayDateString(),
      tableEndDate: '',
      dueDate: '',
      place: 'Mumbai',
      route: 'SURAT TO MUMBAI',
      discountType: 'percent',
      discountValue: 0,
      taxRate: 0,
      taxName: 'GST',
      gstPayableByParty: true,
      paymentMethod: 'Cheque',
      paymentStatus: 'Paid',
      transactionRef: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branch: '',
      chequeBank: '',
      chequeNumber: '',
      chequeDate: '',
      customerName: '',
      customerGstin: '',
      notes: 'GST PAYABLE BY PARTY',
      currency: settings.currency || 'INR',
      currencySymbol: settings.currencySymbol || '₹',
      createdAt: new Date().toISOString()
    };
  };

  // Current active bill in generator
  const [currentBill, setCurrentBill] = useState(() => createNewBill());
  const [isSaving, setIsSaving] = useState(false);

  // Handle saving current bill
  const handleSaveCurrentBill = (billArg) => {
    if (isSaving) return false;

    // If called as an event handler (e.g. onClick), billArg will be the event object.
    const targetBill = (billArg && typeof billArg === 'object' && billArg.id && !billArg.nativeEvent && !billArg._reactName)
      ? billArg
      : currentBill;

    const { totalAmount, items } = calculateBillTotals(targetBill);

    // Validation: Do not save completely empty bill without any details!
    const hasWeightAndRate = parseFloat(targetBill.totalWeight) > 0 && parseFloat(targetBill.ratePerKg) > 0;
    const hasDirectAmount = parseFloat(targetBill.amount) > 0;
    const hasValidTotal = totalAmount > 0;
    const hasReceipts = targetBill.totalReceipts !== undefined && String(targetBill.totalReceipts).trim() !== '' && Number(targetBill.totalReceipts) > 0;
    const hasValidContent = hasWeightAndRate || hasDirectAmount || hasValidTotal || hasReceipts;

    if (!hasValidContent) {
      showToast('Please enter Total Weight & Rate, or Bill Amount before saving.', 'error');
      return false;
    }

    setIsSaving(true);
    try {
      const normalizedItems = (items && items.length > 0 ? items : targetBill.items || []).map(item => ({
        ...item,
        make: item.make || 'Freight Transport',
        modelOrItem: item.modelOrItem || 'Parcel Cargo'
      }));

      // If invoice number is empty, auto-assign next sequential number so it clearly shows on Invoices page
      let invNum = (targetBill.invoiceNumber || '').trim();
      if (!invNum) {
        const seq = getNextInvoiceSequence();
        invNum = generateInvoiceNumber(seq);
      }

      // Keep existing stable ID so repeated clicks update the bill rather than duplicating!
      const billId = targetBill.id || `bill-${Date.now()}`;

      // Build pure data bill object without any circular event/DOM properties
      const cleanBill = {
        id: billId,
        invoiceNumber: invNum,
        date: targetBill.date || '',
        dueDate: targetBill.dueDate || '',
        tableStartDate: targetBill.tableStartDate !== undefined ? targetBill.tableStartDate : (targetBill.date || ''),
        tableEndDate: targetBill.tableEndDate !== undefined ? targetBill.tableEndDate : (targetBill.dueDate || ''),
        place: targetBill.place !== undefined ? targetBill.place : 'Mumbai',
        route: targetBill.route !== undefined ? targetBill.route : 'SURAT TO MUMBAI',
        customerName: targetBill.customerName || 'Walk-in Customer',
        customerGstin: targetBill.customerGstin || '',
        paymentMethod: targetBill.paymentMethod || 'Cheque',
        paymentStatus: targetBill.paymentStatus || 'Paid',
        transactionRef: targetBill.transactionRef || '',
        bankName: targetBill.bankName || businessProfile.bankName || '',
        accountNumber: targetBill.accountNumber || businessProfile.accountNumber || '',
        ifscCode: targetBill.ifscCode || businessProfile.ifscCode || '',
        branch: targetBill.branch || businessProfile.branch || '',
        chequeBank: targetBill.chequeBank || '',
        chequeNumber: targetBill.chequeNumber || '',
        chequeDate: targetBill.chequeDate || '',
        notes: targetBill.notes || 'GST PAYABLE BY PARTY',
        currency: targetBill.currency || settings.currency || 'INR',
        currencySymbol: targetBill.currencySymbol || settings.currencySymbol || '₹',
        totalReceipts: targetBill.totalReceipts !== undefined ? targetBill.totalReceipts : '',
        totalWeight: targetBill.totalWeight !== undefined ? targetBill.totalWeight : '',
        ratePerKg: targetBill.ratePerKg !== undefined ? targetBill.ratePerKg : '',
        amount: targetBill.amount || '',
        printWeightRate: targetBill.printWeightRate !== false,
        items: normalizedItems,
        make: targetBill.make || 'Freight Transport',
        createdAt: targetBill.createdAt || new Date().toISOString()
      };

      const updatedBills = saveBill(cleanBill);
      setBills(updatedBills);
      setCustomers(getStoredCustomers());

      // Retain stable ID & assigned invoiceNumber to prevent duplicate creations on multiple clicks
      setCurrentBill(cleanBill);

      showToast(`Invoice #${cleanBill.invoiceNumber} saved in Invoices page!`, 'success');

      // Seamlessly navigate to Invoices tab so the user sees their bill saved in the invoice page!
      setActiveTab('history');
      return true;
    } catch (err) {
      console.error('Error saving bill:', err);
      showToast('Error saving bill: ' + err.message, 'error');
      return false;
    } finally {
      setTimeout(() => setIsSaving(false), 400);
    }
  };

  // Handle resetting or creating new bill
  const handleNewBill = () => {
    const fresh = createNewBill();
    setCurrentBill(fresh);
    showToast('Started fresh Bill', 'info');
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Automatically save and download bill as PDF
  const handleSaveAsPdf = async (billArg) => {
    if (isGeneratingPdf) return false;

    // If called as an event handler (e.g. onClick), billArg will be the event object.
    const targetBill = (billArg && typeof billArg === 'object' && billArg.id && !billArg.nativeEvent && !billArg._reactName)
      ? billArg
      : currentBill;

    const { totalAmount, items } = calculateBillTotals(targetBill);

    // Validation: Do not export completely empty bill
    const hasWeightAndRate = parseFloat(targetBill.totalWeight) > 0 && parseFloat(targetBill.ratePerKg) > 0;
    const hasDirectAmount = parseFloat(targetBill.amount) > 0;
    const hasValidTotal = totalAmount > 0;
    const hasReceipts = targetBill.totalReceipts !== undefined && String(targetBill.totalReceipts).trim() !== '' && Number(targetBill.totalReceipts) > 0;
    const hasValidContent = hasWeightAndRate || hasDirectAmount || hasValidTotal || hasReceipts;

    if (!hasValidContent) {
      showToast('Please enter Total Weight & Rate, or Bill Amount before downloading PDF.', 'error');
      return false;
    }

    const normalizedItems = (items && items.length > 0 ? items : targetBill.items || []).map(item => ({
      ...item,
      make: item.make || 'Freight Transport',
      modelOrItem: item.modelOrItem || 'Parcel Cargo'
    }));

    // If invoice number is empty, auto-assign next sequential number so it clearly shows on Invoices page
    let invNum = (targetBill.invoiceNumber || '').trim();
    if (!invNum) {
      const seq = getNextInvoiceSequence();
      invNum = generateInvoiceNumber(seq);
    }

    const billId = targetBill.id || `bill-${Date.now()}`;

    // Build pure data bill object without any circular event/DOM properties
    const cleanBill = {
      id: billId,
      invoiceNumber: invNum,
      date: targetBill.date || '',
      dueDate: targetBill.dueDate || '',
      customerName: targetBill.customerName || 'Walk-in Customer',
      customerGstin: targetBill.customerGstin || '',
      paymentMethod: targetBill.paymentMethod || 'Cheque',
      paymentStatus: targetBill.paymentStatus || 'Paid',
      transactionRef: targetBill.transactionRef || '',
      bankName: targetBill.bankName || businessProfile.bankName || '',
      accountNumber: targetBill.accountNumber || businessProfile.accountNumber || '',
      ifscCode: targetBill.ifscCode || businessProfile.ifscCode || '',
      branch: targetBill.branch || businessProfile.branch || '',
      chequeBank: targetBill.chequeBank || '',
      chequeNumber: targetBill.chequeNumber || '',
      chequeDate: targetBill.chequeDate || '',
      notes: targetBill.notes || 'GST PAYABLE BY PARTY',
      currency: targetBill.currency || settings.currency || 'INR',
      currencySymbol: targetBill.currencySymbol || settings.currencySymbol || '₹',
      totalReceipts: targetBill.totalReceipts !== undefined ? targetBill.totalReceipts : '',
      totalWeight: targetBill.totalWeight !== undefined ? targetBill.totalWeight : '',
      ratePerKg: targetBill.ratePerKg !== undefined ? targetBill.ratePerKg : '',
      amount: targetBill.amount || '',
      printWeightRate: targetBill.printWeightRate !== false,
      items: normalizedItems,
      make: targetBill.make || 'Freight Transport',
      createdAt: targetBill.createdAt || new Date().toISOString()
    };

    try {
      setIsGeneratingPdf(true);
      // Auto save to history so it is never lost and always appears on Invoices page
      const updated = saveBill(cleanBill);
      setBills(updated);
      setCustomers(getStoredCustomers());

      setCurrentBill(cleanBill);

      showToast('Generating single-page A4 PDF...');
      // Brief tick for DOM to sync
      await new Promise(resolve => setTimeout(resolve, 80));

      const cleanInv = (cleanBill.invoiceNumber || 'INV').replace(/[/\\?%*:|"<>]/g, '_');
      const cleanCust = (cleanBill.customerName || 'Freight_Bill').replace(/[/\\?%*:|"<>]/g, '_');
      const filename = `${cleanInv}_${cleanCust}`;

      await downloadInvoiceAsPDF('invoice-document', filename);
      showToast(`A4 Bill downloaded as ${filename}.pdf!`, 'success');
      return true;
    } catch (err) {
      console.error('Auto PDF export error:', err);
      showToast('Error downloading PDF. Opening print dialog...', 'error');
      window.print();
      return false;
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // History Actions
  const handleSelectBillFromHistory = (bill) => {
    setCurrentBill(bill);
    setActiveTab('generator');
    showToast(`Loaded Bill #${bill.invoiceNumber}`);
  };

  const handleDeleteBill = (id) => {
    const updated = removeStoredBill(id);
    setBills(updated);
    showToast('Bill deleted.');
  };

  const handlePrintBillFromHistory = (bill) => {
    setCurrentBill(bill);
    setActiveTab('generator');
    setTimeout(() => {
      handleSaveAsPdf(bill);
    }, 200);
  };

  // Makes update
  const handleSaveMakes = (newMakes) => {
    setMakes(newMakes);
    saveStoredMakes(newMakes);
    showToast('Makes list updated.');
  };

  // Business profile update
  const handleSaveBusinessProfile = (newProfile) => {
    setBusinessProfile(newProfile);
    saveBusinessProfile(newProfile);
    showToast('Business profile saved.');
  };

  // Settings update
  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
    setCurrentBill(prev => ({
      ...prev,
      currency: newSettings.currency,
      currencySymbol: newSettings.currencySymbol,
      taxName: newSettings.taxName
    }));
  };

  return (
    <div className="h-screen max-h-screen w-full bg-slate-50/90 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col font-sans overflow-hidden transition-colors duration-200 print:h-auto print:max-h-none print:overflow-visible print:bg-white print:text-black">
      {/* Top Application Header (Hidden in Print) */}
      <header className="h-16 shrink-0 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-2xs z-40 no-print transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Title: BillGen */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 ring-1 ring-white/20 transition-all hover:scale-105">
              <ReceiptText className="w-5 h-5 text-emerald-100" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white flex items-center">
                Bill<span className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">Gen</span>
              </span>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 transition-colors">
            <button
              onClick={() => setActiveTab('generator')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'generator'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Bill Generator
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Invoices
              {bills.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                  {bills.length}
                </span>
              )}
            </button>
          </div>

          {/* Right Action Shortcuts: Theme Toggle + Settings */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer shadow-2xs"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle dark/light theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 transition-transform duration-200 hover:-rotate-12" />
              )}
            </button>

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer shadow-2xs"
              title="Business profile & company settings"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 text-xs font-medium rounded-2xl shadow-xl animate-in slide-in-from-bottom-5 duration-200 no-print ${
          toast.type === 'error' ? 'bg-rose-950 border border-rose-800 text-rose-100' : 'bg-slate-900 text-white'
        }`}>
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Content Area - Fixed Viewport with True Dual Independent Scrolling */}
      <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-3 sm:py-4 overflow-hidden flex flex-col print:h-auto print:overflow-visible print:p-0 print:m-0">
        {activeTab === 'generator' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 h-full min-h-0 overflow-hidden print:block">
            {/* Left: Input Form Controls (Scrolls independently) */}
            <div className="md:col-span-5 lg:col-span-5 xl:col-span-5 h-full min-h-0 overflow-y-auto overscroll-contain pr-1 sm:pr-2.5 custom-scrollbar no-print pb-24">
              <BillForm
                bill={currentBill}
                onChange={setCurrentBill}
                makes={makes}
                customers={customers}
                onSaveCustomer={handleSaveCustomer}
                onDeleteCustomer={handleDeleteCustomer}
                onSavePdf={handleSaveAsPdf}
                onSave={handleSaveCurrentBill}
                onNewBill={handleNewBill}
                settings={settings}
                isGeneratingPdf={isGeneratingPdf}
                isSaving={isSaving}
              />
            </div>

            {/* Right: Live Invoice Preview (Scrolls independently) */}
            <div className="md:col-span-7 lg:col-span-7 xl:col-span-7 h-full min-h-0 overflow-y-auto overscroll-contain pl-1 sm:pl-2.5 custom-scrollbar pb-24 print:overflow-visible print:h-auto print:p-0 print:m-0">
              <InvoicePreview
                bill={currentBill}
                businessProfile={businessProfile}
                settings={settings}
                onSavePdf={handleSaveAsPdf}
                onSave={handleSaveCurrentBill}
                isGeneratingPdf={isGeneratingPdf}
                isSaving={isSaving}
              />
            </div>
          </div>
        ) : (
          <div className="no-print h-full min-h-0 overflow-y-auto custom-scrollbar pb-24">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Saved Bills & Invoices</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Access, search, re-print, duplicate or export your previous bills
                </p>
              </div>
              <button
                onClick={() => {
                  handleNewBill();
                  setActiveTab('generator');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Generate New Bill
              </button>
            </div>

            <BillHistory
              bills={bills}
              onSelectBill={handleSelectBillFromHistory}
              onDeleteBill={handleDeleteBill}
              onPrintBill={handlePrintBillFromHistory}
              settings={settings}
              businessProfile={businessProfile}
            />
          </div>
        )}
      </main>

      {/* Footer (Hidden in Print) */}
      <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#111827] py-4 text-center text-xs text-slate-500 dark:text-slate-400 no-print transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            BillGen &copy; {CURRENT_YEAR} &bull; Professional Transport Billing & Invoicing
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
            <span>Client-side Storage Enabled</span>
            <span>&bull;</span>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Configure Business
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ManageMakesModal
        isOpen={isMakesModalOpen}
        onClose={() => setIsMakesModalOpen(false)}
        makes={makes}
        onSaveMakes={handleSaveMakes}
      />

      <BusinessSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        businessProfile={businessProfile}
        onSaveBusinessProfile={handleSaveBusinessProfile}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
}
