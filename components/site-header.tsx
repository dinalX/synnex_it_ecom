"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { CartDrawer } from "@/components/cart-drawer";
import { useCart } from "@/components/cart-provider";
import { HeaderSearch } from "@/components/header-search";
import { HeaderActions } from "@/components/header-actions";
import { MobileMenu } from "@/components/mobile-menu";
import { NavDropdown, ProductsDropdown, SupportDropdown } from "@/components/nav-dropdown";
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
              <Link href="/services/pos">Services</Link>
              <Link href="/downloads">Drivers</Link>
              <Link href="/careers">Careers</Link>
            </nav>
          </div>

          <div className="top-row-right">
            <HeaderSearch />
            <HeaderActions totalItems={totalItems} onOpenCart={openCart} isCartOpen={isCartOpen} />
            <button
              id="mobile-menu-toggle"
              className={"icon-button mobile-menu" + (mobileOpen ? " active" : "")}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen && <MobileMenu onClose={() => setMobileOpen(false)} />}
      </header>
      <CartDrawer />
    </>
  );
}
