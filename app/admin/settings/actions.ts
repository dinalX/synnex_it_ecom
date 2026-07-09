"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/admin-access";

export async function saveSettings(formData: FormData) {
  await requireAdminAction();

  const entries: Record<string, string> = {
    siteTitle: formData.get("siteTitle") as string || "",
    googleTagId: formData.get("googleTagId") as string || "",
    facebookPixelId: formData.get("facebookPixelId") as string || "",
    adminEmail: formData.get("adminEmail") as string || "",
    offlinePaymentNotes: formData.get("offlinePaymentNotes") as string || "",
  };

  const operations = Object.entries(entries).map(([key, value]) =>
    prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    }),
  );

  await Promise.all(operations);

  revalidatePath("/admin/settings");
  revalidatePath("/");
}
