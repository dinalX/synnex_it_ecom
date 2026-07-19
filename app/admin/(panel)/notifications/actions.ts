"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAction } from "@/lib/admin-access";
import { markRead, markAllRead } from "@/lib/notification-service";

export async function markNotificationRead(notificationId: string) {
  const admin = await requireAdminAction();
  await markRead(admin.id!, notificationId);
  revalidatePath("/admin/notifications");
  return { success: true };
}

export async function markAllNotificationsRead() {
  const admin = await requireAdminAction();
  await markAllRead(admin.id!);
  revalidatePath("/admin/notifications");
  return { success: true };
}
