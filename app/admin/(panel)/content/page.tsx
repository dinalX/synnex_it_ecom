import Link from "next/link";
import { Database, Download, FileText, Settings, ShoppingBag, UserRoundPlus } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    <section className="admin-content-page">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin / content</p>
            <h1 className="text-2xl font-bold text-foreground">Admin control center</h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin">Dashboard</Link>
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {managementAreas.map((area) => {
            const Icon = area.icon;
            return (
              <Card key={area.title}>
                <CardHeader>
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
                    <Icon size={20} />
                  </span>
                  <CardTitle className="text-sm font-medium text-muted-foreground">{area.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <strong className="text-2xl font-bold text-foreground">{area.count}</strong>
                  <p className="text-sm text-muted-foreground">{area.description}</p>
                  <Button asChild variant="outline" size="sm" className="self-start">
                    <Link href={area.href}>Open</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
  );
}
