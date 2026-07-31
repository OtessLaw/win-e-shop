import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import api from '../services/api';

interface WishlistContextType {
  wishlist: string[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
const WISHLIST_KEY = 'jjvintage_wishlist';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync from user data when logged in
  useEffect(() => {
    if (user?.wishlist) {
      setWishlist(user.wishlist);
    }
  }, [user]);

  // Persist locally
  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  const isInWishlist = useCallback((productId: string): boolean => {
    return wishlist.includes(productId);
  }, [wishlist]);

  const toggleWishlist = useCallback(async (productId: string) => {
    const inWishlist = wishlist.includes(productId);

    if (inWishlist) {
      setWishlist((prev) => prev.filter((id) => id !== productId));
      toast.success('Removed from wishlist');
    } else {
      setWishlist((prev) => [...prev, productId]);
      toast.success('Added to wishlist ❤️');
    }

    // Sync with backend if logged in
    if (user) {
      try {
        await api.patch('/auth/update-profile', {
          wishlist: inWishlist
            ? wishlist.filter((id) => id !== productId)
            : [...wishlist, productId],
        });
      } catch { /* Silently fail */ }
    }
  }, [wishlist, user]);

  return (
    <WishlistContext.Provider value={{ wishlist, isInWishlist, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
};
