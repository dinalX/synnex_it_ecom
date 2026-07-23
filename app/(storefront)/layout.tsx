import "./storefront-tailwind.css";
import { CartProvider } from "@/components/cart-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MarqueeBar } from "@/components/marquee-bar";
import { JsonLd } from "@/components/json-ld";
import { siteConfig } from "@/lib/site";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: siteConfig.name,
          url: siteConfig.url,
          telephone: siteConfig.phone,
          address: {
            "@type": "PostalAddress",
            streetAddress: siteConfig.address,
            addressLocality: "Colombo",
            addressCountry: "LK",
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: siteConfig.name,
          url: siteConfig.url,
          potentialAction: {
            "@type": "SearchAction",
            target: `${siteConfig.url}/products?search={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <MarqueeBar />
      <SiteHeader />
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
      <SiteFooter />
    </CartProvider>
  );
}
