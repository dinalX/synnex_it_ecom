"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireAdminAction } from "@/lib/admin-access";
import { recordAuditLog } from "@/lib/audit-log";
import { verifyPassword, hashPassword } from "@/lib/password";
import { validateNewPassword } from "@/lib/password-policy";

export async function updateProfile(formData: FormData) {
  const admin = await requireAdminAction();
  const name = ((formData.get("name") as string) || "").trim();

  if (!name) {
    throw new Error("Name is required");
  }

  await prisma.adminUser.update({ where: { id: admin.id }, data: { name } });

  await recordAuditLog(admin, "profile.update", "AdminUser", admin.id, { name });

  revalidatePath("/admin/profile");
  return { success: true };
}

export async function changePassword(formData: FormData) {
  const admin = await requireAdminAction();
  const currentPassword = (formData.get("currentPassword") as string) || "";
  const newPassword = (formData.get("newPassword") as string) || "";
  const confirmPassword = (formData.get("confirmPassword") as string) || "";

  const record = await prisma.adminUser.findUnique({ where: { id: admin.id! } });
  if (!record) {
    throw new Error("Admin not found");
  }

  const verified = await verifyPassword(currentPassword, record.passwordHash);
  if (!verified.valid) {
    throw new Error("Current password is incorrect");
  }

  const policyError = validateNewPassword(newPassword, confirmPassword);
  if (policyError) {
    throw new Error(policyError);
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.adminUser.update({ where: { id: admin.id! }, data: { passwordHash } });

  await recordAuditLog(admin, "profile.changePassword", "AdminUser", admin.id);

  return { success: true };
}
