import { prisma } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/api";
import { cookies } from "next/headers";
import { getCurrentAdminSession, ADMIN_SESSION_COOKIE, USER_SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { isFulfillmentStatus, isOrderStatus, isPaymentStatus } from "@/lib/order-status";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const userToken = cookieStore.get(USER_SESSION_COOKIE)?.value;
  const adminToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const user = await verifySessionToken(userToken, "user");
  const admin = await verifySessionToken(adminToken, "admin");

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true, variant: true },
        },
        paymentUploads: true,
        customerAccount: true,
      },
    });

    if (!order) {
      return errorResponse("Order not found", 404);
    }

    const ownsOrder =
      !!user &&
      (order.customerId === user.id || order.customerId === user.email);
    if (!admin && !ownsOrder) {
      return errorResponse("Unauthorized", 401);
    }

    return jsonResponse({ order });
  } catch {
    return errorResponse("Failed to fetch order", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cookieStore = await cookies();
  const session = await getCurrentAdminSession();

  if (!session) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const body = await request.json() as {
      status?: string;
      paymentStatus?: string;
      fulfillmentStatus?: string;
      notes?: string;
    };

    const data: Record<string, unknown> = {};
    if (body.status && !isOrderStatus(body.status)) {
      return errorResponse("Invalid order status", 400);
    }
    if (body.paymentStatus && !isPaymentStatus(body.paymentStatus)) {
      return errorResponse("Invalid payment status", 400);
    }
    if (body.fulfillmentStatus && !isFulfillmentStatus(body.fulfillmentStatus)) {
      return errorResponse("Invalid fulfillment status", 400);
    }

    if (body.status) data.status = body.status;
    if (body.paymentStatus) data.paymentStatus = body.paymentStatus;
    if (body.fulfillmentStatus) data.fulfillmentStatus = body.fulfillmentStatus;
    if (body.notes !== undefined) data.notes = body.notes;

    const order = await prisma.order.update({
      where: { id },
      data,
      include: {
        items: {
          include: { product: true, variant: true },
        },
        paymentUploads: true,
      },
    });

    return jsonResponse({ order });
  } catch {
    return errorResponse("Failed to update order", 500);
  }
}
