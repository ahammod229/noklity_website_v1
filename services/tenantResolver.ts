/**
 * Optional multi-tenant scaffold helpers.
 *
 * Current production mode is single-tenant per deployment.
 * These helpers are intentionally simple and can be reused in Edge Functions
 * or a future backend when enabling subdomain/header tenant routing.
 */

export interface TenantResolutionInput {
  hostname?: string | null;
  headerTenant?: string | null;
  rootDomain?: string | null;
  fallbackTenantKey?: string;
}

const normalize = (value: string | null | undefined) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');

export const resolveTenantKey = ({
  hostname,
  headerTenant,
  rootDomain,
  fallbackTenantKey = 'default'
}: TenantResolutionInput): string => {
  const fromHeader = normalize(headerTenant);
  if (fromHeader) return fromHeader;

  const host = normalize(hostname);
  if (!host) return fallbackTenantKey;

  const root = normalize(rootDomain);
  if (!root) return fallbackTenantKey;

  // Example:
  //   host: acme.shop.example.com
  //   root: shop.example.com
  // => tenant key: acme
  if (host === root) return fallbackTenantKey;
  if (!host.endsWith(`.${root}`)) return fallbackTenantKey;

  const prefix = host.slice(0, -1 * (`.${root}`).length);
  const firstLabel = prefix.split('.').filter(Boolean)[0];
  return firstLabel || fallbackTenantKey;
};

export const TENANT_HEADER_KEY = 'x-tenant-id';
