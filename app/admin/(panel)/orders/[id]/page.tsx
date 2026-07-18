import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/api-client";
import Link from "next/link";
import { reviewPaymentUpload, updateOrder } from "./actions";
import { requireAdminPage } from "@/lib/admin-access";
import {
  FULFILLMENT_STATUSES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_UPLOAD_STATUSES,
  getStatusBadgeClass,
} from "@/lib/order-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusOptions = ORDER_STATUSES;
const paymentStatusOptions = PAYMENT_STATUSES;
const fulfillmentStatusOptions = FULFILLMENT_STATUSES;

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage("/admin/orders", "order.view");
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
    <section className="admin-content-page">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Link href="/admin/orders" className="text-muted-foreground no-underline hover:text-foreground">Orders</Link>
            {" / "}
            {order.orderNumber}
          </p>
          <h1 className="text-2xl font-bold text-foreground">Order {order.orderNumber}</h1>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/orders">Back to orders</Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Customer</p>
            <CardTitle className="text-lg">{order.customer}</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className={getStatusBadgeClass(order.status)}>{order.status}</Badge>
            <Badge className={getStatusBadgeClass(order.paymentStatus)}>{order.paymentStatus}</Badge>
            <Badge className={getStatusBadgeClass(order.fulfillmentStatus)}>{order.fulfillmentStatus}</Badge>
          </div>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Email</p>
            <p className="text-foreground">{order.email || "—"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Phone</p>
            <p className="text-foreground">{order.phone || "—"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Payment mode</p>
            <p className="text-foreground">{order.paymentMode}</p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Placed</p>
            <p className="text-foreground">{order.createdAt.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Shipping address</p>
            <p className="text-foreground">{order.shippingAddress || "—"}</p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Billing address</p>
            <p className="text-foreground">{order.billingAddress || "—"}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Items</p>
            <CardTitle className="text-lg">Order line items</CardTitle>
          </div>
          <strong className="text-lg text-foreground">{formatCurrency(order.total)}</strong>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {order.items.map((item) => (
            <article key={item.id} className="grid grid-cols-1 items-start gap-2 rounded-lg border border-border p-4 sm:grid-cols-[2fr_1fr_1fr] sm:items-center sm:gap-4">
              <div>
                <strong className="text-foreground">{item.name}</strong>
                <span className="block text-sm text-muted-foreground">SKU: {item.sku || "—"} · Qty: {item.quantity}</span>
              </div>
              <span className="text-sm text-foreground">{formatCurrency(item.unitPrice)}</span>
              <strong className="text-foreground">{formatCurrency(item.lineTotal)}</strong>
            </article>
          ))}

          <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <strong className="text-foreground">{formatCurrency(order.subtotal)}</strong>
            </div>
            {order.discountTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <strong className="text-foreground">-{formatCurrency(order.discountTotal)}</strong>
              </div>
            )}
            {order.shippingTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <strong className="text-foreground">{formatCurrency(order.shippingTotal)}</strong>
              </div>
            )}
            <div className="flex justify-between text-base">
              <span className="font-semibold text-foreground">Total</span>
              <strong className="text-foreground">{formatCurrency(order.total)}</strong>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Update status</p>
          <CardTitle className="text-lg">Manage order</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" action={updateOrder.bind(null, order.id)}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Order status</Label>
              <Select name="status" defaultValue={order.status}>
                <SelectTrigger id="status" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="paymentStatus">Payment status</Label>
              <Select name="paymentStatus" defaultValue={order.paymentStatus}>
                <SelectTrigger id="paymentStatus" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {paymentStatusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fulfillmentStatus">Fulfillment status</Label>
              <Select name="fulfillmentStatus" defaultValue={order.fulfillmentStatus}>
                <SelectTrigger id="fulfillmentStatus" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {fulfillmentStatusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" defaultValue={order.notes || ""} />
            </div>
            <Button type="submit" className="sm:col-span-2 sm:w-fit">Update order</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Manual payments</p>
          <CardTitle className="text-lg">Payment proof review</CardTitle>
        </CardHeader>
        <CardContent>
          {order.paymentUploads.length === 0 ? (
            <p className="text-muted-foreground">No payment proofs submitted yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {order.paymentUploads.map((upload) => (
                <article className="rounded-lg border border-border p-4" key={upload.id}>
                  <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <strong className="text-foreground">{upload.reference || upload.fileName}</strong>
                      <span className="block text-sm text-muted-foreground">{upload.uploadedAt.toLocaleString()}</span>
                    </div>
                    <Badge className={getStatusBadgeClass(upload.status)}>{upload.status}</Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Method</p>
                      <p className="text-foreground">{upload.method}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Amount</p>
                      <p className="text-foreground">{upload.amount ? formatCurrency(upload.amount) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Proof link</p>
                      <a href={upload.fileUrl} target="_blank" rel="noreferrer" className="text-primary underline">Open proof</a>
                    </div>
                  </div>
                  {upload.customerNote ? (
                    <p className="mt-3 text-sm text-foreground"><strong>Customer note:</strong> {upload.customerNote}</p>
                  ) : null}
                  <form className="mt-4 grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2" action={reviewPaymentUpload.bind(null, order.id, upload.id)}>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`upload-status-${upload.id}`}>Review status</Label>
                      <Select name="status" defaultValue={upload.status}>
                        <SelectTrigger id={`upload-status-${upload.id}`} className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PAYMENT_UPLOAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`upload-note-${upload.id}`}>Admin note</Label>
                      <Textarea id={`upload-note-${upload.id}`} name="adminNote" defaultValue={upload.adminNote || ""} />
                    </div>
                    <Button type="submit" className="sm:col-span-2 sm:w-fit">Save payment review</Button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </section>
  );
}
