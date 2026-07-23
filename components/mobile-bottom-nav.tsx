"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, LayoutGrid, Search, User, ShoppingBag, X } from "lucide-react";

interface MobileBottomNavProps {
  totalItems: number;
  onOpenCart: () => void;
  categoriesOpen: boolean;
  onToggleCategories: () => void;
}

export function MobileBottomNav({ totalItems, onOpenCart, categoriesOpen, onToggleCategories }: MobileBottomNavProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [accountHref, setAccountHref] = useState("/login");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setAccountHref("/account");
      })
      .catch(() => {});
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/products?search=${encodeURIComponent(q)}`);
      setSearchOpen(false);
      setQuery("");
    }
  }

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {searchOpen ? (
        <div className="mobile-bottom-search-panel" role="search">
          <form onSubmit={handleSearchSubmit}>
            <Search size={16} />
            <input
              type="search"
              autoFocus
              placeholder="Search POS, barcode, biometric..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search products"
            />
          </form>
        </div>
      ) : null}

      <Link
        href="/"
        className="mobile-bottom-nav-item"
        aria-label="Home"
        onClick={() => setSearchOpen(false)}
      >
        <Home size={22} />
      </Link>
      <button
        type="button"
        className="mobile-bottom-nav-item"
        onClick={() => {
          setSearchOpen(false);
          onToggleCategories();
        }}
        aria-label={categoriesOpen ? "Close categories" : "Categories"}
        aria-expanded={categoriesOpen}
      >
        {categoriesOpen ? <X size={22} /> : <LayoutGrid size={22} />}
      </button>
      <button
        type="button"
        className="mobile-bottom-nav-item"
        onClick={() => setSearchOpen((open) => !open)}
        aria-label={searchOpen ? "Close search" : "Search"}
        aria-expanded={searchOpen}
      >
        {searchOpen ? <X size={22} /> : <Search size={22} />}
      </button>
      <Link
        href={accountHref}
        className="mobile-bottom-nav-item"
        aria-label="Account"
        onClick={() => setSearchOpen(false)}
      >
        <User size={22} />
      </Link>
      <button
        type="button"
        className="mobile-bottom-nav-item"
        onClick={() => {
          setSearchOpen(false);
          onOpenCart();
        }}
        aria-label="Open cart"
      >
        <ShoppingBag size={22} />
        {totalItems > 0 ? (
          <span key={totalItems} className="mobile-bottom-nav-badge" aria-live="polite" aria-atomic="true">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        ) : null}
      </button>
    </nav>
  );
}
