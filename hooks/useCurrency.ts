import { useEffect, useMemo, useState } from 'react';
import { getPublicSiteConfig } from '../services/siteConfigService';

const CURRENCY_META = {
  BDT: { locale: 'en-BD', symbol: '৳' },
  USD: { locale: 'en-US', symbol: '$' },
  INR: { locale: 'en-IN', symbol: '₹' }
} as const;

type SupportedCurrency = keyof typeof CURRENCY_META;

interface CurrencyState {
  code: SupportedCurrency;
  locale: string;
  baseCode: SupportedCurrency;
  usdRate: number;
  inrRate: number;
}

const DEFAULT_CURRENCY: CurrencyState = {
  code: 'BDT',
  locale: 'en-BD',
  baseCode: 'BDT',
  usdRate: 121.5,
  inrRate: 1.45
};

const normalizeCurrencyCode = (value: string | undefined, fallback: SupportedCurrency): SupportedCurrency => {
  const raw = String(value || '').trim();
  const normalized = raw.toUpperCase();

  if (normalized.includes('BDT') || normalized === '৳' || normalized === 'TK' || normalized === 'TAKA') return 'BDT';
  if (normalized.includes('USD') || normalized === '$' || normalized === 'US$' || normalized === 'DOLLAR') return 'USD';
  if (normalized.includes('INR') || normalized === '₹' || normalized === 'RUPEE') return 'INR';

  return fallback;
};

const normalizeLocale = (code: SupportedCurrency, locale: string | undefined) => {
  const trimmed = String(locale || '').trim();
  return trimmed || CURRENCY_META[code].locale;
};

export const useCurrency = () => {
  const [currency, setCurrency] = useState<CurrencyState>(DEFAULT_CURRENCY);

  useEffect(() => {
    let mounted = true;

    const loadCurrency = async () => {
      try {
        const config = await getPublicSiteConfig();
        if (!mounted) return;
        const selectedCode = normalizeCurrencyCode(config.currencyCode, DEFAULT_CURRENCY.code);
        const baseCode = normalizeCurrencyCode(config.baseCurrencyCode, DEFAULT_CURRENCY.baseCode);
        setCurrency({
          code: selectedCode,
          locale: normalizeLocale(selectedCode, config.currencyLocale),
          baseCode,
          usdRate: Number(config.exchangeRateUsd || DEFAULT_CURRENCY.usdRate),
          inrRate: Number(config.exchangeRateInr || DEFAULT_CURRENCY.inrRate)
        });
      } catch {
        // Keep default currency when site settings are unavailable.
      }
    };

    loadCurrency();

    const handleSiteConfigUpdated = () => {
      loadCurrency();
    };

    window.addEventListener('site-config-updated', handleSiteConfigUpdated as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener('site-config-updated', handleSiteConfigUpdated as EventListener);
    };
  }, []);

  const rateMap = useMemo(
    () => ({
      BDT: 1,
      USD: currency.usdRate > 0 ? currency.usdRate : DEFAULT_CURRENCY.usdRate,
      INR: currency.inrRate > 0 ? currency.inrRate : DEFAULT_CURRENCY.inrRate
    }),
    [currency.usdRate, currency.inrRate]
  );

  const convertFromBase = (amountInBase: number) => {
    const safeAmount = Number(amountInBase || 0);
    const from = currency.baseCode in rateMap ? currency.baseCode : 'BDT';
    const to = currency.code in rateMap ? currency.code : from;
    const amountInBdt = safeAmount * rateMap[from];
    return amountInBdt / rateMap[to];
  };

  const convertToBase = (amountInSelectedCurrency: number) => {
    const safeAmount = Number(amountInSelectedCurrency || 0);
    const from = currency.code in rateMap ? currency.code : 'BDT';
    const to = currency.baseCode in rateMap ? currency.baseCode : from;
    const amountInBdt = safeAmount * rateMap[from];
    return amountInBdt / rateMap[to];
  };

  const formatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(currency.locale, {
        style: 'currency',
        currency: currency.code,
        maximumFractionDigits: 2
      });
    } catch {
      return new Intl.NumberFormat(CURRENCY_META[currency.code].locale, {
        style: 'currency',
        currency: currency.code,
        maximumFractionDigits: 2
      });
    }
  }, [currency.code, currency.locale]);

  const currencySymbol = useMemo(() => {
    try {
      return (
        new Intl.NumberFormat(currency.locale, {
          style: 'currency',
          currency: currency.code,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).formatToParts(0).find((part) => part.type === 'currency')?.value ||
        CURRENCY_META[currency.code].symbol
      );
    } catch {
      return CURRENCY_META[currency.code].symbol;
    }
  }, [currency.code, currency.locale]);

  const formatCurrency = (amountInBase: number) => formatter.format(convertFromBase(amountInBase));

  return {
    currencyCode: currency.code,
    currencySymbol,
    currencyLocale: currency.locale,
    baseCurrencyCode: currency.baseCode,
    convertFromBase,
    convertToBase,
    formatCurrency
  };
};
