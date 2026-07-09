import { prisma } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  try {
    if (slug) {
      const job = await prisma.jobPost.findUnique({ where: { slug } });
      if (!job) return errorResponse("Job not found", 404);
      return jsonResponse({ job });
    }

    const jobs = await prisma.jobPost.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
    });
    return jsonResponse({ jobs });
  } catch {
    return errorResponse("Failed to fetch jobs", 500);
  }
}
