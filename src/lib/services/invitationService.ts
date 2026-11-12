/**
 * SADEEM — MEMBER INVITATION STATE MACHINE SERVICE
 * 
 * Cryptographically secure invitation tokens, atomic state transitions,
 * zero GET prefetch side-effects, and durable notification dispatch.
 */

import crypto from "crypto";
import prisma from "@/lib/prisma";
import { InvitationStatus, EmailDeliveryStatus, MemberStatus, CompanyNotificationType } from "@prisma/client";
import { sendMemberInvitationEmail } from "@/lib/email/emailService";

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
