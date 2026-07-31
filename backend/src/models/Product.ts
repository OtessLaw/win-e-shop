import mongoose, { Document, Schema } from 'mongoose';

export interface IProductImage {
  url: string;
  publicId: string;
  alt?: string;
}

export interface IProductVariant {
  color: string;
  colorHex?: string;
  sizes: {
    size: string;
    stock: number;
    sku: string;
  }[];
  images: IProductImage[];
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  category: mongoose.Types.ObjectId;
  brand?: mongoose.Types.ObjectId;
  gender: 'men' | 'women' | 'unisex' | 'kids';
  tags: string[];
  variants: IProductVariant[];
  images: IProductImage[];
  totalStock: number;
  lowStockThreshold: number;
  isActive: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isFlashSale: boolean;
  flashSalePrice?: number;
  flashSaleEndsAt?: Date;
  discount?: number;       // Percentage
  averageRating: number;
  reviewCount: number;
  soldCount: number;
  viewCount: number;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const productImageSchema = new Schema<IProductImage>({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  alt: { type: String },
});

const productVariantSchema = new Schema<IProductVariant>({
  color: { type: String, required: true },
  colorHex: { type: String },
  sizes: [
    {
      size: { type: String, required: true },
      stock: { type: Number, required: true, min: 0, default: 0 },
      sku: { type: String, required: true },
    },
  ],
  images: [productImageSchema],
});

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 300 },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    costPrice: { type: Number, min: 0 },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand' },
    gender: { type: String, enum: ['men', 'women', 'unisex', 'kids'], required: true },
    tags: [{ type: String }],
    variants: [productVariantSchema],
    images: [productImageSchema],
    totalStock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: true },
    isFlashSale: { type: Boolean, default: false },
    flashSalePrice: { type: Number, min: 0 },
    flashSaleEndsAt: { type: Date },
    discount: { type: Number, min: 0, max: 100 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    weight: { type: Number },
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
    },
    metaTitle: { type: String },
    metaDescription: { type: String },
    metaKeywords: [{ type: String }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save hook: compute totalStock across all variants and sizes
productSchema.pre('save', function () {
  if (this.variants && this.variants.length > 0) {
    let sum = 0;
    this.variants.forEach((v) => {
      if (v.sizes && v.sizes.length > 0) {
        v.sizes.forEach((s) => {
          sum += Number(s.stock) || 0;
        });
      }
    });
    this.totalStock = sum;
  }
});

// Virtual: populate reviews
productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
});

// Virtual: effective price (flash sale or regular)
productSchema.virtual('effectivePrice').get(function () {
  if (this.isFlashSale && this.flashSalePrice && this.flashSaleEndsAt && this.flashSaleEndsAt > new Date()) {
    return this.flashSalePrice;
  }
  return this.price;
});

export const Product = mongoose.model<IProduct>('Product', productSchema);
