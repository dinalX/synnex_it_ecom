import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";

import { getCurrentUserSession } from "@/lib/auth";
import { calculateCartSubtotal, CART_SESSION_COOKIE, getCurrentActiveCart } from "@/lib/cart-session";
import { prisma } from "@/lib/db";
import { notifyAdmins, LOW_STOCK_THRESHOLD } from "@/lib/notification-service";

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
  customerNote?: string;
  /** Slip stored by the API route; storedUrl is the admin-gated serving path. */
  file: {
    originalName: string;
    storedUrl: string;
    mimeType: string;
    size: number;
  };
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

export function normalizePaymentUploadFields(
  input: Record<string, FormDataEntryValue | string | undefined>,
): Omit<PaymentUploadInput, "file"> {
  const amountValue = String(input.amount || "").trim();

  return {
    reference: String(input.reference || "").trim() || undefined,
    amount: amountValue ? Number(amountValue) : undefined,
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

  const lowStockCrossings: { productId: string; productName: string; afterQty: number }[] = [];

  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
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

    for (const [index, item] of cart.items.entries()) {
      const orderItemId = createdOrder.items[index]?.id;

      if (item.variantId && item.variant) {
        const beforeQty = item.variant.inventory;
        const afterQty = beforeQty - item.quantity;
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { inventory: afterQty },
        });
        await tx.inventoryTransaction.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            orderId: createdOrder.id,
            orderItemId,
            type: "OrderReserve",
            quantity: -item.quantity,
            beforeQty,
            afterQty,
          },
        });
        if (beforeQty >= LOW_STOCK_THRESHOLD && afterQty < LOW_STOCK_THRESHOLD) {
          lowStockCrossings.push({ productId: item.productId, productName: item.product.name, afterQty });
        }
      } else {
        const beforeQty = item.product.inventory;
        const afterQty = beforeQty - item.quantity;
        await tx.product.update({
          where: { id: item.productId },
          data: { inventory: afterQty },
        });
        await tx.inventoryTransaction.create({
          data: {
            productId: item.productId,
            orderId: createdOrder.id,
            orderItemId,
            type: "OrderReserve",
            quantity: -item.quantity,
            beforeQty,
            afterQty,
          },
        });
        if (beforeQty >= LOW_STOCK_THRESHOLD && afterQty < LOW_STOCK_THRESHOLD) {
          lowStockCrossings.push({ productId: item.productId, productName: item.product.name, afterQty });
        }
      }
    }

    await tx.cart.update({
      where: { id: cart.id },
      data: { status: "Converted", subtotal },
    });
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return createdOrder;
  });

  try {
    await notifyAdmins({
      type: "order.new",
      title: `New order ${order.orderNumber}`,
      body: `${order.customer} — LKR ${order.total.toLocaleString()}`,
      href: `/admin/orders/${order.id}`,
    });
    for (const crossing of lowStockCrossings) {
      await notifyAdmins({
        type: "stock.low",
        title: `Low stock: ${crossing.productName}`,
        body: `${crossing.afterQty} left`,
        href: `/admin/products/${crossing.productId}`,
      });
    }
  } catch (e) {
    console.error("Failed to send admin notifications for order", order.id, e);
  }

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

export async function createPaymentUpload(orderId: string, input: PaymentUploadInput) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error("Order not found");
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
      fileName: input.file.originalName,
      fileUrl: input.file.storedUrl,
      fileMimeType: input.file.mimeType,
      fileSize: input.file.size,
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
