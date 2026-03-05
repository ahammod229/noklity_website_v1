const parseEmailList = (value: string | undefined) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]) {
    return String((import.meta as any).env[key]);
  }
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return String(process.env[key]);
  }
  return '';
};

const SUPER_ADMIN_EMAILS = parseEmailList(getEnv('VITE_SUPER_ADMIN_EMAILS'));

export const isSuperAdminEmail = (email?: string | null) => {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return SUPER_ADMIN_EMAILS.includes(normalized);
};

