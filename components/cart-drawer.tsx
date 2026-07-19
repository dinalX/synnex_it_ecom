"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { formatCurrency } from "@/lib/api-client";

export function CartDrawer() {
  const {
    closeCart,
    isOpen,
    items,
    removeItem,
    subtotal,
    updateQuantity,
  } = useCart();

  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  // Item ids with a quantity/remove request in flight — buttons disable to
  // stop rapid clicks resolving out of order.
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const runItemAction = useCallback(async (id: string, action: () => Promise<void> | void) => {
    setBusyIds((prev) => new Set(prev).add(id));
    try {
      await action();
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  // Modal behavior: remember focus, move it into the drawer, trap Tab, close
  // on Escape, and restore focus on close.
  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeCart();
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;

      const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
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
      previousFocusRef.current?.focus();
    };
  }, [isOpen, closeCart]);

  return (
    <div className={`cart-shell ${isOpen ? "is-open" : ""}`} aria-hidden={!isOpen}>
      <button className="cart-backdrop" onClick={closeCart} aria-label="Close cart" tabIndex={-1} />
      <aside ref={drawerRef} id="cart-drawer" className="cart-drawer" aria-label="Shopping cart" role="dialog" aria-modal={isOpen} >
        <div className="cart-drawer-header">
          <div>
            <p className="eyebrow">Your bag</p>
            <h2>Ready to checkout</h2>
          </div>
          <button ref={closeButtonRef} className="icon-button" onClick={closeCart} aria-label="Close cart">
            <X size={19} />
          </button>
        </div>

        <div className="cart-items">
          {items.length === 0 ? (
            <div className="empty-cart">
              <ShoppingIllustration />
              <p>Your cart is empty.</p>
              <span>Add a product and it will appear here.</span>
            </div>
          ) : (
            items.map((item) => {
              const name = item.variant?.name || item.product?.name || "Product";
              const image = item.product?.image || "/products/placeholder.svg";
              const busy = busyIds.has(item.id);
              return (
                <div className="cart-item" key={item.id}>
                  <Image src={image} alt="" width={84} height={84} />
                  <div>
                    <strong>{name}</strong>
                    <span>{formatCurrency(item.unitPrice)}</span>
                    <div className="quantity-controls" aria-busy={busy}>
                      <button
                        aria-label={`Decrease ${name} quantity`}
                        disabled={busy}
                        onClick={() => runItemAction(item.id, () => updateQuantity(item.id, item.quantity - 1))}
                      >
                        <Minus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        aria-label={`Increase ${name} quantity`}
                        disabled={busy}
                        onClick={() => runItemAction(item.id, () => updateQuantity(item.id, item.quantity + 1))}
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        aria-label={`Remove ${name}`}
                        disabled={busy}
                        onClick={() => runItemAction(item.id, () => removeItem(item.id))}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="cart-summary">
          <div>
            <span>Subtotal</span>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>
          {items.length === 0 ? (
            <button disabled>Checkout</button>
          ) : (
            <Link className="checkout-link" href="/checkout" onClick={closeCart}>
              Checkout
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}

function ShoppingIllustration() {
  return (
    <svg viewBox="0 0 120 90" aria-hidden="true" className="empty-illustration">
      <rect x="21" y="26" width="76" height="48" rx="10" fill="#f0f0f2" />
      <path d="M39 35c0-12 8-21 20-21s20 9 20 21" fill="none" stroke="#1f8a70" strokeWidth="6" />
      <path d="M36 40h48l-5 28H42z" fill="#ffffff" stroke="#111111" strokeWidth="4" />
      <circle cx="48" cy="77" r="5" fill="#d45113" />
      <circle cx="73" cy="77" r="5" fill="#111111" />
    </svg>
  );
}
