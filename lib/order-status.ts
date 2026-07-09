export const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;

export const PAYMENT_STATUSES = [
  "AwaitingUpload",
  "PendingReview",
  "Paid",
  "Rejected",
] as const;

export const FULFILLMENT_STATUSES = [
  "Unfulfilled",
  "Processing",
  "Fulfilled",
] as const;

export const PAYMENT_UPLOAD_STATUSES = [
  "PendingReview",
  "Verified",
  "Rejected",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];
export type PaymentUploadStatus = (typeof PAYMENT_UPLOAD_STATUSES)[number];

function includesValue<T extends readonly string[]>(values: T, value: string): value is T[number] {
  return values.includes(value as T[number]);
}

export function isOrderStatus(value: string): value is OrderStatus {
  return includesValue(ORDER_STATUSES, value);
}

export function isPaymentStatus(value: string): value is PaymentStatus {
  return includesValue(PAYMENT_STATUSES, value);
}

export function isFulfillmentStatus(value: string): value is FulfillmentStatus {
  return includesValue(FULFILLMENT_STATUSES, value);
}

export function isPaymentUploadStatus(value: string): value is PaymentUploadStatus {
  return includesValue(PAYMENT_UPLOAD_STATUSES, value);
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-100 text-blue-800",
  verified: "bg-blue-100 text-blue-800",
  processing: "bg-blue-50 text-blue-700",
  shipped: "bg-green-100 text-green-800",
  delivered: "bg-green-50 text-green-700",
  completed: "bg-green-50 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  rejected: "bg-red-100 text-red-700",
  awaitingupload: "bg-amber-100 text-amber-800",
  pendingreview: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  unfulfilled: "bg-slate-100 text-slate-700",
};

/** Tailwind bg/text classes for a status badge, matching the legacy admin-orders.css palette. */
export function getStatusBadgeClass(status: string): string {
  const key = status.toLowerCase().replaceAll(" ", "").replaceAll("-", "");
  return STATUS_BADGE_CLASSES[key] || "bg-slate-100 text-slate-700";
}
