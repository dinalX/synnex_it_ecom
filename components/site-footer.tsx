import Link from "next/link";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { getSiteConfig } from "@/lib/site-settings";

export async function SiteFooter() {
  const site = await getSiteConfig();
  const brandName = site.title.split(" | ")[0] || site.name;
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Link href="/" className="brand">
            <span className="brand-mark">S</span>
            <span>{brandName}</span>
          </Link>
          <p>{site.description}</p>
        </div>

        <div className="footer-newsletter">
          <h2>Stay updated</h2>
          <p>Get product launches, driver updates, and IT hardware insights.</p>
          <form className="newsletter-form" action="#" method="post">
            <input type="email" placeholder="Your email address" required aria-label="Email for newsletter" />
            <button type="submit" aria-label="Subscribe to newsletter">
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      <div className="footer-columns">
        <nav aria-label="Footer solutions">
          <h2>Solutions</h2>
          <Link href="/services/pos">POS Solution</Link>
          <Link href="/services/barcode">Barcode Solution</Link>
          <Link href="/services/security">Biometrics & Security</Link>
          <Link href="/products">All Products</Link>
        </nav>
        <nav aria-label="Footer support">
          <h2>Support</h2>
          <Link href="/downloads">Software Drivers</Link>
          <Link href="/careers">Careers</Link>
          <Link href="/checkout">Request Quotation</Link>
          <Link href="/account">My Account</Link>
        </nav>
        <address>
          <h2>Contact</h2>
          <span>
            <Phone size={16} />
            {site.phone}
          </span>
          <span>
            <Mail size={16} />
            info@synnex.lk
          </span>
          <span>
            <MapPin size={16} />
            {site.address}
          </span>
        </address>
      </div>

      <div className="footer-bottom">
        <p>&copy; {year} Synnex IT Solution (Pvt) Ltd. All rights reserved.</p>
      </div>
    </footer>
  );
}
