import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72), // bcrypt truncates beyond 72 bytes
});

export async function POST(req: NextRequest) {
  // Rate limit by IP to slow down mass account creation
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000); // 5/hour
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Vague message — don't confirm/deny account existence to an attacker
    return NextResponse.json(
      { error: "Unable to create account with these details" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  // TODO (next step): send verification email via Nodemailer + Gmail SMTP

  return NextResponse.json({ user }, { status: 201 });
}
