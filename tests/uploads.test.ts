import test from "node:test";
import assert from "node:assert/strict";

import { sniffImageExtension, sniffProofExtension } from "@/lib/uploads";

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const PNG = Buffer.concat([Buffer.from([0x89]), Buffer.from("PNG\r\n"), Buffer.alloc(8)]);
const PDF = Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.alloc(8)]);
const TEXT = Buffer.from("just some text, definitely not an image");

test("image sniffing recognizes real formats and rejects text", () => {
  assert.equal(sniffImageExtension(JPEG), "jpg");
  assert.equal(sniffImageExtension(PNG), "png");
  assert.equal(sniffImageExtension(TEXT), null);
  assert.equal(sniffImageExtension(PDF), null);
});

test("proof sniffing additionally accepts PDF slips", () => {
  assert.equal(sniffProofExtension(PDF), "pdf");
  assert.equal(sniffProofExtension(JPEG), "jpg");
  assert.equal(sniffProofExtension(TEXT), null);
});
