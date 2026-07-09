import { prisma } from "@/lib/db";
import { jsonResponse, errorResponse, validateBodySize, validateCSRF } from "@/lib/api";
import {
  activeCartInclude,
  calculateCartSubtotal,
  getCurrentCartSessionId,
} from "@/lib/cart-session";

export async function PATCH(request: Request) {
  const csrfCheck = validateCSRF(request);
  if (!csrfCheck.valid) return errorResponse(csrfCheck.error, 403);
  const bodyCheck = validateBodySize(request);
  if (!bodyCheck.valid) return errorResponse(bodyCheck.error, 413);

  try {
    const body = await request.json() as { itemId: string; quantity: number };

    if (!body.itemId || body.quantity < 1) {
      return errorResponse("itemId and quantity >= 1 are required");
    }

    const sessionId = await getCurrentCartSessionId();

    if (!sessionId) return errorResponse("No cart session", 404);

    const cart = await prisma.cart.findUnique({ where: { sessionId } });
    if (!cart) return errorResponse("Cart not found", 404);

    const item = await prisma.cartItem.findFirst({
      where: { id: body.itemId, cartId: cart.id },
    });
    if (!item) return errorResponse("Cart item not found", 404);

    await prisma.cartItem.update({
      where: { id: body.itemId },
      data: { quantity: body.quantity, lineTotal: item.unitPrice * body.quantity },
    });

    const items = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: activeCartInclude.items.include,
    });
    const subtotal = calculateCartSubtotal({ items });
    await prisma.cart.update({ where: { id: cart.id }, data: { subtotal } });

    return jsonResponse({ cart: { ...cart, items, subtotal } });
  } catch {
    return errorResponse("Failed to update cart item", 500);
  }
}

export async function DELETE(request: Request) {
  const csrfCheck = validateCSRF(request);
  if (!csrfCheck.valid) return errorResponse(csrfCheck.error, 403);
  const bodyCheck = validateBodySize(request);
  if (!bodyCheck.valid) return errorResponse(bodyCheck.error, 413);

  try {
    const body = await request.json() as { itemId: string };

    if (!body.itemId) return errorResponse("itemId is required");

    const sessionId = await getCurrentCartSessionId();

    if (!sessionId) return errorResponse("No cart session", 404);

    const cart = await prisma.cart.findUnique({ where: { sessionId } });
    if (!cart) return errorResponse("Cart not found", 404);

    await prisma.cartItem.deleteMany({
      where: { id: body.itemId, cartId: cart.id },
    });

    const items = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: activeCartInclude.items.include,
    });
    const subtotal = calculateCartSubtotal({ items });
    await prisma.cart.update({ where: { id: cart.id }, data: { subtotal } });

    return jsonResponse({ cart: { ...cart, items, subtotal } });
  } catch {
    return errorResponse("Failed to remove cart item", 500);
  }
}
