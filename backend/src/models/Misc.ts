import mongoose, { Document, Schema } from 'mongoose';

export interface IFAQ extends Document {
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ITestimonial extends Document {
  name: string;
  location?: string;
  avatar?: string;
  rating: number;
  message: string;
  isApproved: boolean;
  isFeatured: boolean;
}

export interface INewsletterSubscriber extends Document {
  email: string;
  isActive: boolean;
  subscribedAt: Date;
}

export interface IAuditLog extends Document {
  user?: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const faqSchema = new Schema<IFAQ>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String, default: 'General' },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const testimonialSchema = new Schema<ITestimonial>(
  {
    name: { type: String, required: true },
    location: { type: String },
    avatar: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    message: { type: String, required: true },
    isApproved: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const newsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    isActive: { type: Boolean, default: true },
    subscribedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const auditLogSchema = new Schema<IAuditLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: { type: String },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ user: 1 });

export const FAQ = mongoose.model<IFAQ>('FAQ', faqSchema);
export const Testimonial = mongoose.model<ITestimonial>('Testimonial', testimonialSchema);
export const NewsletterSubscriber = mongoose.model<INewsletterSubscriber>('NewsletterSubscriber', newsletterSubscriberSchema);
export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
