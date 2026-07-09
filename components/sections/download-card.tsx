import { Download, FileDown, Search } from "lucide-react";

interface DownloadItem {
  slug: string;
  title: string;
  deviceType: string;
  version: string;
  os: string;
  fileUrl: string;
  notes: string;
}

interface DownloadCardProps {
  download: DownloadItem;
}

export function DownloadCard({ download }: DownloadCardProps) {
  return (
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
      <a
        href={download.fileUrl}
        className="primary-action"
        aria-label={`Download ${download.title}`}
      >
        <Download size={17} />
        Download
      </a>
    </article>
  );
}

interface DownloadListProps {
  downloads: DownloadItem[];
}

export function DownloadList({ downloads }: DownloadListProps) {
  return (
    <section className="download-list">
      {downloads.map((download) => (
        <DownloadCard key={download.slug} download={download} />
      ))}
    </section>
  );
}

export function DownloadSearch() {
  return (
    <label className="download-search">
      <Search size={18} />
      <input placeholder="Search by device, OS, version, or keyword" />
    </label>
  );
}
