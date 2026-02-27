import { supabase } from '../lib/supabase';

export interface PublicSiteConfig {
  headerLogoLight: string;
  headerLogoDark: string;
  footerLogo: string;
  faviconUrl: string;
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
  currencyCode: string;
  currencyLocale: string;
  baseCurrencyCode: string;
  exchangeRateUsd: number; // Base currency units per 1 USD
  exchangeRateInr: number; // Base currency units per 1 INR
  allowGuestCheckout: boolean;
}

const DEFAULT_CONFIG: PublicSiteConfig = {
  headerLogoLight: '',
  headerLogoDark: '',
  footerLogo: '',
  faviconUrl: '',
  linkBarImageUrl: '',
  linkBarImageLink: '',
  siteName: 'NOKLITY',
  siteTagline: 'Premium Automotive Performance Parts',
  footerText: '© 2024 NOKLITY Automotive. All rights reserved.',
  supportEmail: 'support@noklity.com',
  supportPhone: '+1 (555) 123-4567',
  supportAddress: '123 Performance Blvd, Speedway City, CA 90210',
  whatsappNumber: '+15551234567',
  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  twitterUrl: '',
  currencyCode: 'BDT',
  currencyLocale: 'en-BD',
  baseCurrencyCode: 'BDT',
  exchangeRateUsd: 121.5,
  exchangeRateInr: 1.45,
  allowGuestCheckout: true
};

let cachedConfig: PublicSiteConfig | null = null;
let cacheUpdatedAt = 0;
const CACHE_TTL_MS = 60_000;

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback;
  return value === 'true';
};

export const getPublicSiteConfig = async (): Promise<PublicSiteConfig> => {
  if (cachedConfig && Date.now() - cacheUpdatedAt < CACHE_TTL_MS) {
    return cachedConfig;
  }

  const { data, error } = await supabase.from('site_settings').select('key,value');
  if (error || !data) {
    return cachedConfig || DEFAULT_CONFIG;
  }

  const map = new Map<string, string>();
  for (const row of data as Array<{ key: string; value: string }>) {
    map.set(row.key, row.value || '');
  }

  cachedConfig = {
    headerLogoLight: map.get('header_logo_light') || '',
    headerLogoDark: map.get('header_logo_dark') || '',
    footerLogo: map.get('footer_logo') || '',
    faviconUrl: map.get('favicon_url') || '',
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
    currencyCode: map.get('currency_code') || DEFAULT_CONFIG.currencyCode,
    currencyLocale: map.get('currency_locale') || DEFAULT_CONFIG.currencyLocale,
    baseCurrencyCode: map.get('base_currency_code') || DEFAULT_CONFIG.baseCurrencyCode,
    exchangeRateUsd: parseNumber(map.get('exchange_rate_usd'), DEFAULT_CONFIG.exchangeRateUsd),
    exchangeRateInr: parseNumber(map.get('exchange_rate_inr'), DEFAULT_CONFIG.exchangeRateInr),
    allowGuestCheckout: parseBoolean(map.get('allow_guest_checkout'), DEFAULT_CONFIG.allowGuestCheckout)
  };
  cacheUpdatedAt = Date.now();

  return cachedConfig;
};

export const clearPublicSiteConfigCache = () => {
  cachedConfig = null;
  cacheUpdatedAt = 0;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('site-config-updated'));
  }
};
