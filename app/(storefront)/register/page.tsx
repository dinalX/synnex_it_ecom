import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a Synnex account to track orders and checkout faster.",
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Enter your name and email to continue.",
  weak: "Password must be at least 6 characters.",
  mismatch: "Passwords do not match.",
  exists: "An account with this email already exists — log in instead.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirect || "/checkout";
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] || ERROR_MESSAGES.invalid : null;

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <span className="auth-icon">
          <UserPlus size={24} />
        </span>
        <p className="eyebrow">New customer</p>
        <h1>Create your account</h1>
        <p>Save your details once to check out faster next time and track your orders.</p>
        {errorMessage ? <div className="form-error">{errorMessage}</div> : null}
        <form action="/api/auth/register" method="post" className="auth-form">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <label>
            Full name
            <input name="name" type="text" placeholder="Jane Perera" required />
          </label>
          <label>
            Email
            <input name="email" type="email" placeholder="customer@example.com" required />
          </label>
          <label>
            Phone (optional)
            <input name="phone" type="tel" placeholder="07XXXXXXXX" />
          </label>
          <label>
            Password
            <input name="password" type="password" placeholder="Minimum 6 characters" minLength={6} required />
          </label>
          <label>
            Confirm password
            <input name="confirmPassword" type="password" placeholder="Re-enter your password" minLength={6} required />
          </label>
          <button className="primary-action" type="submit">Create account</button>
        </form>
        <Link href={`/login?redirect=${encodeURIComponent(redirectTo)}`} className="auth-link">
          Already have an account? Log in
        </Link>
      </section>
    </main>
  );
}
