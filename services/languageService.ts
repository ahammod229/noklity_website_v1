/**
 * Language Service (Placeholder)
 * 
 * Handles translation strings and global localization settings.
 * Designed to be swapped with real Supabase/i18next-backend later.
 */

export interface TranslationStrings {
  header: {
    searchPlaceholder: string;
    wishlist: string;
    cart: string;
    login: string;
  };
  buttons: {
    buyNow: string;
    addToCart: string;
    checkout: string;
    viewDetails: string;
  };
  common: {
    emptyCart: string;
    noOrders: string;
    thankYou: string;
  };
}

export interface LanguageConfig {
  defaultLanguage: 'en' | 'bn';
  enableMultiLanguage: boolean;
  content: {
    en: TranslationStrings;
    bn: TranslationStrings;
  };
}

const DEFAULT_CONFIG: LanguageConfig = {
  defaultLanguage: 'en',
  enableMultiLanguage: true,
  content: {
    en: {
      header: {
        searchPlaceholder: "Search for parts, brands, or models...",
        wishlist: "Wishlist",
        cart: "Cart",
        login: "Login"
      },
      buttons: {
        buyNow: "Buy Now",
        addToCart: "Add to Cart",
        checkout: "Checkout",
        viewDetails: "View Details"
      },
      common: {
        emptyCart: "Your cart is empty",
        noOrders: "No orders yet",
        thankYou: "Thank you for choosing NOKLITY Performance!"
      }
    },
    bn: {
      header: {
        searchPlaceholder: "পার্টস, ব্র্যান্ড বা মডেল খুঁজুন...",
        wishlist: "উইশলিস্ট",
        cart: "কার্ট",
        login: "লগইন"
      },
      buttons: {
        buyNow: "এখন কিনুন",
        addToCart: "কার্টে যোগ করুন",
        checkout: "চেকআউট",
        viewDetails: "বিস্তারিত দেখুন"
      },
      common: {
        emptyCart: "আপনার কার্ট খালি",
        noOrders: "এখনও কোন অর্ডার নেই",
        thankYou: "NOKLITY পারফরম্যান্স বেছে নেওয়ার জন্য আপনাকে ধন্যবাদ!"
      }
    }
  }
};

/**
 * Fetches global language configuration.
 */
export const getLanguageConfig = async (): Promise<LanguageConfig> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return { ...DEFAULT_CONFIG };
};

/**
 * Updates language content or global settings.
 */
export const updateLanguageConfig = async (config: LanguageConfig): Promise<boolean> => {
  console.log('[Language Service] Updating configuration:', config);
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  /*
    TODO: SUPABASE INTEGRATION
    const { error } = await supabase
      .from('site_config')
      .update({ language_settings: config })
      .eq('id', 1);
  */
  
  return true;
};
