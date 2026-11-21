"use server";

import prisma from "@/lib/prisma";
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
  addTaskCollaborator,
  removeTaskCollaborator,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  addTaskComment,
  editTaskComment,
  deleteTaskComment,
  addDeliverableLink,
  addDeliverableUpload,
  reviewDeliverable,
  submitTaskForReview,
  approveTaskReview,
  requestTaskChanges,
  broadcastDepartmentAnnouncement,
} from "@/lib/services/companyTaskService";
import {
  canAccessTask,
  canReviewTask,
  canModerateComment,
  getLinkedMemberId,
} from "@/lib/auth/scopeGuard";
import { uploadDeliverableToStorage, getSignedDownloadUrl } from "@/lib/storage/storageProvider";
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
  DeliverableType,
  DeliverableStatus,
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

    const { member, inviteResult } = await createCompanyMember(
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

    return {
      success: true,
      data: {
        id: member.id,
        sendInvite,
        deliveryStatus: inviteResult?.deliveryResult?.deliveryStatus || null,
        error: inviteResult?.deliveryResult?.error || null,
      },
    };
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

    const result = await createAndSendInvitation({
      memberId,
      email,
      invitedById: session.userId,
    });

    revalidatePath("/admin/company/invitations");
    revalidatePath(`/admin/company/members/${memberId}`);

    if (result.deliveryResult.deliveryStatus === "BLOCKED_CONFIGURATION") {
      return {
        success: true,
        data: {
          status: "BLOCKED_CONFIGURATION",
          deliveryStatus: result.deliveryResult.deliveryStatus,
          message:
            "تم تجديد رمز الدعوة وإلغاء الرمز السابق، ولكن تم حظر إرسال البريد لعدم تهيئة مزود البريد (RESEND_API_KEY).",
        },
      };
    }

    if (result.deliveryResult.deliveryStatus === "FAILED") {
      return {
        success: false,
        error: `تم تدوير رمز الدعوة بنجاح، ولكن فشل الإرسال عبر المزود: ${result.deliveryResult.error}`,
      };
    }

    return {
      success: true,
      data: {
        status: "ACCEPTED_BY_PROVIDER",
        deliveryStatus: result.deliveryResult.deliveryStatus,
        message: "تم تجديد رمز الدعوة وإرسالها إلى مزود البريد بنجاح.",
      },
    };
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

    // Parse collaborators if provided
    const rawCollaborators = formData.getAll("collaboratorMemberIds") as string[];
    const commaCollaborators = (formData.get("collaboratorMemberIds") as string || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const collaboratorMemberIds = Array.from(new Set([...rawCollaborators, ...commaCollaborators]));

    // Parse checklist titles if provided
    const rawChecklist = formData.getAll("checklistTitles") as string[];
    const textChecklist = (formData.get("checklistText") as string || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const checklistTitles = [...rawChecklist, ...textChecklist];

    const task = await createTask(
      {
        title,
        description,
        priority,
        status,
        dueDate,
        assignedMemberId,
        collaboratorMemberIds,
        checklistTitles,
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
    if (teamId) {
      revalidatePath(`/admin/company/teams/${teamId}`);
    }

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

// -----------------------------------------------------------------------------
// Operations Sprint Actions: Comments, Checklists, Deliverables, Reviews
// -----------------------------------------------------------------------------

/**
 * Adds a comment to a task discussion with mention support.
 */
export async function addTaskCommentAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const taskId = formData.get("taskId") as string;
    const content = formData.get("content") as string;

    if (!taskId || !content) {
      return { success: false, error: "Missing taskId or content" };
    }

    const access = await canAccessTask(session, taskId);
    if (!access.allowed) {
      return { success: false, error: access.reason || "Forbidden" };
    }

    const memberId = await getLinkedMemberId(session.userId);

    const comment = await addTaskComment({
      taskId,
      content,
      authorAdminId: session.userId,
      authorMemberId: memberId || undefined,
    });

    revalidatePath(`/admin/company/tasks`);
    revalidatePath(`/admin/my-work`);

    return { success: true, data: comment };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to add comment" };
  }
}

/**
 * Edits an existing comment.
 */
export async function editTaskCommentAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const commentId = formData.get("commentId") as string;
    const content = formData.get("content") as string;

    if (!commentId || !content) {
      return { success: false, error: "Missing commentId or content" };
    }

    const mod = await canModerateComment(session, commentId);
    if (!mod.allowed) {
      return { success: false, error: mod.reason || "Forbidden" };
    }

    const memberId = await getLinkedMemberId(session.userId);
    const updated = await editTaskComment(commentId, content, {
      adminUserId: session.userId,
      memberId: memberId || undefined,
      role: session.role,
    });

    revalidatePath(`/admin/company/tasks`);
    revalidatePath(`/admin/my-work`);

    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to edit comment" };
  }
}

/**
 * Deletes a comment (soft delete).
 */
export async function deleteTaskCommentAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const commentId = formData.get("commentId") as string;
    if (!commentId) return { success: false, error: "Missing commentId" };

    const mod = await canModerateComment(session, commentId);
    if (!mod.allowed) {
      return { success: false, error: mod.reason || "Forbidden" };
    }

    const memberId = await getLinkedMemberId(session.userId);
    const result = await deleteTaskComment(commentId, {
      adminUserId: session.userId,
      memberId: memberId || undefined,
      role: session.role,
    });

    revalidatePath(`/admin/company/tasks`);
    revalidatePath(`/admin/my-work`);

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete comment" };
  }
}

/**
 * Adds a checklist item / subtask to a task.
 */
export async function addChecklistItemAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const taskId = formData.get("taskId") as string;
    const title = formData.get("title") as string;

    if (!taskId || !title) return { success: false, error: "Missing taskId or title" };

    const access = await canAccessTask(session, taskId);
    if (!access.allowed) {
      return { success: false, error: access.reason || "Forbidden" };
    }

    const item = await addChecklistItem(taskId, title, undefined, session.userId);

    revalidatePath(`/admin/company/tasks`);
    revalidatePath(`/admin/my-work`);

    return { success: true, data: item };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to add checklist item" };
  }
}

/**
 * Toggles a checklist item's completion status.
 */
export async function toggleChecklistItemAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const itemId = formData.get("itemId") as string;
    const isCompleted = formData.get("isCompleted") === "true";

    if (!itemId) return { success: false, error: "Missing itemId" };

    const memberId = await getLinkedMemberId(session.userId);
    const item = await toggleChecklistItem(itemId, isCompleted, {
      adminUserId: session.userId,
      memberId: memberId || undefined,
    });

    revalidatePath(`/admin/company/tasks`);
    revalidatePath(`/admin/my-work`);

    return { success: true, data: item };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to toggle checklist item" };
  }
}

/**
 * Deletes a checklist item.
 */
export async function deleteChecklistItemAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const itemId = formData.get("itemId") as string;
    if (!itemId) return { success: false, error: "Missing itemId" };

    await deleteChecklistItem(itemId);

    revalidatePath(`/admin/company/tasks`);
    revalidatePath(`/admin/my-work`);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete checklist item" };
  }
}

/**
 * Adds an external deliverable link (Figma, GitHub, Document, PRD).
 */
export async function addDeliverableLinkAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const taskId = formData.get("taskId") as string;
    const title = formData.get("title") as string;
    const type = (formData.get("type") as DeliverableType) || DeliverableType.OTHER;
    const url = formData.get("url") as string;

    if (!taskId || !title || !url) {
      return { success: false, error: "Missing required deliverable fields" };
    }

    const access = await canAccessTask(session, taskId);
    if (!access.allowed) {
      return { success: false, error: access.reason || "Forbidden" };
    }

    const memberId = await getLinkedMemberId(session.userId);
    const deliverable = await addDeliverableLink({
      taskId,
      title,
      type,
      url,
      authorAdminId: session.userId,
      authorMemberId: memberId || undefined,
    });

    revalidatePath(`/admin/company/tasks`);
    revalidatePath(`/admin/my-work`);

    return { success: true, data: deliverable };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to add deliverable link" };
  }
}

/**
 * Uploads a deliverable file into private object storage and attaches it to the task.
 */
export async function uploadDeliverableFileAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const taskId = formData.get("taskId") as string;
    const title = formData.get("title") as string;
    const file = formData.get("file") as File;

    if (!taskId || !title || !file) {
      return { success: false, error: "Missing required deliverable upload fields" };
    }

    const access = await canAccessTask(session, taskId);
    if (!access.allowed) {
      return { success: false, error: access.reason || "Forbidden" };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadDeliverableToStorage({
      buffer,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
    });

    const memberId = await getLinkedMemberId(session.userId);
    const deliverable = await addDeliverableUpload({
      taskId,
      title,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      storageKey: uploadResult.storageKey,
      authorAdminId: session.userId,
      authorMemberId: memberId || undefined,
    });

    revalidatePath(`/admin/company/tasks`);
    revalidatePath(`/admin/my-work`);

    return { success: true, data: deliverable };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to upload deliverable" };
  }
}

/**
 * Generates a temporary signed download URL for a private deliverable file.
 */
export async function getDeliverableDownloadUrlAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const deliverableId = formData.get("deliverableId") as string;
    const taskId = formData.get("taskId") as string;

    if (!deliverableId || !taskId) {
      return { success: false, error: "Missing deliverableId or taskId" };
    }

    const access = await canAccessTask(session, taskId);
    if (!access.allowed) {
      return { success: false, error: access.reason || "Forbidden" };
    }

    const deliverable = await prisma.taskDeliverable.findUnique({
      where: { id: deliverableId },
    });

    if (!deliverable || !deliverable.storageKey) {
      return { success: false, error: "Deliverable file not found" };
    }

    const signedUrl = await getSignedDownloadUrl(deliverable.storageKey, 3600);
    return { success: true, data: { url: signedUrl } };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to generate download URL" };
  }
}

/**
 * Reviews an individual deliverable (Approve or Request Changes).
 */
export async function reviewDeliverableAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const deliverableId = formData.get("deliverableId") as string;
    const taskId = formData.get("taskId") as string;
    const status = formData.get("status") as DeliverableStatus;
    const reviewNotes = (formData.get("reviewNotes") as string) || undefined;

    if (!deliverableId || !taskId || !status) {
      return { success: false, error: "Missing required review parameters" };
    }

    const reviewCheck = await canReviewTask(session, taskId);
    if (!reviewCheck.allowed) {
      return { success: false, error: reviewCheck.reason || "Unauthorized to review" };
    }

    const result = await reviewDeliverable(deliverableId, {
      status,
      reviewNotes,
      reviewerId: session.userId,
    });

    revalidatePath(`/admin/company/tasks`);
    revalidatePath(`/admin/my-work`);

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to review deliverable" };
  }
}

/**
 * Submits a task for formal review.
 */
export async function submitTaskForReviewAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const taskId = formData.get("taskId") as string;
    const notes = (formData.get("notes") as string) || undefined;

    if (!taskId) return { success: false, error: "Missing taskId" };

    const access = await canAccessTask(session, taskId);
    if (!access.allowed) {
      return { success: false, error: access.reason || "Forbidden" };
    }

    const memberId = await getLinkedMemberId(session.userId);
    const result = await submitTaskForReview(taskId, {
      adminUserId: session.userId,
      memberId: memberId || undefined,
      notes,
    });

    revalidatePath(`/admin/company/tasks`);
    revalidatePath(`/admin/my-work`);

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to submit task for review" };
  }
}

/**
 * Approves a task under review (moves to DONE and marks deliverables approved).
 */
export async function approveTaskReviewAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const taskId = formData.get("taskId") as string;
    const notes = (formData.get("notes") as string) || undefined;

    if (!taskId) return { success: false, error: "Missing taskId" };

    const reviewCheck = await canReviewTask(session, taskId);
    if (!reviewCheck.allowed) {
      return { success: false, error: reviewCheck.reason || "Unauthorized to approve review" };
    }

    const memberId = await getLinkedMemberId(session.userId);
    const result = await approveTaskReview(taskId, {
      adminUserId: session.userId,
      memberId: memberId || undefined,
      notes,
    });

    revalidatePath(`/admin/company/tasks`);
    revalidatePath(`/admin/my-work`);

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to approve task review" };
  }
}

/**
 * Requests changes on a task under review (returns to IN_PROGRESS with feedback notes).
 */
export async function requestTaskChangesAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const taskId = formData.get("taskId") as string;
    const feedbackNotes = formData.get("feedbackNotes") as string;

    if (!taskId || !feedbackNotes) {
      return { success: false, error: "Missing taskId or feedbackNotes" };
    }

    const reviewCheck = await canReviewTask(session, taskId);
    if (!reviewCheck.allowed) {
      return { success: false, error: reviewCheck.reason || "Unauthorized to request changes" };
    }

    const memberId = await getLinkedMemberId(session.userId);
    const result = await requestTaskChanges(taskId, {
      adminUserId: session.userId,
      memberId: memberId || undefined,
      feedbackNotes,
    });

    revalidatePath(`/admin/company/tasks`);
    revalidatePath(`/admin/my-work`);

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to request task changes" };
  }
}

/**
 * Adds a collaborator to an existing task.
 */
export async function addTaskCollaboratorAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const taskId = formData.get("taskId") as string;
    const memberId = formData.get("memberId") as string;

    if (!taskId || !memberId) return { success: false, error: "Missing taskId or memberId" };

    const access = await canAccessTask(session, taskId);
    if (!access.allowed) {
      return { success: false, error: access.reason || "Forbidden" };
    }

    const result = await addTaskCollaborator(taskId, memberId, session.userId);

    revalidatePath(`/admin/company/tasks`);
    revalidatePath(`/admin/my-work`);

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to add collaborator" };
  }
}

/**
 * Removes a collaborator from a task.
 */
export async function removeTaskCollaboratorAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const taskId = formData.get("taskId") as string;
    const memberId = formData.get("memberId") as string;

    if (!taskId || !memberId) return { success: false, error: "Missing taskId or memberId" };

    const access = await canAccessTask(session, taskId);
    if (!access.allowed) {
      return { success: false, error: access.reason || "Forbidden" };
    }

    const result = await removeTaskCollaborator(taskId, memberId, session.userId);

    revalidatePath(`/admin/company/tasks`);
    revalidatePath(`/admin/my-work`);

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to remove collaborator" };
  }
}

/**
 * Broadcasts an announcement notification to all members of a department.
 */
export async function broadcastDepartmentAnnouncementAction(formData: FormData): Promise<CompanyActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    await requirePermission(session.role, "announcements:broadcast");

    const teamId = formData.get("teamId") as string;
    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const link = (formData.get("link") as string) || undefined;

    if (!teamId || !title || !message) {
      return { success: false, error: "Missing teamId, title, or message" };
    }

    const result = await broadcastDepartmentAnnouncement(teamId, {
      title,
      message,
      link,
      actorAdminId: session.userId,
    });

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to broadcast announcement" };
  }
}
