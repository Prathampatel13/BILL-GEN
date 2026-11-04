import React, { useState } from 'react';
import {
  Search,
  Calendar,
  IndianRupee,
  Trash2,
  Printer,
  Pencil,
  Share2,
  Download,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { formatCurrency, formatDate, calculateBillTotals } from '../utils/formatters';
import ShareBillModal from './ShareBillModal';

export default function BillHistory({
  bills,
  onSelectBill,
  onDeleteBill,
  onPrintBill,
  settings,
  businessProfile = {}
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sharingBill, setSharingBill] = useState(null);

  const currencySymbol = settings.currencySymbol || '₹';

  // Helper to format freight details for display & export
  const getFreightDetailsString = (b) => {
    const item = (b.items && b.items.length > 0) ? b.items[0] : b;
    const w = parseFloat(item.totalWeight);
    const r = parseFloat(item.ratePerKg);
    const receipts = item.totalReceipts;
    const parts = [];
    if (!isNaN(w) && !isNaN(r) && w > 0 && r > 0) {
      parts.push(`${w} KG × ₹${r}/KG`);
    } else if (parseFloat(item.amount) > 0) {
      parts.push(`₹${parseFloat(item.amount).toFixed(2)} Direct`);
    }
    if (receipts !== undefined && receipts !== '' && Number(receipts) > 0) {
      parts.push(`${receipts} Slip${Number(receipts) > 1 ? 's' : ''}`);
    }
    return parts.length > 0 ? parts.join(' • ') : 'Freight Cargo';
  };

  // Filtering
  const filteredBills = bills.filter(bill => {
    const q = (searchTerm || '').trim().toLowerCase();
    const inv = (bill.invoiceNumber || '').toLowerCase();
    const cust = (bill.customerName || '').toLowerCase();
    const freightDetails = getFreightDetailsString(bill).toLowerCase();

    const matchesSearch = !q ||
      inv.includes(q) ||
      cust.includes(q) ||
      freightDetails.includes(q);

    const matchesStatus = statusFilter === 'ALL' || bill.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate bill total helper using unified function
  const calculateTotal = (b) => {
    return calculateBillTotals(b).totalAmount;
  };

  // Stats calculation
  const totalRevenue = bills.reduce((acc, b) => acc + calculateTotal(b), 0);
  const paidRevenue = bills
    .filter(b => b.paymentStatus === 'Paid')
    .reduce((acc, b) => acc + calculateTotal(b), 0);
  const pendingRevenue = bills
    .filter(b => b.paymentStatus === 'Pending' || b.paymentStatus === 'Partially Paid')
    .reduce((acc, b) => acc + calculateTotal(b), 0);

  // Export to CSV
  const exportToCSV = () => {
    if (bills.length === 0) {
      alert('No bills to export.');
      return;
    }

    const headers = [
      'Invoice Number',
      'Date',
      'Customer Name',
      'Freight Details',
      'Total Amount',
      'Payment Status',
      'Payment Method'
    ];

    const rows = bills.map(b => {
      const freightStr = getFreightDetailsString(b);

      return [
        `"${b.invoiceNumber || ''}"`,
        `"${b.date || ''}"`,
        `"${b.customerName || 'Walk-in'}"`,
        `"${freightStr}"`,
        calculateTotal(b).toFixed(2),
        `"${b.paymentStatus || 'Paid'}"`,
        `"${b.paymentMethod || 'Cash'}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `billgen_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Billed
            </span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <IndianRupee className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {formatCurrency(totalRevenue, currencySymbol)}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{bills.length} bills generated</p>
        </div>

        <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Paid Amount
            </span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-2 font-mono">
            {formatCurrency(paidRevenue, currencySymbol)}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {bills.filter(b => b.paymentStatus === 'Paid').length} paid invoices
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Pending / Due
            </span>
            <span className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-2 font-mono">
            {formatCurrency(pendingRevenue, currencySymbol)}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {bills.filter(b => b.paymentStatus === 'Pending' || b.paymentStatus === 'Partially Paid').length} pending bills
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-3 transition-colors">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by invoice #, customer, freight details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/50 dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/70 dark:border-slate-700/80 rounded-xl transition-colors shrink-0 cursor-pointer shadow-2xs"
              title="Export all bills to CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filter tags */}
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-slate-400 dark:text-slate-500 font-medium">Status:</span>
            {['ALL', 'Paid', 'Pending', 'Partially Paid'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bills Table / List */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs overflow-hidden transition-colors">
        {filteredBills.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Bills Found</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              {bills.length === 0
                ? 'Generate your first bill by selecting products and amount in the generator tab.'
                : 'No bills match your current search or filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-[#0f172a]/70 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Freight Details</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredBills.map((b) => {
                  const billTotal = calculateTotal(b);
                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                      onClick={() => onSelectBill(b)}
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {b.invoiceNumber || 'INV-DRAFT'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {formatDate(b.date)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-xs">
                          {getFreightDetailsString(b)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {b.customerName || 'Walk-in Customer'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(billTotal, b.currencySymbol || currencySymbol)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            b.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                              : b.paymentStatus === 'Partially Paid'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                          }`}
                        >
                          {b.paymentStatus || 'Paid'}
                        </span>
                      </td>

                      {/* Row Action Buttons: Edit, Print, Share, Delete */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {/* 1. Edit */}
                          <button
                            onClick={() => onSelectBill(b)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Edit Bill (Load into Generator)"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Print / Save PDF */}
                          <button
                            onClick={() => onPrintBill(b)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Print / Save PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* 3. Share to any Application */}
                          <button
                            onClick={() => setSharingBill(b)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Share Invoice to Any Application (WhatsApp, Email, etc.)"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {/* 4. Delete */}
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete invoice ${b.invoiceNumber || ''}?`)) {
                                onDeleteBill(b.id);
                              }
                            }}
                            className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Delete Bill"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Share Modal Dialog */}
      <ShareBillModal
        isOpen={!!sharingBill}
        onClose={() => setSharingBill(null)}
        bill={sharingBill}
        businessProfile={businessProfile}
        settings={settings}
      />
    </div>
  );
}
