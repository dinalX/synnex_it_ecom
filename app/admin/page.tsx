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
        <div className="admin-topbar">
          <div>
            <p className="eyebrow">Admin dashboard</p>
            <h1>Store operations</h1>
          </div>
          <label className="admin-search">
            <Search size={18} />
            <input placeholder="Search orders, products, customers" />
          </label>
        </div>

        <div className="admin-stats">
          {stats.map((stat, index) => {
            const Icon = [CircleDollarSign, ShoppingCart, ArrowUpRight, Boxes][index];
            return (
              <article className="stat-card" key={stat.label}>
                <span><Icon size={20} /></span>
                <p>{stat.label}</p>
                <strong>{stat.value}</strong>
                <small>{stat.delta} vs last month</small>
              </article>
            );
          })}
        </div>

        <div className="admin-grid">
          <section className="admin-panel large">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Orders</p>
                <h2>Recent activity</h2>
              </div>
              <button>Export <ArrowUpRight size={16} /></button>
            </div>
            <div className="orders-table">
              <div className="table-row table-head">
                <span>Order</span>
                <span>Customer</span>
                <span>Status</span>
                <span>Total</span>
                <span>Channel</span>
              </div>
              {orders.map((order) => (
                <div className="table-row" key={order.id}>
                  <strong>{order.id}</strong>
                  <span>{order.customer}</span>
                  <span className={`status ${order.status.toLowerCase().replaceAll(" ", "-")}`}>
                    {order.status}
                  </span>
                  <span>{formatCurrency(order.total)}</span>
                  <span>{order.channel}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Fulfillment</p>
                <h2>Pipeline</h2>
              </div>
            </div>
            <div className="pipeline">
              {fulfillment.map((step) => (
                <div key={step.label}>
                  <span>{step.label}</span>
                  <strong>{step.value}</strong>
                  <div><i style={{ width: `${Math.min(step.value * 1.6, 100)}%` }} /></div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="admin-panel inventory-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Inventory</p>
              <h2>Stock watchlist</h2>
            </div>
            <Link href="/">View storefront <ChevronRight size={16} /></Link>
            <Link href="/admin/content">All functions <ChevronRight size={16} /></Link>
          </div>
          <div className="inventory-list">
            {inventory.map((row) => (
              <article key={row.sku}>
                <div>
                  <strong>{row.name}</strong>
                  <span>{row.sku} · {row.category}</span>
                </div>
                <span>{row.stock} units</span>
                <em className={row.status === "Restock" ? "needs-stock" : ""}>{row.status}</em>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
