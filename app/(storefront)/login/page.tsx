import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export const metadata: Metadata = {
  title: "Customer Login",
  description: "Login to continue to Synnex checkout.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string; reset?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirect || "/checkout";

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <span className="auth-icon">
          <LockKeyhole size={24} />
        </span>
        <p className="eyebrow">Customer login</p>
        <h1>Login before checkout</h1>
        <p>Use your email to continue with an offline payment request or quotation.</p>
        {params.error ? <div className="form-error">Enter a valid email and password.</div> : null}
        {params.reset ? <div className="form-notice">Password updated — log in with your new password.</div> : null}
        <form action="/api/auth/login" method="post" className="auth-form">
          <input type="hidden" name="role" value="user" />
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <label>
            Email
            <input name="email" type="email" placeholder="customer@example.com" required />
          </label>
          <label>
            Password
            <input name="password" type="password" placeholder="Your password" required />
          </label>
          <button className="primary-action" type="submit">Continue</button>
        </form>
        <div className="auth-links">
          <Link href="/forgot-password" className="auth-link">
            Forgot password?
          </Link>
          <Link href={`/register?redirect=${encodeURIComponent(redirectTo)}`} className="auth-link">
            New customer? Create an account
          </Link>
        </div>
      </section>
    </main>
  );
}
