import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/api-client";

const featured = {
  name: "POS Machine Combo Offer",
  image: "/products/pos-combo.svg",
  price: 155000,
  rating: 4.8,
};

export function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Sri Lanka POS hardware provider</p>
        <h1>POS, barcode, biometric, and IT hardware that keeps business moving.</h1>
        <p>
          Synnex IT Solution supplies POS machines, receipt printers, barcode scanners,
          cash drawers, attendance systems, smart locks, and printer solutions with local
          installation and after-sales support.
        </p>
        <div className="hero-actions">
          <Link href="/products" className="primary-action">
            Browse products
            <ArrowRight size={18} />
          </Link>
          <Link href="/checkout" className="secondary-action">
            Request quotation
          </Link>
        </div>
      </div>
      <div className="hero-visual" aria-label={`Featured product: ${featured.name}`}>
        <Image src={featured.image} alt={featured.name} priority width={980} height={920} />
        <div className="hero-product-card">
          <span>Featured drop</span>
          <strong>{featured.name}</strong>
          <small>{formatCurrency(featured.price)} · {featured.rating} rating</small>
        </div>
      </div>
    </section>
  );
}
