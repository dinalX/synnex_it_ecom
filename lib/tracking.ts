import { createHash } from "crypto";

export function hashForMeta(value?: string | null) {
  if (!value) {
    return undefined;
  }

  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function buildEventId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
