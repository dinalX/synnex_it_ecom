"use client";

import { useState, useRef, useCallback } from "react";

/**
 * Hook for managing hover-based dropdown state.
 * Only one dropdown can be open at a time.
 * Opens on hover, closes 150ms after mouse leaves.
 */
export function useHoverDropdown() {
  const [openId, setOpenId] = useState<string | null>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = useCallback((id: string) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setOpenId(id);
  }, []);

  const scheduleClose = useCallback(() => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setOpenId(null), 150);
  }, []);

  const cancelClose = useCallback(() => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
  }, []);

  const toggle = useCallback((id: string) => {
    setOpenId((current) => (current === id ? null : id));
  }, []);


  return { openId, open, scheduleClose, cancelClose, toggle };
}
