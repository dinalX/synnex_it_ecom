export const USER_SESSION_COOKIE = "synnex_user_session";
export const ADMIN_SESSION_COOKIE = "synnex_admin_session";

export async function ensureAdmin() {
  const session = await getCurrentAdminSession();

  if (!session) {
    throw new Error("Unauthorized: Admin access required");
  }
  return session;
}

export type SessionRole = "user" | "admin";

export type SessionPayload = {
  id?: string;
  email: string;
  name: string;
  role: SessionRole;
  exp: number;
};

const ENCRYPTION_KEY_SALT = "synnex-session-encrypt-v1";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is required");
  }
  return secret;
}

function base64UrlEncode(value: string | ArrayBuffer | Uint8Array) {
  const bytes =
    typeof value === "string"
      ? new TextEncoder().encode(value)
      : value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new TextDecoder().decode(bytes);
}

function base64UrlToBuffer(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getEncryptionKey(): Promise<CryptoKey> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(getSecret() + ENCRYPTION_KEY_SALT));
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));

  return base64UrlEncode(signature);
}

function isLegacyFormat(body: string): boolean {
  try {
    const decoded = base64UrlDecode(body);
    return decoded.startsWith("{");
  } catch {
    return false;
  }
}

export async function createSessionToken(payload: Omit<SessionPayload, "exp">, maxAgeSeconds = 60 * 60 * 8) {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
    }),
  );
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const combined = new Uint8Array(12 + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), 12);

  const body = base64UrlEncode(combined);
  const signature = await sign(body);

  return `${body}.${signature}`;
}

export async function verifySessionToken(token?: string | null, role?: SessionRole) {
  if (!token) {
    return null;
  }

  const [body, signature] = token.split(".");
  if (!body || !signature || (await sign(body)) !== signature) {
    return null;
  }

  try {
    if (isLegacyFormat(body)) {
      const payload = JSON.parse(base64UrlDecode(body)) as SessionPayload;
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now || (role && payload.role !== role)) {
        return null;
      }
      return payload;
    }

    const key = await getEncryptionKey();
    const combined = base64UrlToBuffer(body);
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    const payload = JSON.parse(new TextDecoder().decode(decrypted)) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp < now || (role && payload.role !== role)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentSession(role?: SessionRole) {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const cookieName = role === "admin" ? ADMIN_SESSION_COOKIE : USER_SESSION_COOKIE;

  return verifySessionToken(cookieStore.get(cookieName)?.value, role);
}

export async function getCurrentUserSession() {
  return getCurrentSession("user");
}

export async function getCurrentAdminSession() {
  return getCurrentSession("admin");
}
