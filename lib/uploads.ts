/**
 * Helpers for validating and naming uploaded/downloaded product images.
 * Format is determined from magic bytes, never from the client-supplied
 * filename or content-type.
 */
import { join } from "node:path";

export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Payment slips carry bank details, so they live OUTSIDE public/ and are
 * only reachable through the admin-gated /api/admin/payment-proofs route.
 */
export const PAYMENT_PROOFS_DIR = join(process.cwd(), "private-uploads", "payment-proofs");

export function sniffImageExtension(body: Buffer): string | null {
  if (body.length < 12) return null;
  if (body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff) return "jpg";
  if (body[0] === 0x89 && body.subarray(1, 4).toString("ascii") === "PNG") return "png";
  if (
    body.subarray(0, 4).toString("ascii") === "RIFF" &&
    body.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }
  if (body.subarray(0, 4).toString("ascii") === "GIF8") return "gif";
  if (body.subarray(4, 12).toString("ascii").startsWith("ftyp")) return "avif";
  return null;
}

/** Payment slips may be photos or PDFs. */
export function sniffProofExtension(body: Buffer): string | null {
  const image = sniffImageExtension(body);
  if (image) return image;
  if (body.length >= 5 && body.subarray(0, 5).toString("ascii") === "%PDF-") return "pdf";
  return null;
}

export const PROOF_MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  pdf: "application/pdf",
};
