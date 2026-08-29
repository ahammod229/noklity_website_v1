import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, Sparkles, Upload, Wand2, Image as ImageIcon, Save, HelpCircle } from 'lucide-react';
import tenantFileConfig from '../../config/tenant.json';
import { supabase, uploadFile } from '../../lib/supabase';
import { clearPublicSiteConfigCache } from '../../services/siteConfigService';
import { clearTenantConfigCache } from '../../services/tenantConfigService';
import { useAuth } from '../../contexts/AuthContext';
import { isSuperAdminEmail } from '../../services/adminAccessService';
import {
  ADMIN_IMAGE_GUIDES,
  formatImageGuideHint,
  validateImageAgainstGuide,
  type ImageGuide
} from '../../utils/adminImageGuides';
import { optimizeImageByGuide } from '../../utils/imageOptimization';
import { TenantConfig } from '../../types/tenant';
import {
  normalizePlanName,
  PLAN_FEATURE_MATRIX,
  resolveEffectiveFeatureFlags
} from '../../services/tenantFeatureService';
import { applyAppearanceSettings, toAppearanceFromRawSettings } from '../../services/appearanceService';

type SettingsTab =
  | 'general'
  | 'header'
  | 'footer'
  | 'pages'
  | 'users'
  | 'security'
  | 'notifications'
  | 'billing'
  | 'api'
  | 'backup'
  | 'system'
  | 'logs'
  | 'advanced'
  | 'appearance';

type FieldType = 'text' | 'email' | 'number' | 'textarea' | 'select' | 'switch' | 'color';

interface SettingField {
  key: string;
  label: string;
  type: FieldType;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  helper?: string;
}

interface TabConfig {
  id: SettingsTab;
  label: string;
  fields: SettingField[];
}

interface SettingsGroup {
  title: string;
  description: string;
  fields: string[];
}

type ManagedPageSection = 'company' | 'legal';

interface ManagedPageItem {
  id: string;
  slug: string;
  title: string;
  content: string;
  section: ManagedPageSection;
  isEnabled: boolean;
  order: number;
}

interface FooterShopLinkItem {
  id: string;
  label: string;
  href: string;
  isEnabled: boolean;
  order: number;
}

const MANAGED_PAGE_SYNC_MAP: Record<string, { titleKey: string; contentKey: string; section: ManagedPageSection }> = {
  about: { titleKey: 'company_about_title', contentKey: 'company_about_content', section: 'company' },
  contact: { titleKey: 'company_contact_title', contentKey: 'company_contact_content', section: 'company' },
  support: { titleKey: 'company_support_title', contentKey: 'company_support_content', section: 'company' },
  'shipping-policy': {
    titleKey: 'company_shipping_policy_title',
    contentKey: 'company_shipping_policy_content',
    section: 'company'
  },
  'return-policy': { titleKey: 'company_return_policy_title', contentKey: 'company_return_policy_content', section: 'company' },
  'privacy-policy': { titleKey: 'legal_privacy_policy_title', contentKey: 'legal_privacy_policy_content', section: 'legal' },
  'terms-of-service': {
    titleKey: 'legal_terms_of_service_title',
    contentKey: 'legal_terms_of_service_content',
    section: 'legal'
  },
  'payment-policy': { titleKey: 'legal_payment_policy_title', contentKey: 'legal_payment_policy_content', section: 'legal' },
  'refund-policy': { titleKey: 'legal_refund_policy_title', contentKey: 'legal_refund_policy_content', section: 'legal' }
};

const DEFAULT_SHOP_LINKS: FooterShopLinkItem[] = [
  { id: 'shop-performance', label: 'Performance Parts', href: '/search', isEnabled: true, order: 1 },
  { id: 'shop-brakes', label: 'Brakes & Suspension', href: '/search?category=Brakes', isEnabled: true, order: 2 },
  { id: 'shop-engine', label: 'Engine Components', href: '/search?category=Engine', isEnabled: true, order: 3 },
  { id: 'shop-electronics', label: 'Electronics', href: '/search?category=Electronics', isEnabled: true, order: 4 },
  { id: 'shop-flash', label: 'Flash Deals', href: '/#flash-sales', isEnabled: true, order: 5 }
];

const TABS: TabConfig[] = [
  {
    id: 'general',
    label: 'General',
    fields: [
      { key: 'newsletter_enabled', label: 'Enable Newsletter Section', type: 'switch' },
      { key: 'newsletter_badge_text', label: 'Newsletter Badge Text', type: 'text', placeholder: 'Exclusive Club' },
      { key: 'newsletter_title', label: 'Newsletter Title', type: 'text', placeholder: 'Join the Noklity Club' },
      { key: 'newsletter_description', label: 'Newsletter Description', type: 'textarea', placeholder: 'Get exclusive access...' },
      { key: 'newsletter_input_placeholder', label: 'Newsletter Input Placeholder', type: 'text', placeholder: 'Enter your email' },
      { key: 'newsletter_button_text', label: 'Newsletter Button Text', type: 'text', placeholder: 'Join' },
      { key: 'newsletter_background_image_url', label: 'Newsletter Background Image', type: 'text' },
      { key: 'support_email', label: 'Contact Email', type: 'email' },
      { key: 'support_phone', label: 'Support Phone', type: 'text' },
      { key: 'support_address', label: 'Support Address', type: 'textarea' },
      { key: 'whatsapp_number', label: 'WhatsApp Number', type: 'text' },
      {
        key: 'currency_code',
        label: 'Currency',
        type: 'select',
        options: [
          { label: 'BDT (Taka)', value: 'BDT' },
          { label: 'USD (Dollar)', value: 'USD' },
          { label: 'INR (Rupee)', value: 'INR' }
        ]
      },
      {
        key: 'base_currency_code',
        label: 'Base Currency (Product prices are stored in this)',
        type: 'select',
        options: [
          { label: 'BDT (Taka)', value: 'BDT' },
          { label: 'USD (Dollar)', value: 'USD' },
          { label: 'INR (Rupee)', value: 'INR' }
        ]
      },
      {
        key: 'exchange_rate_usd',
        label: 'Exchange Rate USD',
        type: 'number',
        helper: 'How many base-currency units equal 1 USD'
      },
      {
        key: 'exchange_rate_inr',
        label: 'Exchange Rate INR',
        type: 'number',
        helper: 'How many base-currency units equal 1 INR'
      }
    ]
  },
  {
    id: 'header',
    label: 'Header',
    fields: [
      { key: 'site_name', label: 'Site Name', type: 'text' },
      {
        key: 'site_url_name',
        label: 'URL Name',
        type: 'text',
        placeholder: 'shop.noklity.com',
        helper: 'Short URL label for storefront and branding display'
      },
      { key: 'site_url', label: 'Site URL', type: 'text', placeholder: 'https://shop.noklity.com' },
      { key: 'site_tagline', label: 'Site Tagline', type: 'textarea' },
      { key: 'header_logo_light', label: 'Header Logo (Light)', type: 'text' },
      { key: 'header_logo_dark', label: 'Header Logo (Dark)', type: 'text' },
      { key: 'favicon_url', label: 'Favicon', type: 'text' }
    ]
  },
  {
    id: 'footer',
    label: 'Footer',
    fields: [
      { key: 'footer_text', label: 'Footer Text', type: 'text' },
      { key: 'footer_logo', label: 'Footer Logo', type: 'text' },
      { key: 'facebook_url', label: 'Facebook URL', type: 'text', placeholder: 'https://facebook.com/your-page' },
      { key: 'instagram_url', label: 'Instagram URL', type: 'text', placeholder: 'https://instagram.com/your-page' },
      { key: 'youtube_url', label: 'YouTube URL', type: 'text', placeholder: 'https://youtube.com/your-channel' },
      { key: 'twitter_url', label: 'Twitter/X URL', type: 'text', placeholder: 'https://x.com/your-handle' },
      { key: 'link_bar_image_url', label: 'Link Bar Image', type: 'text' },
      { key: 'link_bar_image_link', label: 'Link Bar Image URL Target', type: 'text', placeholder: 'https://your-target-link.com' }
    ]
  },
  {
    id: 'pages',
    label: 'Company & Legal Pages',
    fields: []
  },
  {
    id: 'users',
    label: 'Users & Roles',
    fields: [
      { key: 'allow_self_signup', label: 'Allow self sign-up', type: 'switch' },
      { key: 'require_email_verification', label: 'Require email verification', type: 'switch' },
      { key: 'allow_guest_checkout', label: 'Allow guest checkout', type: 'switch' },
      {
        key: 'default_user_role',
        label: 'Default role for new users',
        type: 'select',
        options: [
          { label: 'User', value: 'user' },
          { label: 'Customer', value: 'customer' }
        ]
      }
    ]
  },
  {
    id: 'security',
    label: 'Security',
    fields: [
      { key: 'admin_2fa_required', label: 'Require 2FA for admin accounts', type: 'switch' },
      { key: 'enforce_strong_password', label: 'Enforce strong passwords', type: 'switch' },
      { key: 'password_min_length', label: 'Minimum password length', type: 'number' },
      { key: 'session_timeout_minutes', label: 'Session timeout (minutes)', type: 'number' },
      { key: 'max_login_attempts', label: 'Max failed login attempts', type: 'number' }
    ]
  },
  {
    id: 'notifications',
    label: 'Notifications',
    fields: [
      { key: 'notification_email', label: 'Admin notification email', type: 'email' },
      { key: 'notify_new_order', label: 'Notify on new order', type: 'switch' },
      { key: 'notify_payment_update', label: 'Notify on payment update', type: 'switch' },
      { key: 'notify_new_customer', label: 'Notify on new customer', type: 'switch' },
      { key: 'notify_support_ticket', label: 'Notify on support ticket', type: 'switch' }
    ]
  },
  {
    id: 'billing',
    label: 'Payment & Billing',
    fields: [
      { key: 'default_shipping_fee', label: 'Default shipping fee (base currency)', type: 'number' },
      { key: 'invoice_prefix', label: 'Invoice prefix', type: 'text' },
      { key: 'payment_auto_confirm', label: 'Auto-confirm digital payments', type: 'switch' }
    ]
  },
  {
    id: 'api',
    label: 'API & Integration',
    fields: [
      { key: 'public_api_enabled', label: 'Enable public API', type: 'switch' },
      { key: 'enable_cors', label: 'Enable CORS', type: 'switch' },
      { key: 'api_rate_limit_per_minute', label: 'API rate limit / minute', type: 'number' },
      { key: 'webhook_url', label: 'Webhook URL', type: 'text', placeholder: 'https://example.com/webhook' }
    ]
  },
  {
    id: 'backup',
    label: 'Backup & Restore',
    fields: [
      { key: 'auto_backup_enabled', label: 'Enable automatic backups', type: 'switch' },
      {
        key: 'backup_frequency',
        label: 'Backup frequency',
        type: 'select',
        options: [
          { label: 'Daily', value: 'daily' },
          { label: 'Weekly', value: 'weekly' },
          { label: 'Monthly', value: 'monthly' }
        ]
      },
      { key: 'backup_retention_days', label: 'Backup retention (days)', type: 'number' }
    ]
  },
  {
    id: 'system',
    label: 'System Preferences',
    fields: [
      {
        key: 'timezone',
        label: 'Timezone',
        type: 'select',
        options: [
          { label: 'Asia/Dhaka', value: 'Asia/Dhaka' },
          { label: 'UTC', value: 'UTC' },
          { label: 'America/New_York', value: 'America/New_York' }
        ]
      },
      {
        key: 'date_format',
        label: 'Date format',
        type: 'select',
        options: [
          { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
          { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
          { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' }
        ]
      },
      { key: 'maintenance_mode', label: 'Maintenance mode', type: 'switch' },
      { key: 'maintenance_message', label: 'Maintenance message', type: 'textarea' }
    ]
  },
  {
    id: 'logs',
    label: 'Audit Logs',
    fields: []
  },
  {
    id: 'advanced',
    label: 'Advanced',
    fields: [
      { key: 'custom_head_script', label: 'Custom <head> script', type: 'textarea' },
      { key: 'custom_footer_script', label: 'Custom footer script', type: 'textarea' }
    ]
  },
  {
    id: 'appearance',
    label: 'Appearance',
    fields: [
      { key: 'primary_color', label: 'Primary color', type: 'color', helper: 'Main brand buttons, active states, highlights' },
      { key: 'primary_hover_color', label: 'Primary hover color', type: 'color', helper: 'Hover color for primary buttons' },
      { key: 'accent_color', label: 'Accent color', type: 'color', helper: 'Secondary brand tone for premium sections' },
      { key: 'success_color', label: 'Success color', type: 'color' },
      { key: 'warning_color', label: 'Warning color', type: 'color' },
      { key: 'danger_color', label: 'Danger color', type: 'color' },
      { key: 'background_color_light', label: 'Light mode background', type: 'color' },
      { key: 'background_color_dark', label: 'Dark mode background', type: 'color' },
      { key: 'surface_color_light', label: 'Light mode card surface', type: 'color' },
      { key: 'surface_color_dark', label: 'Dark mode card surface', type: 'color' },
      { key: 'text_color_light', label: 'Light mode main text', type: 'color' },
      { key: 'text_color_dark', label: 'Dark mode main text', type: 'color' },
      { key: 'muted_text_color_light', label: 'Light mode muted text', type: 'color' },
      { key: 'muted_text_color_dark', label: 'Dark mode muted text', type: 'color' },
      { key: 'border_color_light', label: 'Light mode border color', type: 'color' },
      { key: 'border_color_dark', label: 'Dark mode border color', type: 'color' },
      { key: 'border_radius_px', label: 'Border radius (px)', type: 'number' },
      { key: 'compact_sidebar', label: 'Use compact sidebar', type: 'switch' }
    ]
  }
];

const tenantDefaults = tenantFileConfig as TenantConfig;
const defaultSiteName = tenantDefaults.brandName || 'Storefront';
const defaultDomain = tenantDefaults.domain || 'localhost';
const defaultSiteUrl = `https://${defaultDomain}`;
const defaultSupportEmail = tenantDefaults.supportEmail || 'support@example.com';
const defaultCompanyName = tenantDefaults.companyName || defaultSiteName;
const defaultCompanyAddress = tenantDefaults.companyAddress || '';
const defaultCompanyPhone = tenantDefaults.companyPhone || '';
const defaultCurrency = (tenantDefaults.currency || 'USD').toUpperCase();
const defaultCurrencyLocaleMap: Record<string, string> = {
  BDT: 'en-BD',
  USD: 'en-US',
  INR: 'en-IN'
};
const currentYear = new Date().getFullYear();

const DEFAULT_VALUES: Record<string, string> = {
  site_name: defaultSiteName,
  site_url_name: defaultDomain,
  site_url: defaultSiteUrl,
  newsletter_enabled: 'true',
  newsletter_badge_text: 'Exclusive Club',
  newsletter_title: `Join the ${defaultSiteName} Club`,
  newsletter_description: 'Get exclusive access to limited edition drops, installation guides, and 10% off your first order.',
  newsletter_input_placeholder: 'Enter your email',
  newsletter_button_text: 'Join',
  newsletter_background_image_url: '',
  support_email: defaultSupportEmail,
  support_phone: defaultCompanyPhone,
  support_address: defaultCompanyAddress,
  site_tagline: 'Premium Automotive Performance Parts',
  footer_text: `© ${currentYear} ${defaultCompanyName}. All rights reserved.`,
  whatsapp_number: '+15551234567',
  facebook_url: '',
  instagram_url: '',
  youtube_url: '',
  twitter_url: '',
  link_bar_image_url: '',
  link_bar_image_link: '',
  header_logo_light: '',
  header_logo_dark: '',
  footer_logo: '',
  favicon_url: '',
  tenant_brand_name: defaultSiteName,
  tenant_brand_logo_url: '',
  tenant_primary_color: tenantDefaults.primaryColor || '#e11d48',
  tenant_secondary_color: tenantDefaults.secondaryColor || '#0f172a',
  tenant_support_email: defaultSupportEmail,
  tenant_company_name: defaultCompanyName,
  tenant_company_address: defaultCompanyAddress,
  tenant_company_phone: defaultCompanyPhone,
  tenant_domain: defaultDomain,
  tenant_allowed_hosts: Array.isArray(tenantDefaults.allowedHosts) ? tenantDefaults.allowedHosts.join(',') : 'localhost,127.0.0.1',
  tenant_timezone: tenantDefaults.timezone || 'UTC',
  tenant_currency: defaultCurrency,
  tenant_plan_name: tenantDefaults.planName || 'Enterprise',
  tenant_feature_flags: JSON.stringify(
    resolveEffectiveFeatureFlags(
      normalizePlanName(tenantDefaults.planName || 'Enterprise'),
      tenantDefaults.featureFlags || {}
    )
  ),
  tenant_license_key: tenantDefaults.licenseKey || '',
  tenant_license_status: tenantDefaults.licenseStatus || 'inactive',
  currency_code: defaultCurrency,
  currency_locale: defaultCurrencyLocaleMap[defaultCurrency] || 'en-US',
  base_currency_code: defaultCurrency,
  exchange_rate_usd: '121.5',
  exchange_rate_inr: '1.45',
  company_about_title: 'About',
  company_about_content:
    `${defaultSiteName} is a premium automotive parts platform focused on performance, reliability, and customer-first service.`,
  company_contact_title: 'Contact',
  company_contact_content:
    'Need help? Contact us by email, phone, WhatsApp, or create a support ticket from the Help page.',
  company_support_title: 'Support',
  company_support_content:
    'For technical issues, order updates, and account help, please use our support center. Our team responds as fast as possible.',
  company_shipping_policy_title: 'Shipping Policy',
  company_shipping_policy_content:
    'Orders are processed after payment verification. Delivery time depends on location and shipping method.',
  company_return_policy_title: 'Return Policy',
  company_return_policy_content:
    'Returns are accepted for eligible products in original condition within the allowed return window.',
  legal_privacy_policy_title: 'Privacy Policy',
  legal_privacy_policy_content:
    'We collect only the data required to operate your account, process orders, and improve service quality.',
  legal_terms_of_service_title: 'Terms of Service',
  legal_terms_of_service_content:
    'By using this website, you agree to follow our store policies, payment terms, and applicable local laws.',
  legal_payment_policy_title: 'Payment Policy',
  legal_payment_policy_content:
    'Supported payment methods are managed from admin settings. Orders are confirmed after successful payment verification.',
  legal_refund_policy_title: 'Refund Policy',
  legal_refund_policy_content:
    'Approved refunds are issued to the original payment channel within the applicable processing period.',
  managed_pages: '',
  footer_shop_links: '',

  allow_self_signup: 'true',
  require_email_verification: 'true',
  allow_guest_checkout: 'true',
  default_user_role: 'user',

  admin_2fa_required: 'false',
  enforce_strong_password: 'true',
  password_min_length: '8',
  session_timeout_minutes: '120',
  max_login_attempts: '5',

  notification_email: defaultSupportEmail,
  notify_new_order: 'true',
  notify_payment_update: 'true',
  notify_new_customer: 'false',
  notify_support_ticket: 'true',

  tax_enabled: 'false',
  default_tax_rate: '0',
  default_shipping_fee: '15',
  invoice_prefix: 'INV',
  payment_auto_confirm: 'false',

  public_api_enabled: 'false',
  enable_cors: 'true',
  api_rate_limit_per_minute: '60',
  webhook_url: '',

  auto_backup_enabled: 'true',
  backup_frequency: 'daily',
  backup_retention_days: '30',

  timezone: 'Asia/Dhaka',
  date_format: 'DD/MM/YYYY',
  maintenance_mode: 'false',
  maintenance_message: 'We are currently performing maintenance. Please check back soon.',

  custom_head_script: '',
  custom_footer_script: '',

  primary_color: '#e11d48',
  primary_hover_color: '#be123c',
  accent_color: '#0f172a',
  success_color: '#16a34a',
  warning_color: '#f59e0b',
  danger_color: '#dc2626',
  background_color_light: '#ffffff',
  background_color_dark: '#0b1220',
  surface_color_light: '#ffffff',
  surface_color_dark: '#111827',
  text_color_light: '#111827',
  text_color_dark: '#e5e7eb',
  muted_text_color_light: '#6b7280',
  muted_text_color_dark: '#94a3b8',
  border_color_light: '#e5e7eb',
  border_color_dark: '#334155',
  border_radius_px: '12',
  compact_sidebar: 'false'
};

const localeByCurrency: Record<string, string> = {
  BDT: 'en-BD',
  USD: 'en-US',
  INR: 'en-IN'
};

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'page';

const normalizeManagedPages = (pages: ManagedPageItem[]) =>
  pages
    .map((page, index) => ({
      id: page.id || `page-${index + 1}`,
      slug: toSlug(page.slug || page.title || `page-${index + 1}`),
      title: (page.title || 'Untitled Page').trim(),
      content: page.content || '',
      section: page.section === 'legal' ? 'legal' : 'company',
      isEnabled: page.isEnabled !== false,
      order: Number.isFinite(page.order) ? page.order : index + 1
    }))
    .sort((a, b) => a.order - b.order)
    .map((page, index) => ({ ...page, order: index + 1 }));

const ensureUniqueSlug = (candidate: string, pages: ManagedPageItem[], currentId?: string) => {
  const base = toSlug(candidate);
  const existing = new Set(
    pages.filter((item) => item.id !== currentId).map((item) => toSlug(item.slug))
  );
  if (!existing.has(base)) return base;
  let suffix = 2;
  let next = `${base}-${suffix}`;
  while (existing.has(next)) {
    suffix += 1;
    next = `${base}-${suffix}`;
  }
  return next;
};

const createDefaultManagedPages = (values: Record<string, string>): ManagedPageItem[] => {
  const entries: ManagedPageItem[] = Object.entries(MANAGED_PAGE_SYNC_MAP).map(([slug, mapItem], index) => ({
    id: `system-${slug}`,
    slug,
    title: values[mapItem.titleKey] || slug,
    content: values[mapItem.contentKey] || '',
    section: mapItem.section as ManagedPageSection,
    isEnabled: true,
    order: index + 1
  }));
  return normalizeManagedPages(entries);
};

const parseManagedPagesSetting = (raw: string | undefined, values: Record<string, string>) => {
  const fallback = createDefaultManagedPages(values);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback;
    const rows: ManagedPageItem[] = parsed.map((item: any, index: number) => ({
      id: String(item?.id || `custom-${index + 1}`),
      slug: String(item?.slug || item?.title || `page-${index + 1}`),
      title: String(item?.title || 'Untitled Page'),
      content: String(item?.content || ''),
      section: item?.section === 'legal' ? 'legal' : 'company',
      isEnabled: item?.isEnabled !== false,
      order: Number(item?.order || index + 1)
    }));
    return normalizeManagedPages(rows);
  } catch {
    return fallback;
  }
};

const normalizeFooterShopLinks = (links: FooterShopLinkItem[]) =>
  links
    .map((item, index) => ({
      id: String(item.id || `shop-link-${index + 1}`),
      label: String(item.label || 'Shop Link'),
      href: String(item.href || '/'),
      isEnabled: item.isEnabled !== false,
      order: Number.isFinite(item.order) ? item.order : index + 1
    }))
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({ ...item, order: index + 1 }));

const parseFooterShopLinksSetting = (raw: string | undefined) => {
  if (!raw) return normalizeFooterShopLinks(DEFAULT_SHOP_LINKS);

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return normalizeFooterShopLinks(DEFAULT_SHOP_LINKS);
    const links: FooterShopLinkItem[] = parsed.map((item: any, index: number) => ({
      id: String(item?.id || `shop-link-${index + 1}`),
      label: String(item?.label || 'Shop Link'),
      href: String(item?.href || '/'),
      isEnabled: item?.isEnabled !== false,
      order: Number(item?.order || index + 1)
    }));
    return normalizeFooterShopLinks(links);
  } catch {
    return normalizeFooterShopLinks(DEFAULT_SHOP_LINKS);
  }
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

const normalizeColorInput = (value: string, fallback: string) => {
  const raw = String(value || '').trim();
  if (!raw) return fallback;
  const prefixed = raw.startsWith('#') ? raw : `#${raw}`;
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(prefixed) ? prefixed.toLowerCase() : fallback;
};

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

interface HslColor {
  h: number;
  s: number;
  l: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const hexToRgb = (hex: string): RgbColor => {
  const normalized = normalizeColorInput(hex, '#000000').replace('#', '');
  const fullHex =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;
  return {
    r: parseInt(fullHex.slice(0, 2), 16),
    g: parseInt(fullHex.slice(2, 4), 16),
    b: parseInt(fullHex.slice(4, 6), 16)
  };
};

const rgbToHex = ({ r, g, b }: RgbColor) =>
  `#${clamp(Math.round(r), 0, 255).toString(16).padStart(2, '0')}${clamp(Math.round(g), 0, 255)
    .toString(16)
    .padStart(2, '0')}${clamp(Math.round(b), 0, 255).toString(16).padStart(2, '0')}`;

const rgbToHsl = ({ r, g, b }: RgbColor): HslColor => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  if (delta !== 0) {
    if (max === rn) {
      h = ((gn - bn) / delta) % 6;
    } else if (max === gn) {
      h = (bn - rn) / delta + 2;
    } else {
      h = (rn - gn) / delta + 4;
    }
  }

  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return { h, s, l };
};

const hslToRgb = ({ h, s, l }: HslColor): RgbColor => {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (hue < 60) {
    rPrime = c;
    gPrime = x;
  } else if (hue < 120) {
    rPrime = x;
    gPrime = c;
  } else if (hue < 180) {
    gPrime = c;
    bPrime = x;
  } else if (hue < 240) {
    gPrime = x;
    bPrime = c;
  } else if (hue < 300) {
    rPrime = x;
    bPrime = c;
  } else {
    rPrime = c;
    bPrime = x;
  }

  return {
    r: (rPrime + m) * 255,
    g: (gPrime + m) * 255,
    b: (bPrime + m) * 255
  };
};

const mixHex = (sourceHex: string, targetHex: string, targetWeight: number) => {
  const source = hexToRgb(sourceHex);
  const target = hexToRgb(targetHex);
  const weight = clamp(targetWeight, 0, 1);
  return rgbToHex({
    r: source.r * (1 - weight) + target.r * weight,
    g: source.g * (1 - weight) + target.g * weight,
    b: source.b * (1 - weight) + target.b * weight
  });
};

const darkenHex = (hex: string, amount: number) => {
  const hsl = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb({ ...hsl, l: clamp(hsl.l * (1 - clamp(amount, 0, 0.8)), 0, 1) }));
};

const lightenHex = (hex: string, amount: number) => {
  const hsl = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb({ ...hsl, l: clamp(hsl.l + (1 - hsl.l) * clamp(amount, 0, 0.8), 0, 1) }));
};

const getHueDistance = (left: number, right: number) => {
  const diff = Math.abs(left - right);
  return Math.min(diff, 360 - diff);
};

const getAppearanceRawValues = (source: Record<string, string>) => ({
  primary_color: source.primary_color,
  primary_hover_color: source.primary_hover_color,
  accent_color: source.accent_color,
  success_color: source.success_color,
  warning_color: source.warning_color,
  danger_color: source.danger_color,
  background_color_light: source.background_color_light,
  background_color_dark: source.background_color_dark,
  surface_color_light: source.surface_color_light,
  surface_color_dark: source.surface_color_dark,
  text_color_light: source.text_color_light,
  text_color_dark: source.text_color_dark,
  muted_text_color_light: source.muted_text_color_light,
  muted_text_color_dark: source.muted_text_color_dark,
  border_color_light: source.border_color_light,
  border_color_dark: source.border_color_dark,
  border_radius_px: source.border_radius_px
});

const appearanceToSettingsValues = (appearance: ReturnType<typeof toAppearanceFromRawSettings>) => ({
  primary_color: appearance.primaryColor,
  primary_hover_color: appearance.primaryHoverColor,
  accent_color: appearance.accentColor,
  success_color: appearance.successColor,
  warning_color: appearance.warningColor,
  danger_color: appearance.dangerColor,
  background_color_light: appearance.backgroundColorLight,
  background_color_dark: appearance.backgroundColorDark,
  surface_color_light: appearance.surfaceColorLight,
  surface_color_dark: appearance.surfaceColorDark,
  text_color_light: appearance.textColorLight,
  text_color_dark: appearance.textColorDark,
  muted_text_color_light: appearance.mutedTextColorLight,
  muted_text_color_dark: appearance.mutedTextColorDark,
  border_color_light: appearance.borderColorLight,
  border_color_dark: appearance.borderColorDark,
  border_radius_px: String(appearance.borderRadiusPx)
});

interface LogoPaletteResult {
  primary: string;
  accent: string;
}

const extractLogoPalette = (imageUrl: string) =>
  new Promise<LogoPaletteResult>((resolve, reject) => {
    if (!imageUrl) {
      reject(new Error('Logo URL is missing.'));
      return;
    }

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.referrerPolicy = 'no-referrer';
    image.decoding = 'async';

    image.onload = () => {
      const size = 96;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Image engine unavailable in this browser.'));
        return;
      }

      ctx.drawImage(image, 0, 0, size, size);

      let data: Uint8ClampedArray;
      try {
        data = ctx.getImageData(0, 0, size, size).data;
      } catch {
        reject(new Error('Cannot read logo colors (image host blocks color extraction). Use a public logo URL or upload to assets.'));
        return;
      }

      const buckets = new Map<string, { rgb: RgbColor; hue: number; weight: number }>();
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha < 72) continue;
        const rgb: RgbColor = { r: data[i], g: data[i + 1], b: data[i + 2] };
        const hsl = rgbToHsl(rgb);
        if ((hsl.l > 0.96 && hsl.s < 0.2) || hsl.l < 0.04) continue;

        const quantized: RgbColor = {
          r: Math.round(rgb.r / 24) * 24,
          g: Math.round(rgb.g / 24) * 24,
          b: Math.round(rgb.b / 24) * 24
        };
        const key = `${quantized.r}-${quantized.g}-${quantized.b}`;
        const vibrance = hsl.s * (1 - Math.abs(hsl.l - 0.5));
        const weight = 0.25 + vibrance * 2 + alpha / 255;
        const existing = buckets.get(key);
        if (existing) {
          existing.weight += weight;
        } else {
          buckets.set(key, { rgb: quantized, hue: hsl.h, weight });
        }
      }

      if (buckets.size === 0) {
        reject(new Error('Logo color detection failed. Try a logo with clear brand colors.'));
        return;
      }

      const ranked = Array.from(buckets.values()).sort((a, b) => b.weight - a.weight);
      const primaryRaw = ranked[0];
      const accentRaw =
        ranked.find((item, index) => index > 0 && getHueDistance(item.hue, primaryRaw.hue) >= 18) || ranked[1];

      const normalizedPrimary = (() => {
        const hsl = rgbToHsl(primaryRaw.rgb);
        const adjusted = {
          h: hsl.h,
          s: clamp(Math.max(hsl.s, 0.45), 0, 1),
          l: clamp(hsl.l < 0.28 ? 0.46 : hsl.l > 0.72 ? 0.56 : hsl.l, 0, 1)
        };
        return rgbToHex(hslToRgb(adjusted));
      })();

      const normalizedAccent = accentRaw
        ? (() => {
            const hsl = rgbToHsl(accentRaw.rgb);
            return rgbToHex(
              hslToRgb({
                h: hsl.h,
                s: clamp(Math.max(hsl.s, 0.32), 0, 1),
                l: clamp(hsl.l < 0.2 ? 0.34 : hsl.l > 0.74 ? 0.52 : hsl.l, 0, 1)
              })
            );
          })()
        : darkenHex(normalizedPrimary, 0.35);

      resolve({
        primary: normalizedPrimary,
        accent: normalizedAccent
      });
    };

    image.onerror = () => reject(new Error('Failed to load logo for color extraction.'));
    image.src = imageUrl;
  });

const buildAppearanceFromLogoPalette = (palette: LogoPaletteResult, current: Record<string, string>) => {
  const primary = normalizeColorInput(palette.primary, DEFAULT_VALUES.primary_color);
  const accent = normalizeColorInput(mixHex(palette.accent, '#0f172a', 0.18), DEFAULT_VALUES.accent_color);
  const appearance = toAppearanceFromRawSettings({
    ...getAppearanceRawValues(current),
    primary_color: primary,
    primary_hover_color: darkenHex(primary, 0.16),
    accent_color: accent,
    success_color: lightenHex(mixHex(primary, '#16a34a', 0.55), 0.04),
    warning_color: lightenHex(mixHex(primary, '#f59e0b', 0.7), 0.02),
    danger_color: lightenHex(mixHex(primary, '#dc2626', 0.75), 0.02),
    background_color_light: '#ffffff',
    surface_color_light: '#ffffff',
    text_color_light: mixHex(accent, '#111827', 0.52),
    muted_text_color_light: mixHex(accent, '#6b7280', 0.72),
    border_color_light: mixHex(accent, '#d1d5db', 0.82),
    background_color_dark: mixHex(accent, '#020617', 0.86),
    surface_color_dark: mixHex(accent, '#111827', 0.68),
    text_color_dark: '#e5e7eb',
    muted_text_color_dark: '#94a3b8',
    border_color_dark: mixHex(accent, '#334155', 0.7)
  });

  return appearance;
};

const HEADER_BRAND_ASSET_FIELDS: Array<{ key: string; label: string; helper: string }> = [
  { key: 'header_logo_light', label: 'Header Logo (Light)', helper: 'Main logo used in storefront header for light theme' },
  { key: 'header_logo_dark', label: 'Header Logo (Dark)', helper: 'Optional dark-theme version of header logo' },
  { key: 'favicon_url', label: 'Favicon', helper: 'Browser tab icon' }
];

const FOOTER_BRAND_ASSET_FIELDS: Array<{ key: string; label: string; helper: string }> = [
  { key: 'footer_logo', label: 'Footer Logo', helper: 'Logo shown in footer branding area' },
  { key: 'link_bar_image_url', label: 'Link Bar Image', helper: 'Optional clickable image bar shown in footer links area' }
];

const GENERAL_BRAND_ASSET_FIELDS: Array<{ key: string; label: string; helper: string }> = [
  { key: 'newsletter_background_image_url', label: 'Newsletter Background', helper: 'Optional background image for home newsletter section' }
];

const BRAND_ASSET_GUIDE_BY_KEY: Record<string, ImageGuide> = {
  header_logo_light: ADMIN_IMAGE_GUIDES.headerLogo,
  footer_logo: ADMIN_IMAGE_GUIDES.footerLogo,
  favicon_url: ADMIN_IMAGE_GUIDES.favicon,
  link_bar_image_url: ADMIN_IMAGE_GUIDES.linkBar,
  newsletter_background_image_url: ADMIN_IMAGE_GUIDES.linkBar
};

const GENERAL_SETTINGS_GROUPS: SettingsGroup[] = [
  {
    title: 'Newsletter Section',
    description: 'Control add/edit/remove content shown in the home subscription banner.',
    fields: [
      'newsletter_enabled',
      'newsletter_badge_text',
      'newsletter_title',
      'newsletter_description',
      'newsletter_input_placeholder',
      'newsletter_button_text'
    ]
  },
  {
    title: 'Support Contacts',
    description: 'Customer-facing support channels and follow-up details.',
    fields: ['support_email', 'support_phone', 'support_address', 'whatsapp_number']
  },
  {
    title: 'Currency & Exchange',
    description: 'Global display currency and conversion rates.',
    fields: ['currency_code', 'base_currency_code', 'exchange_rate_usd', 'exchange_rate_inr']
  }
];

const HEADER_SETTINGS_GROUPS: SettingsGroup[] = [
  {
    title: 'Store Identity',
    description: 'Brand naming and URL details shown in header and metadata.',
    fields: ['site_name', 'site_url_name', 'site_url', 'site_tagline']
  }
];

const FOOTER_SETTINGS_GROUPS: SettingsGroup[] = [
  {
    title: 'Footer Content',
    description: 'Footer text and social profiles shown to customers.',
    fields: ['footer_text', 'facebook_url', 'instagram_url', 'youtube_url', 'twitter_url', 'link_bar_image_link']
  }
];

const APPEARANCE_SETTINGS_GROUPS: SettingsGroup[] = [
  {
    title: 'Brand Colors',
    description: 'Primary brand colors used in buttons, links, and highlights.',
    fields: ['primary_color', 'primary_hover_color', 'accent_color', 'success_color', 'warning_color', 'danger_color']
  },
  {
    title: 'Light Theme Colors',
    description: 'Background, card, text, and border colors in light mode.',
    fields: ['background_color_light', 'surface_color_light', 'text_color_light', 'muted_text_color_light', 'border_color_light']
  },
  {
    title: 'Dark Theme Colors',
    description: 'Background, card, text, and border colors in dark mode.',
    fields: ['background_color_dark', 'surface_color_dark', 'text_color_dark', 'muted_text_color_dark', 'border_color_dark']
  },
  {
    title: 'Shape & Layout',
    description: 'Global corner radius and compact sidebar controls.',
    fields: ['border_radius_px', 'compact_sidebar']
  }
];

const AdminSettings: React.FC = () => {
  const { profile, user } = useAuth();
  const isSuperAdmin = isSuperAdminEmail(profile?.email || user?.email || null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [values, setValues] = useState<Record<string, string>>(DEFAULT_VALUES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [autoApplying, setAutoApplying] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [settingsRows, setSettingsRows] = useState<Array<{ key: string; value: string; updated_at?: string }>>([]);
  const [managedPages, setManagedPages] = useState<ManagedPageItem[]>(createDefaultManagedPages(DEFAULT_VALUES));
  const [shopLinks, setShopLinks] = useState<FooterShopLinkItem[]>(normalizeFooterShopLinks(DEFAULT_SHOP_LINKS));
  const activeTabConfig = useMemo(() => TABS.find((tab) => tab.id === activeTab) || TABS[0], [activeTab]);
  const autoPaletteLogoUrl = useMemo(
    () =>
      values.header_logo_light ||
      values.header_logo_dark ||
      values.footer_logo ||
      values.tenant_brand_logo_url ||
      '',
    [values.header_logo_light, values.header_logo_dark, values.footer_logo, values.tenant_brand_logo_url]
  );

  const fetchSettings = async () => {
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.from('site_settings').select('key,value,updated_at');
    if (error) {
      setLoading(false);
      setMessage({ type: 'error', text: error.message || 'Failed to load settings.' });
      return;
    }

    const nextValues = { ...DEFAULT_VALUES };
    for (const row of data || []) {
      nextValues[row.key] = row.value || '';
    }

    nextValues.tenant_brand_name = nextValues.tenant_brand_name || nextValues.site_name || DEFAULT_VALUES.tenant_brand_name;
    nextValues.tenant_brand_logo_url =
      nextValues.tenant_brand_logo_url || nextValues.header_logo_light || nextValues.header_logo_dark || '';
    nextValues.tenant_primary_color = nextValues.tenant_primary_color || nextValues.primary_color || DEFAULT_VALUES.tenant_primary_color;
    nextValues.tenant_secondary_color = nextValues.tenant_secondary_color || nextValues.accent_color || DEFAULT_VALUES.tenant_secondary_color;
    nextValues.tenant_support_email = nextValues.tenant_support_email || nextValues.support_email || DEFAULT_VALUES.tenant_support_email;
    nextValues.tenant_company_name = nextValues.tenant_company_name || nextValues.site_name || DEFAULT_VALUES.tenant_company_name;
    nextValues.tenant_company_address = nextValues.tenant_company_address || nextValues.support_address || DEFAULT_VALUES.tenant_company_address;
    nextValues.tenant_company_phone = nextValues.tenant_company_phone || nextValues.support_phone || DEFAULT_VALUES.tenant_company_phone;
    nextValues.tenant_domain = nextValues.tenant_domain || nextValues.site_url_name || DEFAULT_VALUES.tenant_domain;
    nextValues.tenant_timezone = nextValues.tenant_timezone || nextValues.timezone || DEFAULT_VALUES.tenant_timezone;
    nextValues.tenant_currency = nextValues.tenant_currency || nextValues.currency_code || DEFAULT_VALUES.tenant_currency;
    nextValues.tenant_plan_name = normalizePlanName(nextValues.tenant_plan_name || DEFAULT_VALUES.tenant_plan_name);
    if (!nextValues.tenant_feature_flags) {
      nextValues.tenant_feature_flags = JSON.stringify(PLAN_FEATURE_MATRIX[nextValues.tenant_plan_name as keyof typeof PLAN_FEATURE_MATRIX]);
    }

    setValues(nextValues);
    setManagedPages(parseManagedPagesSetting(nextValues.managed_pages, nextValues));
    setShopLinks(parseFooterShopLinksSetting(nextValues.footer_shop_links));
    setSettingsRows((data || []) as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    applyAppearanceSettings(toAppearanceFromRawSettings(getAppearanceRawValues(values)));
  }, [
    values.primary_color,
    values.primary_hover_color,
    values.accent_color,
    values.success_color,
    values.warning_color,
    values.danger_color,
    values.background_color_light,
    values.background_color_dark,
    values.surface_color_light,
    values.surface_color_dark,
    values.text_color_light,
    values.text_color_dark,
    values.muted_text_color_light,
    values.muted_text_color_dark,
    values.border_color_light,
    values.border_color_dark,
    values.border_radius_px
  ]);

  const setFieldValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const applyAppearanceToFormValues = (appearance: ReturnType<typeof toAppearanceFromRawSettings>) => {
    const mapped = appearanceToSettingsValues(appearance);
    setValues((prev) => ({
      ...prev,
      ...mapped,
      tenant_primary_color: mapped.primary_color,
      tenant_secondary_color: mapped.accent_color
    }));
  };

  const handleAutoMatchAppearanceFromLogo = async () => {
    if (!autoPaletteLogoUrl) {
      setMessage({
        type: 'error',
        text: 'Please upload a logo in Header Assets first. Then click Auto Match again.'
      });
      return;
    }

    setAutoApplying(true);
    setMessage(null);
    try {
      const palette = await extractLogoPalette(autoPaletteLogoUrl);
      const nextAppearance = buildAppearanceFromLogoPalette(palette, values);
      applyAppearanceToFormValues(nextAppearance);
      setMessage({
        type: 'success',
        text: 'Theme colors were auto-generated from your logo. Review and click Save Changes.'
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error?.message || 'Auto color matching failed. Try another logo image.'
      });
    } finally {
      setAutoApplying(false);
    }
  };

  const handleResetAppearanceDefaults = () => {
    const defaults = toAppearanceFromRawSettings(getAppearanceRawValues(DEFAULT_VALUES));
    applyAppearanceToFormValues(defaults);
    setMessage({
      type: 'success',
      text: 'Appearance reset to default colors. Click Save Changes to keep it.'
    });
  };

  const handleAutoGenerateHoverColor = () => {
    const primary = normalizeColorInput(values.primary_color, DEFAULT_VALUES.primary_color);
    setFieldValue('primary_hover_color', darkenHex(primary, 0.16));
    setMessage({
      type: 'success',
      text: 'Primary hover color synced from current primary color.'
    });
  };

  const updateManagedPage = (id: string, key: keyof ManagedPageItem, value: string | boolean) => {
    setManagedPages((prev) =>
      prev.map((page) => {
        if (page.id !== id) return page;
        const next = { ...page, [key]: value } as ManagedPageItem;
        if (key === 'title' && (!page.slug || page.slug === toSlug(page.title))) {
          next.slug = ensureUniqueSlug(String(value), prev, id);
        }
        if (key === 'slug') {
          next.slug = ensureUniqueSlug(String(value), prev, id);
        }
        return next;
      })
    );
  };

  const addManagedPage = () => {
    setManagedPages((prev) => {
      const slug = ensureUniqueSlug('new-page', prev);
      return [
        ...prev,
        {
          id: `custom-${Date.now()}`,
          slug,
          title: 'New Page',
          content: '',
          section: 'company',
          isEnabled: true,
          order: prev.length + 1
        }
      ];
    });
  };

  const removeManagedPage = (id: string) => {
    setManagedPages((prev) => prev.filter((page) => page.id !== id));
  };

  const moveManagedPage = (id: string, direction: 'up' | 'down') => {
    setManagedPages((prev) => {
      const index = prev.findIndex((page) => page.id === id);
      if (index < 0) return prev;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const [picked] = next.splice(index, 1);
      next.splice(targetIndex, 0, picked);
      return next;
    });
  };

  const updateShopLink = (id: string, key: keyof FooterShopLinkItem, value: string | boolean) => {
    setShopLinks((prev) =>
      prev.map((item) => (item.id === id ? ({ ...item, [key]: value } as FooterShopLinkItem) : item))
    );
  };

  const addShopLink = () => {
    setShopLinks((prev) =>
      normalizeFooterShopLinks([
        ...prev,
        {
          id: `shop-link-${Date.now()}`,
          label: 'New Shop Link',
          href: '/',
          isEnabled: true,
          order: prev.length + 1
        }
      ])
    );
  };

  const removeShopLink = (id: string) => {
    setShopLinks((prev) => normalizeFooterShopLinks(prev.filter((item) => item.id !== id)));
  };

  const moveShopLink = (id: string, direction: 'up' | 'down') => {
    setShopLinks((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index < 0) return prev;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const [picked] = next.splice(index, 1);
      next.splice(targetIndex, 0, picked);
      return normalizeFooterShopLinks(next);
    });
  };

  const handleUploadAsset = async (settingKey: string, file?: File) => {
    if (!file) return;
    setUploading(true);
    setMessage(null);

    try {
      const guide = BRAND_ASSET_GUIDE_BY_KEY[settingKey];
      let uploadInfoText = 'Image uploaded successfully.';
      if (guide) {
        const validation = await validateImageAgainstGuide(file, guide);
        if (validation.shouldBlock) {
          setMessage({ type: 'error', text: validation.message });
          return;
        }
        uploadInfoText = validation.message;
      }

      const optimized = guide
        ? await optimizeImageByGuide(file, guide, { fileNamePrefix: settingKey })
        : await optimizeImageByGuide(file, ADMIN_IMAGE_GUIDES.linkBar, { fileNamePrefix: settingKey });
      const filePath = `branding/${optimized.file.name}`;
      const { publicUrl } = await uploadFile('assets', filePath, optimized.file, {
        upsert: false
      });
      setFieldValue(settingKey, publicUrl);
      if (settingKey === 'header_logo_light' && !values.header_logo_dark) {
        setFieldValue('header_logo_dark', publicUrl);
      }
      setMessage({ type: 'success', text: `${uploadInfoText} Optimized ${optimized.reducedPercent}% smaller.` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Asset upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const saveCurrentTab = async () => {
    setSaving(true);
    setMessage(null);

    if (activeTab === 'pages') {
      const normalizedPages = normalizeManagedPages(managedPages);
      const upserts: Array<{ key: string; value: string }> = [{ key: 'managed_pages', value: JSON.stringify(normalizedPages) }];

      for (const page of normalizedPages) {
        const syncMeta = MANAGED_PAGE_SYNC_MAP[page.slug];
        if (!syncMeta) continue;
        upserts.push({ key: syncMeta.titleKey, value: page.title });
        upserts.push({ key: syncMeta.contentKey, value: page.content });
      }

      const { error } = await supabase.from('site_settings').upsert(upserts, { onConflict: 'key' });
      setSaving(false);

      if (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to save page settings.' });
        return;
      }

      clearPublicSiteConfigCache();
      clearTenantConfigCache();
      setMessage({ type: 'success', text: 'Company and legal pages saved successfully.' });
      fetchSettings();
      return;
    }

    if (activeTab === 'footer') {
      const normalizedShopLinks = normalizeFooterShopLinks(
        shopLinks.map((item) => ({
          ...item,
          label: (item.label || '').trim() || 'Shop Link',
          href: (item.href || '').trim() || '/'
        }))
      );
      const keysToSave = new Set<string>(activeTabConfig.fields.map((field) => field.key));
      const upserts: Array<{ key: string; value: string }> = [
        ...Array.from(keysToSave).map((key) => ({ key, value: values[key] ?? '' })),
        { key: 'footer_shop_links', value: JSON.stringify(normalizedShopLinks) }
      ];

      const { error } = await supabase.from('site_settings').upsert(upserts, { onConflict: 'key' });
      setSaving(false);

      if (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to save footer settings.' });
        return;
      }

      clearPublicSiteConfigCache();
      clearTenantConfigCache();
      setMessage({ type: 'success', text: 'Footer settings saved successfully.' });
      fetchSettings();
      return;
    }

    const keysToSave = new Set<string>(activeTabConfig.fields.map((field) => field.key));
    const normalizedAppearanceValues =
      activeTab === 'appearance'
        ? (() => {
            const normalized = toAppearanceFromRawSettings(getAppearanceRawValues(values));
            return appearanceToSettingsValues(normalized) as Record<string, string>;
          })()
        : null;
    if (activeTab === 'general') {
      keysToSave.add('currency_locale');
      if (!values.currency_locale) {
        setFieldValue('currency_locale', localeByCurrency[values.currency_code] || 'en-BD');
      }
    }
    if (activeTab === 'header') {
      if (!values.site_url_name) {
        setFieldValue('site_url_name', getUrlNameFromUrl(values.site_url || DEFAULT_VALUES.site_url));
      }
    }

    const upserts = Array.from(keysToSave).map((key) => {
      let value = normalizedAppearanceValues?.[key] ?? values[key] ?? '';
      if (key === 'currency_locale') {
        value = values.currency_locale || localeByCurrency[values.currency_code] || 'en-BD';
      }
      if (key === 'site_url_name') {
        value = (values.site_url_name || getUrlNameFromUrl(values.site_url || DEFAULT_VALUES.site_url)).trim();
      }
      return { key, value };
    });

    const { error } = await supabase.from('site_settings').upsert(upserts, { onConflict: 'key' });
    setSaving(false);

    if (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to save settings.' });
      return;
    }

    clearPublicSiteConfigCache();
    clearTenantConfigCache();
    setMessage({ type: 'success', text: `${activeTabConfig.label} settings saved successfully.` });
    fetchSettings();
  };

  const renderField = (field: SettingField) => {
    const value = values[field.key] ?? '';

    if (field.type === 'switch') {
      const checked = value === 'true';
      return (
        <label className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-3">
          <span className="text-sm font-bold text-gray-800">{field.label}</span>
          <button
            type="button"
            onClick={() => setFieldValue(field.key, checked ? 'false' : 'true')}
            className={`w-12 h-7 rounded-full transition-colors relative ${checked ? 'bg-primary' : 'bg-gray-300'}`}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${checked ? 'left-6' : 'left-1'}`}
            />
          </button>
        </label>
      );
    }

    if (field.type === 'select') {
      return (
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">{field.label}</label>
          <select
            value={value}
            onChange={(e) => {
              const next = e.target.value;
              setFieldValue(field.key, next);
              if (field.key === 'currency_code') {
                setFieldValue('currency_locale', localeByCurrency[next] || 'en-BD');
              }
            }}
            className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold"
          >
            {(field.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {field.helper && <p className="text-xs text-gray-500 mt-1">{field.helper}</p>}
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">{field.label}</label>
          <textarea
            rows={4}
            value={value}
            onChange={(e) => setFieldValue(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold"
          />
          {field.helper && <p className="text-xs text-gray-500 mt-1">{field.helper}</p>}
        </div>
      );
    }

    if (field.type === 'color') {
      const fallbackColor = DEFAULT_VALUES[field.key] || '#111827';
      const colorPickerValue = normalizeColorInput(value, fallbackColor);
      return (
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">{field.label}</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={colorPickerValue}
              onChange={(e) => setFieldValue(field.key, normalizeColorInput(e.target.value, fallbackColor))}
              className="w-14 h-12 rounded-xl border border-gray-200 bg-white"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => setFieldValue(field.key, e.target.value)}
              onBlur={(e) => setFieldValue(field.key, normalizeColorInput(e.target.value, fallbackColor))}
              className="flex-1 h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold"
            />
          </div>
          {!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test((value || '').trim()) && (
            <p className="text-xs text-amber-700 mt-1">Use HEX color format, example: #e11d48</p>
          )}
          {field.helper && <p className="text-xs text-gray-500 mt-1">{field.helper}</p>}
        </div>
      );
    }

    return (
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">{field.label}</label>
        <input
          type={field.type}
          value={value}
          onChange={(e) => {
            const next = e.target.value;
            setFieldValue(field.key, next);
            if (field.key === 'site_url' && !values.site_url_name) {
              setFieldValue('site_url_name', getUrlNameFromUrl(next));
            }
          }}
          placeholder={field.placeholder}
          className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold"
        />
        {field.helper && <p className="text-xs text-gray-500 mt-1">{field.helper}</p>}
      </div>
    );
  };

  const getTabFieldByKey = (tabId: SettingsTab, key: string) =>
    TABS.find((tab) => tab.id === tabId)?.fields.find((item) => item.key === key);

  const renderFieldByKeyForTab = (tabId: SettingsTab, key: string) => {
    const field = getTabFieldByKey(tabId, key);
    if (!field) return null;
    return <div key={key}>{renderField(field)}</div>;
  };

  const renderAppearanceFieldByKey = (key: string) => renderFieldByKeyForTab('appearance', key);

  const renderSettingsGroups = (tabId: SettingsTab, groups: SettingsGroup[]) => (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {groups.map((group) => (
        <div key={`${tabId}-${group.title}`} className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 space-y-3">
          <div>
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">{group.title}</h4>
            <p className="text-xs text-gray-500 mt-1">{group.description}</p>
          </div>
          <div className="space-y-3">{group.fields.map((key) => renderFieldByKeyForTab(tabId, key))}</div>
        </div>
      ))}
    </div>
  );

  const renderBrandAssetsCard = (
    heading: string,
    description: string,
    assetFields: Array<{ key: string; label: string; helper: string }>
  ) => (
    <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50/50 space-y-4">
      <div>
        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">{heading}</h4>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
      {assetFields.map((asset) => {
        const guide = BRAND_ASSET_GUIDE_BY_KEY[asset.key];
        const guideHint = guide ? formatImageGuideHint(guide) : '';
        const isWideLogoAsset =
          asset.key === 'header_logo_light' ||
          asset.key === 'header_logo_dark' ||
          asset.key === 'footer_logo';
        return (
          <div key={asset.key} className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">{asset.label}</label>
            <div className="flex flex-wrap items-center gap-3">
              <label
                className={`inline-flex items-center gap-2 px-4 h-11 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 cursor-pointer ${
                  uploading ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Choose Image'}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleUploadAsset(asset.key, e.target.files?.[0])}
                />
              </label>
              <input
                type="text"
                value={values[asset.key] || ''}
                onChange={(e) => setFieldValue(asset.key, e.target.value)}
                placeholder={`${asset.label} URL`}
                className="min-w-[260px] flex-1 h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold"
              />
            </div>
            <p className="text-xs text-gray-500">
              {asset.helper}
              {guideHint ? ` • ${guideHint}` : ''}
            </p>
            {values[asset.key] && (
              <img
                src={values[asset.key]}
                alt={`${asset.label} preview`}
                className={`rounded-xl border border-gray-200 bg-white ${
                  isWideLogoAsset ? 'w-52 h-20 p-2 object-contain' : 'w-20 h-20 object-cover'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderGeneralSettingsContent = () => (
    <div className="space-y-5">
      {renderBrandAssetsCard(
        'General Media',
        'Upload media used in general storefront sections like newsletter.',
        GENERAL_BRAND_ASSET_FIELDS
      )}
      {renderSettingsGroups('general', GENERAL_SETTINGS_GROUPS)}

      <div className="pt-3 flex justify-end">
        <button
          type="button"
          onClick={saveCurrentTab}
          disabled={saving || uploading}
          className="h-11 px-6 rounded-xl bg-primary text-white font-black text-sm hover:bg-red-700 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  const renderHeaderSettingsContent = () => (
    <div className="space-y-5">
      {renderBrandAssetsCard(
        'Header Assets',
        'Control storefront header logos, favicon, and main identity values.',
        HEADER_BRAND_ASSET_FIELDS
      )}
      {renderSettingsGroups('header', HEADER_SETTINGS_GROUPS)}

      <div className="pt-3 flex justify-end">
        <button
          type="button"
          onClick={saveCurrentTab}
          disabled={saving || uploading}
          className="h-11 px-6 rounded-xl bg-primary text-white font-black text-sm hover:bg-red-700 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  const renderFooterShopLinksContent = () => (
    <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Footer Shop Links</h4>
          <p className="text-xs text-gray-500 mt-1">
            Control the links shown in footer &quot;Shop&quot; section. You can add any internal page or external URL.
          </p>
        </div>
        <button
          type="button"
          onClick={addShopLink}
          className="h-10 px-4 rounded-xl bg-gray-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black"
        >
          + Add Shop Link
        </button>
      </div>

      <div className="space-y-4">
        {shopLinks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm font-semibold text-gray-500">
            No shop links configured. Click &quot;Add Shop Link&quot; to create one.
          </div>
        ) : (
          shopLinks.map((item, index) => (
            <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 h-6 rounded-full bg-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-700">
                    Shop Link
                  </span>
                  <span className="text-xs font-bold text-gray-500">Order #{index + 1}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveShopLink(item.id, 'up')}
                    disabled={index === 0}
                    className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-black uppercase tracking-widest text-gray-600 disabled:opacity-40"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    onClick={() => moveShopLink(item.id, 'down')}
                    disabled={index === shopLinks.length - 1}
                    className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-black uppercase tracking-widest text-gray-600 disabled:opacity-40"
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    onClick={() => updateShopLink(item.id, 'isEnabled', !item.isEnabled)}
                    className={`h-8 px-3 rounded-lg text-xs font-black uppercase tracking-widest ${
                      item.isEnabled
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {item.isEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeShopLink(item.id)}
                    className="h-8 px-3 rounded-lg border border-red-200 text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Link Label</label>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateShopLink(item.id, 'label', e.target.value)}
                    className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold"
                    placeholder="Performance Parts"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Link URL</label>
                  <input
                    type="text"
                    value={item.href}
                    onChange={(e) => updateShopLink(item.id, 'href', e.target.value)}
                    className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold"
                    placeholder="/search?category=Brakes or https://example.com"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderFooterSettingsContent = () => (
    <div className="space-y-5">
      {renderBrandAssetsCard(
        'Footer Assets',
        'Manage footer logo and optional link bar image.',
        FOOTER_BRAND_ASSET_FIELDS
      )}
      {renderSettingsGroups('footer', FOOTER_SETTINGS_GROUPS)}
      {renderFooterShopLinksContent()}

      <div className="pt-3 flex justify-end">
        <button
          type="button"
          onClick={saveCurrentTab}
          disabled={saving || uploading}
          className="h-11 px-6 rounded-xl bg-primary text-white font-black text-sm hover:bg-red-700 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  const renderAppearanceSettingsContent = () => {
    const previewLightBackground = normalizeColorInput(values.background_color_light, DEFAULT_VALUES.background_color_light);
    const previewLightSurface = normalizeColorInput(values.surface_color_light, DEFAULT_VALUES.surface_color_light);
    const previewLightText = normalizeColorInput(values.text_color_light, DEFAULT_VALUES.text_color_light);
    const previewLightMuted = normalizeColorInput(values.muted_text_color_light, DEFAULT_VALUES.muted_text_color_light);
    const previewDarkBackground = normalizeColorInput(values.background_color_dark, DEFAULT_VALUES.background_color_dark);
    const previewDarkSurface = normalizeColorInput(values.surface_color_dark, DEFAULT_VALUES.surface_color_dark);
    const previewDarkText = normalizeColorInput(values.text_color_dark, DEFAULT_VALUES.text_color_dark);
    const previewDarkMuted = normalizeColorInput(values.muted_text_color_dark, DEFAULT_VALUES.muted_text_color_dark);
    const previewPrimary = normalizeColorInput(values.primary_color, DEFAULT_VALUES.primary_color);
    const previewPrimaryHover = normalizeColorInput(values.primary_hover_color, DEFAULT_VALUES.primary_hover_color);

    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Smart Color Assistant</h4>
              <p className="text-xs text-gray-500 mt-1">
                Auto-match colors from your logo, then fine-tune manually. Live preview updates instantly in admin and storefront.
              </p>
              {autoPaletteLogoUrl ? (
                <p className="text-xs text-gray-600 mt-2 font-semibold break-all">
                  Logo source: {autoPaletteLogoUrl}
                </p>
              ) : (
                <p className="text-xs text-amber-700 mt-2 font-semibold">
                  No logo found. Upload a logo in Header assets to enable auto match.
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {autoPaletteLogoUrl && (
                <img
                  src={autoPaletteLogoUrl}
                  alt="Brand logo preview"
                  className="w-16 h-16 rounded-xl object-contain bg-white border border-gray-200"
                />
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={autoApplying || saving || uploading}
              onClick={handleAutoMatchAppearanceFromLogo}
              className="h-10 px-4 rounded-xl bg-gray-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black disabled:opacity-60 inline-flex items-center gap-2"
            >
              {autoApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Auto Match from Logo
            </button>

            <button
              type="button"
              disabled={autoApplying || saving || uploading}
              onClick={handleAutoGenerateHoverColor}
              className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-black uppercase tracking-widest hover:bg-gray-50 disabled:opacity-60 inline-flex items-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              Auto Hover
            </button>

            <button
              type="button"
              disabled={autoApplying || saving || uploading}
              onClick={handleResetAppearanceDefaults}
              className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-black uppercase tracking-widest hover:bg-gray-50 disabled:opacity-60 inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Defaults
            </button>

            {!autoPaletteLogoUrl && (
              <button
                type="button"
                onClick={() => setActiveTab('header')}
                className="h-10 px-4 rounded-xl border border-primary/30 bg-primary/10 text-primary text-xs font-black uppercase tracking-widest hover:bg-primary/20"
              >
                Go To Header
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 space-y-4">
          <div>
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Live Preview</h4>
            <p className="text-xs text-gray-500 mt-1">
              This preview shows how the storefront cards and buttons will look in light and dark mode.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Primary', key: 'primary_color' },
              { label: 'Primary Hover', key: 'primary_hover_color' },
              { label: 'Accent', key: 'accent_color' },
              { label: 'Success', key: 'success_color' },
              { label: 'Warning', key: 'warning_color' },
              { label: 'Danger', key: 'danger_color' }
            ].map((swatch) => (
              <div key={swatch.key} className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="h-8 rounded-lg border border-gray-200" style={{ backgroundColor: values[swatch.key] || '#ffffff' }} />
                <p className="text-[11px] font-black uppercase tracking-wider text-gray-600 mt-2">{swatch.label}</p>
                <p className="text-[11px] font-mono text-gray-500 truncate">{values[swatch.key] || '-'}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 p-4 space-y-3" style={{ backgroundColor: previewLightBackground, color: previewLightText }}>
              <p className="text-[11px] font-black uppercase tracking-widest opacity-70">Light Mode Preview</p>
              <div className="rounded-lg border p-3" style={{ backgroundColor: previewLightSurface, borderColor: values.border_color_light || DEFAULT_VALUES.border_color_light }}>
                <p className="text-sm font-black">Shop Parts Faster</p>
                <p className="text-xs mt-1" style={{ color: previewLightMuted }}>
                  Buttons, cards, text and border colors update based on your selections.
                </p>
                <button
                  type="button"
                  className="mt-3 h-9 px-4 rounded-lg text-xs font-black uppercase tracking-widest text-white"
                  style={{ backgroundColor: previewPrimary }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = previewPrimaryHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = previewPrimary)}
                >
                  Primary Action
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 p-4 space-y-3" style={{ backgroundColor: previewDarkBackground, color: previewDarkText }}>
              <p className="text-[11px] font-black uppercase tracking-widest opacity-70">Dark Mode Preview</p>
              <div className="rounded-lg border p-3" style={{ backgroundColor: previewDarkSurface, borderColor: values.border_color_dark || DEFAULT_VALUES.border_color_dark }}>
                <p className="text-sm font-black">Premium Performance Theme</p>
                <p className="text-xs mt-1" style={{ color: previewDarkMuted }}>
                  Match your brand logo while keeping readability and contrast in dark mode.
                </p>
                <button
                  type="button"
                  className="mt-3 h-9 px-4 rounded-lg text-xs font-black uppercase tracking-widest text-white"
                  style={{ backgroundColor: previewPrimary }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = previewPrimaryHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = previewPrimary)}
                >
                  Primary Action
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {APPEARANCE_SETTINGS_GROUPS.map((group) => {
            const isShapeGroup = group.fields.includes('border_radius_px') || group.fields.includes('compact_sidebar');
            return (
              <div key={group.title} className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 space-y-3">
                <div>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">{group.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{group.description}</p>
                </div>
                <div className={isShapeGroup ? 'space-y-3' : 'grid grid-cols-1 md:grid-cols-2 gap-3'}>
                  {group.fields.map((key) => renderAppearanceFieldByKey(key))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 flex justify-end">
          <button
            type="button"
            onClick={saveCurrentTab}
            disabled={saving || uploading || autoApplying}
            className="h-11 px-6 rounded-xl bg-primary text-white font-black text-sm hover:bg-red-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  };

  const renderPagesSettingsContent = () => (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Manage Pages</h4>
            <p className="text-xs text-gray-500 mt-1">Add, edit, remove, and reorder company/legal pages shown in footer.</p>
          </div>
          <button
            type="button"
            onClick={addManagedPage}
            className="h-10 px-4 rounded-xl bg-gray-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black"
          >
            + Add Page
          </button>
        </div>

        <div className="space-y-4">
          {managedPages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm font-semibold text-gray-500">
              No pages found. Click "Add Page" to create one.
            </div>
          ) : (
            managedPages.map((page, index) => (
              <div key={page.id} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 h-6 rounded-full bg-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-700">
                      {page.section}
                    </span>
                    <span className="text-xs font-bold text-gray-500">Order #{index + 1}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveManagedPage(page.id, 'up')}
                      disabled={index === 0}
                      className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-black uppercase tracking-widest text-gray-600 disabled:opacity-40"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveManagedPage(page.id, 'down')}
                      disabled={index === managedPages.length - 1}
                      className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-black uppercase tracking-widest text-gray-600 disabled:opacity-40"
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      onClick={() => updateManagedPage(page.id, 'isEnabled', !page.isEnabled)}
                      className={`h-8 px-3 rounded-lg text-xs font-black uppercase tracking-widest ${
                        page.isEnabled
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                    >
                      {page.isEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeManagedPage(page.id)}
                      className="h-8 px-3 rounded-lg border border-red-200 text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Page Title</label>
                    <input
                      type="text"
                      value={page.title}
                      onChange={(e) => updateManagedPage(page.id, 'title', e.target.value)}
                      className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Slug</label>
                    <input
                      type="text"
                      value={page.slug}
                      onChange={(e) => updateManagedPage(page.id, 'slug', e.target.value)}
                      className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold"
                      placeholder="example-page"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Section</label>
                    <select
                      value={page.section}
                      onChange={(e) => updateManagedPage(page.id, 'section', e.target.value as ManagedPageSection)}
                      className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold"
                    >
                      <option value="company">Company</option>
                      <option value="legal">Legal</option>
                    </select>
                  </div>
                  <div className="xl:col-span-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Content</label>
                    <textarea
                      rows={4}
                      value={page.content}
                      onChange={(e) => updateManagedPage(page.id, 'content', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold"
                      placeholder="Write page content..."
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-3 flex justify-end">
        <button
          type="button"
          onClick={saveCurrentTab}
          disabled={saving || uploading}
          className="h-11 px-6 rounded-xl bg-primary text-white font-black text-sm hover:bg-red-700 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  const recentSettings = useMemo(
    () => [...settingsRows].sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || '')).slice(0, 20),
    [settingsRows]
  );

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
        <p className="text-sm font-bold text-gray-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Settings</h2>
        <p className="text-gray-500 font-medium">Manage store-wide settings from one place.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-lg font-black text-gray-900 mb-3 lg:block hidden">Settings</h3>
          {/* Mobile: horizontal scrollable tabs */}
          <div className="flex lg:hidden overflow-x-auto gap-2 pb-1 -mx-1 px-1 scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-gray-900 text-white' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Desktop: vertical list */}
          <div className="hidden lg:flex lg:flex-col space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  activeTab === tab.id ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </aside>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-6">{activeTabConfig.label}</h3>

          {message && (
            <div
              className={`mb-4 rounded-xl px-4 py-3 text-sm font-bold ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {activeTab === 'logs' ? (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-[11px] uppercase tracking-widest font-black text-gray-500">Key</th>
                      <th className="px-4 py-3 text-left text-[11px] uppercase tracking-widest font-black text-gray-500">Value</th>
                      <th className="px-4 py-3 text-left text-[11px] uppercase tracking-widest font-black text-gray-500">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSettings.map((row) => (
                      <tr key={row.key} className="border-t border-gray-100">
                        <td className="px-4 py-3 text-xs font-mono font-bold text-gray-700">{row.key}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-600 max-w-[420px] truncate" title={row.value}>
                          {row.value || '-'}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-500">
                          {row.updated_at ? new Date(row.updated_at).toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'general' ? (
            renderGeneralSettingsContent()
          ) : activeTab === 'header' ? (
            renderHeaderSettingsContent()
          ) : activeTab === 'footer' ? (
            renderFooterSettingsContent()
          ) : activeTab === 'pages' ? (
            renderPagesSettingsContent()
          ) : activeTab === 'appearance' ? (
            renderAppearanceSettingsContent()
          ) : (
            <div className="space-y-5">
              {activeTabConfig.fields.map((field) => (
                <div key={field.key}>{renderField(field)}</div>
              ))}

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={saveCurrentTab}
                  disabled={saving || uploading}
                  className="h-11 px-6 rounded-xl bg-primary text-white font-black text-sm hover:bg-red-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminSettings;
