"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireAdminAction } from "@/lib/admin-access";
import { recordAuditLog } from "@/lib/audit-log";
import { isHeroBannerTheme } from "@/lib/hero-banner-theme";

function readBannerFields(formData: FormData) {
  const title = ((formData.get("title") as string) || "").trim();
  const subtitle = ((formData.get("subtitle") as string) || "").trim();
  const imageUrl = ((formData.get("imageUrl") as string) || "").trim();
  const imageAlt = ((formData.get("imageAlt") as string) || "").trim();
  const ctaLabel = ((formData.get("ctaLabel") as string) || "").trim();
  const ctaHref = ((formData.get("ctaHref") as string) || "").trim();
  const productIdRaw = ((formData.get("productId") as string) || "").trim();
  const themeRaw = ((formData.get("theme") as string) || "light").trim();
  const active = formData.get("active") === "on";
  const sortOrder = parseInt((formData.get("sortOrder") as string) || "0", 10);

  if (!title || !imageUrl) {
    throw new Error("Title and image are required");
  }

  return {
    title,
    subtitle: subtitle || null,
    imageUrl,
    imageAlt: imageAlt || null,
    ctaLabel: ctaLabel || null,
    ctaHref: ctaHref || null,
    productId: productIdRaw && productIdRaw !== "none" ? productIdRaw : null,
    theme: isHeroBannerTheme(themeRaw) ? themeRaw : "light",
    active,
    sortOrder: isNaN(sortOrder) ? 0 : sortOrder,
  };
}

export async function createHeroBanner(formData: FormData) {
  const admin = await requireAdminAction("hero-banner.manage");
  const data = readBannerFields(formData);

  const created = await prisma.heroBanner.create({
    data: { ...data, createdById: admin.id },
  });

  await recordAuditLog(admin, "hero-banner.create", "HeroBanner", created.id, { title: data.title });

  revalidatePath("/admin/hero-banners");
  revalidatePath("/");
  return { success: true };
}

export async function updateHeroBanner(id: string, formData: FormData) {
  const admin = await requireAdminAction("hero-banner.manage");
  const data = readBannerFields(formData);

  await prisma.heroBanner.update({ where: { id }, data });

  await recordAuditLog(admin, "hero-banner.update", "HeroBanner", id, { title: data.title });

  revalidatePath("/admin/hero-banners");
  revalidatePath("/");
  return { success: true };
}

export async function deleteHeroBanner(id: string) {
  const admin = await requireAdminAction("hero-banner.manage");
  await prisma.heroBanner.delete({ where: { id } });

  await recordAuditLog(admin, "hero-banner.delete", "HeroBanner", id);

  revalidatePath("/admin/hero-banners");
  revalidatePath("/");
  return { success: true };
}

export async function toggleHeroBannerActive(id: string, active: boolean) {
  const admin = await requireAdminAction("hero-banner.manage");
  await prisma.heroBanner.update({ where: { id }, data: { active } });

  await recordAuditLog(admin, active ? "hero-banner.activate" : "hero-banner.deactivate", "HeroBanner", id);

  revalidatePath("/admin/hero-banners");
  revalidatePath("/");
  return { success: true };
}
