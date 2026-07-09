"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/products?search=${encodeURIComponent(q)}`);
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div className="header-search" ref={panelRef}>
      <button
        className="icon-button search-toggle"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close search" : "Search products"}
        aria-expanded={open}
        aria-controls="search-panel"
      >
        {open ? <X size={19} /> : <Search size={19} />}
      </button>
      {open && (
        <div id="search-panel" className="search-panel" role="search" aria-label="Product search">
          <form className="search-panel-form" onSubmit={handleSubmit}>
            <Search size={16} className="search-panel-icon" />
            <input
              ref={inputRef}
              type="search"
              name="search"
              placeholder="Search POS, barcode, biometric..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search products"
            />
            {query && (
              <button
                type="button"
                className="search-panel-clear"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
