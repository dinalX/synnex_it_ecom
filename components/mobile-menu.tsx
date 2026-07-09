"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";

type Category = {
  id: string;
  slug: string;
  name: string;
};

const solutionItems = [
  { label: "POS Solution", href: "/services/pos" },
  { label: "Barcode Solution", href: "/services/barcode" },
  { label: "Biometrics & Security", href: "/services/security" },
];

const supportItems = [
  { label: "Software Drivers", href: "/downloads" },
  { label: "Careers", href: "/careers" },
];

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
        <strong>Products</strong>
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
        <strong>Solutions</strong>
        {solutionItems.map((item) => (
          <Link key={item.href} href={item.href} onClick={onClose}>
            {item.label}
          </Link>
        ))}
      </div>
      <div className="mobile-menu-section">
        <strong>Support</strong>
        {supportItems.map((item) => (
          <Link key={item.href} href={item.href} onClick={onClose}>
            {item.label}
          </Link>
        ))}
      </div>
      <Link href="/account" className="mobile-menu-login" onClick={onClose}>
        My Account
      </Link>
    </div>
  );
}
