/**
 * Invoice Service (Placeholder)
 * 
 * Handles invoice generation and download logic.
 * Designed to be client-side for UI demo, with hooks for future server-side PDF generation.
 */

/**
 * Initiates the PDF download for an invoice.
 * Currently uses the browser's print-to-pdf functionality as a UI-first approach.
 * 
 * @param orderId - The ID of the order to generate an invoice for
 */
export const downloadInvoicePDF = async (orderId: string): Promise<void> => {
  console.log(`[Invoice Service] Initiating download for Order: ${orderId}`);
  
  /* 
    TODO: BACKEND INTEGRATION
    1. Call backend endpoint (e.g., GET /api/orders/:id/invoice-pdf)
    2. Backend generates PDF using Puppeteer/jsPDF/react-pdf
    3. Return file stream or signed S3 URL
    4. Trigger browser download
  */

  // UI-ONLY FALLBACK: Trigger print dialog
  // In a production app, we would use a library like 'html2pdf.js' or 'jspdf'
  window.print();
};

/**
 * Standardizes invoice number generation.
 * @param orderId 
 * @returns string
 */
export const getInvoiceNumber = (orderId: string): string => {
  return `INV-${orderId.replace('ORD-', '')}-${new Date().getFullYear()}`;
};