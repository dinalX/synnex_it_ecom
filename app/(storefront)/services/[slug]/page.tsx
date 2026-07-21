import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, PackageCheck, Settings } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { WhatsappCtaButtons } from "@/components/whatsapp-cta-buttons";
import { fetchProducts } from "@/lib/data";
import { siteConfig } from "@/lib/site";
import { isWhatsappClickService } from "@/lib/whatsapp-click";

const services: Record<string, { title: string; summary: string; category: string; points: string[] }> = {
  pos: {
    title: "POS Solution",
    summary: "Complete retail and restaurant billing setups with POS terminals, receipt printers, cash drawers, scanners, installation, and support.",
    category: "POS Solution",
    points: ["Billing counters", "Restaurants and pharmacies", "Hardware installation"],
  },
  barcode: {
    title: "Barcode Solution",
    summary: "Barcode scanning, labeling, and stock handling hardware for retail counters, stores, and warehouse teams.",
    category: "Barcode Solution",
    points: ["Wireless scanners", "Stock room workflows", "Retail checkout speed"],
  },
  security: {
    title: "Biometrics & Security",
    summary: "Attendance, access control, smart locks, and secure storage solutions for offices and retail operations.",
    category: "Biometrics & Security",
    points: ["Fingerprint attendance", "Access control", "Secure storage"],
  },
};

export function generateStaticParams() {
  return Object.keys(services).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = services[slug];
  if (!service) return {};
  return {
    title: service.title,
    description: service.summary,
    alternates: { canonical: `${siteConfig.url}/services/${slug}` },
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = services[slug];
  if (!service || !isWhatsappClickService(slug)) notFound();

  const { products: matchingProducts } = await fetchProducts({ category: slug });

  return (
    <main className="simple-page">
      <section className="simple-hero">
        <p className="eyebrow">Synnex solutions</p>
        <h1>{service.title}</h1>
        <p>{service.summary}</p>
        <div className="hero-actions">
          <WhatsappCtaButtons service={slug} title={service.title} />
          <Link href="/downloads" className="secondary-action">Drivers and support</Link>
        </div>
      </section>

      <section className="info-grid">
        {service.points.map((point, index) => {
          const Icon = [BadgeCheck, PackageCheck, Settings][index] ?? BadgeCheck;
          return (
            <article className="info-card" key={point}>
              <span><Icon size={22} /></span>
              <h2>{point}</h2>
              <p>Configured for Sri Lankan business operations with local after-sales support.</p>
            </article>
          );
        })}
      </section>

      <section className="product-section related-products">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Related products</p>
            <h2>{service.title} catalog</h2>
          </div>
        </div>
        <div className="product-grid three">
          {matchingProducts.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>
      </section>
    </main>
  );
}
