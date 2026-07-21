// Pure, dependency-free validators safe to import from both client and server.

export function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

export function isValidHttpUrl(value: string): boolean {
  return parseHttpUrl(value) !== null;
}

/** A real LinkedIn profile/company/school URL (not just any linkedin.com page). */
export function isLinkedInProfileUrl(value: string): boolean {
  const url = parseHttpUrl(value);
  if (!url) return false;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) return false;
  return /^\/(in|pub|company|school)\/[^/]+/.test(url.pathname);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}
