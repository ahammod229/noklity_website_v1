import React, { useEffect, useMemo, useState } from 'react';
import { Mail, MessageCircle, Clock, CheckCircle, AlertCircle, Loader2, Save, Send, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getPublicSiteConfigSnapshot } from '../../services/siteConfigService';
import { getTenantConfigSnapshot } from '../../services/tenantConfigService';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  channel: 'email' | 'whatsapp' | 'web';
  subject: string;
  message: string;
  created_at: string;
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  admin_note?: string | null;
}

const SupportManager: React.FC = () => {
  const [tickets, setTickets] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const config = getPublicSiteConfigSnapshot();
  const tenantConfig = getTenantConfigSnapshot();

  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching tickets:', error);
      alert('Failed to load support tickets');
    } else {
      setTickets((data || []) as Inquiry[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const summary = useMemo(() => {
    return {
      pending: tickets.filter((t) => t.status === 'Pending').length,
      inProgress: tickets.filter((t) => t.status === 'In Progress').length,
      resolved: tickets.filter((t) => t.status === 'Resolved').length
    };
  }, [tickets]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <AlertCircle className="w-3 h-3 mr-1" />;
      case 'In Progress': return <Clock className="w-3 h-3 mr-1" />;
      case 'Resolved': return <CheckCircle className="w-3 h-3 mr-1" />;
      default: return null;
    }
  };

  const updateTicket = async (ticketId: string, updates: Partial<Inquiry>) => {
    setSavingId(ticketId);
    const { error } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', ticketId);

    setSavingId(null);
    if (error) {
      alert(error.message || 'Failed to update ticket');
      return;
    }

    setTickets((prev) => prev.map((ticket) => (
      ticket.id === ticketId ? { ...ticket, ...updates } : ticket
    )));
  };

  const sanitizeWhatsAppPhone = (phone?: string | null) => {
    if (!phone) return '';
    const cleaned = phone.replace(/[^\d+]/g, '').trim();
    if (!cleaned) return '';
    if (cleaned.startsWith('+')) return cleaned.slice(1);
    if (cleaned.startsWith('00')) return cleaned.slice(2);
    return cleaned;
  };

  const buildSupportMessage = (ticket: Inquiry) => {
    const note = (ticket.admin_note || '').trim();
    return [
      `Hello ${ticket.name},`,
      '',
      `This is ${(config.siteName || tenantConfig.brandName || 'Storefront')} support.`,
      '',
      `Ticket Subject: ${ticket.subject}`,
      `Your Message: ${ticket.message}`,
      '',
      note ? `Support Reply: ${note}` : 'Support Reply: We are working on your issue and will update you shortly.',
      '',
      'Thank you.'
    ].join('\n');
  };

  const markInProgressAfterContact = (ticket: Inquiry) => {
    if (ticket.status === 'Pending') {
      void updateTicket(ticket.id, { status: 'In Progress' });
    }
  };

  const handleSendEmail = (ticket: Inquiry) => {
    const email = (ticket.email || '').trim();
    if (!email || !email.includes('@')) {
      setActionMessage({ type: 'error', text: `Ticket ${ticket.id.slice(0, 8)} has no valid email address.` });
      return;
    }

    const subject = `${config.siteName || tenantConfig.brandName || 'Storefront'} Support Update • ${ticket.subject}`;
    const body = buildSupportMessage(ticket);
    const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setActionMessage({ type: 'success', text: `Email composer opened for ${ticket.name}.` });
    markInProgressAfterContact(ticket);
  };

  const handleSendWhatsApp = (ticket: Inquiry) => {
    const phone = sanitizeWhatsAppPhone(ticket.phone);
    if (!phone) {
      setActionMessage({ type: 'error', text: `Ticket ${ticket.id.slice(0, 8)} has no valid WhatsApp number.` });
      return;
    }

    const text = buildSupportMessage(ticket);
    const waUrl = `https://wa.me/${encodeURIComponent(phone)}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setActionMessage({ type: 'success', text: `WhatsApp chat opened for ${ticket.name}.` });
    markInProgressAfterContact(ticket);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Support Center</h2>
          <p className="text-gray-500 text-sm">Manage and respond to customer support tickets</p>
        </div>
        <button
          onClick={fetchTickets}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold bg-white hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {actionMessage && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${
          actionMessage.type === 'error'
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {actionMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Pending</p>
          <p className="text-2xl font-black text-yellow-600">{summary.pending}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">In Progress</p>
          <p className="text-2xl font-black text-blue-600">{summary.inProgress}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Resolved</p>
          <p className="text-2xl font-black text-green-600">{summary.resolved}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-900">Recent Tickets</h3>
        </div>

        {loading ? (
          <div className="p-16 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-medium">No tickets found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Method</th>
                  <th className="px-6 py-3 font-medium">Message</th>
                  <th className="px-6 py-3 font-medium">Priority</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Admin Note</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{ticket.name}</span>
                        <span className="text-xs text-gray-500">{ticket.email}</span>
                        {ticket.phone && <span className="text-xs text-gray-400">{ticket.phone}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-700 font-medium capitalize">
                        {ticket.channel === 'email' ? <Mail className="w-4 h-4 text-gray-400" /> : <MessageCircle className="w-4 h-4 text-green-500" />}
                        {ticket.channel}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-sm">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 truncate" title={ticket.subject}>{ticket.subject}</span>
                        <span className="text-xs text-gray-500 truncate" title={ticket.message}>{ticket.message}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={ticket.priority}
                        onChange={(e) => updateTicket(ticket.id, { priority: e.target.value as Inquiry['priority'] })}
                        className="px-2 py-1 rounded-lg border border-gray-200 text-xs font-bold"
                      >
                        <option>Low</option>
                        <option>Normal</option>
                        <option>High</option>
                        <option>Urgent</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(ticket.status)}`}>
                          {getStatusIcon(ticket.status)}
                          {ticket.status}
                        </span>
                        <select
                          value={ticket.status}
                          onChange={(e) => updateTicket(ticket.id, { status: e.target.value as Inquiry['status'] })}
                          className="px-2 py-1 rounded-lg border border-gray-200 text-xs font-bold"
                        >
                          <option>Pending</option>
                          <option>In Progress</option>
                          <option>Resolved</option>
                          <option>Closed</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 min-w-[260px]">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          defaultValue={ticket.admin_note || ''}
                          onBlur={(e) => updateTicket(ticket.id, { admin_note: e.target.value })}
                          className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg"
                          placeholder="Add note"
                        />
                        <button
                          disabled={savingId === ticket.id}
                          className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600"
                          title="Saved on blur"
                        >
                          {savingId === ticket.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 min-w-[220px]">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSendEmail(ticket)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-black text-gray-700 hover:bg-gray-50"
                          title="Send support reply by email"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Email
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendWhatsApp(ticket)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-green-200 bg-green-50 text-xs font-black text-green-700 hover:bg-green-100"
                          title="Send support reply by WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          WhatsApp
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportManager;
