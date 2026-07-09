import { NextResponse } from "next/server";

import { errorResponse, validateBodySize, validateCSRF } from "@/lib/api";
import { createPaymentUpload, normalizePaymentUploadInput } from "@/lib/order-service";

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
    await createPaymentUpload(id, normalizePaymentUploadInput(Object.fromEntries(form.entries())));

    return NextResponse.redirect(new URL(`/checkout/thank-you?orderId=${encodeURIComponent(id)}&paymentUpload=success`, request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save payment proof";
    return NextResponse.redirect(new URL(`/checkout/thank-you?orderId=${encodeURIComponent(id)}&paymentUpload=${encodeURIComponent(message)}`, request.url), 303);
  }
}
