import { redirect } from "next/navigation";

import { getCurrentAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Permission } from "@/lib/permissions";

/**
 * Session tokens only carry the session *type* ("admin" vs "user"), not the
 * AdminUser.role ("Admin" | "SuperAdmin") or permission grants — both can
 * change after the token was issued, so this always re-reads them fresh
 * from the DB rather than trusting anything cached in the cookie.
 */
async function hasPermission(adminId: string, permission: Permission) {
  const admin = await prisma.adminUser.findUnique({
    where: { id: adminId },
    select: { role: true, active: true },
  });

  if (!admin || !admin.active) {
    return false;
  }

  if (admin.role === "SuperAdmin") {
    return true;
  }

  const grant = await prisma.adminPermission.findUnique({
    where: { adminId_key: { adminId, key: permission } },
  });

  return Boolean(grant);
}

export async function requireAdminAction(permission?: Permission) {
  const admin = await getCurrentAdminSession();
  if (!admin) {
    throw new Error("Unauthorized: Admin access required");
  }
  if (permission && !(admin.id && (await hasPermission(admin.id, permission)))) {
    throw new Error(`Forbidden: missing permission "${permission}"`);
  }
  return admin;
}

export async function requireAdminApi(permission?: Permission) {
  const admin = await getCurrentAdminSession();
  if (!admin) {
    return null;
  }
  if (permission && !(admin.id && (await hasPermission(admin.id, permission)))) {
    return null;
  }
  return admin;
}

export async function requireAdminPage(redirectTo: string, permission?: Permission) {
  const admin = await getCurrentAdminSession();
  if (!admin) {
    redirect(`/admin/login?redirect=${encodeURIComponent(redirectTo)}`);
  }
  if (permission && !(admin.id && (await hasPermission(admin.id, permission)))) {
    redirect(`/admin?error=forbidden`);
  }
  return admin;
}
