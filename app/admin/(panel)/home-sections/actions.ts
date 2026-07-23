"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireAdminAction } from "@/lib/admin-access";
import { recordAuditLog } from "@/lib/audit-log";

export async function addToHomeSection(section: string, productId: string) {
  const admin = await requireAdminAction("home-section.manage");

  const last = await prisma.homeSectionItem.findFirst({
    where: { section },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.homeSectionItem.upsert({
    where: { section_productId: { section, productId } },
    update: {},
    create: { section, productId, sortOrder: (last?.sortOrder ?? -1) + 1 },
  });

  await recordAuditLog(admin, "home-section.add", "HomeSectionItem", productId, { section });

  revalidatePath("/admin/home-sections");
  revalidatePath("/");
  return { success: true };
}

export async function removeFromHomeSection(itemId: string) {
  const admin = await requireAdminAction("home-section.manage");
  await prisma.homeSectionItem.delete({ where: { id: itemId } });

  await recordAuditLog(admin, "home-section.remove", "HomeSectionItem", itemId);

  revalidatePath("/admin/home-sections");
  revalidatePath("/");
  return { success: true };
}

export async function reorderHomeSection(orderedItemIds: string[]) {
  const admin = await requireAdminAction("home-section.manage");

  await prisma.$transaction(
    orderedItemIds.map((id, index) => prisma.homeSectionItem.update({ where: { id }, data: { sortOrder: index } })),
  );

  await recordAuditLog(admin, "home-section.reorder", "HomeSectionItem", null, { count: orderedItemIds.length });

  revalidatePath("/admin/home-sections");
  revalidatePath("/");
  return { success: true };
}
