import { prisma } from "@/lib/db";
import { AdminSidebar } from "@/components/sections/admin-sidebar";
import { requireAdminPage } from "@/lib/admin-access";
import { DownloadManager } from "./download-manager";

export default async function AdminDownloadsPage() {
  await requireAdminPage("/admin/downloads", "download.view");
  const downloads = await prisma.driverDownload.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="admin-shell">
      <AdminSidebar />
      <section className="admin-content-page">
        <DownloadManager downloads={downloads} />
      </section>
    </main>
  );
}
