import { prisma } from "@/lib/db";
import { AdminSidebar } from "@/components/sections/admin-sidebar";
import { requireAdminPage } from "@/lib/admin-access";
import { TeamManager } from "./team-manager";

export default async function AdminTeamPage() {
  const currentAdmin = await requireAdminPage("/admin/team", "admin.manage");

  const admins = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    include: { permissions: { select: { key: true } } },
  });

  const teamMembers = admins.map((admin) => ({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    active: admin.active,
    lastLoginAt: admin.lastLoginAt ? admin.lastLoginAt.toISOString() : null,
    permissions: admin.permissions.map((p) => p.key),
  }));

  return (
    <main className="admin-shell">
      <AdminSidebar />
      <section className="admin-content-page">
        <TeamManager teamMembers={teamMembers} currentAdminId={currentAdmin?.id ?? ""} />
      </section>
    </main>
  );
}
