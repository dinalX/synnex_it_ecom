import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, PackageCheck, Settings } from "lucide-react";
import { WhatsappCtaButtons } from "@/components/whatsapp-cta-buttons";
import { siteConfig } from "@/lib/site";
import { getSiteConfig } from "@/lib/site-settings";
import type { WhatsappClickService } from "@/lib/whatsapp-click";

const services: { slug: WhatsappClickService; title: string; summary: string; points: string[] }[] = [
  {
    slug: "pos",
    title: "POS Solution",
    summary:
      "Complete retail and restaurant billing setups with POS terminals, receipt printers, cash drawers, scanners, installation, and support.",
    points: ["Billing counters", "Restaurants and pharmacies", "Hardware installation"],
  },
  {
    slug: "barcode",
    title: "Barcode Solution",
    summary:
      "Barcode scanning, labeling, and stock handling hardware for retail counters, stores, and warehouse teams.",
    points: ["Wireless scanners", "Stock room workflows", "Retail checkout speed"],
  },
  {
    slug: "security",
    title: "Biometrics & Security",
    summary:
      "Attendance, access control, smart locks, and secure storage solutions for offices and retail operations.",
    points: ["Fingerprint attendance", "Access control", "Secure storage"],
  },
];

const pointIcons = [BadgeCheck, PackageCheck, Settings];

export const metadata: Metadata = {
  title: "Services",
  description:
    "POS, barcode, and biometric security solutions for Sri Lankan businesses — with local installation and after-sales support.",
  alternates: { canonical: `${siteConfig.url}/services` },
};

export default async function ServicesPage() {
  const config = await getSiteConfig();

  return (
    <main className="simple-page">
      <section className="simple-hero">
        <p className="eyebrow">Synnex solutions</p>
        <h1>Complete technology solutions for your business.</h1>
        <p>
          POS, barcode, and biometric security systems — supplied, installed, and supported by a local team across Sri Lanka.
        </p>
        <div className="hero-actions">
          <Link href="/products" className="primary-action">Browse products</Link>
          <Link href="/downloads" className="secondary-action">Drivers and support</Link>
        </div>
      </section>

      {services.map((service) => (
        <section className="services-section" id={service.slug} key={service.slug}>
          <div className="services-section-head">
            <p className="eyebrow">{service.title}</p>
            <h2>{service.title}</h2>
            <p>{service.summary}</p>
            <div className="hero-actions">
              <WhatsappCtaButtons
                service={service.slug}
                title={service.title}
                technicalNumber={config.whatsappTechnicalNumber}
                salesNumber={config.whatsappSalesNumber}
              />
            </div>
          </div>
          <div className="info-grid">
            {service.points.map((point, index) => {
              const Icon = pointIcons[index] ?? BadgeCheck;
              return (
                <article className="info-card" key={point}>
                  <span><Icon size={22} /></span>
                  <h3>{point}</h3>
                  <p>Configured for Sri Lankan business operations with local after-sales support.</p>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
