import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin-access";
import { DownloadManager } from "./download-manager";

export default async function AdminDownloadsPage() {
  await requireAdminPage("/admin/downloads", "download.view");
  const downloads = await prisma.driverDownload.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <section className="admin-content-page">
      <DownloadManager downloads={downloads} />
    </section>
  );
}
