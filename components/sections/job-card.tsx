import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, MapPin } from "lucide-react";

interface JobCardProps {
  job: {
    slug: string;
    title: string;
    department: string;
    location: string;
    type: string;
    summary: string;
    requirements: string[];
  };
}

export function JobCard({ job }: JobCardProps) {
  return (
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
  );
}

interface JobListProps {
  jobs: JobCardProps["job"][];
}

export function JobList({ jobs }: JobListProps) {
  return (
    <section className="jobs-list">
      {jobs.map((job) => (
        <JobCard key={job.slug} job={job} />
      ))}
    </section>
  );
}
