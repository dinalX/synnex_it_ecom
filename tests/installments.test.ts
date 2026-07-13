import test from "node:test";
import assert from "node:assert/strict";

import { kokoMonthlyInstallment } from "@/lib/installments";

test("koko installment adds 12% then splits across 3 months", () => {
  // 30000 * 1.12 = 33600 → 11200/month
  assert.equal(kokoMonthlyInstallment(30000), 11200);
  // 19500 * 1.12 = 21840 → 7280/month
  assert.equal(kokoMonthlyInstallment(19500), 7280);
});

test("koko installment rounds to whole rupees", () => {
  // 100 * 1.12 = 112 → 37.33... → 37
  assert.equal(kokoMonthlyInstallment(100), 37);
  assert.equal(Number.isInteger(kokoMonthlyInstallment(123456)), true);
});
