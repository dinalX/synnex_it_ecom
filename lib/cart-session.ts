import { cookies } from "next/headers";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export const CART_SESSION_COOKIE = "cart_session";

export const activeCartInclude = {
  items: {
    include: { product: true, variant: true },
    orderBy: { createdAt: "desc" },
  },
} satisfies Prisma.CartInclude;

export type ActiveCart = Prisma.CartGetPayload<{ include: typeof activeCartInclude }>;

export function generateCartSessionId() {
  return `sess_${crypto.randomUUID().replaceAll("-", "").substring(0, 16)}`;
}

export function calculateCartSubtotal(cart: Pick<ActiveCart, "items">) {
  return cart.items.reduce((sum, item) => sum + item.lineTotal, 0);
}

export async function getCurrentCartSessionId() {
  const cookieStore = await cookies();
  return cookieStore.get(CART_SESSION_COOKIE)?.value ?? null;
}

export async function findActiveCartBySessionId(sessionId: string) {
  const cart = await prisma.cart.findUnique({
    where: { sessionId },
    include: activeCartInclude,
  });

  if (!cart || cart.status !== "Active") {
    return null;
  }

  return cart;
}

export async function getCurrentActiveCart() {
  const sessionId = await getCurrentCartSessionId();
  if (!sessionId) {
    return null;
  }

  return findActiveCartBySessionId(sessionId);
}
