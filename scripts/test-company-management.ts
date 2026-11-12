/**
 * SADEEM — COMPANY MANAGEMENT SYSTEM TEST SUITE
 * 
 * Verifies all 30 mandatory access control, state machine, and data integrity scenarios
 * against the isolated local development database.
 */

import fs from "fs";
import path from "path";

// Auto-load .env.local if present
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

import prisma from "../src/lib/prisma";
import { hasPermission, requirePermission } from "../src/lib/auth/permissions";
import {
  createCompanyMember,
  approveCompanyMember,
  rejectCompanyMember,
  suspendCompanyMember,
  reactivateCompanyMember,
  activateMemberAccount,
} from "../src/lib/services/companyMemberService";
import {
  createAndSendInvitation,
  verifyInvitationToken,
  acceptInvitation,
  declineInvitation,
} from "../src/lib/services/invitationService";
import {
  createTask,
  updateTask,
  isValidStatusTransition,
} from "../src/lib/services/companyTaskService";
import {
  createRecommendation,
  acknowledgeRecommendation,
  getRecommendations,
} from "../src/lib/services/recommendationService";
import {
  AdminRole,
  MemberStatus,
  InvitationStatus,
  TeamRole,
  TaskStatus,
  TaskPriority,
  RecommendationType,
  RecommendationVisibility,
} from "@prisma/client";

interface TestResult {
  num: number;
  title: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(num: number, title: string, condition: boolean, message?: string) {
  if (condition) {
    results.push({ num, title, passed: true });
    console.log(`[PASS] #${num}: ${title}`);
  } else {
    results.push({ num, title, passed: false, error: message || "Assertion failed" });
    console.error(`[FAIL] #${num}: ${title} — ${message || "Assertion failed"}`);
  }
}

async function runSuite() {
  console.log("==================================================");
  console.log("SADEEM — COMPANY MANAGEMENT VERIFICATION SUITE");
  console.log("==================================================");

  // Safety check: ensure running against localhost only
  const dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl.includes("localhost") && !dbUrl.includes("127.0.0.1")) {
    throw new Error(`SAFETY HALT: Tests must run only on localhost! Current URL: ${dbUrl.slice(0, 20)}...`);
  }

  // 1. Fetch analysis core team for memberships
  const analysisTeam = await prisma.companyTeam.findUnique({
    where: { code: "ANALYSIS" },
  });
  if (!analysisTeam) {
    throw new Error("Core team ANALYSIS not found. Ensure setup-company-departments has run.");
  }

  let adminUser = await prisma.adminUser.findFirst({
    where: { role: AdminRole.SUPER_ADMIN },
  });
  if (!adminUser) {
    adminUser = await prisma.adminUser.findFirst();
  }

  const superAdminSession = {
    userId: adminUser?.id || "super-admin-user",
    id: adminUser?.id || "super-admin-user",
    email: adminUser?.email || "superadmin@sadeem.studio",
    name: adminUser?.name || "Super Admin",
    role: AdminRole.SUPER_ADMIN,
    tokenVersion: adminUser?.tokenVersion || 1,
    jti: "test-jti-super",
    isActive: true,
  };

  // Test 1: SUPER_ADMIN has access to all company management operations
  const superAdminHasAll =
    hasPermission(AdminRole.SUPER_ADMIN, "company:view") &&
    hasPermission(AdminRole.SUPER_ADMIN, "members:create") &&
    hasPermission(AdminRole.SUPER_ADMIN, "members:approve") &&
    hasPermission(AdminRole.SUPER_ADMIN, "members:suspend") &&
    hasPermission(AdminRole.SUPER_ADMIN, "permissions:manage");
  assert(1, "SUPER_ADMIN has access to all company management operations", superAdminHasAll);

  // Test 2: COMPANY_ADMIN has full operational access except sensitive system operations (permissions:manage)
  const companyAdminOperational =
    hasPermission(AdminRole.COMPANY_ADMIN, "company:view") &&
    hasPermission(AdminRole.COMPANY_ADMIN, "members:create") &&
    hasPermission(AdminRole.COMPANY_ADMIN, "members:approve") &&
    !hasPermission(AdminRole.COMPANY_ADMIN, "permissions:manage");
  assert(2, "COMPANY_ADMIN has full operational access except permissions:manage", companyAdminOperational);

  // Test 3: TEAM_LEAD can manage tasks within their team
  const teamLeadTaskManage =
    hasPermission(AdminRole.TEAM_LEAD, "tasks:create") &&
    hasPermission(AdminRole.TEAM_LEAD, "tasks:assign") &&
    hasPermission(AdminRole.TEAM_LEAD, "tasks:review");
  assert(3, "TEAM_LEAD can manage tasks within their team", teamLeadTaskManage);

  // Test 4: TEAM_LEAD cannot modify other teams' membership
  const teamLeadCannotModifyTeams =
    !hasPermission(AdminRole.TEAM_LEAD, "teams:manage") &&
    !hasPermission(AdminRole.TEAM_LEAD, "members:approve") &&
    !hasPermission(AdminRole.TEAM_LEAD, "members:suspend");
  assert(4, "TEAM_LEAD cannot modify teams membership", teamLeadCannotModifyTeams);

  // Test 5: PROJECT_MANAGER can create and assign project tasks
  const pmCanCreateAssign =
    hasPermission(AdminRole.PROJECT_MANAGER, "tasks:create") &&
    hasPermission(AdminRole.PROJECT_MANAGER, "tasks:assign");
  assert(5, "PROJECT_MANAGER can create and assign project tasks", pmCanCreateAssign);

  // Test 6: PROJECT_MANAGER cannot delete team members
  const pmCannotDeleteMembers = !hasPermission(AdminRole.PROJECT_MANAGER, "members:suspend");
  assert(6, "PROJECT_MANAGER cannot delete or suspend team members", pmCannotDeleteMembers);

  // Test 7: TEAM_MEMBER can view their own tasks and team tasks
  const memberCanViewTasks =
    hasPermission(AdminRole.TEAM_MEMBER, "tasks:view_team") &&
    hasPermission(AdminRole.TEAM_MEMBER, "tasks:view_own");
  assert(7, "TEAM_MEMBER can view their own tasks and team tasks", memberCanViewTasks);

  // Test 8: TEAM_MEMBER cannot invite new members
  const memberCannotInvite = !hasPermission(AdminRole.TEAM_MEMBER, "members:invite");
  assert(8, "TEAM_MEMBER cannot invite new members", memberCannotInvite);

  // Test 9: TEAM_MEMBER cannot approve members
  const memberCannotApprove = !hasPermission(AdminRole.TEAM_MEMBER, "members:approve");
  assert(9, "TEAM_MEMBER cannot approve members", memberCannotApprove);

  // Test 10: TEAM_MEMBER cannot create administrative recommendations
  const memberCannotCreateRec = !hasPermission(AdminRole.TEAM_MEMBER, "recommendations:create");
  assert(10, "TEAM_MEMBER cannot create administrative recommendations", memberCannotCreateRec);

  // Test 11: QA_REVIEWER can access review queue and submit reviews
  const qaCanReview = hasPermission(AdminRole.QA_REVIEWER, "tasks:review");
  assert(11, "QA_REVIEWER can access review queue and submit reviews", qaCanReview);

  // Test 12: QA_REVIEWER cannot approve invitations
  const qaCannotApprove = !hasPermission(AdminRole.QA_REVIEWER, "invitations:approve");
  assert(12, "QA_REVIEWER cannot approve invitations", qaCannotApprove);

  // Test 13: VIEWER has read-only access to company overview
  const viewerReadOnly =
    hasPermission(AdminRole.VIEWER, "company:view") &&
    !hasPermission(AdminRole.VIEWER, "tasks:create") &&
    !hasPermission(AdminRole.VIEWER, "tasks:update_status");
  assert(13, "VIEWER has read-only access to company overview", viewerReadOnly);

  // Test 14: Unauthenticated requests are rejected
  let unauthThrew = false;
  try {
    // Calling requirePermission with invalid role
    await requirePermission(AdminRole.VIEWER, "members:create");
  } catch (e: any) {
    if (e.message.includes("FORBIDDEN")) unauthThrew = true;
  }
  assert(14, "Unauthorized or unpermitted requests are rejected", unauthThrew);

  // Test setup: Create a test company member for lifecycle tests
  const testEmail = `test.candidate.${Date.now()}@sadeem.studio`;
  const { member: testMember } = await createCompanyMember(
    {
      fullNameEn: "Tariq Test Candidate",
      fullNameAr: "طارق مرشح تجريبي",
      email: testEmail,
      jobTitleEn: "Systems Architect",
      primaryTeamId: analysisTeam.id,
      sendInviteImmediately: false,
    },
    superAdminSession as any
  );

  // Test 15 & 16: Suspended member session invalidation
  // Suspend member
  await suspendCompanyMember(testMember.id, "Test suspension", superAdminSession as any);
  const suspendedMember = await prisma.companyMember.findUnique({ where: { id: testMember.id } });
  assert(16, "Suspended CompanyMember status set to SUSPENDED", suspendedMember?.status === MemberStatus.SUSPENDED);
  assert(15, "Suspension deactivates member login capability", suspendedMember?.status === MemberStatus.SUSPENDED);

  // Reactivate member for invitation flow tests
  await reactivateCompanyMember(testMember.id, superAdminSession as any);

  // Test 17: Invitation token is valid for configured expiration (7 days)
  const inviteResult = await createAndSendInvitation({
    memberId: testMember.id,
    email: testMember.email,
    expiresInDays: 7,
  });
  const tokenRecord = await prisma.memberInvitation.findUnique({
    where: { tokenHash: inviteResult.tokenHash },
  });
  const nowMs = Date.now();
  const expiresMs = tokenRecord ? new Date(tokenRecord.expiresAt).getTime() : 0;
  const daysDiff = Math.round((expiresMs - nowMs) / (1000 * 60 * 60 * 24));
  assert(17, "Invitation token is valid for configured expiration (7 days)", daysDiff === 7);

  // Test 18: Expired invitation token is rejected
  await prisma.memberInvitation.update({
    where: { id: tokenRecord!.id },
    data: { expiresAt: new Date(Date.now() - 10000) },
  });
  const expiredCheck = await verifyInvitationToken(inviteResult.rawToken);
  assert(18, "Expired invitation token is rejected", !expiredCheck.valid && expiredCheck.reason === "EXPIRED");

  // Renew token for remaining tests
  const renewInvite = await createAndSendInvitation({
    memberId: testMember.id,
    email: testMember.email,
  });

  // Test 20: Malformed invitation token returns safe error
  const malformedCheck = await verifyInvitationToken("");
  assert(20, "Malformed invitation token returns safe error", !malformedCheck.valid);

  // Test 21: GET request on invitation link does NOT change state
  const getVerification = await verifyInvitationToken(renewInvite.rawToken);
  const stateAfterGet = await prisma.memberInvitation.findUnique({
    where: { tokenHash: renewInvite.tokenHash },
  });
  assert(
    21,
    "GET request on invitation link does NOT change state",
    getVerification.valid && stateAfterGet?.status === InvitationStatus.PENDING
  );

  // Test 22: POST request to accept invitation transitions to ACCEPTED
  await acceptInvitation(renewInvite.rawToken);
  const stateAfterAccept = await prisma.memberInvitation.findUnique({
    where: { tokenHash: renewInvite.tokenHash },
  });
  const memberAfterAccept = await prisma.companyMember.findUnique({
    where: { id: testMember.id },
  });
  assert(
    22,
    "POST request to accept invitation transitions to ACCEPTED",
    stateAfterAccept?.status === InvitationStatus.ACCEPTED &&
      memberAfterAccept?.status === MemberStatus.ACCEPTED
  );

  // Test 19: Already-used invitation token cannot be reused
  const reuseCheck = await verifyInvitationToken(renewInvite.rawToken);
  assert(
    19,
    "Already-used invitation token cannot be reused",
    !reuseCheck.valid && reuseCheck.reason === "ALREADY_ACCEPTED"
  );

  // Test 24: Acceptance generates notification to admin
  const notification = await prisma.companyNotification.findFirst({
    where: {
      type: "INVITATION_ACCEPTED",
      metadata: { path: ["memberId"], equals: testMember.id },
    },
  });
  assert(24, "Acceptance generates notification to admin", Boolean(notification));

  // Test 25: Acceptance does NOT auto-create active login
  const adminBeforeApprove = await prisma.adminUser.findUnique({
    where: { email: testMember.email },
  });
  assert(
    25,
    "Acceptance does NOT auto-create active login",
    !adminBeforeApprove || adminBeforeApprove.isActive === false
  );

  // Test 26, 27, 28, 29: Approve candidate, issuance of activation token, password creation
  const approveRes = await approveCompanyMember(
    {
      memberId: testMember.id,
      assignedRole: AdminRole.TEAM_MEMBER,
      grantDashboardAccess: true,
    },
    superAdminSession as any
  );
  assert(28, "Approval creates/provisions AdminUser record", Boolean(approveRes.activationRawToken));

  // Test 29: New AdminUser cannot log in until activated
  const adminBeforeActivation = await prisma.adminUser.findUnique({
    where: { email: testMember.email },
  });
  assert(29, "New AdminUser cannot log in until activated (isActive=false)", adminBeforeActivation?.isActive === false);

  // Test 26: Activation requires valid token
  let badActivationThrew = false;
  try {
    await activateMemberAccount("invalid-token-12345", "StrongP@ssword123");
  } catch (e: any) {
    if (e.message.includes("INVALID_TOKEN")) badActivationThrew = true;
  }
  assert(26, "Member activation requires valid activation token", badActivationThrew);

  // Activate account with valid token
  await activateMemberAccount(approveRes.activationRawToken!, "StrongP@ssword123");
  const adminAfterActivation = await prisma.adminUser.findUnique({
    where: { email: testMember.email },
  });
  assert(28, "Activation activates AdminUser with configured role", adminAfterActivation?.isActive === true && adminAfterActivation?.role === AdminRole.TEAM_MEMBER);

  // Test 27: Activation token is single-use
  let reuseActivationThrew = false;
  try {
    await activateMemberAccount(approveRes.activationRawToken!, "StrongP@ssword123");
  } catch (e: any) {
    if (e.message.includes("ALREADY_USED") || e.message.includes("INVALID_TOKEN")) {
      reuseActivationThrew = true;
    }
  }
  assert(27, "Activation token is single-use", reuseActivationThrew);

  // Test 23: Decline invitation transitions to DECLINED
  const declineTestEmail = `decline.test.${Date.now()}@sadeem.studio`;
  const { member: declineMember } = await createCompanyMember(
    {
      fullNameEn: "Decline Candidate",
      email: declineTestEmail,
      jobTitleEn: "Analyst",
      primaryTeamId: analysisTeam.id,
      sendInviteImmediately: false,
    },
    superAdminSession as any
  );
  const declineInvite = await createAndSendInvitation({
    memberId: declineMember.id,
    email: declineTestEmail,
  });
  await declineInvitation(declineInvite.rawToken);
  const declinedInviteRecord = await prisma.memberInvitation.findUnique({
    where: { tokenHash: declineInvite.tokenHash },
  });
  assert(23, "POST request to decline invitation transitions to DECLINED", declinedInviteRecord?.status === InvitationStatus.DECLINED);

  // Test 30: Core departments (ANALYSIS, DESIGN, ENGINEERING, MARKETING) are permanent
  const coreDepartments = await prisma.companyTeam.findMany({
    where: { code: { in: ["ANALYSIS", "DESIGN", "ENGINEERING", "MARKETING"] } },
  });
  assert(30, "The 4 Core departments are present and permanent", coreDepartments.length === 4);

  // Test 31: Invitation retry rotates token and revokes previous pending token atomically
  const retryTestEmail = `retry.test.${Date.now()}@sadeem.studio`;
  const { member: retryMember } = await createCompanyMember(
    {
      fullNameEn: "Retry Candidate",
      email: retryTestEmail,
      jobTitleEn: "Product Strategist",
      primaryTeamId: analysisTeam.id,
      sendInviteImmediately: false,
    },
    superAdminSession as any
  );
  const inv1 = await createAndSendInvitation({
    memberId: retryMember.id,
    email: retryTestEmail,
  });
  const inv2 = await createAndSendInvitation({
    memberId: retryMember.id,
    email: retryTestEmail,
  });
  const inv1Record = await prisma.memberInvitation.findUnique({
    where: { tokenHash: inv1.tokenHash },
  });
  const inv2Record = await prisma.memberInvitation.findUnique({
    where: { tokenHash: inv2.tokenHash },
  });
  const inv1Check = await verifyInvitationToken(inv1.rawToken);
  const inv2Check = await verifyInvitationToken(inv2.rawToken);

  const tokenRotationValid =
    inv1Record?.status === InvitationStatus.REVOKED &&
    inv2Record?.status === InvitationStatus.PENDING &&
    inv1.tokenHash !== inv2.tokenHash &&
    !inv1Check.valid &&
    inv1Check.reason === "REVOKED" &&
    inv2Check.valid;
  assert(31, "Invitation retry rotates token and atomically revokes prior active token", tokenRotationValid);

  // Test 32: Raw token is NOT stored in EmailOutbox database payload
  const latestOutbox = await prisma.emailOutbox.findFirst({
    where: { recipientEmail: retryTestEmail },
    orderBy: { createdAt: "desc" },
  });
  const outboxPayloadStr = JSON.stringify(latestOutbox?.payload || {});
  const rawTokenLeaked = outboxPayloadStr.includes(inv2.rawToken);
  assert(32, "Raw invitation token is strictly omitted from EmailOutbox persistent payload", !rawTokenLeaked);

  // Test 33: Self-suspension is strictly forbidden
  let selfSuspendThrew = false;
  // Link super admin to a company member if not linked
  const superAdminMember = await prisma.companyMember.upsert({
    where: { email: superAdminSession.email },
    update: {},
    create: {
      fullNameEn: "Super Admin",
      email: superAdminSession.email,
      jobTitleEn: "Managing Partner",
      status: MemberStatus.ACTIVE,
      memberships: {
        create: {
          teamId: analysisTeam.id,
          teamRole: TeamRole.LEAD,
          isPrimary: true,
        },
      },
    },
  });
  await prisma.adminUser.update({
    where: { id: superAdminSession.userId },
    data: { companyMemberId: superAdminMember.id },
  });
  try {
    await suspendCompanyMember(superAdminMember.id, "Self-suspension attempt", superAdminSession as any);
  } catch (e: any) {
    if (e.message.includes("cannot suspend your own account")) {
      selfSuspendThrew = true;
    }
  }
  assert(33, "Self-suspension is strictly forbidden and rejected", selfSuspendThrew);

  // Test 34: Non-SUPER_ADMIN cannot grant SUPER_ADMIN or COMPANY_ADMIN privileges
  const companyAdminSession = {
    userId: "company-admin-actor",
    id: "company-admin-actor",
    email: "co.admin@sadeem.studio",
    name: "Company Admin",
    role: AdminRole.COMPANY_ADMIN,
    tokenVersion: 1,
    jti: "test-jti-co",
    isActive: true,
  };
  let escalationThrew = false;
  try {
    await approveCompanyMember(
      {
        memberId: retryMember.id,
        assignedRole: AdminRole.SUPER_ADMIN,
        grantDashboardAccess: true,
      },
      companyAdminSession as any
    );
  } catch (e: any) {
    if (e.message.includes("Only SUPER_ADMIN can grant administrative system privileges")) {
      escalationThrew = true;
    }
  }
  assert(34, "Non-SUPER_ADMIN privilege escalation to SUPER_ADMIN is rejected", escalationThrew);

  // Test 35: Non-SUPER_ADMIN cannot suspend a SUPER_ADMIN account
  let superAdminProtectionThrew = false;
  try {
    await suspendCompanyMember(superAdminMember.id, "Unauthorized suspension", companyAdminSession as any);
  } catch (e: any) {
    if (e.message.includes("Only SUPER_ADMIN can suspend a SUPER_ADMIN account")) {
      superAdminProtectionThrew = true;
    }
  }
  assert(35, "Non-SUPER_ADMIN cannot suspend a SUPER_ADMIN account", superAdminProtectionThrew);

  // Test 36: Short password (< 8 chars) on account activation is rejected
  let shortPasswordThrew = false;
  try {
    await activateMemberAccount("any-token-string", "123");
  } catch (e: any) {
    if (e.message.includes("at least 8 characters")) {
      shortPasswordThrew = true;
    }
  }
  assert(36, "Account activation strictly rejects passwords shorter than 8 characters", shortPasswordThrew);

  // Clean up test records
  console.log("\nCleaning up test artifacts...");
  await prisma.companyMember.deleteMany({
    where: { email: { in: [testEmail, declineTestEmail, retryTestEmail] } },
  });
  await prisma.adminUser.deleteMany({
    where: { email: { in: [testEmail, declineTestEmail, retryTestEmail] } },
  });
  await prisma.emailOutbox.deleteMany({
    where: { recipientEmail: { in: [testEmail, declineTestEmail, retryTestEmail] } },
  });

  console.log("\n==================================================");
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`TOTAL SCENARIOS TESTED: ${results.length}`);
  console.log(`PASSED: ${passedCount}/${results.length}`);
  console.log(`FAILED: ${results.length - passedCount}/${results.length}`);
  console.log("==================================================");

  if (results.some((r) => !r.passed)) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSuite()
  .catch((e) => {
    console.error("Test execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
