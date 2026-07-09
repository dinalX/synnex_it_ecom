"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="brand admin-brand">
          <span className="brand-mark">S</span>
          <span>Synnex</span>
        </Link>
      </aside>
      <section className="admin-content-page">
        <div className="admin-topbar">
          <div>
            <p className="eyebrow">Error</p>
            <h1>Something went wrong</h1>
          </div>
        </div>
        <section className="admin-panel">
          <p>An unexpected error occurred while loading this page.</p>
          {error.digest && <p className="muted-text">Error ID: {error.digest}</p>}
          <div className="error-actions">
            <button onClick={reset} className="primary-action">Try again</button>
            <Link href="/admin" className="secondary-action">Back to dashboard</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
