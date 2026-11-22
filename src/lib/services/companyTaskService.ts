import prisma from "@/lib/prisma";
import {
  TaskPriority,
  TaskStatus,
  DeliverableType,
  DeliverableStatus,
  Prisma,
  AdminRole,
} from "@prisma/client";
import { createNotification } from "./notificationService";

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: Date | null;
  createdById?: string;
  assignedMemberId?: string | null;
  collaboratorMemberIds?: string[];
  checklistTitles?: string[];
  reviewerMemberId?: string | null;
  teamId?: string | null;
  projectId?: string | null;
  isAiAssisted?: boolean;
  aiMetadata?: Prisma.InputJsonValue;
  reviewRequired?: boolean;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: Date | null;
  assignedMemberId?: string | null;
  collaboratorMemberIds?: string[];
  reviewerMemberId?: string | null;
  teamId?: string | null;
  projectId?: string | null;
  isAiAssisted?: boolean;
  aiMetadata?: Prisma.InputJsonValue;
  reviewRequired?: boolean;
}

export interface TaskFilterOptions {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedMemberId?: string;
  collaboratorMemberId?: string;
  reviewerMemberId?: string;
  teamId?: string;
  projectId?: string;
  search?: string;
}

export interface TaskProgress {
  total: number;
  completed: number;
  percentage: number;
}

/**
 * Calculates checklist completion progress.
 */
export function calculateTaskProgress(
  items?: { isCompleted: boolean }[] | null
): TaskProgress {
  if (!items || items.length === 0) {
    return { total: 0, completed: 0, percentage: 0 };
  }
  const total = items.length;
  const completed = items.filter((i) => i.isCompleted).length;
  const percentage = Math.round((completed / total) * 100);
  return { total, completed, percentage };
}

/**
 * Validates state transition logic.
 * If reviewRequired is true, moving to DONE directly from IN_PROGRESS is blocked
 * unless formally approved or submitted to IN_REVIEW first.
 */
export function isValidStatusTransition(
  current: TaskStatus,
  target: TaskStatus,
  reviewRequired: boolean
): { valid: boolean; reason?: string } {
  if (current === target) return { valid: true };

  // Cancelled or done tasks can be reopened to TODO or IN_PROGRESS
  if (current === TaskStatus.CANCELLED || current === TaskStatus.DONE) {
    if (target === TaskStatus.TODO || target === TaskStatus.IN_PROGRESS) {
      return { valid: true };
    }
  }

  // If review is required, cannot go straight from IN_PROGRESS or TODO to DONE without review
  if (
    reviewRequired &&
    (current === TaskStatus.IN_PROGRESS || current === TaskStatus.TODO) &&
    target === TaskStatus.DONE
  ) {
    return {
      valid: false,
      reason: "This task requires formal review. Please submit to IN_REVIEW for reviewer approval.",
    };
  }

  return { valid: true };
}

/**
 * Creates a new company task with support for initial collaborators and subtasks/checklists.
 */
export async function createTask(input: CreateTaskInput, actorAdminId?: string) {
  if (!input.title || input.title.trim().length === 0) {
    throw new Error("Task title is required");
  }

  const task = await prisma.$transaction(async (tx) => {
    const newTask = await tx.companyTask.create({
      data: {
        title: input.title.trim(),
        description: input.description?.trim() || null,
        priority: input.priority || TaskPriority.MEDIUM,
        status: input.status || TaskStatus.TODO,
        dueDate: input.dueDate || null,
        createdById: input.createdById || actorAdminId || null,
        assignedMemberId: input.assignedMemberId || null,
        reviewerMemberId: input.reviewerMemberId || null,
        teamId: input.teamId || null,
        projectId: input.projectId || null,
        isAiAssisted: Boolean(input.isAiAssisted),
        aiMetadata: input.aiMetadata || Prisma.JsonNull,
        reviewRequired: Boolean(input.reviewRequired),
        completedAt: input.status === TaskStatus.DONE ? new Date() : null,
      },
      include: {
        assignedMember: true,
        reviewerMember: true,
        team: true,
        project: true,
      },
    });

    // Add initial collaborators if provided
    if (input.collaboratorMemberIds && input.collaboratorMemberIds.length > 0) {
      const distinctCollaborators = Array.from(
        new Set(input.collaboratorMemberIds.filter((id) => id !== input.assignedMemberId))
      );
      for (const memberId of distinctCollaborators) {
        await tx.taskCollaborator.create({
          data: {
            taskId: newTask.id,
            memberId,
          },
        });
      }
    }

    // Add initial checklist items if provided
    if (input.checklistTitles && input.checklistTitles.length > 0) {
      for (let i = 0; i < input.checklistTitles.length; i++) {
        const itemTitle = input.checklistTitles[i].trim();
        if (itemTitle.length > 0) {
          await tx.taskChecklistItem.create({
            data: {
              taskId: newTask.id,
              title: itemTitle,
              order: i,
            },
          });
        }
      }
    }

    await tx.taskHistory.create({
      data: {
        taskId: newTask.id,
        actorId: actorAdminId || input.createdById || null,
        action: "TASK_CREATED",
        fromStatus: null,
        toStatus: newTask.status,
        metadata: {
          initialTitle: newTask.title,
          priority: newTask.priority,
          assignedMemberId: newTask.assignedMemberId,
          collaboratorCount: input.collaboratorMemberIds?.length || 0,
          checklistCount: input.checklistTitles?.length || 0,
        },
      },
    });

    return newTask;
  }, { maxWait: 15000, timeout: 30000 });

  // Notify assigned owner
  if (task.assignedMemberId) {
    try {
      await createNotification({
        recipientMemberId: task.assignedMemberId,
        type: "TASK_ASSIGNED",
        title: "مهمة جديدة مسندة إليك / New Task Assigned",
        message: `تم إسناد مهمة جديدة إليك: ${task.title}`,
        link: `/admin/my-work?task=${task.id}`,
        metadata: { taskId: task.id },
      });
    } catch (e) {
      console.warn("Failed to dispatch task assignment notification:", e);
    }
  }

  // Notify distinct collaborators
  if (input.collaboratorMemberIds && input.collaboratorMemberIds.length > 0) {
    const notifyCollaborators = Array.from(
      new Set(input.collaboratorMemberIds.filter((id) => id !== task.assignedMemberId))
    );
    for (const collabMemberId of notifyCollaborators) {
      try {
        await createNotification({
          recipientMemberId: collabMemberId,
          type: "TASK_ASSIGNED",
          title: "تمت إضافتك كمتعاون في مهمة / Added as Task Collaborator",
          message: `تمت إضافتك كمتعاون في المهمة: ${task.title}`,
          link: `/admin/my-work?task=${task.id}`,
          metadata: { taskId: task.id, isCollaborator: true },
        });
      } catch (e) {
        console.warn("Failed to notify collaborator:", e);
      }
    }
  }

  return task;
}

/**
 * Updates a task, enforces transitions, records history, and fires notifications.
 */
export async function updateTask(
  taskId: string,
  input: UpdateTaskInput,
  actorAdminId?: string
) {
  const existing = await prisma.companyTask.findUnique({
    where: { id: taskId },
    include: {
      assignedMember: true,
      reviewerMember: true,
      collaborators: true,
    },
  });

  if (!existing) {
    throw new Error(`Task with id ${taskId} not found`);
  }

  const newStatus = input.status !== undefined ? input.status : existing.status;
  const reviewRequired =
    input.reviewRequired !== undefined
      ? input.reviewRequired
      : existing.reviewRequired;

  // Validate status transition
  if (input.status && input.status !== existing.status) {
    const transitionCheck = isValidStatusTransition(
      existing.status,
      newStatus,
      reviewRequired
    );
    if (!transitionCheck.valid) {
      throw new Error(transitionCheck.reason);
    }
  }

  const completedAt =
    newStatus === TaskStatus.DONE
      ? existing.completedAt || new Date()
      : null;

  const updatedTask = await prisma.$transaction(async (tx) => {
    const task = await tx.companyTask.update({
      where: { id: taskId },
      data: {
        ...(input.title !== undefined && { title: input.title.trim() }),
        ...(input.description !== undefined && {
          description: input.description?.trim() || null,
        }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.status !== undefined && {
          status: newStatus,
          completedAt,
        }),
        ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
        ...(input.assignedMemberId !== undefined && {
          assignedMemberId: input.assignedMemberId,
        }),
        ...(input.reviewerMemberId !== undefined && {
          reviewerMemberId: input.reviewerMemberId,
        }),
        ...(input.teamId !== undefined && { teamId: input.teamId }),
        ...(input.projectId !== undefined && {
          projectId: input.projectId,
        }),
        ...(input.isAiAssisted !== undefined && {
          isAiAssisted: input.isAiAssisted,
        }),
        ...(input.aiMetadata !== undefined && {
          aiMetadata: input.aiMetadata || Prisma.JsonNull,
        }),
        ...(input.reviewRequired !== undefined && {
          reviewRequired: input.reviewRequired,
        }),
      },
      include: {
        assignedMember: true,
        reviewerMember: true,
        team: true,
        project: true,
        collaborators: true,
      },
    });

    // Update collaborators if provided
    if (input.collaboratorMemberIds !== undefined) {
      await tx.taskCollaborator.deleteMany({
        where: { taskId },
      });
      const distinctCollaborators = Array.from(
        new Set(input.collaboratorMemberIds.filter((id) => id !== task.assignedMemberId))
      );
      for (const memberId of distinctCollaborators) {
        await tx.taskCollaborator.create({
          data: { taskId, memberId },
        });
      }
    }

    const isStatusChange = input.status && input.status !== existing.status;
    const isAssigneeChange =
      input.assignedMemberId !== undefined &&
      input.assignedMemberId !== existing.assignedMemberId;

    await tx.taskHistory.create({
      data: {
        taskId: task.id,
        actorId: actorAdminId || null,
        action: isStatusChange
          ? "STATUS_CHANGED"
          : isAssigneeChange
          ? "ASSIGNEE_CHANGED"
          : "TASK_UPDATED",
        fromStatus: existing.status,
        toStatus: task.status,
        metadata: {
          previousStatus: existing.status,
          newStatus: task.status,
          actor: actorAdminId,
        },
      },
    });

    return task;
  }, { maxWait: 15000, timeout: 30000 });

  // Handle assignment notifications
  if (
    input.assignedMemberId &&
    input.assignedMemberId !== existing.assignedMemberId
  ) {
    try {
      await createNotification({
        recipientMemberId: input.assignedMemberId,
        type: "TASK_ASSIGNED",
        title: "مهمة مسندة إليك / Task Assigned",
        message: `تم إسناد المهمة: ${updatedTask.title}`,
        link: `/admin/my-work?task=${updatedTask.id}`,
        metadata: { taskId: updatedTask.id },
      });
    } catch (e) {
      console.warn("Failed to dispatch task assignment notification:", e);
    }
  }

  // Handle status notifications
  if (input.status && input.status !== existing.status) {
    if (
      input.status === TaskStatus.IN_REVIEW &&
      updatedTask.reviewerMemberId
    ) {
      try {
        await createNotification({
          recipientMemberId: updatedTask.reviewerMemberId,
          type: "TASK_REVIEW_REQUESTED",
          title: "طلب مراجعة مهمة / Task Review Requested",
          message: `المهمة جاهزة للمراجعة: ${updatedTask.title}`,
          link: `/admin/company/tasks?task=${updatedTask.id}`,
          metadata: { taskId: updatedTask.id },
        });
      } catch (e) {
        console.warn("Failed to notify reviewer:", e);
      }
    }

    if (updatedTask.assignedMemberId) {
      try {
        await createNotification({
          recipientMemberId: updatedTask.assignedMemberId,
          type: "TASK_STATUS_CHANGED",
          title: "تحديث حالة المهمة / Task Status Updated",
          message: `تغيرت حالة المهمة "${updatedTask.title}" إلى ${updatedTask.status}`,
          link: `/admin/my-work?task=${updatedTask.id}`,
          metadata: { taskId: updatedTask.id, status: updatedTask.status },
        });
      } catch (e) {
        console.warn("Failed to notify task status change:", e);
      }
    }
  }

  return updatedTask;
}

/**
 * Deletes a task.
 */
export async function deleteTask(taskId: string) {
  return await prisma.companyTask.delete({
    where: { id: taskId },
  });
}

// -----------------------------------------------------------------------------
// Collaborators Management
// -----------------------------------------------------------------------------

export async function addTaskCollaborator(
  taskId: string,
  memberId: string,
  actorAdminId?: string
) {
  const task = await prisma.companyTask.findUnique({
    where: { id: taskId },
    select: { id: true, title: true, assignedMemberId: true },
  });
  if (!task) throw new Error("Task not found");
  if (task.assignedMemberId === memberId) {
    return null; // Already primary owner
  }

  const existing = await prisma.taskCollaborator.findUnique({
    where: {
      taskId_memberId: { taskId, memberId },
    },
  });
  if (existing) return existing;

  const collaborator = await prisma.taskCollaborator.create({
    data: { taskId, memberId },
    include: { member: true },
  });

  await prisma.taskHistory.create({
    data: {
      taskId,
      actorId: actorAdminId || null,
      action: "COLLABORATOR_ADDED",
      metadata: { memberId, memberName: collaborator.member.fullNameEn },
    },
  });

  try {
    await createNotification({
      recipientMemberId: memberId,
      type: "TASK_ASSIGNED",
      title: "تمت إضافتك كمتعاون في مهمة / Added as Task Collaborator",
      message: `تمت إضافتك كمتعاون في المهمة: ${task.title}`,
      link: `/admin/my-work?task=${task.id}`,
      metadata: { taskId: task.id, isCollaborator: true },
    });
  } catch (e) {
    console.warn("Failed to dispatch collaborator notification:", e);
  }

  return collaborator;
}

export async function removeTaskCollaborator(
  taskId: string,
  memberId: string,
  actorAdminId?: string
) {
  const result = await prisma.taskCollaborator.deleteMany({
    where: { taskId, memberId },
  });

  await prisma.taskHistory.create({
    data: {
      taskId,
      actorId: actorAdminId || null,
      action: "COLLABORATOR_REMOVED",
      metadata: { memberId },
    },
  });

  return result;
}

// -----------------------------------------------------------------------------
// Checklist & Subtasks Management
// -----------------------------------------------------------------------------

export async function addChecklistItem(
  taskId: string,
  title: string,
  order?: number,
  actorId?: string
) {
  if (!title || title.trim().length === 0) {
    throw new Error("Checklist title is required");
  }

  const count = await prisma.taskChecklistItem.count({ where: { taskId } });
  const item = await prisma.taskChecklistItem.create({
    data: {
      taskId,
      title: title.trim(),
      order: order !== undefined ? order : count,
    },
  });

  await prisma.taskHistory.create({
    data: {
      taskId,
      actorId: actorId || null,
      action: "CHECKLIST_ITEM_ADDED",
      metadata: { itemId: item.id, title: item.title },
    },
  });

  return item;
}

export async function toggleChecklistItem(
  itemId: string,
  isCompleted: boolean,
  actorInfo?: { memberId?: string; adminUserId?: string }
) {
  const item = await prisma.taskChecklistItem.update({
    where: { id: itemId },
    data: {
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
      completedById: actorInfo?.memberId || actorInfo?.adminUserId || null,
    },
  });

  await prisma.taskHistory.create({
    data: {
      taskId: item.taskId,
      actorId: actorInfo?.adminUserId || null,
      action: isCompleted ? "CHECKLIST_ITEM_COMPLETED" : "CHECKLIST_ITEM_UNCHECKED",
      metadata: { itemId: item.id, title: item.title, isCompleted },
    },
  });

  return item;
}

export async function deleteChecklistItem(itemId: string) {
  return await prisma.taskChecklistItem.delete({
    where: { id: itemId },
  });
}

// -----------------------------------------------------------------------------
// Task Discussions & Comments
// -----------------------------------------------------------------------------

export async function addTaskComment(input: {
  taskId: string;
  content: string;
  authorAdminId?: string;
  authorMemberId?: string;
}) {
  if (!input.content || input.content.trim().length === 0) {
    throw new Error("Comment content cannot be empty");
  }

  const task = await prisma.companyTask.findUnique({
    where: { id: input.taskId },
    include: {
      team: {
        include: {
          memberships: {
            include: { member: true },
          },
        },
      },
      collaborators: {
        include: { member: true },
      },
    },
  });

  if (!task) throw new Error("Task not found");

  const comment = await prisma.taskComment.create({
    data: {
      taskId: input.taskId,
      content: input.content.trim(),
      authorAdminId: input.authorAdminId || null,
      authorMemberId: input.authorMemberId || null,
    },
    include: {
      authorAdmin: { select: { id: true, name: true, email: true, role: true } },
      authorMember: {
        select: {
          id: true,
          fullNameEn: true,
          fullNameAr: true,
          avatarUrl: true,
          jobTitleEn: true,
        },
      },
    },
  });

  await prisma.taskHistory.create({
    data: {
      taskId: input.taskId,
      actorId: input.authorAdminId || null,
      action: "COMMENT_ADDED",
      metadata: {
        commentId: comment.id,
        authorName: comment.authorMember?.fullNameEn || comment.authorAdmin?.name,
      },
    },
  });

  // Parse mentions (e.g. @John or @all or @email)
  const mentionMatches = input.content.match(/@([a-zA-Z0-9._-]+)/g);
  if (mentionMatches && mentionMatches.length > 0) {
    const rawTokens = mentionMatches.map((m) => m.slice(1).toLowerCase());
    const notifiedRecipientMemberIds = new Set<string>();

    if (rawTokens.includes("all") && task.team) {
      task.team.memberships.forEach((m) => {
        if (m.memberId !== input.authorMemberId) {
          notifiedRecipientMemberIds.add(m.memberId);
        }
      });
    }

    for (const token of rawTokens) {
      if (token === "all") continue;
      const foundInTeam = task.team?.memberships.find(
        (m) =>
          m.member.email.toLowerCase().includes(token) ||
          m.member.fullNameEn.toLowerCase().replace(/\s+/g, "").includes(token)
      );
      if (foundInTeam && foundInTeam.memberId !== input.authorMemberId) {
        notifiedRecipientMemberIds.add(foundInTeam.memberId);
      }

      const foundInCollabs = task.collaborators?.find(
        (c) =>
          c.member.email.toLowerCase().includes(token) ||
          c.member.fullNameEn.toLowerCase().replace(/\s+/g, "").includes(token)
      );
      if (foundInCollabs && foundInCollabs.memberId !== input.authorMemberId) {
        notifiedRecipientMemberIds.add(foundInCollabs.memberId);
      }
    }

    for (const recipientId of Array.from(notifiedRecipientMemberIds)) {
      try {
        await createNotification({
          recipientMemberId: recipientId,
          type: "TASK_COMMENT_MENTION",
          title: "تمت الإشارة إليك في تعليق / Mentioned in Comment",
          message: `تمت الإشارة إليك في المهمة "${task.title}": "${comment.content.slice(0, 100)}"`,
          link: `/admin/my-work?task=${task.id}#comment-${comment.id}`,
          metadata: { taskId: task.id, commentId: comment.id },
        });
      } catch (e) {
        console.warn("Failed to dispatch mention notification:", e);
      }
    }
  }

  return comment;
}

export async function editTaskComment(
  commentId: string,
  content: string,
  actorInfo: { adminUserId?: string; memberId?: string; role?: AdminRole }
) {
  if (!content || content.trim().length === 0) {
    throw new Error("Comment content cannot be empty");
  }

  const existing = await prisma.taskComment.findUnique({
    where: { id: commentId },
  });
  if (!existing || existing.isDeleted) {
    throw new Error("Comment not found");
  }

  const isAuthor =
    (actorInfo.adminUserId && existing.authorAdminId === actorInfo.adminUserId) ||
    (actorInfo.memberId && existing.authorMemberId === actorInfo.memberId);

  const isSuperAdmin =
    actorInfo.role === AdminRole.SUPER_ADMIN ||
    actorInfo.role === AdminRole.COMPANY_ADMIN;

  if (!isAuthor && !isSuperAdmin) {
    throw new Error("Unauthorized to edit this comment");
  }

  return await prisma.taskComment.update({
    where: { id: commentId },
    data: {
      content: content.trim(),
      isEdited: true,
      editedAt: new Date(),
    },
  });
}

export async function deleteTaskComment(
  commentId: string,
  actorInfo: { adminUserId?: string; memberId?: string; role?: AdminRole }
) {
  const existing = await prisma.taskComment.findUnique({
    where: { id: commentId },
  });
  if (!existing) throw new Error("Comment not found");

  const isAuthor =
    (actorInfo.adminUserId && existing.authorAdminId === actorInfo.adminUserId) ||
    (actorInfo.memberId && existing.authorMemberId === actorInfo.memberId);

  const isManager =
    actorInfo.role === AdminRole.SUPER_ADMIN ||
    actorInfo.role === AdminRole.COMPANY_ADMIN ||
    actorInfo.role === AdminRole.TEAM_LEAD;

  if (!isAuthor && !isManager) {
    throw new Error("Unauthorized to delete this comment");
  }

  // Soft delete
  const updated = await prisma.taskComment.update({
    where: { id: commentId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      content: "[This comment was deleted / تم حذف هذا التعليق]",
    },
  });

  await prisma.taskHistory.create({
    data: {
      taskId: existing.taskId,
      actorId: actorInfo.adminUserId || null,
      action: "COMMENT_DELETED",
      metadata: { commentId },
    },
  });

  return updated;
}

export async function getTaskComments(taskId: string) {
  return await prisma.taskComment.findMany({
    where: { taskId, isDeleted: false },
    include: {
      authorAdmin: { select: { id: true, name: true, email: true, role: true } },
      authorMember: {
        select: {
          id: true,
          fullNameEn: true,
          fullNameAr: true,
          avatarUrl: true,
          jobTitleEn: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

// -----------------------------------------------------------------------------
// Deliverables & Attachments Management
// -----------------------------------------------------------------------------

export async function addDeliverableLink(input: {
  taskId: string;
  title: string;
  type: DeliverableType;
  url: string;
  authorMemberId?: string;
  authorAdminId?: string;
}) {
  if (!input.title || input.title.trim().length === 0) {
    throw new Error("Deliverable title is required");
  }
  if (!input.url || input.url.trim().length === 0) {
    throw new Error("Deliverable URL is required");
  }

  const deliverable = await prisma.taskDeliverable.create({
    data: {
      taskId: input.taskId,
      title: input.title.trim(),
      type: input.type,
      url: input.url.trim(),
      authorMemberId: input.authorMemberId || null,
      authorAdminId: input.authorAdminId || null,
      status: DeliverableStatus.SUBMITTED,
    },
  });

  await prisma.taskHistory.create({
    data: {
      taskId: input.taskId,
      actorId: input.authorAdminId || null,
      action: "DELIVERABLE_SUBMITTED",
      metadata: { deliverableId: deliverable.id, type: deliverable.type, title: deliverable.title },
    },
  });

  return deliverable;
}

export async function addDeliverableUpload(input: {
  taskId: string;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  authorMemberId?: string;
  authorAdminId?: string;
}) {
  const deliverable = await prisma.taskDeliverable.create({
    data: {
      taskId: input.taskId,
      title: input.title.trim(),
      type: DeliverableType.FILE_UPLOAD,
      fileName: input.fileName,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      storageKey: input.storageKey,
      authorMemberId: input.authorMemberId || null,
      authorAdminId: input.authorAdminId || null,
      status: DeliverableStatus.SUBMITTED,
    },
  });

  await prisma.taskHistory.create({
    data: {
      taskId: input.taskId,
      actorId: input.authorAdminId || null,
      action: "DELIVERABLE_SUBMITTED",
      metadata: {
        deliverableId: deliverable.id,
        type: DeliverableType.FILE_UPLOAD,
        fileName: input.fileName,
      },
    },
  });

  return deliverable;
}

export async function reviewDeliverable(
  deliverableId: string,
  input: {
    status: DeliverableStatus;
    reviewNotes?: string;
    reviewerId: string;
  }
) {
  const updated = await prisma.taskDeliverable.update({
    where: { id: deliverableId },
    data: {
      status: input.status,
      reviewNotes: input.reviewNotes?.trim() || null,
      reviewedById: input.reviewerId,
      reviewedAt: new Date(),
    },
  });

  await prisma.taskHistory.create({
    data: {
      taskId: updated.taskId,
      actorId: input.reviewerId,
      action: "DELIVERABLE_REVIEWED",
      metadata: {
        deliverableId: updated.id,
        status: updated.status,
        notes: input.reviewNotes,
      },
    },
  });

  return updated;
}

// -----------------------------------------------------------------------------
// Formal Review & Approval Workflow
// -----------------------------------------------------------------------------

export async function submitTaskForReview(
  taskId: string,
  actorInfo: { adminUserId?: string; memberId?: string; notes?: string }
) {
  const task = await prisma.companyTask.findUnique({
    where: { id: taskId },
    include: { reviewerMember: true, team: true },
  });
  if (!task) throw new Error("Task not found");

  const updated = await prisma.$transaction(async (tx) => {
    const t = await tx.companyTask.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.IN_REVIEW,
      },
    });

    await tx.taskDeliverable.updateMany({
      where: { taskId, status: DeliverableStatus.CHANGES_REQUESTED },
      data: { status: DeliverableStatus.SUBMITTED },
    });

    await tx.taskHistory.create({
      data: {
        taskId,
        actorId: actorInfo.adminUserId || null,
        action: "TASK_SUBMITTED_FOR_REVIEW",
        fromStatus: task.status,
        toStatus: TaskStatus.IN_REVIEW,
        metadata: { notes: actorInfo.notes },
      },
    });

    if (actorInfo.notes && actorInfo.notes.trim().length > 0) {
      await tx.taskComment.create({
        data: {
          taskId,
          content: `📋 [Submitted for Review / تسليم للمراجعة]: ${actorInfo.notes.trim()}`,
          authorAdminId: actorInfo.adminUserId || null,
          authorMemberId: actorInfo.memberId || null,
        },
      });
    }

    return t;
  }, { maxWait: 15000, timeout: 30000 });

  // Notify designated reviewer
  if (task.reviewerMemberId) {
    try {
      await createNotification({
        recipientMemberId: task.reviewerMemberId,
        type: "TASK_REVIEW_REQUESTED",
        title: "طلب مراجعة مهمة جاهزة / Task Ready for Review",
        message: `المهمة "${task.title}" جاهزة لمراجعتك واعتمادها`,
        link: `/admin/my-work?task=${task.id}`,
        metadata: { taskId: task.id },
      });
    } catch (e) {
      console.warn("Failed to notify reviewer:", e);
    }
  }

  return updated;
}

export async function approveTaskReview(
  taskId: string,
  reviewerInfo: { adminUserId?: string; memberId?: string; notes?: string }
) {
  const task = await prisma.companyTask.findUnique({
    where: { id: taskId },
    include: { assignedMember: true, collaborators: true },
  });
  if (!task) throw new Error("Task not found");

  const updated = await prisma.$transaction(async (tx) => {
    const t = await tx.companyTask.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.DONE,
        completedAt: new Date(),
      },
    });

    // Mark deliverables approved
    await tx.taskDeliverable.updateMany({
      where: { taskId, status: DeliverableStatus.SUBMITTED },
      data: {
        status: DeliverableStatus.APPROVED,
        reviewedById: reviewerInfo.memberId || reviewerInfo.adminUserId || null,
        reviewedAt: new Date(),
      },
    });

    await tx.taskHistory.create({
      data: {
        taskId,
        actorId: reviewerInfo.adminUserId || null,
        action: "TASK_REVIEW_APPROVED",
        fromStatus: task.status,
        toStatus: TaskStatus.DONE,
        metadata: { notes: reviewerInfo.notes },
      },
    });

    if (reviewerInfo.notes && reviewerInfo.notes.trim().length > 0) {
      await tx.taskComment.create({
        data: {
          taskId,
          content: `✅ [Review Approved / تم اعتماد المراجعة]: ${reviewerInfo.notes.trim()}`,
          authorAdminId: reviewerInfo.adminUserId || null,
          authorMemberId: reviewerInfo.memberId || null,
        },
      });
    }

    return t;
  }, { maxWait: 15000, timeout: 30000 });

  // Notify owner
  if (task.assignedMemberId) {
    try {
      await createNotification({
        recipientMemberId: task.assignedMemberId,
        type: "TASK_REVIEW_APPROVED",
        title: "تم اعتماد مراجعة المهمة / Task Review Approved",
        message: `تم اعتماد وإكمال المهمة بنجاح: "${task.title}"`,
        link: `/admin/my-work?task=${task.id}`,
        metadata: { taskId: task.id, status: TaskStatus.DONE },
      });
    } catch (e) {
      console.warn("Failed to notify task owner on approval:", e);
    }
  }

  return updated;
}

export async function requestTaskChanges(
  taskId: string,
  reviewerInfo: { adminUserId?: string; memberId?: string; feedbackNotes: string }
) {
  if (!reviewerInfo.feedbackNotes || reviewerInfo.feedbackNotes.trim().length === 0) {
    throw new Error("Feedback notes are required when requesting changes");
  }

  const task = await prisma.companyTask.findUnique({
    where: { id: taskId },
    include: { assignedMember: true },
  });
  if (!task) throw new Error("Task not found");

  const updated = await prisma.$transaction(async (tx) => {
    const t = await tx.companyTask.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.IN_PROGRESS,
      },
    });

    // Mark deliverables changes requested
    await tx.taskDeliverable.updateMany({
      where: { taskId, status: DeliverableStatus.SUBMITTED },
      data: {
        status: DeliverableStatus.CHANGES_REQUESTED,
        reviewNotes: reviewerInfo.feedbackNotes.trim(),
        reviewedById: reviewerInfo.memberId || reviewerInfo.adminUserId || null,
        reviewedAt: new Date(),
      },
    });

    await tx.taskHistory.create({
      data: {
        taskId,
        actorId: reviewerInfo.adminUserId || null,
        action: "TASK_CHANGES_REQUESTED",
        fromStatus: task.status,
        toStatus: TaskStatus.IN_PROGRESS,
        metadata: { feedback: reviewerInfo.feedbackNotes },
      },
    });

    await tx.taskComment.create({
      data: {
        taskId,
        content: `⚠️ [Changes Requested / طلب تعديلات]: ${reviewerInfo.feedbackNotes.trim()}`,
        authorAdminId: reviewerInfo.adminUserId || null,
        authorMemberId: reviewerInfo.memberId || null,
      },
    });

    return t;
  }, { maxWait: 15000, timeout: 30000 });

  // Notify owner
  if (task.assignedMemberId) {
    try {
      await createNotification({
        recipientMemberId: task.assignedMemberId,
        type: "TASK_CHANGES_REQUESTED",
        title: "تعديلات مطلوبة على المهمة / Changes Requested on Task",
        message: `تم طلب تعديلات على مهمتك "${task.title}": ${reviewerInfo.feedbackNotes.slice(0, 100)}`,
        link: `/admin/my-work?task=${task.id}`,
        metadata: { taskId: task.id, feedback: reviewerInfo.feedbackNotes },
      });
    } catch (e) {
      console.warn("Failed to notify task owner on change request:", e);
    }
  }

  return updated;
}

// -----------------------------------------------------------------------------
// Department Announcements & Multicast
// -----------------------------------------------------------------------------

export async function broadcastDepartmentAnnouncement(
  teamId: string,
  input: {
    title: string;
    message: string;
    link?: string;
    actorAdminId?: string;
  }
) {
  const team = await prisma.companyTeam.findUnique({
    where: { id: teamId },
    include: {
      memberships: {
        where: { member: { status: "ACTIVE" } },
        include: { member: true },
      },
    },
  });

  if (!team) throw new Error("Department not found");

  const memberIds = Array.from(new Set(team.memberships.map((m) => m.memberId)));

  const notifications = await Promise.all(
    memberIds.map((memberId) =>
      createNotification({
        recipientMemberId: memberId,
        type: "TEAM_ANNOUNCEMENT",
        title: `[${team.code}] ${input.title}`,
        message: input.message,
        link: input.link || `/admin/company/departments/${team.code}`,
        metadata: { teamId: team.id, teamCode: team.code },
      })
    )
  );

  return { notifiedCount: notifications.length, teamCode: team.code };
}

// -----------------------------------------------------------------------------
// Task Queries
// -----------------------------------------------------------------------------

/**
 * Queries tasks with filtering and complete collaborative relations.
 */
export async function getTasks(options: TaskFilterOptions = {}) {
  const where: Prisma.CompanyTaskWhereInput = {};

  if (options.status) {
    where.status = options.status;
  }
  if (options.priority) {
    where.priority = options.priority;
  }
  if (options.assignedMemberId) {
    where.assignedMemberId = options.assignedMemberId;
  }
  if (options.collaboratorMemberId) {
    where.collaborators = {
      some: { memberId: options.collaboratorMemberId },
    };
  }
  if (options.reviewerMemberId) {
    where.reviewerMemberId = options.reviewerMemberId;
  }
  if (options.teamId) {
    where.teamId = options.teamId;
  }
  if (options.projectId) {
    where.projectId = options.projectId;
  }
  if (options.search) {
    where.OR = [
      { title: { contains: options.search, mode: "insensitive" } },
      { description: { contains: options.search, mode: "insensitive" } },
    ];
  }

  return await prisma.companyTask.findMany({
    where,
    include: {
      assignedMember: true,
      reviewerMember: true,
      team: true,
      project: true,
      collaborators: {
        include: {
          member: true,
        },
      },
      checklistItems: {
        orderBy: { order: "asc" },
      },
      comments: {
        where: { isDeleted: false },
        include: {
          authorAdmin: { select: { id: true, name: true, email: true, role: true } },
          authorMember: {
            select: {
              id: true,
              fullNameEn: true,
              fullNameAr: true,
              avatarUrl: true,
              jobTitleEn: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      deliverables: {
        include: {
          authorMember: {
            select: { id: true, fullNameEn: true, fullNameAr: true, avatarUrl: true },
          },
          authorAdmin: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      history: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
}

/**
 * Gets a task with its complete collaboration and history relations.
 */
export async function getTaskById(taskId: string) {
  return await prisma.companyTask.findUnique({
    where: { id: taskId },
    include: {
      assignedMember: true,
      reviewerMember: true,
      team: true,
      project: true,
      collaborators: {
        include: {
          member: true,
        },
      },
      checklistItems: {
        orderBy: { order: "asc" },
      },
      comments: {
        where: { isDeleted: false },
        include: {
          authorAdmin: { select: { id: true, name: true, email: true, role: true } },
          authorMember: {
            select: {
              id: true,
              fullNameEn: true,
              fullNameAr: true,
              avatarUrl: true,
              jobTitleEn: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      deliverables: {
        include: {
          authorMember: {
            select: { id: true, fullNameEn: true, fullNameAr: true, avatarUrl: true },
          },
          authorAdmin: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      history: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
