import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Cart, CartItem } from '../types';
import { publicApi } from '../api/public.api';

interface CartContextType {
  sessionId: string;
  cart: Cart | null;
  items: CartItem[];
  itemCount: number;
  subtotal: string;
  loading: boolean;
  error: string | null;
  addToCart: (
    productId: string,
    quantity?: number,
    selectedAttributes?: Record<string, any>
  ) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  refreshCart: () => Promise<void>;
  clearCartState: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_SESSION_KEY = 'mves_guest_cart_session_id';

function getOrCreateSessionId(): string {
  let sessionId = localStorage.getItem(CART_SESSION_KEY);
  if (!sessionId) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      sessionId = crypto.randomUUID();
    } else {
      sessionId = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
    localStorage.setItem(CART_SESSION_KEY, sessionId);
  }
  return sessionId;
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionId] = useState<string>(getOrCreateSessionId);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await publicApi.getCart(sessionId);
      setCart(data);
    } catch (err: any) {
      console.warn('Failed to load guest cart:', err?.friendlyMessage || err?.message);
      // Fallback empty cart state if no items exist yet
      setCart({
        sessionId,
        items: [],
        itemCount: 0,
        subtotal: '0.00',
      });
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (
    productId: string,
    quantity: number = 1,
    selectedAttributes?: Record<string, any>
  ) => {
    setLoading(true);
    setError(null);
    try {
      await publicApi.addToCart(sessionId, productId, quantity, selectedAttributes);
      await refreshCart();
    } catch (err: any) {
      const msg = err?.friendlyMessage || 'Failed to add item to cart';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId: string) => {
    setLoading(true);
    setError(null);
    try {
      await publicApi.removeFromCart(sessionId, productId);
      await refreshCart();
    } catch (err: any) {
      const msg = err?.friendlyMessage || 'Failed to remove item from cart';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Safely reset item and re-add desired absolute quantity
      await publicApi.removeFromCart(sessionId, productId);
      await publicApi.addToCart(sessionId, productId, newQuantity);
      await refreshCart();
    } catch (err: any) {
      const msg = err?.friendlyMessage || 'Failed to update quantity';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const clearCartState = () => {
    // Generate a fresh session ID for future orders
    const newSession = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem(CART_SESSION_KEY, newSession);
    setCart({
      sessionId: newSession,
      items: [],
      itemCount: 0,
      subtotal: '0.00',
    });
  };

  const itemCount = cart?.itemCount || 0;
  const subtotal = cart?.subtotal || '0.00';
  const items = cart?.items || [];

  return (
    <CartContext.Provider
      value={{
        sessionId,
        cart,
        items,
        itemCount,
        subtotal,
        loading,
        error,
        addToCart,
        removeFromCart,
        updateQuantity,
        refreshCart,
        clearCartState,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
