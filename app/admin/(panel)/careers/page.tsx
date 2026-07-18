import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin-access";
import { CareerManager } from "./career-manager";

export default async function AdminCareersPage() {
  await requireAdminPage("/admin/careers", "career.view");
  const jobs = await prisma.jobPost.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="admin-content-page">
      <CareerManager jobs={jobs} />
    </section>
  );
}
