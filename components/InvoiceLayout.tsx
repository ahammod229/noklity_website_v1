import React from 'react';
import { Mail, MessageCircle, Globe } from 'lucide-react';
import { useTenantConfig } from '../contexts/TenantConfigContext';
import { getShortOrderId } from '../utils/orderId';

interface InvoiceLayoutProps {
  children: React.ReactNode;
  orderId: string;
  date: string;
  invoiceNumber: string;
  paymentStatus: string;
}

const InvoiceLayout: React.FC<InvoiceLayoutProps> = ({ 
  children, 
  orderId, 
  date, 
  invoiceNumber,
  paymentStatus 
}) => {
  const { config } = useTenantConfig();
  const encodedName = encodeURIComponent(config.brandName || 'Storefront');
  const fallbackLogo = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 52'%3E%3Cpath fill='%23DC2626' d='M15 5 L5 47 L30 47 L40 5 Z'/%3E%3Ctext x='52' y='39' font-family='sans-serif' font-weight='900' font-size='32' fill='%23111827' letter-spacing='-1'%3E${encodedName}%3C/text%3E%3C/svg%3E`;
  const logoSrc = config.brandLogoUrl || fallbackLogo;
  const websiteLabel = config.domain || 'localhost';

  return (
    <div className="bg-white p-8 md:p-12 shadow-sm border border-gray-100 max-w-[800px] mx-auto print:shadow-none print:border-none print:p-0 print:max-w-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12 border-b border-gray-100 pb-8 print:gap-4 print:mb-5 print:pb-4">
        <div>
          <img src={logoSrc} alt={config.brandName} className="h-10 mb-4 print:h-8 print:mb-2" />
          <div className="space-y-1 text-sm text-gray-500 font-medium print:text-xs">
            <p className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-primary" /> {config.supportEmail}
            </p>
            <p className="flex items-center gap-2">
              <MessageCircle className="w-3.5 h-3.5 text-green-600" /> {config.companyPhone || 'N/A'}
            </p>
            <p className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-blue-500" /> {websiteLabel}
            </p>
          </div>
        </div>

        <div className="text-left md:text-right space-y-1 print:space-y-0.5">
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter print:text-xl">Tax Invoice</h1>
          <p className="text-sm font-bold text-gray-500 print:text-xs">Invoice: <span className="text-gray-900 font-mono">{invoiceNumber}</span></p>
          <p className="text-sm font-bold text-gray-500 print:text-xs">Order ID: <span className="text-gray-900 font-mono">{getShortOrderId(orderId)}</span></p>
          <p className="text-sm font-bold text-gray-500 print:text-xs">Date: <span className="text-gray-900">{date}</span></p>
          <div className="pt-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
              paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'
            }`}>
              {paymentStatus}
            </span>
          </div>
        </div>
      </div>

      {children}

      {/* Footer */}
      <div className="mt-16 pt-8 border-t border-gray-100 text-center print:mt-6 print:pt-4">
        <p className="text-sm font-bold text-gray-900 mb-1 print:text-xs">Thank you for choosing {config.brandName}!</p>
        <p className="text-xs text-gray-400 font-medium mb-4 print:mb-2">This is a system-generated invoice and does not require a physical signature.</p>
        <div className="bg-gray-50 rounded-xl p-4 inline-block text-[11px] text-gray-500 font-bold max-w-md print:p-2 print:text-[10px] print:rounded-lg">
          Returns & Support: Items must be in original packaging for returns. Contact {config.supportEmail} for any discrepancies within 48 hours of delivery.
        </div>
      </div>
    </div>
  );
};

export default InvoiceLayout;
