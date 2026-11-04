import React, { useState } from 'react';
import { X, Building2, Save, RotateCcw, Landmark } from 'lucide-react';
import { CURRENCIES } from '../data/defaultMakes';
import { DEFAULT_BUSINESS_PROFILE } from '../utils/storage';

export default function BusinessSettingsModal({
  isOpen,
  onClose,
  businessProfile,
  onSaveBusinessProfile,
  settings,
  onSaveSettings
}) {
  const [profile, setProfile] = useState(businessProfile);
  const [appSettings, setAppSettings] = useState(settings);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    if (name === 'currency') {
      const selectedCurr = CURRENCIES.find(c => c.code === value);
      setAppSettings(prev => ({
        ...prev,
        currency: value,
        currencySymbol: selectedCurr ? selectedCurr.symbol : '$'
      }));
    } else {
      setAppSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveBusinessProfile(profile);
    onSaveSettings(appSettings);
    onClose();
  };

  const handleReset = () => {
    if (confirm('Reset business profile back to default template?')) {
      setProfile(DEFAULT_BUSINESS_PROFILE);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs p-4 no-print animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-[#0f172a]/70">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Business & Invoice Settings</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configure your company information and default invoice preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Section 1: Business Identity */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
              Company Details (Appears on Bills)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Company / Store Name *</label>
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Tagline / Slogan</label>
                <input
                  type="text"
                  name="tagline"
                  value={profile.tagline || ''}
                  onChange={handleChange}
                  placeholder="Enter Tagline / Slogan (Optional)"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Street Address</label>
                <input
                  type="text"
                  name="address"
                  value={profile.address || ''}
                  onChange={handleChange}
                  placeholder="Enter Street Address"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">City, State / Zip</label>
                <input
                  type="text"
                  name="city"
                  value={profile.city || ''}
                  onChange={handleChange}
                  placeholder="Enter City, State, PIN"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">GSTIN / Tax ID / EIN</label>
                <input
                  type="text"
                  name="taxId"
                  value={profile.taxId || ''}
                  onChange={handleChange}
                  placeholder="Enter GSTIN Number"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Bank Account Details (Printed on Invoice) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Bank Account Details (Printed on Invoice)
                </h4>
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 font-semibold px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/60">
                ✓ Auto-sync to Invoice
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Configure your business bank account. These details automatically print in the invoice payment box when Online / Gateway payment is selected.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  value={profile.bankName || ''}
                  onChange={handleChange}
                  placeholder="Enter Bank Name (e.g. GP PARSIK BANK / HDFC)"
                  maxLength={50}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Account Number</label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    {(profile.accountNumber || '').length}/18 digits
                  </span>
                </div>
                <input
                  type="text"
                  name="accountNumber"
                  inputMode="numeric"
                  maxLength={18}
                  value={profile.accountNumber || ''}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 18);
                    setProfile(prev => ({ ...prev, accountNumber: clean }));
                  }}
                  placeholder="Enter Account Number"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono tracking-wide bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Numbers only (max 18 digits)</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">IFSC Code</label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    {(profile.ifscCode || '').length}/11 chars
                  </span>
                </div>
                <input
                  type="text"
                  name="ifscCode"
                  maxLength={11}
                  value={profile.ifscCode || ''}
                  onChange={(e) => {
                    const clean = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
                    setProfile(prev => ({ ...prev, ifscCode: clean }));
                  }}
                  placeholder="Enter IFSC Code (e.g. PJSB0000023)"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono font-bold uppercase tracking-wider bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Strictly 11 alphanumeric characters</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Branch Name</label>
                <input
                  type="text"
                  name="branch"
                  value={profile.branch || ''}
                  onChange={handleChange}
                  placeholder="Enter Branch Name (e.g. KALBADEVI, MUMBAI)"
                  maxLength={50}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Terms and Footnotes */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
              Invoice Footer & Notes
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Footer Notes</label>
                <input
                  type="text"
                  name="notes"
                  value={profile.notes || ''}
                  onChange={handleChange}
                  placeholder="GST PAYABLE BY PARTY"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Terms & Conditions</label>
                <textarea
                  name="terms"
                  rows={2}
                  value={profile.terms || ''}
                  onChange={handleChange}
                  placeholder="Warranty terms, return policy, payment due terms..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Default Currency</label>
                <select
                  name="currency"
                  value={appSettings.currency || 'INR'}
                  onChange={handleSettingsChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-100"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code} - {c.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
