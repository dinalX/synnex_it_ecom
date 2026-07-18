import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin-access";
import { PageManager } from "./page-manager";

export default async function AdminPagesPage() {
  await requireAdminPage("/admin/pages", "page.view");
  const pages = await prisma.pageContent.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <section className="admin-content-page">
      <PageManager pages={pages} />
    </section>
  );
}
