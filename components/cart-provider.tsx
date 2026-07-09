"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartItem } from "@/lib/api-client";
import type { Product } from "@prisma/client";
import { dispatchTrackingEvent } from "@/lib/browser-tracking";

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  isOpen: boolean;
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch("/api/cart")
      .then((res) => res.json())
      .then((data) => {
        if (data.cart?.items) setItems(data.cart.items);
      })
      .catch(() => {});
  }, []);

  const syncCart = useCallback(async (newItems: CartItem[]) => {
    setItems(newItems);
  }, []);

  const addItem = useCallback(async (product: Product) => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      const data = await res.json();
      if (data.cart?.items) setItems(data.cart.items);
      setIsOpen(true);

      if (typeof window !== "undefined") {
        dispatchTrackingEvent({
          eventName: "AddToCart",
          eventId: `synnex:add-to-cart:${product.id}:${Date.now()}`,
          value: product.price,
          currency: "LKR",
          contents: [{ id: product.id, quantity: 1, item_price: product.price }],
        });
      }
    } catch {}
  }, []);

  const removeItem = useCallback(async (id: string) => {
    try {
      const res = await fetch("/api/cart/items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: id }),
      });
      const data = await res.json();
      if (data.cart?.items) setItems(data.cart.items);
    } catch {}
  }, []);

  const updateQuantity = useCallback(async (id: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(id);
      return;
    }
    try {
      const res = await fetch("/api/cart/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: id, quantity }),
      });
      const data = await res.json();
      if (data.cart?.items) setItems(data.cart.items);
    } catch {}
  }, [removeItem]);

  const value = useMemo<CartContextValue>(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

    return {
      items,
      totalItems,
      subtotal,
      isOpen,
      addItem,
      removeItem,
      updateQuantity,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
    };
  }, [addItem, isOpen, items, removeItem, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used within CartProvider");
  return value;
}
