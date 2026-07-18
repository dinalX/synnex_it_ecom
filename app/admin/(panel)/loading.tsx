import { Card, CardContent } from "@/components/ui/card";

export default function AdminLoading() {
  return (
    <section className="admin-content-page">
      <div className="mb-6 flex flex-col gap-2">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="h-6 w-48 animate-pulse rounded bg-muted" />
      </div>
      <Card>
        <CardContent className="flex flex-col gap-3 p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
