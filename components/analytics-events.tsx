"use client";

import { useEffect } from "react";

import { sendTrackingEvent, type AnalyticsEventPayload } from "@/lib/browser-tracking";

export function AnalyticsEvents() {
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<AnalyticsEventPayload>).detail;
      if (detail) {
        sendTrackingEvent(detail);
      }
    };

    window.addEventListener("synnex:track", handler as EventListener);
    return () => window.removeEventListener("synnex:track", handler as EventListener);
  }, []);

  return null;
}
