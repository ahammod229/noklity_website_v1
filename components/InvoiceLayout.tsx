import React from 'react';
import { Mail, MessageCircle, Globe } from 'lucide-react';

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
  const logoSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 50'%3E%3Cpath fill='%23DC2626' d='M15 5 L5 45 L30 45 L40 5 Z'/%3E%3Ctext x='50' y='38' font-family='sans-serif' font-weight='900' font-size='34' fill='%23111827' letter-spacing='-1'%3ENOKLITY%3C/text%3E%3C/svg%3E";

  return (
    <div className="bg-white p-8 md:p-12 shadow-sm border border-gray-100 max-w-[800px] mx-auto print:shadow-none print:border-none print:p-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12 border-b border-gray-100 pb-8">
        <div>
          <img src={logoSrc} alt="NOKLITY" className="h-10 mb-4" />
          <div className="space-y-1 text-sm text-gray-500 font-medium">
            <p className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-primary" /> support@noklity.com
            </p>
            <p className="flex items-center gap-2">
              <MessageCircle className="w-3.5 h-3.5 text-green-600" /> +880 1713-812668
            </p>
            <p className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-blue-500" /> www.noklity.com
            </p>
          </div>
        </div>

        <div className="text-left md:text-right space-y-1">
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Tax Invoice</h1>
          <p className="text-sm font-bold text-gray-500">Invoice: <span className="text-gray-900 font-mono">{invoiceNumber}</span></p>
          <p className="text-sm font-bold text-gray-500">Order ID: <span className="text-gray-900 font-mono">{orderId}</span></p>
          <p className="text-sm font-bold text-gray-500">Date: <span className="text-gray-900">{date}</span></p>
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
      <div className="mt-16 pt-8 border-t border-gray-100 text-center">
        <p className="text-sm font-bold text-gray-900 mb-1">Thank you for choosing NOKLITY Performance!</p>
        <p className="text-xs text-gray-400 font-medium mb-4">This is a system-generated invoice and does not require a physical signature.</p>
        <div className="bg-gray-50 rounded-xl p-4 inline-block text-[11px] text-gray-500 font-bold max-w-md">
          Returns & Support: Items must be in original packaging for returns. Contact support@noklity.com for any discrepancies within 48 hours of delivery.
        </div>
      </div>
    </div>
  );
};

export default InvoiceLayout;