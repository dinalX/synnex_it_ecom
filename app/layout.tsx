import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk } from "next/font/google";
import { AnalyticsEvents } from "@/components/analytics-events";
import { AnalyticsScripts } from "@/components/analytics-scripts";
import { getSiteConfig } from "@/lib/site-settings";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();

  return {
    metadataBase: new URL(site.url),
    title: {
      default: site.title,
      template: `%s | ${site.name}`,
    },
    description: site.description,
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: site.name,
    },
    openGraph: {
      title: site.name,
      description: site.description,
      url: site.url,
      siteName: site.name,
      locale: "en_LK",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: site.name,
      description: site.description,
    },
    alternates: {
      canonical: site.url,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={hankenGrotesk.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AnalyticsScripts />
        <AnalyticsEvents />
        {children}
      </body>
    </html>
  );
}
