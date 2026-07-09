import Link from "next/link";
import { prisma } from "@/lib/db";
import { AdminSidebar } from "@/components/sections/admin-sidebar";
import { requireAdminPage } from "@/lib/admin-access";

export default async function AdminDownloadsPage() {
  await requireAdminPage("/admin/downloads");
  const downloads = await prisma.driverDownload.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="admin-shell">
      <AdminSidebar />
      <section className="admin-content-page">
      <div className="admin-topbar">
        <div>
          <p className="eyebrow">Admin / downloads</p>
          <h1>Driver downloads</h1>
        </div>
        <Link href="/admin" className="secondary-action">Dashboard</Link>
      </div>

      <section className="management-table">
        {downloads.length === 0 && (
          <article><div><strong>No downloads yet.</strong></div></article>
        )}
        {downloads.map((download) => (
          <article key={download.id}>
            <div>
              <strong>{download.title}</strong>
              <span>{download.deviceType} · {download.os} · v{download.version}</span>
            </div>
            <span>{download.published ? "Published" : "Draft"}</span>
            <em>{download.fileUrl === "#" ? "Needs file" : "Ready"}</em>
          </article>
        ))}
      </section>
      </section>
    </main>
  );
}
