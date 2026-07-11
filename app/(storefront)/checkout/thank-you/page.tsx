import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { OrderConfirmationTracker } from "@/components/order-confirmation-tracker";
import { prisma } from "@/lib/db";
import { getSiteConfig } from "@/lib/site-settings";
import { formatCurrency } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "Order Received",
  description: "Synnex has received your order and next-step payment details.",
};

export default async function CheckoutThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; paymentUpload?: string }>;
}) {
  const { orderId, paymentUpload } = await searchParams;
  const site = await getSiteConfig();
  const order = orderId
    ? await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true, paymentUploads: { orderBy: { uploadedAt: "desc" } } },
      })
    : null;

  return (
    <main className="auth-page">
      <section className="auth-panel auth-panel-wide">
        <span className="auth-icon">
          <CheckCircle2 size={26} />
        </span>
        <p className="eyebrow">Order received</p>
        <h1>{order ? `Order ${order.orderNumber} is now in review` : "We will confirm your order shortly"}</h1>
        <p>
          The Synnex team will review stock, warranty, delivery, and payment details before confirming
          dispatch. Keep the order number handy for WhatsApp or phone follow-up.
        </p>
        {order ? (
          <>
            <OrderConfirmationTracker
              orderId={order.id}
              email={order.email}
              phone={order.phone}
              total={order.total}
              paymentUploadId={paymentUpload === "success" ? order.paymentUploads[0]?.id : undefined}
              contents={order.items.map((item) => ({
                id: item.productId || item.variantId || item.id,
                quantity: item.quantity,
                item_price: item.unitPrice,
              }))}
            />
            <div className="thank-you-summary">
              <div>
                <p className="eyebrow">Payment method</p>
                <strong>{order.paymentMode}</strong>
              </div>
              <div>
                <p className="eyebrow">Order total</p>
                <strong>{formatCurrency(order.total)}</strong>
              </div>
              <div>
                <p className="eyebrow">Status</p>
                <strong>{order.status} / {order.paymentStatus}</strong>
              </div>
            </div>
            <div className="checkout-alert inline-note">
              <p>{site.offlinePaymentNotes || "If you are paying by bank transfer, upload your deposit slip below so the Synnex team can review it quickly."}</p>
            </div>
            {paymentUpload === "success" ? (
              <div className="checkout-alert success-note">
                <p>Payment proof submitted. The admin team can now review it from the order dashboard.</p>
              </div>
            ) : null}
            {paymentUpload && paymentUpload !== "success" ? (
              <div className="checkout-alert">
                <p>{decodeURIComponent(paymentUpload)}</p>
              </div>
            ) : null}
            <form
              action={`/api/orders/${order.id}/payments`}
              method="post"
              encType="multipart/form-data"
              className="settings-form payment-proof-form"
            >
              <label>
                Payment reference number
                <input name="reference" placeholder="Bank transfer ref / deposit slip number" />
              </label>
              <label>
                Amount paid (LKR)
                <input name="amount" type="number" min="0" placeholder="Optional" />
              </label>
              <label className="span-2">
                Bank slip (photo or PDF, max 5MB)
                <input
                  name="file"
                  type="file"
                  required
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif,application/pdf"
                />
              </label>
              <label className="span-2">
                Note for Synnex
                <textarea name="customerNote" placeholder="Transfer time, branch, or anything the team should cross-check" />
              </label>
              <button type="submit" className="primary-action">Submit payment proof</button>
            </form>
          </>
        ) : null}
        <div className="thank-you-actions">
          <Link href="/" className="primary-action">Back to storefront</Link>
          <Link href="/products" className="secondary-action">Continue browsing</Link>
        </div>
      </section>
    </main>
  );
}
