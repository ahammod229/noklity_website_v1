import type { Product } from '../../types';
import type { ProductDocument } from '../models/Product';

const asRecord = (value: unknown): Record<string, string> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>((acc, [key, item]) => {
    if (item === null || item === undefined) return acc;
    acc[key] = String(item);
    return acc;
  }, {});
};

const asNumericRecord = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, number>>((acc, [key, item]) => {
    const parsed = Number(item);
    if (!Number.isFinite(parsed)) return acc;
    acc[key] = parsed;
    return acc;
  }, {});
};

export const mapCatalogProduct = (product: ProductDocument): Product => {
  const createdAt = product.createdAt ? new Date(product.createdAt).getTime() : 0;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  return {
    id: product.productId,
    name: product.title,
    slug: product.slug || '',
    brand: product.brand || '',
    modelNumber: product.modelNumber || '',
    sku: product.sku || '',
    category: product.category || 'Uncategorized',
    price: product.discountPrice || product.price,
    originalPrice: product.discountPrice ? product.price : undefined,
    specifications: asRecord(product.specifications),
    compatibility: Array.isArray(product.compatibility) ? product.compatibility : [],
    weight: Number(product.weight || 0) || undefined,
    deliveryCharge: Number(product.deliveryCharge || 0),
    warranty: product.warranty || '',
    countryOfOrigin: product.countryOfOrigin || '',
    status: product.status || 'active',
    taxPercent: Number(product.taxPercent || 0),
    defaultDeliveryFee: Number(product.defaultDeliveryFee || 0),
    image: product.imageUrl || 'https://via.placeholder.com/400x400?text=No+Image',
    images: Array.isArray(product.imageUrls) ? product.imageUrls : [],
    deliveryCharges: asNumericRecord(product.deliveryCharges),
    warrantyMonths: Number(product.warrantyMonths || 0),
    warrantyPolicy: product.warrantyPolicy || '',
    shippingInfo: product.shippingInfo || '',
    returnPolicy: product.returnPolicy || '',
    faqText: product.faqText || '',
    relatedProductIds: Array.isArray(product.relatedProductIds) ? product.relatedProductIds : [],
    isActive: product.isActive !== false,
    rating: Number(product.rating || 0),
    stock: Number(product.stock || 0),
    isFlashSale: Boolean(product.isFlashSale),
    description: product.description || '',
    isNew: createdAt > 0 ? Date.now() - createdAt < thirtyDaysMs : false
  };
};
