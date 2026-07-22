"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Barcode, Fingerprint, LayoutGrid, Monitor, Package, Printer, X } from "lucide-react";
import type { fetchCategories } from "@/lib/data";

const iconByName: Record<string, React.ComponentType<{ size?: number }>> = {
  Monitor,
  Barcode,
  Fingerprint,
  Printer,
};

type Category = Awaited<ReturnType<typeof fetchCategories>>[number];

/**
 * Mobile-only entry point for category browsing: a compact trigger banner
 * that opens a bottom sheet, replacing the full-height inline grid (see
 * .category-showcase-grid) which pushed real product content down a full
 * screen of scrolling on small viewports.
 */
export function CategoryBottomSheet({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Same modal contract as the cart drawer: remember focus, move it in,
  // trap Tab, close on Escape, restore focus on close.
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !sheetRef.current) return;
      const focusables = sheetRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
  }, [open]);

  return (
    <div className="category-sheet-mobile-only">
      <button type="button" className="category-sheet-trigger" onClick={() => setOpen(true)}>
        <span className="category-sheet-trigger-icon">
          <LayoutGrid size={20} />
        </span>
        <span className="category-sheet-trigger-text">
          <strong>Browse Categories</strong>
          <span>POS, barcode, security &amp; more</span>
        </span>
        <ArrowRight size={18} />
      </button>

      <div className={`category-sheet-shell${open ? " is-open" : ""}`} aria-hidden={!open}>
        <button
          type="button"
          className="category-sheet-backdrop"
          onClick={() => setOpen(false)}
          aria-label="Close categories"
          tabIndex={-1}
        />
        <div
          ref={sheetRef}
          className="category-sheet"
          role="dialog"
          aria-modal={open}
          aria-label="Browse categories"
        >
          <div className="category-sheet-header">
            <h2>Browse categories</h2>
            <button
              ref={closeButtonRef}
              type="button"
              className="icon-button"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X size={19} />
            </button>
          </div>
          <div className="category-sheet-list">
            {categories.map((category) => {
              const Icon = iconByName[category.icon ?? ""] ?? Package;
              return (
                <Link
                  key={category.slug}
                  href={`/products?category=${category.slug}`}
                  className="category-sheet-item"
                  onClick={() => setOpen(false)}
                >
                  <span className="category-sheet-item-icon" style={{ ["--accent" as string]: category.accent }}>
                    <Icon size={20} />
                  </span>
                  <span className="category-sheet-item-text">
                    <strong>{category.name}</strong>
                    {category.children.length > 0 && <span>{category.children.length} categories</span>}
                  </span>
                  <ArrowRight size={16} />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
