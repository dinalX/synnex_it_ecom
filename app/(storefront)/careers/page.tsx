import type { Metadata } from "next";
import { careerPosts } from "@/lib/content";
import { prisma } from "@/lib/db";
import { JobCardItem } from "@/components/job-card-item";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Join Synnex IT Solution in sales, technical support, and business technology operations.",
};

function splitRequirements(value: string | null) {
  if (!value) return [];
  return value
    .split(/\r?\n|,\s*/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export default async function CareersPage() {
  const jobs = await prisma.jobPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });
  const jobList = jobs.length
    ? jobs.map((job) => ({
        slug: job.slug,
        title: job.title,
        department: job.department,
        location: job.location,
        type: job.type,
        summary: job.summary,
        description: job.description || job.summary,
        requirements: splitRequirements(job.requirements),
      }))
    : careerPosts.map((job) => ({ ...job, description: job.summary }));

  return (
    <main className="simple-page">
      <section className="simple-hero">
        <p className="eyebrow">Careers</p>
        <h1>Build practical technology solutions for Sri Lankan businesses.</h1>
        <p>
          Join the team supporting POS hardware, barcode systems, biometric security, and customer installations.
        </p>
      </section>

      <section className="jobs-list">
        {jobList.map((job) => (
          <JobCardItem job={job} summary={job.summary} key={job.slug} />
        ))}
      </section>
    </main>
  );
}
