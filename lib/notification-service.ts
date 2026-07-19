import { prisma } from "@/lib/db";

export const LOW_STOCK_THRESHOLD = 5;

export async function notifyAdmins(
  events: { type: string; title: string; body?: string; href?: string }[],
): Promise<void> {
  if (events.length === 0) return;

  const admins = await prisma.adminUser.findMany({
    where: { active: true },
    select: { id: true },
  });

  if (admins.length === 0) return;

  await prisma.adminNotification.createMany({
    data: admins.flatMap((admin) =>
      events.map((event) => ({
        adminId: admin.id,
        type: event.type,
        title: event.title,
        body: event.body,
        href: event.href,
      })),
    ),
  });
}

export async function getUnreadCount(adminId: string): Promise<number> {
  return prisma.adminNotification.count({ where: { adminId, readAt: null } });
}

export async function getNotifications(adminId: string, opts?: { take?: number }) {
  return prisma.adminNotification.findMany({
    where: { adminId },
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? 50,
  });
}

export async function markRead(adminId: string, notificationId: string): Promise<void> {
  await prisma.adminNotification.updateMany({
    where: { id: notificationId, adminId },
    data: { readAt: new Date() },
  });
}

export async function markAllRead(adminId: string): Promise<void> {
  await prisma.adminNotification.updateMany({
    where: { adminId, readAt: null },
    data: { readAt: new Date() },
  });
}
