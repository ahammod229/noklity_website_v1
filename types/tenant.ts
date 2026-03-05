export const TENANT_PLANS = ['Basic', 'Pro', 'Enterprise'] as const;
export type TenantPlanName = (typeof TENANT_PLANS)[number];

export const FEATURE_KEYS = [
  'catalog_public',
  'checkout_guest',
  'payment_bkash',
  'payment_nogad',
  'payment_bank_transfer',
  'support_tickets',
  'hero_banners',
  'flash_sales',
  'product_reviews',
  'media_control',
  'customer_management',
  'multi_currency',
  'advanced_analytics',
  'api_management',
  'custom_pages'
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export type FeatureFlags = Record<FeatureKey, boolean>;

export interface TenantConfig {
  brandName: string;
  brandLogoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  supportEmail: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  domain: string;
  allowedHosts: string[];
  timezone: string;
  currency: string;
  planName: TenantPlanName;
  featureFlags: FeatureFlags;
  licenseKey: string;
  licenseStatus: 'active' | 'inactive' | 'expired' | 'invalid';
}

export interface TenantRuntimeConfig extends TenantConfig {
  licenseValid: boolean;
  resolvedPlanName: TenantPlanName;
}
