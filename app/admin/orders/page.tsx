import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/api-client";
import { AdminSidebar } from "@/components/sections/admin-sidebar";
import { OrderFilters } from "./order-filters";
import { ORDER_STATUSES } from "@/lib/order-status";
import { requireAdminPage } from "@/lib/admin-access";

const PAGE_SIZE = 20;

// Filter and search params for orders
type OrderFilter = "All" | "Pending" | "Confirmed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}) {
  await requireAdminPage("/admin/orders");
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
      { orderNumber: { contains: cleanQuery, mode: "insensitive" } },
      { customer: { contains: cleanQuery, mode: "insensitive" } },
    ];
    
    if (query.includes("@")) {
      orderWhere.OR.push({ email: { contains: query, mode: "insensitive" } });
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
        <div className="admin-topbar">
          <div>
            <p className="eyebrow">Admin / orders</p>
            <h1>Order management</h1>
          </div>
          <Link href="/admin" className="secondary-action">Dashboard</Link>
        </div>

        <section className="admin-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Orders</p>
              <h2>{total} total orders</h2>
            </div>
          </div>

          <OrderFilters initialQuery={query ?? ""} initialStatus={statusStr ?? ""} />

          <div className="management-table">
            {orders.length === 0 && (
              <article style={{ padding: "24px", textAlign: "center" }}>
                <strong>No orders found with current filters.</strong>
              </article>
            )}
            {orders.map((order) => (
              <Link href={`/admin/orders/${order.id}`} key={order.id} className="management-row">
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <strong>{order.orderNumber}</strong>
                  <span style={{ fontSize: "0.85rem", color: "#637083" }}>{order.customer} {order.email && `| ${order.email}`}</span>
                  <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>{order.createdAt.toLocaleDateString()} {order.createdAt.toLocaleTimeString()}</span>
                </div>
                <span>{formatCurrency(order.total)}</span>
                <em className={`status status-${order.status.toLowerCase()}`}>{order.status}</em>
              </Link>
            ))}
          </div>

          {/* Status summary */}
          {total > 0 && (
            <div style={{ marginTop: "24px", padding: "16px", background: "#f9fafb", borderRadius: "8px" }}>
              <p className="eyebrow" style={{ margin: "0 0 12px" }}>Status Breakdown</p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {ORDER_STATUSES.map((s) => (
                  countMap.has(s) ? (
                    <span key={s} style={{ padding: "4px 12px", background: "#f3f4f6", borderRadius: "99px", fontSize: "0.85rem" }}>
                      {s}: {countMap.get(s) || 0}
                    </span>
                  ) : null
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              {page > 1 && (
                <Link href={`/admin/orders?page=${page - 1}&status=${statusStr}&search=${encodeURIComponent(query ?? "")}`} className="secondary-action">← Previous</Link>
              )}
              <span>Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link href={`/admin/orders?page=${page + 1}&status=${statusStr}&search=${encodeURIComponent(query ?? "")}`} className="secondary-action">Next →</Link>
              )}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
