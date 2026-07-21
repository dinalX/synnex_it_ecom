import { cache } from "react";
import { prisma } from "@/lib/db";
import { decryptSecret } from "@/lib/secrets";
import { siteConfig } from "@/lib/site";

export type SiteSettings = typeof siteConfig & {
  googleTagId: string;
  gtmContainerId: string;
  facebookPixelId: string;
  adminEmail: string;
  offlinePaymentNotes: string;
  whatsappTechnicalNumber: string;
  whatsappSalesNumber: string;
};

const DEFAULT_WHATSAPP_NUMBER = "94112559466";

export const getSiteConfig = cache(async (): Promise<SiteSettings> => {
  const keys = [
    "siteTitle", "googleTagId", "gtmContainerId", "facebookPixelId", "adminEmail", "offlinePaymentNotes",
    "whatsappTechnicalNumber", "whatsappSalesNumber",
  ];
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
    gtmContainerId: map.gtmContainerId || "",
    facebookPixelId: map.facebookPixelId || process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "",
    adminEmail: map.adminEmail || process.env.ADMIN_EMAIL || "",
    offlinePaymentNotes: map.offlinePaymentNotes || "",
    whatsappTechnicalNumber: map.whatsappTechnicalNumber || DEFAULT_WHATSAPP_NUMBER,
    whatsappSalesNumber: map.whatsappSalesNumber || DEFAULT_WHATSAPP_NUMBER,
  };
});

/**
 * Server-only: Meta Conversions API credentials for the CAPI route.
 * Admin-saved values (token encrypted at rest) win over env vars.
 * Never expose the decrypted token through getSiteConfig or any API response.
 */
export async function getMetaCapiCredentials(): Promise<{ pixelId: string; accessToken: string } | null> {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: ["metaCapiPixelId", "metaCapiAccessTokenEnc"] } },
  });
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;

  const pixelId = map.metaCapiPixelId || process.env.FACEBOOK_CAPI_PIXEL_ID || "";
  const accessToken = map.metaCapiAccessTokenEnc
    ? (await decryptSecret(map.metaCapiAccessTokenEnc)) || ""
    : process.env.FACEBOOK_CAPI_ACCESS_TOKEN || "";

  if (!pixelId || !accessToken) return null;
  return { pixelId, accessToken };
}
