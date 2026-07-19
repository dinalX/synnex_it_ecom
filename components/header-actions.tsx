"use client";

import Link from "next/link";
import {
  BriefcaseBusiness,
  Download,
  LogIn,
  ShoppingBag,
} from "lucide-react";

interface HeaderActionsProps {
  totalItems: number;
  onOpenCart: () => void;
  isCartOpen?: boolean;
}

export function HeaderActions({ totalItems, onOpenCart, isCartOpen }: HeaderActionsProps) {
  return (
    <div className="header-actions">
      <Link
        href="/downloads"
        className="icon-button desktop-icon"
        aria-label="Open driver downloads"
      >
        <Download size={19} />
      </Link>
      <Link
        href="/careers"
        className="icon-button desktop-icon"
        aria-label="Open careers"
      >
        <BriefcaseBusiness size={19} />
      </Link>
      <Link
        href="/login"
        className="icon-button desktop-icon"
        aria-label="Customer login"
      >
        <LogIn size={19} />
      </Link>
      <button
        className="icon-button cart-button desktop-icon"
        onClick={onOpenCart}
        aria-label="Open cart"
        aria-haspopup="dialog"
        aria-expanded={!!isCartOpen}
        aria-controls="cart-drawer"
      >
        <ShoppingBag size={19} />
        {totalItems > 0 ? (
          // key remounts the badge when the count changes, restarting the pulse.
          <span key={totalItems} className="cart-count" aria-live="polite" aria-atomic="true">{totalItems}</span>
        ) : null}
      </button>
    </div>
  );
}
