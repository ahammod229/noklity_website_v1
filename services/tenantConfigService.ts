import tenantFileConfig from '../config/tenant.json';
import { supabase } from '../lib/supabase';
import { FeatureFlags, FeatureKey, TenantConfig, TenantRuntimeConfig } from '../types/tenant';
import {
  normalizeFeatureFlagOverrides,
  normalizePlanName,
  resolveEffectiveFeatureFlags
} from './tenantFeatureService';

const TENANT_CONFIG_CACHE_KEY = 'noklity_tenant_config_v1';
const TENANT_CACHE_TTL_MS = 60_000;
const LICENSE_BYPASS_ENV = 'VITE_TENANT_LICENSE_BYPASS';
const LICENSE_PATTERN = /^NXL-(BASIC|PRO|ENTERPRISE)-[A-Z0-9]{8,}-[A-Z0-9]{4,}$/i;
const mergeAllowedHosts = (primary: unknown, fallback: unknown) => {
  const merged = [
    ...parseAllowedHosts(primary, []),
    ...parseAllowedHosts(fallback, [])
  ];
  return Array.from(new Set(merged));
};

let tenantCache: TenantRuntimeConfig | null = null;
let tenantCacheUpdatedAt = 0;
let inflightTenantConfigPromise: Promise<TenantRuntimeConfig> | null = null;

const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return String((import.meta as any).env[key]);
  }
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return String(process.env[key]);
  }
  return '';
};

const parseCsv = (value: string | undefined) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

const normalizeHost = (value: string) =>
  value
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')
    .split(':')[0]
    .trim();

const parseAllowedHosts = (input: unknown, fallback: string[]) => {
  if (!input) return fallback;
  if (Array.isArray(input)) {
    const next = input
      .map((item) => normalizeHost(String(item || '')))
      .filter(Boolean);
    return next.length > 0 ? next : fallback;
  }

  const raw = String(input || '').trim();
  if (!raw) return fallback;
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parseAllowedHosts(parsed, fallback);
      }
    } catch {
      return fallback;
    }
  }

  const csv = parseCsv(raw).map(normalizeHost).filter(Boolean);
  return csv.length > 0 ? csv : fallback;
};

const parseBoolean = (value: unknown, fallback = false) => {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  const raw = String(value).toLowerCase().trim();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return fallback;
};

const normalizeConfigShape = (input: Partial<TenantConfig>): TenantConfig => {
  const fallback = tenantFileConfig as TenantConfig;
  const featureOverrides = normalizeFeatureFlagOverrides(input.featureFlags);
  return {
    brandName: String(input.brandName || fallback.brandName || 'Storefront'),
    brandLogoUrl: String(input.brandLogoUrl || fallback.brandLogoUrl || ''),
    primaryColor: String(input.primaryColor || fallback.primaryColor || '#e11d48'),
    secondaryColor: String(input.secondaryColor || fallback.secondaryColor || '#0f172a'),
    supportEmail: String(input.supportEmail || fallback.supportEmail || 'support@example.com'),
    companyName: String(input.companyName || fallback.companyName || 'Company'),
    companyAddress: String(input.companyAddress || fallback.companyAddress || ''),
    companyPhone: String(input.companyPhone || fallback.companyPhone || ''),
    domain: normalizeHost(String(input.domain || fallback.domain || 'localhost')),
    allowedHosts: mergeAllowedHosts(input.allowedHosts, fallback.allowedHosts).length
      ? mergeAllowedHosts(input.allowedHosts, fallback.allowedHosts)
      : ['localhost', '127.0.0.1'],
    timezone: String(input.timezone || fallback.timezone || 'UTC'),
    currency: String(input.currency || fallback.currency || 'USD').toUpperCase(),
    planName: normalizePlanName(String(input.planName || fallback.planName || 'Basic')),
    featureFlags: resolveEffectiveFeatureFlags(
      normalizePlanName(String(input.planName || fallback.planName || 'Basic')),
      featureOverrides
    ),
    licenseKey: String(input.licenseKey || fallback.licenseKey || ''),
    licenseStatus: (String(input.licenseStatus || fallback.licenseStatus || 'inactive').toLowerCase() as TenantConfig['licenseStatus'])
  };
};

const getLicenseBypass = () => parseBoolean(getEnv(LICENSE_BYPASS_ENV), false);

const validateLicense = (licenseKey: string, licenseStatus: TenantConfig['licenseStatus'], planName: string) => {
  if (getLicenseBypass()) return true;
  if (licenseStatus !== 'active') return false;
  const match = licenseKey.trim().toUpperCase().match(LICENSE_PATTERN);
  if (!match) return false;
  return match[1] === planName.toUpperCase();
};

const asRuntimeConfig = (config: TenantConfig): TenantRuntimeConfig => {
  const licenseValid = validateLicense(config.licenseKey, config.licenseStatus, config.planName);
  const resolvedPlanName = licenseValid ? config.planName : 'Basic';
  const overrides = normalizeFeatureFlagOverrides(config.featureFlags);
  return {
    ...config,
    planName: normalizePlanName(config.planName),
    resolvedPlanName,
    licenseValid,
    featureFlags: resolveEffectiveFeatureFlags(resolvedPlanName, overrides)
  };
};

const loadFromStorage = (): TenantRuntimeConfig | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(TENANT_CONFIG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TenantConfig>;
    return asRuntimeConfig(normalizeConfigShape(parsed));
  } catch {
    return null;
  }
};

const saveToStorage = (config: TenantRuntimeConfig) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TENANT_CONFIG_CACHE_KEY, JSON.stringify(config));
  } catch {
    // Ignore quota/private-mode errors.
  }
};

const getDbConfig = async (): Promise<Partial<TenantConfig>> => {
  const { data, error } = await supabase.from('site_settings').select('key,value');
  if (error || !data) return {};

  const map = new Map<string, string>();
  for (const row of data as Array<{ key: string; value: string }>) {
    map.set(row.key, row.value || '');
  }

  return {
    brandName: map.get('tenant_brand_name') || map.get('site_name') || undefined,
    brandLogoUrl:
      map.get('tenant_brand_logo_url') || map.get('header_logo_light') || map.get('header_logo_dark') || undefined,
    primaryColor: map.get('tenant_primary_color') || map.get('primary_color') || undefined,
    secondaryColor: map.get('tenant_secondary_color') || map.get('accent_color') || undefined,
    supportEmail: map.get('tenant_support_email') || map.get('support_email') || undefined,
    companyName: map.get('tenant_company_name') || map.get('site_name') || undefined,
    companyAddress: map.get('tenant_company_address') || map.get('support_address') || undefined,
    companyPhone: map.get('tenant_company_phone') || map.get('support_phone') || undefined,
    domain: map.get('tenant_domain') || map.get('site_url_name') || undefined,
    allowedHosts: map.get('tenant_allowed_hosts') || '',
    timezone: map.get('tenant_timezone') || map.get('timezone') || undefined,
    currency: map.get('tenant_currency') || map.get('currency_code') || undefined,
    planName: normalizePlanName(map.get('tenant_plan_name') || 'Enterprise'),
    featureFlags: normalizeFeatureFlagOverrides(map.get('tenant_feature_flags')),
    licenseKey: map.get('tenant_license_key') || '',
    licenseStatus: (map.get('tenant_license_status') as TenantConfig['licenseStatus']) || 'inactive'
  };
};

const getEnvConfig = (): Partial<TenantConfig> => {
  const envFeatureFlags = normalizeFeatureFlagOverrides(getEnv('VITE_TENANT_FEATURE_FLAGS'));
  return {
    brandName: getEnv('VITE_TENANT_BRAND_NAME') || undefined,
    brandLogoUrl: getEnv('VITE_TENANT_BRAND_LOGO_URL') || undefined,
    primaryColor: getEnv('VITE_TENANT_PRIMARY_COLOR') || undefined,
    secondaryColor: getEnv('VITE_TENANT_SECONDARY_COLOR') || undefined,
    supportEmail: getEnv('VITE_TENANT_SUPPORT_EMAIL') || undefined,
    companyName: getEnv('VITE_TENANT_COMPANY_NAME') || undefined,
    companyAddress: getEnv('VITE_TENANT_COMPANY_ADDRESS') || undefined,
    companyPhone: getEnv('VITE_TENANT_COMPANY_PHONE') || undefined,
    domain: getEnv('VITE_TENANT_DOMAIN') || undefined,
    allowedHosts: parseAllowedHosts(getEnv('VITE_TENANT_ALLOWED_HOSTS'), []),
    timezone: getEnv('VITE_TENANT_TIMEZONE') || undefined,
    currency: getEnv('VITE_TENANT_CURRENCY') || undefined,
    planName: normalizePlanName(getEnv('VITE_TENANT_PLAN_NAME')),
    featureFlags: envFeatureFlags,
    licenseKey: getEnv('VITE_TENANT_LICENSE_KEY') || undefined,
    licenseStatus: (getEnv('VITE_TENANT_LICENSE_STATUS') as TenantConfig['licenseStatus']) || undefined
  };
};

const getDefaultConfig = (): TenantConfig => normalizeConfigShape(tenantFileConfig as TenantConfig);

export const getTenantConfigSnapshot = (): TenantRuntimeConfig => {
  if (tenantCache) return tenantCache;
  const stored = loadFromStorage();
  if (stored) {
    tenantCache = stored;
    tenantCacheUpdatedAt = Date.now();
    return stored;
  }
  tenantCache = asRuntimeConfig(getDefaultConfig());
  tenantCacheUpdatedAt = Date.now();
  return tenantCache;
};

export const getTenantConfig = async (): Promise<TenantRuntimeConfig> => {
  if (tenantCache && Date.now() - tenantCacheUpdatedAt < TENANT_CACHE_TTL_MS) {
    return tenantCache;
  }

  if (!tenantCache) {
    const stored = loadFromStorage();
    if (stored) {
      tenantCache = stored;
      tenantCacheUpdatedAt = Date.now();
    }
  }

  if (inflightTenantConfigPromise) {
    return inflightTenantConfigPromise;
  }

  inflightTenantConfigPromise = (async () => {
    const defaults = getDefaultConfig();
    const dbConfig = await getDbConfig();
    const envConfig = getEnvConfig();
    const merged = normalizeConfigShape({
      ...defaults,
      ...dbConfig,
      ...envConfig,
      featureFlags: {
        ...normalizeFeatureFlagOverrides(defaults.featureFlags),
        ...normalizeFeatureFlagOverrides(dbConfig.featureFlags),
        ...normalizeFeatureFlagOverrides(envConfig.featureFlags)
      }
    });
    tenantCache = asRuntimeConfig(merged);
    tenantCacheUpdatedAt = Date.now();
    saveToStorage(tenantCache);
    return tenantCache;
  })();

  try {
    return await inflightTenantConfigPromise;
  } finally {
    inflightTenantConfigPromise = null;
  }
};

export const clearTenantConfigCache = () => {
  tenantCache = null;
  tenantCacheUpdatedAt = 0;
  inflightTenantConfigPromise = null;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(TENANT_CONFIG_CACHE_KEY);
    } catch {
      // Ignore storage errors.
    }
    window.dispatchEvent(new CustomEvent('tenant-config-updated'));
  }
};

export const canUseFeature = async (featureKey: FeatureKey): Promise<boolean> => {
  const config = await getTenantConfig();
  return Boolean(config.featureFlags[featureKey]);
};

export const canUseFeatureSnapshot = (featureKey: FeatureKey): boolean => {
  const config = getTenantConfigSnapshot();
  return Boolean(config.featureFlags[featureKey]);
};

export const assertFeatureEnabled = async (featureKey: FeatureKey, fallbackMessage?: string) => {
  const enabled = await canUseFeature(featureKey);
  if (!enabled) {
    throw new Error(fallbackMessage || `Feature "${featureKey}" is disabled for this plan.`);
  }
};

export const isHostAllowed = (hostOrUrl: string, config: TenantRuntimeConfig) => {
  const normalizedHost = normalizeHost(hostOrUrl);
  if (!normalizedHost) return true;

  // Always allow local development hosts (localhost, local IPs, tunnel services)
  const devHostPatterns = [
    'localhost',
    '127.0.0.1',
  ];
  if (devHostPatterns.includes(normalizedHost)) return true;

  // Allow local network IPs: 192.168.x.x, 172.x.x.x, 10.x.x.x
  if (
    /^192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(normalizedHost) ||
    /^172\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(normalizedHost) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(normalizedHost)
  ) return true;

  // Allow tunnel domains for mobile testing
  if (
    normalizedHost.endsWith('.loca.lt') ||
    normalizedHost.endsWith('.trycloudflare.com') ||
    normalizedHost.endsWith('.ngrok.io') ||
    normalizedHost.endsWith('.ngrok-free.app')
  ) return true;

  return config.allowedHosts.some((allowedHost) => {
    if (!allowedHost) return false;
    return normalizedHost === allowedHost || normalizedHost.endsWith(`.${allowedHost}`);
  });
};

export const getFeatureFlagsJson = (featureFlags: FeatureFlags) => JSON.stringify(featureFlags);
