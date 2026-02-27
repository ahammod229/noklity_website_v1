
export interface Product {
  id: string;
  name: string;
  slug?: string;
  brand?: string;
  modelNumber?: string;
  sku?: string;
  category: string;
  price: number;
  originalPrice?: number;
  taxPercent?: number;
  defaultDeliveryFee?: number;
  image: string;
  images?: string[];
  deliveryCharges?: Record<string, number>;
  warrantyMonths?: number;
  warrantyPolicy?: string;
  shippingInfo?: string;
  returnPolicy?: string;
  faqText?: string;
  relatedProductIds?: string[];
  isActive?: boolean;
  isNew?: boolean;
  rating: number;
  stock?: number;
  description?: string;
  specifications?: Record<string, string>;
  compatibility?: string[];
  weight?: number;
  deliveryCharge?: number;
  warranty?: string;
  countryOfOrigin?: string;
  status?: 'active' | 'inactive';
  isFlashSale?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  logoUrl?: string;
  count: number;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface Order {
  id: string;
  customerName: string;
  email: string;
  date: string;
  total: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  itemsCount: number;
}

// Database Types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      cart_items: {
        Row: {
          user_id: string;
          product_id: string;
          title: string;
          price: number;
          image: string;
          quantity: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          product_id: string;
          title: string;
          price: number;
          image: string;
          quantity: number;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          product_id?: string;
          title?: string;
          price?: number;
          image?: string;
          quantity?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      wishlist_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ];
      };
      products: {
        Row: {
          id: string;
          title: string;
          slug: string | null;
          brand: string | null;
          model_number: string | null;
          sku: string | null;
          description: string | null;
          price: number;
          discount_price: number | null;
          specifications: Json | null;
          compatibility: Json | null;
          weight: number | null;
          delivery_charge: number | null;
          warranty: string | null;
          country_of_origin: string | null;
          status: 'active' | 'inactive' | null;
          tax_percent: number | null;
          default_delivery_fee: number | null;
          image_url: string | null;
          image_urls: Json | null;
          delivery_charges: Json | null;
          warranty_months: number | null;
          warranty_policy: string | null;
          shipping_info: string | null;
          return_policy: string | null;
          faq_text: string | null;
          related_product_ids: string[] | null;
          is_active: boolean | null;
          category: string | null;
          rating: number;
          stock: number;
          is_flash_sale: boolean;
          created_at: string;
        };
        Insert: {
          title: string;
          slug?: string | null;
          brand?: string | null;
          model_number?: string | null;
          sku?: string | null;
          description?: string | null;
          price: number;
          discount_price?: number | null;
          specifications?: Json | null;
          compatibility?: Json | null;
          weight?: number | null;
          delivery_charge?: number | null;
          warranty?: string | null;
          country_of_origin?: string | null;
          status?: 'active' | 'inactive' | null;
          tax_percent?: number | null;
          default_delivery_fee?: number | null;
          image_url?: string | null;
          image_urls?: Json | null;
          delivery_charges?: Json | null;
          warranty_months?: number | null;
          warranty_policy?: string | null;
          shipping_info?: string | null;
          return_policy?: string | null;
          faq_text?: string | null;
          related_product_ids?: string[] | null;
          is_active?: boolean | null;
          category?: string | null;
          rating?: number;
          stock: number;
          is_flash_sale?: boolean;
        };
        Update: {
          title?: string;
          slug?: string | null;
          brand?: string | null;
          model_number?: string | null;
          sku?: string | null;
          description?: string | null;
          price?: number;
          discount_price?: number | null;
          specifications?: Json | null;
          compatibility?: Json | null;
          weight?: number | null;
          delivery_charge?: number | null;
          warranty?: string | null;
          country_of_origin?: string | null;
          status?: 'active' | 'inactive' | null;
          tax_percent?: number | null;
          default_delivery_fee?: number | null;
          image_url?: string | null;
          image_urls?: Json | null;
          delivery_charges?: Json | null;
          warranty_months?: number | null;
          warranty_policy?: string | null;
          shipping_info?: string | null;
          return_policy?: string | null;
          faq_text?: string | null;
          related_product_ids?: string[] | null;
          is_active?: boolean | null;
          category?: string | null;
          rating?: number;
          stock?: number;
          is_flash_sale?: boolean;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          role: 'admin' | 'user';
          status: 'active' | 'blocked';
          full_name: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: 'admin' | 'user';
          status?: 'active' | 'blocked';
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'admin' | 'user';
          status?: 'active' | 'blocked';
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_addresses: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          phone: string;
          address_line: string;
          city: string;
          state: string;
          postal_code: string;
          country: string;
          label: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          phone: string;
          address_line: string;
          city: string;
          state: string;
          postal_code: string;
          country: string;
          label?: string;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          phone?: string;
          address_line?: string;
          city?: string;
          state?: string;
          postal_code?: string;
          country?: string;
          label?: string;
          is_default?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_addresses_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          total_amount: number;
          status: string;
          payment_method: 'bkash' | 'nogad' | 'bank_transfer' | 'cod' | 'card' | 'wallet';
          payment_status: 'pending' | 'paid' | 'failed';
          transaction_id: string | null;
          paid_at: string | null;
          shipping_address: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_amount: number;
          status?: string;
          payment_method: 'bkash' | 'nogad' | 'bank_transfer' | 'cod' | 'card' | 'wallet';
          payment_status?: 'pending' | 'paid' | 'failed';
          transaction_id?: string | null;
          paid_at?: string | null;
          shipping_address: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          total_amount?: number;
          status?: string;
          payment_method?: 'bkash' | 'nogad' | 'bank_transfer' | 'cod' | 'card' | 'wallet';
          payment_status?: 'pending' | 'paid' | 'failed';
          transaction_id?: string | null;
          paid_at?: string | null;
          shipping_address?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          price: number;
          quantity: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          price: number;
          quantity: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          price?: number;
          quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ];
      };
      site_settings: {
        Row: {
          key: string;
          value: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          value?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string | null;
          logo_url: string | null;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon?: string | null;
          logo_url?: string | null;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          icon?: string | null;
          logo_url?: string | null;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      hero_banners: {
        Row: {
          id: string;
          badge_text: string;
          title: string;
          highlight_text: string | null;
          description: string | null;
          image_url: string;
          primary_button_text: string;
          secondary_button_text: string;
          target_type: 'none' | 'product' | 'category' | 'url';
          target_product_id: string | null;
          target_category: string | null;
          target_url: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          badge_text?: string;
          title: string;
          highlight_text?: string | null;
          description?: string | null;
          image_url: string;
          primary_button_text?: string;
          secondary_button_text?: string;
          target_type?: 'none' | 'product' | 'category' | 'url';
          target_product_id?: string | null;
          target_category?: string | null;
          target_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          badge_text?: string;
          title?: string;
          highlight_text?: string | null;
          description?: string | null;
          image_url?: string;
          primary_button_text?: string;
          secondary_button_text?: string;
          target_type?: 'none' | 'product' | 'category' | 'url';
          target_product_id?: string | null;
          target_category?: string | null;
          target_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hero_banners_target_product_id_fkey"
            columns: ["target_product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ];
      };
      finance_ledger: {
        Row: {
          id: string;
          type: 'add_funds' | 'withdrawal';
          amount: number;
          note: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: 'add_funds' | 'withdrawal';
          amount: number;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: 'add_funds' | 'withdrawal';
          amount?: number;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "finance_ledger_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ];
      };
      payment_methods: {
        Row: {
          id: string;
          code: string;
          name: string;
          type: string;
          logo_url: string | null;
          account_details: Json | null;
          instructions: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          type: string;
          logo_url?: string | null;
          account_details?: Json | null;
          instructions?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          type?: string;
          logo_url?: string | null;
          account_details?: Json | null;
          instructions?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      support_tickets: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          channel: string;
          subject: string;
          message: string;
          status: 'Pending' | 'In Progress' | 'Resolved' | 'Closed';
          priority: 'Low' | 'Normal' | 'High' | 'Urgent';
          admin_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          email: string;
          phone?: string | null;
          channel?: string;
          subject: string;
          message: string;
          status?: 'Pending' | 'In Progress' | 'Resolved' | 'Closed';
          priority?: 'Low' | 'Normal' | 'High' | 'Urgent';
          admin_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          email?: string;
          phone?: string | null;
          channel?: string;
          subject?: string;
          message?: string;
          status?: 'Pending' | 'In Progress' | 'Resolved' | 'Closed';
          priority?: 'Low' | 'Normal' | 'High' | 'Urgent';
          admin_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_submissions: {
        Row: {
          id: string;
          order_id: string;
          user_id: string;
          payment_method: 'bkash' | 'nogad' | 'bank_transfer';
          bank_code: string | null;
          document_type: string | null;
          transaction_reference: string | null;
          document_path: string | null;
          notes: string | null;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          user_id: string;
          payment_method: 'bkash' | 'nogad' | 'bank_transfer';
          bank_code?: string | null;
          document_type?: string | null;
          transaction_reference?: string | null;
          document_path?: string | null;
          notes?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          user_id?: string;
          payment_method?: 'bkash' | 'nogad' | 'bank_transfer';
          bank_code?: string | null;
          document_type?: string | null;
          transaction_reference?: string | null;
          document_path?: string | null;
          notes?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_submissions_order_id_fkey"
            columns: ["order_id"]
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_submissions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ];
      };
      product_reviews: {
        Row: {
          id: string;
          product_id: string;
          order_id: string;
          user_id: string;
          rating: number;
          title: string | null;
          comment: string | null;
          status: 'pending' | 'approved' | 'rejected';
          admin_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          order_id: string;
          user_id: string;
          rating: number;
          title?: string | null;
          comment?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          admin_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          order_id?: string;
          user_id?: string;
          rating?: number;
          title?: string | null;
          comment?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          admin_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      api_integrations: {
        Row: {
          id: string;
          key: string;
          name: string;
          base_url: string | null;
          auth_type: 'none' | 'api_key' | 'bearer' | 'basic';
          secret_ref: string | null;
          status: 'active' | 'inactive';
          last_checked_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          name: string;
          base_url?: string | null;
          auth_type?: 'none' | 'api_key' | 'bearer' | 'basic';
          secret_ref?: string | null;
          status?: 'active' | 'inactive';
          last_checked_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          name?: string;
          base_url?: string | null;
          auth_type?: 'none' | 'api_key' | 'bearer' | 'basic';
          secret_ref?: string | null;
          status?: 'active' | 'inactive';
          last_checked_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      create_order: {
        Args: {
          order_items: Json;
          total_amount: number;
          shipping_address: Json;
          payment_method: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
}
