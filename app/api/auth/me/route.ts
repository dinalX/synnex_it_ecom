import { prisma } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/api";
import { cookies } from "next/headers";
import { USER_SESSION_COOKIE, ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userToken = cookieStore.get(USER_SESSION_COOKIE)?.value;
    const adminToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

    const session = await verifySessionToken(userToken, "user");
    const admin = await verifySessionToken(adminToken, "admin");

    if (session) {
      const customer = (session.id
        ? await prisma.customer.findUnique({ where: { id: session.id } })
        : null) || await prisma.customer.findUnique({ where: { email: session.email } });
      return jsonResponse({
        user: customer
          ? { id: customer.id, email: customer.email, name: customer.name, phone: customer.phone, role: "user" }
          : null,
        admin: null,
      });
    }

    if (admin) {
      const adminUser = await prisma.adminUser.findUnique({ where: { email: admin.email } });
      return jsonResponse({
        user: null,
        admin: adminUser
          ? { id: adminUser.id, email: adminUser.email, name: adminUser.name, role: "admin" }
          : { id: admin.id, email: admin.email, name: admin.name, role: "admin" },
      });
    }

    return jsonResponse({ user: null, admin: null });
  } catch {
    return errorResponse("Failed to get session", 500);
  }
}
