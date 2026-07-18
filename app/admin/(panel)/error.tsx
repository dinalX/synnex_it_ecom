"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    <section className="admin-content-page">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Error</p>
        <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
      </div>
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
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
  );
}
