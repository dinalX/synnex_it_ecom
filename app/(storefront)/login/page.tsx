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
  searchParams: Promise<{ redirect?: string; error?: string }>;
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
        <form action="/api/auth/login" method="post" className="auth-form">
          <input type="hidden" name="role" value="user" />
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <label>
            Email
            <input name="email" type="email" placeholder="customer@example.com" required />
          </label>
          <label>
            Password
            <input name="password" type="password" placeholder="Minimum 4 characters" minLength={4} required />
          </label>
          <button className="primary-action" type="submit">Continue</button>
        </form>
        <Link href="/admin/login" className="auth-link">Admin login</Link>
      </section>
    </main>
  );
}
