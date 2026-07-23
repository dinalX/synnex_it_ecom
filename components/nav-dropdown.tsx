"use client";

import Link from "next/link";
import { Barcode, ChevronDown, ChevronRight, Fingerprint, Monitor, Package, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { BorderBeam } from "@/components/ui/border-beam";

type Subcategory = { id: string; slug: string; name: string };
type Category = {
  id: string;
  slug: string;
  name: string;
  icon?: string | null;
  accent?: string | null;
  children?: Subcategory[];
};

const iconByName: Record<string, React.ComponentType<{ size?: number }>> = {
  Monitor,
  Barcode,
  Fingerprint,
  Printer,
};

interface NavDropdownProps {
  id: string;
  label: string;
  isOpen: boolean;
  onOpen: (id: string) => void;
  onScheduleClose: () => void;
  onCancelClose: () => void;
  onToggle: (id: string) => void;
  menuClassName?: string;
  href?: string;
  children: React.ReactNode;
}

export function NavDropdown({ id, label, isOpen, onOpen, onScheduleClose, onCancelClose, onToggle, menuClassName, href, children }: NavDropdownProps) {
  const menuId = `${id}-menu`;

  return (
    <div className={"nav-dropdown" + (isOpen ? " open" : "")} onMouseEnter={() => onOpen(id)} onMouseLeave={onScheduleClose}>
      {href ? (
        <Link
          href={href}
          className="nav-trigger"
          onClick={() => onToggle(id)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-controls={menuId}
          onKeyDown={(e: React.KeyboardEvent<HTMLAnchorElement>) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              onOpen(id);
              const menu = document.getElementById(menuId);
              const first = menu?.querySelector<HTMLElement>("a, button");
              first?.focus();
            }
          }}
        >
          {label}
          <ChevronDown size={15} className="nav-chevron" />
        </Link>
      ) : (
        <button
          className="nav-trigger"
          onClick={() => onToggle(id)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-controls={menuId}
          onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              onOpen(id);
              const menu = document.getElementById(menuId);
              const first = menu?.querySelector<HTMLElement>("a, button");
              first?.focus();
            }
          }}
        >
          {label}
          <ChevronDown size={15} className="nav-chevron" />
        </button>
      )}
      <div id={menuId} className={"dropdown-menu" + (menuClassName ? " " + menuClassName : "")} role="menu" onMouseEnter={onCancelClose} onMouseLeave={onScheduleClose}>
        {children}
        {isOpen ? <BorderBeam colorFrom="#17795f" colorTo="#111111" size={90} duration={6} /> : null}
      </div>
    </div>
  );
}

export function ProductsDropdown() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  return (
    <div className="products-dropdown">
      {categories.map((cat, index) => {
        const Icon = iconByName[cat.icon ?? ""] ?? Package;
        return (
        <div
          key={cat.slug}
          className="products-dropdown-group"
          style={{ ["--stagger" as string]: index, ["--accent" as string]: cat.accent || "var(--green)" }}
        >
          <Link role="menuitem" href={`/products?category=${cat.slug}`} className="products-dropdown-title">
            <span className="products-dropdown-title-icon">
              <Icon size={16} />
            </span>
            {cat.name}
            <ChevronRight size={13} className="products-dropdown-title-arrow" />
          </Link>
          <div className="products-dropdown-subs">
            {(cat.children || []).map((sub) => (
              <Link
                key={sub.slug}
                role="menuitem"
                href={`/products?category=${cat.slug}&subcategory=${sub.slug}`}
                className="products-dropdown-sub"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
        );
      })}
    </div>
  );
}
