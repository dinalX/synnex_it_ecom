import Link from "next/link";
import { Database, Download, FileText, Settings, ShoppingBag, UserRoundPlus } from "lucide-react";
import { prisma } from "@/lib/db";
import { AdminSidebar } from "@/components/sections/admin-sidebar";
import { requireAdminPage } from "@/lib/admin-access";

export default async function AdminContentPage() {
  await requireAdminPage("/admin/content");
  const [productCount, jobCount, downloadCount] = await Promise.all([
    prisma.product.count(),
    prisma.jobPost.count(),
    prisma.driverDownload.count(),
  ]);

  const managementAreas = [
    {
      title: "Products",
      icon: ShoppingBag,
      count: productCount,
      description: "Catalog items, prices, offer badges, inventory, and product SEO.",
      href: "/admin/products",
    },
    {
      title: "Pages & SEO",
      icon: FileText,
      count: await prisma.pageContent.count(),
      description: "Home, about, contact, checkout, careers, downloads, metadata, and sitemap content.",
      href: "/admin/pages",
    },
    {
      title: "Careers",
      icon: UserRoundPlus,
      count: jobCount,
      description: "Job posts, departments, locations, requirements, and application contact.",
      href: "/admin/careers",
    },
    {
      title: "Driver Downloads",
      icon: Download,
      count: downloadCount,
      description: "Printer drivers, scanner guides, biometric software, versions, and file URLs.",
      href: "/admin/downloads",
    },
    {
      title: "Payments",
      icon: Settings,
      count: 1,
      description: "Bank transfer, cash on delivery, quotation instructions, and order notes.",
      href: "/admin/settings",
    },
    {
      title: "Database",
      icon: Database,
      count: 1,
      description: "SQLite database managed through Prisma for products, orders, content, and settings.",
      href: "/admin/settings",
    },
  ];

  return (
    <main className="admin-shell">
      <AdminSidebar />
      <section className="admin-content-page">
      <div className="admin-topbar">
        <div>
          <p className="eyebrow">Managed content</p>
          <h1>Admin control center</h1>
        </div>
        <Link href="/admin" className="secondary-action">Dashboard</Link>
      </div>

      <section className="management-grid">
        {managementAreas.map((area) => {
          const Icon = area.icon;
          return (
            <article className="management-card" key={area.title}>
              <span><Icon size={22} /></span>
              <strong>{area.count}</strong>
              <h2>{area.title}</h2>
              <p>{area.description}</p>
              <Link href={area.href} className="management-link">Open</Link>
            </article>
          );
        })}
      </section>

      <section className="admin-panel editor-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Settings editor</p>
            <h2>Example managed fields</h2>
          </div>
        </div>
        <form className="settings-form">
          <label>
            Site title
            <input defaultValue="Synnex IT Solution - POS Hardware Sri Lanka" />
          </label>
          <label>
            Google Tag ID
            <input placeholder="G-XXXXXXXXXX" />
          </label>
          <label>
            Facebook Pixel ID
            <input placeholder="1234567890" />
          </label>
          <label>
            Offline payment notes
            <textarea placeholder="Offline payment instructions..." />
          </label>
          <button type="button" className="primary-action">Save draft</button>
        </form>
      </section>
      </section>
    </main>
  );
}
