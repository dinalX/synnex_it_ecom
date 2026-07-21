"use client";

import { useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, MapPin } from "lucide-react";
import { JobDetailDialog, type JobDetail } from "@/components/job-detail-dialog";

export function JobCardItem({ job, summary }: { job: JobDetail; summary: string }) {
  const [open, setOpen] = useState(false);

  return (
    <article className="job-card" id={job.slug}>
      <div>
        <p className="eyebrow">{job.department}</p>
        <h2>{job.title}</h2>
        <p>{summary}</p>
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
      <button type="button" className="secondary-action" onClick={() => setOpen(true)}>
        View & Apply
        <ArrowUpRight size={16} />
      </button>
      {open && <JobDetailDialog job={job} onClose={() => setOpen(false)} />}
    </article>
  );
}
