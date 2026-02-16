"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/* =======================
   TYPES
======================= */

export type CartItem = {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
};

export type WishlistItem = {
  id: string;
  title: string;
  price: number;
  image: string;
  inStock?: boolean;
};

type CartContextType = {
  /* Cart */
  cartItems: CartItem[];

  // Back-compat alias (older pages may use `items`)
  items: CartItem[];

  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;

  /* Wishlist */
  wishlistItems: WishlistItem[];
  addToWishlist: (product: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  clearWishlist: () => void;
  isInWishlist: (id: string) => boolean;
};

// Back-compat type alias (your build error referenced `CartCtx`)
export type CartCtx = CartContextType;

const CartContext = createContext<CartContextType | null>(null);

/* =======================
   PROVIDER
======================= */

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem("cart");
      const storedWishlist = localStorage.getItem("wishlist");
      if (storedCart) setCartItems(JSON.parse(storedCart));
      if (storedWishlist) setWishlistItems(JSON.parse(storedWishlist));
    } catch {
      // ignore bad localStorage JSON
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    } catch {}
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem("wishlist", JSON.stringify(wishlistItems));
    } catch {}
  }, [wishlistItems]);

  const addToCart = (product: Omit<CartItem, "quantity">) => {
    setCartItems((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    setCartOpen(true);
  };

  const updateQuantity = (id: string, quantity: number) => {
    const q = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: q } : item))
    );
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addToWishlist = (product: WishlistItem) => {
    setWishlistItems((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) return prev;
      return [...prev, product];
    });
  };

  const removeFromWishlist = (id: string) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearWishlist = () => setWishlistItems([]);

  const isInWishlist = (id: string) => wishlistItems.some((item) => item.id === id);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        items: cartItems, // alias
        cartOpen,
        setCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        isInWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartCtx => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
};
