import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <main className="admin-shell">
      <aside className="sticky top-0 flex h-screen w-[250px] flex-col overflow-y-auto border-r border-border bg-card p-6">
        <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-bold text-foreground no-underline">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm text-primary-foreground">
            S
          </span>
          <span>Synnex</span>
        </Link>
        <nav aria-label="Admin navigation" className="flex flex-col gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-md" />
          ))}
        </nav>
      </aside>
      <section className="admin-content-page">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-7 w-56" />
          </div>
        </div>
        <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <Skeleton className="mb-4 h-6 w-40" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-md" />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
