import React, { useState, useEffect } from 'react';
import InvoiceLayout from '../components/InvoiceLayout';
import { ChevronLeft, Printer, Download, Package, Loader2, AlertCircle } from 'lucide-react';
import { getInvoiceByOrderId, getInvoiceNumber, downloadInvoicePDF, InvoiceData } from '../services/invoiceService';
import { useCurrency } from '../hooks/useCurrency';
import { getPublicSiteConfig, getPublicSiteConfigSnapshot } from '../services/siteConfigService';

interface InvoicePageProps {
  orderId?: string;
  onNavigate: (view: any, param?: any) => void;
}

const Invoice: React.FC<InvoicePageProps> = ({ orderId, onNavigate }) => {
  const { formatCurrency } = useCurrency();
  const initialSiteConfig = getPublicSiteConfigSnapshot();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<InvoiceData | null>(null);
  const [billingConfig, setBillingConfig] = useState(() => ({
    taxEnabled: initialSiteConfig.taxEnabled,
    taxRate: initialSiteConfig.defaultTaxRate
  }));

  useEffect(() => {
    const loadInvoice = async () => {
      if (!orderId) {
        setError('Order record not found.');
        setLoading(false);
        return;
      }

      setLoading(true);
      const invoice = await getInvoiceByOrderId(orderId);
      if (!invoice) {
        setError('Order record not found.');
      } else {
        setData(invoice);
      }
      setLoading(false);
    };

    loadInvoice();
  }, [orderId]);

  useEffect(() => {
    let mounted = true;
    const applyConfig = (nextConfig: ReturnType<typeof getPublicSiteConfigSnapshot>) => {
      if (!mounted) return;
      setBillingConfig({
        taxEnabled: nextConfig.taxEnabled,
        taxRate: nextConfig.defaultTaxRate
      });
    };

    const refreshConfig = async () => {
      try {
        const liveConfig = await getPublicSiteConfig();
        applyConfig(liveConfig);
      } catch (cfgErr) {
        console.warn('Failed to load invoice billing config:', cfgErr);
      }
    };

    applyConfig(getPublicSiteConfigSnapshot());
    void refreshConfig();

    const handleConfigUpdated = () => {
      applyConfig(getPublicSiteConfigSnapshot());
      void refreshConfig();
    };

    window.addEventListener('site-config-updated', handleConfigUpdated as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener('site-config-updated', handleConfigUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    if (loading || !data) return;
    let shouldAutoPrint = false;
    try {
      shouldAutoPrint = window.sessionStorage.getItem('noklity_auto_print_invoice') === '1';
      if (shouldAutoPrint) {
        window.sessionStorage.removeItem('noklity_auto_print_invoice');
      }
    } catch {
      shouldAutoPrint = false;
    }
    if (!shouldAutoPrint) return;

    const timer = window.setTimeout(() => {
      window.print();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loading, data?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 font-sans">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-bold">Loading Invoice Details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 font-sans">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-xl text-center max-w-md border border-gray-100">
          <AlertCircle className="w-16 h-16 text-primary mx-auto mb-6" />
          <h2 className="text-2xl font-black text-gray-900 mb-2">Invoice Error</h2>
          <p className="text-gray-500 mb-8 font-medium">{error}</p>
          <button 
            onClick={() => onNavigate('account-orders')}
            className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const invoiceNum = getInvoiceNumber(data.id);
  const normalizedTaxRate = Math.max(0, Number(billingConfig.taxRate) || 0);
  const taxLabelPercent = Number.isInteger(normalizedTaxRate)
    ? String(normalizedTaxRate)
    : normalizedTaxRate.toFixed(2).replace(/\.?0+$/, '');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans print:min-h-0 print:block print:bg-white">
      {/* Top Action Bar - Hidden on print */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 print:hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => onNavigate('order-details', data.id)}
            className="flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Order
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button 
              onClick={() => downloadInvoicePDF(data.id)}
              className="flex items-center gap-2 bg-gray-900 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-200"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      <main className="flex-grow py-8 md:py-12 px-4 print:flex-none print:p-0">
        <InvoiceLayout 
          orderId={data.id} 
          date={data.date} 
          invoiceNumber={invoiceNum}
          paymentStatus={data.paymentStatus}
        >
          {/* Billing Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12 print:gap-5 print:mb-6">
            <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Billed To</h3>
              <p className="text-sm font-black text-gray-900 mb-1">{data.customer.name}</p>
              <p className="text-sm text-gray-500 font-medium mb-1">{data.customer.email}</p>
              <p className="text-sm text-gray-500 font-medium">{data.customer.phone}</p>
            </div>
            <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Shipping Address</h3>
              <p className="text-sm text-gray-900 font-bold leading-relaxed">{data.shippingAddress}</p>
            </div>
          </div>

          <div className="mb-8 text-sm font-bold text-gray-600 print:mb-4 print:text-xs">
            Payment Method: <span className="text-gray-900">{data.paymentMethod}</span>
          </div>

          {/* Items Table */}
          <div className="mb-12 overflow-x-auto print:mb-6">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-gray-900 bg-gray-50">
                  <th className="py-4 px-4 text-[10px] font-black text-gray-900 uppercase tracking-widest">Item Description</th>
                  <th className="py-4 px-4 text-[10px] font-black text-gray-900 uppercase tracking-widest">SKU</th>
                  <th className="py-4 px-4 text-[10px] font-black text-gray-900 uppercase tracking-widest text-center">Qty</th>
                  <th className="py-4 px-4 text-[10px] font-black text-gray-900 uppercase tracking-widest text-right">Price</th>
                  <th className="py-4 px-4 text-[10px] font-black text-gray-900 uppercase tracking-widest text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-5 px-4 print:py-3">
                      <div className="flex items-center gap-3">
                        <div className="hidden sm:block w-8 h-8 bg-gray-50 rounded border border-gray-100 flex-shrink-0">
                           <Package className="w-full h-full p-1.5 text-gray-300" />
                        </div>
                        <span className="text-sm font-bold text-gray-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-5 px-4 text-xs font-mono font-bold text-gray-400 print:py-3">{item.sku}</td>
                    <td className="py-5 px-4 text-sm font-bold text-gray-900 text-center print:py-3">{item.qty}</td>
                    <td className="py-5 px-4 text-sm font-bold text-gray-900 text-right print:py-3">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-5 px-4 text-sm font-black text-gray-900 text-right print:py-3">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex flex-col items-end print:break-inside-avoid">
            <div className="w-full md:w-80 space-y-3">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-gray-400 uppercase tracking-widest">Subtotal</span>
                <span className="text-gray-900">{formatCurrency(data.subtotal)}</span>
              </div>
              {data.discount > 0 && (
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-gray-400 uppercase tracking-widest">Discount</span>
                  <span className="text-primary">-{formatCurrency(data.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold">
                <span className="text-gray-400 uppercase tracking-widest">Shipping</span>
                <span className="text-gray-900">{formatCurrency(data.shipping)}</span>
              </div>
              {billingConfig.taxEnabled && (
                <div className="flex justify-between text-sm font-bold pb-4 border-b border-gray-100">
                  <span className="text-gray-400 uppercase tracking-widest">Tax (VAT {taxLabelPercent}%)</span>
                  <span className="text-gray-900">{formatCurrency(data.tax)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-black text-gray-900 uppercase tracking-tighter">Grand Total</span>
                <span className="text-3xl font-black text-primary tracking-tighter">{formatCurrency(data.total)}</span>
              </div>
            </div>
          </div>
        </InvoiceLayout>
      </main>
    </div>
  );
};

export default Invoice;
