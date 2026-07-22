"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { KeyRound } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
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
      const res = await fetch("/api/auth/customer-reset-password", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }
      router.push("/login?reset=1");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reset password");
    } finally {
      setPending(false);
    }
  }

  if (!token) {
    return (
      <main className="auth-page">
        <section className="auth-panel">
          <div className="form-error">This reset link is missing its token.</div>
          <Link href="/forgot-password" className="auth-link">
            Request a new link
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <span className="auth-icon">
          <KeyRound size={24} />
        </span>
        <p className="eyebrow">Reset password</p>
        <h1>Set a new password</h1>
        <form action={handleSubmit} className="auth-form">
          <label>
            New password
            <input name="newPassword" type="password" placeholder="Minimum 8 characters" minLength={8} required />
          </label>
          <label>
            Confirm new password
            <input name="confirmPassword" type="password" placeholder="Re-enter your password" minLength={8} required />
          </label>
          {error ? <div className="form-error">{error}</div> : null}
          <button className="primary-action" type="submit" disabled={pending}>
            {pending ? "Saving…" : "Set new password"}
          </button>
        </form>
        {error ? (
          <Link href="/forgot-password" className="auth-link">
            Request a new link
          </Link>
        ) : null}
      </section>
    </main>
  );
}
