/**
 * SADEEM — OPERATIONAL SCOPE GUARD & RESOURCE ACCESS VALIDATION
 *
 * Enforces multi-tier authorization:
 * 1. Role capability check (RBAC permissions)
 * 2. Resource & Department scope check (actual team membership and task assignment)
 * 3. Least privilege and deny-by-default
 */

import prisma from "@/lib/prisma";
import { AdminRole, TeamRole } from "@prisma/client";
import { CurrentUserSession } from "@/lib/auth/session";

export interface ScopeCheckResult {
  allowed: boolean;
  reason?: string;
  memberId?: string;
}

/**
 * Resolves the linked CompanyMember ID for an authenticated user session.
 */
export async function getLinkedMemberId(userId: string): Promise<string | null> {
  const admin = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { companyMemberId: true },
  });
  return admin?.companyMemberId || null;
}

/**
 * Checks whether an authenticated user can access a department workspace.
 * Super admins and company admins have full organizational visibility.
 * Other roles must be active members or leads of the target department.
 */
export async function canAccessDepartment(
  session: CurrentUserSession,
  departmentCode: string
): Promise<ScopeCheckResult> {
  if (!session) {
    return { allowed: false, reason: "UNAUTHORIZED: Active session required" };
  }

  // Executive tier has studio-wide scope
  if (
    session.role === AdminRole.SUPER_ADMIN ||
    session.role === AdminRole.COMPANY_ADMIN
  ) {
    return { allowed: true };
  }

  const memberId = await getLinkedMemberId(session.userId);
  if (!memberId) {
    return {
      allowed: false,
      reason: "FORBIDDEN: User is not linked to any active company member profile",
    };
  }

  const membership = await prisma.teamMembership.findFirst({
    where: {
      memberId,
      team: { code: departmentCode, isActive: true },
    },
  });

  if (!membership) {
    return {
      allowed: false,
      reason: `FORBIDDEN: You do not belong to the ${departmentCode} department`,
      memberId,
    };
  }

  return { allowed: true, memberId };
}

/**
 * Checks whether an authenticated user can view, edit, or interact with a task.
 */
export async function canAccessTask(
  session: CurrentUserSession,
  taskId: string
): Promise<ScopeCheckResult> {
  if (!session) {
    return { allowed: false, reason: "UNAUTHORIZED: Active session required" };
  }

  if (
    session.role === AdminRole.SUPER_ADMIN ||
    session.role === AdminRole.COMPANY_ADMIN
  ) {
    return { allowed: true };
  }

  const task = await prisma.companyTask.findUnique({
    where: { id: taskId },
    include: {
      collaborators: true,
      team: true,
    },
  });

  if (!task) {
    return { allowed: false, reason: "Task not found" };
  }

  const memberId = await getLinkedMemberId(session.userId);

  // If user is directly assigned or creator
  if (task.createdById === session.userId) {
    return { allowed: true, memberId: memberId || undefined };
  }

  if (memberId) {
    if (task.assignedMemberId === memberId || task.reviewerMemberId === memberId) {
      return { allowed: true, memberId };
    }

    // Check if user is a collaborator
    const isCollaborator = task.collaborators.some((c) => c.memberId === memberId);
    if (isCollaborator) {
      return { allowed: true, memberId };
    }

    // Check if user belongs to the task's team
    if (task.teamId) {
      const teamMembership = await prisma.teamMembership.findFirst({
        where: { memberId, teamId: task.teamId },
      });
      if (teamMembership) {
        return { allowed: true, memberId };
      }
    }
  }

  // Project managers can view tasks across projects
  if (session.role === AdminRole.PROJECT_MANAGER && task.projectId) {
    return { allowed: true, memberId: memberId || undefined };
  }

  return {
    allowed: false,
    reason: "FORBIDDEN: You are not authorized to access this task",
    memberId: memberId || undefined,
  };
}

/**
 * Checks whether an authenticated user can review and approve a task.
 */
export async function canReviewTask(
  session: CurrentUserSession,
  taskId: string
): Promise<ScopeCheckResult> {
  if (!session) {
    return { allowed: false, reason: "UNAUTHORIZED: Active session required" };
  }

  if (
    session.role === AdminRole.SUPER_ADMIN ||
    session.role === AdminRole.COMPANY_ADMIN
  ) {
    return { allowed: true };
  }

  const task = await prisma.companyTask.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      reviewerMemberId: true,
      teamId: true,
      assignedMemberId: true,
    },
  });

  if (!task) {
    return { allowed: false, reason: "Task not found" };
  }

  const memberId = await getLinkedMemberId(session.userId);

  // An assigned member cannot approve their own review-required task
  if (memberId && task.assignedMemberId === memberId && session.role === AdminRole.TEAM_MEMBER) {
    return {
      allowed: false,
      reason: "FORBIDDEN: You cannot review your own submitted work",
      memberId,
    };
  }

  // Explicitly designated reviewer
  if (memberId && task.reviewerMemberId === memberId) {
    return { allowed: true, memberId };
  }

  // Team Lead of the task's department
  if (memberId && task.teamId && session.role === AdminRole.TEAM_LEAD) {
    const isLead = await prisma.teamMembership.findFirst({
      where: {
        memberId,
        teamId: task.teamId,
        teamRole: TeamRole.LEAD,
      },
    });
    if (isLead) {
      return { allowed: true, memberId };
    }
  }

  // QA Reviewer role
  if (session.role === AdminRole.QA_REVIEWER) {
    return { allowed: true, memberId: memberId || undefined };
  }

  return {
    allowed: false,
    reason: "FORBIDDEN: Authorized reviewer or team lead permission required",
    memberId: memberId || undefined,
  };
}

/**
 * Checks whether an authenticated user can moderate/delete a comment.
 */
export async function canModerateComment(
  session: CurrentUserSession,
  commentId: string
): Promise<ScopeCheckResult> {
  if (!session) {
    return { allowed: false, reason: "UNAUTHORIZED" };
  }

  if (
    session.role === AdminRole.SUPER_ADMIN ||
    session.role === AdminRole.COMPANY_ADMIN
  ) {
    return { allowed: true };
  }

  const comment = await prisma.taskComment.findUnique({
    where: { id: commentId },
    include: {
      task: true,
    },
  });

  if (!comment) {
    return { allowed: false, reason: "Comment not found" };
  }

  const memberId = await getLinkedMemberId(session.userId);

  // Author can edit/delete their own comment
  if (comment.authorAdminId === session.userId || (memberId && comment.authorMemberId === memberId)) {
    return { allowed: true, memberId: memberId || undefined };
  }

  // Team lead of the department can moderate comments
  if (session.role === AdminRole.TEAM_LEAD && memberId && comment.task.teamId) {
    const isLead = await prisma.teamMembership.findFirst({
      where: {
        memberId,
        teamId: comment.task.teamId,
        teamRole: TeamRole.LEAD,
      },
    });
    if (isLead) {
      return { allowed: true, memberId };
    }
  }

  return { allowed: false, reason: "FORBIDDEN: Only author or authorized lead can moderate comments" };
}
