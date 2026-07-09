import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse, validateBodySize, validateCSRF } from "@/lib/api";
import {
  activeCartInclude,
  calculateCartSubtotal,
  CART_SESSION_COOKIE,
  findActiveCartBySessionId,
  generateCartSessionId,
  getCurrentCartSessionId,
} from "@/lib/cart-session";

async function getOrCreateCart(sessionId?: string | null) {
  const existingSessionId = sessionId || await getCurrentCartSessionId();

  if (existingSessionId) {
    const cart = await findActiveCartBySessionId(existingSessionId);
    if (cart) return { cart, sessionId: existingSessionId };
  }

  const newSessionId = generateCartSessionId();
  const cart = await prisma.cart.create({
    data: { sessionId: newSessionId },
    include: activeCartInclude,
  });
  return { cart, sessionId: newSessionId };
}

function cartResponse(cart: Record<string, unknown>, sessionId: string) {
  const response = NextResponse.json({ cart, sessionId });
  response.cookies.set(CART_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function GET() {
  try {
    const { cart, sessionId } = await getOrCreateCart();
    return cartResponse(cart as unknown as Record<string, unknown>, sessionId);
  } catch {
    return errorResponse("Failed to fetch cart", 500);
  }
}

export async function POST(request: Request) {
  const csrfCheck = validateCSRF(request);
  if (!csrfCheck.valid) return errorResponse(csrfCheck.error, 403);
  const bodyCheck = validateBodySize(request);
  if (!bodyCheck.valid) return errorResponse(bodyCheck.error, 413);

  try {
    const body = await request.json() as {
      productId: string;
      variantId?: string;
      quantity?: number;
    };

    if (!body.productId) return errorResponse("productId is required");

    const product = await prisma.product.findUnique({ where: { id: body.productId } });
    if (!product) return errorResponse("Product not found", 404);

    const variant = body.variantId
      ? await prisma.productVariant.findUnique({ where: { id: body.variantId } })
      : null;

    const quantity = body.quantity || 1;
    const unitPrice = variant ? variant.price : product.price;
    const lineTotal = unitPrice * quantity;

    const { cart, sessionId } = await getOrCreateCart();

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: body.productId,
        variantId: body.variantId || null,
      },
    });

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty, lineTotal: unitPrice * newQty },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: body.productId,
          variantId: body.variantId || null,
          quantity,
          unitPrice,
          lineTotal,
        },
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: activeCartInclude,
    });

    const subtotal = updatedCart ? calculateCartSubtotal(updatedCart) : 0;
    await prisma.cart.update({ where: { id: cart.id }, data: { subtotal } });

    return cartResponse(updatedCart as unknown as Record<string, unknown>, sessionId);
  } catch {
    return errorResponse("Failed to add item to cart", 500);
  }
}
