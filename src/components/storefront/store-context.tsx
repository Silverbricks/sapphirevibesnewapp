"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import type { ProductCardData } from "@/lib/data/products";

const CART_KEY = "sv_cart_v1";
const WISH_KEY = "sv_wishlist_v1";
const RECENT_KEY = "sv_recent_v1";
const COMPARE_MAX = 4;

export interface CartLine {
  id: string;
  slug: string;
  name: string;
  brand: string;
  priceCents: number;
  image: string;
  qty: number;
}

interface StoreState {
  // cart (client/guest cart; Phase 3 adds server persistence + checkout)
  cart: CartLine[];
  cartCount: number;
  addToCart: (line: Omit<CartLine, "qty">, qty?: number) => void;
  updateQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;

  // wishlist (client; Phase 4 reconciles with DB)
  wishlist: string[];
  isWished: (id: string) => boolean;
  toggleWishlist: (id: string, name?: string) => void;

  // compare
  compare: string[];
  inCompare: (id: string) => boolean;
  toggleCompare: (card: ProductCardData) => void;
  removeCompare: (id: string) => void;
  clearCompare: () => void;
  compareCards: ProductCardData[];

  // quick view
  quickView: ProductCardData | null;
  openQuickView: (card: ProductCardData) => void;
  closeQuickView: () => void;

  // recently viewed
  recordView: (id: string) => void;
  recentIds: string[];
}

const StoreContext = createContext<StoreState | null>(null);

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [compareCards, setCompareCards] = useState<ProductCardData[]>([]);
  const [quickView, setQuickView] = useState<ProductCardData | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  // hydrate from localStorage
  useEffect(() => {
    setCart(read<CartLine[]>(CART_KEY, []));
    setWishlist(read<string[]>(WISH_KEY, []));
    setRecentIds(read<string[]>(RECENT_KEY, []));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    window.localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
  }, [wishlist]);
  useEffect(() => {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(recentIds));
  }, [recentIds]);

  const addToCart = useCallback(
    (line: Omit<CartLine, "qty">, qty = 1) => {
      setCart((prev) => {
        const existing = prev.find((l) => l.id === line.id);
        if (existing) {
          return prev.map((l) =>
            l.id === line.id ? { ...l, qty: l.qty + qty } : l,
          );
        }
        return [...prev, { ...line, qty }];
      });
      toast.success(`${line.name} added to cart`);
    },
    [],
  );

  const updateQty = useCallback((id: string, qty: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, qty: Math.max(0, qty) } : l))
        .filter((l) => l.qty > 0),
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback((id: string, name?: string) => {
    setWishlist((prev) => {
      if (prev.includes(id)) {
        toast(`${name ?? "Item"} removed from wishlist`);
        return prev.filter((x) => x !== id);
      }
      toast.success(`${name ?? "Item"} saved to wishlist`);
      return [...prev, id];
    });
  }, []);

  const toggleCompare = useCallback((card: ProductCardData) => {
    setCompareCards((prev) => {
      if (prev.find((c) => c.id === card.id))
        return prev.filter((c) => c.id !== card.id);
      if (prev.length >= COMPARE_MAX) {
        toast(`You can compare up to ${COMPARE_MAX} items`);
        return prev;
      }
      return [...prev, card];
    });
  }, []);

  const removeCompare = useCallback(
    (id: string) => setCompareCards((prev) => prev.filter((c) => c.id !== id)),
    [],
  );
  const clearCompare = useCallback(() => setCompareCards([]), []);

  const recordView = useCallback((id: string) => {
    setRecentIds((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 12));
  }, []);

  const value = useMemo<StoreState>(
    () => ({
      cart,
      cartCount: cart.reduce((s, l) => s + l.qty, 0),
      addToCart,
      updateQty,
      removeFromCart,
      clearCart,
      cartOpen,
      setCartOpen,
      wishlist,
      isWished: (id) => wishlist.includes(id),
      toggleWishlist,
      compare: compareCards.map((c) => c.id),
      inCompare: (id) => compareCards.some((c) => c.id === id),
      toggleCompare,
      removeCompare,
      clearCompare,
      compareCards,
      quickView,
      openQuickView: setQuickView,
      closeQuickView: () => setQuickView(null),
      recordView,
      recentIds,
    }),
    [
      cart,
      cartOpen,
      wishlist,
      compareCards,
      quickView,
      recentIds,
      addToCart,
      updateQty,
      removeFromCart,
      clearCart,
      toggleWishlist,
      toggleCompare,
      removeCompare,
      clearCompare,
      recordView,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
