import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin-access";
import { CareerManager } from "./career-manager";

export default async function AdminCareersPage() {
  await requireAdminPage("/admin/careers", "career.view");
  const [jobs, applications] = await Promise.all([
    prisma.jobPost.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.jobApplication.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { jobPost: { select: { title: true } } },
    }),
  ]);

  return (
    <section className="admin-content-page">
      <CareerManager jobs={jobs} applications={applications} />
    </section>
  );
}
