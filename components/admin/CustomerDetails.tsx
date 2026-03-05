
import React, { useMemo, useState } from 'react';
import { X, Mail, Phone, MapPin, ShoppingBag, Wallet, Calendar, ShieldCheck, UserMinus, MessageSquare, Clock } from 'lucide-react';
import { Customer } from '../../services/customerService';
import { useCurrency } from '../../hooks/useCurrency';
import { getPublicSiteConfigSnapshot } from '../../services/siteConfigService';
import { getTenantConfigSnapshot } from '../../services/tenantConfigService';
import { formatShortOrderId } from '../../utils/orderId';

interface CustomerDetailsProps {
  customer: Customer;
  onClose: () => void;
  onToggleStatus: (id: string, status: 'Active' | 'Blocked') => void;
}

const CustomerDetails: React.FC<CustomerDetailsProps> = ({ customer, onClose, onToggleStatus }) => {
  const { formatCurrency } = useCurrency();
  const [contactMessage, setContactMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const config = getPublicSiteConfigSnapshot();
  const tenantConfig = getTenantConfigSnapshot();

  const customerSummary = useMemo(() => {
    return [
      `Customer: ${customer.name}`,
      `Customer ID: ${customer.id}`,
      `Status: ${customer.status}`,
      `Total Orders: ${customer.ordersCount}`,
      `Total Spend: ${formatCurrency(customer.totalSpent)}`,
      `Last Order: ${customer.lastOrderDate}`,
      `Address: ${customer.address}`
    ].join('\n');
  }, [
    customer.address,
    customer.id,
    customer.lastOrderDate,
    customer.name,
    customer.ordersCount,
    customer.status,
    customer.totalSpent,
    formatCurrency
  ]);

  const getSafePhoneForWhatsApp = (phone: string) => {
    if (!phone || phone.toLowerCase() === 'n/a') return '';
    const cleaned = phone.replace(/[^\d+]/g, '').trim();
    if (!cleaned) return '';
    if (cleaned.startsWith('+')) return cleaned.slice(1);
    if (cleaned.startsWith('00')) return cleaned.slice(2);
    return cleaned;
  };

  const handleSendEmail = () => {
    if (!customer.email || customer.email.toLowerCase() === 'n/a') {
      setContactMessage({ type: 'error', text: 'This customer does not have a valid email address.' });
      return;
    }

    const subject = `${config.siteName || tenantConfig.brandName || 'Storefront'} - Customer Support Update`;
    const body = [
      `Hello ${customer.name},`,
      '',
      'We are contacting you regarding your account/order details.',
      '',
      customerSummary,
      '',
      `Best regards,`,
      `${config.siteName || tenantConfig.brandName || 'Storefront'} Support Team`
    ].join('\n');

    const mailto = `mailto:${encodeURIComponent(customer.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setContactMessage({ type: 'success', text: 'Email composer opened with customer details.' });
  };

  const handleSendWhatsApp = () => {
    const phone = getSafePhoneForWhatsApp(customer.phone);
    if (!phone) {
      setContactMessage({ type: 'error', text: 'Customer phone number is missing or invalid for WhatsApp.' });
      return;
    }

    const text = [
      `Hello ${customer.name},`,
      '',
      `This is ${config.siteName || tenantConfig.brandName || 'Storefront'} support.`,
      '',
      customerSummary
    ].join('\n');
    const waUrl = `https://wa.me/${encodeURIComponent(phone)}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setContactMessage({ type: 'success', text: 'WhatsApp chat opened with prefilled customer details.' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'text-green-600 bg-green-50 border-green-100';
      case 'Processing': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'Cancelled': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-100';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end p-4 sm:p-6 lg:p-8">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-xl h-full rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-500">
        {/* Header */}
        <div className="p-8 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-1">Customer 360</h2>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">ID: {customer.id.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white text-gray-400 hover:text-gray-900 rounded-full shadow-sm border border-gray-100 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {contactMessage && (
            <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${
              contactMessage.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {contactMessage.text}
            </div>
          )}

          
          {/* Profile Basic */}
          <section className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-[2rem] bg-primary text-white flex items-center justify-center font-black text-4xl shadow-2xl shadow-red-500/20 mb-6">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">{customer.name}</h3>
            <div className="mt-2 flex items-center gap-2 justify-center">
               <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                customer.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
               }`}>
                 {customer.status}
               </span>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Member since {customer.joinedDate}</span>
            </div>
          </section>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 text-center">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary mx-auto mb-3">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Orders</p>
              <p className="text-xl font-black text-gray-900">{customer.ordersCount}</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 text-center">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-green-600 mx-auto mb-3">
                <Wallet className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Life Value</p>
              <p className="text-xl font-black text-gray-900">{formatCurrency(customer.totalSpent)}</p>
            </div>
          </div>

          {/* Detailed Info Groups */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 pb-2">Contact Information</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm font-bold text-gray-600">
                  <Mail className="w-4 h-4 text-gray-300" /> {customer.email}
                </div>
                <div className="flex items-center gap-4 text-sm font-bold text-gray-600">
                  <Phone className="w-4 h-4 text-gray-300" /> {customer.phone}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 pb-2">Last Known Address</h4>
              <div className="flex items-start gap-4 text-sm font-bold text-gray-600 leading-relaxed">
                <MapPin className="w-4 h-4 text-gray-300 mt-1 flex-shrink-0" />
                {customer.address}
              </div>
            </div>

            {/* Recent Orders List */}
            {customer.recentOrders && customer.recentOrders.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 pb-2">Recent Activity</h4>
                <div className="space-y-3">
                  {customer.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900">Order {formatShortOrderId(order.id)}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-[10px] font-bold text-gray-500">{order.date}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-sm font-black text-gray-900">{formatCurrency(order.total)}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Communication CTA */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleSendEmail}
              className="flex items-center justify-center gap-2 p-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all"
            >
              <Mail className="w-4 h-4" /> Send Email
            </button>
            <button
              onClick={handleSendWhatsApp}
              className="flex items-center justify-center gap-2 p-4 bg-green-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-green-700 transition-all"
            >
              <MessageSquare className="w-4 h-4" /> WhatsApp
            </button>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-8 border-t border-gray-100 flex gap-4">
           {customer.status === 'Active' ? (
             <button 
                onClick={() => onToggleStatus(customer.id, 'Blocked')}
                className="w-full flex items-center justify-center gap-3 p-4 border border-red-200 text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-50 transition-all"
             >
                <UserMinus className="w-4 h-4" /> Block Customer
             </button>
           ) : (
             <button 
                onClick={() => onToggleStatus(customer.id, 'Active')}
                className="w-full flex items-center justify-center gap-3 p-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-500/20"
             >
                <ShieldCheck className="w-4 h-4" /> Restore Access
             </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;
