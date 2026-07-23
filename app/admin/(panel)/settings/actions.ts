"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/admin-access";
import { recordAuditLog } from "@/lib/audit-log";
import { encryptSecret } from "@/lib/secrets";

export async function saveSettings(formData: FormData) {
  const admin = await requireAdminAction("settings.update");

  const entries: Record<string, string> = {
    siteTitle: formData.get("siteTitle") as string || "",
    googleTagId: (formData.get("googleTagId") as string || "").trim(),
    gtmContainerId: (formData.get("gtmContainerId") as string || "").trim(),
    facebookPixelId: (formData.get("facebookPixelId") as string || "").trim(),
    metaCapiPixelId: (formData.get("metaCapiPixelId") as string || "").trim(),
    adminEmail: formData.get("adminEmail") as string || "",
    offlinePaymentNotes: formData.get("offlinePaymentNotes") as string || "",
    whatsappTechnicalNumber: (formData.get("whatsappTechnicalNumber") as string || "").trim(),
    whatsappSalesNumber: (formData.get("whatsappSalesNumber") as string || "").trim(),
  };

  const operations = Object.entries(entries).map(([key, value]) =>
    prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    }),
  );

  // Write-only secret: an empty field means "keep the stored token",
  // so saving other settings can never wipe the credential.
  const capiToken = ((formData.get("metaCapiAccessToken") as string) || "").trim();
  if (capiToken) {
    const encrypted = await encryptSecret(capiToken);
    operations.push(
      prisma.siteSetting.upsert({
        where: { key: "metaCapiAccessTokenEnc" },
        update: { value: encrypted },
        create: { key: "metaCapiAccessTokenEnc", value: encrypted, group: "tracking" },
      }),
    );
  }

  await Promise.all(operations);

  await recordAuditLog(admin, "settings.update", "SiteSetting", null, { keys: Object.keys(entries) });

  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/services");
}
