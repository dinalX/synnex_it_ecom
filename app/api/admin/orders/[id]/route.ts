import { prisma } from "@/lib/db";
import { jsonResponse, errorResponse, validateBodySize, validateCSRF } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-access";
import { isFulfillmentStatus, isOrderStatus, isPaymentStatus } from "@/lib/order-status";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi("order.update");
  if (!admin) return errorResponse("Unauthorized", 401);
  const csrfCheck = validateCSRF(request);
  if (!csrfCheck.valid) return errorResponse(csrfCheck.error, 403);
  const bodyCheck = validateBodySize(request);
  if (!bodyCheck.valid) return errorResponse(bodyCheck.error, 413);

  const { id } = await params;

  try {
    const body = await request.json() as {
      status?: string;
      paymentStatus?: string;
      fulfillmentStatus?: string;
      notes?: string;
      assignedAdminId?: string;
    };

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return errorResponse("Order not found", 404);

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(body.status && isOrderStatus(body.status) && { status: body.status }),
        ...(body.paymentStatus && isPaymentStatus(body.paymentStatus) && { paymentStatus: body.paymentStatus }),
        ...(body.fulfillmentStatus && isFulfillmentStatus(body.fulfillmentStatus) && { fulfillmentStatus: body.fulfillmentStatus }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.assignedAdminId !== undefined && { assignedAdminId: body.assignedAdminId }),
      },
      include: { items: { include: { product: true } } },
    });

    return jsonResponse({ order });
  } catch {
    return errorResponse("Failed to update order", 500);
  }
}
