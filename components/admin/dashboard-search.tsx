"use client";

import { useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function DashboardSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || !query.trim()) return;
    router.push(`/admin/orders?search=${encodeURIComponent(query.trim())}`);
  }

  return (
    <label className="flex h-11 w-full max-w-[420px] items-center gap-2 rounded-lg border border-border bg-card px-3">
      <Search size={18} className="text-muted-foreground" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search orders by number, name, or email…"
        className="h-full w-full bg-transparent text-sm outline-none"
      />
    </label>
  );
}
