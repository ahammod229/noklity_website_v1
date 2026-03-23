import React, { useEffect, useMemo, useState } from 'react';
import { getPublicSiteConfig, getPublicSiteConfigSnapshot } from '../services/siteConfigService';

interface SeoHeadProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  imageAlt?: string;
  robots?: string;
  keywords?: string;
  type?: 'website' | 'product' | 'article';
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>> | null;
}

const upsertMeta = (selector: string, attributes: Record<string, string>, content?: string) => {
  if (typeof document === 'undefined') return;

  const existing = document.head.querySelector(selector);
  if (!content) {
    existing?.remove();
    return;
  }

  const element = existing || document.createElement('meta');
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  element.setAttribute('content', content);
  if (!existing) {
    document.head.appendChild(element);
  }
};

const upsertLink = (rel: string, href?: string) => {
  if (typeof document === 'undefined') return;

  const existing = document.head.querySelector(`link[rel='${rel}']`);
  if (!href) {
    existing?.remove();
    return;
  }

  const element = (existing as HTMLLinkElement | null) || document.createElement('link');
  element.setAttribute('rel', rel);
  element.setAttribute('href', href);
  if (!existing) {
    document.head.appendChild(element);
  }
};

const upsertStructuredData = (payload?: string) => {
  if (typeof document === 'undefined') return;

  const existing = document.head.querySelector('#noklity-seo-jsonld');
  if (!payload) {
    existing?.remove();
    return;
  }

  const script = (existing as HTMLScriptElement | null) || document.createElement('script');
  script.id = 'noklity-seo-jsonld';
  script.type = 'application/ld+json';
  script.textContent = payload;
  if (!existing) {
    document.head.appendChild(script);
  }
};

const normalizeBaseUrl = (value?: string) => {
  const fallback =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://noklity.com';

  const candidate = (value || fallback).trim();
  return candidate.replace(/\/+$/, '') || fallback;
};

const toAbsoluteUrl = (value: string | undefined, baseUrl: string) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return `${baseUrl}${normalizedPath}`;
};

const SeoHead: React.FC<SeoHeadProps> = ({
  title,
  description,
  path,
  image,
  imageAlt,
  robots = 'index, follow',
  keywords,
  type = 'website',
  structuredData
}) => {
  const snapshot = getPublicSiteConfigSnapshot();
  const [siteName, setSiteName] = useState(snapshot.siteName || 'Noklity');
  const [siteUrl, setSiteUrl] = useState(snapshot.siteUrl || 'https://noklity.com');

  useEffect(() => {
    let mounted = true;

    const loadConfig = async () => {
      try {
        const config = await getPublicSiteConfig();
        if (!mounted) return;
        setSiteName(config.siteName || 'Noklity');
        setSiteUrl(config.siteUrl || 'https://noklity.com');
      } catch {
        if (!mounted) return;
        setSiteName(snapshot.siteName || 'Noklity');
        setSiteUrl(snapshot.siteUrl || 'https://noklity.com');
      }
    };

    loadConfig();
    const handleUpdate = () => {
      void loadConfig();
    };
    window.addEventListener('site-config-updated', handleUpdate as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener('site-config-updated', handleUpdate as EventListener);
    };
  }, []);

  const structuredDataJson = useMemo(
    () => (structuredData ? JSON.stringify(structuredData) : ''),
    [structuredData]
  );

  useEffect(() => {
    const baseUrl = normalizeBaseUrl(siteUrl);
    const canonicalUrl = toAbsoluteUrl(
      path || (typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/'),
      baseUrl
    );
    const imageUrl = toAbsoluteUrl(image || '/og-image.png', baseUrl);
    const resolvedImageAlt = imageAlt || `${siteName} social share image`;

    document.title = title;

    upsertMeta("meta[name='description']", { name: 'description' }, description);
    upsertMeta("meta[name='keywords']", { name: 'keywords' }, keywords);
    upsertMeta("meta[name='robots']", { name: 'robots' }, robots);
    upsertLink('canonical', canonicalUrl);

    upsertMeta("meta[property='og:type']", { property: 'og:type' }, type);
    upsertMeta("meta[property='og:site_name']", { property: 'og:site_name' }, siteName);
    upsertMeta("meta[property='og:title']", { property: 'og:title' }, title);
    upsertMeta("meta[property='og:description']", { property: 'og:description' }, description);
    upsertMeta("meta[property='og:url']", { property: 'og:url' }, canonicalUrl);
    upsertMeta("meta[property='og:image']", { property: 'og:image' }, imageUrl || undefined);
    upsertMeta("meta[property='og:image:width']", { property: 'og:image:width' }, imageUrl ? '1200' : undefined);
    upsertMeta("meta[property='og:image:height']", { property: 'og:image:height' }, imageUrl ? '630' : undefined);
    upsertMeta("meta[property='og:image:alt']", { property: 'og:image:alt' }, resolvedImageAlt);

    upsertMeta("meta[name='twitter:card']", { name: 'twitter:card' }, imageUrl ? 'summary_large_image' : 'summary');
    upsertMeta("meta[name='twitter:title']", { name: 'twitter:title' }, title);
    upsertMeta("meta[name='twitter:description']", { name: 'twitter:description' }, description);
    upsertMeta("meta[name='twitter:url']", { name: 'twitter:url' }, canonicalUrl);
    upsertMeta("meta[name='twitter:image']", { name: 'twitter:image' }, imageUrl || undefined);
    upsertMeta("meta[name='twitter:image:alt']", { name: 'twitter:image:alt' }, resolvedImageAlt);

    upsertStructuredData(structuredDataJson || undefined);
  }, [description, image, imageAlt, keywords, path, robots, siteName, siteUrl, structuredDataJson, title, type]);

  return null;
};

export default SeoHead;
