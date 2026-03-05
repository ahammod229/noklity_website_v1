import { FEATURE_KEYS, FeatureFlags, FeatureKey, TenantPlanName } from '../types/tenant';

const createAllDisabled = (): FeatureFlags =>
  FEATURE_KEYS.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {} as FeatureFlags);

export const PLAN_FEATURE_MATRIX: Record<TenantPlanName, FeatureFlags> = {
  Basic: {
    ...createAllDisabled(),
    catalog_public: true,
    checkout_guest: true,
    payment_bkash: true,
    payment_nogad: true,
    payment_bank_transfer: true,
    support_tickets: true,
    customer_management: true
  },
  Pro: {
    ...createAllDisabled(),
    catalog_public: true,
    checkout_guest: true,
    payment_bkash: true,
    payment_nogad: true,
    payment_bank_transfer: true,
    support_tickets: true,
    hero_banners: true,
    flash_sales: true,
    product_reviews: true,
    media_control: true,
    customer_management: true,
    multi_currency: true,
    custom_pages: true
  },
  Enterprise: {
    ...createAllDisabled(),
    catalog_public: true,
    checkout_guest: true,
    payment_bkash: true,
    payment_nogad: true,
    payment_bank_transfer: true,
    support_tickets: true,
    hero_banners: true,
    flash_sales: true,
    product_reviews: true,
    media_control: true,
    customer_management: true,
    multi_currency: true,
    advanced_analytics: true,
    api_management: true,
    custom_pages: true
  }
};

export const normalizePlanName = (value: string | undefined | null): TenantPlanName => {
  const plan = String(value || '').trim().toLowerCase();
  if (plan === 'basic') return 'Basic';
  if (plan === 'pro') return 'Pro';
  return 'Enterprise';
};

export const normalizeFeatureFlagOverrides = (input: unknown): Partial<FeatureFlags> => {
  if (!input) return {};

  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return normalizeFeatureFlagOverrides(parsed);
    } catch {
      return {};
    }
  }

  if (typeof input !== 'object') return {};

  const source = input as Record<string, unknown>;
  const next: Partial<FeatureFlags> = {};

  for (const key of FEATURE_KEYS) {
    if (!(key in source)) continue;
    const raw = source[key];
    next[key] = raw === true || String(raw).toLowerCase() === 'true';
  }
  return next;
};

export const resolveEffectiveFeatureFlags = (
  planName: TenantPlanName,
  overrides?: Partial<FeatureFlags>
): FeatureFlags => {
  const base = PLAN_FEATURE_MATRIX[planName];
  return {
    ...base,
    ...(overrides || {})
  };
};

export const isFeatureAllowed = (
  feature: FeatureKey,
  planName: TenantPlanName,
  overrides?: Partial<FeatureFlags>
) => {
  const resolved = resolveEffectiveFeatureFlags(planName, overrides);
  return Boolean(resolved[feature]);
};
