import test from "node:test";
import assert from "node:assert/strict";

import {
  FULFILLMENT_STATUSES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
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
