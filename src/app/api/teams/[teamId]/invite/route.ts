import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { teamId } = await params;

  const { success } = rateLimit(`team:invite:${userId}`, 20, 60 * 60 * 1000);
  if (!success) {
    return NextResponse.json(
      { error: "Too many invites sent recently. Try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, role } = parsed.data;

  try {
    await requireRole(userId, teamId, "ADMIN");

    const invitedUser = await prisma.user.findUnique({ where: { email } });

    if (!invitedUser) {
      return NextResponse.json(
        { error: "No account found with this email. They need to sign up first." },
        { status: 404 }
      );
    }

    const existingMembership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: invitedUser.id } },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "This user is already a member of the team" },
        { status: 400 }
      );
    }

    const membership = await prisma.teamMember.create({
      data: { teamId, userId: invitedUser.id, role },
      select: {
        role: true,
        joinedAt: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    await prisma.notification.create({
      data: {
        userId: invitedUser.id,
        type: "INVITE",
        message: `You were added to a team`,
      },
    });

    return NextResponse.json({ membership }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}