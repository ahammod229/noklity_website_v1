import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { getPublicSiteConfig, getPublicSiteConfigSnapshot } from '../services/siteConfigService';
import SeoHead from '../components/SeoHead';

interface ContentPageProps {
  slug?: string;
  onNavigate: (view: any, param?: string) => void;
}

const normalizeSlug = (raw?: string) => (raw || '').trim().toLowerCase();

const ContentPage: React.FC<ContentPageProps> = ({ slug, onNavigate }) => {
  const safeSlug = normalizeSlug(slug) || 'about';
  const initialConfig = getPublicSiteConfigSnapshot();
  const initialPage = initialConfig.managedPages.find((page) => page.slug === safeSlug && page.isEnabled) || null;
  const [title, setTitle] = useState(initialPage?.title || 'Page not found');
  const [body, setBody] = useState(
    initialPage?.content || 'This page is unavailable. Please check the footer links or contact support.'
  );
  const [notFound, setNotFound] = useState(!initialPage);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const config = await getPublicSiteConfig();
        if (!mounted) return;
        const nextPage = config.managedPages.find((page) => page.slug === safeSlug && page.isEnabled) || null;
        setNotFound(!nextPage);
        setTitle(nextPage?.title || 'Page not found');
        setBody(nextPage?.content || 'This page is unavailable. Please check the footer links or contact support.');
      } catch {
        if (!mounted) return;
        const nextPage = initialConfig.managedPages.find((page) => page.slug === safeSlug && page.isEnabled) || null;
        setNotFound(!nextPage);
        setTitle(nextPage?.title || 'Page not found');
        setBody(nextPage?.content || 'This page is unavailable. Please check the footer links or contact support.');
      }
    };

    load();
    const onUpdated = () => load();
    window.addEventListener('site-config-updated', onUpdated as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener('site-config-updated', onUpdated as EventListener);
    };
  }, [safeSlug]);

  const paragraphs = useMemo(() => {
    const lines = (body || '').split('\n').map((item) => item.trim()).filter(Boolean);
    return lines.length > 0 ? lines : ['This page content is empty. Please update it from Admin > Settings > Company & Legal Pages.'];
  }, [body]);

  const metaDescription = useMemo(() => {
    const excerpt = paragraphs.join(' ').replace(/\s+/g, ' ').trim();
    if (!excerpt) return 'Read more information from Noklity.';
    return excerpt.length > 160 ? `${excerpt.slice(0, 157).trim()}...` : excerpt;
  }, [paragraphs]);

  return (
    <div className="min-h-screen bg-gray-50">
      <SeoHead
        title={`${title || 'Information'} | Noklity`}
        description={metaDescription}
        path={`/page/${safeSlug}`}
        robots={notFound ? 'noindex, nofollow' : 'index, follow'}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-widest text-primary">Company & Legal</p>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mt-2">{title || 'Page'}</h1>
        </div>

        <article className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 md:p-6 space-y-5">
          {paragraphs.map((paragraph, idx) => (
            <p key={`${safeSlug}-${idx}`} className="text-base md:text-lg leading-8 text-gray-700 font-medium">
              {paragraph}
            </p>
          ))}

          {(safeSlug === 'contact' || safeSlug === 'support' || notFound) && (
            <div className="pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => onNavigate('help')}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-colors"
              >
                {notFound ? 'Go To Support Center' : 'Open Support Center'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </article>
      </div>
    </div>
  );
};

export default ContentPage;
