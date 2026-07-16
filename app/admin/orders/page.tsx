import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/api-client";
import { AdminSidebar } from "@/components/sections/admin-sidebar";
import { OrderFilters } from "./order-filters";
import { ORDER_STATUSES, getStatusBadgeClass } from "@/lib/order-status";
import { requireAdminPage } from "@/lib/admin-access";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PAGE_SIZE = 20;

// Filter and search params for orders
type OrderFilter = "All" | "Pending" | "Confirmed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}) {
  await requireAdminPage("/admin/orders", "order.view");
  const { page: pageStr, status: statusStr, search: query } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;
  
  // Parse filter status if provided
  let statusFilter: OrderFilter | undefined = statusStr as OrderFilter;
  if (!statusFilter || ["All"].includes(statusStr!)) {
    statusFilter = undefined;
  }

  // Build order query for filtering and search
  const orderWhere: any = {};
  
  // Add status filter if specified
  if (statusFilter) {
    orderWhere.status = statusFilter;
  }

  // Add search filter (by order number, customer name, or email)
  if (query && query.trim()) {
    const cleanQuery = query.trim().toLowerCase();
    
    // Create a complex where condition for OR search
    orderWhere.OR = [
      { orderNumber: { contains: cleanQuery } },
      { customer: { contains: cleanQuery } },
    ];

    if (query.includes("@")) {
      orderWhere.OR.push({ email: { contains: query } });
    }
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      where: Object.keys(orderWhere).length === 0 ? undefined : orderWhere as any,
      include: { items: true },
    }),
    prisma.order.count({ where: Object.keys(orderWhere).length === 0 ? undefined : orderWhere }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const statusCounts = await prisma.order.groupBy({
    by: ["status"],
    _count: true,
  });
  
  const countMap = new Map(statusCounts.map((s) => [s.status, s._count]));

  return (
    <main className="admin-shell">
      <AdminSidebar />
      <section className="admin-content-page">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin / orders</p>
            <h1 className="text-2xl font-bold text-foreground">Order management</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin">Dashboard</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Orders</p>
            <CardTitle className="text-lg">{total} total orders</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderFilters initialQuery={query ?? ""} initialStatus={statusStr ?? ""} />

            <div className="flex flex-col gap-3">
              {orders.length === 0 && (
                <article className="rounded-lg border border-border p-6 text-center">
                  <strong className="text-foreground">No orders found with current filters.</strong>
                </article>
              )}
              {orders.map((order) => (
                <Link
                  href={`/admin/orders/${order.id}`}
                  key={order.id}
                  className="grid grid-cols-1 items-start gap-2 rounded-lg border border-border bg-card p-4 no-underline transition-colors hover:border-primary/20 hover:bg-accent/50 sm:grid-cols-[2fr_1fr_auto] sm:items-center sm:gap-4"
                >
                  <div className="flex flex-col gap-1">
                    <strong className="text-sm text-foreground">{order.orderNumber}</strong>
                    <span className="text-sm text-muted-foreground">{order.customer} {order.email && `| ${order.email}`}</span>
                    <span className="text-xs text-muted-foreground">{order.createdAt.toLocaleDateString()} {order.createdAt.toLocaleTimeString()}</span>
                  </div>
                  <span className="text-sm text-foreground">{formatCurrency(order.total)}</span>
                  <Badge className={getStatusBadgeClass(order.status)}>{order.status}</Badge>
                </Link>
              ))}
            </div>

            {/* Status summary */}
            {total > 0 && (
              <div className="mt-6 rounded-lg bg-muted p-4">
                <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Status Breakdown</p>
                <div className="flex flex-wrap gap-2">
                  {ORDER_STATUSES.map((s) => (
                    countMap.has(s) ? (
                      <Badge key={s} variant="secondary">
                        {s}: {countMap.get(s) || 0}
                      </Badge>
                    ) : null
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-4 py-4">
                {page > 1 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/orders?page=${page - 1}&status=${statusStr}&search=${encodeURIComponent(query ?? "")}`}>← Previous</Link>
                  </Button>
                )}
                <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                {page < totalPages && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/orders?page=${page + 1}&status=${statusStr}&search=${encodeURIComponent(query ?? "")}`}>Next →</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
