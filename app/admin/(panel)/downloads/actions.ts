"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireAdminAction } from "@/lib/admin-access";
import { recordAuditLog } from "@/lib/audit-log";
import { isPrismaUniqueError } from "@/lib/order-service";
import { slugify } from "@/lib/slugify";

function readDownloadFields(formData: FormData) {
  const title = ((formData.get("title") as string) || "").trim();
  const deviceType = ((formData.get("deviceType") as string) || "").trim();
  const version = ((formData.get("version") as string) || "").trim();
  const os = ((formData.get("os") as string) || "").trim();
  const fileUrl = ((formData.get("fileUrl") as string) || "").trim();
  const notes = ((formData.get("notes") as string) || "").trim();
  const published = formData.get("published") === "on";

  if (!title || !deviceType || !version || !os || !fileUrl) {
    throw new Error("Title, device type, version, OS, and file URL are required");
  }

  return { title, deviceType, version, os, fileUrl, notes, published };
}

export async function createDriverDownload(formData: FormData) {
  const admin = await requireAdminAction("download.manage");
  const data = readDownloadFields(formData);
  let created;

  try {
    created = await prisma.driverDownload.create({
      data: { ...data, slug: slugify(data.title) },
    });
  } catch (e: unknown) {
    if (isPrismaUniqueError(e)) {
      throw new Error("A download with this title already exists");
    }
    throw e;
  }

  await recordAuditLog(admin, "download.create", "DriverDownload", created.id, { title: data.title });

  revalidatePath("/admin/downloads");
  revalidatePath("/downloads");
  return { success: true };
}

export async function updateDriverDownload(id: string, formData: FormData) {
  const admin = await requireAdminAction("download.manage");
  const data = readDownloadFields(formData);

  await prisma.driverDownload.update({ where: { id }, data });

  await recordAuditLog(admin, "download.update", "DriverDownload", id, { title: data.title });

  revalidatePath("/admin/downloads");
  revalidatePath("/downloads");
  return { success: true };
}

export async function deleteDriverDownload(id: string) {
  const admin = await requireAdminAction("download.manage");
  await prisma.driverDownload.delete({ where: { id } });

  await recordAuditLog(admin, "download.delete", "DriverDownload", id);

  revalidatePath("/admin/downloads");
  revalidatePath("/downloads");
  return { success: true };
}

export async function toggleDriverDownloadPublished(id: string, published: boolean) {
  const admin = await requireAdminAction("download.manage");
  await prisma.driverDownload.update({ where: { id }, data: { published } });

  await recordAuditLog(admin, published ? "download.publish" : "download.unpublish", "DriverDownload", id);

  revalidatePath("/admin/downloads");
  revalidatePath("/downloads");
  return { success: true };
}
