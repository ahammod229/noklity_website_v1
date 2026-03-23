import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, 'public');
const tenantConfigPath = path.join(projectRoot, 'config', 'tenant.json');
const envFiles = ['.env.local', '.env'];

const readFileSafe = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
};

const parseEnvFile = (content) => {
  const entries = {};
  content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .forEach((line) => {
      const separatorIndex = line.indexOf('=');
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
      if (key) entries[key] = value;
    });
  return entries;
};

const env = envFiles.reduce((acc, fileName) => {
  const filePath = path.join(projectRoot, fileName);
  return { ...acc, ...parseEnvFile(readFileSafe(filePath)) };
}, {});

const tenantConfig = JSON.parse(readFileSafe(tenantConfigPath) || '{}');
const siteUrl = `https://${tenantConfig.domain || 'noklity.com'}`.replace(/\/+$/, '');
const supabaseUrl = (env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || '';

const staticRoutes = [
  { loc: `${siteUrl}/`, changefreq: 'daily', priority: '1.0' },
  { loc: `${siteUrl}/search`, changefreq: 'daily', priority: '0.9' },
  { loc: `${siteUrl}/help`, changefreq: 'weekly', priority: '0.7' },
  { loc: `${siteUrl}/page/about`, changefreq: 'monthly', priority: '0.7' },
  { loc: `${siteUrl}/page/contact`, changefreq: 'monthly', priority: '0.7' },
  { loc: `${siteUrl}/page/support`, changefreq: 'monthly', priority: '0.6' },
  { loc: `${siteUrl}/page/shipping-policy`, changefreq: 'monthly', priority: '0.6' },
  { loc: `${siteUrl}/page/privacy-policy`, changefreq: 'monthly', priority: '0.6' },
  { loc: `${siteUrl}/page/terms-of-service`, changefreq: 'monthly', priority: '0.6' },
  { loc: `${siteUrl}/page/payment-policy`, changefreq: 'monthly', priority: '0.6' },
  { loc: `${siteUrl}/page/refund-policy`, changefreq: 'monthly', priority: '0.6' }
];

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const toSlugPath = (row) => {
  const raw = String(row?.slug || row?.id || '').trim();
  if (!raw) return '';
  return `${siteUrl}/product/${encodeURIComponent(raw)}`;
};

const isVisibleProduct = (row) => {
  const normalizedStatus = String(row?.status || '').trim().toLowerCase();
  return normalizedStatus !== 'inactive' && row?.is_active !== false;
};

const fetchProducts = async () => {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Skipping dynamic product URLs for sitemap: Supabase env is missing.');
    return [];
  }

  const endpoint = `${supabaseUrl}/rest/v1/products?select=id,slug,status,is_active,updated_at,created_at&order=created_at.desc`;
  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      }
    });

    if (!response.ok) {
      console.warn(`Skipping dynamic product URLs for sitemap: Supabase responded ${response.status}.`);
      return [];
    }

    const rows = await response.json();
    return Array.isArray(rows)
      ? rows
          .filter(isVisibleProduct)
          .map((row) => ({
            loc: toSlugPath(row),
            changefreq: 'weekly',
            priority: '0.8',
            lastmod: row.updated_at || row.created_at || undefined
          }))
          .filter((item) => item.loc)
      : [];
  } catch (error) {
    console.warn('Skipping dynamic product URLs for sitemap due to fetch error.');
    return [];
  }
};

const writeSitemap = async () => {
  const productRoutes = await fetchProducts();
  const allRoutes = [...staticRoutes, ...productRoutes];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(
    (route) => `  <url>
    <loc>${escapeXml(route.loc)}</loc>
    ${route.lastmod ? `<lastmod>${escapeXml(route.lastmod)}</lastmod>` : ''}
    <changefreq>${escapeXml(route.changefreq)}</changefreq>
    <priority>${escapeXml(route.priority)}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf8');
  console.log(`Generated sitemap.xml with ${allRoutes.length} URLs.`);
};

await writeSitemap();
