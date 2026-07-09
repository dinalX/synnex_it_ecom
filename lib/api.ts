import { prisma } from "@/lib/db";

const MAX_BODY_SIZE = 10 * 1024 * 1024;

export function jsonResponse<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

export function errorResponse(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

export function getSearchParams(url: URL) {
  return {
    page: Number(url.searchParams.get("page")) || 1,
    limit: Math.min(Number(url.searchParams.get("limit")) || 20, 100),
    search: url.searchParams.get("search") || "",
    category: url.searchParams.get("category") || "",
    subcategory: url.searchParams.get("subcategory") || "",
    sort: url.searchParams.get("sort") || "newest",
    status: url.searchParams.get("status") || "",
  };
}

export function getPagination(page: number, limit: number) {
  return { skip: (page - 1) * limit, take: limit };
}

export async function getCategoryTree() {
  const categories = await prisma.productCategory.findMany({
    where: { published: true, parentId: null },
    include: {
      children: {
        where: { published: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });
  return categories;
}

export function validateBodySize(request: Request): { valid: true } | { valid: false; error: string } {
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return { valid: false, error: `Request body exceeds maximum size of ${MAX_BODY_SIZE / 1024 / 1024}MB` };
  }
  return { valid: true };
}

export function validateCSRF(request: Request): { valid: true } | { valid: false; error: string } {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        return { valid: false, error: "Cross-origin request denied" };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: "Invalid origin header" };
    }
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host !== host) {
        return { valid: false, error: "Cross-origin request denied" };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: "Invalid referer header" };
    }
  }

  return { valid: true };
}
