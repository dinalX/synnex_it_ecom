"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import {
  BriefcaseBusiness,
  ClipboardList,
  Database,
  Download,
  FileText,
  Gauge,
  Package,
  Settings,
  Users,
} from "lucide-react";

const navItems = [
  { label: "Overview", icon: Gauge, href: "/admin" },
  { label: "Orders", icon: ClipboardList, href: "/admin/orders" },
  { label: "Products", icon: Package, href: "/admin/products" },
  { label: "Customers", icon: Users, href: "/admin/orders" },
  { label: "Content", icon: FileText, href: "/admin/content" },
  { label: "Careers", icon: BriefcaseBusiness, href: "/admin/careers" },
  { label: "Downloads", icon: Download, href: "/admin/downloads" },
  { label: "Pages", icon: Database, href: "/admin/pages" },
  { label: "Settings", icon: Settings, href: "/admin/settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        className="admin-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {mobileOpen && (
        <div className="admin-mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`admin-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <Link href="/" className="brand admin-brand">
          <span className="brand-mark">S</span>
          <span>Synnex</span>
        </Link>
        <nav aria-label="Admin navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                href={item.href}
                className={isActive ? "active" : ""}
                key={item.label}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
