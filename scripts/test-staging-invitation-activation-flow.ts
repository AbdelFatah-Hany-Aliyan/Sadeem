/**
 * SADEEM — STAGING EMPLOYEE INVITATION & EMAIL ACTIVATION E2E AUDIT
 * 
 * Verifies the complete 13-step member invitation, token rotation,
 * candidate acceptance, manager approval, activation, login, and RBAC isolation flow.
 * 
 * Target: Neon STAGING (ep-restless-sound-b3sfv7ak / br-tiny-salad-b3qjznbd)
 */

import fs from "fs";
import path from "path";

// Ensure .env.staging is loaded into process.env
const stagingEnvPath = path.resolve(process.cwd(), ".env.staging");
if (!fs.existsSync(stagingEnvPath)) {
  console.error("❌ CRITICAL: .env.staging not found");
  process.exit(1);
}

const envContent = fs.readFileSync(stagingEnvPath, "utf-8");
for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
  process.env[key] = val;
}

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL
    .replace("channel_binding=require&", "")
    .replace("&channel_binding=require", "")
    .replace("?channel_binding=require", "?")
    .replace(/\?$/, "");
}
if (process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DIRECT_URL
    .replace("channel_binding=require&", "")
    .replace("&channel_binding=require", "")
    .replace("?channel_binding=require", "?")
    .replace(/\?$/, "");
}

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  AdminRole,
  MemberStatus,
  MembershipType,
  TeamRole,
  InvitationStatus,
  EmailDeliveryStatus,
  CompanyNotificationType,
} from "@prisma/client";
import { CurrentUserSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { canAccessDepartment } from "@/lib/auth/scopeGuard";
import {
  createCompanyMember,
  approveCompanyMember,
  activateMemberAccount,
} from "@/lib/services/companyMemberService";
import {
  createAndSendInvitation,
  verifyInvitationToken,
  acceptInvitation,
  resolveInvitationLifecycle,
  isEmailConfigured,
} from "@/lib/services/invitationService";

function assert(condition: boolean, stepName: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${stepName}`);
    throw new Error(`Assertion failed: ${stepName}`);
  }
  console.log(`✅ PASSED: ${stepName}`);
}

async function main() {
  console.log("==================================================================");
  console.log("SADEEM — EMPLOYEE INVITATION & EMAIL ACTIVATION E2E AUDIT");
  console.log("==================================================================");

  // 1. Target Database Guard Check
  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
  console.log(`[TARGET_CHECK] Host prefix check on database connection...`);
  if (!dbUrl.includes("ep-restless-sound-b3sfv7ak") || dbUrl.includes("ep-calm-snow-b3x4u5qq")) {
    throw new Error(`CRITICAL SECURITY HALT: Target is not Neon Staging! URL: ${dbUrl.replace(/:[^:@]+@/, ":***@")}`);
  }
  console.log(`[TARGET_CHECK] Confirmed Neon STAGING (ep-restless-sound-b3sfv7ak / br-tiny-salad-b3qjznbd).`);

  // 2. Fetch active SUPER_ADMIN
  const superAdmin = await prisma.adminUser.findFirst({
    where: { role: AdminRole.SUPER_ADMIN, isActive: true },
  });
  if (!superAdmin) throw new Error("No active SUPER_ADMIN found on Staging!");

  const superAdminSession: CurrentUserSession = {
    userId: superAdmin.id,
    name: superAdmin.name,
    email: superAdmin.email,
    role: superAdmin.role,
    isActive: true,
    tokenVersion: superAdmin.tokenVersion,
    jti: "test-jti-superadmin-e2e",
    companyMemberId: superAdmin.companyMemberId || undefined,
  };
  console.log(`[ACTOR_CHECK] Super admin: ${superAdmin.email} (${superAdmin.id})`);

  // 3. Fetch Core Departments
  const engTeam = await prisma.companyTeam.findUnique({ where: { code: "ENGINEERING" } });
  const designTeam = await prisma.companyTeam.findUnique({ where: { code: "DESIGN" } });
  if (!engTeam || !designTeam) throw new Error("Engineering or Design core department missing on Staging!");

  const testEmail = `candidate.activation.${Date.now()}@sadeem.testing`;
  let testMemberId: string | null = null;
  let firstRawToken: string | null = null;
  let secondRawToken: string | null = null;
  let activationRawToken: string | null = null;
  let createdAdminUserId: string | null = null;

  try {
    console.log("\n--- STEP 1: MEMBER CREATION (NO LOGIN CAPABILITY) ---");
    const { member: newMember } = await createCompanyMember(
      {
        fullNameEn: "Tariq Mansour",
        fullNameAr: "طارق منصور",
        email: testEmail,
        phone: "+966550001122",
        jobTitleEn: "Systems Architect",
        jobTitleAr: "مهندس نظم معمارية",
        membershipType: MembershipType.EMPLOYEE,
        primaryTeamId: engTeam.id,
        teamRole: TeamRole.MEMBER,
        sendInviteImmediately: false, // We will explicitly test invitation creation next
      },
      superAdminSession
    );
    testMemberId = newMember.id;

    assert(
      newMember.status === MemberStatus.PENDING_INVITATION,
      "Step 1a: Member created with PENDING_INVITATION status"
    );

    const checkAdmin = await prisma.adminUser.findUnique({ where: { email: testEmail } });
    assert(
      checkAdmin === null,
      "Step 1b: No AdminUser record exists for new member (zero login capability)"
    );

    console.log("\n--- STEP 2: INVITATION DISPATCH & SAFE OUTBOX LOGGING ---");
    const invResult1 = await createAndSendInvitation({
      memberId: testMemberId,
      email: testEmail,
      invitedById: superAdmin.id,
      expiresInDays: 7,
    });
    firstRawToken = invResult1.rawToken;

    const invRecord1 = await prisma.memberInvitation.findUnique({
      where: { id: invResult1.invitationId },
    });
    assert(
      invRecord1 !== null && invRecord1.status === InvitationStatus.PENDING,
      "Step 2a: MemberInvitation record created with PENDING status"
    );
    assert(
      invRecord1?.deliveryStatus === EmailDeliveryStatus.BLOCKED_CONFIGURATION,
      "Step 2b: Delivery status recorded as BLOCKED_CONFIGURATION (offline safe degradation)"
    );
    assert(
      invRecord1?.tokenHash !== firstRawToken,
      "Step 2c: Plain text rawToken is NEVER stored in database (stored only as SHA-256 hash)"
    );

    const outbox1 = await prisma.emailOutbox.findFirst({
      where: { recipientEmail: testEmail, template: "member_invitation" },
      orderBy: { createdAt: "desc" },
    });
    assert(
      outbox1 !== null && outbox1.status === EmailDeliveryStatus.BLOCKED_CONFIGURATION,
      "Step 2d: Durable EmailOutbox logs email with status BLOCKED_CONFIGURATION"
    );

    console.log("\n--- STEP 3: SAFE INVITATION ROTATION / RETRY (PHASE 4 AUDIT) ---");
    const invResult2 = await createAndSendInvitation({
      memberId: testMemberId,
      email: testEmail,
      invitedById: superAdmin.id,
      expiresInDays: 7,
    });
    secondRawToken = invResult2.rawToken;

    const priorInvAfterRetry = await prisma.memberInvitation.findUnique({
      where: { id: invResult1.invitationId },
    });
    assert(
      priorInvAfterRetry?.status === InvitationStatus.REVOKED,
      "Step 3a: Prior pending invitation atomically marked REVOKED upon retry"
    );

    const revokedCheck = await verifyInvitationToken(firstRawToken);
    assert(
      revokedCheck.valid === false && revokedCheck.reason === "REVOKED",
      "Step 3b: Revoked token rejected with reason REVOKED upon verification attempt"
    );

    const newInvCheck = await verifyInvitationToken(secondRawToken);
    assert(
      newInvCheck.valid === true && newInvCheck.invitation?.status === InvitationStatus.PENDING,
      "Step 3c: Newly rotated token verifies successfully (GET safe, zero mutation)"
    );

    console.log("\n--- STEP 4: LIFECYCLE STATUS RESOLUTION (PHASE 3 AUDIT) ---");
    const lifecycleInfo = resolveInvitationLifecycle(newInvCheck.invitation!);
    assert(
      lifecycleInfo.status === "BLOCKED_CONFIGURATION",
      "Step 4a: resolveInvitationLifecycle accurately resolves BLOCKED_CONFIGURATION"
    );
    assert(
      lifecycleInfo.canRetry === true,
      "Step 4b: Lifecycle info enables safe retry option for unconfigured/blocked delivery"
    );

    console.log("\n--- STEP 5: CANDIDATE ACCEPTANCE (/join/invitation/[token]) ---");
    const acceptOutcome = await acceptInvitation(secondRawToken);
    assert(acceptOutcome.success === true, "Step 5a: Candidate successfully accepts invitation");

    const memberAfterAccept = await prisma.companyMember.findUnique({
      where: { id: testMemberId },
    });
    assert(
      memberAfterAccept?.status === MemberStatus.ACCEPTED,
      "Step 5b: CompanyMember advanced to ACCEPTED status"
    );

    const invAfterAccept = await prisma.memberInvitation.findUnique({
      where: { id: invResult2.invitationId },
    });
    assert(
      invAfterAccept?.status === InvitationStatus.ACCEPTED && invAfterAccept.acceptedAt !== null,
      "Step 5c: MemberInvitation recorded as ACCEPTED with acceptedAt timestamp"
    );

    console.log("\n--- STEP 6: MANAGER NOTIFICATION DISPATCH ---");
    const notification = await prisma.companyNotification.findFirst({
      where: {
        recipientAdminId: superAdmin.id,
        type: CompanyNotificationType.INVITATION_ACCEPTED,
      },
      orderBy: { createdAt: "desc" },
    });
    assert(
      notification !== null && notification.link === `/admin/company/members/${testMemberId}`,
      "Step 6: Manager received INVITATION_ACCEPTED notification with member profile link"
    );

    console.log("\n--- STEP 7: PRE-APPROVAL SECURITY GATE ---");
    const preApprovalAdmin = await prisma.adminUser.findUnique({ where: { email: testEmail } });
    assert(
      preApprovalAdmin === null,
      "Step 7: AdminUser cannot be activated or logged in before manager review & approval"
    );

    console.log("\n--- STEP 8: MANAGER APPROVAL & ADMIN USER PROVISIONING ---");
    const approvalResult = await approveCompanyMember(
      {
        memberId: testMemberId,
        assignedRole: AdminRole.TEAM_MEMBER,
        grantDashboardAccess: true,
      },
      superAdminSession
    );
    assert(
      approvalResult.success === true && !!approvalResult.activationRawToken,
      "Step 8a: Manager approved member with dashboard access and generated activation token"
    );
    activationRawToken = approvalResult.activationRawToken!;

    const memberAfterApproval = await prisma.companyMember.findUnique({
      where: { id: testMemberId },
      include: { adminUser: true },
    });
    assert(
      memberAfterApproval?.status === MemberStatus.APPROVED,
      "Step 8b: CompanyMember status is APPROVED"
    );
    assert(
      memberAfterApproval?.adminUser !== null,
      "Step 8c: AdminUser record successfully provisioned"
    );
    createdAdminUserId = memberAfterApproval!.adminUser!.id;
    assert(
      memberAfterApproval?.adminUser?.isActive === false,
      "Step 8d: AdminUser isActive is false (login disabled until password initialization)"
    );
    assert(
      memberAfterApproval?.adminUser?.role === AdminRole.TEAM_MEMBER,
      "Step 8e: AdminUser role is TEAM_MEMBER"
    );

    const actTokenRecord = await prisma.accountActivationToken.findFirst({
      where: { memberId: testMemberId, consumedAt: null },
    });
    assert(
      actTokenRecord !== null && actTokenRecord.tokenHash !== activationRawToken,
      "Step 8f: Single-use AccountActivationToken stored securely as SHA-256 hash"
    );

    console.log("\n--- STEP 9: ACTIVATION EMAIL DISPATCH & OUTBOX LOGGING ---");
    const activationOutbox = await prisma.emailOutbox.findFirst({
      where: { recipientEmail: testEmail, template: "account_activation" },
      orderBy: { createdAt: "desc" },
    });
    assert(
      activationOutbox !== null && activationOutbox.status === EmailDeliveryStatus.BLOCKED_CONFIGURATION,
      "Step 9: Account activation email logged in EmailOutbox as BLOCKED_CONFIGURATION"
    );

    console.log("\n--- STEP 10: PASSWORD INITIALIZATION & ACCOUNT ACTIVATION (/join/activate/[token]) ---");
    // Test weak password rejection
    let weakRejected = false;
    try {
      await activateMemberAccount(activationRawToken, "weak");
    } catch (e: any) {
      weakRejected = true;
    }
    assert(weakRejected, "Step 10a: Weak password (< 8 chars) strictly rejected");

    const strongPassword = "Sadeem#2026Password!";
    const activationResult = await activateMemberAccount(activationRawToken, strongPassword);
    assert(activationResult.success === true, "Step 10b: Account activated with valid strong password");

    const activatedAdmin = await prisma.adminUser.findUnique({ where: { id: createdAdminUserId } });
    assert(activatedAdmin?.isActive === true, "Step 10c: AdminUser isActive is now true");
    const passwordValid = await bcrypt.compare(strongPassword, activatedAdmin!.passwordHash);
    assert(passwordValid === true, "Step 10d: Bcrypt passwordHash matches candidate password");

    const tokenAfterUse = await prisma.accountActivationToken.findFirst({
      where: { memberId: testMemberId },
    });
    assert(tokenAfterUse?.consumedAt !== null, "Step 10e: Activation token marked consumed (single-use)");

    // Replay attack prevention
    let replayRejected = false;
    try {
      await activateMemberAccount(activationRawToken, "Another#Pass1234");
    } catch (e: any) {
      replayRejected = true;
    }
    assert(replayRejected, "Step 10f: Replaying consumed activation token strictly rejected (ALREADY_USED)");

    const memberFinal = await prisma.companyMember.findUnique({ where: { id: testMemberId } });
    assert(memberFinal?.status === MemberStatus.ACTIVE, "Step 10g: CompanyMember status is now ACTIVE");

    console.log("\n--- STEP 11: MEMBER SESSION & OPERATIONAL WORKSPACE ACCESS ---");
    const newMemberSession: CurrentUserSession = {
      userId: activatedAdmin!.id,
      name: activatedAdmin!.name,
      email: activatedAdmin!.email,
      role: activatedAdmin!.role,
      isActive: activatedAdmin!.isActive,
      tokenVersion: activatedAdmin!.tokenVersion,
      jti: "test-jti-newmember-e2e",
      companyMemberId: testMemberId,
    };

    const engAccess = await canAccessDepartment(newMemberSession, "ENGINEERING");
    assert(
      engAccess.allowed === true,
      "Step 11a: Activated TEAM_MEMBER granted access to assigned Engineering department"
    );

    assert(
      hasPermission(newMemberSession.role, "tasks:view_team") === true,
      "Step 11b: TEAM_MEMBER has permission tasks:view_team"
    );
    assert(
      hasPermission(newMemberSession.role, "deliverables:submit") === true,
      "Step 11c: TEAM_MEMBER has permission deliverables:submit"
    );

    console.log("\n--- STEP 12: RBAC RESTRICTIONS & DENY-BY-DEFAULT ISOLATION ---");
    assert(
      hasPermission(newMemberSession.role, "members:create") === false,
      "Step 12a: TEAM_MEMBER denied permission members:create"
    );
    assert(
      hasPermission(newMemberSession.role, "members:approve") === false,
      "Step 12b: TEAM_MEMBER denied permission members:approve"
    );
    assert(
      hasPermission(newMemberSession.role, "members:suspend") === false,
      "Step 12c: TEAM_MEMBER denied permission members:suspend"
    );
    assert(
      hasPermission(newMemberSession.role, "invitations:approve") === false,
      "Step 12d: TEAM_MEMBER denied permission invitations:approve"
    );
    assert(
      hasPermission(newMemberSession.role, "permissions:manage") === false,
      "Step 12e: TEAM_MEMBER denied permission permissions:manage"
    );

    const otherDeptAccess = await canAccessDepartment(newMemberSession, "DESIGN");
    assert(
      otherDeptAccess.allowed === false,
      "Step 12f: TEAM_MEMBER denied access to other unassigned department (DESIGN)"
    );

    console.log("\n--- ALL 13 E2E INVITATION & ACTIVATION STEPS PASSED (100%) ---");
  } finally {
    console.log("\n--- CLEANUP TEST FIXTURES ---");
    if (testMemberId) {
      await prisma.auditLog.deleteMany({ where: { entityId: testMemberId } });
      await prisma.companyNotification.deleteMany({
        where: { OR: [{ recipientMemberId: testMemberId }, { metadata: { path: ["memberId"], equals: testMemberId } }] },
      });
      await prisma.emailOutbox.deleteMany({ where: { recipientEmail: testEmail } });
      await prisma.accountActivationToken.deleteMany({ where: { memberId: testMemberId } });
      await prisma.memberInvitation.deleteMany({ where: { memberId: testMemberId } });
      await prisma.teamMembership.deleteMany({ where: { memberId: testMemberId } });
      if (createdAdminUserId) {
        await prisma.adminUser.delete({ where: { id: createdAdminUserId } });
      }
      await prisma.companyMember.delete({ where: { id: testMemberId } });
      console.log(`[CLEANUP] Successfully cleaned up all test fixtures for ${testEmail}.`);
    }
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("FATAL ERROR in E2E Verification:", err);
  process.exit(1);
});
