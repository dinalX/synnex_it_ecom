import test from "node:test";
import assert from "node:assert/strict";

import { HERO_BANNER_THEMES, isHeroBannerTheme } from "@/lib/hero-banner-theme";

test("hero banner theme guard accepts only cataloged themes", () => {
  assert.equal(isHeroBannerTheme("light"), true);
  assert.equal(isHeroBannerTheme("dark"), true);
  assert.equal(isHeroBannerTheme("neon"), false);
  assert.equal(isHeroBannerTheme(""), false);
});

test("theme catalog has exactly the two supported values", () => {
  assert.deepEqual(HERO_BANNER_THEMES, ["light", "dark"]);
});
