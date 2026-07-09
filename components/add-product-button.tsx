"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import type { Product } from "@prisma/client";

export function AddProductButton({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <button className="detail-add-button" onClick={() => addItem(product)}>
      <ShoppingCart size={19} />
      Add to cart
    </button>
  );
}
