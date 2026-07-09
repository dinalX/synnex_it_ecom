import Link from "next/link";
import { Send } from "lucide-react";

export function CheckoutForm() {
  return (
    <form action="/api/orders/offline" method="post" className="checkout-form">
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
        Order notes
        <textarea
          name="notes"
          placeholder="Products, quantities, installation address, or quotation details"
        />
      </label>
      <button className="primary-action" type="submit">
        <Send size={17} />
        Submit order request
      </button>
    </form>
  );
}

export function CheckoutPanel() {
  return (
    <section className="checkout-panel">
      <div>
        <p className="eyebrow">Order request</p>
        <h2>Send checkout details</h2>
        <p>
          This creates an offline order request for admin review. The team confirms stock,
          delivery, installation, and payment instructions before dispatch.
        </p>
      </div>
      <CheckoutForm />
    </section>
  );
}
