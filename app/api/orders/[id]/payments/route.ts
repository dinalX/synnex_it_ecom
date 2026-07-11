import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { NextResponse } from "next/server";

import { errorResponse, validateBodySize, validateCSRF } from "@/lib/api";
import { createPaymentUpload, normalizePaymentUploadFields } from "@/lib/order-service";
import {
  MAX_IMAGE_UPLOAD_BYTES,
  PAYMENT_PROOFS_DIR,
  PROOF_MIME_TYPES,
  sniffProofExtension,
} from "@/lib/uploads";

function redirectBack(request: Request, orderId: string, status: string) {
  return NextResponse.redirect(
    new URL(
      `/checkout/thank-you?orderId=${encodeURIComponent(orderId)}&paymentUpload=${encodeURIComponent(status)}`,
      request.url,
    ),
    303,
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrfCheck = validateCSRF(request);
  if (!csrfCheck.valid) return errorResponse(csrfCheck.error, 403);
  const bodyCheck = validateBodySize(request);
  if (!bodyCheck.valid) return errorResponse(bodyCheck.error, 413);

  const { id } = await params;

  try {
    const form = await request.formData();

    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return redirectBack(request, id, "Please attach your bank slip (image or PDF).");
    }
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      return redirectBack(request, id, "Slip must be 5MB or smaller.");
    }

    const body = Buffer.from(await file.arrayBuffer());
    const extension = sniffProofExtension(body);
    if (!extension) {
      return redirectBack(request, id, "Slip must be a JPG, PNG, WebP, GIF, AVIF, or PDF file.");
    }

    const storedName = `${randomUUID()}.${extension}`;
    await mkdir(PAYMENT_PROOFS_DIR, { recursive: true });
    await writeFile(join(PAYMENT_PROOFS_DIR, storedName), body);

    await createPaymentUpload(id, {
      ...normalizePaymentUploadFields(Object.fromEntries(form.entries())),
      file: {
        originalName: file.name || storedName,
        storedUrl: `/api/admin/payment-proofs/${storedName}`,
        mimeType: PROOF_MIME_TYPES[extension],
        size: body.byteLength,
      },
    });

    return redirectBack(request, id, "success");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save payment proof";
    return redirectBack(request, id, message);
  }
}
