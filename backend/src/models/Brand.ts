import mongoose, { Document, Schema } from 'mongoose';

export interface IBrand extends Document {
  name: string;
  slug: string;
  logo?: { url: string; publicId: string };
  description?: string;
  isActive: boolean;
  productCount: number;
}

const brandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    logo: { url: { type: String }, publicId: { type: String } },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    productCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Brand = mongoose.model<IBrand>('Brand', brandSchema);
