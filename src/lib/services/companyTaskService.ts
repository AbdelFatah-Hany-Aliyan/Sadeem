import prisma from "@/lib/prisma";
import {
  TaskPriority,
  TaskStatus,
  Prisma,
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
  reviewerMemberId?: string;
  teamId?: string;
  projectId?: string;
  search?: string;
}

/**
 * Validates state transition logic.
 * If reviewRequired is true, moving to DONE directly from IN_PROGRESS is blocked
 * unless user submits to IN_REVIEW first.
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

  // If review is required, cannot go straight from IN_PROGRESS to DONE
  if (reviewRequired && current === TaskStatus.IN_PROGRESS && target === TaskStatus.DONE) {
    return {
      valid: false,
      reason: "This task requires formal review. Please submit to IN_REVIEW first.",
    };
  }

  return { valid: true };
}

/**
 * Creates a new company task, logs history, and dispatches notification if assigned.
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
        },
      },
    });

    return newTask;
  });

  // Notify assigned member if present
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
      },
    });

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
  });

  // Handle notifications
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

  if (input.status && input.status !== existing.status) {
    // If submitted for review
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

    // If status changed
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

/**
 * Queries tasks with filtering and pagination.
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
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
}

/**
 * Gets a task with its complete history.
 */
export async function getTaskById(taskId: string) {
  return await prisma.companyTask.findUnique({
    where: { id: taskId },
    include: {
      assignedMember: true,
      reviewerMember: true,
      team: true,
      project: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      history: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
