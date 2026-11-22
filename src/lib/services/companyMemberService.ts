/**
 * SADEEM — COMPANY MEMBER MANAGEMENT SERVICE
 * 
 * End-to-end lifecycle for company members: onboarding, approval, dashboard provisioning,
 * secure activation, password initialization, and immediate session invalidation on suspension.
 */

import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { 
  AdminRole, 
  MemberStatus, 
  MembershipType, 
  TeamRole, 
  CompanyNotificationType 
} from "@prisma/client";
import { requirePermission, hasPermission } from "@/lib/auth/permissions";
import { CurrentUserSession } from "@/lib/auth/session";
import { createAndSendInvitation, hashToken, generateSecureToken } from "./invitationService";
import { sendAccountActivationEmail } from "@/lib/email/emailService";

export interface CreateMemberInput {
  fullNameEn: string;
  fullNameAr?: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  jobTitleEn: string;
  jobTitleAr?: string;
  membershipType?: MembershipType;
  primaryTeamId: string;
  teamRole?: TeamRole;
  additionalTeamIds?: string[];
  projectIds?: string[];
  internalNotes?: string;
  sendInviteImmediately?: boolean;
}

export interface ApproveMemberOptions {
  memberId: string;
  assignedRole?: AdminRole;
  grantDashboardAccess: boolean;
  notes?: string;
}

/**
 * Creates a new company member.
 */
export async function createCompanyMember(
  input: CreateMemberInput,
  actorSession: CurrentUserSession
) {
  // 1. Authorization check
  if (!actorSession || !hasPermission(actorSession.role, "members:create")) throw new Error("FORBIDDEN: Permission members:create required");

  const normalizedEmail = input.email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("A valid email address is required.");
  }
  if (!input.fullNameEn || input.fullNameEn.trim().length === 0) {
    throw new Error("Full English name is required.");
  }
  if (!input.primaryTeamId) {
    throw new Error("Primary team assignment is required.");
  }

  // 2. Prevent duplicate CompanyMember identity by email
  const existingMember = await prisma.companyMember.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingMember) {
    throw new Error(
      `A company member with email '${normalizedEmail}' already exists. To add them to another team, edit their existing profile.`
    );
  }

  // 3. Generate internal employeeId if absent
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const employeeId = `SAD-${new Date().getFullYear().toString().slice(-2)}-${randomSuffix}`;

  // 4. Create Member and primary TeamMembership in a transaction
  const member = await prisma.$transaction(async (tx) => {
    const created = await tx.companyMember.create({
      data: {
        employeeId,
        fullNameEn: input.fullNameEn.trim(),
        fullNameAr: input.fullNameAr?.trim() || null,
        email: normalizedEmail,
        phone: input.phone?.trim() || null,
        avatarUrl: input.avatarUrl || null,
        jobTitleEn: input.jobTitleEn.trim(),
        jobTitleAr: input.jobTitleAr?.trim() || null,
        membershipType: input.membershipType || MembershipType.EMPLOYEE,
        status: MemberStatus.PENDING_INVITATION,
        internalNotes: input.internalNotes?.trim() || null,
      },
    });

    // Primary team membership
    await tx.teamMembership.create({
      data: {
        memberId: created.id,
        teamId: input.primaryTeamId,
        isPrimary: true,
        teamRole: input.teamRole || TeamRole.MEMBER,
      },
    });

    // Additional secondary team memberships if specified
    if (input.additionalTeamIds && input.additionalTeamIds.length > 0) {
      for (const teamId of input.additionalTeamIds) {
        if (teamId !== input.primaryTeamId) {
          await tx.teamMembership.create({
            data: {
              memberId: created.id,
              teamId,
              isPrimary: false,
              teamRole: TeamRole.MEMBER,
            },
          });
        }
      }
    }

    // Project assignments if specified
    if (input.projectIds && input.projectIds.length > 0) {
      for (const projectId of input.projectIds) {
        await tx.memberProjectAssignment.create({
          data: {
            memberId: created.id,
            projectId,
          },
        });
      }
    }

    // Record audit log
    await tx.auditLog.create({
      data: {
        userId: actorSession.userId,
        action: "COMPANY_MEMBER_CREATED",
        entityType: "CompanyMember",
        entityId: created.id,
        details: {
          email: normalizedEmail,
          primaryTeamId: input.primaryTeamId,
          invitedBy: actorSession.email,
        },
      },
    });

    return created;
  });

  // 5. Send invitation immediately if requested
  let inviteResult = null;
  if (input.sendInviteImmediately !== false) {
    inviteResult = await createAndSendInvitation({
      memberId: member.id,
      email: normalizedEmail,
      invitedById: actorSession.userId,
    });
  }

  return {
    member,
    inviteResult,
  };
}

/**
 * Approves a company member after they have accepted their invitation.
 * Optionally provisions or links an AdminUser and dispatches an Account Activation Token.
 */
export async function approveCompanyMember(
  options: ApproveMemberOptions,
  actorSession: CurrentUserSession
) {
  // 1. Authorization check
  if (!actorSession || !hasPermission(actorSession.role, "members:approve")) throw new Error("FORBIDDEN: Permission members:approve required");

  const { memberId, assignedRole = AdminRole.TEAM_MEMBER, grantDashboardAccess } = options;

  const member = await prisma.companyMember.findUnique({
    where: { id: memberId },
    include: { adminUser: true },
  });

  if (!member) {
    throw new Error(`Member '${memberId}' not found.`);
  }

  // Security Invariant: Only SUPER_ADMIN can assign SUPER_ADMIN or COMPANY_ADMIN roles
  if (
    (assignedRole === AdminRole.SUPER_ADMIN || assignedRole === AdminRole.COMPANY_ADMIN) &&
    actorSession.role !== AdminRole.SUPER_ADMIN
  ) {
    throw new Error("FORBIDDEN: Only SUPER_ADMIN can grant administrative system privileges.");
  }

  let activationRawToken: string | null = null;

  await prisma.$transaction(async (tx) => {
    // 1. Update Member status
    const newMemberStatus = grantDashboardAccess ? MemberStatus.APPROVED : MemberStatus.ACTIVE;
    await tx.companyMember.update({
      where: { id: memberId },
      data: { status: newMemberStatus },
    });

    // 2. If dashboard access is granted, provision or link AdminUser
    if (grantDashboardAccess) {
      let adminUserId = member.adminUser?.id;

      if (!adminUserId) {
        // Check if an AdminUser already exists for this email
        const existingAdmin = await tx.adminUser.findUnique({
          where: { email: member.email },
        });

        if (existingAdmin) {
          // Link existing AdminUser
          await tx.adminUser.update({
            where: { id: existingAdmin.id },
            data: {
              companyMemberId: memberId,
              role: assignedRole,
            },
          });
          adminUserId = existingAdmin.id;
        } else {
          // Provision new AdminUser in disabled state (isActive = false) with a random dummy password hash
          const dummyHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
          const newAdmin = await tx.adminUser.create({
            data: {
              email: member.email,
              name: member.fullNameAr || member.fullNameEn,
              passwordHash: dummyHash,
              role: assignedRole,
              isActive: false, // Remains disabled until activation token is redeemed
              companyMemberId: memberId,
            },
          });
          adminUserId = newAdmin.id;
        }
      } else {
        // Update role on already-linked AdminUser
        await tx.adminUser.update({
          where: { id: adminUserId },
          data: { role: assignedRole },
        });
      }

      // 3. Generate single-use AccountActivationToken (24 hour expiration)
      const { rawToken, tokenHash } = generateSecureToken();
      activationRawToken = rawToken;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Clean up previous unused activation tokens
      await tx.accountActivationToken.deleteMany({
        where: { memberId, consumedAt: null },
      });

      await tx.accountActivationToken.create({
        data: {
          memberId,
          tokenHash,
          expiresAt,
        },
      });
    }

    // 4. Audit Log
    await tx.auditLog.create({
      data: {
        userId: actorSession.userId,
        action: "COMPANY_MEMBER_APPROVED",
        entityType: "CompanyMember",
        entityId: memberId,
        details: {
          grantDashboardAccess,
          assignedRole,
          approvedBy: actorSession.email,
        },
      },
    });

    // 5. In-app notification
    await tx.companyNotification.create({
      data: {
        recipientMemberId: memberId,
        type: CompanyNotificationType.MEMBER_APPROVED,
        title: "تم اعتماد عضويتك في سديم",
        message: grantDashboardAccess
          ? "تمت الموافقة على عضويتك وتفعيل أهليتك للوصول إلى لوحة التحكم."
          : "تمت الموافقة على عضويتك في فريق سديم.",
        link: `/admin/company/members/${memberId}`,
      },
    });
  });

  // 6. Send activation email if dashboard access is approved
  if (grantDashboardAccess && activationRawToken) {
    await sendAccountActivationEmail(
      member.email,
      activationRawToken,
      member.fullNameAr || member.fullNameEn
    );
  }

  return {
    success: true,
    activationRawToken,
  };
}

/**
 * Rejects a member approval.
 */
export async function rejectCompanyMember(
  memberId: string,
  reason: string,
  actorSession: CurrentUserSession
) {
  if (!actorSession || !hasPermission(actorSession.role, "members:approve")) throw new Error("FORBIDDEN: Permission members:approve required");

  await prisma.$transaction(async (tx) => {
    await tx.companyMember.update({
      where: { id: memberId },
      data: { status: MemberStatus.ARCHIVED },
    });

    await tx.auditLog.create({
      data: {
        userId: actorSession.userId,
        action: "COMPANY_MEMBER_REJECTED",
        entityType: "CompanyMember",
        entityId: memberId,
        details: { reason, rejectedBy: actorSession.email },
      },
    });
  });

  return { success: true };
}

/**
 * Public action: Redeems an AccountActivationToken to initialize the user's password and activate their login.
 * Single-use, atomic, and fail-closed.
 */
export async function activateMemberAccount(rawToken: string, passwordPlain: string) {
  if (!rawToken || rawToken.trim().length === 0) {
    throw new Error("INVALID_TOKEN: Activation token is missing.");
  }

  // Password strength validation
  if (!passwordPlain || passwordPlain.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }
  const hasUpper = /[A-Z]/.test(passwordPlain);
  const hasLower = /[a-z]/.test(passwordPlain);
  const hasDigit = /[0-9]/.test(passwordPlain);
  if (!hasUpper || !hasLower || !hasDigit) {
    throw new Error("Password must contain uppercase letters, lowercase letters, and numbers.");
  }

  const tokenHash = hashToken(rawToken);

  const activationRecord = await prisma.accountActivationToken.findUnique({
    where: { tokenHash },
    include: {
      member: {
        include: { adminUser: true },
      },
    },
  });

  if (!activationRecord) {
    throw new Error("INVALID_TOKEN: Activation token not found or already consumed.");
  }

  if (activationRecord.consumedAt !== null) {
    throw new Error("ALREADY_USED: This activation link has already been consumed.");
  }

  if (new Date() > activationRecord.expiresAt) {
    throw new Error("EXPIRED: This activation link has expired. Please ask your administrator to reissue it.");
  }

  const member = activationRecord.member;
  if (!member.adminUser) {
    throw new Error("CONFIGURATION_ERROR: No linked admin user record found for this member.");
  }

  // Securely hash password with bcrypt
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  // Atomically activate account and consume token
  await prisma.$transaction(async (tx) => {
    // 1. Consume activation token
    await tx.accountActivationToken.update({
      where: { id: activationRecord.id },
      data: { consumedAt: new Date() },
    });

    // 2. Activate AdminUser and update password
    await tx.adminUser.update({
      where: { id: member.adminUser!.id },
      data: {
        passwordHash,
        isActive: true,
        tokenVersion: { increment: 1 },
      },
    });

    // 3. Mark CompanyMember ACTIVE
    await tx.companyMember.update({
      where: { id: member.id },
      data: { status: MemberStatus.ACTIVE },
    });

    // 4. Audit Log
    await tx.auditLog.create({
      data: {
        userId: member.adminUser!.id,
        action: "ACCOUNT_ACTIVATED",
        entityType: "AdminUser",
        entityId: member.adminUser!.id,
        details: { email: member.email },
      },
    });

    // 5. In-app notification
    await tx.companyNotification.create({
      data: {
        recipientAdminId: member.adminUser!.id,
        type: CompanyNotificationType.ACCOUNT_ACTIVATED,
        title: "تم تفعيل حسابك بنجاح",
        message: "تم تفعيل حسابك ويمكنك الآن تسجيل الدخول إلى لوحة التحكم.",
        link: "/admin",
      },
    });
  });

  return {
    success: true,
    email: member.email,
  };
}

/**
 * Suspends a company member and immediately revokes all active login sessions.
 */
export async function suspendCompanyMember(
  memberId: string,
  reason: string,
  actorSession: CurrentUserSession
) {
  if (!actorSession || !hasPermission(actorSession.role, "members:suspend")) throw new Error("FORBIDDEN: Permission members:suspend required");

  const member = await prisma.companyMember.findUnique({
    where: { id: memberId },
    include: { adminUser: true },
  });

  if (!member) {
    throw new Error(`Member '${memberId}' not found.`);
  }

  // Guard: Cannot suspend yourself
  if (member.adminUser?.id === actorSession.userId) {
    throw new Error("FORBIDDEN: You cannot suspend your own account.");
  }

  // Guard: Only SUPER_ADMIN can suspend another SUPER_ADMIN
  if (member.adminUser?.role === AdminRole.SUPER_ADMIN && actorSession.role !== AdminRole.SUPER_ADMIN) {
    throw new Error("FORBIDDEN: Only SUPER_ADMIN can suspend a SUPER_ADMIN account.");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Set member status to SUSPENDED
    await tx.companyMember.update({
      where: { id: memberId },
      data: { status: MemberStatus.SUSPENDED },
    });

    // 2. If AdminUser is attached, deactivate and bump tokenVersion to immediately revoke all existing JWTs!
    if (member.adminUser) {
      await tx.adminUser.update({
        where: { id: member.adminUser.id },
        data: {
          isActive: false,
          tokenVersion: { increment: 1 },
        },
      });
    }

    // 3. Audit Log
    await tx.auditLog.create({
      data: {
        userId: actorSession.userId,
        action: "COMPANY_MEMBER_SUSPENDED",
        entityType: "CompanyMember",
        entityId: memberId,
        details: { reason, suspendedBy: actorSession.email },
      },
    });
  });

  return { success: true };
}

/**
 * Reactivates a suspended company member.
 */
export async function reactivateCompanyMember(
  memberId: string,
  actorSession: CurrentUserSession
) {
  if (!actorSession || !hasPermission(actorSession.role, "members:suspend")) throw new Error("FORBIDDEN: Permission members:suspend required");

  const member = await prisma.companyMember.findUnique({
    where: { id: memberId },
    include: { adminUser: true },
  });

  if (!member) {
    throw new Error(`Member '${memberId}' not found.`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.companyMember.update({
      where: { id: memberId },
      data: { status: MemberStatus.ACTIVE },
    });

    if (member.adminUser) {
      await tx.adminUser.update({
        where: { id: member.adminUser.id },
        data: { isActive: true },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: actorSession.userId,
        action: "COMPANY_MEMBER_REACTIVATED",
        entityType: "CompanyMember",
        entityId: memberId,
        details: { reactivatedBy: actorSession.email },
      },
    });
  });

  return { success: true };
}
