import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentAdminSession } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Login to manage Synnex admin functions.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string; reset?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirect || "/admin";

  const session = await getCurrentAdminSession();
  if (session) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-6 p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck size={24} />
            </span>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin login</p>
            <h1 className="text-2xl font-bold text-foreground">Manage Synnex</h1>
            <p className="text-sm text-muted-foreground">
              Admin access is required for products, orders, content, careers, downloads, and settings.
            </p>
          </div>
          {params.error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">Invalid admin credentials.</p>
          ) : null}
          {params.reset ? (
            <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Password updated — log in with your new password.</p>
          ) : null}
          <form action="/api/auth/login" method="post" className="flex flex-col gap-4">
            <input type="hidden" name="role" value="admin" />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Admin email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="Admin password" required />
            </div>
            <Button className="w-full" type="submit">Login</Button>
          </form>
          <Link href="/admin/forgot-password" className="text-center text-sm text-muted-foreground hover:underline">
            Forgot password?
          </Link>
          <Link href="/" className="text-center text-sm text-primary hover:underline">
            Back to storefront
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
