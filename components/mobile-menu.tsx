"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";

type Category = {
  id: string;
  slug: string;
  name: string;
};

interface MobileMenuProps {
  onClose: () => void;
}

export function MobileMenu({ onClose }: MobileMenuProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  // Focus first link and close on Escape
  useEffect(() => {
    const el = document.getElementById("mobile-menu");
    if (el) {
      const first = el.querySelector<HTMLElement>("a, button");
      first?.focus();
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div id="mobile-menu" ref={panelRef} className="mobile-menu-panel" role="dialog" aria-modal={true} aria-label="Mobile menu">
      <div className="mobile-menu-section">
        <strong>Categories</strong>
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/products?category=${cat.slug}`}
            onClick={onClose}
          >
            {cat.name}
          </Link>
        ))}
      </div>
      <div className="mobile-menu-section">
        <Link href="/products" onClick={onClose}>All Products</Link>
        <Link href="/pages/about" onClick={onClose}>About Us</Link>
        <Link href="/contact" onClick={onClose}>Contact Us</Link>
        <Link href="/careers" onClick={onClose}>Careers</Link>
      </div>
      <Link href="/account" className="mobile-menu-login" onClick={onClose}>
        My Account
      </Link>
    </div>
  );
}
