import prisma from "@/lib/prisma";
import {
  RecommendationType,
  TaskPriority,
  RecommendationStatus,
  RecommendationVisibility,
  Prisma,
} from "@prisma/client";
import { createNotification } from "./notificationService";

export interface CreateRecommendationInput {
  targetMemberId: string;
  authorId?: string;
  type?: RecommendationType;
  text: string;
  priority?: TaskPriority;
  visibility?: RecommendationVisibility;
  relatedProjectId?: string | null;
}

export interface RecommendationFilterOptions {
  targetMemberId?: string;
  authorId?: string;
  type?: RecommendationType;
  status?: RecommendationStatus;
  visibility?: RecommendationVisibility;
  relatedProjectId?: string;
  isMemberView?: boolean;
}

/**
 * Creates an administrative recommendation and notifies the target member if visible to them.
 */
export async function createRecommendation(
  input: CreateRecommendationInput,
  authorAdminId?: string
) {
  if (!input.text || input.text.trim().length === 0) {
    throw new Error("Recommendation text is required");
  }

  const recommendation = await prisma.administrativeRecommendation.create({
    data: {
      targetMemberId: input.targetMemberId,
      authorId: authorAdminId || input.authorId || null,
      type: input.type || RecommendationType.GUIDANCE,
      text: input.text.trim(),
      priority: input.priority || TaskPriority.MEDIUM,
      status: RecommendationStatus.PROPOSED,
      visibility: input.visibility || RecommendationVisibility.SHARED_WITH_MEMBER,
      relatedProjectId: input.relatedProjectId || null,
    },
    include: {
      targetMember: true,
      author: {
        select: { id: true, name: true, email: true },
      },
      relatedProject: true,
    },
  });

  // If visible to the member, send an in-app notification
  if (recommendation.visibility !== RecommendationVisibility.PRIVATE_MANAGEMENT) {
    try {
      await createNotification({
        recipientMemberId: recommendation.targetMemberId,
        type: "RECOMMENDATION_ISSUED",
        title: "توجيه إداري جديد / New Administrative Guidance",
        message: `تلقيت توجيهاً جديداً: ${recommendation.text.slice(0, 100)}...`,
        link: `/admin/my-work?recommendation=${recommendation.id}`,
        metadata: { recommendationId: recommendation.id },
      });
    } catch (e) {
      console.warn("Failed to dispatch recommendation notification:", e);
    }
  }

  return recommendation;
}

/**
 * Target member acknowledges receipt of a recommendation.
 */
export async function acknowledgeRecommendation(
  recommendationId: string,
  memberId: string
) {
  const existing = await prisma.administrativeRecommendation.findUnique({
    where: { id: recommendationId },
  });

  if (!existing) {
    throw new Error("Recommendation not found");
  }

  if (existing.targetMemberId !== memberId) {
    throw new Error("You can only acknowledge recommendations addressed to you");
  }

  return await prisma.administrativeRecommendation.update({
    where: { id: recommendationId },
    data: {
      status: RecommendationStatus.ACKNOWLEDGED,
      acknowledgedAt: new Date(),
    },
  });
}

/**
 * Archives a recommendation (management action).
 */
export async function archiveRecommendation(recommendationId: string) {
  return await prisma.administrativeRecommendation.update({
    where: { id: recommendationId },
    data: {
      status: RecommendationStatus.ARCHIVED,
    },
  });
}

/**
 * Queries recommendations with visibility scoping.
 */
export async function getRecommendations(options: RecommendationFilterOptions = {}) {
  const where: Prisma.AdministrativeRecommendationWhereInput = {};

  if (options.targetMemberId) {
    where.targetMemberId = options.targetMemberId;
  }
  if (options.authorId) {
    where.authorId = options.authorId;
  }
  if (options.type) {
    where.type = options.type;
  }
  if (options.status) {
    where.status = options.status;
  }
  if (options.relatedProjectId) {
    where.relatedProjectId = options.relatedProjectId;
  }

  // If viewing from member workspace, NEVER reveal confidential management notes
  if (options.isMemberView) {
    where.visibility = {
      not: RecommendationVisibility.PRIVATE_MANAGEMENT,
    };
  } else if (options.visibility) {
    where.visibility = options.visibility;
  }

  return await prisma.administrativeRecommendation.findMany({
    where,
    include: {
      targetMember: true,
      author: {
        select: { id: true, name: true, email: true },
      },
      relatedProject: true,
    },
    orderBy: [{ createdAt: "desc" }],
  });
}
