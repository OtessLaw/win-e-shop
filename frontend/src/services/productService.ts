import api from './api';
import type { Product, ApiResponse, PaginatedResponse, ProductFilters, Review } from '../types';

export const productService = {
  getProducts: async (filters: ProductFilters = {}) => {
    const res = await api.get<PaginatedResponse<Product>>('/products', { params: filters });
    return res.data;
  },

  getProduct: async (slug: string) => {
    const res = await api.get<ApiResponse<Product>>(`/products/${slug}`);
    return res.data.data;
  },

  getFeatured: async () => {
    const res = await api.get<ApiResponse<Product[]>>('/products/featured');
    return res.data.data;
  },

  getBestSellers: async () => {
    const res = await api.get<ApiResponse<Product[]>>('/products/best-sellers');
    return res.data.data;
  },

  getNewArrivals: async () => {
    const res = await api.get<ApiResponse<Product[]>>('/products/new-arrivals');
    return res.data.data;
  },

  getFlashSale: async () => {
    const res = await api.get<ApiResponse<Product[]>>('/products/flash-sale');
    return res.data.data;
  },

  getRelated: async (id: string) => {
    const res = await api.get<ApiResponse<Product[]>>(`/products/${id}/related`);
    return res.data.data;
  },

  createProduct: async (data: Partial<Product>) => {
    const res = await api.post<ApiResponse<Product>>('/products', data);
    return res.data.data;
  },

  updateProduct: async (id: string, data: Partial<Product>) => {
    const res = await api.patch<ApiResponse<Product>>(`/products/${id}`, data);
    return res.data.data;
  },

  deleteProduct: async (id: string) => {
    await api.delete(`/products/${id}`);
  },

  uploadImages: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    const res = await api.post('/products/upload-images', formData, {
      headers: { 'Content-Type': undefined },
    });
    return res.data.data;
  },

  getReviews: async (productId: string, page = 1) => {
    const res = await api.get<PaginatedResponse<Review>>(`/reviews/${productId}`, { params: { page } });
    return res.data;
  },

  submitReview: async (data: { productId: string; rating: number; title?: string; comment: string }) => {
    const res = await api.post('/reviews', data);
    return res.data;
  },
};
