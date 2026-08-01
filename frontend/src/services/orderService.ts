import api from './api';
import type { Order, ApiResponse, PaginatedResponse } from '../types';

interface CreateOrderData {
  items: { productId: string; color: string; size: string; quantity: number }[];
  shippingAddress: {
    fullName: string; phone: string; email: string;
    region: string; city: string; address: string; gpsAddress?: string;
    latitude?: number; longitude?: number; mapUrl?: string;
  };
  deliveryMethod: 'standard' | 'express' | 'pickup';
  paymentMethod: string;
  couponCode?: string;
}

export const orderService = {
  createOrder: async (data: CreateOrderData) => {
    const res = await api.post<ApiResponse<{ order: Order }>>('/orders', data);
    return res.data.data;
  },

  verifyPayment: async (reference: string, orderId: string) => {
    const res = await api.post('/orders/verify-payment', { reference, orderId });
    return res.data;
  },

  validateCoupon: async (code: string, subtotal: number) => {
    const res = await api.post('/orders/validate-coupon', { code, subtotal });
    return res.data.data;
  },

  getMyOrders: async (page = 1) => {
    const res = await api.get<PaginatedResponse<Order>>('/orders/my-orders', { params: { page } });
    return res.data;
  },

  getOrder: async (id: string) => {
    const res = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return res.data.data;
  },

  // Admin
  getAllOrders: async (params: Record<string, unknown> = {}) => {
    const res = await api.get<PaginatedResponse<Order>>('/orders', { params });
    return res.data;
  },

  updateStatus: async (id: string, status: string, note?: string) => {
    const res = await api.patch(`/orders/${id}/status`, { status, note });
    return res.data;
  },

  cancelOrder: async (id: string, reason?: string) => {
    const res = await api.patch(`/orders/${id}/cancel`, { reason });
    return res.data;
  },

  sendDirectSMS: async (id: string) => {
    const res = await api.post(`/orders/${id}/send-sms`);
    return res.data;
  },

  getSMSSettings: async () => {
    const res = await api.get('/orders/admin/sms-settings');
    return res.data.data;
  },

  saveSMSSettings: async (data: { apiKey?: string; senderId?: string }) => {
    const res = await api.post('/orders/admin/sms-settings', data);
    return res.data;
  },

  sendTestSMS: async (phone: string, message?: string) => {
    const res = await api.post('/orders/admin/send-test-sms', { phone, message });
    return res.data;
  },

  updateLocation: async (id: string, latitude: number, longitude: number) => {
    const res = await api.post(`/orders/${id}/update-location`, { latitude, longitude });
    return res.data;
  },
};
