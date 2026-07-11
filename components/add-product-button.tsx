"use client";

import { useState } from "react";
import { Loader2, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import type { Product } from "@prisma/client";

export function AddProductButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    setAdding(true);
    try {
      await addItem(product);
    } finally {
      setAdding(false);
    }
  }

  return (
    <button className="detail-add-button" onClick={handleAdd} disabled={adding} aria-busy={adding}>
      {adding ? <Loader2 size={19} className="spin" /> : <ShoppingCart size={19} />}
      {adding ? "Adding…" : "Add to cart"}
    </button>
  );
}
