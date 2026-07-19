"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function AdminResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <AdminResetPasswordForm />
    </Suspense>
  );
}

function AdminResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("token", token);
    try {
      const res = await fetch("/api/auth/admin-reset-password", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }
      router.push("/admin/login?reset=1");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reset password");
    } finally {
      setPending(false);
    }
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col gap-4 p-8 text-center">
            <p className="text-sm text-red-600">This reset link is missing its token.</p>
            <Link href="/admin/forgot-password" className="text-sm text-primary hover:underline">
              Request a new link
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-6 p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyRound size={24} />
            </span>
            <h1 className="text-2xl font-bold text-foreground">Set a new password</h1>
          </div>
          <form action={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input id="newPassword" name="newPassword" type="password" required minLength={8} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} />
            </div>
            {error && (
              <p className="text-sm text-red-600">
                {error}{" "}
                <Link href="/admin/forgot-password" className="underline">
                  Request a new link
                </Link>
              </p>
            )}
            <Button className="w-full" type="submit" disabled={pending}>
              {pending ? "Saving…" : "Set new password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
