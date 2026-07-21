import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

/**
 * Returns the TeamMember row if the user belongs to the team, else null.
 * Every route touching team-scoped data should call this first.
 */
export async function getTeamMembership(userId: string, teamId: string) {
  return prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
}

/**
 * Throws-free check: returns true/false. Use when you want to branch,
 * not immediately reject the request.
 */
export async function isTeamMember(userId: string, teamId: string) {
  const membership = await getTeamMembership(userId, teamId);
  return !!membership;
}

/**
 * Enforces membership. Call at the top of any route handler that
 * receives a teamId. Returns the membership row on success.
 */
export async function requireTeamMember(userId: string, teamId: string) {
  const membership = await getTeamMembership(userId, teamId);
  if (!membership) {
    throw new RbacError("Not a member of this team", 403);
  }
  return membership;
}

/**
 * Enforces membership AND a minimum role. Role hierarchy:
 * OWNER > ADMIN > MEMBER.
 */
export async function requireRole(
  userId: string,
  teamId: string,
  minRole: Role
) {
  const membership = await requireTeamMember(userId, teamId);

  const hierarchy: Record<Role, number> = {
    OWNER: 3,
    ADMIN: 2,
    MEMBER: 1,
  };

  if (hierarchy[membership.role] < hierarchy[minRole]) {
    throw new RbacError(
      `Requires ${minRole} role or higher`,
      403
    );
  }

  return membership;
}

/**
 * Resolves a project's teamId, then enforces membership.
 * Use in task/comment/attachment routes where you only have a projectId.
 */
export async function requireProjectAccess(userId: string, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { teamId: true },
  });

  if (!project) {
    throw new RbacError("Project not found", 404);
  }

  const membership = await requireTeamMember(userId, project.teamId);
  return { project, membership };
}

/**
 * Resolves a task's project → team, then enforces membership.
 * Use in comment/attachment routes where you only have a taskId.
 */
export async function requireTaskAccess(userId: string, taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true, project: { select: { teamId: true } } },
  });

  if (!task) {
    throw new RbacError("Task not found", 404);
  }

  const membership = await requireTeamMember(userId, task.project.teamId);
  return { task, membership };
}

export class RbacError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "RbacError";
  }
}