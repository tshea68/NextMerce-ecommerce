"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type CartItem = {
  mpn: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  condition?: string;
  is_refurb: boolean;
};

type CartContextType = {
  cartItems: CartItem[];
  addToCart: (newItem: CartItem) => void;
  updateQty: (mpn: string, is_refurb: boolean, qty: number) => void;
  removeFromCart: (mpn: string, is_refurb: boolean) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cartItems");
      setCartItems(raw ? JSON.parse(raw) : []);
    } catch {
      setCartItems([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
    } catch {
      // ignore storage failures
    }
  }, [cartItems]);

  function addToCart(newItem: CartItem) {
    setCartItems((prev) => {
      const idx = prev.findIndex(
        (it) => it.mpn === newItem.mpn && it.is_refurb === newItem.is_refurb
      );

      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          qty: copy[idx].qty + newItem.qty,
        };
        return copy;
      }

      return [...prev, newItem];
    });
  }

  function updateQty(mpn: string, is_refurb: boolean, qty: number) {
    const safeQty = Math.max(1, Number(qty) || 1);

    setCartItems((prev) =>
      prev.map((it) =>
        it.mpn === mpn && it.is_refurb === is_refurb
          ? { ...it, qty: safeQty }
          : it
      )
    );
  }

  function removeFromCart(mpn: string, is_refurb: boolean) {
    setCartItems((prev) =>
      prev.filter((it) => !(it.mpn === mpn && it.is_refurb === is_refurb))
    );
  }

  function clearCart() {
    setCartItems([]);
  }

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, updateQty, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return ctx;
}