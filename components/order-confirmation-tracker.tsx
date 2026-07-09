"use client";

import { useEffect } from "react";

import { dispatchTrackingEvent } from "@/lib/browser-tracking";

type OrderConfirmationTrackerProps = {
  orderId: string;
  email?: string | null;
  phone?: string | null;
  total: number;
  contents: Array<{ id: string; quantity: number; item_price: number }>;
  paymentUploadId?: string;
};

export function OrderConfirmationTracker({
  orderId,
  email,
  phone,
  total,
  contents,
  paymentUploadId,
}: OrderConfirmationTrackerProps) {
  useEffect(() => {
    const purchaseKey = `synnex:order-placed:${orderId}`;
    if (!window.sessionStorage.getItem(purchaseKey)) {
      dispatchTrackingEvent({
        eventName: "Purchase",
        eventId: purchaseKey,
        email: email || undefined,
        phone: phone || undefined,
        value: total,
        currency: "LKR",
        contents,
      });
      window.sessionStorage.setItem(purchaseKey, "1");
    }

    if (!paymentUploadId) {
      return;
    }

    const paymentProofKey = `synnex:payment-proof:${paymentUploadId}`;
    if (window.sessionStorage.getItem(paymentProofKey)) {
      return;
    }

    dispatchTrackingEvent({
      eventName: "PaymentProofSubmitted",
      eventId: paymentProofKey,
      email: email || undefined,
      phone: phone || undefined,
      value: total,
      currency: "LKR",
      contents,
    });
    window.sessionStorage.setItem(paymentProofKey, "1");
  }, [contents, email, orderId, paymentUploadId, phone, total]);

  return null;
}
