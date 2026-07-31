import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Coupon } from '../models/Coupon';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { AppError } from '../utils/AppError';
import { sendSuccess, sendPaginatedSuccess, getPaginationParams, buildPaginationResult } from '../utils/helpers';
import { sendEmail, emailTemplates } from '../config/email';
import { sendSMS, smsTemplates } from '../services/smsService';
import { SystemSetting } from '../models/SystemSetting';
import { AuthRequest } from '../middleware/auth';

// ─── Create Order ─────────────────────────────────────────────────────────────
export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items, shippingAddress, deliveryMethod, paymentMethod, couponCode } = req.body;

    // Validate items and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return next(new AppError(`Product not found: ${item.productId}`, 404));
      if (!product.isActive) return next(new AppError(`Product is no longer available: ${product.name}`, 400));

      // Find variant and size
      const variant = product.variants.find((v) => v.color === item.color);
      if (!variant) return next(new AppError(`Color not available: ${item.color}`, 400));

      const sizeObj = variant.sizes.find((s) => s.size === item.size);
      if (!sizeObj) return next(new AppError(`Size not available: ${item.size}`, 400));
      if (sizeObj.stock < item.quantity) return next(new AppError(`Insufficient stock for ${product.name} (${item.size})`, 400));

      const price = product.isFlashSale && product.flashSalePrice && product.flashSaleEndsAt && product.flashSaleEndsAt > new Date()
        ? product.flashSalePrice
        : product.price;

      const itemSubtotal = price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        image: (variant.images[0] || product.images[0])?.url || '',
        color: item.color,
        size: item.size,
        price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });
    }

    // Apply coupon
    let discount = 0;
    let couponDoc = null;
    if (couponCode) {
      couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (!couponDoc) return next(new AppError('Invalid or expired coupon code.', 400));
      if (couponDoc.expiresAt && couponDoc.expiresAt < new Date()) return next(new AppError('Coupon has expired.', 400));
      if (couponDoc.usageLimit && couponDoc.usedCount >= couponDoc.usageLimit) return next(new AppError('Coupon usage limit reached.', 400));
      if (couponDoc.minPurchase && subtotal < couponDoc.minPurchase) return next(new AppError(`Minimum purchase of GHS ${couponDoc.minPurchase} required for this coupon.`, 400));

      // Single-use check
      if (couponDoc.isSingleUse && req.user && couponDoc.usedBy.includes(req.user.id as unknown as import('mongoose').Types.ObjectId)) {
        return next(new AppError('You have already used this coupon.', 400));
      }

      if (couponDoc.type === 'percentage') {
        discount = (subtotal * couponDoc.value) / 100;
        if (couponDoc.maxDiscount) discount = Math.min(discount, couponDoc.maxDiscount);
      } else {
        discount = couponDoc.value;
      }
    }

    // Delivery fee
    const deliveryFees: Record<string, number> = {
      standard: 20,
      express: 50,
      pickup: 0,
    };
    const deliveryFee = deliveryFees[deliveryMethod] || 20;

    const tax = 0; // Can be configured
    const total = Math.max(0, subtotal - discount + deliveryFee + tax);

    const timestamp = Date.now().toString(36).toUpperCase();
    const orderNumber = `JJV-${timestamp}`;

    const order = await Order.create({
      orderNumber,
      user: req.user?.id,
      guestEmail: !req.user ? shippingAddress.email : undefined,
      guestName: !req.user ? shippingAddress.fullName : undefined,
      isGuestOrder: !req.user,
      items: orderItems,
      shippingAddress,
      deliveryMethod,
      deliveryFee,
      subtotal,
      discount,
      coupon: couponDoc?._id,
      tax,
      total,
      paymentMethod,
    });

    // If Cash on Delivery, mark as confirmed immediately
    if (paymentMethod === 'cash_on_delivery') {
      order.paymentStatus = 'pending';
      order.orderStatus = 'confirmed';
      order.statusHistory.push({ status: 'confirmed', timestamp: new Date(), note: 'Cash on Delivery order confirmed.' });
      await order.save();
    }

    // Update coupon usage
    if (couponDoc) {
      couponDoc.usedCount += 1;
      if (req.user) couponDoc.usedBy.push(req.user.id as unknown as import('mongoose').Types.ObjectId);
      await couponDoc.save();
    }

    // Reduce stock
    for (const item of items) {
      await Product.updateOne(
        { _id: item.productId, 'variants.color': item.color, 'variants.sizes.size': item.size },
        { $inc: { 'variants.$[v].sizes.$[s].stock': -item.quantity, totalStock: -item.quantity, soldCount: item.quantity } },
        { arrayFilters: [{ 'v.color': item.color }, { 's.size': item.size }] }
      );
    }

    // Send confirmation email
    try {
      await sendEmail({
        to: shippingAddress.email,
        subject: `Order Confirmed #${order.orderNumber} — JJ Vintage Collection`,
        html: emailTemplates.orderConfirmation(shippingAddress.fullName, order.orderNumber, total.toFixed(2)),
      });
    } catch { /* Non-blocking */ }

    // Send Automated SMS & WhatsApp Notification
    try {
      await sendSMS({
        to: shippingAddress.phone,
        message: smsTemplates.orderPlaced(shippingAddress.fullName, order.orderNumber, total.toFixed(2), shippingAddress.city),
      });
    } catch { /* Non-blocking */ }

    // Create notification for user
    if (req.user) {
      await Notification.create({
        user: req.user.id,
        title: 'Order Placed Successfully',
        message: `Your order #${order.orderNumber} has been placed. Total: GHS ${total.toFixed(2)}`,
        type: 'order',
        link: `/account/orders/${order._id}`,
      });
    }

    sendSuccess(res, { order }, 'Order created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

// ─── Verify Paystack Payment ───────────────────────────────────────────────────
export const verifyPaystackPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reference, orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return next(new AppError('Order not found.', 404));
    if (order.paystackVerified) {
      sendSuccess(res, { order }, 'Payment already verified.');
      return;
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const isPlaceholderKey = !secretKey || secretKey.includes('your_paystack_secret_key');

    if (isPlaceholderKey) {
      // In development / test mode without configured Paystack secret key
      console.warn(`[Paystack Test Mode] Auto-verifying reference ${reference} for Order #${order.orderNumber || order._id}`);
      order.paymentStatus = 'paid';
      order.paystackReference = reference || `TEST-REF-${Date.now()}`;
      order.paystackVerified = true;
      order.orderStatus = 'confirmed';
      order.statusHistory.push({ status: 'confirmed', timestamp: new Date(), note: 'Payment verified (Test Mode).' });
      await order.save();

      sendSuccess(res, { order }, 'Payment verified in test mode.');
      return;
    }

    // Verify with Paystack API (server-side for real keys)
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${secretKey}` },
      }
    );

    const paystackData = paystackResponse.data;
    if (!paystackData.status || paystackData.data.status !== 'success') {
      return next(new AppError('Payment verification failed with Paystack.', 400));
    }

    // Verify amount matches (Paystack uses pesewas/kobo -> divide by 100)
    const paystackAmount = paystackData.data.amount / 100;
    if (Math.abs(paystackAmount - order.total) > 1) {
      return next(new AppError('Payment amount mismatch. Please contact support.', 400));
    }

    order.paymentStatus = 'paid';
    order.paystackReference = reference;
    order.paystackVerified = true;
    order.orderStatus = 'confirmed';
    order.statusHistory.push({ status: 'confirmed', timestamp: new Date(), note: 'Payment verified via Paystack API.' });
    await order.save();

    sendSuccess(res, { order }, 'Payment verified and order confirmed.');
  } catch (err: any) {
    console.error('Paystack verification error:', err?.response?.data || err?.message || err);
    next(err);
  }
};

// ─── Get My Orders ─────────────────────────────────────────────────────────────
export const getMyOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);
    const [orders, total] = await Promise.all([
      Order.find({ user: req.user?.id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments({ user: req.user?.id }),
    ]);
    sendPaginatedSuccess(res, buildPaginationResult(orders, total, page, limit));
  } catch (err) {
    next(err);
  }
};

// ─── Get Order Detail ─────────────────────────────────────────────────────────
export const getOrderDetail = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product', 'name slug');
    if (!order) return next(new AppError('Order not found.', 404));

    // Users can only view their own orders
    if (req.user && order.user && order.user.toString() !== req.user.id) {
      return next(new AppError('Access denied.', 403));
    }

    sendSuccess(res, order);
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Get All Orders ─────────────────────────────────────────────────────
export const getAllOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);
    const { status, paymentStatus, search } = req.query;

    const filter: Record<string, unknown> = {};
    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (search) filter.orderNumber = { $regex: String(search), $options: 'i' };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    sendPaginatedSuccess(res, buildPaginationResult(orders, total, page, limit));
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Update Order Status ────────────────────────────────────────────────
export const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const order = await Order.findById(id).populate('user', 'name email');
    if (!order) return next(new AppError('Order not found.', 404));

    order.orderStatus = status;
    order.statusHistory.push({ status, timestamp: new Date(), note });
    await order.save();

    // Send in-app notification to customer
    if (order.user) {
      await Notification.create({
        user: (order.user as unknown as { _id: string })._id,
        title: 'Order Status Updated',
        message: `Your order #${order.orderNumber} status has been updated to: ${status.replace(/_/g, ' ')}`,
        type: 'order',
        link: `/account/orders/${order._id}`,
      });
    }

    // Dispatch SMS notification to customer phone
    try {
      if (order.shippingAddress?.phone) {
        await sendSMS({
          to: order.shippingAddress.phone,
          message: smsTemplates.orderStatusUpdate(
            order.shippingAddress.fullName,
            order.orderNumber,
            status
          ),
        });
      }
    } catch (smsErr) {
      console.error('Failed to send status update SMS:', smsErr);
    }

    sendSuccess(res, order, `Order status updated to ${status} & SMS notification dispatched.`);
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Direct Manual SMS Trigger ──────────────────────────────────────────
export const sendOrderSMS = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return next(new AppError('Order not found.', 404));

    if (!order.shippingAddress?.phone) {
      return next(new AppError('Customer phone number is missing on this order.', 400));
    }

    const result = await sendSMS({
      to: order.shippingAddress.phone,
      message: smsTemplates.orderPlaced(
        order.shippingAddress.fullName,
        order.orderNumber,
        order.total.toFixed(2),
        order.shippingAddress.city
      ),
    });

    if (result.success) {
      sendSuccess(res, null, `📱 ${result.message}`);
    } else {
      return next(new AppError(`⚠️ ${result.message}`, 400));
    }
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Cancel/Refund Order ────────────────────────────────────────────────
export const cancelOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(id);
    if (!order) return next(new AppError('Order not found.', 404));

    order.orderStatus = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', timestamp: new Date(), note: reason });
    await order.save();

    // Restore stock
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product, 'variants.color': item.color, 'variants.sizes.size': item.size },
        { $inc: { 'variants.$[v].sizes.$[s].stock': item.quantity, totalStock: item.quantity, soldCount: -item.quantity } },
        { arrayFilters: [{ 'v.color': item.color }, { 's.size': item.size }] }
      );
    }

    sendSuccess(res, order, 'Order cancelled and stock restored.');
  } catch (err) {
    next(err);
  }
};

// ─── Validate Coupon ───────────────────────────────────────────────────────────
export const validateCoupon = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, subtotal } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) return next(new AppError('Invalid coupon code.', 400));
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return next(new AppError('Coupon has expired.', 400));
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return next(new AppError('Coupon usage limit reached.', 400));
    if (coupon.minPurchase && subtotal < coupon.minPurchase) return next(new AppError(`Minimum purchase of GHS ${coupon.minPurchase} required.`, 400));

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.value;
    }

    sendSuccess(res, { discount, coupon: { code: coupon.code, type: coupon.type, value: coupon.value } }, 'Coupon applied!');
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Get Live SMS Gateway Settings ──────────────────────────────────────
export const getSMSSettings = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const apiKeyDoc = await SystemSetting.findOne({ key: { $in: ['fasreach_api_key', 'sms_api_key'] } }).lean();
    const senderDoc = await SystemSetting.findOne({ key: 'sms_sender_id' }).lean();

    sendSuccess(res, {
      apiKey: apiKeyDoc?.value || 'bms_live_1785502841008_np14a00zkx',
      senderId: senderDoc?.value || 'JNJVINTAGE',
    }, 'FasReach SMS Settings retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Save Live SMS Gateway Settings ──────────────────────────────────────
export const saveSMSSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { apiKey, senderId } = req.body;

    if (apiKey !== undefined) {
      await SystemSetting.findOneAndUpdate(
        { key: 'fasreach_api_key' },
        { key: 'fasreach_api_key', value: apiKey.trim(), description: 'FasReach SMS API Key' },
        { upsert: true, new: true }
      );
    }

    if (senderId !== undefined) {
      await SystemSetting.findOneAndUpdate(
        { key: 'sms_sender_id' },
        { key: 'sms_sender_id', value: senderId.trim().slice(0, 11), description: 'FasReach Approved Sender ID' },
        { upsert: true, new: true }
      );
    }

    const apiKeyDoc = await SystemSetting.findOne({ key: { $in: ['fasreach_api_key', 'sms_api_key'] } }).lean();
    const senderDoc = await SystemSetting.findOne({ key: 'sms_sender_id' }).lean();

    sendSuccess(res, {
      apiKey: apiKeyDoc?.value || 'bms_live_1785502841008_np14a00zkx',
      senderId: senderDoc?.value || 'JNJVINTAGE',
    }, 'FasReach SMS settings saved successfully!');
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Send Test SMS ───────────────────────────────────────────────────────
export const sendTestSMS = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { phone, message } = req.body;
    if (!phone) return next(new AppError('Recipient phone number is required.', 400));

    const result = await sendSMS({
      to: phone,
      message: message || 'Hello from J&J Vintage Collection Ghana! Your SMS Gateway is connected and working perfectly. ✨',
    });

    if (result.success) {
      sendSuccess(res, result, `📱 ${result.message}`);
    } else {
      return next(new AppError(`⚠️ ${result.message}`, 400));
    }
  } catch (err) {
    next(err);
  }
};
