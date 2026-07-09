import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/api-client";
import Link from "next/link";
import { AdminSidebar } from "@/components/sections/admin-sidebar";
import { reviewPaymentUpload, updateOrder } from "./actions";
import { requireAdminPage } from "@/lib/admin-access";
import { FULFILLMENT_STATUSES, ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/order-status";

const statusOptions = ORDER_STATUSES;
const paymentStatusOptions = PAYMENT_STATUSES;
const fulfillmentStatusOptions = FULFILLMENT_STATUSES;

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage("/admin/orders");
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: true, variant: true },
      },
      paymentUploads: true,
      customerAccount: true,
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <main className="admin-shell">
      <AdminSidebar />
      <section className="admin-content-page">
      <div className="admin-topbar">
        <div>
          <p className="eyebrow">
            <Link href="/admin/orders" className="muted-link">Orders</Link>
            {" / "}
            {order.orderNumber}
          </p>
          <h1>Order {order.orderNumber}</h1>
        </div>
        <Link href="/admin/orders" className="secondary-action">Back to orders</Link>
      </div>

      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Customer</p>
            <h2>{order.customer}</h2>
          </div>
          <div className="order-badges">
            <span className={`status-badge status-${order.status.toLowerCase()}`}>{order.status}</span>
            <span className={`status-badge payment-${order.paymentStatus.toLowerCase()}`}>{order.paymentStatus}</span>
            <span className={`status-badge fulfillment-${order.fulfillmentStatus.toLowerCase()}`}>{order.fulfillmentStatus}</span>
          </div>
        </div>

        <div className="order-meta-grid">
          <div>
            <p className="eyebrow">Email</p>
            <p>{order.email || "—"}</p>
          </div>
          <div>
            <p className="eyebrow">Phone</p>
            <p>{order.phone || "—"}</p>
          </div>
          <div>
            <p className="eyebrow">Payment mode</p>
            <p>{order.paymentMode}</p>
          </div>
          <div>
            <p className="eyebrow">Placed</p>
            <p>{order.createdAt.toLocaleString()}</p>
          </div>
          <div>
            <p className="eyebrow">Shipping address</p>
            <p>{order.shippingAddress || "—"}</p>
          </div>
          <div>
            <p className="eyebrow">Billing address</p>
            <p>{order.billingAddress || "—"}</p>
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Items</p>
            <h2>Order line items</h2>
          </div>
          <strong>{formatCurrency(order.total)}</strong>
        </div>
        <div className="management-table">
          {order.items.map((item) => (
            <article key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <span>SKU: {item.sku || "—"} · Qty: {item.quantity}</span>
              </div>
              <span>{formatCurrency(item.unitPrice)}</span>
              <strong>{formatCurrency(item.lineTotal)}</strong>
            </article>
          ))}
        </div>
        <div className="order-totals">
          <div><span>Subtotal</span><strong>{formatCurrency(order.subtotal)}</strong></div>
          {order.discountTotal > 0 && <div><span>Discount</span><strong>-{formatCurrency(order.discountTotal)}</strong></div>}
          {order.shippingTotal > 0 && <div><span>Shipping</span><strong>{formatCurrency(order.shippingTotal)}</strong></div>}
          <div className="total-row"><span>Total</span><strong>{formatCurrency(order.total)} {order.currency}</strong></div>
        </div>
      </section>

      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Update status</p>
            <h2>Manage order</h2>
          </div>
        </div>
        <form className="settings-form" action={updateOrder.bind(null, order.id)}>
          <label>
            Order status
            <select name="status" defaultValue={order.status}>
              {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>
            Payment status
            <select name="paymentStatus" defaultValue={order.paymentStatus}>
              {paymentStatusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>
            Fulfillment status
            <select name="fulfillmentStatus" defaultValue={order.fulfillmentStatus}>
              {fulfillmentStatusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="span-2">
            Notes
            <textarea name="notes" defaultValue={order.notes || ""} />
          </label>
          <button type="submit" className="primary-action">Update order</button>
        </form>
      </section>

      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Manual payments</p>
            <h2>Payment proof review</h2>
          </div>
        </div>
        {order.paymentUploads.length === 0 ? (
          <p>No payment proofs submitted yet.</p>
        ) : (
          <div className="payment-upload-list">
            {order.paymentUploads.map((upload) => (
              <article className="payment-upload-card" key={upload.id}>
                <div className="upload-header">
                  <div>
                    <strong>{upload.reference || upload.fileName}</strong>
                    <span>{upload.uploadedAt.toLocaleString()}</span>
                  </div>
                  <span className={`status-badge status-${upload.status.toLowerCase().replaceAll(" ", "-")}`}>
                    {upload.status}
                  </span>
                </div>
                <div className="order-meta-grid">
                  <div>
                    <p className="eyebrow">Method</p>
                    <p>{upload.method}</p>
                  </div>
                  <div>
                    <p className="eyebrow">Amount</p>
                    <p>{upload.amount ? formatCurrency(upload.amount) : "—"}</p>
                  </div>
                  <div>
                    <p className="eyebrow">Proof link</p>
                    <a href={upload.fileUrl} target="_blank" rel="noreferrer">Open proof</a>
                  </div>
                </div>
                {upload.customerNote ? (
                  <p className="payment-note"><strong>Customer note:</strong> {upload.customerNote}</p>
                ) : null}
                <form className="upload-verification" action={reviewPaymentUpload.bind(null, order.id, upload.id)}>
                  <label>
                    Review status
                    <select name="status" defaultValue={upload.status}>
                      <option value="PendingReview">PendingReview</option>
                      <option value="Verified">Verified</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </label>
                  <label>
                    Admin note
                    <textarea name="adminNote" defaultValue={upload.adminNote || ""} />
                  </label>
                  <button type="submit" className="primary-action">Save payment review</button>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>
      </section>
    </main>
  );
}
