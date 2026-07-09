import test from "node:test";
import assert from "node:assert/strict";

import {
  FULFILLMENT_STATUSES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  getStatusBadgeClass,
  isFulfillmentStatus,
  isOrderStatus,
  isPaymentStatus,
} from "@/lib/order-status";

test("shared order status guards accept only supported values", () => {
  assert.deepEqual(ORDER_STATUSES, [
    "Pending",
    "Confirmed",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
  ]);
  assert.equal(isOrderStatus("Confirmed"), true);
  assert.equal(isOrderStatus("Refunded"), false);
});

test("shared payment and fulfillment status guards reject invalid values", () => {
  assert.deepEqual(PAYMENT_STATUSES, [
    "AwaitingUpload",
    "PendingReview",
    "Paid",
    "Rejected",
  ]);
  assert.deepEqual(FULFILLMENT_STATUSES, [
    "Unfulfilled",
    "Processing",
    "Fulfilled",
  ]);

  assert.equal(isPaymentStatus("Paid"), true);
  assert.equal(isPaymentStatus("Approved"), false);
  assert.equal(isFulfillmentStatus("Fulfilled"), true);
  assert.equal(isFulfillmentStatus("Delivered"), false);
});

test("status badge class lookup is case/format insensitive with a safe fallback", () => {
  assert.equal(getStatusBadgeClass("Paid"), "bg-emerald-100 text-emerald-800");
  assert.equal(getStatusBadgeClass("Pending Review"), "bg-amber-100 text-amber-800");
  assert.equal(getStatusBadgeClass("pending-review"), "bg-amber-100 text-amber-800");
  assert.equal(getStatusBadgeClass("SomeUnknownStatus"), "bg-slate-100 text-slate-700");
});
