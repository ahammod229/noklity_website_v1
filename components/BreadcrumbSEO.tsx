import React, { useMemo } from 'react';

export interface BreadcrumbRoute {
  name: string;
  url: string;
}

interface BreadcrumbSEOProps {
  routes: BreadcrumbRoute[];
  className?: string;
  ariaLabel?: string;
  baseUrl?: string;
}

const DEFAULT_BASE_URL = 'https://www.noklity.com';

const normalizeBaseUrl = (value?: string) => {
  const browserOrigin =
    typeof window !== 'undefined' && window.location?.origin ? window.location.origin : DEFAULT_BASE_URL;
  const candidate = (value || browserOrigin || DEFAULT_BASE_URL).trim();

  return (candidate || DEFAULT_BASE_URL).replace(/\/+$/, '');
};

const toAbsoluteUrl = (url: string, baseUrl: string) => {
  const trimmedUrl = url.trim();

  if (/^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  const normalizedPath = trimmedUrl.startsWith('/') ? trimmedUrl : `/${trimmedUrl}`;
  return `${baseUrl}${normalizedPath}`;
};

const BreadcrumbSEO: React.FC<BreadcrumbSEOProps> = ({
  routes,
  className = '',
  ariaLabel = 'Breadcrumb',
  baseUrl
}) => {
  const breadcrumbRoutes = useMemo(
    () =>
      routes
        .map((route) => ({
          name: route.name.trim(),
          url: route.url.trim()
        }))
        .filter((route) => route.name && route.url),
    [routes]
  );

  const schemaJson = useMemo(() => {
    const resolvedBaseUrl = normalizeBaseUrl(baseUrl);
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbRoutes.map((route, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: route.name,
        item: toAbsoluteUrl(route.url, resolvedBaseUrl)
      }))
    };

    return JSON.stringify(schema).replace(/</g, '\\u003c');
  }, [baseUrl, breadcrumbRoutes]);

  if (breadcrumbRoutes.length === 0) {
    return null;
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaJson }}
      />
      <nav
        aria-label={ariaLabel}
        className={`w-full overflow-x-auto px-4 py-3 text-sm text-gray-500 ${className}`}
      >
        <ol className="flex min-w-0 flex-wrap items-center gap-2">
          {breadcrumbRoutes.map((route, index) => {
            const isLastItem = index === breadcrumbRoutes.length - 1;

            return (
              <li key={`${route.url}-${index}`} className="flex min-w-0 items-center gap-2">
                {index > 0 && (
                  <span aria-hidden="true" className="select-none text-gray-300">
                    /
                  </span>
                )}

                {isLastItem ? (
                  <span
                    aria-current="page"
                    className="max-w-[220px] truncate font-semibold text-gray-900 sm:max-w-none"
                    title={route.name}
                  >
                    {route.name}
                  </span>
                ) : (
                  <a
                    href={route.url}
                    className="max-w-[160px] truncate font-semibold text-gray-500 transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 sm:max-w-none"
                    title={route.name}
                  >
                    {route.name}
                  </a>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};

export default BreadcrumbSEO;
