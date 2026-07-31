import mongoose, { Document, Schema } from 'mongoose';

export interface IBanner extends Document {
  title: string;
  subtitle?: string;
  image: { url: string; publicId: string };
  link?: string;
  ctaText?: string;
  position: 'hero' | 'promo' | 'sidebar';
  isActive: boolean;
  sortOrder: number;
  publishAt?: Date;
  expiresAt?: Date;
}

const bannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    image: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
    },
    link: { type: String },
    ctaText: { type: String },
    position: { type: String, enum: ['hero', 'promo', 'sidebar'], default: 'hero' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    publishAt: { type: Date },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

export const Banner = mongoose.model<IBanner>('Banner', bannerSchema);
