import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getSiteConfig } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Synnex IT Solution for sales, support, or installation enquiries.",
};

export default async function ContactPage() {
  const site = await getSiteConfig();

  return (
    <main className="simple-page">
      <section className="simple-hero">
        <p className="eyebrow">Contact</p>
        <h1>We&apos;re here to help.</h1>
        <p>Reach out for sales, technical support, or installation enquiries — our team responds during business hours.</p>
      </section>

      <section className="info-grid">
        <article className="info-card">
          <span><Phone size={20} /></span>
          <h2>Phone</h2>
          <p>{site.phone}</p>
        </article>
        <article className="info-card">
          <span><Mail size={20} /></span>
          <h2>Email</h2>
          <p>info@synnex.lk</p>
        </article>
        <article className="info-card">
          <span><MapPin size={20} /></span>
          <h2>Address</h2>
          <p>{site.address}</p>
        </article>
      </section>

      <section className="contact-strip">
        <div>
          <p className="eyebrow">Need a quick answer?</p>
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
