"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/customer-forgot-password", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      setMessage(data.message || data.error || "Something went wrong. Please try again.");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <span className="auth-icon">
          <KeyRound size={24} />
        </span>
        <p className="eyebrow">Forgot password</p>
        <h1>Reset your password</h1>
        <p>Enter your account email and we&apos;ll send you a reset link.</p>
        {message ? (
          <div className="form-notice">{message}</div>
        ) : (
          <form action={handleSubmit} className="auth-form">
            <label>
              Email
              <input name="email" type="email" placeholder="customer@example.com" required />
            </label>
            <button className="primary-action" type="submit" disabled={pending}>
              {pending ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
        <Link href="/login" className="auth-link">
          Back to login
        </Link>
      </section>
    </main>
  );
}
