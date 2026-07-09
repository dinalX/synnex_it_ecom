"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

type Subcategory = { id: string; slug: string; name: string };
type Category = { id: string; slug: string; name: string; children?: Subcategory[] };

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
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px", padding: "8px 0" }}>
      {categories.map((cat) => (
        <div key={cat.slug}>
          <Link role="menuitem" href={`/products?category=${cat.slug}`} style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--ink)", padding: "6px 12px 4px", display: "block" }}>
            {cat.name}
          </Link>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 8px", padding: "0 12px 8px" }}>
            {(cat.children || []).map((sub) => (
              <Link key={sub.slug} role="menuitem" href={`/products?category=${cat.slug}&subcategory=${sub.slug}`} style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SupportDropdown() {
  const items = [
    { label: "Software Drivers", href: "/downloads" },
    { label: "Careers", href: "/careers" },
    { label: "Checkout", href: "/checkout" },
  ];

  return (
    <>
      {items.map((item) => (
        <Link key={item.href} role="menuitem" href={item.href}>
          {item.label}
        </Link>
      ))}
    </>
  );
}
