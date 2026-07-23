"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Barcode, Fingerprint, LayoutGrid, Monitor, Package, Printer, X } from "lucide-react";

const iconByName: Record<string, React.ComponentType<{ size?: number }>> = {
  Monitor,
  Barcode,
  Fingerprint,
  Printer,
};

export type CategoryBottomSheetItem = {
  slug: string;
  name: string;
  icon: string | null;
  accent: string;
  children: { slug: string; name: string }[];
};

type Category = CategoryBottomSheetItem;

interface CategoryBottomSheetProps {
  categories: Category[];
  /** Omit for a self-contained instance (own trigger banner + state), e.g. on the homepage. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hide the inline trigger banner when something else (e.g. the mobile bottom nav) opens this sheet. */
  hideTrigger?: boolean;
}

/**
 * Mobile category browsing: a compact trigger banner that opens a bottom
 * sheet. Can also be used as a controlled component (pass `open`/
 * `onOpenChange`) so an external trigger, like the mobile bottom nav, can
 * open the same sheet.
 */
export function CategoryBottomSheet({ categories, open: controlledOpen, onOpenChange, hideTrigger }: CategoryBottomSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
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
  }, [open, setOpen]);

  return (
    <div className={hideTrigger ? "category-sheet-global-only" : "category-sheet-mobile-only"}>
      {hideTrigger ? null : (
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
      )}

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
