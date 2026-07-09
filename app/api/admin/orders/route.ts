import { prisma } from "@/lib/db";
import { jsonResponse, errorResponse, getSearchParams, getPagination } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-access";

export async function GET(request: Request) {
  const admin = await requireAdminApi("order.view");
  if (!admin) return errorResponse("Unauthorized", 401);

  const url = new URL(request.url);
  const { page, limit, status } = getSearchParams(url);
  const { skip, take } = getPagination(page, limit);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

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
