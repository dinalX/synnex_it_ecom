import Link from "next/link";
import { prisma } from "@/lib/db";
import { AdminSidebar } from "@/components/sections/admin-sidebar";
import { requireAdminPage } from "@/lib/admin-access";

export default async function AdminCareersPage() {
  await requireAdminPage("/admin/careers");
  const jobs = await prisma.jobPost.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="admin-shell">
      <AdminSidebar />
      <section className="admin-content-page">
      <div className="admin-topbar">
        <div>
          <p className="eyebrow">Admin / careers</p>
          <h1>Career posts</h1>
        </div>
        <Link href="/admin" className="secondary-action">Dashboard</Link>
      </div>

      <section className="management-table">
        {jobs.length === 0 && (
          <article><div><strong>No career posts yet.</strong></div></article>
        )}
        {jobs.map((job) => (
          <article key={job.id}>
            <div>
              <strong>{job.title}</strong>
              <span>{job.department} · {job.location} · {job.type}</span>
            </div>
            <span>{job.published ? "Published" : "Draft"}</span>
            <em>{job.createdAt.toLocaleDateString()}</em>
          </article>
        ))}
      </section>
      </section>
    </main>
  );
}
