import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, Banknote, ClipboardCheck, MessageCircle, Send, ShoppingBag, Truck } from "lucide-react";
import { CheckoutStartTracker } from "@/components/checkout-start-tracker";
import { paymentInstructions } from "@/lib/content";
import { getSiteConfig } from "@/lib/site-settings";
import { getCurrentActiveCart } from "@/lib/cart-session";
import { formatCurrency } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Place Synnex orders online with cart-backed manual payment, delivery, and quotation options.",
};

const icons = [Banknote, Truck, ClipboardCheck];

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const site = await getSiteConfig();
  const cart = await getCurrentActiveCart();
  const subtotal = cart?.items.reduce((sum, item) => sum + item.lineTotal, 0) || 0;

  return (
    <main className="simple-page">
      <section className="simple-hero">
        <p className="eyebrow">Checkout</p>
        <h1>Review your cart and place the order online.</h1>
        <p>
          Place the order yourself, then complete payment manually through bank transfer, cash on delivery,
          or a quotation workflow depending on the order type.
        </p>
      </section>

      {error ? (
        <section className="checkout-alert">
          <AlertCircle size={20} />
          <p>{decodeURIComponent(error)}</p>
        </section>
      ) : null}

      {!cart || cart.items.length === 0 ? (
        <section className="checkout-empty-state">
          <ShoppingBag size={28} />
          <h2>Your cart is empty</h2>
          <p>Add products to the cart first, then return here to complete the order.</p>
          <Link href="/products" className="primary-action">Browse products</Link>
        </section>
      ) : (
        <>
          <CheckoutStartTracker
            cartId={cart.id}
            subtotal={subtotal}
            contents={cart.items.map((item) => ({
              id: item.productId,
              quantity: item.quantity,
              item_price: item.unitPrice,
            }))}
          />
          <section className="checkout-layout">
            <div className="checkout-main">
            <section className="checkout-panel">
              <div>
                <p className="eyebrow">Order request</p>
                <h2>Customer and delivery details</h2>
                <p>
                  This checkout creates a real order from your current cart. A Synnex team member will
                  confirm stock, delivery, warranty, and any installation details after submission.
                </p>
              </div>

              <form action="/api/orders" method="post" className="checkout-form">
                <label>
                  Full name
                  <input name="customer" required placeholder="Customer name" />
                </label>
                <label>
                  Email
                  <input name="email" type="email" required placeholder="customer@example.com" />
                </label>
                <label>
                  Phone
                  <input name="phone" required placeholder="07X XXX XXXX" />
                </label>
                <label>
                  Payment method
                  <select name="paymentMode" defaultValue="bank-transfer">
                    <option value="bank-transfer">Bank transfer</option>
                    <option value="cash-on-delivery">Cash on delivery</option>
                    <option value="quotation">Request quotation</option>
                  </select>
                </label>
                <label className="span-2">
                  Shipping address
                  <textarea
                    name="shippingAddress"
                    rows={3}
                    placeholder="Delivery address, area, branch, or installation site"
                  />
                </label>
                <label className="span-2">
                  Billing address
                  <textarea
                    name="billingAddress"
                    rows={3}
                    placeholder="Billing details if different from the delivery address"
                  />
                </label>
                <label className="span-2">
                  Order notes
                  <textarea
                    name="notes"
                    placeholder="Company name, tax details, installation requirements, or special delivery notes"
                  />
                </label>
                <button className="primary-action" type="submit">
                  <Send size={17} />
                  Place order
                </button>
              </form>
            </section>

            <section className="info-grid">
              {paymentInstructions.map((payment, index) => {
                const Icon = icons[index] ?? Banknote;
                return (
                  <article className="info-card" key={payment.method}>
                    <span>
                      <Icon size={22} />
                    </span>
                    <h2>{payment.title}</h2>
                    <p>{payment.instructions}</p>
                  </article>
                );
              })}
            </section>
            </div>

            <aside className="checkout-sidebar">
              <section className="checkout-summary-card">
                <div className="checkout-summary-head">
                  <p className="eyebrow">Order summary</p>
                  <h2>{cart.items.length} item{cart.items.length > 1 ? "s" : ""}</h2>
                </div>
                <div className="checkout-summary-items">
                  {cart.items.map((item) => (
                    <article key={item.id}>
                      <div>
                        <strong>{item.variant?.name || item.product?.name || "Product"}</strong>
                        <span>Qty {item.quantity}</span>
                      </div>
                      <strong>{formatCurrency(item.lineTotal)}</strong>
                    </article>
                  ))}
                </div>
                <div className="checkout-summary-total">
                  <span>Subtotal</span>
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>
                <p className="checkout-summary-note">
                  {site.offlinePaymentNotes || "Manual payment instructions and confirmation steps will appear after the order is submitted."}
                </p>
              </section>
            </aside>
          </section>
        </>
      )}

      <section className="contact-strip">
        <div>
          <p className="eyebrow">Need help?</p>
          <h2>{site.phone}</h2>
          <p>{site.address}</p>
        </div>
        <Link href="https://api.whatsapp.com/send?phone=94112559466" className="primary-action">
          <MessageCircle size={18} />
          WhatsApp Synnex
        </Link>
      </section>
    </main>
  );
}
