import Link from "next/link";
import { BarChart3, Globe, MessageCircle, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { saveSettings } from "./actions";
import { requireAdminPage } from "@/lib/admin-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function SectionIcon({ icon: Icon }: { icon: typeof Globe }) {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
      <Icon size={18} />
    </span>
  );
}

async function getCurrentSettings() {
  const keys = [
    "siteTitle",
    "googleTagId",
    "gtmContainerId",
    "facebookPixelId",
    "metaCapiPixelId",
    "metaCapiAccessTokenEnc",
    "adminEmail",
    "offlinePaymentNotes",
    "whatsappTechnicalNumber",
    "whatsappSalesNumber",
  ];
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: keys } },
  });
  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }
  // The token itself never reaches the form — only whether one is stored.
  const capiTokenSaved = Boolean(map.metaCapiAccessTokenEnc);
  delete map.metaCapiAccessTokenEnc;
  return { map, capiTokenSaved };
}

export default async function AdminSettingsPage() {
  await requireAdminPage("/admin/settings", "settings.view");
  const { map: settings, capiTokenSaved } = await getCurrentSettings();

  return (
    <section className="admin-content-page">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin / settings</p>
            <h1 className="text-2xl font-bold text-foreground">Store settings</h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin">Dashboard</Link>
          </Button>
        </div>

        <form action={saveSettings} className="mt-6 flex flex-col gap-6">
          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <SectionIcon icon={Globe} />
              <CardTitle className="text-lg">Site content</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="siteTitle">Site title</Label>
                <Input
                  id="siteTitle"
                  name="siteTitle"
                  defaultValue={settings.siteTitle || "Synnex IT Solution - POS Hardware Sri Lanka"}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="adminEmail">Admin email</Label>
                <Input id="adminEmail" name="adminEmail" type="email" defaultValue={settings.adminEmail || "admin@synnex.lk"} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <SectionIcon icon={BarChart3} />
              <CardTitle className="text-lg">Analytics &amp; tracking</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="googleTagId">Google Tag ID</Label>
                <Input id="googleTagId" name="googleTagId" placeholder="G-XXXXXXXXXX" defaultValue={settings.googleTagId || ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="gtmContainerId">Google Tag Manager container ID</Label>
                <Input id="gtmContainerId" name="gtmContainerId" placeholder="GTM-XXXXXXX" defaultValue={settings.gtmContainerId || ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="facebookPixelId">Facebook Pixel ID</Label>
                <Input id="facebookPixelId" name="facebookPixelId" placeholder="1234567890" defaultValue={settings.facebookPixelId || ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="metaCapiPixelId">Meta Conversions API pixel ID</Label>
                <Input id="metaCapiPixelId" name="metaCapiPixelId" placeholder="1234567890" defaultValue={settings.metaCapiPixelId || ""} />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="metaCapiAccessToken">Meta Conversions API access token</Label>
                <Input
                  id="metaCapiAccessToken"
                  name="metaCapiAccessToken"
                  type="password"
                  autoComplete="off"
                  placeholder={capiTokenSaved ? "Token saved — enter a new value to replace it" : "EAAB..."}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <SectionIcon icon={MessageCircle} />
              <CardTitle className="text-lg">WhatsApp contact numbers</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="whatsappTechnicalNumber">Technical support</Label>
                <Input
                  id="whatsappTechnicalNumber"
                  name="whatsappTechnicalNumber"
                  placeholder="94112559466"
                  defaultValue={settings.whatsappTechnicalNumber || "94112559466"}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="whatsappSalesNumber">Sales / bulk orders</Label>
                <Input
                  id="whatsappSalesNumber"
                  name="whatsappSalesNumber"
                  placeholder="94112559466"
                  defaultValue={settings.whatsappSalesNumber || "94112559466"}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <SectionIcon icon={Wallet} />
              <CardTitle className="text-lg">Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Label htmlFor="offlinePaymentNotes">Offline payment notes</Label>
                <Textarea id="offlinePaymentNotes" name="offlinePaymentNotes" defaultValue={settings.offlinePaymentNotes || ""} />
              </div>
            </CardContent>
          </Card>

          <div>
            <Button type="submit">Save settings</Button>
          </div>
        </form>
      </section>
  );
}
