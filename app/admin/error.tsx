"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
      <aside className="sticky top-0 flex h-screen w-[250px] flex-col overflow-y-auto border-r border-border bg-card p-6">
        <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-bold text-foreground no-underline">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm text-primary-foreground">
            S
          </span>
          <span>Synnex</span>
        </Link>
      </aside>
      <section className="admin-content-page">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Error</p>
          <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
        </div>
        <Card className="mt-6">
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">An unexpected error occurred while loading this page.</p>
            {error.digest && <p className="text-xs text-muted-foreground">Error ID: {error.digest}</p>}
            <div className="flex gap-3">
              <Button onClick={reset}>Try again</Button>
              <Button asChild variant="outline">
                <Link href="/admin">Back to dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
