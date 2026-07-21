"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BriefcaseBusiness, MapPin, X } from "lucide-react";
import { isLinkedInProfileUrl, isValidEmail, isValidHttpUrl } from "@/lib/form-validation";

export interface JobDetail {
  slug: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
}

type FieldErrors = Partial<Record<"name" | "email" | "phone" | "linkedinUrl" | "cvUrl", string>>;

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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
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

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = "Please enter your full name.";
    if (!email.trim()) errors.email = "Please enter your email.";
    else if (!isValidEmail(email)) errors.email = "Enter a valid email address.";
    if (!phone.trim()) errors.phone = "Please enter your phone number.";
    if (linkedinUrl.trim() && !isLinkedInProfileUrl(linkedinUrl)) {
      errors.linkedinUrl = "Enter a valid LinkedIn profile URL (linkedin.com/in/…).";
    }
    if (!cvUrl.trim()) errors.cvUrl = "A link to your CV is required.";
    else if (!isValidHttpUrl(cvUrl)) errors.cvUrl = "Enter a valid link starting with http:// or https://.";
    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      dialogRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }

    setSubmitting(true);
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
        <div className="job-dialog-header">
          <div>
            <p className="eyebrow">{job.department}</p>
            <h2>{job.title}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="icon-button job-dialog-close"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="job-dialog-body">
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

          {submitted ? (
            <p className="form-success">
              Application submitted! We&apos;ll be in touch if it&apos;s a match.
            </p>
          ) : (
            <form className="job-apply-form" onSubmit={handleSubmit} noValidate>
              <h3>Apply for this role</h3>
              <label>
                Full name <span className="required-mark">*</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={fieldErrors.name ? "true" : undefined}
                />
                {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
              </label>
              <label>
                Email <span className="required-mark">*</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={fieldErrors.email ? "true" : undefined}
                />
                {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
              </label>
              <label>
                Phone <span className="required-mark">*</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-invalid={fieldErrors.phone ? "true" : undefined}
                />
                {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
              </label>
              <label>
                LinkedIn URL <span className="field-hint">(optional)</span>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/your-name"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  aria-invalid={fieldErrors.linkedinUrl ? "true" : undefined}
                />
                {fieldErrors.linkedinUrl && <span className="field-error">{fieldErrors.linkedinUrl}</span>}
              </label>
              <label>
                CV link <span className="required-mark">*</span>
                <input
                  type="url"
                  placeholder="Google Drive, Dropbox, etc. — can be private"
                  value={cvUrl}
                  onChange={(e) => setCvUrl(e.target.value)}
                  aria-invalid={fieldErrors.cvUrl ? "true" : undefined}
                />
                {fieldErrors.cvUrl && <span className="field-error">{fieldErrors.cvUrl}</span>}
              </label>
              <label>
                Message <span className="field-hint">(optional)</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </label>
              {error && <p className="form-error">{error}</p>}
              <button type="submit" className="primary-action job-apply-submit" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Application"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
