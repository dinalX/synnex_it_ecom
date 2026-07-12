import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { siteConfig } from "@/lib/site";

export function QuoteCtaSection() {
  const telHref = `tel:${siteConfig.phone.replace(/\s+/g, "")}`;

  return (
    <section className="quote-cta" aria-label="Request a quotation">
      <div className="quote-cta-inner">
        <div className="quote-cta-copy">
          <p className="eyebrow">Setting up a new business?</p>
          <h2>Get a custom POS &amp; hardware package quote</h2>
          <p>
            Tell us what you need — retail, restaurant, or warehouse — and our team will
            put together a complete setup with installation and training.
          </p>
        </div>
        <div className="quote-cta-actions">
          <Link href="/products" className="primary-action">
            Start your order
            <ArrowRight size={18} />
          </Link>
          <a href={telHref} className="quote-cta-phone">
            <Phone size={18} />
            {siteConfig.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
