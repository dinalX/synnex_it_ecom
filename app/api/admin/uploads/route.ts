import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { errorResponse, jsonResponse, validateCSRF } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-access";
import { MAX_IMAGE_UPLOAD_BYTES, sniffImageExtension } from "@/lib/uploads";
import { UPLOADS_DIR_URL } from "@/prisma/feed-images";

export async function POST(request: Request) {
  // Uploads happen from both the create and edit product flows, so either
  // permission is sufficient.
  const admin =
    (await requireAdminApi("product.create")) ?? (await requireAdminApi("product.update"));
  if (!admin) return errorResponse("Unauthorized", 401);

  const csrfCheck = validateCSRF(request);
  if (!csrfCheck.valid) return errorResponse(csrfCheck.error, 403);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse("Expected multipart/form-data", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) return errorResponse("Missing file field", 400);
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return errorResponse("Image must be 5MB or smaller", 413);
  }

  const body = Buffer.from(await file.arrayBuffer());
  const extension = sniffImageExtension(body);
  if (!extension) {
    return errorResponse("File is not a supported image (jpg, png, webp, gif, avif)", 415);
  }

  const fileName = `${randomUUID()}.${extension}`;
  const dir = join(process.cwd(), "public", UPLOADS_DIR_URL);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, fileName), body);

  return jsonResponse({ url: `/${UPLOADS_DIR_URL}/${fileName}` });
}
