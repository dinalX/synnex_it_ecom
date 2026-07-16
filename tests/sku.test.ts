import test from "node:test";
import assert from "node:assert/strict";

import { generateSku } from "@/lib/sku";

test("generateSku maps known categories to their short code", () => {
  assert.equal(generateSku("pos-solution", 1), "POS-001");
  assert.equal(generateSku("barcode-solution", 14), "BAR-014");
  assert.equal(generateSku("biometrics-security-solution", 7), "SEC-007");
  assert.equal(generateSku("pc-printer-solution", 32), "PCP-032");
});

test("generateSku falls back to a generic code for an unknown category", () => {
  assert.equal(generateSku("some-future-category", 5), "GEN-005");
});

test("generateSku zero-pads to 3 digits and is deterministic for the same inputs", () => {
  assert.equal(generateSku("pos-solution", 1), generateSku("pos-solution", 1));
  assert.equal(generateSku("pos-solution", 999), "POS-999");
});
