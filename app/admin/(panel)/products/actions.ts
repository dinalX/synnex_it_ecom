"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/admin-access";
import { recordAuditLog } from "@/lib/audit-log";
import { isPrismaUniqueError } from "@/lib/order-service";
import { slugify } from "@/lib/slugify";

export async function createProduct(formData: FormData) {
  const admin = await requireAdminAction("product.create");

  const name = formData.get("name") as string;
  const providedSlug = (formData.get("slug") as string | null)?.trim();
  const categoryId = formData.get("categoryId") as string;
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

  if (!name || !categoryId || isNaN(price) || isNaN(inventory)) {
    throw new Error("Missing required fields");
  }

  // The form's category picker is the subcategory (e.g. "Cash Register"),
  // matching what Product.category has always displayed. Product.categoryId
  // is the main-category FK (the same convention prisma/seed.ts already
  // uses), not the subcategory's own id.
  const subcategory = await prisma.productCategory.findUnique({ where: { id: categoryId } });
  if (!subcategory) {
    throw new Error("Invalid category selected");
  }

  const slug = providedSlug ? slugify(providedSlug) : slugify(name);

  let created;
  try {
    const last = await prisma.product.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
    created = await prisma.product.create({
      data: {
        name,
        slug,
        category: subcategory.name,
        categoryId: subcategory.parentId ?? subcategory.id,
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

  await recordAuditLog(admin, "product.create", "Product", created.id, { name, slug });

  revalidatePath("/admin/products");
  return { success: true };
}

export async function updateProduct(id: string, formData: FormData) {
  const admin = await requireAdminAction("product.update");

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new Error("Product not found");

  const name = formData.get("name") as string;
  const providedSlug = (formData.get("slug") as string | null)?.trim();
  const categoryId = formData.get("categoryId") as string;
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

  if (!name || !categoryId || isNaN(price) || isNaN(inventory)) {
    throw new Error("Missing required fields");
  }

  const subcategory = await prisma.productCategory.findUnique({ where: { id: categoryId } });
  if (!subcategory) {
    throw new Error("Invalid category selected");
  }

  const slug = providedSlug ? slugify(providedSlug) : existing.slug;

  try {
    await prisma.product.update({
      where: { id },
      data: {
        name,
        slug,
        category: subcategory.name,
        categoryId: subcategory.parentId ?? subcategory.id,
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

  await recordAuditLog(admin, "product.update", "Product", id, { name, slug });

  revalidatePath("/admin/products");
  revalidatePath(`/products/${slug}`);
  return { success: true };
}

export async function reorderProducts(orderedIds: string[]) {
  const admin = await requireAdminAction("product.update");

  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.product.update({ where: { id }, data: { sortOrder: index } })),
  );

  await recordAuditLog(admin, "product.reorder", "Product", null, { count: orderedIds.length });

  revalidatePath("/admin/products");
  return { success: true };
}

export async function deleteProduct(id: string) {
  const admin = await requireAdminAction("product.delete");

  try {
    await prisma.product.delete({
      where: { id },
    });
  } catch (e) {
    throw new Error("Failed to delete product");
  }

  await recordAuditLog(admin, "product.delete", "Product", id);

  revalidatePath("/admin/products");
  return { success: true };
}
