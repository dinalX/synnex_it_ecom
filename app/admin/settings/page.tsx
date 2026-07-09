import Link from "next/link";
import { prisma } from "@/lib/db";
import { saveSettings } from "./actions";
import { AdminSidebar } from "@/components/sections/admin-sidebar";
import { requireAdminPage } from "@/lib/admin-access";

async function getCurrentSettings() {
  const keys = ["siteTitle", "googleTagId", "facebookPixelId", "adminEmail", "offlinePaymentNotes"];
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: keys } },
  });
  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }
  return map;
}

export default async function AdminSettingsPage() {
  await requireAdminPage("/admin/settings", "settings.view");
  const settings = await getCurrentSettings();

  return (
    <main className="admin-shell">
      <AdminSidebar />
      <section className="admin-content-page">
      <div className="admin-topbar">
        <div>
          <p className="eyebrow">Admin / settings</p>
          <h1>Store settings</h1>
        </div>
        <Link href="/admin" className="secondary-action">Dashboard</Link>
      </div>

      <section className="admin-panel editor-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Managed settings</p>
            <h2>Tracking, payments, and site content</h2>
          </div>
        </div>
        <form className="settings-form" action={saveSettings}>
          <label>
            Site title
            <input
              name="siteTitle"
              defaultValue={settings.siteTitle || "Synnex IT Solution - POS Hardware Sri Lanka"}
            />
          </label>
          <label>
            Google Tag ID
            <input
              name="googleTagId"
              placeholder="G-XXXXXXXXXX"
              defaultValue={settings.googleTagId || ""}
            />
          </label>
          <label>
            Facebook Pixel ID
            <input
              name="facebookPixelId"
              placeholder="1234567890"
              defaultValue={settings.facebookPixelId || ""}
            />
          </label>
          <label>
            Admin email
            <input
              name="adminEmail"
              type="email"
              defaultValue={settings.adminEmail || "admin@synnex.lk"}
            />
          </label>
          <label className="span-2">
            Offline payment notes
            <textarea
              name="offlinePaymentNotes"
              defaultValue={settings.offlinePaymentNotes || ""}
            />
          </label>
          <button type="submit" className="primary-action">Save settings</button>
        </form>
      </section>
      </section>
    </main>
  );
}
