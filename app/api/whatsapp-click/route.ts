import { prisma } from "@/lib/db";
import { jsonResponse, errorResponse, validateBodySize } from "@/lib/api";
import { isWhatsappClickKind, isWhatsappClickService } from "@/lib/whatsapp-click";

export async function POST(request: Request) {
  const sizeCheck = validateBodySize(request);
  if (!sizeCheck.valid) return errorResponse(sizeCheck.error, 413);

  let body: { kind?: string; service?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { kind, service } = body;
  if (!kind || !isWhatsappClickKind(kind) || !service || !isWhatsappClickService(service)) {
    return errorResponse("Invalid kind or service");
  }

  await prisma.whatsappClick.create({ data: { kind, service } });

  return jsonResponse({ success: true }, 201);
}
