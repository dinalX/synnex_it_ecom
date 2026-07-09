import { NextResponse } from "next/server";
import { errorResponse, validateBodySize, validateCSRF } from "@/lib/api";
import { createOrderFromCurrentCart, normalizeCheckoutOrderInput } from "@/lib/order-service";

export async function POST(request: Request) {
  const csrfCheck = validateCSRF(request);
  if (!csrfCheck.valid) return errorResponse(csrfCheck.error, 403);
  const bodyCheck = validateBodySize(request);
  if (!bodyCheck.valid) return errorResponse(bodyCheck.error, 413);

  const form = await request.formData();
  try {
    const order = await createOrderFromCurrentCart(normalizeCheckoutOrderInput(Object.fromEntries(form.entries())));
    return NextResponse.redirect(new URL(`/checkout/thank-you?orderId=${encodeURIComponent(order.id)}`, request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.redirect(new URL(`/checkout?error=${encodeURIComponent(message)}`, request.url), 303);
  }
}
