import { prisma } from "@/lib/db";
import { jsonResponse, errorResponse, getCategoryTree } from "@/lib/api";

export async function GET() {
  try {
    const tree = await getCategoryTree();
    return jsonResponse({ categories: tree });
  } catch {
    return errorResponse("Failed to fetch categories", 500);
  }
}
