import Link from "next/link";
import { Compass } from "lucide-react";

export default function StorefrontNotFound() {
  return (
    <main className="simple-page">
      <div className="products-empty">
        <Compass size={40} className="products-empty-icon" aria-hidden="true" />
        <h2>Page not found</h2>
        <p>The page you were looking for doesn&apos;t exist or may have moved.</p>
        <div className="products-empty-actions">
          <Link href="/" className="primary-action">Back to storefront</Link>
          <Link href="/products" className="secondary-action">Browse products</Link>
        </div>
      </div>
    </main>
  );
}
