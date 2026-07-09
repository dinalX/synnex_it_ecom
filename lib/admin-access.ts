import { redirect } from "next/navigation";

import { getCurrentAdminSession } from "@/lib/auth";

export async function requireAdminAction() {
  const admin = await getCurrentAdminSession();
  if (!admin) {
    throw new Error("Unauthorized: Admin access required");
  }
  return admin;
}

export async function requireAdminApi() {
  return getCurrentAdminSession();
}

export async function requireAdminPage(redirectTo: string) {
  const admin = await getCurrentAdminSession();
  if (!admin) {
    redirect(`/admin/login?redirect=${encodeURIComponent(redirectTo)}`);
  }
  return admin;
}
