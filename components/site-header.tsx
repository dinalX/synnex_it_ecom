"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CartDrawer } from "@/components/cart-drawer";
import { useCart } from "@/components/cart-provider";
import { CategoryBottomSheet, type CategoryBottomSheetItem } from "@/components/category-bottom-sheet";
import { HeaderSearch } from "@/components/header-search";
import { HeaderActions } from "@/components/header-actions";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { NavDropdown, ProductsDropdown } from "@/components/nav-dropdown";
import { useHoverDropdown } from "@/components/use-hover-dropdown";

export function SiteHeader() {
  const { totalItems, openCart, isOpen: isCartOpen } = useCart();
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryBottomSheetItem[]>([]);
  const { openId, open, scheduleClose, cancelClose, toggle } = useHoverDropdown();

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  return (
    <>
      <header className="site-header">
        <div className="top-row">
          <div className="top-row-left">
            <Link href="/" className="brand" aria-label="Synnex Commerce home">
              <Image
                src="/logo-mark.png"
                alt="Synnex"
                width={32}
                height={32}
                className="brand-logo-mark"
                priority
              />
              <Image
                src="/logo.png"
                alt="Synnex IT Solution"
                width={164}
                height={32}
                className="brand-logo-full"
                priority
              />
            </Link>
            <nav className="desktop-nav" aria-label="Primary navigation">
              <NavDropdown
                id="products"
                label="Products"
                href="/products"
                isOpen={openId === "products"}
                onOpen={open}
                onScheduleClose={scheduleClose}
                onCancelClose={cancelClose}
                onToggle={toggle}
              >
                <ProductsDropdown />
              </NavDropdown>
              <Link href="/services">Services</Link>
              <Link href="/downloads">Drivers</Link>
              <Link href="/careers">Careers</Link>
            </nav>
          </div>

          <div className="top-row-right">
            <HeaderSearch />
            <HeaderActions totalItems={totalItems} onOpenCart={openCart} isCartOpen={isCartOpen} />
          </div>
        </div>
      </header>
      <MobileBottomNav
        totalItems={totalItems}
        onOpenCart={openCart}
        categoriesOpen={categorySheetOpen}
        onToggleCategories={() => setCategorySheetOpen((value) => !value)}
      />
      <CategoryBottomSheet
        categories={categories}
        open={categorySheetOpen}
        onOpenChange={setCategorySheetOpen}
        hideTrigger
      />
      <CartDrawer />
    </>
  );
}
