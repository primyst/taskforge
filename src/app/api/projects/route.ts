import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireTeamMember, requireRole } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";

const createProjectSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  teamId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = req.nextUrl.searchParams.get("teamId");
  if (!teamId) {
    return NextResponse.json({ error: "teamId is required" }, { status: 400 });
  }

  try {
    await requireTeamMember(session.user.id, teamId);

    const projects = await prisma.project.findMany({
      where: { teamId },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        createdBy: { select: { id: true, name: true, image: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = rateLimit(`project:create:${session.user.id}`, 30, 60 * 60 * 1000);
  if (!success) {
    return NextResponse.json(
      { error: "Too many projects created recently. Try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, description, teamId } = parsed.data;

  try {
    // Per the planned permission matrix: only ADMIN/OWNER can create projects
    await requireRole(session.user.id, teamId, "ADMIN");

    const project = await prisma.project.create({
      data: {
        name,
        description,
        teamId,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}