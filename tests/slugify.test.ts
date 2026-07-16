import test from "node:test";
import assert from "node:assert/strict";

import { slugify } from "@/lib/slugify";

test("slugify lowercases and hyphenates whitespace", () => {
  assert.equal(slugify("Warehouse Assistant"), "warehouse-assistant");
});

test("slugify strips punctuation", () => {
  assert.equal(slugify("Sales Executive - POS Solutions!"), "sales-executive-pos-solutions");
});

test("slugify collapses repeated hyphens and trims leading/trailing ones", () => {
  assert.equal(slugify("  --Multiple   Spaces--  "), "multiple-spaces");
});
