import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin-access";
import { ProfileForm } from "./profile-form";

export default async function AdminProfilePage() {
  const session = await requireAdminPage("/admin/profile");
  const admin = await prisma.adminUser.findUnique({ where: { id: session.id! } });

  if (!admin) {
    return null;
  }

  return (
    <section className="admin-content-page">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin / profile</p>
        <h1 className="text-2xl font-bold text-foreground">Your profile</h1>
      </div>
      <ProfileForm
        initialName={admin.name}
        email={admin.email}
        role={admin.role}
        lastLoginAt={admin.lastLoginAt ? admin.lastLoginAt.toLocaleString() : null}
      />
    </section>
  );
}
