import test from "node:test";
import assert from "node:assert/strict";

import { buildProductWhereInput } from "@/lib/product-filters";

test("product where input intersects search and category filters", () => {
  const where = buildProductWhereInput({
    search: "printer",
    category: { id: "cat_1", name: "POS Solution" },
  });

  assert.deepEqual(where, {
    published: true,
    AND: [
      {
        OR: [
          { name: { contains: "printer" } },
          { description: { contains: "printer" } },
        ],
      },
      {
        OR: [
          { categoryId: "cat_1" },
          { category: "POS Solution" },
        ],
      },
    ],
  });
});

test("subcategory narrows results after category resolution", () => {
  const where = buildProductWhereInput({
    search: "scanner",
    category: { id: "cat_1", name: "Barcode Solution" },
    subcategory: { name: "Barcode Scanners" },
  });

  assert.deepEqual(where, {
    published: true,
    AND: [
      {
        OR: [
          { name: { contains: "scanner" } },
          { description: { contains: "scanner" } },
        ],
      },
      {
        OR: [
          { categoryId: "cat_1" },
          { category: "Barcode Solution" },
        ],
      },
      { category: "Barcode Scanners" },
    ],
  });
});
