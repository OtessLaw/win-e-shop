import { Router } from 'express';
import {
  createOrder, verifyPaystackPayment, getMyOrders, getOrderDetail,
  getAllOrders, updateOrderStatus, cancelOrder, validateCoupon, sendOrderSMS,
  getSMSSettings, saveSMSSettings, sendTestSMS, updateCustomerLocation,
  getPaymentSettings, savePaymentSettings,
} from '../controllers/orderController';
import { protect, requirePermission, optionalAuth } from '../middleware/auth';

const router = Router();

// Customer routes
router.post('/', optionalAuth, createOrder);
router.post('/verify-payment', optionalAuth, verifyPaystackPayment);
router.post('/validate-coupon', optionalAuth, validateCoupon);
router.get('/my-orders', protect, getMyOrders);

// Admin Payment Gateway Configuration Routes
router.get('/admin/payment-settings', protect, requirePermission('orders:view'), getPaymentSettings);
router.post('/admin/payment-settings', protect, requirePermission('orders:update'), savePaymentSettings);

// Admin SMS Gateway Configuration Routes
router.get('/admin/sms-settings', protect, requirePermission('orders:view'), getSMSSettings);
router.post('/admin/sms-settings', protect, requirePermission('orders:update'), saveSMSSettings);
router.post('/admin/send-test-sms', protect, requirePermission('orders:update'), sendTestSMS);

router.post('/:id/update-location', optionalAuth, updateCustomerLocation);
router.get('/:id', optionalAuth, getOrderDetail);

// Admin routes
router.get('/', protect, requirePermission('orders:view'), getAllOrders);
router.patch('/:id/status', protect, requirePermission('orders:update'), updateOrderStatus);
router.patch('/:id/cancel', protect, requirePermission('orders:cancel'), cancelOrder);
router.post('/:id/send-sms', protect, requirePermission('orders:update'), sendOrderSMS);

export default router;
