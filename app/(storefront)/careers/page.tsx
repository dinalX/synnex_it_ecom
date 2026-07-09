import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, MapPin } from "lucide-react";
import { careerPosts } from "@/lib/content";
import { prisma } from "@/lib/db";

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
        requirements: splitRequirements(job.requirements),
      }))
    : careerPosts;

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
          <article className="job-card" id={job.slug} key={job.slug}>
            <div>
              <p className="eyebrow">{job.department}</p>
              <h2>{job.title}</h2>
              <p>{job.summary}</p>
              <div className="job-meta">
                <span>
                  <MapPin size={16} />
                  {job.location}
                </span>
                <span>
                  <BriefcaseBusiness size={16} />
                  {job.type}
                </span>
              </div>
            </div>
            <ul>
              {job.requirements.map((requirement) => (
                <li key={requirement}>{requirement}</li>
              ))}
            </ul>
            <Link href="mailto:careers@synnex.lk" className="secondary-action">
              Apply
              <ArrowUpRight size={16} />
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
