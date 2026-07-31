import { Router, Request, Response, NextFunction } from 'express';
import { Category } from '../models/Category';
import { Brand } from '../models/Brand';
import { Banner } from '../models/Banner';
import { FAQ, Testimonial, NewsletterSubscriber, AuditLog } from '../models/Misc';
import { Review } from '../models/Review';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Coupon } from '../models/Coupon';
import { Notification } from '../models/Notification';
import { Role, Permission } from '../models/Role';
import { protect, requirePermission, requireRole } from '../middleware/auth';
import { sendSuccess, sendPaginatedSuccess, getPaginationParams, buildPaginationResult, slugify } from '../utils/helpers';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// ─── Categories ───────────────────────────────────────────────────────────────
router.get('/categories', async (_req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 });
    sendSuccess(res, categories);
  } catch (err) { next(err); }
});

router.post('/categories', protect, requirePermission('categories:manage'), async (req: AuthRequest, res, next) => {
  try {
    const data = { ...req.body, slug: slugify(req.body.name) };
    const category = await Category.create(data);
    sendSuccess(res, category, 'Category created.', 201);
  } catch (err) { next(err); }
});

router.patch('/categories/:id', protect, requirePermission('categories:manage'), async (req: AuthRequest, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return next(new AppError('Category not found.', 404));
    sendSuccess(res, category, 'Category updated.');
  } catch (err) { next(err); }
});

router.delete('/categories/:id', protect, requirePermission('categories:manage'), async (req: AuthRequest, res, next) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    sendSuccess(res, null, 'Category deleted.');
  } catch (err) { next(err); }
});

// ─── Brands ───────────────────────────────────────────────────────────────────
router.get('/brands', async (_req, res, next) => {
  try {
    const brands = await Brand.find({ isActive: true });
    sendSuccess(res, brands);
  } catch (err) { next(err); }
});

router.post('/brands', protect, requirePermission('brands:manage'), async (req: AuthRequest, res, next) => {
  try {
    const brand = await Brand.create({ ...req.body, slug: slugify(req.body.name) });
    sendSuccess(res, brand, 'Brand created.', 201);
  } catch (err) { next(err); }
});

router.patch('/brands/:id', protect, requirePermission('brands:manage'), async (req: AuthRequest, res, next) => {
  try {
    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true });
    sendSuccess(res, brand, 'Brand updated.');
  } catch (err) { next(err); }
});

router.delete('/brands/:id', protect, requirePermission('brands:manage'), async (req: AuthRequest, res, next) => {
  try {
    await Brand.findByIdAndDelete(req.params.id);
    sendSuccess(res, null, 'Brand deleted.');
  } catch (err) { next(err); }
});

// ─── Banners ──────────────────────────────────────────────────────────────────
router.get('/banners', async (req, res, next) => {
  try {
    const position = req.query.position || 'hero';
    const banners = await Banner.find({
      isActive: true,
      position: String(position),
      $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: { $exists: false } }],
    } as any).sort({ sortOrder: 1 });
    sendSuccess(res, banners);
  } catch (err) { next(err); }
});

router.post('/banners', protect, requirePermission('banners:manage'), async (req: AuthRequest, res, next) => {
  try {
    const banner = await Banner.create(req.body);
    sendSuccess(res, banner, 'Banner created.', 201);
  } catch (err) { next(err); }
});

router.patch('/banners/:id', protect, requirePermission('banners:manage'), async (req: AuthRequest, res, next) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    sendSuccess(res, banner, 'Banner updated.');
  } catch (err) { next(err); }
});

router.delete('/banners/:id', protect, requirePermission('banners:manage'), async (req: AuthRequest, res, next) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    sendSuccess(res, null, 'Banner deleted.');
  } catch (err) { next(err); }
});

// ─── FAQs ─────────────────────────────────────────────────────────────────────
router.get('/faqs', async (_req, res, next) => {
  try {
    const faqs = await FAQ.find({ isActive: true }).sort({ category: 1, sortOrder: 1 });
    sendSuccess(res, faqs);
  } catch (err) { next(err); }
});

router.post('/faqs', protect, requirePermission('content:manage'), async (req: AuthRequest, res, next) => {
  try {
    const faq = await FAQ.create(req.body);
    sendSuccess(res, faq, 'FAQ created.', 201);
  } catch (err) { next(err); }
});

router.patch('/faqs/:id', protect, requirePermission('content:manage'), async (req: AuthRequest, res, next) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
    sendSuccess(res, faq, 'FAQ updated.');
  } catch (err) { next(err); }
});

router.delete('/faqs/:id', protect, requirePermission('content:manage'), async (req: AuthRequest, res, next) => {
  try {
    await FAQ.findByIdAndDelete(req.params.id);
    sendSuccess(res, null, 'FAQ deleted.');
  } catch (err) { next(err); }
});

// ─── Testimonials ─────────────────────────────────────────────────────────────
router.get('/testimonials', async (_req, res, next) => {
  try {
    const testimonials = await Testimonial.find({ isApproved: true, isFeatured: true }).limit(10);
    sendSuccess(res, testimonials);
  } catch (err) { next(err); }
});

router.post('/testimonials', async (req, res, next) => {
  try {
    const testimonial = await Testimonial.create(req.body);
    sendSuccess(res, testimonial, 'Thank you for your testimonial! It will appear after review.', 201);
  } catch (err) { next(err); }
});

// ─── Newsletter ───────────────────────────────────────────────────────────────
router.post('/newsletter/subscribe', async (req, res, next) => {
  try {
    const { email } = req.body;
    const exists = await NewsletterSubscriber.findOne({ email });
    if (exists) {
      if (exists.isActive) {
        sendSuccess(res, null, 'You are already subscribed!');
        return;
      }
      exists.isActive = true;
      await exists.save();
      sendSuccess(res, null, 'Welcome back! You have been re-subscribed.');
      return;
    }
    await NewsletterSubscriber.create({ email });
    sendSuccess(res, null, 'Thank you for subscribing!', 201);
  } catch (err) { next(err); }
});

// ─── Reviews ──────────────────────────────────────────────────────────────────
router.get('/reviews/:productId', async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);
    const [reviews, total] = await Promise.all([
      Review.find({ product: req.params.productId, isApproved: true })
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ product: req.params.productId, isApproved: true }),
    ]);
    sendPaginatedSuccess(res, buildPaginationResult(reviews, total, page, limit));
  } catch (err) { next(err); }
});

router.post('/reviews', protect, async (req: AuthRequest, res, next) => {
  try {
    const { productId, rating, title, comment } = req.body;
    const review = await Review.create({
      product: productId, user: req.user?.id, rating, title, comment,
    });

    // Update product average rating
    const stats = await Review.aggregate([
      { $match: { product: review.product, isApproved: true } },
      { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats.length) {
      await Product.findByIdAndUpdate(productId, {
        averageRating: Math.round(stats[0].avgRating * 10) / 10,
        reviewCount: stats[0].count,
      });
    }

    sendSuccess(res, review, 'Review submitted.', 201);
  } catch (err) { next(err); }
});

// ─── Notifications ────────────────────────────────────────────────────────────
router.get('/notifications', protect, async (req: AuthRequest, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user?.id })
      .sort({ createdAt: -1 })
      .limit(50);
    sendSuccess(res, notifications);
  } catch (err) { next(err); }
});

router.patch('/notifications/:id/read', protect, async (req: AuthRequest, res, next) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user?.id }, { isRead: true });
    sendSuccess(res, null, 'Notification marked as read.');
  } catch (err) { next(err); }
});

router.patch('/notifications/read-all', protect, async (req: AuthRequest, res, next) => {
  try {
    await Notification.updateMany({ user: req.user?.id, isRead: false }, { isRead: true });
    sendSuccess(res, null, 'All notifications marked as read.');
  } catch (err) { next(err); }
});

// ─── Admin: Customers ─────────────────────────────────────────────────────────
router.get('/admin/customers', protect, requirePermission('customers:view'), async (req: AuthRequest, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);
    const { search } = req.query;
    const filter: Record<string, unknown> = {};
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

    const [customers, total] = await Promise.all([
      User.find(filter).populate('role', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
    sendPaginatedSuccess(res, buildPaginationResult(customers, total, page, limit));
  } catch (err) { next(err); }
});

router.patch('/admin/customers/:id/suspend', protect, requirePermission('customers:manage'), async (req: AuthRequest, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isSuspended: req.body.suspend }, { new: true });
    sendSuccess(res, user, `Customer ${req.body.suspend ? 'suspended' : 'restored'}.`);
  } catch (err) { next(err); }
});

router.patch('/admin/customers/:id/role', protect, async (req: AuthRequest, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    sendSuccess(res, user, `User role updated to ${role}.`);
  } catch (err) { next(err); }
});

// ─── Admin: Roles & Permissions ───────────────────────────────────────────────
router.get('/admin/roles', protect, requireRole('super_admin'), async (_req, res, next) => {
  try {
    const roles = await Role.find().populate('permissions');
    sendSuccess(res, roles);
  } catch (err) { next(err); }
});

router.get('/admin/permissions', protect, requireRole('super_admin'), async (_req, res, next) => {
  try {
    const permissions = await Permission.find().sort({ group: 1 });
    sendSuccess(res, permissions);
  } catch (err) { next(err); }
});

router.post('/admin/roles', protect, requireRole('super_admin'), async (req: AuthRequest, res, next) => {
  try {
    const role = await Role.create(req.body);
    sendSuccess(res, role, 'Role created.', 201);
  } catch (err) { next(err); }
});

router.patch('/admin/roles/:id', protect, requireRole('super_admin'), async (req: AuthRequest, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return next(new AppError('Role not found.', 404));
    if (role.isSystem) return next(new AppError('System roles cannot be modified.', 400));
    const updated = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true });
    sendSuccess(res, updated, 'Role updated.');
  } catch (err) { next(err); }
});

// ─── Admin: Analytics ─────────────────────────────────────────────────────────
router.get('/admin/analytics/overview', protect, requirePermission('analytics:view'), async (_req: AuthRequest, res, next) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalRevenue, todayRevenue, monthRevenue,
      totalOrders, pendingOrders,
      totalCustomers, newCustomersThisMonth,
      totalProducts, lowStockProducts,
    ] = await Promise.all([
      Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: startOfDay } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: 'pending' }),
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ $expr: { $lte: ['$totalStock', '$lowStockThreshold'] }, isActive: true }),
    ]);

    sendSuccess(res, {
      revenue: {
        total: totalRevenue[0]?.total || 0,
        today: todayRevenue[0]?.total || 0,
        thisMonth: monthRevenue[0]?.total || 0,
      },
      orders: { total: totalOrders, pending: pendingOrders },
      customers: { total: totalCustomers, newThisMonth: newCustomersThisMonth },
      products: { total: totalProducts, lowStock: lowStockProducts },
    });
  } catch (err) { next(err); }
});

router.get('/admin/analytics/sales-chart', protect, requirePermission('analytics:view'), async (req: AuthRequest, res, next) => {
  try {
    const days = parseInt(String(req.query.days || '30'));
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const salesData = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    sendSuccess(res, salesData);
  } catch (err) { next(err); }
});

router.get('/admin/analytics/top-products', protect, requirePermission('analytics:view'), async (_req: AuthRequest, res, next) => {
  try {
    const topProducts = await Product.find({ isActive: true })
      .sort({ soldCount: -1 })
      .limit(10)
      .select('name images price soldCount averageRating');
    sendSuccess(res, topProducts);
  } catch (err) { next(err); }
});

// ─── Admin: Audit Logs ────────────────────────────────────────────────────────
router.get('/admin/audit-logs', protect, requireRole('super_admin'), async (req: AuthRequest, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);
    const [logs, total] = await Promise.all([
      AuditLog.find().populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(),
    ]);
    sendPaginatedSuccess(res, buildPaginationResult(logs, total, page, limit));
  } catch (err) { next(err); }
});

// ─── Admin: Coupons ───────────────────────────────────────────────────────────
router.get('/admin/coupons', protect, requirePermission('coupons:manage'), async (req: AuthRequest, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    sendSuccess(res, coupons);
  } catch (err) { next(err); }
});

router.post('/admin/coupons', protect, requirePermission('coupons:manage'), async (req: AuthRequest, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    sendSuccess(res, coupon, 'Coupon created.', 201);
  } catch (err) { next(err); }
});

router.patch('/admin/coupons/:id', protect, requirePermission('coupons:manage'), async (req: AuthRequest, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    sendSuccess(res, coupon, 'Coupon updated.');
  } catch (err) { next(err); }
});

router.delete('/admin/coupons/:id', protect, requirePermission('coupons:manage'), async (req: AuthRequest, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    sendSuccess(res, null, 'Coupon deleted.');
  } catch (err) { next(err); }
});

export default router;
