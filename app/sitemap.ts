import type { MetadataRoute } from "next";
import { getSiteConfig } from "@/lib/site-settings";
import { careerPosts, driverDownloads } from "@/lib/content";
import { fetchProducts } from "@/lib/data";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getSiteConfig();
  const staticRoutes = ["", "/careers", "/checkout", "/downloads"];
  const serviceRoutes = ["/services/pos", "/services/barcode", "/services/security"];

  let productRoutes: string[] = [];
  try {
    const { products } = await fetchProducts({ limit: 100 });
    productRoutes = products.map((p) => `/products/${p.slug}`);
  } catch {
    productRoutes = [];
  }

  const jobs = await prisma.jobPost.findMany({
    where: { published: true },
    select: { slug: true },
  });
  const downloads = await prisma.driverDownload.findMany({
    where: { published: true },
    select: { slug: true },
  });

  const careerRoutes = (jobs.length ? jobs : careerPosts).map((job) => `/careers#${job.slug}`);
  const downloadRoutes = (downloads.length ? downloads : driverDownloads).map((download) => `/downloads#${download.slug}`);

  return [...staticRoutes, ...serviceRoutes, ...productRoutes, ...careerRoutes, ...downloadRoutes].map((route) => ({
    url: `${site.url}${route}`,
    lastModified: new Date(),
    changeFrequency: route.includes("/products") ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
