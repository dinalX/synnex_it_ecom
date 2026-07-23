"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/admin-access";
import { recordAuditLog } from "@/lib/audit-log";
import { isPrismaUniqueError } from "@/lib/order-service";
import { slugify } from "@/lib/slugify";

function readCategoryFields(formData: FormData) {
  const name = (formData.get("name") as string || "").trim();
  const providedSlug = (formData.get("slug") as string | null)?.trim();
  const parentId = (formData.get("parentId") as string) || null;
  const icon = (formData.get("icon") as string) || null;
  const accent = (formData.get("accent") as string) || "#1f8a70";
  const shortDescription = (formData.get("shortDescription") as string || "").trim() || null;
  const published = formData.get("published") === "on";

  return { name, providedSlug, parentId, icon, accent, shortDescription, published };
}

export async function createCategory(formData: FormData) {
  const admin = await requireAdminAction("category.create");

  const { name, providedSlug, parentId, icon, accent, shortDescription, published } = readCategoryFields(formData);
  if (!name) throw new Error("Name is required");

  const slug = providedSlug ? slugify(providedSlug) : slugify(name);
  let created;

  try {
    const last = await prisma.productCategory.findFirst({
      where: { parentId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    created = await prisma.productCategory.create({
      data: {
        name,
        slug,
        parentId,
        icon,
        accent,
        shortDescription,
        published,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
    });
  } catch (e: unknown) {
    if (isPrismaUniqueError(e)) {
      throw new Error("A category with this slug already exists");
    }
    throw e;
  }

  await recordAuditLog(admin, "category.create", "ProductCategory", created.id, { name, slug });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/products");
  return { success: true };
}

export async function updateCategory(id: string, formData: FormData) {
  const admin = await requireAdminAction("category.update");

  const existing = await prisma.productCategory.findUnique({ where: { id } });
  if (!existing) throw new Error("Category not found");

  const { name, providedSlug, parentId, icon, accent, shortDescription, published } = readCategoryFields(formData);
  if (!name) throw new Error("Name is required");
  if (parentId === id) throw new Error("A category cannot be its own parent");

  const slug = providedSlug ? slugify(providedSlug) : existing.slug;

  try {
    await prisma.productCategory.update({
      where: { id },
      data: { name, slug, parentId, icon, accent, shortDescription, published },
    });
  } catch (e: unknown) {
    if (isPrismaUniqueError(e)) {
      throw new Error("A category with this slug already exists");
    }
    throw e;
  }

  await recordAuditLog(admin, "category.update", "ProductCategory", id, { name, slug });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/products");
  return { success: true };
}

/**
 * Applies a full drag-and-drop reorder of the category tree in one go:
 * each entry's parentId (which may have changed - dragging left/right
 * re-parents a category, moving it between levels) and its new sortOrder
 * among its new siblings, derived from `flat`'s order.
 */
export async function reorderCategoryTree(flat: { id: string; parentId: string | null }[]) {
  const admin = await requireAdminAction("category.update");

  const idSet = new Set(flat.map((f) => f.id));
  const indexById = new Map(flat.map((f, i) => [f.id, i]));

  // Defensive validation: every parentId must point at a category actually
  // in this payload, and must appear earlier in the (depth-first-ordered)
  // list than its child - which always holds for a real tree, so this also
  // rejects any cycle a tampered/buggy payload might try to introduce.
  for (const item of flat) {
    if (item.parentId === null) continue;
    if (!idSet.has(item.parentId)) throw new Error("Invalid parent reference");
    if (indexById.get(item.parentId)! >= indexById.get(item.id)!) {
      throw new Error("Invalid category order");
    }
  }

  const sortOrderByParent = new Map<string, number>();
  const updates = flat.map((item) => {
    const key = item.parentId ?? "__root__";
    const sortOrder = sortOrderByParent.get(key) ?? 0;
    sortOrderByParent.set(key, sortOrder + 1);
    return prisma.productCategory.update({
      where: { id: item.id },
      data: { parentId: item.parentId, sortOrder },
    });
  });

  await prisma.$transaction(updates);

  await recordAuditLog(admin, "category.reorder", "ProductCategory", null, { count: flat.length });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/products");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const admin = await requireAdminAction("category.delete");

  try {
    await prisma.productCategory.delete({ where: { id } });
  } catch {
    throw new Error("Failed to delete category");
  }

  await recordAuditLog(admin, "category.delete", "ProductCategory", id);

  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/products");
  return { success: true };
}
