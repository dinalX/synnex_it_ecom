import { lookup } from "node:dns/promises";
import { parseHttpUrl } from "@/lib/form-validation";

/** Private, loopback, link-local, and CGNAT ranges we refuse to fetch (SSRF guard). */
function isPrivateIp(ip: string): boolean {
  const v4 = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (v4) {
    const a = Number(v4[1]);
    const b = Number(v4[2]);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  const v6 = ip.toLowerCase();
  if (v6 === "::1" || v6 === "::") return true;
  if (v6.startsWith("fe80")) return true; // link-local
  if (v6.startsWith("fc") || v6.startsWith("fd")) return true; // unique-local
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIp(mapped[1]);
  return false;
}

async function resolvesToPublicHost(hostname: string): Promise<boolean> {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".local") || lower.endsWith(".internal")) return false;
  if (isPrivateIp(lower)) return false; // literal private IP
  try {
    const addresses = await lookup(hostname, { all: true });
    if (addresses.length === 0) return false;
    return addresses.every((entry) => !isPrivateIp(entry.address));
  } catch {
    return false; // DNS failure → treat as unreachable
  }
}

/**
 * "Working" = the URL resolves to a public host that returns *some* HTTP
 * response. A 401/403 (e.g. a shared-but-private CV) still counts as working,
 * matching "cv can be not public". Only a DNS failure, connection error, or
 * timeout is treated as a broken link. `redirect: "manual"` prevents a 3xx
 * from being followed into an internal host (SSRF hardening).
 */
export async function checkUrlReachable(
  value: string,
  timeoutMs = 6000,
): Promise<{ ok: boolean; reason?: string }> {
  const url = parseHttpUrl(value);
  if (!url) return { ok: false, reason: "it is not a valid http(s) link" };

  if (!(await resolvesToPublicHost(url.hostname))) {
    return { ok: false, reason: "the address could not be reached" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await fetch(url.toString(), {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: { "User-Agent": "SynnexBot/1.0 (+careers link check)" },
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: "the link could not be opened" };
  } finally {
    clearTimeout(timer);
  }
}
