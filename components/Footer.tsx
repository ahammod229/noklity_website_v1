import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Facebook, Instagram, Mail, MapPin, Phone, Twitter, Youtube } from 'lucide-react';
import { getPublicSiteConfig, getPublicSiteConfigSnapshot } from '../services/siteConfigService';
import { useTenantConfig } from '../contexts/TenantConfigContext';

const Footer: React.FC = () => {
  const { config: tenantConfig } = useTenantConfig();
  const initialConfig = getPublicSiteConfigSnapshot();
  const [footerText, setFooterText] = useState(initialConfig.footerText || `© 2024 ${tenantConfig.companyName}. All rights reserved.`);
  const [footerLogo, setFooterLogo] = useState(initialConfig.footerLogo || '');
  const [siteName, setSiteName] = useState(initialConfig.siteName || tenantConfig.brandName);
  const [siteUrl, setSiteUrl] = useState(initialConfig.siteUrl || `https://${tenantConfig.domain}`);
  const [siteUrlName, setSiteUrlName] = useState(initialConfig.siteUrlName || tenantConfig.domain);
  const [supportEmail, setSupportEmail] = useState(initialConfig.supportEmail || tenantConfig.supportEmail);
  const [supportPhone, setSupportPhone] = useState(initialConfig.supportPhone || tenantConfig.companyPhone);
  const [supportAddress, setSupportAddress] = useState(initialConfig.supportAddress || tenantConfig.companyAddress);
  const [facebookUrl, setFacebookUrl] = useState(initialConfig.facebookUrl || '');
  const [instagramUrl, setInstagramUrl] = useState(initialConfig.instagramUrl || '');
  const [youtubeUrl, setYoutubeUrl] = useState(initialConfig.youtubeUrl || '');
  const [twitterUrl, setTwitterUrl] = useState(initialConfig.twitterUrl || '');
  const [siteTagline, setSiteTagline] = useState(
    initialConfig.siteTagline || 'Your premium destination for high-performance automotive parts.'
  );
  const [managedPages, setManagedPages] = useState(initialConfig.managedPages || []);
  const [shopLinks, setShopLinks] = useState(initialConfig.shopLinks || []);

  useEffect(() => {
    let mounted = true;

    const loadFooterConfig = async () => {
      try {
        const cfg = await getPublicSiteConfig();
        if (!mounted) return;
        setFooterText(cfg.footerText || `© 2024 ${tenantConfig.companyName}. All rights reserved.`);
        setFooterLogo(cfg.footerLogo || '');
        setSiteName(cfg.siteName || tenantConfig.brandName);
        setSiteUrl(cfg.siteUrl || `https://${tenantConfig.domain}`);
        setSiteUrlName(cfg.siteUrlName || tenantConfig.domain);
        setSupportEmail(cfg.supportEmail || tenantConfig.supportEmail);
        setSupportPhone(cfg.supportPhone || tenantConfig.companyPhone);
        setSupportAddress(cfg.supportAddress || tenantConfig.companyAddress);
        setSiteTagline(cfg.siteTagline || 'Your premium destination for high-performance automotive parts.');
        setFacebookUrl(cfg.facebookUrl || '');
        setInstagramUrl(cfg.instagramUrl || '');
        setYoutubeUrl(cfg.youtubeUrl || '');
        setTwitterUrl(cfg.twitterUrl || '');
        setManagedPages(cfg.managedPages || []);
        setShopLinks(cfg.shopLinks || []);
      } catch {
        // Keep defaults
      }
    };

    loadFooterConfig();
    const handleConfigUpdated = () => {
      loadFooterConfig();
    };
    window.addEventListener('site-config-updated', handleConfigUpdated as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener('site-config-updated', handleConfigUpdated as EventListener);
    };
  }, [tenantConfig.brandName, tenantConfig.companyAddress, tenantConfig.companyName, tenantConfig.companyPhone, tenantConfig.domain, tenantConfig.supportEmail]);

  const socialLinks = useMemo(
    () => [
      { label: 'Facebook', icon: Facebook, url: facebookUrl },
      { label: 'Twitter', icon: Twitter, url: twitterUrl },
      { label: 'Instagram', icon: Instagram, url: instagramUrl },
      { label: 'YouTube', icon: Youtube, url: youtubeUrl }
    ],
    [facebookUrl, twitterUrl, instagramUrl, youtubeUrl]
  );

  const companyLinks = useMemo(
    () =>
      (managedPages || [])
        .filter((item) => item.section === 'company' && item.isEnabled)
        .sort((a, b) => a.order - b.order)
        .map((item) => ({
          label: item.title,
          href: `/page/${item.slug}`
        })),
    [managedPages]
  );

  const legalLinks = useMemo(
    () =>
      (managedPages || [])
        .filter((item) => item.section === 'legal' && item.isEnabled)
        .sort((a, b) => a.order - b.order)
        .map((item) => ({
          label: item.title,
          href: `/page/${item.slug}`
        })),
    [managedPages]
  );

  const supportPageHref = useMemo(() => {
    const supportPage = (managedPages || []).find((item) => item.slug === 'support' && item.isEnabled);
    if (supportPage) return `/page/${supportPage.slug}`;
    return companyLinks[0]?.href || '/help';
  }, [managedPages, companyLinks]);

  const footerShopLinks = useMemo(
    () =>
      (shopLinks || [])
        .filter((item) => item?.isEnabled !== false && (item?.label || '').trim())
        .sort((a, b) => (a.order || 0) - (b.order || 0)),
    [shopLinks]
  );

  const isExternalHref = (href: string) =>
    /^https?:\/\//i.test(href) || /^(mailto|tel):/i.test(href);

  return (
    <footer className="print:hidden mt-14 sm:mt-20 bg-slate-950 text-slate-100 border-t border-slate-800">
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] sm:tracking-[0.28em] font-black text-primary">{siteName} Performance Hub</p>
            <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight">Built For Drivers Who Demand More</h3>
          </div>
          <a
            href={supportPageHref}
            className="inline-flex items-center justify-center gap-2 h-11 w-full sm:w-auto px-6 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-colors"
          >
            Contact Support
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8">
          <div className="sm:col-span-2 lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-3xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              {footerLogo ? (
                <img src={footerLogo} alt={`${siteName} footer logo`} className="h-11 w-auto object-contain" />
              ) : (
                <>
                  <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-white font-black text-lg">{(siteName || 'S').slice(0, 1)}</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-white">{siteName}</span>
                </>
              )}
            </div>
            <p className="text-sm leading-7 text-slate-300 max-w-xl">{siteTagline}</p>
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center mt-3 text-xs font-bold text-primary hover:text-red-300 transition-colors"
            >
              {siteUrlName}
              <ArrowUpRight className="w-3 h-3 ml-1" />
            </a>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
              <a href={`mailto:${supportEmail}`} className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 hover:border-slate-700 transition-colors">
                <Mail className="w-4 h-4 mt-0.5 text-primary" />
                <span className="text-xs font-bold text-slate-200 break-all">{supportEmail}</span>
              </a>
              <a href={`tel:${supportPhone}`} className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 hover:border-slate-700 transition-colors">
                <Phone className="w-4 h-4 mt-0.5 text-primary" />
                <span className="text-xs font-bold text-slate-200">{supportPhone}</span>
              </a>
              <div className="md:col-span-2 flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <span className="text-xs font-bold text-slate-200">{supportAddress}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return social.url ? (
                  <a
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-10 h-10 rounded-full bg-slate-800 text-slate-300 border border-slate-700 hover:border-primary hover:text-white hover:bg-primary/20 transition-colors flex items-center justify-center"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ) : (
                  <span
                    key={social.label}
                    aria-label={`${social.label} not configured`}
                    className="w-10 h-10 rounded-full bg-slate-900 text-slate-600 border border-slate-800 flex items-center justify-center cursor-not-allowed"
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                );
              })}
            </div>
          </div>

          <div className="sm:col-span-1 lg:col-span-3">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-200 mb-4">Shop</h4>
            <ul className="space-y-3">
              {footerShopLinks.length === 0 ? (
                <li>
                  <span className="text-sm font-semibold text-slate-500">No shop links configured</span>
                </li>
              ) : (
                footerShopLinks.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.href || '/'}
                      target={isExternalHref(item.href || '') ? '_blank' : undefined}
                      rel={isExternalHref(item.href || '') ? 'noopener noreferrer' : undefined}
                      className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="sm:col-span-1 lg:col-span-2">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-200 mb-4">Company</h4>
            <ul className="space-y-3">
              {companyLinks.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="sm:col-span-1 lg:col-span-2">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-200 mb-4">Legal</h4>
            <ul className="space-y-3">
              {legalLinks.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col md:flex-row gap-3 md:items-center md:justify-between text-center md:text-left">
          <p className="text-xs font-semibold text-slate-500">{footerText}</p>
          <p className="text-xs font-semibold text-slate-500">Secured checkout • Verified payments • Fast delivery</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
