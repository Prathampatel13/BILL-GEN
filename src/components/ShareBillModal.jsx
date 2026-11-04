import React, { useState } from 'react';
import { X, Share2, Smartphone, FileDown, Loader2, CheckCircle2 } from 'lucide-react';
import { formatCurrency, calculateBillTotals } from '../utils/formatters';
import { generateInvoicePDFBlob, downloadInvoiceAsPDF } from '../utils/pdfGenerator';
import InvoiceDocument from './InvoiceDocument';

export default function ShareBillModal({
  isOpen,
  onClose,
  bill,
  businessProfile = {},
  settings = {}
}) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [notice, setNotice] = useState('');

  if (!isOpen || !bill) return null;

  const currencySymbol = bill.currencySymbol || settings.currencySymbol || '₹';
  const { totalAmount } = calculateBillTotals(bill);

  // 1. Share A4 PDF to any app (WhatsApp, Telegram, Messages, Drive, etc.)
  const handleShareA4Pdf = async () => {
    try {
      setIsGeneratingPdf(true);
      setNotice('');
      const cleanInv = (bill.invoiceNumber || 'INV').replace(/[/\\?%*:|"<>]/g, '_');
      const cleanCust = (bill.customerName || 'Freight_Bill').replace(/[/\\?%*:|"<>]/g, '_');
      const filename = `${cleanInv}_${cleanCust}.pdf`;

      // Use the dedicated hidden share document to guarantee 100% accuracy and availability
      const targetElementId = document.getElementById('invoice-document-share') ? 'invoice-document-share' : 'invoice-document';
      const blob = await generateInvoicePDFBlob(targetElementId);
      const pdfFile = new File([blob], filename, { type: 'application/pdf' });

      // Check if native Web Share with files is supported
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: `Invoice ${bill.invoiceNumber || ''} - ${businessProfile.name || 'Shree Cargo'}`,
            text: `Invoice #${bill.invoiceNumber || ''} (PDF)`
          });
          onClose();
          return;
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') {
            return;
          }
        }
      }

      // Fallback (Desktop browser or unsupported device):
      // Download the PDF file directly and provide clean confirmation
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setNotice('✓ PDF downloaded! You can now send it on WhatsApp, Telegram, or Email.');
      setTimeout(() => {
        onClose();
      }, 1600);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing PDF:', err);
        setNotice('Error: ' + (err.message || 'Could not generate PDF. Please try again.'));
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 2. Download A4 PDF directly
  const handleDownloadA4Pdf = async () => {
    try {
      setIsGeneratingPdf(true);
      setNotice('');
      const cleanInv = (bill.invoiceNumber || 'INV').replace(/[/\\?%*:|"<>]/g, '_');
      const cleanCust = (bill.customerName || 'Freight_Bill').replace(/[/\\?%*:|"<>]/g, '_');
      const filename = `${cleanInv}_${cleanCust}`;
      const targetElementId = document.getElementById('invoice-document-share') ? 'invoice-document-share' : 'invoice-document';
      await downloadInvoiceAsPDF(targetElementId, filename);
      setNotice('✓ PDF downloaded successfully!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Download error:', err);
      setNotice('Error: ' + (err.message || 'Could not download PDF.'));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <>
      {/* Hidden fallback rendered invoice document ensuring capture works anywhere (Generator or Bill History) */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '794px',
          zIndex: 0,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <InvoiceDocument
          id="invoice-document-share"
          bill={bill}
          businessProfile={businessProfile}
          settings={settings}
        />
      </div>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs p-4 no-print animate-in fade-in duration-150">
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 transition-colors">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-[#0f172a]/70">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Share & Export Invoice</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {bill.invoiceNumber || 'INV'} &bull; {formatCurrency(totalAmount, currencySymbol)} (A4 PDF)
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

          {/* Share & Download Options - 100% PDF Only */}
          <div className="p-5 space-y-3">
            {/* Notification banner if fallback downloaded */}
            {notice && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{notice}</span>
              </div>
            )}

            {/* 1. Share A4 PDF directly (WhatsApp, Telegram, Messages, Drive, etc.) */}
            <button
              onClick={handleShareA4Pdf}
              disabled={isGeneratingPdf}
              className="w-full p-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold text-xs flex items-center justify-between shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                <div className="text-left">
                  <p className="font-bold text-sm">Share A4 PDF to Any App</p>
                  <p className="text-[11px] text-emerald-100 font-normal">WhatsApp, Telegram, Messages, Drive, etc.</p>
                </div>
              </div>
              <Share2 className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* 2. Download A4 PDF directly */}
            <button
              onClick={handleDownloadA4Pdf}
              disabled={isGeneratingPdf}
              className="w-full p-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl font-medium text-xs flex items-center justify-between transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <FileDown className="w-4 h-4 text-emerald-400" />}
                <div className="text-left">
                  <span className="font-bold text-sm block">Download A4 PDF</span>
                  <span className="text-[11px] text-slate-400 block">Strict 1-Page Standard A4 format</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 dark:bg-slate-900 text-slate-300 border border-slate-700">.pdf</span>
            </button>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a]/70 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
