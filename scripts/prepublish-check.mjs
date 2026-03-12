import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const fail = (message) => {
  console.error(`❌ ${message}`);
  process.exit(1);
};

const pass = (message) => console.log(`✅ ${message}`);

const read = (relativePath) => {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`Missing file: ${relativePath}`);
  }
  return fs.readFileSync(absolutePath, 'utf8');
};

const scanFiles = (dir) => {
  const absolute = path.join(root, dir);
  const entries = fs.readdirSync(absolute, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...scanFiles(rel));
      continue;
    }
    if (/\.(ts|tsx|js|jsx|mjs|cjs|json|md|html|css)$/i.test(entry.name)) {
      files.push(rel);
    }
  }
  return files;
};

const viteConfig = read('vite.config.ts');
if (
  viteConfig.includes('process.env.GEMINI_API_KEY') ||
  viteConfig.includes('process.env.API_KEY')
) {
  fail('vite.config.ts still injects sensitive API keys into frontend bundle.');
}
pass('No secret env injection found in Vite define config');

if (!fs.existsSync(path.join(root, 'public/.htaccess'))) {
  fail('Missing public/.htaccess for cPanel hardening.');
}
pass('cPanel hardening file (public/.htaccess) exists');

const leakPatterns = [
  { key: 'Supabase personal token', pattern: /sbp_[a-z0-9]{20,}/i },
  { key: 'AWS access key', pattern: /AKIA[0-9A-Z]{16}/ },
  { key: 'JWT-like secret', pattern: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/ },
];

const ignore = new Set([
  '.env.local',
  'node_modules',
  'dist',
  '.git',
]);

const sourceFiles = scanFiles('.').filter((file) => {
  const top = file.split(path.sep)[0];
  return !ignore.has(top);
});

for (const file of sourceFiles) {
  const content = read(file);
  for (const rule of leakPatterns) {
    if (rule.pattern.test(content)) {
      fail(`Potential ${rule.key} leak in ${file}`);
    }
  }
}
pass('No common secret leak patterns found in tracked source files');

console.log('\n🎉 Pre-publish checks passed.');
