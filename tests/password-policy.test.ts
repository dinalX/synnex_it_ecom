import test from "node:test";
import assert from "node:assert/strict";

import { validateNewPassword } from "@/lib/password-policy";

test("validateNewPassword rejects passwords shorter than 8 characters", () => {
  assert.equal(validateNewPassword("short1", "short1"), "Password must be at least 8 characters");
});

test("validateNewPassword rejects mismatched confirmation", () => {
  assert.equal(validateNewPassword("longenough1", "longenough2"), "Passwords do not match");
});

test("validateNewPassword accepts a valid matching password", () => {
  assert.equal(validateNewPassword("longenough1", "longenough1"), null);
});
