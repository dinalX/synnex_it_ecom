"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireAdminAction } from "@/lib/admin-access";
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
  await requireAdminAction("page.manage");
  const data = readPageContentFields(formData);

  try {
    await prisma.pageContent.create({
      data: { ...data, slug: slugify(data.title) },
    });
  } catch (e: unknown) {
    if (isPrismaUniqueError(e)) {
      throw new Error("A page with this title already exists");
    }
    throw e;
  }

  revalidatePath("/admin/pages");
  return { success: true };
}

export async function updatePageContent(id: string, formData: FormData) {
  await requireAdminAction("page.manage");
  const data = readPageContentFields(formData);

  await prisma.pageContent.update({ where: { id }, data });

  revalidatePath("/admin/pages");
  return { success: true };
}

export async function deletePageContent(id: string) {
  await requireAdminAction("page.manage");
  await prisma.pageContent.delete({ where: { id } });

  revalidatePath("/admin/pages");
  return { success: true };
}

export async function togglePageContentPublished(id: string, published: boolean) {
  await requireAdminAction("page.manage");
  await prisma.pageContent.update({ where: { id }, data: { published } });

  revalidatePath("/admin/pages");
  return { success: true };
}
