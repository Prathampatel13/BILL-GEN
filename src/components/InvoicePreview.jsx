import React, { useState } from 'react';
import {
  Printer,
  Download,
  FileText,
  Loader2,
  Share2,
  CheckCircle2
} from 'lucide-react';
import InvoiceDocument from './InvoiceDocument';
import ShareBillModal from './ShareBillModal';

export default function InvoicePreview({
  bill,
  businessProfile,
  settings,
  onSavePdf,
  onSave,
  isGeneratingPdf,
  isSaving
}) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSavedJustNow, setIsSavedJustNow] = useState(false);

  // Clean click handler: does not leak SyntheticEvent
  const handleSaveClick = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSaving) return;
    if (onSave) {
      const res = onSave();
      if (res !== false) {
        setIsSavedJustNow(true);
        setTimeout(() => setIsSavedJustNow(false), 2500);
      }
    }
  };

  // Clean click handler: does not leak SyntheticEvent
  const handleSavePdfClick = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (onSavePdf && !isGeneratingPdf) {
      onSavePdf();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top action toolbar (Sticky during scroll, hidden when printing) */}
      <div className="sticky top-0 z-20 bg-slate-50/95 dark:bg-[#0b0f19]/95 backdrop-blur-md py-1 mb-3.5 no-print shrink-0 flex flex-wrap items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">Invoice Preview</h2>
          {bill.invoiceNumber && (
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">({bill.invoiceNumber})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Button 1: Save to History */}
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={isSaving}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer ${
              isSaving
                ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                : isSavedJustNow
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
            title="Save current bill to history database"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                <span>Saving...</span>
              </>
            ) : isSavedJustNow ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-75 duration-150" />
                <span>Saved to History!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Save to History</span>
              </>
            )}
          </button>

          {/* Button 2: Print / Save A4 PDF */}
          <button
            type="button"
            onClick={handleSavePdfClick}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            title="Automatically compiles, saves, and downloads this invoice as a strict 1-page A4 PDF"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving A4 PDF...</span>
              </>
            ) : (
              <>
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save A4 PDF</span>
              </>
            )}
          </button>

          {/* Button 3: Share */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#111827] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 rounded-xl shadow-2xs transition-all cursor-pointer"
            title="Share A4 PDF directly to WhatsApp, Telegram, or any app"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Invoice Document Sheet (Simple, authentic, professional transport bill matching photo) */}
      <InvoiceDocument
        id="invoice-document"
        bill={bill}
        businessProfile={businessProfile}
        settings={settings}
      />

      {/* Share Modal Dialog */}
      <ShareBillModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        bill={bill}
        businessProfile={businessProfile}
        settings={settings}
      />
    </div>
  );
}
