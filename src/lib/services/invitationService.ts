/**
 * SADEEM — MEMBER INVITATION STATE MACHINE SERVICE
 * 
 * Cryptographically secure invitation tokens, atomic state transitions,
 * zero GET prefetch side-effects, and durable notification dispatch.
 */

import crypto from "crypto";
import prisma from "@/lib/prisma";
import { InvitationStatus, EmailDeliveryStatus, MemberStatus, CompanyNotificationType } from "@prisma/client";
import { sendMemberInvitationEmail, isEmailConfigured } from "@/lib/email/emailService";

export { isEmailConfigured };

export type InvitationLifecycleStatus =
  | "INVITATION_CREATED"
  | "EMAIL_QUEUED"
  | "BLOCKED_CONFIGURATION"
  | "SEND_FAILED"
  | "ACCEPTED_BY_PROVIDER"
  | "DELIVERED"
  | "INVITATION_ACCEPTED";

export interface InvitationLifecycleInfo {
  status: InvitationLifecycleStatus;
  labelAr: string;
  labelEn: string;
  badgeClass: string;
  dotClass: string;
  descriptionAr: string;
  descriptionEn: string;
  canRetry: boolean;
}

/**
 * Resolves the operational lifecycle state of an invitation for UI display and audit.
 * Distinguishes created, queued, blocked, failed, provider-accepted, verified-delivered, and candidate-accepted states.
 */
export function resolveInvitationLifecycle(invitation: {
  status: InvitationStatus;
  deliveryStatus: EmailDeliveryStatus;
  sentAt?: Date | null;
  failureReason?: string | null;
  isVerifiedDelivered?: boolean;
}): InvitationLifecycleInfo {
  // 1. Candidate accepted
  if (invitation.status === InvitationStatus.ACCEPTED) {
    return {
      status: "INVITATION_ACCEPTED",
      labelAr: "تم قبول الدعوة (بانتظار الاعتماد)",
      labelEn: "INVITATION ACCEPTED",
      badgeClass: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
      dotClass: "bg-emerald-400",
      descriptionAr: "أكد المرشح رغبته بالانضمام، وهي الآن بانتظار مراجعة الإدارة والاعتماد.",
      descriptionEn: "Candidate accepted the invitation; awaiting manager review and approval.",
      canRetry: false,
    };
  }

  // 2. Blocked configuration (Resend key missing or domain unconfigured)
  if (invitation.deliveryStatus === EmailDeliveryStatus.BLOCKED_CONFIGURATION) {
    return {
      status: "BLOCKED_CONFIGURATION",
      labelAr: "محظور — مزود البريد غير مهيأ",
      labelEn: "BLOCKED CONFIGURATION",
      badgeClass: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
      dotClass: "bg-amber-400",
      descriptionAr: invitation.failureReason || "لم يتم ضبط مفتاح RESEND_API_KEY أو النطاق في بيئة العمل.",
      descriptionEn: "Transactional email provider is unconfigured. Real email safely blocked.",
      canRetry: true,
    };
  }

  // 3. Failed delivery
  if (invitation.deliveryStatus === EmailDeliveryStatus.FAILED) {
    return {
      status: "SEND_FAILED",
      labelAr: "فشل الإرسال",
      labelEn: "SEND FAILED",
      badgeClass: "bg-red-500/15 text-red-400 border border-red-500/30",
      dotClass: "bg-red-400",
      descriptionAr: invitation.failureReason || "تعذر إرسال البريد عبر المزود الخارجي.",
      descriptionEn: invitation.failureReason || "Provider failed to send invitation email.",
      canRetry: true,
    };
  }

  // 4. Delivered (verified delivery confirmed by provider webhook)
  if (invitation.deliveryStatus === EmailDeliveryStatus.DELIVERED && invitation.isVerifiedDelivered) {
    return {
      status: "DELIVERED",
      labelAr: "تم التسليم بنجاح (مؤكد)",
      labelEn: "DELIVERED",
      badgeClass: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
      dotClass: "bg-emerald-300",
      descriptionAr: "تم تسليم الرسالة لصندوق بريد المستلم بنجاح.",
      descriptionEn: "Mailbox delivery confirmed.",
      canRetry: false,
    };
  }

  // 5. Accepted by provider (HTTP 200 from Resend API with providerId, queued for dispatch)
  if (invitation.deliveryStatus === EmailDeliveryStatus.DELIVERED && invitation.sentAt) {
    return {
      status: "ACCEPTED_BY_PROVIDER",
      labelAr: "مقبول لدى المزود (قيد الإرسال)",
      labelEn: "ACCEPTED BY PROVIDER",
      badgeClass: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
      dotClass: "bg-blue-400",
      descriptionAr: "استلم مزود البريد الرسالة وجاري معالجتها للتسليم.",
      descriptionEn: "Dispatched to provider queue. Awaiting final mailbox receipt.",
      canRetry: false,
    };
  }

  // 6. Queued in outbox
  if (invitation.deliveryStatus === EmailDeliveryStatus.PENDING && invitation.sentAt === null && invitation.failureReason === "QUEUED") {
    return {
      status: "EMAIL_QUEUED",
      labelAr: "في قائمة انتظار الإرسال",
      labelEn: "EMAIL QUEUED",
      badgeClass: "bg-sky-500/15 text-sky-400 border border-sky-500/30",
      dotClass: "bg-sky-400",
      descriptionAr: "الرسالة مجدولة في صندوق الإرسال وتنتظر المعالجة.",
      descriptionEn: "Invitation email queued in durable outbox.",
      canRetry: true,
    };
  }

  // 7. Created but email not queued / pending
  return {
    status: "INVITATION_CREATED",
    labelAr: "تم إنشاء الدعوة",
    labelEn: "INVITATION CREATED",
    badgeClass: "bg-stone-500/15 text-stone-300 border border-border",
    dotClass: "bg-stone-400",
    descriptionAr: "تم إنشاء سجل الدعوة وتوليد الرمز المشفر بنجاح.",
    descriptionEn: "Invitation record created with encrypted token.",
    canRetry: true,
  };
}

export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function generateSecureToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  return { rawToken, tokenHash };
}

/**
 * Creates and dispatches an invitation for a CompanyMember.
 * Idempotent guard: if an active PENDING invitation already exists, it is renewed or reused safely.
 */
export async function createAndSendInvitation(options: {
  memberId: string;
  email: string;
  invitedById?: string;
  expiresInDays?: number;
}) {
  const { memberId, email, invitedById, expiresInDays = 7 } = options;
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Fetch member details
  const member = await prisma.companyMember.findUnique({
    where: { id: memberId },
    include: {
      memberships: {
        where: { isPrimary: true },
        include: { team: true },
      },
    },
  });

  if (!member) {
    throw new Error(`Member with ID '${memberId}' not found.`);
  }

  // Pre-condition guards: prevent sending invitations to archived members
  if (member.status === MemberStatus.ARCHIVED) {
    throw new Error("Cannot send invitation: Member is archived.");
  }

  const primaryTeam = member.memberships[0]?.team;
  const teamNameAr = primaryTeam?.nameAr || "شركة سديم";
  const teamNameEn = primaryTeam?.nameEn || "Sadeem";

  // 2. Generate new cryptographically secure token and expiration
  const { rawToken, tokenHash } = generateSecureToken();
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  // 3. Atomically revoke prior pending invitations and create new invitation
  const invitation = await prisma.$transaction(async (tx) => {
    // Atomically revoke any existing active/pending invitations for this member
    await tx.memberInvitation.updateMany({
      where: {
        memberId,
        status: InvitationStatus.PENDING,
      },
      data: {
        status: InvitationStatus.REVOKED,
      },
    });

    // Create the new invitation with rotated tokenHash
    const newInv = await tx.memberInvitation.create({
      data: {
        memberId,
        email: normalizedEmail,
        tokenHash,
        status: InvitationStatus.PENDING,
        deliveryStatus: EmailDeliveryStatus.PENDING,
        expiresAt,
        invitedById: invitedById || null,
      },
    });

    // Advance member status to INVITED
    await tx.companyMember.update({
      where: { id: memberId },
      data: { status: MemberStatus.INVITED },
    });

    return newInv;
  });

  // 4. Attempt transactional email delivery (outside TX to prevent holding locks during network I/O)
  const deliveryResult = await sendMemberInvitationEmail(normalizedEmail, rawToken, {
    memberName: member.fullNameAr || member.fullNameEn,
    jobTitle: member.jobTitleAr || member.jobTitleEn,
    teamNameAr,
    teamNameEn,
  });

  // 5. Update invitation delivery status based on provider outcome
  await prisma.memberInvitation.update({
    where: { id: invitation.id },
    data: {
      deliveryStatus: deliveryResult.deliveryStatus,
      sentAt: deliveryResult.success ? new Date() : null,
      failureReason: deliveryResult.error || null,
    },
  });

  return {
    invitationId: invitation.id,
    rawToken, // Provided only to caller for offline / testing purposes; never logged or persisted raw
    tokenHash,
    deliveryResult,
  };
}

/**
 * Public verification: Validates token without consuming it (GET safe).
 */
export async function verifyInvitationToken(rawToken: string) {
  if (!rawToken || rawToken.trim().length === 0) {
    return { valid: false, reason: "INVALID_TOKEN" as const, invitation: null };
  }

  const tokenHash = hashToken(rawToken);

  const invitation = await prisma.memberInvitation.findUnique({
    where: { tokenHash },
    include: {
      member: {
        include: {
          memberships: {
            where: { isPrimary: true },
            include: { team: true },
          },
        },
      },
    },
  });

  if (!invitation) {
    return { valid: false, reason: "NOT_FOUND" as const, invitation: null };
  }

  if (invitation.status === InvitationStatus.ACCEPTED) {
    return { valid: false, reason: "ALREADY_ACCEPTED" as const, invitation };
  }

  if (invitation.status === InvitationStatus.DECLINED) {
    return { valid: false, reason: "ALREADY_DECLINED" as const, invitation };
  }

  if (invitation.status === InvitationStatus.REVOKED) {
    return { valid: false, reason: "REVOKED" as const, invitation };
  }

  if (new Date() > invitation.expiresAt) {
    if (invitation.status === InvitationStatus.PENDING) {
      await prisma.memberInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
    }
    return { valid: false, reason: "EXPIRED" as const, invitation };
  }

  return { valid: true, reason: null, invitation };
}

/**
 * Public action: Accept invitation (POST only).
 * Records member acceptance and notifies administrators for review.
 * Does NOT automatically approve or grant login access.
 */
export async function acceptInvitation(rawToken: string) {
  const check = await verifyInvitationToken(rawToken);
  if (!check.valid || !check.invitation) {
    throw new Error(`Cannot accept invitation: ${check.reason}`);
  }

  const invitation = check.invitation;

  // 1. Atomically mark invitation ACCEPTED
  await prisma.memberInvitation.update({
    where: { id: invitation.id },
    data: {
      status: InvitationStatus.ACCEPTED,
      acceptedAt: new Date(),
    },
  });

  // 2. Update Member status to ACCEPTED
  await prisma.companyMember.update({
    where: { id: invitation.memberId },
    data: {
      status: MemberStatus.ACCEPTED,
    },
  });

  // 3. Notify inviting admin and super admins
  const memberName = invitation.member.fullNameAr || invitation.member.fullNameEn;
  const teamName = invitation.member.memberships[0]?.team.nameAr || "فريق سديم";

  const notificationTitle = `تأكيد رغبة الانضمام: ${memberName}`;
  const notificationMessage = `أكد ${memberName} رغبته بالانضمام إلى ${teamName}. الدعوة بانتظار مراجعتك والموافقة على تفعيل العضوية.`;

  // Direct notification to inviting admin if present
  if (invitation.invitedById) {
    await prisma.companyNotification.create({
      data: {
        recipientAdminId: invitation.invitedById,
        type: CompanyNotificationType.INVITATION_ACCEPTED,
        title: notificationTitle,
        message: notificationMessage,
        link: `/admin/company/members/${invitation.memberId}`,
        metadata: {
          memberId: invitation.memberId,
          invitationId: invitation.id,
        },
      },
    });
  }

  // Also broadcast notification to SUPER_ADMIN users
  const superAdmins = await prisma.adminUser.findMany({
    where: {
      role: "SUPER_ADMIN",
      id: invitation.invitedById ? { not: invitation.invitedById } : undefined,
    },
    select: { id: true },
  });

  for (const admin of superAdmins) {
    await prisma.companyNotification.create({
      data: {
        recipientAdminId: admin.id,
        type: CompanyNotificationType.INVITATION_ACCEPTED,
        title: notificationTitle,
        message: notificationMessage,
        link: `/admin/company/members/${invitation.memberId}`,
        metadata: {
          memberId: invitation.memberId,
          invitationId: invitation.id,
        },
      },
    });
  }

  return { success: true };
}

/**
 * Public action: Decline invitation (POST only).
 */
export async function declineInvitation(rawToken: string) {
  const check = await verifyInvitationToken(rawToken);
  if (!check.valid || !check.invitation) {
    throw new Error(`Cannot decline invitation: ${check.reason}`);
  }

  const invitation = check.invitation;

  await prisma.memberInvitation.update({
    where: { id: invitation.id },
    data: {
      status: InvitationStatus.DECLINED,
      declinedAt: new Date(),
    },
  });

  await prisma.companyMember.update({
    where: { id: invitation.memberId },
    data: {
      status: MemberStatus.ARCHIVED,
    },
  });

  return { success: true };
}
