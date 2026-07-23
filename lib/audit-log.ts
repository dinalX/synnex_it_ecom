import { headers } from "next/headers";

import { prisma } from "@/lib/db";

async function getRequestIp() {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

/**
 * Fire-and-forget: audit logging must never break the admin action it's
 * recording, so failures are swallowed (and logged to the server console)
 * rather than thrown.
 */
export async function recordAuditLog(
  admin: { id?: string } | null,
  action: string,
  entity: string,
  entityId?: string | null,
  metadata?: Record<string, unknown>,
) {
  try {
    const ipAddress = await getRequestIp();
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin?.id ?? null,
        action,
        entity,
        entityId: entityId ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress,
      },
    });
  } catch (error) {
    console.error("Failed to record audit log:", error);
  }
}
