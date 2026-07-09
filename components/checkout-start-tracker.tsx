"use client";

import { useEffect } from "react";

import { dispatchTrackingEvent } from "@/lib/browser-tracking";

type CheckoutStartTrackerProps = {
  cartId: string;
  subtotal: number;
  contents: Array<{ id: string; quantity: number; item_price: number }>;
};

export function CheckoutStartTracker({
  cartId,
  subtotal,
  contents,
}: CheckoutStartTrackerProps) {
  useEffect(() => {
    const storageKey = `synnex:checkout-start:${cartId}`;
    if (window.sessionStorage.getItem(storageKey)) {
      return;
    }

    dispatchTrackingEvent({
      eventName: "InitiateCheckout",
      eventId: storageKey,
      value: subtotal,
      currency: "LKR",
      contents,
    });
    window.sessionStorage.setItem(storageKey, "1");
  }, [cartId, subtotal, contents]);

  return null;
}
