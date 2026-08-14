import mongoose, { Schema } from 'mongoose';

export interface ProductDocument {
  productId: string;
  title: string;
  slug?: string;
  brand?: string;
  modelNumber?: string;
  sku?: string;
  description?: string;
  price: number;
  discountPrice?: number | null;
  specifications?: Record<string, string>;
  compatibility?: string[];
  weight?: number;
  deliveryCharge?: number;
  warranty?: string;
  countryOfOrigin?: string;
  status?: 'active' | 'inactive';
  taxPercent?: number;
  defaultDeliveryFee?: number;
  imageUrl: string;
  imageUrls?: string[];
  deliveryCharges?: Record<string, number>;
  warrantyMonths?: number;
  warrantyPolicy?: string;
  shippingInfo?: string;
  returnPolicy?: string;
  faqText?: string;
  relatedProductIds?: string[];
  isActive?: boolean;
  category?: string;
  rating?: number;
  stock?: number;
  isFlashSale?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const productSchema = new Schema<ProductDocument>(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true
    },
    brand: {
      type: String,
      trim: true,
      default: ''
    },
    modelNumber: {
      type: String,
      trim: true,
      default: ''
    },
    sku: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    discountPrice: {
      type: Number,
      min: 0,
      default: null
    },
    specifications: {
      type: Schema.Types.Mixed,
      default: {}
    },
    compatibility: {
      type: [String],
      default: []
    },
    weight: {
      type: Number,
      min: 0,
      default: 0
    },
    deliveryCharge: {
      type: Number,
      min: 0,
      default: 0
    },
    warranty: {
      type: String,
      default: ''
    },
    countryOfOrigin: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true
    },
    taxPercent: {
      type: Number,
      min: 0,
      default: 0
    },
    defaultDeliveryFee: {
      type: Number,
      min: 0,
      default: 0
    },
    imageUrl: {
      type: String,
      required: true,
      default: 'https://via.placeholder.com/400x400?text=No+Image'
    },
    imageUrls: {
      type: [String],
      default: []
    },
    deliveryCharges: {
      type: Schema.Types.Mixed,
      default: {}
    },
    warrantyMonths: {
      type: Number,
      min: 0,
      default: 0
    },
    warrantyPolicy: {
      type: String,
      default: ''
    },
    shippingInfo: {
      type: String,
      default: ''
    },
    returnPolicy: {
      type: String,
      default: ''
    },
    faqText: {
      type: String,
      default: ''
    },
    relatedProductIds: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    category: {
      type: String,
      trim: true,
      default: 'Uncategorized',
      index: true
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    stock: {
      type: Number,
      min: 0,
      default: 0
    },
    isFlashSale: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

productSchema.index({ createdAt: -1 });
productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ isFlashSale: 1, createdAt: -1 });

export const ProductModel =
  mongoose.models.Product || mongoose.model<ProductDocument>('Product', productSchema);
