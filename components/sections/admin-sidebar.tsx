import { prisma } from "@/lib/db";
import { getCurrentAdminSession } from "@/lib/auth";
import { AdminSidebarNav } from "@/components/sections/admin-sidebar-nav";

export async function AdminSidebar() {
  const session = await getCurrentAdminSession();

  let role = "Admin";
  let permissions: string[] = [];
  let name = "";
  let email = "";

  if (session?.id) {
    const admin = await prisma.adminUser.findUnique({
      where: { id: session.id },
      select: { role: true, name: true, email: true, permissions: { select: { key: true } } },
    });
    role = admin?.role ?? "Admin";
    permissions = admin?.permissions.map((p) => p.key) ?? [];
    name = admin?.name ?? "";
    email = admin?.email ?? "";
  }

  return <AdminSidebarNav role={role} permissions={permissions} name={name} email={email} />;
}
