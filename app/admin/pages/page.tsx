import { prisma } from "@/lib/db";
import { AdminSidebar } from "@/components/sections/admin-sidebar";
import { requireAdminPage } from "@/lib/admin-access";
import { PageManager } from "./page-manager";

export default async function AdminPagesPage() {
  await requireAdminPage("/admin/pages", "page.view");
  const pages = await prisma.pageContent.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="admin-shell">
      <AdminSidebar />
      <section className="admin-content-page">
        <PageManager pages={pages} />
      </section>
    </main>
  );
}
