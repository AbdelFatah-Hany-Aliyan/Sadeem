"use server";

import { getSession } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import {
  createCompanyMember,
  approveCompanyMember,
  rejectCompanyMember,
  suspendCompanyMember,
  reactivateCompanyMember,
} from "@/lib/services/companyMemberService";
import { createAndSendInvitation } from "@/lib/services/invitationService";
import {
  createTask,
  updateTask,
  deleteTask,
} from "@/lib/services/companyTaskService";
import {
  createRecommendation,
  acknowledgeRecommendation,
  archiveRecommendation,
} from "@/lib/services/recommendationService";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/services/notificationService";
import {
  MembershipType,
  TeamRole,
  AdminRole,
  TaskPriority,
  TaskStatus,
  RecommendationType,
  RecommendationVisibility,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface CompanyActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Creates a company member and optionally dispatches an invitation.
 */
export async function createMemberAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await requirePermission(session.role, "members:create");

    const fullNameEn = formData.get("fullNameEn") as string;
    const fullNameAr = (formData.get("fullNameAr") as string) || undefined;
    const email = formData.get("email") as string;
    const phone = (formData.get("phone") as string) || undefined;
    const jobTitleEn = formData.get("jobTitleEn") as string;
    const jobTitleAr = (formData.get("jobTitleAr") as string) || undefined;
    const membershipType = (formData.get("membershipType") as MembershipType) || MembershipType.EMPLOYEE;
    const primaryTeamId = formData.get("primaryTeamId") as string;
    const teamRole = (formData.get("teamRole") as TeamRole) || TeamRole.MEMBER;
    const sendInvite = formData.get("sendInvite") === "true";

    if (!primaryTeamId) {
      return { success: false, error: "Primary team assignment is required" };
    }

    const { member } = await createCompanyMember(
      {
        fullNameEn,
        fullNameAr,
        email,
        phone,
        jobTitleEn,
        jobTitleAr,
        membershipType,
        primaryTeamId,
        teamRole,
        sendInviteImmediately: sendInvite,
      },
      session
    );

    revalidatePath("/admin/company");
    revalidatePath("/admin/company/members");
    revalidatePath("/admin/company/invitations");

    return { success: true, data: { id: member.id } };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create member" };
  }
}

/**
 * Approves a candidate member who accepted their invitation.
 */
export async function approveMemberAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await requirePermission(session.role, "invitations:approve");

    const memberId = formData.get("memberId") as string;
    const adminRole = (formData.get("adminRole") as AdminRole) || AdminRole.TEAM_MEMBER;

    if (!memberId) {
      return { success: false, error: "Missing memberId" };
    }

    const result = await approveCompanyMember(
      {
        memberId,
        assignedRole: adminRole,
        grantDashboardAccess: true,
      },
      session
    );

    revalidatePath("/admin/company");
    revalidatePath("/admin/company/members");
    revalidatePath(`/admin/company/members/${memberId}`);
    revalidatePath("/admin/company/invitations");

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to approve member" };
  }
}

/**
 * Rejects a candidate member.
 */
export async function rejectMemberAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await requirePermission(session.role, "invitations:approve");

    const memberId = formData.get("memberId") as string;
    const reason = (formData.get("reason") as string) || "Application rejected by administrator";

    if (!memberId) {
      return { success: false, error: "Missing memberId" };
    }

    const result = await rejectCompanyMember(memberId, reason, session);

    revalidatePath("/admin/company/members");
    revalidatePath(`/admin/company/members/${memberId}`);
    revalidatePath("/admin/company/invitations");

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to reject member" };
  }
}

/**
 * Suspends an active member and revokes active sessions immediately.
 */
export async function suspendMemberAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await requirePermission(session.role, "members:suspend");

    const memberId = formData.get("memberId") as string;
    const reason = (formData.get("reason") as string) || "Suspended by administrator";

    if (!memberId) {
      return { success: false, error: "Missing memberId" };
    }

    const result = await suspendCompanyMember(memberId, reason, session);

    revalidatePath("/admin/company/members");
    revalidatePath(`/admin/company/members/${memberId}`);

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to suspend member" };
  }
}

/**
 * Reactivates a suspended member.
 */
export async function reactivateMemberAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await requirePermission(session.role, "members:suspend");

    const memberId = formData.get("memberId") as string;
    if (!memberId) {
      return { success: false, error: "Missing memberId" };
    }

    const result = await reactivateCompanyMember(memberId, session);

    revalidatePath("/admin/company/members");
    revalidatePath(`/admin/company/members/${memberId}`);

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to reactivate member" };
  }
}

/**
 * Resends an invitation to a member.
 */
export async function resendInvitationAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await requirePermission(session.role, "invitations:create");

    const memberId = formData.get("memberId") as string;
    const email = formData.get("email") as string;

    if (!memberId || !email) {
      return { success: false, error: "Missing memberId or email" };
    }

    await createAndSendInvitation({
      memberId,
      email,
      invitedById: session.userId,
    });

    revalidatePath("/admin/company/invitations");
    revalidatePath(`/admin/company/members/${memberId}`);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to resend invitation" };
  }
}

/**
 * Creates a new company task.
 */
export async function createTaskAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await requirePermission(session.role, "tasks:create");

    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || undefined;
    const priority = (formData.get("priority") as TaskPriority) || TaskPriority.MEDIUM;
    const status = (formData.get("status") as TaskStatus) || TaskStatus.TODO;
    const dueDateStr = formData.get("dueDate") as string;
    const dueDate = dueDateStr ? new Date(dueDateStr) : null;
    const assignedMemberId = (formData.get("assignedMemberId") as string) || null;
    const reviewerMemberId = (formData.get("reviewerMemberId") as string) || null;
    const teamId = (formData.get("teamId") as string) || null;
    const projectId = (formData.get("projectId") as string) || null;
    const reviewRequired = formData.get("reviewRequired") === "true";
    const isAiAssisted = formData.get("isAiAssisted") === "true";

    const task = await createTask(
      {
        title,
        description,
        priority,
        status,
        dueDate,
        assignedMemberId,
        reviewerMemberId,
        teamId,
        projectId,
        reviewRequired,
        isAiAssisted,
      },
      session.userId
    );

    revalidatePath("/admin/company/tasks");
    revalidatePath("/admin/my-work");

    return { success: true, data: { id: task.id } };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create task" };
  }
}

/**
 * Updates a task status or details.
 */
export async function updateTaskStatusAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const taskId = formData.get("taskId") as string;
    const status = formData.get("status") as TaskStatus;

    if (!taskId || !status) {
      return { success: false, error: "Missing taskId or status" };
    }

    await updateTask(taskId, { status }, session.userId);

    revalidatePath("/admin/company/tasks");
    revalidatePath(`/admin/company/tasks/${taskId}`);
    revalidatePath("/admin/my-work");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update task status" };
  }
}

/**
 * Deletes a task.
 */
export async function deleteTaskAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await requirePermission(session.role, "tasks:delete");

    const taskId = formData.get("taskId") as string;
    if (!taskId) {
      return { success: false, error: "Missing taskId" };
    }

    await deleteTask(taskId);

    revalidatePath("/admin/company/tasks");
    revalidatePath("/admin/my-work");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete task" };
  }
}

/**
 * Creates an administrative recommendation.
 */
export async function createRecommendationAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await requirePermission(session.role, "recommendations:create");

    const targetMemberId = formData.get("targetMemberId") as string;
    const text = formData.get("text") as string;
    const type = (formData.get("type") as RecommendationType) || RecommendationType.GUIDANCE;
    const priority = (formData.get("priority") as TaskPriority) || TaskPriority.MEDIUM;
    const visibility = (formData.get("visibility") as RecommendationVisibility) || RecommendationVisibility.SHARED_WITH_MEMBER;
    const relatedProjectId = (formData.get("relatedProjectId") as string) || null;

    if (!targetMemberId || !text) {
      return { success: false, error: "Missing targetMemberId or text" };
    }

    const rec = await createRecommendation(
      {
        targetMemberId,
        text,
        type,
        priority,
        visibility,
        relatedProjectId,
      },
      session.userId
    );

    revalidatePath("/admin/company/recommendations");
    revalidatePath("/admin/my-work");
    revalidatePath(`/admin/company/members/${targetMemberId}`);

    return { success: true, data: { id: rec.id } };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create recommendation" };
  }
}

/**
 * Acknowledges receipt of a recommendation by a member.
 */
export async function acknowledgeRecommendationAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const recommendationId = formData.get("recommendationId") as string;
    const memberId = formData.get("memberId") as string;

    if (!recommendationId || !memberId) {
      return { success: false, error: "Missing recommendationId or memberId" };
    }

    await acknowledgeRecommendation(recommendationId, memberId);

    revalidatePath("/admin/my-work");
    revalidatePath("/admin/company/recommendations");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to acknowledge recommendation" };
  }
}

/**
 * Marks an individual notification as read.
 */
export async function markNotificationReadAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const notificationId = formData.get("notificationId") as string;
    if (!notificationId) {
      return { success: false, error: "Missing notificationId" };
    }

    await markNotificationAsRead(notificationId, { adminUserId: session.userId });

    revalidatePath("/admin/company/notifications");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to mark notification as read" };
  }
}

/**
 * Marks all notifications as read for current user.
 */
export async function markAllNotificationsReadAction(): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await markAllNotificationsAsRead({ adminUserId: session.userId });
    revalidatePath("/admin/company/notifications");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to mark all as read" };
  }
}
