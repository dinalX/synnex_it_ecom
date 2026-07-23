import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin-access";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AuditLogFilters } from "./audit-log-filters";

const PAGE_SIZE = 30;

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; entity?: string; adminId?: string }>;
}) {
  await requireAdminPage("/admin/audit-log", "audit.view");
  const { page: pageStr, entity, adminId } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where = {
    ...(entity ? { entity } : {}),
    ...(adminId ? { adminId } : {}),
  };

  const [logs, total, entityRows, admins] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      include: { admin: { select: { name: true, email: true } } },
    }),
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({ distinct: ["entity"], select: { entity: true }, orderBy: { entity: "asc" } }),
    prisma.adminUser.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const entities = entityRows.map((r) => r.entity);

  return (
    <section className="admin-content-page">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin / audit log</p>
          <h1 className="text-2xl font-bold text-foreground">Audit log</h1>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin">Dashboard</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Activity</p>
          <CardTitle className="text-lg">{total} recorded {total === 1 ? "action" : "actions"}</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditLogFilters
            entities={entities}
            admins={admins}
            initialEntity={entity ?? ""}
            initialAdminId={adminId ?? ""}
          />

          {logs.length === 0 ? (
            <article className="rounded-lg border border-border p-6 text-center">
              <strong className="text-foreground">No activity recorded with current filters.</strong>
            </article>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {log.createdAt.toLocaleDateString()} {log.createdAt.toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.admin ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{log.admin.name}</span>
                            <span className="text-xs text-muted-foreground">{log.admin.email}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Deleted admin</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {log.entity}
                        {log.entityId && (
                          <span className="ml-1 text-xs text-muted-foreground">#{log.entityId.slice(0, 8)}</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                        {log.metadata ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.ipAddress ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-4 py-4">
              {page > 1 && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/audit-log?page=${page - 1}&entity=${entity ?? ""}&adminId=${adminId ?? ""}`}>← Previous</Link>
                </Button>
              )}
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/audit-log?page=${page + 1}&entity=${entity ?? ""}&adminId=${adminId ?? ""}`}>Next →</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
