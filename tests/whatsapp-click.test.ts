import test from "node:test";
import assert from "node:assert/strict";

import {
  WHATSAPP_CLICK_KINDS,
  WHATSAPP_CLICK_SERVICES,
  isWhatsappClickKind,
  isWhatsappClickService,
} from "@/lib/whatsapp-click";

test("whatsapp click kind guard accepts only cataloged values", () => {
  for (const kind of WHATSAPP_CLICK_KINDS) {
    assert.equal(isWhatsappClickKind(kind), true);
  }
  assert.equal(isWhatsappClickKind("unknown"), false);
});

test("whatsapp click service guard accepts only cataloged values", () => {
  for (const service of WHATSAPP_CLICK_SERVICES) {
    assert.equal(isWhatsappClickService(service), true);
  }
  assert.equal(isWhatsappClickService("unknown"), false);
});
