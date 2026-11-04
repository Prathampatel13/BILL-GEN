import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

/**
 * Creates a standard A4 single-page jsPDF document from the invoice element.
 * Strictly constrained to exactly one A4 page (210mm x 297mm) with balanced margins.
 */
async function buildA4Pdf(elementId = 'invoice-document') {
  let element = document.getElementById(elementId) ||
                document.getElementById('invoice-document') ||
                document.getElementById('invoice-document-share') ||
                document.querySelector('.print-container');
  if (!element) {
    throw new Error(`Invoice element not found`);
  }

  // Create canvas with scale: 2 for sharp crisp text, lines, and borders
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: element.scrollWidth || 794,
    windowHeight: element.scrollHeight || 1123,
    onclone: (clonedDoc) => {
      // Ensure cloned container renders all content without viewport clipping
      const target = clonedDoc.getElementById(element.id) || clonedDoc.querySelector('.print-container');
      if (target) {
        target.style.height = 'auto';
        target.style.overflow = 'visible';
        target.style.transform = 'none';
        let parent = target.parentElement;
        while (parent && parent !== clonedDoc.body) {
          parent.style.overflow = 'visible';
          parent.style.height = 'auto';
          parent = parent.parentElement;
        }
      }
    }
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.98);

  // Standard A4 dimensions in mm (210 x 297 mm)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 8;
  const maxWidth = pageWidth - (margin * 2); // 194 mm
  const maxHeight = pageHeight - (margin * 2); // 281 mm

  // Scale proportionally to strictly fit on exactly one single A4 page
  let renderWidth = maxWidth;
  let renderHeight = (canvas.height * renderWidth) / canvas.width;

  if (renderHeight > maxHeight) {
    renderHeight = maxHeight;
    renderWidth = (canvas.width * renderHeight) / canvas.height;
  }

  // Center horizontally within the A4 page
  const posX = (pageWidth - renderWidth) / 2;
  const posY = margin;

  pdf.addImage(imgData, 'JPEG', posX, posY, renderWidth, renderHeight);
  return pdf;
}

/**
 * Captures the invoice and automatically saves it as a single-page A4 PDF file.
 */
export async function downloadInvoiceAsPDF(elementId = 'invoice-document', filename = 'Invoice') {
  const pdf = await buildA4Pdf(elementId);
  const cleanName = (filename || 'bill').replace(/[/\\?%*:|"<>]/g, '_');
  const safeFilename = `${cleanName}.pdf`;

  try {
    pdf.save(safeFilename);
  } catch (saveErr) {
    console.warn('pdf.save failed, using blob link fallback:', saveErr);
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return true;
}

/**
 * Generates an A4 PDF Blob for direct sharing (e.g. WhatsApp, Email, System Share).
 */
export async function generateInvoicePDFBlob(elementId = 'invoice-document') {
  const pdf = await buildA4Pdf(elementId);
  return pdf.output('blob');
}
