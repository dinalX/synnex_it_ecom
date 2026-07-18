"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import {
  Bell,
  BriefcaseBusiness,
  ChevronsUpDown,
  ClipboardList,
  Database,
  Download,
  FileText,
  GalleryHorizontal,
  Gauge,
  LayoutList,
  LogOut,
  Package,
  Settings,
  User,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Permission } from "@/lib/permissions";

const navItems: { label: string; icon: typeof Gauge; href: string; permission?: Permission }[] = [
  { label: "Overview", icon: Gauge, href: "/admin" },
  { label: "Orders", icon: ClipboardList, href: "/admin/orders", permission: "order.view" },
  { label: "Products", icon: Package, href: "/admin/products", permission: "product.view" },
  { label: "Hero Banners", icon: GalleryHorizontal, href: "/admin/hero-banners", permission: "hero-banner.view" },
  { label: "Home Sections", icon: LayoutList, href: "/admin/home-sections", permission: "home-section.view" },
  { label: "Content", icon: FileText, href: "/admin/content" },
  { label: "Careers", icon: BriefcaseBusiness, href: "/admin/careers", permission: "career.view" },
  { label: "Downloads", icon: Download, href: "/admin/downloads", permission: "download.view" },
  { label: "Pages", icon: Database, href: "/admin/pages", permission: "page.view" },
  { label: "Settings", icon: Settings, href: "/admin/settings", permission: "settings.view" },
  { label: "Team", icon: UsersRound, href: "/admin/team", permission: "admin.manage" },
];

export function AdminSidebarNav({
  role,
  permissions,
  name,
  email,
}: {
  role: string;
  permissions: string[];
  name: string;
  email: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSuperAdmin = role === "SuperAdmin";
  const visibleItems = navItems.filter(
    (item) => !item.permission || isSuperAdmin || permissions.includes(item.permission),
  );

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

      <aside
        className={cn(
          "sticky top-0 flex h-screen w-[250px] flex-col overflow-y-auto border-r border-border bg-card p-6",
          "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-[100] max-md:shadow-lg max-md:transition-transform max-md:duration-300 max-md:-translate-x-full",
          mobileOpen && "max-md:translate-x-0",
        )}
      >
        <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-bold text-foreground no-underline">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm text-primary-foreground">
            S
          </span>
          <span>Synnex</span>
        </Link>
        <nav aria-label="Admin navigation" className="flex flex-col gap-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Button
                key={item.label}
                asChild
                variant="ghost"
                className={cn(
                  "justify-start gap-2.5 font-semibold text-muted-foreground",
                  isActive && "bg-accent text-accent-foreground",
                )}
                onClick={() => setMobileOpen(false)}
              >
                <Link href={item.href}>
                  <Icon size={18} />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>
        <div className="mt-auto pt-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2.5 font-semibold text-muted-foreground"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {name ? name.charAt(0).toUpperCase() : "?"}
                </span>
                <span className="min-w-0 flex-1 truncate text-left">{name || "Admin"}</span>
                <ChevronsUpDown size={14} className="shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-[calc(250px-3rem)]">
              <DropdownMenuLabel className="flex flex-col gap-0.5 normal-case tracking-normal">
                <span className="text-sm font-semibold text-foreground">{name || "Admin"}</span>
                <span className="truncate text-xs font-normal text-muted-foreground">{email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/profile">
                  <User size={16} />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/notifications">
                  <Bell size={16} />
                  Notifications
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/*
                The <form> lives outside the DropdownMenuItem/asChild merge
                and is associated to the button below via the `form`
                attribute (not DOM nesting) — a Radix menu item's keyboard
                activation calls .click() on whatever DOM node asChild
                merges its role onto. A <form> has no native click-triggered
                submit behavior (only a real submit <button> does), so
                asChild must target the <button> itself for Enter/Space to
                actually submit, not just a real mouse click on it.
              */}
              <form id="admin-logout-form" action="/api/auth/logout" method="post" className="hidden" />
              <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                <button type="submit" form="admin-logout-form" className="flex w-full items-center gap-2">
                  <LogOut size={16} />
                  Log out
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}
