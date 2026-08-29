import React, { useEffect, useRef, useState } from 'react';
import { Mail, MessageCircle, HelpCircle, ArrowRight, Loader2, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPublicSiteConfig, getPublicSiteConfigSnapshot } from '../services/siteConfigService';
import { getTenantConfigSnapshot } from '../services/tenantConfigService';
import { openWhatsAppChat, sendSupportTicket } from '../services/supportService';

interface HelpProps {
  onLoginClick: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  onNavigate: (view: any) => void;
}

const SUPPORT_PHONE_COUNTRY_CODES = [
  { code: '+880', label: 'Bangladesh (+880)' },
  { code: '+91', label: 'India (+91)' },
  { code: '+92', label: 'Pakistan (+92)' },
  { code: '+977', label: 'Nepal (+977)' },
  { code: '+94', label: 'Sri Lanka (+94)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+966', label: 'Saudi Arabia (+966)' },
  { code: '+974', label: 'Qatar (+974)' },
  { code: '+965', label: 'Kuwait (+965)' },
  { code: '+60', label: 'Malaysia (+60)' },
  { code: '+65', label: 'Singapore (+65)' },
  { code: '+66', label: 'Thailand (+66)' },
  { code: '+81', label: 'Japan (+81)' },
  { code: '+82', label: 'South Korea (+82)' },
  { code: '+86', label: 'China (+86)' },
  { code: '+1', label: 'USA/Canada (+1)' },
  { code: '+44', label: 'United Kingdom (+44)' },
  { code: '+49', label: 'Germany (+49)' },
  { code: '+33', label: 'France (+33)' },
  { code: '+39', label: 'Italy (+39)' },
  { code: '+34', label: 'Spain (+34)' },
  { code: '+31', label: 'Netherlands (+31)' },
  { code: '+61', label: 'Australia (+61)' },
  { code: '+64', label: 'New Zealand (+64)' }
] as const;

const DEFAULT_SUPPORT_COUNTRY_CODE = SUPPORT_PHONE_COUNTRY_CODES[0].code;

const normalizePhoneDigits = (value: string) => value.replace(/\D/g, '');

const normalizeLocalPhoneDigits = (value: string) => {
  const onlyDigits = normalizePhoneDigits(value);
  return onlyDigits.replace(/^0+/, '');
};

const parseStoredSupportPhone = (value: string): { countryCode: string; localNumber: string } => {
  const compact = value.replace(/\s+/g, '').trim();
  if (!compact) {
    return { countryCode: DEFAULT_SUPPORT_COUNTRY_CODE, localNumber: '' };
  }

  const withPlus = compact.startsWith('00') ? `+${compact.slice(2)}` : compact;
  if (withPlus.startsWith('+')) {
    const match = [...SUPPORT_PHONE_COUNTRY_CODES]
      .sort((a, b) => b.code.length - a.code.length)
      .find((entry) => withPlus.startsWith(entry.code));

    if (match) {
      return {
        countryCode: match.code,
        localNumber: normalizeLocalPhoneDigits(withPlus.slice(match.code.length))
      };
    }
  }

  return {
    countryCode: DEFAULT_SUPPORT_COUNTRY_CODE,
    localNumber: normalizeLocalPhoneDigits(withPlus)
  };
};

const Help: React.FC<HelpProps> = () => {
  const { user } = useAuth();
  const initialConfig = getPublicSiteConfigSnapshot();
  const tenantSnapshot = getTenantConfigSnapshot();
  const ticketFormRef = useRef<HTMLElement | null>(null);

  const [supportEmail, setSupportEmail] = useState(initialConfig.supportEmail || tenantSnapshot.supportEmail || 'support@example.com');
  const [whatsappNumber, setWhatsappNumber] = useState(initialConfig.whatsappNumber || tenantSnapshot.companyPhone || '');
  const [siteName, setSiteName] = useState(initialConfig.siteName || tenantSnapshot.brandName || 'Storefront');
  const [isCompactPhoneCode, setIsCompactPhoneCode] = useState(() => window.innerWidth < 480);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneCountryCode: DEFAULT_SUPPORT_COUNTRY_CODE,
    phoneNumber: '',
    subject: '',
    message: '',
    channel: 'web' as 'email' | 'whatsapp' | 'web'
  });

  useEffect(() => {
    let mounted = true;

    const loadConfig = async () => {
      try {
        const cfg = await getPublicSiteConfig();
        if (!mounted) return;
        setSupportEmail(cfg.supportEmail || tenantSnapshot.supportEmail || 'support@example.com');
        setWhatsappNumber(cfg.whatsappNumber || tenantSnapshot.companyPhone || '');
        setSiteName(cfg.siteName || tenantSnapshot.brandName || 'Storefront');
      } catch {
        // Keep defaults if settings fetch fails.
      }
    };

    loadConfig();
    const onUpdated = () => loadConfig();
    window.addEventListener('site-config-updated', onUpdated as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener('site-config-updated', onUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const parsedPhone = parseStoredSupportPhone(String(user.user_metadata?.phone || '').trim());

    setForm((prev) => ({
      ...prev,
      name: prev.name || String(user.user_metadata?.full_name || '').trim(),
      email: prev.email || user.email || '',
      phoneCountryCode: prev.phoneNumber ? prev.phoneCountryCode : parsedPhone.countryCode,
      phoneNumber: prev.phoneNumber || parsedPhone.localNumber
    }));
  }, [user]);

  useEffect(() => {
    const scrollToTicketSection = (behavior: ScrollBehavior = 'smooth') => {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash !== 'support-ticket' || !ticketFormRef.current) return;
      ticketFormRef.current.scrollIntoView({ behavior, block: 'start' });
    };

    const timer = window.setTimeout(() => scrollToTicketSection('auto'), 80);
    const onHashChange = () => scrollToTicketSection('smooth');
    window.addEventListener('hashchange', onHashChange);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      setIsCompactPhoneCode(window.innerWidth < 480);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);
    const rawPhoneDigits = normalizePhoneDigits(form.phoneNumber);
    const normalizedPhoneDigits = normalizeLocalPhoneDigits(form.phoneNumber);

    if (rawPhoneDigits && normalizedPhoneDigits.length < 6) {
      setNotice({ type: 'error', text: 'Please enter a valid phone number with country code.' });
      return;
    }
    if (form.channel === 'whatsapp' && !normalizedPhoneDigits) {
      setNotice({ type: 'error', text: 'Phone number is required for WhatsApp follow-up.' });
      return;
    }

    setSubmitting(true);

    const result = await sendSupportTicket({
      name: form.name,
      email: form.email,
      phone: normalizedPhoneDigits ? `${form.phoneCountryCode}${normalizedPhoneDigits}` : '',
      subject: form.subject,
      message: form.message,
      channel: form.channel
    });

    setSubmitting(false);
    if (!result.success) {
      setNotice({ type: 'error', text: result.message });
      return;
    }

    setNotice({ type: 'success', text: 'Support ticket submitted. Admin team will follow up soon.' });
    setForm((prev) => ({ ...prev, subject: '', message: '' }));
  };

  const handleWhatsAppClick = () => {
    openWhatsAppChat(whatsappNumber, `Hello ${siteName}, I need support for my order.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <main className="flex-grow">
        <section className="bg-gray-50 border-b border-gray-100 py-8 text-center px-4">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-sm mb-6">
            <HelpCircle className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Help & Support</h1>
          <p className="text-xl text-gray-500 font-medium">How can we assist you today?</p>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-500 mb-6 font-medium">Send us a detailed message.</p>
              <a href={`mailto:${supportEmail}`} className="text-sm sm:text-lg font-bold text-gray-900 hover:text-primary transition-colors flex items-center gap-2 break-all">
                {supportEmail} <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">WhatsApp Chat</h3>
              <p className="text-gray-500 mb-6 font-medium">Instant support for urgent queries.</p>
              <button
                onClick={handleWhatsAppClick}
                className="text-lg font-bold text-green-600 hover:text-green-700 transition-colors flex items-center gap-2"
              >
                {whatsappNumber} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <section ref={ticketFormRef} id="support-ticket" className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Create Support Ticket</h3>
              <p className="text-gray-500 font-medium">Submit your issue and it will appear in Admin Support Center.</p>
            </div>

            {notice && (
              <div
                className={`mb-5 rounded-xl px-4 py-3 text-sm font-semibold ${
                  notice.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {notice.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                className="h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold"
                required
              />
              <div className="space-y-1">
                <div className="flex gap-2">
                  <select
                    value={form.phoneCountryCode}
                    onChange={(e) => setForm((prev) => ({ ...prev, phoneCountryCode: e.target.value }))}
                    className="h-12 w-[118px] sm:w-52 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs sm:text-sm font-semibold"
                  >
                    {SUPPORT_PHONE_COUNTRY_CODES.map((entry) => (
                      <option key={entry.code} value={entry.code}>
                        {isCompactPhoneCode ? entry.code : entry.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="Phone number (optional)"
                    value={form.phoneNumber}
                    onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                    className="h-12 flex-1 min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3 sm:px-4 text-sm font-semibold"
                  />
                </div>
                <p className="text-[11px] font-medium text-gray-400 px-1">Default country code is Bangladesh (+880).</p>
              </div>
              <select
                value={form.channel}
                onChange={(e) => setForm((prev) => ({ ...prev, channel: e.target.value as 'email' | 'whatsapp' | 'web' }))}
                className="h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold"
              >
                <option value="web">Web Ticket</option>
                <option value="email">Email Follow-up</option>
                <option value="whatsapp">WhatsApp Follow-up</option>
              </select>
              <input
                type="text"
                placeholder="Subject"
                value={form.subject}
                onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                className="md:col-span-2 h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold"
                required
              />
              <textarea
                rows={5}
                placeholder="Describe your issue..."
                value={form.message}
                onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                className="md:col-span-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold"
                required
              />
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-primary text-white text-sm font-black uppercase tracking-wider hover:bg-red-700 disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Help;
