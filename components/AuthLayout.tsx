import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTenantConfig } from '../contexts/TenantConfigContext';
import { getPublicSiteConfig, getPublicSiteConfigSnapshot } from '../services/siteConfigService';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  onBack?: () => void;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle, onBack }) => {
  const { config } = useTenantConfig();
  const initialSiteConfig = getPublicSiteConfigSnapshot();
  const [siteName, setSiteName] = useState(initialSiteConfig.siteName || config.brandName || 'Storefront');
  const [logoSrc, setLogoSrc] = useState(
    initialSiteConfig.headerLogoLight || initialSiteConfig.headerLogoDark || config.brandLogoUrl || ''
  );
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadBranding = async () => {
      try {
        const cfg = await getPublicSiteConfig();
        if (!mounted) return;
        setSiteName(cfg.siteName || config.brandName || 'Storefront');
        setLogoSrc(cfg.headerLogoLight || cfg.headerLogoDark || config.brandLogoUrl || '');
      } catch {
        if (!mounted) return;
        setSiteName(config.brandName || 'Storefront');
        setLogoSrc(config.brandLogoUrl || '');
      }
    };

    loadBranding();
    const handleSiteConfigUpdated = () => {
      loadBranding();
    };
    window.addEventListener('site-config-updated', handleSiteConfigUpdated as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener('site-config-updated', handleSiteConfigUpdated as EventListener);
    };
  }, [config.brandLogoUrl, config.brandName]);

  useEffect(() => {
    setLogoLoadFailed(false);
  }, [logoSrc]);

  const fallbackLogo = useMemo(() => {
    const encodedName = encodeURIComponent(siteName || config.brandName || 'Storefront');
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 52'%3E%3Cpath fill='%23DC2626' d='M15 5 L5 47 L30 47 L40 5 Z'/%3E%3Ctext x='52' y='39' font-family='sans-serif' font-weight='900' font-size='32' fill='%23111827' letter-spacing='-1'%3E${encodedName}%3C/text%3E%3C/svg%3E`;
  }, [config.brandName, siteName]);

  const activeLogoSrc = !logoLoadFailed && logoSrc ? logoSrc : fallbackLogo;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        {onBack && (
          <div className="mb-3">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img
              src={activeLogoSrc}
              alt={siteName}
              className="h-10 w-auto max-w-[240px] object-contain"
              onError={() => setLogoLoadFailed(true)}
            />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
            {title}
          </h1>
          <p className="text-gray-500 text-sm">
            {subtitle}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            {children}
          </div>
        </div>

        {/* Footer info/links could go here if needed globally */}
      </div>
    </div>
  );
};

export default AuthLayout;
