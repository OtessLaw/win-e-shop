import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { CartItem } from '../types';
import toast from 'react-hot-toast';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, color: string, size: string) => void;
  updateQuantity: (productId: string, color: string, size: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string, color: string, size: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_KEY = 'jjvintage_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.productId === newItem.productId && i.color === newItem.color && i.size === newItem.size
      );
      if (existing) {
        const newQty = existing.quantity + newItem.quantity;
        if (newQty > newItem.stock) {
          toast.error(`Only ${newItem.stock} items available in stock`);
          return prev;
        }
        toast.success('Cart updated!');
        return prev.map((i) =>
          i.productId === newItem.productId && i.color === newItem.color && i.size === newItem.size
            ? { ...i, quantity: newQty }
            : i
        );
      }
      toast.success('Added to cart!');
      return [...prev, newItem];
    });
  }, []);

  const removeItem = useCallback((productId: string, color: string, size: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.color === color && i.size === size))
    );
    toast.success('Removed from cart');
  }, []);

  const updateQuantity = useCallback((productId: string, color: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) =>
        prev.filter((i) => !(i.productId === productId && i.color === color && i.size === size))
      );
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId && i.color === color && i.size === size
          ? { ...i, quantity: Math.min(quantity, i.stock) }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_KEY);
  }, []);

  const isInCart = useCallback((productId: string, color: string, size: string): boolean => {
    return items.some((i) => i.productId === productId && i.color === color && i.size === size);
  }, [items]);

  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, itemCount, subtotal, addItem, removeItem, updateQuantity, clearCart, isInCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
