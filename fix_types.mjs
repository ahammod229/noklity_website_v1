import fs from 'fs';

let content = fs.readFileSync('types.ts', 'utf8');

// Update Product interface
const productUpdate = `export interface Product {
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
  videoUrl?: string;
  videoProvider?: string;
  variants?: ProductVariant[];
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
  keywords?: string;
  keyFeatures?: string[];
  compatibility?: string[];
  weight?: number;
}`;

content = content.replace(/export interface Product \{[\s\S]*?weight\?: number;\n\}/, productUpdate);

// Add ProductVariant and Brand interfaces
const newInterfaces = `
export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku?: string;
  price: number;
  stock: number;
  image_url?: string;
  created_at?: string;
}

export interface Brand {
  id: string;
  name: string;
  logo_url?: string;
  created_at?: string;
}
`;

content = content.replace('export interface Product {', newInterfaces + '\nexport interface Product {');

fs.writeFileSync('types.ts', content);

