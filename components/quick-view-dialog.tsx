"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Loader2, ShoppingCart, Star, X } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { formatCurrency } from "@/lib/api-client";
import { kokoMonthlyInstallment } from "@/lib/installments";
import type { Product } from "@prisma/client";

export function QuickViewDialog({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Modal behavior: remember focus, move it in, trap Tab, close on Escape,
  // restore focus on close — same contract as the cart drawer.
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    closeButtonRef.current?.focus();
    const previousFocus = previousFocusRef;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocus.current?.focus();
    };
  }, [onClose]);

  async function handleAdd() {
    setAdding(true);
    try {
      await addItem(product);
      setAdded(true);
      setTimeout(() => setAdded(false), 1400);
    } finally {
      setAdding(false);
    }
  }

  const discount =
    product.compareAt && product.compareAt > product.price
      ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
      : 0;
  const inStock = product.inventory > 0;

  // Portaled to <body>: the card has a hover transform, which would otherwise
  // become the containing block for this fixed-position dialog.
  return createPortal(
    <div className="quick-view-shell">
      <button
        type="button"
        className="quick-view-backdrop"
        aria-label="Close quick view"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className="quick-view-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`Quick view: ${product.name}`}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="icon-button quick-view-close"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={18} />
        </button>
        <div className="quick-view-media">
          <Image src={product.image} alt={product.name} width={640} height={520} sizes="(max-width: 640px) 90vw, 40vw" />
          {discount > 0 ? <span className="product-discount-badge">-{discount}%</span> : null}
        </div>
        <div className="quick-view-body">
          <p className="eyebrow">{product.category}</p>
          <h2>{product.name}</h2>
          <span className="quick-view-rating">
            <Star size={13} fill="currentColor" />
            {product.rating}
          </span>
          <div className="quick-view-price">
            <strong>{formatCurrency(product.price)}</strong>
            {product.compareAt && product.compareAt > product.price ? (
              <del>{formatCurrency(product.compareAt)}</del>
            ) : null}
          </div>
          <p className="product-installment">
            or 3 × {formatCurrency(kokoMonthlyInstallment(product.price))} with Koko
          </p>
          <p className={`product-stock ${inStock ? "in-stock" : "out-of-stock"}`}>
            {inStock
              ? product.inventory <= 10
                ? `Only ${product.inventory} left in stock`
                : "In stock"
              : "Out of stock"}
          </p>
          <button
            className={`add-to-cart${added ? " is-added" : ""}`}
            onClick={handleAdd}
            disabled={adding || !inStock}
            aria-busy={adding}
          >
            {adding ? (
              <Loader2 size={16} className="spin" />
            ) : added ? (
              <Check size={16} />
            ) : (
              <ShoppingCart size={16} />
            )}
            {adding ? "Adding…" : added ? "Added" : inStock ? "Add to Cart" : "Out of stock"}
          </button>
          <Link href={`/products/${product.slug}`} className="quick-view-details-link">
            View full details
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
