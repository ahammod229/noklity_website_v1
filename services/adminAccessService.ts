const parseEmailList = (value: string | undefined) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

const getEnv = (viteKey: string | undefined, processKey: string) => {
  if (viteKey !== undefined) {
    return String(viteKey);
  }
  if (typeof process !== 'undefined' && process.env?.[processKey]) {
    return String(process.env[processKey]);
  }
  return '';
};

const SUPER_ADMIN_EMAILS = parseEmailList(getEnv(import.meta.env.VITE_SUPER_ADMIN_EMAILS, 'VITE_SUPER_ADMIN_EMAILS'));

export const isSuperAdminEmail = (email?: string | null) => {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return SUPER_ADMIN_EMAILS.includes(normalized);
};

