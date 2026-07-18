"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireAdminAction } from "@/lib/admin-access";
import { isPrismaUniqueError } from "@/lib/order-service";
import { slugify } from "@/lib/slugify";

function readJobPostFields(formData: FormData) {
  const title = ((formData.get("title") as string) || "").trim();
  const department = ((formData.get("department") as string) || "").trim();
  const location = ((formData.get("location") as string) || "").trim();
  const type = ((formData.get("type") as string) || "").trim();
  const summary = ((formData.get("summary") as string) || "").trim();
  const requirements = ((formData.get("requirements") as string) || "").trim();
  const published = formData.get("published") === "on";

  if (!title || !department || !location || !type || !summary || !requirements) {
    throw new Error("All fields are required");
  }

  return { title, department, location, type, summary, requirements, published };
}

export async function createJobPost(formData: FormData) {
  await requireAdminAction("career.manage");
  const data = readJobPostFields(formData);

  try {
    await prisma.jobPost.create({
      data: { ...data, slug: slugify(data.title) },
    });
  } catch (e: unknown) {
    if (isPrismaUniqueError(e)) {
      throw new Error("A job post with this title already exists");
    }
    throw e;
  }

  revalidatePath("/admin/careers");
  revalidatePath("/careers");
  return { success: true };
}

export async function updateJobPost(id: string, formData: FormData) {
  await requireAdminAction("career.manage");
  const data = readJobPostFields(formData);

  await prisma.jobPost.update({ where: { id }, data });

  revalidatePath("/admin/careers");
  revalidatePath("/careers");
  return { success: true };
}

export async function deleteJobPost(id: string) {
  await requireAdminAction("career.manage");
  await prisma.jobPost.delete({ where: { id } });

  revalidatePath("/admin/careers");
  revalidatePath("/careers");
  return { success: true };
}

export async function toggleJobPostPublished(id: string, published: boolean) {
  await requireAdminAction("career.manage");
  await prisma.jobPost.update({ where: { id }, data: { published } });

  revalidatePath("/admin/careers");
  revalidatePath("/careers");
  return { success: true };
}
