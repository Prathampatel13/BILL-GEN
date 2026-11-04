import React, { useState } from 'react';
import { X, Users, Search, Phone, Mail, MapPin, Trash2, ArrowRight, CreditCard, Landmark } from 'lucide-react';

export default function SavedCustomersModal({
  isOpen,
  onClose,
  customers = [],
  onSelectCustomer,
  onDeleteCustomer
}) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredCustomers = (customers || []).filter(c => {
    const q = (searchTerm || '').toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.gstin && c.gstin.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q)) ||
      (c.ifscCode && c.ifscCode.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs p-4 no-print animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 transition-colors">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-[#0f172a]/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Saved Customer Directory</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click any customer card to automatically fill their details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, phone, email, or IFSC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/50 dark:bg-[#1e293b] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>
        </div>

        {/* Customer List (Whole Card is 1-Click Selectable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-10 px-4">
              <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No Customers Found</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                {customers.length === 0
                  ? 'Fill in a customer in Section 3 and save a bill to automatically add them here.'
                  : `No customer matches "${searchTerm}".`}
              </p>
            </div>
          ) : (
            filteredCustomers.map((c) => (
              <div
                key={c.id || c.name}
                onClick={() => {
                  onSelectCustomer(c);
                  onClose();
                }}
                className="p-3.5 bg-slate-50 dark:bg-[#1e293b]/70 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 border border-slate-200/90 dark:border-slate-700/80 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-xs rounded-xl transition-all flex items-center justify-between gap-3 group cursor-pointer"
                title="Click anywhere on this card to automatically fill customer details"
              >
                {/* Customer Details Content */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 truncate">
                      {c.name}
                    </h4>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 ml-2">
                      Click to auto-fill <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300 pt-1">
                    {c.gstin && (
                      <div className="flex items-center gap-1.5 col-span-1 sm:col-span-2 text-slate-700 dark:text-slate-200 truncate font-mono text-[11px]">
                        <span className="font-semibold text-slate-500 dark:text-slate-400">GSTIN:</span>
                        <span className="truncate font-bold tracking-wider">{c.gstin}</span>
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Phone className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                        <span className="truncate font-mono font-medium">
                          {c.phone.length === 10 ? `+91 ${c.phone}` : c.phone}
                        </span>
                      </div>
                    )}
                    {c.email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    )}
                    {c.address && (
                      <div className="flex items-center gap-1.5 col-span-1 sm:col-span-2 text-slate-600 dark:text-slate-300 truncate text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                        <span className="truncate">{c.address}</span>
                      </div>
                    )}
                    {c.ifscCode && (
                      <div className="flex items-center gap-1.5 col-span-1 sm:col-span-2 text-slate-600 dark:text-slate-300 truncate font-mono text-[11px]">
                        <span className="font-semibold text-slate-500 dark:text-slate-400">IFSC:</span>
                        <span className="truncate font-bold tracking-wider">{c.ifscCode}</span>
                      </div>
                    )}
                    {(c.paymentMethod || c.bankName) && (
                      <div className="flex items-center gap-2 col-span-1 sm:col-span-2 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                        {c.paymentMethod && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-100 dark:border-emerald-900/60">
                            <CreditCard className="w-3 h-3 text-emerald-500" />
                            {c.paymentMethod}
                          </span>
                        )}
                        {c.bankName && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px]">
                            <Landmark className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                            {c.bankName}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action: Delete Button only (with stopPropagation) */}
                {onDeleteCustomer && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Remove "${c.name}" from your customer directory?`)) {
                        onDeleteCustomer(c.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Delete customer from directory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a]/70 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{customers.length} total saved contacts</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
