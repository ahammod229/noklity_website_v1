import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

const fail = (message) => {
  console.error(`❌ ${message}`);
  process.exit(1);
};

const pass = (message) => {
  console.log(`✅ ${message}`);
};

const readUtf8 = (relativePath) => {
  const absolutePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(absolutePath, 'utf8');
};

const readJson = (relativePath) => {
  try {
    return JSON.parse(readUtf8(relativePath));
  } catch (error) {
    fail(`Invalid JSON in ${relativePath}: ${error.message}`);
  }
};

const tenantConfig = readJson('config/tenant.json');
const requiredTenantKeys = [
  'brandName',
  'brandLogoUrl',
  'primaryColor',
  'secondaryColor',
  'supportEmail',
  'companyName',
  'companyAddress',
  'companyPhone',
  'domain',
  'allowedHosts',
  'timezone',
  'currency',
  'planName',
  'featureFlags',
  'licenseKey',
  'licenseStatus'
];

requiredTenantKeys.forEach((key) => {
  if (!(key in tenantConfig)) {
    fail(`config/tenant.json is missing key: ${key}`);
  }
});
pass('tenant.json contains required productization keys');

const requiredFeatures = [
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
];

requiredFeatures.forEach((featureKey) => {
  if (!(featureKey in tenantConfig.featureFlags)) {
    fail(`tenant feature flag missing in tenant.json: ${featureKey}`);
  }
});
pass('tenant.json includes all expected feature flags');

const envExample = readUtf8('.env.example');
[
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_TENANT_BRAND_NAME',
  'VITE_TENANT_PLAN_NAME',
  'VITE_TENANT_LICENSE_KEY',
  'VITE_SUPER_ADMIN_EMAILS'
].forEach((envKey) => {
  if (!envExample.includes(envKey)) {
    fail(`.env.example missing ${envKey}`);
  }
});
pass('.env.example contains core tenant + auth keys');

const guardChecks = [
  {
    file: 'services/orderService.ts',
    patterns: ['checkout_guest', 'payment_bkash', 'payment_nogad', 'payment_bank_transfer']
  },
  {
    file: 'services/supportService.ts',
    patterns: ['support_tickets']
  },
  {
    file: 'services/productService.ts',
    patterns: ['catalog_public', 'flash_sales']
  },
  {
    file: 'supabase/functions/bkash-create-payment/index.ts',
    patterns: ['tenant_plan_name', 'tenant_feature_flags', 'payment_bkash']
  }
];

guardChecks.forEach(({ file, patterns }) => {
  const source = readUtf8(file);
  patterns.forEach((pattern) => {
    if (!source.includes(pattern)) {
      fail(`Missing feature guard pattern "${pattern}" in ${file}`);
    }
  });
});
pass('feature enforcement checks are present in service + edge-function layers');

[
  'docs/NEW_CUSTOMER_SETUP.md',
  'docs/WHITE_LABEL_CUSTOMIZATION.md',
  'docs/PLAN_FEATURE_FLAGS.md',
  'docs/UPGRADE_GUIDE.md'
].forEach((docPath) => {
  readUtf8(docPath);
});
pass('documentation files exist');

console.log('\n🎉 Productization checks passed.');
