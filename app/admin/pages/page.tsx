import Link from "next/link";
import { prisma } from "@/lib/db";
import { AdminSidebar } from "@/components/sections/admin-sidebar";
import { requireAdminPage } from "@/lib/admin-access";

const pages = ["Home", "POS Solution", "Barcode Solution", "Security Solution", "Checkout", "Careers", "Downloads"];

export default async function AdminPagesPage() {
  await requireAdminPage("/admin/pages", "page.manage");
  const pageRecords = await prisma.pageContent.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="admin-shell">
      <AdminSidebar />
      <section className="admin-content-page">
      <div className="admin-topbar">
        <div>
          <p className="eyebrow">Admin / pages</p>
          <h1>Pages and SEO</h1>
        </div>
        <Link href="/admin" className="secondary-action">Dashboard</Link>
      </div>

      <section className="management-grid">
        {(pageRecords.length ? pageRecords : pages.map((page) => ({ slug: page.toLowerCase(), title: page, summary: "SEO draft", published: false }))).map((page) => (
          <article className="management-card" key={page.slug}>
            <strong>{page.title}</strong>
            <h2>{page.published ? "Published" : "Draft"}</h2>
            <p>{page.summary || "Manage page title, meta description, canonical URL, hero copy, and publish status."}</p>
          </article>
        ))}
      </section>
      </section>
    </main>
  );
}
