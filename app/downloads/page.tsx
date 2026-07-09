import type { Metadata } from "next";
import { Download, FileDown, Search } from "lucide-react";
import { driverDownloads } from "@/lib/content";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Software Drivers & Downloads",
  description:
    "Download Synnex software drivers, printer utilities, barcode scanner guides, and biometric attendance tools.",
};

export default async function DownloadsPage() {
  const downloads = await prisma.driverDownload.findMany({
    where: { published: true },
    orderBy: { updatedAt: "desc" },
  });
  const downloadList = downloads.length ? downloads : driverDownloads;

  return (
    <main className="simple-page">
      <section className="simple-hero">
        <p className="eyebrow">Software drivers</p>
        <h1>Drivers and setup files for supported Synnex devices.</h1>
        <p>
          Keep POS printers, barcode scanners, and biometric devices ready with a managed download library.
        </p>
      </section>

      <label className="download-search">
        <Search size={18} />
        <input placeholder="Search by device, OS, version, or keyword" />
      </label>

      <section className="download-list">
        {downloadList.map((download) => (
          <article className="download-card" id={download.slug} key={download.slug}>
            <div className="download-icon">
              <FileDown size={24} />
            </div>
            <div>
              <p className="eyebrow">{download.deviceType}</p>
              <h2>{download.title}</h2>
              <p>{download.notes}</p>
              <div className="job-meta">
                <span>{download.version}</span>
                <span>{download.os}</span>
              </div>
            </div>
            <a href={download.fileUrl} className="primary-action" aria-label={`Download ${download.title}`}>
              <Download size={17} />
              Download
            </a>
          </article>
        ))}
      </section>
    </main>
  );
}
