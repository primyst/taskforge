import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole, requireTeamMember } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";

const updateTeamSchema = z.object({
  name: z.string().min(2).max(60),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId } = await params;

  try {
    await requireTeamMember(session.user.id, teamId);

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          select: {
            role: true,
            joinedAt: true,
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        _count: { select: { projects: true } },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({ team });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId } = await params;

  const body = await req.json().catch(() => null);
  const parsed = updateTeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    await requireRole(session.user.id, teamId, "ADMIN");

    const team = await prisma.team.update({
      where: { id: teamId },
      data: { name: parsed.data.name },
    });

    return NextResponse.json({ team });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId } = await params;

  try {
    await requireRole(session.user.id, teamId, "OWNER");

    await prisma.team.delete({ where: { id: teamId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}