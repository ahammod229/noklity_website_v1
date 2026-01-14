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
export interface Database {
  public: {
    Tables: {
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
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          role: 'admin' | 'user';
          created_at: string;
        };
      };
    };
  };
}