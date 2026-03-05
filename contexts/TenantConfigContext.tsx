import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { FeatureKey, TenantRuntimeConfig } from '../types/tenant';
import { getTenantConfig, getTenantConfigSnapshot } from '../services/tenantConfigService';

interface TenantConfigContextValue {
  config: TenantRuntimeConfig;
  isLoading: boolean;
  canUseFeature: (feature: FeatureKey) => boolean;
  refresh: () => Promise<void>;
}

const TenantConfigContext = createContext<TenantConfigContextValue | undefined>(undefined);

export const TenantConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<TenantRuntimeConfig>(() => getTenantConfigSnapshot());
  const [isLoading, setIsLoading] = useState(false);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const next = await getTenantConfig();
      setConfig(next);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadConfig();
    const onUpdated = () => {
      void loadConfig();
    };
    window.addEventListener('tenant-config-updated', onUpdated as EventListener);
    window.addEventListener('site-config-updated', onUpdated as EventListener);
    return () => {
      window.removeEventListener('tenant-config-updated', onUpdated as EventListener);
      window.removeEventListener('site-config-updated', onUpdated as EventListener);
    };
  }, []);

  const value = useMemo<TenantConfigContextValue>(
    () => ({
      config,
      isLoading,
      canUseFeature: (feature) => Boolean(config.featureFlags[feature]),
      refresh: loadConfig
    }),
    [config, isLoading]
  );

  return <TenantConfigContext.Provider value={value}>{children}</TenantConfigContext.Provider>;
};

export const useTenantConfig = () => {
  const context = useContext(TenantConfigContext);
  if (!context) {
    throw new Error('useTenantConfig must be used within TenantConfigProvider');
  }
  return context;
};
