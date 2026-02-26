import { supabase } from '../lib/supabase';
import { Json } from '../types';

export interface InvoiceItem {
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceData {
  id: string;
  date: string;
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
  paymentMethod: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

const mapPaymentStatus = (status?: string): 'Paid' | 'Pending' | 'Failed' => {
  if (status === 'paid') return 'Paid';
  if (status === 'failed') return 'Failed';
  return 'Pending';
};

const mapPaymentMethod = (method?: string) => {
  if (method === 'bkash') return 'bKash';
  if (method === 'nogad') return 'Nogad';
  if (method === 'bank_transfer') return 'Bank Transfer';
  if (method === 'cod') return 'Cash on Delivery';
  if (method === 'card') return 'Card';
  return method || 'Unknown';
};

const formatShippingAddress = (shipping: Json | null) => {
  const s = (shipping || {}) as Record<string, string>;
  return [s.address, s.city, s.state, s.zip, s.country].filter(Boolean).join(', ');
};

export const getInvoiceByOrderId = async (orderId: string): Promise<InvoiceData | null> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          quantity,
          price,
          product:products(id, title)
        )
      `)
      .eq('id', orderId)
      .single();

    if (error || !data) {
      console.error('Failed to fetch invoice data:', error?.message);
      return null;
    }

    const shipping = (data.shipping_address || {}) as Record<string, string>;
    const items: InvoiceItem[] = (data.order_items || []).map((item: any) => {
      const qty = Number(item.quantity) || 0;
      const unitPrice = Number(item.price) || 0;
      return {
        sku: String(item.product?.id || '').slice(0, 8).toUpperCase() || 'N/A',
        name: item.product?.title || 'Unknown Product',
        qty,
        unitPrice,
        total: qty * unitPrice
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const total = Number(data.total_amount) || 0;
    const estimatedShipping = subtotal > 0 ? 15 : 0;
    const tax = Math.max(0, total - subtotal - estimatedShipping);

    return {
      id: data.id,
      date: new Date(data.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      paymentStatus: mapPaymentStatus(data.payment_status),
      paymentMethod: mapPaymentMethod(data.payment_method),
      customer: {
        name: shipping.fullName || 'Customer',
        email: shipping.email || 'N/A',
        phone: shipping.phone || 'N/A'
      },
      shippingAddress: formatShippingAddress(data.shipping_address),
      items,
      subtotal,
      discount: 0,
      shipping: estimatedShipping,
      tax,
      total
    };
  } catch (err) {
    console.error('Unexpected error in getInvoiceByOrderId:', err);
    return null;
  }
};

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
