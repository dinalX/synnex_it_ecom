import type { MetadataRoute } from "next";
import { getSiteConfig } from "@/lib/site-settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSiteConfig();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
