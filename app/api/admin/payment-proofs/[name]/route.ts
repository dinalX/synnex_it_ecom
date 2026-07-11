import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { errorResponse } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-access";
import { PAYMENT_PROOFS_DIR, PROOF_MIME_TYPES } from "@/lib/uploads";

// Stored names are always "<uuid>.<known extension>" — anything else
// (path traversal, arbitrary names) is rejected outright.
const STORED_NAME_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|gif|avif|pdf)$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const admin = await requireAdminApi("order.paymentUpload.review");
  if (!admin) return errorResponse("Unauthorized", 401);

  const { name } = await params;
  const match = name.match(STORED_NAME_PATTERN);
  if (!match) return errorResponse("Not found", 404);

  let body: Buffer;
  try {
    body = await readFile(join(PAYMENT_PROOFS_DIR, name));
  } catch {
    return errorResponse("Not found", 404);
  }

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": PROOF_MIME_TYPES[match[1]],
      "Content-Disposition": `inline; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
