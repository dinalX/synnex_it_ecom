import test from "node:test";
import assert from "node:assert/strict";

import { PERMISSIONS, PERMISSION_GROUPS, isPermission } from "@/lib/permissions";

test("permission guard accepts only cataloged keys", () => {
  assert.equal(isPermission("product.view"), true);
  assert.equal(isPermission("admin.manage"), true);
  assert.equal(isPermission("product.launch-rockets"), false);
});

test("permission groups only reference cataloged keys", () => {
  const grouped = PERMISSION_GROUPS.flatMap((group) => group.keys);
  for (const key of grouped) {
    assert.equal(PERMISSIONS.includes(key), true, `${key} missing from PERMISSIONS`);
  }
  assert.equal(grouped.length, PERMISSIONS.length);
});
