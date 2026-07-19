import test from "node:test";
import assert from "node:assert/strict";

import { generateResetToken, hashResetToken } from "@/lib/reset-token";

test("generateResetToken returns a token whose hash matches hashResetToken", () => {
  const { token, tokenHash } = generateResetToken();
  assert.equal(hashResetToken(token), tokenHash);
});

test("generateResetToken produces a different token on each call", () => {
  const a = generateResetToken();
  const b = generateResetToken();
  assert.notEqual(a.token, b.token);
  assert.notEqual(a.tokenHash, b.tokenHash);
});

test("hashResetToken is deterministic for the same input", () => {
  const { token } = generateResetToken();
  assert.equal(hashResetToken(token), hashResetToken(token));
});
