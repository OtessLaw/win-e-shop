import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize: load user from token
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
        } catch {
          localStorage.removeItem('accessToken');
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const res = await authService.login({ email, password });
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, phone?: string): Promise<User> => {
    const res = await authService.register({ name, email, password, phone });
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  const hasRole = useCallback((role: string): boolean => {
    return user?.role?.name === role;
  }, [user]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    if (user.role?.name === 'super_admin') return true;
    return user.role?.permissions?.some((p) => p.name === permission) || false;
  }, [user]);

  const isAdmin = ['super_admin', 'admin', 'product_manager', 'order_manager',
    'customer_support', 'marketing_manager', 'accountant'].includes(user?.role?.name || '');

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateUser,
      hasRole,
      hasPermission,
      isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
