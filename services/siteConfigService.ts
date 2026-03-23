import tenantFileConfig from '../config/tenant.json';
import { supabase } from '../lib/supabase';
import { TenantConfig } from '../types/tenant';

export type ManagedPageSection = 'company' | 'legal';

export interface ManagedPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  section: ManagedPageSection;
  isEnabled: boolean;
  order: number;
}

export interface FooterShopLink {
  id: string;
  label: string;
  href: string;
  isEnabled: boolean;
  order: number;
}

export interface PublicSiteConfig {
  headerLogoLight: string;
  headerLogoDark: string;
  footerLogo: string;
  faviconUrl: string;
  siteUrl: string;
  siteUrlName: string;
  linkBarImageUrl: string;
  linkBarImageLink: string;
  siteName: string;
  siteTagline: string;
  footerText: string;
  supportEmail: string;
  supportPhone: string;
  supportAddress: string;
  whatsappNumber: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  twitterUrl: string;
  newsletterEnabled: boolean;
  newsletterBadgeText: string;
  newsletterTitle: string;
  newsletterDescription: string;
  newsletterInputPlaceholder: string;
  newsletterButtonText: string;
  newsletterBackgroundImageUrl: string;
  currencyCode: string;
  currencyLocale: string;
  baseCurrencyCode: string;
  exchangeRateUsd: number; // Base currency units per 1 USD
  exchangeRateInr: number; // Base currency units per 1 INR
  allowGuestCheckout: boolean;
  taxEnabled: boolean;
  defaultTaxRate: number;
  defaultShippingFee: number;
  invoicePrefix: string;
  companyAboutTitle: string;
  companyAboutContent: string;
  companyContactTitle: string;
  companyContactContent: string;
  companySupportTitle: string;
  companySupportContent: string;
  companyShippingPolicyTitle: string;
  companyShippingPolicyContent: string;
  companyReturnPolicyTitle: string;
  companyReturnPolicyContent: string;
  legalPrivacyPolicyTitle: string;
  legalPrivacyPolicyContent: string;
  legalTermsOfServiceTitle: string;
  legalTermsOfServiceContent: string;
  legalPaymentPolicyTitle: string;
  legalPaymentPolicyContent: string;
  legalRefundPolicyTitle: string;
  legalRefundPolicyContent: string;
  primaryColor: string;
  primaryHoverColor: string;
  accentColor: string;
  successColor: string;
  warningColor: string;
  dangerColor: string;
  backgroundColorLight: string;
  backgroundColorDark: string;
  surfaceColorLight: string;
  surfaceColorDark: string;
  textColorLight: string;
  textColorDark: string;
  mutedTextColorLight: string;
  mutedTextColorDark: string;
  borderColorLight: string;
  borderColorDark: string;
  borderRadiusPx: number;
  managedPages: ManagedPage[];
  shopLinks: FooterShopLink[];
}

const tenantDefaults = tenantFileConfig as TenantConfig;
const currentYear = new Date().getFullYear();
const defaultLocaleByCurrency: Record<string, string> = {
  BDT: 'en-BD',
  USD: 'en-US',
  INR: 'en-IN',
  EUR: 'en-IE',
  GBP: 'en-GB'
};

const DEFAULT_CONFIG: PublicSiteConfig = {
  headerLogoLight: '',
  headerLogoDark: '',
  footerLogo: '',
  faviconUrl: '',
  siteUrl: `https://${tenantDefaults.domain || 'localhost'}`,
  siteUrlName: tenantDefaults.domain || 'localhost',
  linkBarImageUrl: '',
  linkBarImageLink: '',
  siteName: tenantDefaults.brandName || 'Storefront',
  siteTagline: 'Premium Automotive Performance Parts',
  footerText: `© ${currentYear} ${tenantDefaults.companyName || tenantDefaults.brandName || 'Storefront'}. All rights reserved.`,
  supportEmail: tenantDefaults.supportEmail || 'support@example.com',
  supportPhone: tenantDefaults.companyPhone || '',
  supportAddress: tenantDefaults.companyAddress || '',
  whatsappNumber: '+15551234567',
  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  twitterUrl: '',
  newsletterEnabled: true,
  newsletterBadgeText: 'Exclusive Club',
  newsletterTitle: `Join the ${tenantDefaults.brandName || 'Store'} Club`,
  newsletterDescription: 'Get exclusive access to limited edition drops, installation guides, and 10% off your first order.',
  newsletterInputPlaceholder: 'Enter your email',
  newsletterButtonText: 'Join',
  newsletterBackgroundImageUrl: '',
  currencyCode: tenantDefaults.currency || 'USD',
  currencyLocale: defaultLocaleByCurrency[(tenantDefaults.currency || '').toUpperCase()] || 'en-US',
  baseCurrencyCode: tenantDefaults.currency || 'USD',
  exchangeRateUsd: 121.5,
  exchangeRateInr: 1.45,
  allowGuestCheckout: true,
  taxEnabled: false,
  defaultTaxRate: 0,
  defaultShippingFee: 15,
  invoicePrefix: 'INV',
  companyAboutTitle: 'About',
  companyAboutContent: `${tenantDefaults.brandName || 'Our store'} is a premium ecommerce platform focused on reliability and customer-first service.`,
  companyContactTitle: 'Contact',
  companyContactContent:
    'Need help? Contact us by email, phone, WhatsApp, or create a support ticket from the Help page.',
  companySupportTitle: 'Support',
  companySupportContent:
    'For technical issues, order updates, and account help, please use our support center. Our team responds as fast as possible.',
  companyShippingPolicyTitle: 'Shipping Policy',
  companyShippingPolicyContent:
    'Orders are processed after payment verification. Delivery time depends on location and shipping method.',
  companyReturnPolicyTitle: 'Return Policy',
  companyReturnPolicyContent:
    'Returns are accepted for eligible products in original condition within the allowed return window.',
  legalPrivacyPolicyTitle: 'Privacy Policy',
  legalPrivacyPolicyContent:
    'We collect only the data required to operate your account, process orders, and improve service quality.',
  legalTermsOfServiceTitle: 'Terms of Service',
  legalTermsOfServiceContent:
    'By using this website, you agree to follow our store policies, payment terms, and applicable local laws.',
  legalPaymentPolicyTitle: 'Payment Policy',
  legalPaymentPolicyContent:
    'Supported payment methods are managed from admin settings. Orders are confirmed after successful payment verification.',
  legalRefundPolicyTitle: 'Refund Policy',
  legalRefundPolicyContent:
    'Approved refunds are issued to the original payment channel within the applicable processing period.',
  primaryColor: '#e11d48',
  primaryHoverColor: '#be123c',
  accentColor: '#0f172a',
  successColor: '#16a34a',
  warningColor: '#f59e0b',
  dangerColor: '#dc2626',
  backgroundColorLight: '#ffffff',
  backgroundColorDark: '#0b1220',
  surfaceColorLight: '#ffffff',
  surfaceColorDark: '#111827',
  textColorLight: '#111827',
  textColorDark: '#e5e7eb',
  mutedTextColorLight: '#6b7280',
  mutedTextColorDark: '#94a3b8',
  borderColorLight: '#e5e7eb',
  borderColorDark: '#334155',
  borderRadiusPx: 12,
  managedPages: [],
  shopLinks: [
    { id: 'shop-performance', label: 'Performance Parts', href: '/search', isEnabled: true, order: 1 },
    { id: 'shop-brakes', label: 'Brakes & Suspension', href: '/search?category=Brakes', isEnabled: true, order: 2 },
    { id: 'shop-engine', label: 'Engine Components', href: '/search?category=Engine', isEnabled: true, order: 3 },
    { id: 'shop-electronics', label: 'Electronics', href: '/search?category=Electronics', isEnabled: true, order: 4 },
    { id: 'shop-flash', label: 'Flash Deals', href: '/#flash-sales', isEnabled: true, order: 5 }
  ]
};

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'page';

const createLegacyManagedPages = (config: Pick<
  PublicSiteConfig,
  | 'companyAboutTitle'
  | 'companyAboutContent'
  | 'companyContactTitle'
  | 'companyContactContent'
  | 'companySupportTitle'
  | 'companySupportContent'
  | 'companyShippingPolicyTitle'
  | 'companyShippingPolicyContent'
  | 'companyReturnPolicyTitle'
  | 'companyReturnPolicyContent'
  | 'legalPrivacyPolicyTitle'
  | 'legalPrivacyPolicyContent'
  | 'legalTermsOfServiceTitle'
  | 'legalTermsOfServiceContent'
  | 'legalPaymentPolicyTitle'
  | 'legalPaymentPolicyContent'
  | 'legalRefundPolicyTitle'
  | 'legalRefundPolicyContent'
>): ManagedPage[] => [
  {
    id: 'system-about',
    slug: 'about',
    title: config.companyAboutTitle,
    content: config.companyAboutContent,
    section: 'company',
    isEnabled: true,
    order: 1
  },
  {
    id: 'system-contact',
    slug: 'contact',
    title: config.companyContactTitle,
    content: config.companyContactContent,
    section: 'company',
    isEnabled: true,
    order: 2
  },
  {
    id: 'system-support',
    slug: 'support',
    title: config.companySupportTitle,
    content: config.companySupportContent,
    section: 'company',
    isEnabled: true,
    order: 3
  },
  {
    id: 'system-shipping-policy',
    slug: 'shipping-policy',
    title: config.companyShippingPolicyTitle,
    content: config.companyShippingPolicyContent,
    section: 'company',
    isEnabled: true,
    order: 4
  },
  {
    id: 'system-return-policy',
    slug: 'return-policy',
    title: config.companyReturnPolicyTitle,
    content: config.companyReturnPolicyContent,
    section: 'company',
    isEnabled: true,
    order: 5
  },
  {
    id: 'system-privacy-policy',
    slug: 'privacy-policy',
    title: config.legalPrivacyPolicyTitle,
    content: config.legalPrivacyPolicyContent,
    section: 'legal',
    isEnabled: true,
    order: 6
  },
  {
    id: 'system-terms-of-service',
    slug: 'terms-of-service',
    title: config.legalTermsOfServiceTitle,
    content: config.legalTermsOfServiceContent,
    section: 'legal',
    isEnabled: true,
    order: 7
  },
  {
    id: 'system-payment-policy',
    slug: 'payment-policy',
    title: config.legalPaymentPolicyTitle,
    content: config.legalPaymentPolicyContent,
    section: 'legal',
    isEnabled: true,
    order: 8
  },
  {
    id: 'system-refund-policy',
    slug: 'refund-policy',
    title: config.legalRefundPolicyTitle,
    content: config.legalRefundPolicyContent,
    section: 'legal',
    isEnabled: true,
    order: 9
  }
];

const normalizeManagedPages = (pages: ManagedPage[]) =>
  pages
    .map((page, index) => ({
      id: String(page.id || `page-${index + 1}`),
      slug: toSlug(page.slug || page.title || `page-${index + 1}`),
      title: String(page.title || 'Untitled Page'),
      content: String(page.content || ''),
      section: page.section === 'legal' ? 'legal' : 'company',
      isEnabled: page.isEnabled !== false,
      order: Number.isFinite(page.order) ? page.order : index + 1
    }))
    .sort((a, b) => a.order - b.order)
    .map((page, index) => ({ ...page, order: index + 1 }));

const normalizeShopLinks = (links: FooterShopLink[]) =>
  links
    .map((link, index) => ({
      id: String(link.id || `shop-link-${index + 1}`),
      label: String(link.label || 'Shop Link'),
      href: String(link.href || '/'),
      isEnabled: link.isEnabled !== false,
      order: Number.isFinite(link.order) ? link.order : index + 1
    }))
    .sort((a, b) => a.order - b.order)
    .map((link, index) => ({ ...link, order: index + 1 }));

const sanitizeManagedPages = (raw: unknown, fallback: ManagedPage[]) => {
  if (!raw) return fallback;

  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  if (!Array.isArray(parsed)) return fallback;
  const rows = parsed.map((item, index) => {
    const source = (item || {}) as Partial<ManagedPage>;
    return {
      id: String(source.id || `page-${index + 1}`),
      slug: String(source.slug || source.title || `page-${index + 1}`),
      title: String(source.title || 'Untitled Page'),
      content: String(source.content || ''),
      section: source.section === 'legal' ? 'legal' : 'company',
      isEnabled: source.isEnabled !== false,
      order: Number(source.order || index + 1)
    } satisfies ManagedPage;
  });
  return normalizeManagedPages(rows);
};

const sanitizeShopLinks = (raw: unknown, fallback: FooterShopLink[]) => {
  if (!raw) return fallback;

  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  if (!Array.isArray(parsed)) return fallback;
  const rows = parsed.map((item, index) => {
    const source = (item || {}) as Partial<FooterShopLink>;
    return {
      id: String(source.id || `shop-link-${index + 1}`),
      label: String(source.label || 'Shop Link'),
      href: String(source.href || '/'),
      isEnabled: source.isEnabled !== false,
      order: Number(source.order || index + 1)
    } satisfies FooterShopLink;
  });
  return normalizeShopLinks(rows);
};

DEFAULT_CONFIG.managedPages = createLegacyManagedPages(DEFAULT_CONFIG);
DEFAULT_CONFIG.shopLinks = normalizeShopLinks(DEFAULT_CONFIG.shopLinks);

let cachedConfig: PublicSiteConfig | null = null;
let cacheUpdatedAt = 0;
const CACHE_TTL_MS = 60_000;
const SITE_CONFIG_CACHE_KEY = 'noklity_public_site_config_v1';
const SITE_CONFIG_SIGNAL_KEY = 'noklity_public_site_config_signal_v1';
const SITE_CONFIG_CHANNEL_NAME = 'noklity_public_site_config_channel_v1';

const parsePositiveNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseNonNegativeNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback;
  return value === 'true';
};

const getUrlNameFromUrl = (siteUrl: string) => {
  try {
    const parsed = new URL(siteUrl);
    return parsed.host || siteUrl;
  } catch {
    return siteUrl
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .replace(/\/$/, '')
      .trim();
  }
};

const loadConfigFromStorage = (): PublicSiteConfig | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SITE_CONFIG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PublicSiteConfig>;
    const merged = {
      ...DEFAULT_CONFIG,
      ...parsed
    };
    return {
      ...merged,
      managedPages: sanitizeManagedPages(parsed.managedPages, DEFAULT_CONFIG.managedPages),
      shopLinks: sanitizeShopLinks(parsed.shopLinks, DEFAULT_CONFIG.shopLinks)
    };
  } catch {
    return null;
  }
};

const persistConfigToStorage = (config: PublicSiteConfig) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SITE_CONFIG_CACHE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage errors in private mode/quota limits.
  }
};

const broadcastPublicSiteConfigSignal = () => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(SITE_CONFIG_SIGNAL_KEY, String(Date.now()));
  } catch {
    // Ignore storage errors in private mode/quota limits.
  }

  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const channel = new BroadcastChannel(SITE_CONFIG_CHANNEL_NAME);
      channel.postMessage({ type: 'site-config-updated', at: Date.now() });
      channel.close();
    } catch {
      // Ignore BroadcastChannel failures and rely on storage/custom events.
    }
  }
};

export const getPublicSiteConfigSnapshot = (): PublicSiteConfig => {
  if (cachedConfig) return cachedConfig;
  const stored = loadConfigFromStorage();
  if (stored) {
    cachedConfig = stored;
    cacheUpdatedAt = 0;
    return stored;
  }
  return DEFAULT_CONFIG;
};

export const getPublicSiteConfig = async (): Promise<PublicSiteConfig> => {
  if (cachedConfig && Date.now() - cacheUpdatedAt < CACHE_TTL_MS) {
    return cachedConfig;
  }

  if (!cachedConfig) {
    const stored = loadConfigFromStorage();
    if (stored) {
      cachedConfig = stored;
      cacheUpdatedAt = 0;
    }
  }

  const { data, error } = await supabase.from('site_settings').select('key,value');
  if (error || !data) {
    return cachedConfig || loadConfigFromStorage() || DEFAULT_CONFIG;
  }

  const map = new Map<string, string>();
  for (const row of data as Array<{ key: string; value: string }>) {
    map.set(row.key, row.value || '');
  }

  const baseConfig: PublicSiteConfig = {
    headerLogoLight: map.get('header_logo_light') || '',
    headerLogoDark: map.get('header_logo_dark') || '',
    footerLogo: map.get('footer_logo') || '',
    faviconUrl: map.get('favicon_url') || '',
    siteUrl: map.get('site_url') || DEFAULT_CONFIG.siteUrl,
    siteUrlName: map.get('site_url_name') || getUrlNameFromUrl(map.get('site_url') || DEFAULT_CONFIG.siteUrl) || DEFAULT_CONFIG.siteUrlName,
    linkBarImageUrl: map.get('link_bar_image_url') || '',
    linkBarImageLink: map.get('link_bar_image_link') || '',
    siteName: map.get('site_name') || DEFAULT_CONFIG.siteName,
    siteTagline: map.get('site_tagline') || DEFAULT_CONFIG.siteTagline,
    footerText: map.get('footer_text') || DEFAULT_CONFIG.footerText,
    supportEmail: map.get('support_email') || DEFAULT_CONFIG.supportEmail,
    supportPhone: map.get('support_phone') || DEFAULT_CONFIG.supportPhone,
    supportAddress: map.get('support_address') || DEFAULT_CONFIG.supportAddress,
    whatsappNumber: map.get('whatsapp_number') || DEFAULT_CONFIG.whatsappNumber,
    facebookUrl: map.get('facebook_url') || DEFAULT_CONFIG.facebookUrl,
    instagramUrl: map.get('instagram_url') || DEFAULT_CONFIG.instagramUrl,
    youtubeUrl: map.get('youtube_url') || DEFAULT_CONFIG.youtubeUrl,
    twitterUrl: map.get('twitter_url') || DEFAULT_CONFIG.twitterUrl,
    newsletterEnabled: parseBoolean(map.get('newsletter_enabled'), DEFAULT_CONFIG.newsletterEnabled),
    newsletterBadgeText: map.get('newsletter_badge_text') || DEFAULT_CONFIG.newsletterBadgeText,
    newsletterTitle: map.get('newsletter_title') || DEFAULT_CONFIG.newsletterTitle,
    newsletterDescription: map.get('newsletter_description') || DEFAULT_CONFIG.newsletterDescription,
    newsletterInputPlaceholder: map.get('newsletter_input_placeholder') || DEFAULT_CONFIG.newsletterInputPlaceholder,
    newsletterButtonText: map.get('newsletter_button_text') || DEFAULT_CONFIG.newsletterButtonText,
    newsletterBackgroundImageUrl: map.get('newsletter_background_image_url') || DEFAULT_CONFIG.newsletterBackgroundImageUrl,
    currencyCode: map.get('currency_code') || DEFAULT_CONFIG.currencyCode,
    currencyLocale: map.get('currency_locale') || DEFAULT_CONFIG.currencyLocale,
    baseCurrencyCode: map.get('base_currency_code') || DEFAULT_CONFIG.baseCurrencyCode,
    exchangeRateUsd: parsePositiveNumber(map.get('exchange_rate_usd'), DEFAULT_CONFIG.exchangeRateUsd),
    exchangeRateInr: parsePositiveNumber(map.get('exchange_rate_inr'), DEFAULT_CONFIG.exchangeRateInr),
    allowGuestCheckout: parseBoolean(map.get('allow_guest_checkout'), DEFAULT_CONFIG.allowGuestCheckout),
    taxEnabled: false,
    defaultTaxRate: 0,
    defaultShippingFee: parseNonNegativeNumber(map.get('default_shipping_fee'), DEFAULT_CONFIG.defaultShippingFee),
    invoicePrefix: map.get('invoice_prefix') || DEFAULT_CONFIG.invoicePrefix,
    companyAboutTitle: map.get('company_about_title') || DEFAULT_CONFIG.companyAboutTitle,
    companyAboutContent: map.get('company_about_content') || DEFAULT_CONFIG.companyAboutContent,
    companyContactTitle: map.get('company_contact_title') || DEFAULT_CONFIG.companyContactTitle,
    companyContactContent: map.get('company_contact_content') || DEFAULT_CONFIG.companyContactContent,
    companySupportTitle: map.get('company_support_title') || DEFAULT_CONFIG.companySupportTitle,
    companySupportContent: map.get('company_support_content') || DEFAULT_CONFIG.companySupportContent,
    companyShippingPolicyTitle: map.get('company_shipping_policy_title') || DEFAULT_CONFIG.companyShippingPolicyTitle,
    companyShippingPolicyContent: map.get('company_shipping_policy_content') || DEFAULT_CONFIG.companyShippingPolicyContent,
    companyReturnPolicyTitle: map.get('company_return_policy_title') || DEFAULT_CONFIG.companyReturnPolicyTitle,
    companyReturnPolicyContent: map.get('company_return_policy_content') || DEFAULT_CONFIG.companyReturnPolicyContent,
    legalPrivacyPolicyTitle: map.get('legal_privacy_policy_title') || DEFAULT_CONFIG.legalPrivacyPolicyTitle,
    legalPrivacyPolicyContent: map.get('legal_privacy_policy_content') || DEFAULT_CONFIG.legalPrivacyPolicyContent,
    legalTermsOfServiceTitle: map.get('legal_terms_of_service_title') || DEFAULT_CONFIG.legalTermsOfServiceTitle,
    legalTermsOfServiceContent: map.get('legal_terms_of_service_content') || DEFAULT_CONFIG.legalTermsOfServiceContent,
    legalPaymentPolicyTitle: map.get('legal_payment_policy_title') || DEFAULT_CONFIG.legalPaymentPolicyTitle,
    legalPaymentPolicyContent: map.get('legal_payment_policy_content') || DEFAULT_CONFIG.legalPaymentPolicyContent,
    legalRefundPolicyTitle: map.get('legal_refund_policy_title') || DEFAULT_CONFIG.legalRefundPolicyTitle,
    legalRefundPolicyContent: map.get('legal_refund_policy_content') || DEFAULT_CONFIG.legalRefundPolicyContent,
    primaryColor: map.get('primary_color') || DEFAULT_CONFIG.primaryColor,
    primaryHoverColor: map.get('primary_hover_color') || DEFAULT_CONFIG.primaryHoverColor,
    accentColor: map.get('accent_color') || DEFAULT_CONFIG.accentColor,
    successColor: map.get('success_color') || DEFAULT_CONFIG.successColor,
    warningColor: map.get('warning_color') || DEFAULT_CONFIG.warningColor,
    dangerColor: map.get('danger_color') || DEFAULT_CONFIG.dangerColor,
    backgroundColorLight: map.get('background_color_light') || DEFAULT_CONFIG.backgroundColorLight,
    backgroundColorDark: map.get('background_color_dark') || DEFAULT_CONFIG.backgroundColorDark,
    surfaceColorLight: map.get('surface_color_light') || DEFAULT_CONFIG.surfaceColorLight,
    surfaceColorDark: map.get('surface_color_dark') || DEFAULT_CONFIG.surfaceColorDark,
    textColorLight: map.get('text_color_light') || DEFAULT_CONFIG.textColorLight,
    textColorDark: map.get('text_color_dark') || DEFAULT_CONFIG.textColorDark,
    mutedTextColorLight: map.get('muted_text_color_light') || DEFAULT_CONFIG.mutedTextColorLight,
    mutedTextColorDark: map.get('muted_text_color_dark') || DEFAULT_CONFIG.mutedTextColorDark,
    borderColorLight: map.get('border_color_light') || DEFAULT_CONFIG.borderColorLight,
    borderColorDark: map.get('border_color_dark') || DEFAULT_CONFIG.borderColorDark,
    borderRadiusPx: parseNonNegativeNumber(map.get('border_radius_px'), DEFAULT_CONFIG.borderRadiusPx),
    managedPages: [],
    shopLinks: []
  };

  const fallbackManagedPages = createLegacyManagedPages(baseConfig);
  baseConfig.managedPages = sanitizeManagedPages(map.get('managed_pages'), fallbackManagedPages);
  baseConfig.shopLinks = sanitizeShopLinks(map.get('footer_shop_links'), DEFAULT_CONFIG.shopLinks);
  cachedConfig = baseConfig;
  cacheUpdatedAt = Date.now();
  persistConfigToStorage(cachedConfig);

  return cachedConfig;
};

export const subscribeToPublicSiteConfigSignals = (callback: () => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === SITE_CONFIG_SIGNAL_KEY) {
      callback();
    }
  };

  window.addEventListener('storage', handleStorage);

  let channel: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      channel = new BroadcastChannel(SITE_CONFIG_CHANNEL_NAME);
      channel.onmessage = () => callback();
    } catch {
      channel = null;
    }
  }

  return () => {
    window.removeEventListener('storage', handleStorage);
    if (channel) {
      channel.close();
    }
  };
};

export const clearPublicSiteConfigCache = (options?: { broadcast?: boolean }) => {
  cachedConfig = null;
  cacheUpdatedAt = 0;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(SITE_CONFIG_CACHE_KEY);
    } catch {
      // Ignore storage errors.
    }
  }
  if (options?.broadcast !== false) {
    broadcastPublicSiteConfigSignal();
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('site-config-updated'));
    window.dispatchEvent(new CustomEvent('tenant-config-updated'));
  }
};
