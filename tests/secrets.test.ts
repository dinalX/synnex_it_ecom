import test from "node:test";
import assert from "node:assert/strict";

process.env.AUTH_SECRET = process.env.AUTH_SECRET || "test-secret-for-round-trip";

import { decryptSecret, encryptSecret } from "@/lib/secrets";

test("secrets round-trip through encrypt/decrypt", async () => {
  const token = "EAAB-meta-capi-access-token-1234567890";
  const encrypted = await encryptSecret(token);

  assert.notEqual(encrypted, token);
  assert.equal(encrypted.includes(token), false);
  assert.equal(await decryptSecret(encrypted), token);
});

test("distinct encryptions of the same value differ (random IV) but both decrypt", async () => {
  const a = await encryptSecret("same-value");
  const b = await encryptSecret("same-value");
  assert.notEqual(a, b);
  assert.equal(await decryptSecret(a), "same-value");
  assert.equal(await decryptSecret(b), "same-value");
});

test("malformed or tampered ciphertext decrypts to null", async () => {
  assert.equal(await decryptSecret("not-real-ciphertext"), null);
  assert.equal(await decryptSecret(""), null);
  const valid = await encryptSecret("value");
  const tampered = valid.slice(0, -4) + (valid.endsWith("AAAA") ? "BBBB" : "AAAA");
  assert.equal(await decryptSecret(tampered), null);
});
