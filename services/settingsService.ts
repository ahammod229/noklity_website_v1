/**
 * Website Settings Service (Placeholder)
 * 
 * Handles global configuration, branding, and CMS-style settings.
 * Designed to be swapped with real Supabase DB and Storage calls later.
 */
import tenantFileConfig from '../config/tenant.json';
import { TenantConfig } from '../types/tenant';

export interface WebsiteSettings {
  branding: {
    siteName: string;
    tagline: string;
    headerLogo: string;
    footerLogo: string;
    favicon: string;
  };
  header: {
    showSearch: boolean;
    showWishlist: boolean;
    showCart: boolean;
    showLogin: boolean;
    ctaText: string;
  };
  footer: {
    description: string;
    supportEmail: string;
    whatsappNumber: string;
    copyrightText: string;
    showSocialIcons: boolean;
    showPaymentIcons: boolean;
  };
  homePage: {
    sections: Array<{ id: string; name: string; enabled: boolean; order: number }>;
  };
  socialLinks: {
    facebook: string;
    instagram: string;
    youtube: string;
    linkedin: string;
  };
  maintenance: {
    enabled: boolean;
    message: string;
  };
}

const tenantDefaults = tenantFileConfig as TenantConfig;
const defaultSiteName = tenantDefaults.brandName || 'Storefront';
const defaultCompanyName = tenantDefaults.companyName || defaultSiteName;
const defaultSupportEmail = tenantDefaults.supportEmail || 'support@example.com';
const currentYear = new Date().getFullYear();

const DEFAULT_SETTINGS: WebsiteSettings = {
  branding: {
    siteName: defaultSiteName,
    tagline: 'Premium Automotive Performance Parts',
    headerLogo: '',
    footerLogo: '',
    favicon: '',
  },
  header: {
    showSearch: true,
    showWishlist: true,
    showCart: true,
    showLogin: true,
    ctaText: 'Free Shipping on orders over $500',
  },
  footer: {
    description: 'Your premium destination for high-performance automotive parts. Engineered for speed, built for durability.',
    supportEmail: defaultSupportEmail,
    whatsappNumber: tenantDefaults.companyPhone || '',
    copyrightText: `© ${currentYear} ${defaultCompanyName}. All rights reserved.`,
    showSocialIcons: true,
    showPaymentIcons: true,
  },
  homePage: {
    sections: [
      { id: 'hero', name: 'Hero Section', enabled: true, order: 0 },
      { id: 'categories', name: 'Categories Section', enabled: true, order: 1 },
      { id: 'flash-sale', name: 'Flash Sale Section', enabled: true, order: 2 },
      { id: 'featured', name: 'Featured Products', enabled: true, order: 3 },
      { id: 'testimonials', name: 'Testimonials', enabled: false, order: 4 },
      { id: 'newsletter', name: 'Newsletter Section', enabled: true, order: 5 },
    ],
  },
  socialLinks: {
    facebook: '',
    instagram: '',
    youtube: '',
    linkedin: '',
  },
  maintenance: {
    enabled: false,
    message: 'We are currently performing scheduled maintenance. We will be back online shortly.',
  },
};

/**
 * Retrieves the current website settings.
 */
export const getSettings = async (): Promise<WebsiteSettings> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  /*
    TODO: SUPABASE INTEGRATION
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .single();
  */

  return { ...DEFAULT_SETTINGS };
};

/**
 * Updates global website settings.
 */
export const updateSettings = async (settings: WebsiteSettings): Promise<boolean> => {
  console.log('[Settings Service] Updating website configuration:', settings);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1200));

  /*
    TODO: SUPABASE INTEGRATION
    const { error } = await supabase
      .from('site_settings')
      .update(settings)
      .eq('id', 1);
  */

  return true;
};

/**
 * Uploads an image asset to storage.
 */
export const uploadAsset = async (file: File, path: string): Promise<string> => {
  console.log(`[Settings Service] Uploading asset to ${path}:`, file.name);
  
  // Simulate upload latency
  await new Promise(resolve => setTimeout(resolve, 1500));

  /*
    TODO: SUPABASE STORAGE INTEGRATION
    const { data, error } = await supabase.storage
      .from('assets')
      .upload(`${path}/${Date.now()}-${file.name}`, file);
    
    if (data) return supabase.storage.from('assets').getPublicUrl(data.path).data.publicUrl;
  */

  return URL.createObjectURL(file); // Temporary mock URL
};
