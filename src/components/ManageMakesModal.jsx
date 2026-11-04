import React, { useState } from 'react';
import { X, Plus, Trash2, Tag, RotateCcw } from 'lucide-react';
import { INITIAL_MAKES } from '../data/defaultMakes';

export default function ManageMakesModal({ isOpen, onClose, makes, onSaveMakes }) {
  const [newMakeName, setNewMakeName] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [filterCategory, setFilterCategory] = useState('ALL');

  if (!isOpen) return null;

  const categories = ['General', 'Automotive', 'Electronics', 'Appliances', 'Services', 'Parts', 'Custom'];
  const allExistingCategories = ['ALL', ...new Set(makes.map(m => m.category || 'General'))];

  const handleAdd = (e) => {
    e.preventDefault();
    const trimmed = newMakeName.trim();
    if (!trimmed) return;
    if (makes.some(m => m.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('This make/brand already exists in your list.');
      return;
    }

    const newMake = {
      id: `m-custom-${Date.now()}`,
      name: trimmed,
      category: newCategory,
      isCustom: true
    };

    onSaveMakes([...makes, newMake]);
    setNewMakeName('');
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to remove this make?')) {
      onSaveMakes(makes.filter(m => m.id !== id));
    }
  };

  const handleResetToDefault = () => {
    if (confirm('Reset to default makes list? This will restore the default brands.')) {
      onSaveMakes(INITIAL_MAKES);
    }
  };

  const displayedMakes = filterCategory === 'ALL'
    ? makes
    : makes.filter(m => (m.category || 'General') === filterCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs p-4 no-print animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-[#0f172a]/70">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Manage Makes & Brands</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Add or manage brands/makes for your billing dropdown</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Make Form */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-[#0f172a]/40">
          <form onSubmit={handleAdd} className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Add New Make / Brand
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="e.g. Acme Corp, Sony, Honda, Custom..."
                value={newMakeName}
                onChange={(e) => setNewMakeName(e.target.value)}
                className="flex-1 px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white dark:bg-[#1e293b] text-slate-700 dark:text-slate-200"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!newMakeName.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </form>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] flex items-center justify-between text-xs gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 flex-nowrap">
            <span className="text-slate-400 dark:text-slate-500 font-medium">Filter:</span>
            {allExistingCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded-full font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  filterCategory === cat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <button
            onClick={handleResetToDefault}
            className="text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer"
            title="Reset to default make list"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Makes List */}
        <div className="flex-1 overflow-y-auto p-6 divide-y divide-slate-100 dark:divide-slate-800 custom-scrollbar">
          {displayedMakes.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
              No makes found for this category.
            </div>
          ) : (
            displayedMakes.map(make => (
              <div
                key={make.id}
                className="py-2.5 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/60 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{make.name}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                    {make.category || 'General'}
                  </span>
                  {make.isCustom && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                      Custom
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(make.id)}
                  className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                  title="Delete make"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a]/70 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Total {makes.length} makes available
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
