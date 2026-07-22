"use client";

import { useState } from "react";
import Link from "next/link";
import { CartDrawer } from "@/components/cart-drawer";
import { useCart } from "@/components/cart-provider";
import { HeaderSearch } from "@/components/header-search";
import { HeaderActions } from "@/components/header-actions";
import { MobileMenu } from "@/components/mobile-menu";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { NavDropdown, ProductsDropdown } from "@/components/nav-dropdown";
import { useHoverDropdown } from "@/components/use-hover-dropdown";

export function SiteHeader() {
  const { totalItems, openCart, isOpen: isCartOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openId, open, scheduleClose, cancelClose, toggle } = useHoverDropdown();

  return (
    <>
      <header className="site-header">
        <div className="top-row">
          <div className="top-row-left">
            <Link href="/" className="brand" aria-label="Synnex Commerce home">
              <span className="brand-mark">S</span>
              <span>Synnex</span>
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

        {mobileOpen && <MobileMenu onClose={() => setMobileOpen(false)} />}
      </header>
      <MobileBottomNav
        totalItems={totalItems}
        onOpenCart={openCart}
        menuOpen={mobileOpen}
        onToggleMenu={() => setMobileOpen((open) => !open)}
      />
      <CartDrawer />
    </>
  );
}
