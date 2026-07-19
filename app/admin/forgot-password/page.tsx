"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function AdminForgotPasswordPage() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/admin-forgot-password", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      setMessage(data.message || data.error || "Something went wrong");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-6 p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyRound size={24} />
            </span>
            <h1 className="text-2xl font-bold text-foreground">Forgot password</h1>
            <p className="text-sm text-muted-foreground">
              Enter your admin email and we&apos;ll send you a reset link.
            </p>
          </div>
          {message ? (
            <p className="rounded-md bg-muted px-3 py-2 text-sm text-foreground">{message}</p>
          ) : (
            <form action={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Admin email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <Button className="w-full" type="submit" disabled={pending}>
                {pending ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}
          <Link href="/admin/login" className="text-center text-sm text-primary hover:underline">
            Back to login
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
