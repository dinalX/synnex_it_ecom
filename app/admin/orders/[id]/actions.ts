"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminAction } from "@/lib/admin-access";
import {
  isFulfillmentStatus,
  isOrderStatus,
  isPaymentUploadStatus,
  isPaymentStatus,
} from "@/lib/order-status";

export async function updateOrder(orderId: string, formData: FormData) {
  await requireAdminAction();

  const data: Record<string, unknown> = {};
  const status = formData.get("status");
  const paymentStatus = formData.get("paymentStatus");
  const fulfillmentStatus = formData.get("fulfillmentStatus");
  const notes = formData.get("notes");

  if (typeof status === "string" && status) {
    if (!isOrderStatus(status)) {
      throw new Error(`Invalid status: ${status}`);
    }
    data.status = status;
  }
  if (typeof paymentStatus === "string" && paymentStatus) {
    if (!isPaymentStatus(paymentStatus)) {
      throw new Error(`Invalid payment status: ${paymentStatus}`);
    }
    data.paymentStatus = paymentStatus;
  }
  if (typeof fulfillmentStatus === "string" && fulfillmentStatus) {
    if (!isFulfillmentStatus(fulfillmentStatus)) {
      throw new Error(`Invalid fulfillment status: ${fulfillmentStatus}`);
    }
    data.fulfillmentStatus = fulfillmentStatus;
  }
  if (typeof notes === "string") data.notes = notes;

  await prisma.order.update({
    where: { id: orderId },
    data,
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

export async function reviewPaymentUpload(orderId: string, uploadId: string, formData: FormData) {
  const admin = await requireAdminAction();
  const status = String(formData.get("status") || "").trim();
  const adminNote = String(formData.get("adminNote") || "").trim();

  if (!isPaymentUploadStatus(status)) {
    throw new Error(`Invalid payment review status: ${status}`);
  }

  const paymentStatus = status === "Verified"
    ? "Paid"
    : status === "Rejected"
      ? "Rejected"
      : "PendingReview";

  await prisma.$transaction([
    prisma.paymentUpload.update({
      where: { id: uploadId },
      data: {
        status,
        adminNote: adminNote || null,
        verifiedAt: status === "PendingReview" ? null : new Date(),
        verifiedById: status === "PendingReview" ? null : admin.id,
      },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus },
    }),
  ]);

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}
