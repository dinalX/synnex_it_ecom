/**
 * Downloads every remote product image referenced in the database into
 * public/uploads/products/ and rewrites Product.image / ProductImage.url
 * to the local path. Removes the go-live dependency on the old WordPress
 * host: once this has run, the storefront serves every photo itself.
 *
 * Idempotent — already-local rows are skipped, and existing files are
 * reused rather than re-downloaded. Run with:
 *   npx tsx scripts/localize-product-images.ts
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { prisma } from "@/lib/db";
import { sniffImageExtension } from "@/lib/uploads";
import { localImagePathFor, UPLOADS_DIR_URL } from "@/prisma/feed-images";

const UPLOADS_DIR = join(process.cwd(), "public", UPLOADS_DIR_URL);

async function download(url: string): Promise<{ localUrl: string; skipped: boolean } | null> {
  const localUrl = localImagePathFor(url);
  const filePath = join(process.cwd(), "public", localUrl);
  if (existsSync(filePath)) {
    return { localUrl, skipped: true };
  }

  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) {
    console.error(`  ✗ ${response.status} ${url}`);
    return null;
  }
  const body = Buffer.from(await response.arrayBuffer());
  // The WP host mislabels some files (e.g. .avif as text/plain), so sniff
  // magic bytes rather than trusting the content-type header.
  if (!sniffImageExtension(body)) {
    console.error(`  ✗ body is not a recognized image format ${url}`);
    return null;
  }
  await writeFile(filePath, body);
  return { localUrl, skipped: false };
}

async function main() {
  await mkdir(UPLOADS_DIR, { recursive: true });

  const products = await prisma.product.findMany({
    where: { image: { startsWith: "http" } },
    select: { id: true, name: true, image: true },
  });
  const galleryRows = await prisma.productImage.findMany({
    where: { url: { startsWith: "http" } },
    select: { id: true, url: true },
  });

  const remoteUrls = new Set<string>([
    ...products.map((p) => p.image),
    ...galleryRows.map((r) => r.url),
  ]);
  console.log(`Remote images to localize: ${remoteUrls.size}`);

  const urlToLocal = new Map<string, string>();
  let downloaded = 0;
  let reused = 0;
  let failed = 0;
  for (const url of remoteUrls) {
    const result = await download(url);
    if (!result) {
      failed++;
      continue;
    }
    urlToLocal.set(url, result.localUrl);
    result.skipped ? reused++ : downloaded++;
  }

  let productUpdates = 0;
  for (const product of products) {
    const localUrl = urlToLocal.get(product.image);
    if (!localUrl) continue;
    await prisma.product.update({ where: { id: product.id }, data: { image: localUrl } });
    productUpdates++;
  }

  let galleryUpdates = 0;
  for (const row of galleryRows) {
    const localUrl = urlToLocal.get(row.url);
    if (!localUrl) continue;
    await prisma.productImage.update({ where: { id: row.id }, data: { url: localUrl } });
    galleryUpdates++;
  }

  console.log(`Downloaded: ${downloaded}, reused existing files: ${reused}, failed: ${failed}`);
  console.log(`Rewrote ${productUpdates} Product rows and ${galleryUpdates} ProductImage rows to local paths.`);
  if (failed > 0) {
    console.log("Failed URLs keep their remote value — rerun after checking connectivity.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
