import { prisma } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";

  try {
    const downloads = await prisma.driverDownload.findMany({
      where: {
        published: true,
        ...(search && {
          OR: [
            { title: { contains: search } },
            { deviceType: { contains: search } },
          ],
        }),
      },
      orderBy: { updatedAt: "desc" },
    });
    return jsonResponse({ downloads });
  } catch {
    return errorResponse("Failed to fetch downloads", 500);
  }
}
