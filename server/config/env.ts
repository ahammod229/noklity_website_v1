import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const asNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeOriginList = (value: string | undefined) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const serverEnv = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: asNumber(process.env.PORT, 5000),
  mongoUri: String(process.env.MONGO_URI || ''),
  clientOrigins: normalizeOriginList(process.env.CLIENT_ORIGIN || 'http://localhost:3000')
};

export const isProduction = serverEnv.nodeEnv === 'production';

export const requireServerEnv = (key: 'mongoUri') => {
  const value = serverEnv[key];
  if (!value) {
    throw new Error(`Missing required server environment variable for ${key}.`);
  }
  return value;
};
