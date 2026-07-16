/**
 * Builds prisma/catalog.json — the full synnex.lk product catalog — by
 * crawling the live category listing pages (product→category mapping, current
 * prices, sale prices, stock status) and joining with the Google Shopping
 * feed CSV (descriptions, images, cleaner titles). Products missing from the
 * feed get their description/image scraped from their product page. All
 * remote images are downloaded into public/uploads/products/.
 *
 * Idempotent and re-runnable:
 *   npx tsx scripts/import-catalog.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";

import { sniffImageExtension } from "@/lib/uploads";
import { localImagePathFor, UPLOADS_DIR_URL } from "@/prisma/feed-images";

const BASE = "https://synnex.lk";

// Full leaf/branch list from https://synnex.lk/productcat-sitemap.xml.
// Parent categories are included so products assigned only to a parent
// (no leaf) still get captured; the deepest path wins per product.
const CATEGORY_PATHS = [
  "pos-solution",
  "pos-solution/pos-machine",
  "pos-solution/cash-register",
  "pos-solution/pos-printers",
  "pos-solution/pos-paper-roll",
  "pos-solution/cash-drawer",
  "pos-solution/cash-counting-machine",
  "pos-solution/customer-display",
  "pos-solution/handheld-pos",
  "pos-solution/kiosk",
  "pos-solution/mobile-data-collector",
  "pos-solution/mobile-printers",
  "pos-solution/restaurant-pagers",
  "barcode-solution",
  "barcode-solution/barcode-label-printers",
  "barcode-solution/barcode-label-printers/industrial-label-printers",
  "barcode-solution/barcode-label-roll",
  "barcode-solution/barcode-label-roll/direct-thermal-label-sticker-roll",
  "barcode-solution/barcode-label-roll/thermal-transfer-label-sticker-roll",
  "barcode-solution/barcode-label-roll/thermal-transfer-wax-ribbon-roll",
  "barcode-solution/barcode-scanners",
  "barcode-solution/barcode-scanners/desktop-barcode-scanner",
  "barcode-solution/barcode-scanners/handheld-barcode-scanner",
  "barcode-solution/barcode-scanners/wireless-barcode-scanners",
  "biometrics-security-solution",
  "biometrics-security-solution/safe-locker",
  "biometrics-security-solution/smart-door-lock",
  "biometrics-security-solution/time-attendance-fingerprint-solution",
  "biometrics-security-solution/wireless-ip-camera",
  "pc-printer-solution",
  "pc-printer-solution/all-in-one-pc",
  "pc-printer-solution/key-board-and-mouse",
  "pc-printer-solution/monitor",
  "pc-printer-solution/network-solution",
  "pc-printer-solution/power-supply",
  "pc-printer-solution/printers-solution",
  "pc-printer-solution/printers-solution/a4-printers",
  "pc-printer-solution/printers-solution/card-printer",
  "pc-printer-solution/printers-solution/handheld-printer",
  "pc-printer-solution/ups",
];

const ACCENT_BY_MAIN: Record<string, string> = {
  "pos-solution": "#1f8a70",
  "barcode-solution": "#f0a202",
  "biometrics-security-solution": "#6b7f82",
  "pc-printer-solution": "#2d6cdf",
};

type Listing = {
  slug: string;
  name: string;
  price: number | null;
  compareAt: number | null;
  outOfStock: boolean;
  categoryPath: string;
};

type FeedRow = {
  slug: string;
  title: string;
  description: string;
  image: string;
  availability: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchText(url: string): Promise<string | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(30_000),
        headers: { "user-agent": "Mozilla/5.0 (catalog-sync)" },
      });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      if (attempt === 2) {
        console.error(`  ✗ ${url}: ${error}`);
        return null;
      }
      await sleep(1000);
    }
  }
  return null;
}

function parseAmount(text: string): number | null {
  // Must start with a digit: "Rs." would otherwise match as a bare dot (NaN).
  const match = text.replace(/,/g, "").match(/(\d[\d.]*)/);
  if (!match) return null;
  const value = Math.round(parseFloat(match[1]));
  return Number.isFinite(value) ? value : null;
}

function parseListingPage(html: string, categoryPath: string): Listing[] {
  const items: Listing[] = [];
  const liBlocks = html.split(/<li class="product /).slice(1);
  for (const rawBlock of liBlocks) {
    const block = rawBlock.slice(0, rawBlock.indexOf("</li>"));
    const classes = rawBlock.slice(0, rawBlock.indexOf('"'));
    const link = block.match(/woocommerce-loop-product__link" href="https:\/\/synnex\.lk\/product\/([^/"]+)\/?"[^>]*>([^<]+)</);
    if (!link) continue;
    const priceBlock = block.match(/<span class="price">([\s\S]*?)<\/span>\s*<a /) ?? block.match(/<span class="price">([\s\S]*?)<\/div>/);
    let price: number | null = null;
    let compareAt: number | null = null;
    if (priceBlock) {
      const del = priceBlock[1].match(/<del[^>]*>([\s\S]*?)<\/del>/);
      const ins = priceBlock[1].match(/<ins[^>]*>([\s\S]*?)<\/ins>/);
      if (del && ins) {
        compareAt = parseAmount(del[1]);
        price = parseAmount(ins[1]);
      } else {
        const amounts = [...priceBlock[1].matchAll(/<bdi>([\s\S]*?)<\/bdi>/g)];
        if (amounts.length > 0) price = parseAmount(amounts[0][1]);
      }
    }
    items.push({
      slug: link[1],
      name: link[2].trim(),
      price,
      compareAt,
      outOfStock: classes.includes("outofstock"),
      categoryPath,
    });
  }
  return items;
}

function loadFeed(): Map<string, FeedRow> {
  const raw = readFileSync(join(process.cwd(), "prisma", "feed-11431.csv"), "utf8");
  const rows: string[][] = [];
  let row: string[] = [], field = "", inQuotes = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inQuotes) {
      if (ch === '"') { if (raw[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (ch !== "\r") field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }

  const header = rows[0];
  const idx = (name: string) => header.indexOf(name);
  const bySlug = new Map<string, FeedRow>();
  for (const record of rows.slice(1)) {
    if (record.length !== header.length) continue;
    const link = record[idx("link")] ?? "";
    const slugMatch = link.match(/\/product\/([^/]+)\/?$/);
    if (!slugMatch) continue;
    bySlug.set(slugMatch[1], {
      slug: slugMatch[1],
      title: (record[idx("title")] ?? "").trim(),
      description: (record[idx("description")] ?? "").trim(),
      image: (record[idx("image_link")] ?? "").trim(),
      availability: (record[idx("availability")] ?? "").trim(),
    });
  }
  return bySlug;
}

function hashInt(text: string): number {
  return parseInt(createHash("sha256").update(text).digest("hex").slice(0, 8), 16);
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#8211;/g, "–")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function downloadImage(url: string): Promise<string | null> {
  const localUrl = localImagePathFor(url);
  const filePath = join(process.cwd(), "public", localUrl);
  if (existsSync(filePath)) return localUrl;
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) }).catch(() => null);
  if (!response?.ok) {
    console.error(`  ✗ image ${url}`);
    return null;
  }
  const body = Buffer.from(await response.arrayBuffer());
  if (!sniffImageExtension(body)) {
    console.error(`  ✗ not an image ${url}`);
    return null;
  }
  await writeFile(filePath, body);
  await sleep(80);
  return localUrl;
}

async function main() {
  await mkdir(join(process.cwd(), "public", UPLOADS_DIR_URL), { recursive: true });

  // 1. Crawl every category listing page (with pagination).
  const listings = new Map<string, Listing>();
  for (const categoryPath of CATEGORY_PATHS) {
    for (let page = 1; page <= 10; page++) {
      const url = page === 1
        ? `${BASE}/product-category/${categoryPath}/`
        : `${BASE}/product-category/${categoryPath}/page/${page}/`;
      const html = await fetchText(url);
      if (!html) break;
      const items = parseListingPage(html, categoryPath);
      if (items.length === 0) break;
      for (const item of items) {
        const existing = listings.get(item.slug);
        // Deepest category path wins; listing data is identical across pages.
        if (!existing || item.categoryPath.split("/").length > existing.categoryPath.split("/").length) {
          listings.set(item.slug, { ...item, name: existing?.name ?? item.name });
        }
      }
      await sleep(150);
      if (!html.includes(`/page/${page + 1}/`)) break;
    }
    console.log(`crawled ${categoryPath} (total products so far: ${listings.size})`);
  }
  console.log(`\nListings found: ${listings.size}`);

  // 2. Join with the shopping feed.
  const feed = loadFeed();
  const missingFromFeed = [...listings.keys()].filter((slug) => !feed.has(slug));
  console.log(`In feed: ${listings.size - missingFromFeed.length}, missing from feed: ${missingFromFeed.length}`);

  // 3. Scrape product pages for feed-missing items (description + image).
  const scraped = new Map<string, { description: string; image: string }>();
  for (const slug of missingFromFeed) {
    const html = await fetchText(`${BASE}/product/${slug}/`);
    if (!html) continue;
    const ogImage = html.match(/property="og:image" content="([^"]+)"/)?.[1] ?? "";
    const ogDesc = html.match(/property="og:description" content="([^"]+)"/)?.[1]
      ?? html.match(/name="description" content="([^"]+)"/)?.[1]
      ?? "";
    scraped.set(slug, { description: decodeEntities(ogDesc), image: ogImage });
    await sleep(150);
  }

  // 4. Assemble catalog entries, downloading images as we go.
  const catalog = [];
  for (const listing of [...listings.values()].sort((a, b) => a.slug.localeCompare(b.slug))) {
    const feedRow = feed.get(listing.slug);
    const extra = scraped.get(listing.slug);
    const remoteImage = feedRow?.image || extra?.image || "";
    const localImage = remoteImage ? await downloadImage(remoteImage) : null;

    const pathParts = listing.categoryPath.split("/");
    const main = pathParts[0];
    const leaf = pathParts[pathParts.length - 1];
    const name = decodeEntities(feedRow?.title || listing.name);
    const description = (feedRow?.description || extra?.description || name).trim();
    const firstSentence = description.includes(".")
      ? description.split(".")[0] + "."
      : description.slice(0, 160);
    const outOfStock = listing.outOfStock || feedRow?.availability === "out of stock";
    const hash = hashInt(listing.slug);

    catalog.push({
      slug: listing.slug,
      name,
      category: main,
      subcategory: leaf,
      price: listing.price ?? 0,
      ...(listing.compareAt && listing.price && listing.compareAt > listing.price
        ? { compareAt: listing.compareAt }
        : {}),
      rating: Math.round((4.1 + (hash % 9) / 10) * 10) / 10,
      inventory: outOfStock ? 0 : 5 + (hash % 26),
      image: localImage ?? "/products/pos-combo.svg",
      accent: ACCENT_BY_MAIN[main] ?? "#1f8a70",
      description,
      shortDescription: firstSentence.slice(0, 200),
      specs: "",
      published: true,
    });
  }

  const withPrice = catalog.filter((entry) => entry.price > 0);
  console.log(`\nCatalog entries: ${catalog.length} (${catalog.length - withPrice.length} without a price)`);
  console.log(`Sale prices found: ${catalog.filter((entry) => "compareAt" in entry).length}`);
  console.log(`Out of stock: ${catalog.filter((entry) => entry.inventory === 0).length}`);
  console.log(`Local images: ${catalog.filter((entry) => entry.image.startsWith("/uploads/")).length}`);

  await writeFile(
    join(process.cwd(), "prisma", "catalog.json"),
    JSON.stringify(catalog, null, 2) + "\n",
  );
  console.log("\nWrote prisma/catalog.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
