import mongoose, { Document, Schema } from 'mongoose';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod =
  | 'paystack_card'
  | 'paystack_mobile_money'
  | 'paystack_bank_transfer'
  | 'cash_on_delivery';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  image: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  user?: mongoose.Types.ObjectId;
  guestEmail?: string;
  guestName?: string;
  items: IOrderItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    email: string;
    region: string;
    city: string;
    address: string;
    gpsAddress?: string;
    latitude?: number;
    longitude?: number;
    mapUrl?: string;
  };
  deliveryMethod: 'standard' | 'express' | 'pickup';
  deliveryFee: number;
  subtotal: number;
  discount: number;
  coupon?: mongoose.Types.ObjectId;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paystackReference?: string;
  paystackVerified: boolean;
  orderStatus: OrderStatus;
  statusHistory: { status: OrderStatus; timestamp: Date; note?: string }[];
  assignedTo?: mongoose.Types.ObjectId;
  notes?: string;
  invoiceNumber?: string;
  isGuestOrder: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  color: { type: String, required: true },
  size: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true },
});

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    guestEmail: { type: String },
    guestName: { type: String },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      region: { type: String, required: true },
      city: { type: String, required: true },
      address: { type: String, required: true },
      gpsAddress: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
      mapUrl: { type: String },
    },
    deliveryMethod: { type: String, enum: ['standard', 'express', 'pickup'], default: 'standard' },
    deliveryFee: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['paystack_card', 'paystack_mobile_money', 'paystack_bank_transfer', 'cash_on_delivery'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    paystackReference: { type: String },
    paystackVerified: { type: Boolean, default: false },
    orderStatus: { type: String, enum: ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'], default: 'pending' },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
    invoiceNumber: { type: String },
    isGuestOrder: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-generate order number
orderSchema.pre('save', async function () {
  if (this.isNew) {
    if (!this.orderNumber) {
      const count = await mongoose.model('Order').countDocuments();
      this.orderNumber = `JJV-${String(count + 1).padStart(6, '0')}`;
    }
    this.invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    if (!this.statusHistory || this.statusHistory.length === 0) {
      this.statusHistory.push({ status: 'pending', timestamp: new Date() });
    }
  }
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ orderNumber: 1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);
