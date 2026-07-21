import test from "node:test";
import assert from "node:assert/strict";

import { isLinkedInProfileUrl, isValidEmail, isValidHttpUrl, parseHttpUrl } from "@/lib/form-validation";

test("parseHttpUrl accepts http/https and rejects other schemes", () => {
  assert.ok(parseHttpUrl("https://example.com/cv.pdf"));
  assert.ok(parseHttpUrl("http://example.com"));
  assert.equal(parseHttpUrl("ftp://example.com"), null);
  assert.equal(parseHttpUrl("javascript:alert(1)"), null);
  assert.equal(parseHttpUrl("not a url"), null);
  assert.equal(parseHttpUrl(""), null);
});

test("isValidHttpUrl mirrors parseHttpUrl", () => {
  assert.equal(isValidHttpUrl("https://drive.google.com/file/d/abc/view"), true);
  assert.equal(isValidHttpUrl("mailto:x@y.com"), false);
});

test("isLinkedInProfileUrl accepts real profile/company URLs only", () => {
  assert.equal(isLinkedInProfileUrl("https://www.linkedin.com/in/jane-doe"), true);
  assert.equal(isLinkedInProfileUrl("https://linkedin.com/company/synnex"), true);
  assert.equal(isLinkedInProfileUrl("https://lk.linkedin.com/in/jane"), true);
  assert.equal(isLinkedInProfileUrl("https://linkedin.com/feed"), false);
  assert.equal(isLinkedInProfileUrl("https://linkedin.com"), false);
  assert.equal(isLinkedInProfileUrl("https://notlinkedin.com/in/jane"), false);
  assert.equal(isLinkedInProfileUrl("https://linkedin.com.evil.com/in/jane"), false);
});

test("isValidEmail accepts normal addresses and rejects malformed", () => {
  assert.equal(isValidEmail("jane@example.com"), true);
  assert.equal(isValidEmail("  jane@example.lk  "), true);
  assert.equal(isValidEmail("jane@"), false);
  assert.equal(isValidEmail("jane"), false);
  assert.equal(isValidEmail("jane @example.com"), false);
});
