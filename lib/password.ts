import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";

const SCRYPT_KEYLEN = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 } as const;

function base64UrlEncode(buffer: Buffer) {
  return buffer.toString("base64").replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Buffer.from(padded, "base64");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(password, salt, SCRYPT_KEYLEN, SCRYPT_OPTIONS);
  return `scrypt$${base64UrlEncode(salt)}$${base64UrlEncode(derivedKey)}`;
}

function verifyLegacySha256(password: string, storedHash: string) {
  return createHash("sha256").update(password).digest("hex") === storedHash;
}

export async function verifyPassword(password: string, storedHash: string) {
  if (storedHash.startsWith("scrypt$")) {
    const [, saltPart, hashPart] = storedHash.split("$");
    if (!saltPart || !hashPart) {
      return { valid: false as const };
    }

    const salt = base64UrlDecode(saltPart);
    const expected = base64UrlDecode(hashPart);
    const actual = scryptSync(password, salt, expected.length, SCRYPT_OPTIONS);

    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      return { valid: false as const };
    }

    return { valid: true as const };
  }

  const valid = verifyLegacySha256(password, storedHash);
  if (!valid) {
    return { valid: false as const };
  }

  return {
    valid: true as const,
    upgradedHash: await hashPassword(password),
  };
}

