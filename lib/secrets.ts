/**
 * AES-256-GCM encryption for admin-entered secrets stored in the database
 * (Meta CAPI access token today; payment gateway credentials later).
 *
 * Mirrors lib/auth.ts's key-derivation approach (SHA-256 of AUTH_SECRET plus
 * a salt) but with its own salt string, so session-token key material and
 * stored-secret key material stay domain-separated. GCM's auth tag already
 * detects tampering, so no extra HMAC layer is needed here.
 */

const ENCRYPTION_KEY_SALT = "synnex-secret-store-v1";

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is required");
  }
  return secret;
}

async function getEncryptionKey(): Promise<CryptoKey> {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(getAuthSecret() + ENCRYPTION_KEY_SALT),
  );
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptSecret(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  const combined = new Uint8Array(12 + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), 12);
  return Buffer.from(combined).toString("base64url");
}

/** Returns null when the ciphertext is malformed or was encrypted under a different AUTH_SECRET. */
export async function decryptSecret(encoded: string): Promise<string | null> {
  try {
    const combined = Buffer.from(encoded, "base64url");
    if (combined.byteLength <= 12) return null;
    const key = await getEncryptionKey();
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: combined.subarray(0, 12) },
      key,
      combined.subarray(12),
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
}
