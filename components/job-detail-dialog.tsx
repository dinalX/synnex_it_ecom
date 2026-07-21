"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BriefcaseBusiness, MapPin, X } from "lucide-react";

export interface JobDetail {
  slug: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
}

export function JobDetailDialog({ job, onClose }: { job: JobDetail; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Same modal contract as QuickViewDialog: remember focus, move it in,
  // trap Tab, close on Escape, restore focus on close.
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    closeButtonRef.current?.focus();
    const previousFocus = previousFocusRef;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocus.current?.focus();
    };
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/careers/${job.slug}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, linkedinUrl, cvUrl, message }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to submit application");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  }

  return createPortal(
    <div className="quick-view-shell">
      <button
        type="button"
        className="quick-view-backdrop"
        aria-label="Close job details"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className="job-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={job.title}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="icon-button quick-view-close"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <p className="eyebrow">{job.department}</p>
        <h2>{job.title}</h2>
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

        <p className="job-dialog-desc">{job.description}</p>

        {job.requirements.length > 0 && (
          <ul className="job-dialog-requirements">
            {job.requirements.map((requirement) => (
              <li key={requirement}>{requirement}</li>
            ))}
          </ul>
        )}

        <hr />

        {submitted ? (
          <p className="form-success">
            Application submitted! We&apos;ll be in touch if it&apos;s a match.
          </p>
        ) : (
          <form className="checkout-form" onSubmit={handleSubmit}>
            <label>
              Full name
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Phone (optional)
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
            <label>
              LinkedIn URL (optional)
              <input
                type="url"
                placeholder="https://linkedin.com/in/…"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </label>
            <label>
              CV URL
              <input
                type="url"
                required
                placeholder="Link to your CV (Google Drive, Dropbox, etc.)"
                value={cvUrl}
                onChange={(e) => setCvUrl(e.target.value)}
              />
            </label>
            <label>
              Message (optional)
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="primary-action" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Application"}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
