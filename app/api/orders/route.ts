import { prisma } from "@/lib/db";
import { jsonResponse, errorResponse, getSearchParams, getPagination, validateBodySize, validateCSRF } from "@/lib/api";
import { cookies } from "next/headers";
import { getCurrentAdminSession, getCurrentUserSession, USER_SESSION_COOKIE, ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { createOrderFromCurrentCart, normalizeCheckoutOrderInput } from "@/lib/order-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { page, limit, status } = getSearchParams(url);
  const { skip, take } = getPagination(page, limit);

  const cookieStore = await cookies();
  const userToken = cookieStore.get(USER_SESSION_COOKIE)?.value;
  const adminToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const user = await verifySessionToken(userToken, "user");
  const admin = await verifySessionToken(adminToken, "admin");

  if (!user && !admin) {
    return errorResponse("Authentication required", 401);
  }

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (user && !admin) {
    where.OR = [
      ...(user.id ? [{ customerId: user.id }] : []),
      { customerId: user.email },
    ];
  }

  try {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: { include: { product: true } } },
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where }),
    ]);

    return jsonResponse({
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return errorResponse("Failed to fetch orders", 500);
  }
}

export async function POST(request: Request) {
  const csrfCheck = validateCSRF(request);
  if (!csrfCheck.valid) return errorResponse(csrfCheck.error, 403);
  const bodyCheck = validateBodySize(request);
  if (!bodyCheck.valid) return errorResponse(bodyCheck.error, 413);

  try {
    const contentType = request.headers.get("content-type") || "";
    const rawInput = contentType.includes("application/json")
      ? await request.json() as Record<string, string>
      : Object.fromEntries((await request.formData()).entries()) as Record<string, string>;

    const order = await createOrderFromCurrentCart(normalizeCheckoutOrderInput(rawInput));

    if (contentType.includes("application/json")) {
      return jsonResponse({ order }, 201);
    }

    return Response.redirect(new URL(`/checkout/thank-you?orderId=${encodeURIComponent(order.id)}`, request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create order";
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return Response.redirect(new URL(`/checkout?error=${encodeURIComponent(message)}`, request.url), 303);
    }
    return errorResponse(message, message === "Cart is empty" ? 400 : 500);
  }
}
