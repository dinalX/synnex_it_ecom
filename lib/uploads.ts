/**
 * Helpers for validating and naming uploaded/downloaded product images.
 * Format is determined from magic bytes, never from the client-supplied
 * filename or content-type.
 */

export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

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
