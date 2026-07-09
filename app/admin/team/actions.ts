"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireAdminAction } from "@/lib/admin-access";
import { hashPassword } from "@/lib/password";
import { isPermission } from "@/lib/permissions";

export async function createAdmin(formData: FormData) {
  const actor = await requireAdminAction("admin.manage");

  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  const name = ((formData.get("name") as string) || "").trim();
  const password = (formData.get("password") as string) || "";
  const role = (formData.get("role") as string) === "SuperAdmin" ? "SuperAdmin" : "Admin";

  if (!email || !name || password.length < 8) {
    throw new Error("Email, name, and an 8+ character password are required");
  }

  if (role === "SuperAdmin") {
    const actorRecord = await prisma.adminUser.findUnique({ where: { id: actor.id }, select: { role: true } });
    if (actorRecord?.role !== "SuperAdmin") {
      throw new Error("Only a SuperAdmin can create another SuperAdmin");
    }
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    throw new Error("An admin with that email already exists");
  }

  await prisma.adminUser.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword(password),
      role,
      active: true,
    },
  });

  revalidatePath("/admin/team");
  return { success: true };
}

export async function setAdminPermissions(adminId: string, permissionKeys: string[]) {
  await requireAdminAction("admin.manage");

  const validKeys = permissionKeys.filter(isPermission);

  await prisma.$transaction([
    prisma.adminPermission.deleteMany({ where: { adminId, key: { notIn: validKeys } } }),
    ...validKeys.map((key) =>
      prisma.adminPermission.upsert({
        where: { adminId_key: { adminId, key } },
        update: {},
        create: { adminId, key },
      }),
    ),
  ]);

  revalidatePath("/admin/team");
  return { success: true };
}

export async function toggleAdminActive(adminId: string, active: boolean) {
  await requireAdminAction("admin.manage");

  await prisma.adminUser.update({ where: { id: adminId }, data: { active } });

  revalidatePath("/admin/team");
  return { success: true };
}
