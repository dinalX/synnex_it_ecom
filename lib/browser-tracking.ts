"use client";

export type AnalyticsContentItem = {
  id: string;
  quantity: number;
  item_price?: number;
};

export type AnalyticsEventPayload = {
  eventName: string;
  eventSourceUrl?: string;
  eventId?: string;
  email?: string;
  phone?: string;
  value?: number;
  currency?: string;
  contents?: AnalyticsContentItem[];
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

function normalizeGtagEventName(eventName: string) {
  switch (eventName) {
    case "AddToCart":
      return "add_to_cart";
    case "InitiateCheckout":
      return "begin_checkout";
    case "Purchase":
      return "purchase";
    default:
      return eventName.toLowerCase().replaceAll(/[^a-z0-9]+/g, "_");
  }
}

function getEventSourceUrl(payload: AnalyticsEventPayload) {
  if (payload.eventSourceUrl) {
    return payload.eventSourceUrl;
  }

  if (typeof window !== "undefined") {
    return window.location.href;
  }

  return undefined;
}

export function sendTrackingEvent(payload: AnalyticsEventPayload) {
  if (typeof window === "undefined") {
    return;
  }

  const eventSourceUrl = getEventSourceUrl(payload);
  const customData = {
    currency: payload.currency || "LKR",
    value: payload.value,
    contents: payload.contents,
  };

  if (typeof window.gtag === "function") {
    window.gtag("event", normalizeGtagEventName(payload.eventName), {
      event_id: payload.eventId,
      currency: customData.currency,
      value: customData.value,
      items: payload.contents,
    });
  }

  if (typeof window.fbq === "function") {
    window.fbq("track", payload.eventName, customData, payload.eventId ? { eventID: payload.eventId } : undefined);
  }

  const body = JSON.stringify({ ...payload, eventSourceUrl });
  if (typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon("/api/facebook/capi", new Blob([body], { type: "application/json" }));
    return;
  }

  void fetch("/api/facebook/capi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export function dispatchTrackingEvent(payload: AnalyticsEventPayload) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<AnalyticsEventPayload>("synnex:track", { detail: payload }));
}
