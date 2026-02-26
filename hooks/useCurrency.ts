import { useEffect, useMemo, useState } from 'react';
import { getPublicSiteConfig } from '../services/siteConfigService';

interface CurrencyState {
  code: string;
  locale: string;
  baseCode: string;
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

export const useCurrency = () => {
  const [currency, setCurrency] = useState<CurrencyState>(DEFAULT_CURRENCY);

  useEffect(() => {
    let mounted = true;

    const loadCurrency = async () => {
      try {
        const config = await getPublicSiteConfig();
        if (!mounted) return;
        setCurrency({
          code: config.currencyCode || DEFAULT_CURRENCY.code,
          locale: config.currencyLocale || DEFAULT_CURRENCY.locale,
          baseCode: config.baseCurrencyCode || DEFAULT_CURRENCY.baseCode,
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
    const from = currency.baseCode in rateMap ? (currency.baseCode as keyof typeof rateMap) : 'BDT';
    const to = currency.code in rateMap ? (currency.code as keyof typeof rateMap) : from;
    const amountInBdt = safeAmount * rateMap[from];
    return amountInBdt / rateMap[to];
  };

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(currency.locale, {
        style: 'currency',
        currency: currency.code,
        maximumFractionDigits: 2
      }),
    [currency.code, currency.locale]
  );

  const formatCurrency = (amountInBase: number) => formatter.format(convertFromBase(amountInBase));

  return {
    currencyCode: currency.code,
    currencyLocale: currency.locale,
    baseCurrencyCode: currency.baseCode,
    convertFromBase,
    formatCurrency
  };
};
