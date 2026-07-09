import Link from "next/link";
import {
  ArrowUpRight,
  Boxes,
  ChevronRight,
  CircleDollarSign,
  Search,
  ShoppingCart,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/api-client";
import { AdminSidebar } from "@/components/sections/admin-sidebar";
import { requireAdminPage } from "@/lib/admin-access";
import { getStatusBadgeClass } from "@/lib/order-status";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

async function getDashboardData() {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    orderCount, productCount, recentOrders, inventoryRows,
    thisMonthOrders, lastMonthOrders,
    thisMonthRevenue, lastMonthRevenue,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.product.count(),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { items: { include: { product: true } } },
    }),
    prisma.product.findMany({
      take: 10,
      orderBy: { inventory: "asc" },
    }),
    prisma.order.count({ where: { createdAt: { gte: thisMonthStart } } }),
    prisma.order.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: thisMonthStart } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
  ]);

  const rev = thisMonthRevenue._sum.total || 0;
  const prevRev = lastMonthRevenue._sum.total || 0;
  const revDelta = prevRev > 0 ? ((rev - prevRev) / prevRev * 100).toFixed(1) : "0";
  const ordDelta = lastMonthOrders > 0 ? ((thisMonthOrders - lastMonthOrders) / lastMonthOrders * 100).toFixed(1) : "0";
  const avgValue = thisMonthOrders > 0 ? Math.round(rev / thisMonthOrders) : 0;
  const prevAvg = lastMonthOrders > 0 ? Math.round(prevRev / lastMonthOrders) : 0;
  const avgDelta = prevAvg > 0 ? ((avgValue - prevAvg) / prevAvg * 100).toFixed(1) : "0";

  return {
    stats: [
      { label: "Revenue", value: formatCurrency(rev), delta: `${Number(revDelta) >= 0 ? "+" : ""}${revDelta}%` },
      { label: "Orders", value: String(thisMonthOrders), delta: `${Number(ordDelta) >= 0 ? "+" : ""}${ordDelta}%` },
      { label: "Products", value: String(productCount), delta: "catalog" },
      { label: "Avg. value", value: formatCurrency(avgValue), delta: `${Number(avgDelta) >= 0 ? "+" : ""}${avgDelta}%` },
    ],
    orders: recentOrders.map((o) => ({
      id: o.orderNumber,
      customer: o.customer,
      status: o.status,
      total: o.total,
      channel: o.paymentMode,
      placed: o.createdAt,
    })),
    inventory: inventoryRows.map((p) => ({
      sku: p.sku || p.id.slice(0, 8).toUpperCase(),
      name: p.name,
      category: p.category,
      stock: p.inventory,
      status: p.inventory < 25 ? "Restock" : "Healthy",
    })),
    fulfillment: [
      { label: "New", value: recentOrders.filter((o) => o.status === "Pending").length },
      { label: "Paid", value: recentOrders.filter((o) => o.paymentStatus === "Paid").length },
      { label: "Processing", value: recentOrders.filter((o) => o.fulfillmentStatus === "Processing").length },
      { label: "Shipped", value: recentOrders.filter((o) => o.fulfillmentStatus === "Fulfilled").length },
    ],
  };
}

export default async function AdminPage() {
  await requireAdminPage("/admin");
  const { stats, orders, inventory, fulfillment } = await getDashboardData();

  return (
    <main className="admin-shell">
      <AdminSidebar />

      <section className="admin-main" id="dashboard">
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin dashboard</p>
              <h1 className="text-2xl font-bold text-foreground">Store operations</h1>
            </div>
            <label className="flex h-11 w-full max-w-[420px] items-center gap-2 rounded-lg border border-border bg-card px-3">
              <Search size={18} className="text-muted-foreground" />
              <input
                placeholder="Search orders, products, customers"
                className="h-full w-full bg-transparent text-sm outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = [CircleDollarSign, ShoppingCart, ArrowUpRight, Boxes][index];
              return (
                <Card key={stat.label}>
                  <CardHeader>
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
                      <Icon size={20} />
                    </span>
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <strong className="text-2xl font-bold text-foreground">{stat.value}</strong>
                    <p className="mt-1 text-xs text-muted-foreground">{stat.delta} vs last month</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Orders</p>
                  <CardTitle className="text-lg">Recent activity</CardTitle>
                </div>
                <Button variant="outline" size="sm">
                  Export <ArrowUpRight size={16} />
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Channel</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-semibold">{order.id}</TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeClass(order.status)}>{order.status}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(order.total)}</TableCell>
                        <TableCell>{order.channel}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Fulfillment</p>
                <CardTitle className="text-lg">Pipeline</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {fulfillment.map((step) => (
                  <div key={step.label} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{step.label}</span>
                      <strong className="text-foreground">{step.value}</strong>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(step.value * 1.6, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Inventory</p>
                <CardTitle className="text-lg">Stock watchlist</CardTitle>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium">
                <Link href="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                  View storefront <ChevronRight size={16} />
                </Link>
                <Link href="/admin/content" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                  All functions <ChevronRight size={16} />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {inventory.map((row) => (
                <article key={row.sku} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
                  <div>
                    <strong className="text-foreground">{row.name}</strong>
                    <span className="block text-sm text-muted-foreground">{row.sku} · {row.category}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{row.stock} units</span>
                  <Badge className={row.status === "Restock" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"}>
                    {row.status}
                  </Badge>
                </article>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
