import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const createTeamSchema = z.object({
  name: z.string().min(2).max(60),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teams = await prisma.team.findMany({
    where: {
      members: {
        some: { userId: session.user.id },
      },
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      ownerId: true,
      members: {
        where: { userId: session.user.id },
        select: { role: true },
      },
      _count: {
        select: { members: true, projects: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = teams.map((team) => ({
    id: team.id,
    name: team.name,
    createdAt: team.createdAt,
    memberCount: team._count.members,
    projectCount: team._count.projects,
    myRole: team.members[0]?.role ?? null,
  }));

  return NextResponse.json({ teams: result });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const { success } = rateLimit(`team:create:${userId}`, 10, 60 * 60 * 1000);
  if (!success) {
    return NextResponse.json(
      { error: "Too many teams created recently. Try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createTeamSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name } = parsed.data;

  const team = await prisma.$transaction(async (tx) => {
    const newTeam = await tx.team.create({
      data: {
        name,
        ownerId: userId,
      },
    });

    await tx.teamMember.create({
      data: {
        teamId: newTeam.id,
        userId: userId,
        role: "OWNER",
      },
    });

    return newTeam;
  });

  return NextResponse.json({ team }, { status: 201 });
}