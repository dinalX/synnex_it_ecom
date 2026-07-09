import { cache } from "react";
import { prisma } from "@/lib/db";
import { siteConfig } from "@/lib/site";

export type SiteSettings = typeof siteConfig & {
  googleTagId: string;
  facebookPixelId: string;
  adminEmail: string;
  offlinePaymentNotes: string;
};

export const getSiteConfig = cache(async (): Promise<SiteSettings> => {
  const keys = ["siteTitle", "googleTagId", "facebookPixelId", "adminEmail", "offlinePaymentNotes"];
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: keys } },
  });

  const map: Record<string, string> = {};
  for (const setting of settings) {
    map[setting.key] = setting.value;
  }

  return {
    ...siteConfig,
    title: map.siteTitle || siteConfig.title,
    googleTagId: map.googleTagId || process.env.NEXT_PUBLIC_GTAG_ID || "",
    facebookPixelId: map.facebookPixelId || process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "",
    adminEmail: map.adminEmail || process.env.ADMIN_EMAIL || "",
    offlinePaymentNotes: map.offlinePaymentNotes || "",
  };
});

