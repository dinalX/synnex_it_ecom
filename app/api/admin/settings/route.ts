import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse, validateBodySize, validateCSRF } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-access";

export async function GET() {
  const admin = await requireAdminApi();
  if (!admin) return errorResponse("Unauthorized", 401);

  try {
    const settings = await prisma.siteSetting.findMany({
      orderBy: [{ group: "asc" }, { key: "asc" }],
    });

    return NextResponse.json({ settings, databaseReady: true });
  } catch {
    return NextResponse.json({ settings: [], databaseReady: false });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) return errorResponse("Unauthorized", 401);
  const csrfCheck = validateCSRF(request);
  if (!csrfCheck.valid) return errorResponse(csrfCheck.error, 403);
  const bodyCheck = validateBodySize(request);
  if (!bodyCheck.valid) return errorResponse(bodyCheck.error, 413);

  const form = await request.json() as { key?: string; value?: string; group?: string };

  if (!form.key || typeof form.value !== "string") {
    return NextResponse.json({ error: "key and value are required" }, { status: 400 });
  }

  try {
    const setting = await prisma.siteSetting.upsert({
      where: { key: form.key },
      update: { value: form.value, group: form.group || "general" },
      create: { key: form.key, value: form.value, group: form.group || "general" },
    });

    return NextResponse.json({ setting, databaseReady: true });
  } catch {
    return NextResponse.json(
      { error: "Database is not ready. Run npm run db:push.", databaseReady: false },
      { status: 503 },
    );
  }
}
