import api from './api';
import type { User, ApiResponse } from '../types';

interface LoginData { email: string; password: string; }
interface RegisterData { name: string; email: string; password: string; phone?: string; }
interface AuthResponse { user: User; accessToken: string; refreshToken: string; }

export const authService = {
  login: async (data: LoginData) => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    if (res.data.data.accessToken) {
      localStorage.setItem('accessToken', res.data.data.accessToken);
    }
    return res.data;
  },

  register: async (data: RegisterData) => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    if (res.data.data.accessToken) {
      localStorage.setItem('accessToken', res.data.data.accessToken);
    }
    return res.data;
  },

  logout: async () => {
    await api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('accessToken');
  },

  getMe: async () => {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },

  updateProfile: async (data: Partial<User>) => {
    const res = await api.patch<ApiResponse<User>>('/auth/update-profile', data);
    return res.data.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const res = await api.patch('/auth/change-password', data);
    return res.data;
  },

  forgotPassword: async (email: string) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (token: string, password: string) => {
    const res = await api.patch(`/auth/reset-password/${token}`, { password });
    return res.data;
  },

  verifyEmail: async (token: string) => {
    const res = await api.get(`/auth/verify-email/${token}`);
    return res.data;
  },
};
