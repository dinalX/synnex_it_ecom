"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Reads state a pre-hydration inline script (app/admin/layout.tsx) already
    // set on <html> from localStorage before first paint. This can't be
    // computed during render (no `document` on the server, and it must match
    // the DOM the inline script already touched) — it's synchronizing from an
    // external system on mount, not deriving state, so it stays in an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.documentElement.getAttribute("data-admin-theme") === "dark");
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute("data-admin-theme", "dark");
      localStorage.setItem("adminTheme", "dark");
    } else {
      document.documentElement.removeAttribute("data-admin-theme");
      localStorage.setItem("adminTheme", "light");
    }
  }

  return (
    <DropdownMenuItem
      onSelect={(event) => {
        event.preventDefault();
        toggle();
      }}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      {isDark ? "Light mode" : "Dark mode"}
    </DropdownMenuItem>
  );
}
