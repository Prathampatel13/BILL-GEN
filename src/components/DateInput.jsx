import React, { useState, useRef } from 'react';
import { Calendar, X } from 'lucide-react';
import { isoToDMY, dmyToISO } from '../utils/formatters';

/**
 * Custom Date Input enforcing clear dd/mm/yyyy format and easy modification.
 * Supports manual typing, calendar picker, auto-formatting, and blur validation.
 */
export default function DateInput({
  value,
  onChange,
  className = '',
  placeholder = 'dd/mm/yyyy',
  required = false
}) {
  const [prevValue, setPrevValue] = useState(value);
  const [displayVal, setDisplayVal] = useState(() => isoToDMY(value));
  const hiddenDateRef = useRef(null);

  // Synchronize state when value changes from parent (e.g. clicking 'Today' or loading bill)
  if (value !== prevValue) {
    setPrevValue(value);
    setDisplayVal(isoToDMY(value));
  }

  const handleTextChange = (e) => {
    const input = e.target.value;
    setDisplayVal(input);

    // If completely cleared
    if (input.trim() === '') {
      onChange('');
      if (hiddenDateRef.current) hiddenDateRef.current.value = '';
      return;
    }

    // Try converting to ISO if valid
    const clean = input.trim().replace(/[-.]/g, '/');
    const parts = clean.split('/');
    if (parts.length === 3 && parts[2].length === 4 && parts[0].length >= 1 && parts[1].length >= 1) {
      const iso = dmyToISO(clean);
      if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        onChange(iso);
      }
    }
  };

  const handleBlur = () => {
    if (!displayVal.trim()) {
      setDisplayVal('');
      onChange('');
      return;
    }
    const clean = displayVal.trim().replace(/[-.]/g, '/');
    const iso = dmyToISO(clean);
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      setDisplayVal(isoToDMY(iso));
      onChange(iso);
    } else {
      // Restore valid value if input was invalid
      setDisplayVal(isoToDMY(value));
    }
  };

  const handlePickerChange = (e) => {
    const isoVal = e.target.value; // Native date picker yields YYYY-MM-DD
    if (isoVal) {
      setDisplayVal(isoToDMY(isoVal));
      onChange(isoVal);
    } else {
      setDisplayVal('');
      onChange('');
    }
  };

  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDisplayVal('');
    onChange('');
    if (hiddenDateRef.current) hiddenDateRef.current.value = '';
  };

  const openPicker = () => {
    if (hiddenDateRef.current) {
      try {
        if (typeof hiddenDateRef.current.showPicker === 'function') {
          hiddenDateRef.current.showPicker();
        } else {
          hiddenDateRef.current.focus();
          hiddenDateRef.current.click();
        }
      } catch {
        hiddenDateRef.current.focus();
      }
    }
  };

  return (
    <div className="relative flex items-center w-full">
      <input
        type="text"
        placeholder={placeholder}
        value={displayVal}
        onChange={handleTextChange}
        onBlur={handleBlur}
        className={`${className} ${displayVal ? 'pr-14' : 'pr-9'} font-mono`}
        maxLength={12}
        required={required}
      />

      <div className="absolute right-2 flex items-center gap-0.5">
        {displayVal && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Clear date"
            tabIndex={-1}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={openPicker}
          className="p-1 text-slate-400 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
          title="Open calendar picker"
          tabIndex={-1}
        >
          <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
        </button>
      </div>

      {/* Hidden native input for invoking system date picker */}
      <input
        ref={hiddenDateRef}
        type="date"
        value={value ? dmyToISO(value) : ''}
        onChange={handlePickerChange}
        className="sr-only opacity-0 pointer-events-none absolute"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
