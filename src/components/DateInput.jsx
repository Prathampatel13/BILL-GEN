import React, { useState, useRef } from 'react';
import { Calendar, X } from 'lucide-react';
import { isoToDMY, dmyToISO } from '../utils/formatters';

/**
 * Custom Date Input enforcing strict dd/mm/yyyy format.
 * Prevents browser-default mm/dd/yyyy while keeping native calendar picker functionality.
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

  // Synchronize state when parent changes (e.g. clicking 'Today', '+7d', '+15d', or clearing to '')
  if (value !== prevValue) {
    setPrevValue(value);
    setDisplayVal(isoToDMY(value));
  }

  const handleTextChange = (e) => {
    let input = e.target.value;
    // Allow digits and slashes only
    input = input.replace(/[^\d/]/g, '');

    // If user cleared the input completely, propagate empty string immediately!
    if (input.trim() === '') {
      setDisplayVal('');
      onChange('');
      if (hiddenDateRef.current) hiddenDateRef.current.value = '';
      return;
    }

    // Auto-insert slash after day (2 digits) and month (5 chars)
    const isDeleting = e.nativeEvent && e.nativeEvent.inputType === 'deleteContentBackward';
    if (!isDeleting) {
      if (input.length === 2 && !input.includes('/')) {
        input = input + '/';
      } else if (input.length === 5 && input.split('/').length === 2) {
        input = input + '/';
      }
    }

    input = input.slice(0, 10);
    setDisplayVal(input);

    // If complete valid dd/mm/yyyy is entered, trigger onChange with ISO YYYY-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
      const [d, m, y] = input.split('/');
      const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      onChange(iso);
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
        inputMode="numeric"
        placeholder={placeholder}
        value={displayVal}
        onChange={handleTextChange}
        className={`${className} ${displayVal ? 'pr-14' : 'pr-9'} font-mono`}
        maxLength={10}
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
        value={dmyToISO(value)}
        onChange={handlePickerChange}
        className="sr-only opacity-0 pointer-events-none absolute"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
