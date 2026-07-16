import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { USER_SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/api-client";

export default async function AccountPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(USER_SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token, "user");

  if (!session) {
    redirect("/login?redirect=/account");
  }

  const customer = (session.id
    ? await prisma.customer.findUnique({ where: { id: session.id } })
    : null) || await prisma.customer.findUnique({ where: { email: session.email } });

  const orders = await prisma.order.findMany({
    where: customer
      ? {
          OR: [
            { customerId: customer.id },
            { customerId: session.email },
          ],
        }
      : { customerId: session.email },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } } },
  });

  return (
    <main className="simple-page">
      <section className="simple-hero">
        <p className="eyebrow">My account</p>
        <h1>Welcome, {customer?.name || session.name}</h1>
        <p>Track your orders and manage your account details.</p>
      </section>

      <section className="account-grid">
        <div className="account-card">
          <h2>Profile</h2>
          <div className="account-info">
            <div>
              <p className="eyebrow">Name</p>
              <p>{customer?.name || "—"}</p>
            </div>
            <div>
              <p className="eyebrow">Email</p>
              <p>{customer?.email || session.email}</p>
            </div>
            <div>
              <p className="eyebrow">Phone</p>
              <p>{customer?.phone || "—"}</p>
            </div>
            <div>
              <p className="eyebrow">Status</p>
              <p>{customer?.status || "Active"}</p>
            </div>
          </div>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="secondary-action">Log out</button>
          </form>
        </div>

        <div className="account-card">
          <h2>Order history</h2>
          {orders.length === 0 ? (
            <div className="empty-state">
              <p>No orders yet. Start browsing our catalog.</p>
              <Link href="/products" className="primary-action">Browse products</Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <article key={order.id} className="order-row">
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <span>{order.createdAt.toLocaleDateString()} · {order.items.length} item{order.items.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="order-row-status">
                    <span className={`status-badge status-${order.status.toLowerCase()}`}>{order.status}</span>
                    <span className={`status-badge payment-${order.paymentStatus.toLowerCase()}`}>{order.paymentStatus}</span>
                  </div>
                  <strong>{formatCurrency(order.total)}</strong>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
