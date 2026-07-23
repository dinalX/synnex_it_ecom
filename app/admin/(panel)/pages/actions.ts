"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireAdminAction } from "@/lib/admin-access";
import { recordAuditLog } from "@/lib/audit-log";
import { isPrismaUniqueError } from "@/lib/order-service";
import { slugify } from "@/lib/slugify";

function readPageContentFields(formData: FormData) {
  const title = ((formData.get("title") as string) || "").trim();
  const summary = ((formData.get("summary") as string) || "").trim();
  const body = ((formData.get("body") as string) || "").trim();
  const seoTitle = ((formData.get("seoTitle") as string) || "").trim();
  const seoDescription = ((formData.get("seoDescription") as string) || "").trim();
  const published = formData.get("published") === "on";

  if (!title || !summary || !body) {
    throw new Error("Title, summary, and body are required");
  }

  return {
    title,
    summary,
    body,
    seoTitle: seoTitle || null,
    seoDescription: seoDescription || null,
    published,
  };
}

export async function createPageContent(formData: FormData) {
  const admin = await requireAdminAction("page.manage");
  const data = readPageContentFields(formData);
  let created;

  try {
    created = await prisma.pageContent.create({
      data: { ...data, slug: slugify(data.title) },
    });
  } catch (e: unknown) {
    if (isPrismaUniqueError(e)) {
      throw new Error("A page with this title already exists");
    }
    throw e;
  }

  await recordAuditLog(admin, "page.create", "PageContent", created.id, { title: data.title });

  revalidatePath("/admin/pages");
  return { success: true };
}

export async function updatePageContent(id: string, formData: FormData) {
  const admin = await requireAdminAction("page.manage");
  const data = readPageContentFields(formData);

  await prisma.pageContent.update({ where: { id }, data });

  await recordAuditLog(admin, "page.update", "PageContent", id, { title: data.title });

  revalidatePath("/admin/pages");
  return { success: true };
}

export async function deletePageContent(id: string) {
  const admin = await requireAdminAction("page.manage");
  await prisma.pageContent.delete({ where: { id } });

  await recordAuditLog(admin, "page.delete", "PageContent", id);

  revalidatePath("/admin/pages");
  return { success: true };
}

export async function togglePageContentPublished(id: string, published: boolean) {
  const admin = await requireAdminAction("page.manage");
  await prisma.pageContent.update({ where: { id }, data: { published } });

  await recordAuditLog(admin, published ? "page.publish" : "page.unpublish", "PageContent", id);

  revalidatePath("/admin/pages");
  return { success: true };
}
