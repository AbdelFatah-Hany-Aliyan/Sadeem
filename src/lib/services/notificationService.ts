import { prisma } from "@/lib/prisma";
import { CompanyNotificationType, Prisma } from "@prisma/client";

export interface CreateNotificationInput {
  recipientAdminId?: string | null;
  recipientMemberId?: string | null;
  type: CompanyNotificationType;
  title: string;
  message: string;
  link?: string | null;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Creates an in-app company notification.
 */
export async function createNotification(input: CreateNotificationInput) {
  if (!input.recipientAdminId && !input.recipientMemberId) {
    throw new Error("Notification requires at least one recipient (Admin or Member)");
  }

  return await prisma.companyNotification.create({
    data: {
      recipientAdminId: input.recipientAdminId || null,
      recipientMemberId: input.recipientMemberId || null,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link || null,
      metadata: input.metadata || Prisma.JsonNull,
    },
  });
}

/**
 * Broadcasts a notification to all active super/company admins.
 */
export async function notifyAdmins(
  type: CompanyNotificationType,
  title: string,
  message: string,
  link?: string,
  metadata?: Prisma.InputJsonValue
) {
  const admins = await prisma.adminUser.findMany({
    where: {
      isActive: true,
      role: { in: ["SUPER_ADMIN", "COMPANY_ADMIN"] },
    },
    select: { id: true },
  });

  if (admins.length === 0) return [];

  const created = await Promise.all(
    admins.map((admin) =>
      prisma.companyNotification.create({
        data: {
          recipientAdminId: admin.id,
          type,
          title,
          message,
          link: link || null,
          metadata: metadata || Prisma.JsonNull,
        },
      })
    )
  );

  return created;
}

/**
 * Gets notifications for a user (either by admin user ID or company member ID).
 */
export async function getUserNotifications(params: {
  adminUserId?: string;
  memberId?: string;
  limit?: number;
  unreadOnly?: boolean;
}) {
  const { adminUserId, memberId, limit = 50, unreadOnly = false } = params;

  if (!adminUserId && !memberId) {
    return [];
  }

  const where: Prisma.CompanyNotificationWhereInput = {
    OR: [
      ...(adminUserId ? [{ recipientAdminId: adminUserId }] : []),
      ...(memberId ? [{ recipientMemberId: memberId }] : []),
    ],
    ...(unreadOnly ? { read: false } : {}),
  };

  return await prisma.companyNotification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Gets the count of unread notifications for a user.
 */
export async function getUnreadNotificationCount(params: {
  adminUserId?: string;
  memberId?: string;
}) {
  const { adminUserId, memberId } = params;

  if (!adminUserId && !memberId) {
    return 0;
  }

  return await prisma.companyNotification.count({
    where: {
      OR: [
        ...(adminUserId ? [{ recipientAdminId: adminUserId }] : []),
        ...(memberId ? [{ recipientMemberId: memberId }] : []),
      ],
      read: false,
    },
  });
}

/**
 * Marks a notification as read.
 */
export async function markNotificationAsRead(
  notificationId: string,
  recipientInfo?: { adminUserId?: string; memberId?: string }
) {
  const where: Prisma.CompanyNotificationWhereUniqueInput = { id: notificationId };

  // If recipientInfo provided, verify ownership
  if (recipientInfo) {
    const existing = await prisma.companyNotification.findUnique({
      where,
    });
    if (!existing) return null;

    const matchesAdmin =
      recipientInfo.adminUserId &&
      existing.recipientAdminId === recipientInfo.adminUserId;
    const matchesMember =
      recipientInfo.memberId &&
      existing.recipientMemberId === recipientInfo.memberId;

    if (!matchesAdmin && !matchesMember) {
      throw new Error("Unauthorized to mark this notification as read");
    }
  }

  return await prisma.companyNotification.update({
    where,
    data: {
      read: true,
      readAt: new Date(),
    },
  });
}

/**
 * Marks all notifications as read for a user.
 */
export async function markAllNotificationsAsRead(params: {
  adminUserId?: string;
  memberId?: string;
}) {
  const { adminUserId, memberId } = params;

  if (!adminUserId && !memberId) return { count: 0 };

  return await prisma.companyNotification.updateMany({
    where: {
      OR: [
        ...(adminUserId ? [{ recipientAdminId: adminUserId }] : []),
        ...(memberId ? [{ recipientMemberId: memberId }] : []),
      ],
      read: false,
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
}
