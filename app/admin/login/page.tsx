import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Login to manage Synnex admin functions.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirect || "/admin";

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <span className="auth-icon">
          <ShieldCheck size={24} />
        </span>
        <p className="eyebrow">Admin login</p>
        <h1>Manage Synnex</h1>
        <p>Admin access is required for products, orders, content, careers, downloads, and settings.</p>
        {params.error ? <div className="form-error">Invalid admin credentials.</div> : null}
        <form action="/api/auth/login" method="post" className="auth-form">
          <input type="hidden" name="role" value="admin" />
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <label>
            Admin email
            <input name="email" type="email" defaultValue="admin@synnex.lk" required />
          </label>
          <label>
            Password
            <input name="password" type="password" placeholder="Admin password" required />
          </label>
          <button className="primary-action" type="submit">Login</button>
        </form>
        <Link href="/" className="auth-link">Back to storefront</Link>
      </section>
    </main>
  );
}
