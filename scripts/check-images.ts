import { prisma } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

async function main() {
  console.log("Checking product images...");
  
  const images = await prisma.productImage.findMany({
    include: { product: true }
  });

  let brokenCount = 0;

  for (const img of images) {
    // The URL is usually /products/name.svg
    // We need to check if this file exists in the public folder
    const relativePath = img.url.startsWith("/") ? img.url : `/${img.url}`;
    const absolutePath = path.join(process.cwd(), "public", relativePath);

    try {
      await fs.access(absolutePath);
    } catch {
      console.error(`Broken image: ${img.url} (Product: ${img.product.name})`);
      brokenCount++;
    }
  }

  console.log("-----------------------------------");
  console.log(`Total images checked: ${images.length}`);
  console.log(`Broken images found: ${brokenCount}`);
  
  if (brokenCount > 0) {
    process.exit(1);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
