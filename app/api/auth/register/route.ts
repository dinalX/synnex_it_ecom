import { prisma } from "@/lib/db";
import { jsonResponse, errorResponse, validateBodySize, validateCSRF } from "@/lib/api";
import { hashPassword } from "@/lib/password";

export async function POST(request: Request) {
  const csrfCheck = validateCSRF(request);
  if (!csrfCheck.valid) return errorResponse(csrfCheck.error, 403);
  const bodyCheck = validateBodySize(request);
  if (!bodyCheck.valid) return errorResponse(bodyCheck.error, 413);

  try {
    const body = await request.json() as {
      email: string;
      name: string;
      phone?: string;
      password: string;
    };

    const email = body.email.trim().toLowerCase();
    const name = body.name.trim();
    const phone = body.phone?.trim() || null;

    if (!email || !name || !body.password) {
      return errorResponse("email, name, and password are required");
    }

    if (body.password.length < 6) {
      return errorResponse("Password must be at least 6 characters");
    }

    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) return errorResponse("Email already registered", 409);

    const passwordHash = await hashPassword(body.password);

    const customer = await prisma.customer.create({
      data: {
        email,
        name,
        phone,
        passwordHash,
      },
    });

    return jsonResponse({
      customer: { id: customer.id, email: customer.email, name: customer.name },
    }, 201);
  } catch {
    return errorResponse("Failed to register", 500);
  }
}
