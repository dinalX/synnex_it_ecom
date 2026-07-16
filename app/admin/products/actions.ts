"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/admin-access";
import { isPrismaUniqueError } from "@/lib/order-service";

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export async function createProduct(formData: FormData) {
  await requireAdminAction("product.create");

  const name = formData.get("name") as string;
  const providedSlug = (formData.get("slug") as string | null)?.trim();
  const category = formData.get("category") as string;
  const price = parseInt(formData.get("price") as string);
  const compareAt = parseInt(formData.get("compareAt") as string) || null;
  const inventory = parseInt(formData.get("inventory") as string);
  const sku = formData.get("sku") as string || undefined;
  const image = formData.get("image") as string;
  const accent = formData.get("accent") as string || "#1f8a70";
  const description = formData.get("description") as string;
  const shortDescription = formData.get("shortDescription") as string || null;
  const specs = formData.get("specs") as string;
  const published = formData.get("published") === "on";

  if (!name || !category || isNaN(price) || isNaN(inventory)) {
    throw new Error("Missing required fields");
  }

  const slug = providedSlug ? slugify(providedSlug) : slugify(name);

  try {
    const last = await prisma.product.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
    await prisma.product.create({
      data: {
        name,
        slug,
        category,
        sortOrder: (last?.sortOrder ?? 0) + 1,
        price,
        compareAt: compareAt || null,
        inventory,
        sku,
        image,
        accent,
        description,
        shortDescription,
        specs,
        published,
      },
    });
  } catch (e: unknown) {
    if (isPrismaUniqueError(e)) {
      throw new Error("Product slug or SKU already exists");
    }
    throw e;
  }

  revalidatePath("/admin/products");
  return { success: true };
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdminAction("product.update");

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new Error("Product not found");

  const name = formData.get("name") as string;
  const providedSlug = (formData.get("slug") as string | null)?.trim();
  const category = formData.get("category") as string;
  const price = parseInt(formData.get("price") as string);
  const compareAt = parseInt(formData.get("compareAt") as string) || null;
  const inventory = parseInt(formData.get("inventory") as string);
  const sku = formData.get("sku") as string || undefined;
  const image = formData.get("image") as string;
  const accent = formData.get("accent") as string || "#1f8a70";
  const description = formData.get("description") as string;
  const shortDescription = formData.get("shortDescription") as string || null;
  const specs = formData.get("specs") as string;
  const published = formData.get("published") === "on";

  if (!name || !category || isNaN(price) || isNaN(inventory)) {
    throw new Error("Missing required fields");
  }

  const slug = providedSlug ? slugify(providedSlug) : existing.slug;

  try {
    await prisma.product.update({
      where: { id },
      data: {
        name,
        slug,
        category,
        price,
        compareAt: compareAt || null,
        inventory,
        sku,
        image,
        accent,
        description,
        shortDescription,
        specs,
        published,
      },
    });
  } catch (e: unknown) {
    if (isPrismaUniqueError(e)) {
      throw new Error("Product slug or SKU already exists");
    }
    throw e;
  }

  revalidatePath("/admin/products");
  revalidatePath(`/products/${slug}`);
  return { success: true };
}

export async function reorderProducts(orderedIds: string[]) {
  await requireAdminAction("product.update");

  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.product.update({ where: { id }, data: { sortOrder: index } })),
  );

  revalidatePath("/admin/products");
  return { success: true };
}

export async function deleteProduct(id: string) {
  await requireAdminAction("product.delete");

  try {
    await prisma.product.delete({
      where: { id },
    });
  } catch (e) {
    throw new Error("Failed to delete product");
  }

  revalidatePath("/admin/products");
  return { success: true };
}
