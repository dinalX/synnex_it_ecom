import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";

import { getCurrentUserSession } from "@/lib/auth";
import { calculateCartSubtotal, CART_SESSION_COOKIE, getCurrentActiveCart } from "@/lib/cart-session";
import { prisma } from "@/lib/db";

export type CheckoutOrderInput = {
  customer: string;
  email: string;
  phone: string;
  shippingAddress?: string;
  billingAddress?: string;
  notes?: string;
  paymentMode?: string;
};

export type PaymentUploadInput = {
  reference?: string;
  amount?: number;
  proofUrl: string;
  customerNote?: string;
};

const PAYMENT_MODE_LABELS = {
  "bank-transfer": "Bank Transfer",
  "cash-on-delivery": "Cash on Delivery",
  quotation: "Quotation",
} as const;

function generateOrderNumber() {
  return `ORD-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().substring(0, 4).toUpperCase()}`;
}

function normalizePaymentMode(value?: string) {
  if (!value) {
    return PAYMENT_MODE_LABELS["bank-transfer"];
  }

  const paymentMode = PAYMENT_MODE_LABELS[value as keyof typeof PAYMENT_MODE_LABELS];
  return paymentMode || PAYMENT_MODE_LABELS["bank-transfer"];
}

export function normalizeCheckoutOrderInput(input: Record<string, FormDataEntryValue | string | undefined>): CheckoutOrderInput {
  return {
    customer: String(input.customer || "").trim(),
    email: String(input.email || "").trim(),
    phone: String(input.phone || "").trim(),
    shippingAddress: String(input.shippingAddress || "").trim() || undefined,
    billingAddress: String(input.billingAddress || "").trim() || undefined,
    notes: String(input.notes || "").trim() || undefined,
    paymentMode: String(input.paymentMode || "").trim() || undefined,
  };
}

export function normalizePaymentUploadInput(input: Record<string, FormDataEntryValue | string | undefined>): PaymentUploadInput {
  const amountValue = String(input.amount || "").trim();

  return {
    reference: String(input.reference || "").trim() || undefined,
    amount: amountValue ? Number(amountValue) : undefined,
    proofUrl: String(input.proofUrl || "").trim(),
    customerNote: String(input.customerNote || "").trim() || undefined,
  };
}

export async function createOrderFromCurrentCart(input: CheckoutOrderInput) {
  if (!input.customer || !input.email || !input.phone) {
    throw new Error("customer, email, and phone are required");
  }

  const cart = await getCurrentActiveCart();
  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  const user = await getCurrentUserSession();
  const customerRecord = user
    ? (user.id
      ? await prisma.customer.findUnique({ where: { id: user.id } })
      : null) || await prisma.customer.findUnique({ where: { email: user.email } })
    : null;
  const customerId = customerRecord?.id || user?.id || null;
  const subtotal = calculateCartSubtotal(cart);
  const orderNumber = generateOrderNumber();
  const paymentMode = normalizePaymentMode(input.paymentMode);

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId,
      customer: input.customer,
      email: input.email,
      phone: input.phone,
      paymentMode,
      paymentStatus: paymentMode === PAYMENT_MODE_LABELS["cash-on-delivery"] ? "PendingReview" : "AwaitingUpload",
      subtotal,
      total: subtotal,
      shippingAddress: input.shippingAddress,
      billingAddress: input.billingAddress,
      notes: input.notes,
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          sku: item.variant?.sku || item.product.sku,
          name: item.variant?.name || item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          productData: JSON.stringify({
            slug: item.product.slug,
            image: item.product.image,
            accent: item.product.accent,
          }),
        })),
      },
    },
    include: {
      items: true,
      paymentUploads: true,
    },
  });

  await prisma.$transaction([
    prisma.cart.update({
      where: { id: cart.id },
      data: { status: "Converted", subtotal },
    }),
    prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
  ]);

  const cookieStore = await cookies();
  cookieStore.set(CART_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return order;
}

function normalizeProofUrl(value: string) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export async function createPaymentUpload(orderId: string, input: PaymentUploadInput) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error("Order not found");
  }

  const proofUrl = normalizeProofUrl(input.proofUrl);
  if (!proofUrl) {
    throw new Error("A valid payment proof URL is required");
  }

  const customer = await getCurrentUserSession();
  const amount = typeof input.amount === "number" && Number.isFinite(input.amount)
    ? Math.round(input.amount)
    : undefined;

  const upload = await prisma.paymentUpload.create({
    data: {
      orderId,
      customerId: customer?.id || null,
      method: order.paymentMode,
      status: "PendingReview",
      reference: input.reference,
      amount,
      fileName: input.reference || `payment-proof-${order.orderNumber}`,
      fileUrl: proofUrl,
      fileMimeType: "text/uri-list",
      customerNote: input.customerNote,
    },
  });

  if (order.paymentStatus === "AwaitingUpload") {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PendingReview" },
    });
  }

  return upload;
}

export function isPrismaUniqueError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
