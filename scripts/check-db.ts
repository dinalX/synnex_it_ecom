import { prisma } from "@/lib/db";

async function main() {
  const productCount = await prisma.product.count();
  const catCount = await prisma.productCategory.count();
  const parentCats = await prisma.productCategory.findMany({ where: { parentId: null } });
  const childCats = await prisma.productCategory.findMany({ where: { NOT: { parentId: null } } });
  const sampleProduct = await prisma.product.findFirst();

  console.log("Products:", productCount);
  console.log("Categories:", catCount);
  console.log("Parent cats:", parentCats.map((c) => c.slug));
  console.log("Child cats:", childCats.map((c) => `${c.slug} (parent: ${c.parentId})`));
  console.log("Sample product:", JSON.stringify({
    slug: sampleProduct?.slug,
    category: sampleProduct?.category,
    categoryId: sampleProduct?.categoryId,
  }));
}

main().finally(() => prisma.$disconnect());
