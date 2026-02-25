
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  isNew?: boolean;
  rating: number;
  stock?: number;
  description?: string;
  specs?: Record<string, string>;
  isFlashSale?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
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
          description: string | null;
          price: number;
          discount_price: number | null;
          image_url: string | null;
          category: string | null;
          rating: number;
          stock: number;
          is_flash_sale: boolean;
          created_at: string;
        };
        Insert: {
          title: string;
          description?: string | null;
          price: number;
          discount_price?: number | null;
          image_url?: string | null;
          category?: string | null;
          rating?: number;
          stock: number;
          is_flash_sale?: boolean;
        };
        Update: {
          title?: string;
          description?: string | null;
          price?: number;
          discount_price?: number | null;
          image_url?: string | null;
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
          payment_method: string;
          shipping_address: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_amount: number;
          status?: string;
          payment_method: string;
          shipping_address: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          total_amount?: number;
          status?: string;
          payment_method?: string;
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
          id: number;
          key: string;
          value: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          key: string;
          value?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          key?: string;
          value?: string | null;
          created_at?: string;
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
