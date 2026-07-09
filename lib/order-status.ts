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
