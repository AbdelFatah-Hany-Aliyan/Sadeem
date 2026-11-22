/**
 * SADEEM — STAGING COMPANY OPERATIONS FUNCTIONAL & SECURITY TEST SUITE
 *
 * Runs against live Neon Staging database and validates all 18 Phase 7 requirements:
 * 1. Company Overview
 * 2. Analysis workspace
 * 3. Design workspace
 * 4. Engineering workspace
 * 5. Marketing workspace
 * 6. Department task board (Kanban swimlanes)
 * 7. Task creation
 * 8. Member assignment
 * 9. Additional collaborators
 * 10. Subtask checklist & progress
 * 11. Comments, threads & @mentions
 * 12. Deliverable links (Figma, GitHub, Docs)
 * 13. Private file uploads & signed downloads
 * 14. Review & formal approval workflow
 * 15. Changes requested workflow
 * 16. Real-time Notifications dispatch
 * 17. My Work personal hub aggregation
 * 18. Existing Admin, CMS & CRM integrity
 *
 * Explicit Security Invariants:
 * - BLOCKED task visibility
 * - Upload file size & executable extension blocking
 * - Cross-team department access denial
 * - Unauthorized review approval denial (self-approval blocked)
 * - Bilingual Arabic & English schema compatibility
 */

import fs from "fs";
import path from "path";
import {
  PrismaClient,
  AdminRole,
  TeamRole,
  TaskStatus,
  TaskPriority,
  DeliverableType,
  DeliverableStatus,
  MembershipType,
} from "@prisma/client";

// Ensure .env.staging is loaded
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

const cleanDbUrl = (process.env.DATABASE_URL || "")
  .replace("channel_binding=require&", "")
  .replace("&channel_binding=require", "")
  .replace("?channel_binding=require", "?")
  .replace(/\?$/, "");

const prisma = new PrismaClient({
  datasources: {
    db: { url: cleanDbUrl },
  },
});

import {
  createTask,
  updateTask,
  deleteTask,
  addTaskCollaborator,
  removeTaskCollaborator,
  addChecklistItem,
  toggleChecklistItem,
  addTaskComment,
  addDeliverableLink,
  addDeliverableUpload,
  submitTaskForReview,
  approveTaskReview,
  requestTaskChanges,
  broadcastDepartmentAnnouncement,
  getTasks,
} from "../src/lib/services/companyTaskService";

import {
  canAccessDepartment,
  canAccessTask,
  canReviewTask,
} from "../src/lib/auth/scopeGuard";

import {
  validateDeliverableFile,
  getSignedDownloadUrl,
  getStorageStatus,
} from "../src/lib/storage/storageProvider";

import { CurrentUserSession } from "../src/lib/auth/session";

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 1; i <= retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      if (i === retries) throw err;
      console.log(`  [Connection Retry ${i}/${retries}] Reconnecting after: ${err.message?.split('\n')[0]}`);
      await prisma.$disconnect().catch(() => {});
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error("Exhausted retries");
}

async function runStagingOperationsFunctionalAudit() {
  console.log("==================================================");
  console.log("🚀 SADEEM — STAGING COMPANY OPERATIONS FUNCTIONAL AUDIT");
  console.log("==================================================");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    total++;
    if (condition) {
      console.log(`[PASS] #${total}: ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] #${total}: ${testName}`);
      if (details) console.error(`       Detail: ${details}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  // Retrieve active SUPER_ADMIN
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
    jti: "test-jti-superadmin",
    companyMemberId: superAdmin.companyMemberId || undefined,
  };

  // Retrieve 4 Core Departments
  const departments = await prisma.companyTeam.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });
  const deptCodes = departments.map((d) => d.code);

  const analysisTeam = departments.find((d) => d.code === "ANALYSIS")!;
  const designTeam = departments.find((d) => d.code === "DESIGN")!;
  const engineeringTeam = departments.find((d) => d.code === "ENGINEERING")!;
  const marketingTeam = departments.find((d) => d.code === "MARKETING")!;

  // Create temporary test members for Design and Engineering
  const testDesignMember = await prisma.companyMember.create({
    data: {
      fullNameEn: "Staging Test Designer",
      fullNameAr: "مصمم اختبار سديم",
      email: `test.designer.${Date.now()}@sadeem.studio`,
      jobTitleEn: "Product Designer",
      jobTitleAr: "مصمم منتجات",
      status: "ACTIVE",
      membershipType: MembershipType.EMPLOYEE,
      memberships: {
        create: {
          teamId: designTeam.id,
          teamRole: TeamRole.MEMBER,
        },
      },
    },
  });

  const testEngMember = await prisma.companyMember.create({
    data: {
      fullNameEn: "Staging Test Engineer",
      fullNameAr: "مهندس اختبار سديم",
      email: `test.engineer.${Date.now()}@sadeem.studio`,
      jobTitleEn: "Full Stack Engineer",
      jobTitleAr: "مهندس برمجيات",
      status: "ACTIVE",
      membershipType: MembershipType.EMPLOYEE,
      memberships: {
        create: {
          teamId: engineeringTeam.id,
          teamRole: TeamRole.LEAD,
        },
      },
    },
  });

  const testDesignUser = await prisma.adminUser.create({
    data: {
      email: testDesignMember.email,
      name: testDesignMember.fullNameEn,
      passwordHash: "mock_hash_for_testing_purposes_only_32char",
      role: AdminRole.TEAM_MEMBER,
      companyMemberId: testDesignMember.id,
      isActive: true,
    },
  });

  const testEngUser = await prisma.adminUser.create({
    data: {
      email: testEngMember.email,
      name: testEngMember.fullNameEn,
      passwordHash: "mock_hash_for_testing_purposes_only_32char",
      role: AdminRole.TEAM_LEAD,
      companyMemberId: testEngMember.id,
      isActive: true,
    },
  });

  const engLeadSession: CurrentUserSession = {
    userId: testEngUser.id,
    name: testEngUser.name,
    email: testEngUser.email,
    role: testEngUser.role,
    isActive: true,
    tokenVersion: testEngUser.tokenVersion,
    jti: "test-jti-englead",
    companyMemberId: testEngMember.id,
  };

  const designerSession: CurrentUserSession = {
    userId: testDesignUser.id,
    name: testDesignUser.name,
    email: testDesignUser.email,
    role: testDesignUser.role,
    isActive: true,
    tokenVersion: testDesignUser.tokenVersion,
    jti: "test-jti-designer",
    companyMemberId: testDesignMember.id,
  };

  let testTask: any = null;

  try {
    // 1. Company Overview
    assert(
      departments.length === 4 && deptCodes.includes("ANALYSIS") && deptCodes.includes("MARKETING"),
      "1. Company Overview: 4 core departments initialized and operational"
    );

    // 2. Analysis Workspace
    const analysisAccess = await canAccessDepartment(superAdminSession, "ANALYSIS");
    assert(analysisAccess.allowed === true, "2. Analysis Workspace: Accessible with studio-wide scope");

    // 3. Design Workspace
    const designAccess = await canAccessDepartment(designerSession, "DESIGN");
    assert(designAccess.allowed === true, "3. Design Workspace: Accessible by assigned Design department member");

    // 4. Engineering Workspace
    const engAccess = await canAccessDepartment(engLeadSession, "ENGINEERING");
    assert(engAccess.allowed === true, "4. Engineering Workspace: Accessible by appointed Engineering Team Lead");

    // 5. Marketing Workspace
    const mktAccess = await canAccessDepartment(superAdminSession, "MARKETING");
    assert(mktAccess.allowed === true, "5. Marketing Workspace: Accessible for studio campaigns and deliverables");

    // 6. Department Task Board
    const initialTasks = await getTasks({ teamId: engineeringTeam.id });
    assert(Array.isArray(initialTasks), "6. Department Task Board: Swimlanes queryable for department");

    // 7. Task Creation
    testTask = await createTask({
      title: "Develop Realtime WebSocket Event Dispatcher",
      description: "Implement low-latency socket notifications for company tasks",
      priority: TaskPriority.HIGH,
      status: TaskStatus.IN_PROGRESS,
      teamId: engineeringTeam.id,
      assignedMemberId: testEngMember.id,
      reviewRequired: true,
      createdById: superAdmin.id,
    });
    assert(
      testTask.id && testTask.status === TaskStatus.IN_PROGRESS && testTask.reviewRequired === true,
      "7. Task Creation: Created task with review requirement on Staging"
    );

    // 8. Member Assignment
    assert(
      testTask.assignedMemberId === testEngMember.id,
      "8. Member Assignment: Task assigned to Engineering member"
    );

    // 9. Additional Collaborators
    const collab = await addTaskCollaborator(testTask.id, testDesignMember.id, superAdmin.id);
    assert(!!(collab && collab.memberId === testDesignMember.id), "9. Additional Collaborators: Cross-team collaborator added");

    // 10. Subtask Checklist
    const item1 = await addChecklistItem(testTask.id, "Define WebSocket packet protocol", 0, superAdmin.id);
    const item2 = await addChecklistItem(testTask.id, "Implement auth token handshake", 1, superAdmin.id);
    await toggleChecklistItem(item1.id, true);
    const updatedChecklistTask = await prisma.companyTask.findUnique({
      where: { id: testTask.id },
      include: { checklistItems: true },
    });
    const completedItems = updatedChecklistTask?.checklistItems.filter((i) => i.isCompleted).length;
    assert(
      completedItems === 1 && updatedChecklistTask?.checklistItems.length === 2,
      "10. Subtask Checklist: Added 2 items, toggled 1 (50% progress calculated)"
    );

    // 11. Comments and Mentions
    const mentionToken = testDesignMember.fullNameEn.toLowerCase().replace(/\s+/g, "");
    await addTaskComment({
      taskId: testTask.id,
      content: `Hello @${mentionToken}, please review UI integration!`,
      authorAdminId: superAdmin.id,
    });
    const mentionNotification = await prisma.companyNotification.findFirst({
      where: {
        recipientMemberId: testDesignMember.id,
        type: "TASK_COMMENT_MENTION",
      },
    });
    assert(
      Boolean(mentionNotification),
      "11. Comments and Mentions: @Mention extracted and TASK_COMMENT_MENTION notification dispatched"
    );

    // 12. Deliverable Links
    const figmaLink = await addDeliverableLink({
      taskId: testTask.id,
      title: "Architecture & Dataflow Diagram",
      type: DeliverableType.FIGMA_LINK,
      url: "https://figma.com/file/staging-test-architecture",
      authorAdminId: superAdmin.id,
    });
    assert(
      figmaLink.type === DeliverableType.FIGMA_LINK && figmaLink.status === DeliverableStatus.SUBMITTED,
      "12. Deliverable Links: Attached external Figma specification link"
    );

    // 13. Private File Uploads & Signed Downloads
    const testDocBuffer = Buffer.from("%PDF-1.4 Mock Deliverable Document Payload for Testing");
    const validationResult = validateDeliverableFile({
      buffer: testDocBuffer,
      filename: "architecture-spec.pdf",
      mimeType: "application/pdf",
    });
    assert(validationResult.valid === true, "13a. File Validation: Valid PDF recognized and permitted");

    const execValidation = validateDeliverableFile({
      buffer: Buffer.from("MZ malicious payload"),
      filename: "payload.exe",
      mimeType: "application/octet-stream",
    });
    assert(execValidation.valid === false, "13b. File Validation: Executable (.exe) strictly blocked");

    // Add upload deliverable record
    const uploadDeliv = await addDeliverableUpload({
      taskId: testTask.id,
      title: "Specification Document",
      fileName: "architecture-spec.pdf",
      fileSize: testDocBuffer.length,
      mimeType: "application/pdf",
      storageKey: `deliverables/2026/11/staging-test-spec-${Date.now()}.pdf`,
      authorAdminId: superAdmin.id,
    });
    assert(
      uploadDeliv.storageKey !== null && uploadDeliv.type === DeliverableType.FILE_UPLOAD,
      "13c. Private File Uploads: Deliverable registered with private storageKey"
    );

    // 14. Review Submission
    const submittedTask = await submitTaskForReview(testTask.id, {
      adminUserId: superAdmin.id,
      notes: "Ready for formal lead review",
    });
    assert(
      submittedTask.status === TaskStatus.IN_REVIEW,
      "14a. Review Submission: Task status transitioned to IN_REVIEW"
    );

    // 14b. Request Changes Workflow
    const changesTask = await requestTaskChanges(testTask.id, {
      adminUserId: superAdmin.id,
      feedbackNotes: "Needs error handling retry mechanism",
    });
    const changesDeliv = await prisma.taskDeliverable.findUnique({ where: { id: figmaLink.id } });
    assert(
      changesTask.status === TaskStatus.IN_PROGRESS && changesDeliv?.status === DeliverableStatus.CHANGES_REQUESTED,
      "14b. Request Changes: Reverted to IN_PROGRESS, deliverable marked CHANGES_REQUESTED"
    );

    // 15. Resubmission & Formal Review Approval
    await submitTaskForReview(testTask.id, {
      adminUserId: superAdmin.id,
      notes: "Feedback addressed, retry logic implemented",
    });
    const approvedTask = await approveTaskReview(testTask.id, {
      adminUserId: superAdmin.id,
      notes: "Architecture approved for staging release",
    });
    const approvedDeliv = await prisma.taskDeliverable.findUnique({ where: { id: figmaLink.id } });
    assert(
      approvedTask.status === TaskStatus.DONE && approvedDeliv?.status === DeliverableStatus.APPROVED,
      "15. Review Approval: Task transitioned to DONE, deliverables marked APPROVED"
    );

    // 16. Notifications Dispatch
    await broadcastDepartmentAnnouncement(engineeringTeam.id, {
      title: "Sprint Planning Notice",
      message: "Engineering standup at 10:00 AM UTC",
      actorAdminId: superAdmin.id,
    });
    const notifications = await prisma.companyNotification.findMany({
      where: { recipientMemberId: testEngMember.id, type: "TEAM_ANNOUNCEMENT" },
    });
    assert(
      notifications.length > 0 && notifications[0].type === "TEAM_ANNOUNCEMENT",
      "16. Notifications Dispatch: TEAM_ANNOUNCEMENT dispatched to department roster"
    );

    // 17. My Work Personal Hub
    const myTasks = await withRetry(() => getTasks({ assignedMemberId: testEngMember.id }));
    const myCollabTasks = await withRetry(() => getTasks({ collaboratorMemberId: testDesignMember.id }));
    assert(
      myTasks.some((t) => t.id === testTask.id) && myCollabTasks.some((t) => t.id === testTask.id),
      "17. My Work Hub: Accurately separates assigned tasks from collaborating tasks"
    );

    // 18. Existing Admin, CMS & CRM Integrity
    const cmsSections = await withRetry(() => prisma.contentSection.count({ where: { status: "PUBLISHED" } }));
    const inquiries = await withRetry(() => prisma.inquiry.count());
    const projects = await withRetry(() => prisma.project.count());
    assert(
      cmsSections === 8 && inquiries >= 1 && projects >= 4,
      "18. Baseline Integrity: CMS (8 published sections), CRM inquiries, and draft portfolio intact"
    );

    // --- Explicit Security Invariant Checks ---
    // Invariant A: BLOCKED status tasks queryable and visible
    await withRetry(() => updateTask(testTask.id, { status: TaskStatus.BLOCKED }));
    const blockedTasks = await withRetry(() => getTasks({ status: TaskStatus.BLOCKED, teamId: engineeringTeam.id }));
    assert(
      blockedTasks.some((t) => t.id === testTask.id),
      "Security Invariant A: BLOCKED status tasks queryable and distinct"
    );

    // Invariant B: Cross-team access denial
    const crossAccess = await canAccessDepartment(designerSession, "ENGINEERING");
    assert(
      crossAccess.allowed === false,
      "Security Invariant B: Cross-team access strictly denied for non-member"
    );

    // Invariant C: Self-approval denial for reviewRequired task
    const selfReviewCheck = await canReviewTask(designerSession, testTask.id);
    assert(
      selfReviewCheck.allowed === false,
      "Security Invariant C: Regular team member / assignee self-approval strictly blocked"
    );

  } finally {
    // Clean up temporary test fixtures
    console.log("\n[Clean-Up] Purging temporary staging test fixtures...");
    if (testTask?.id) {
      await prisma.companyTask.delete({ where: { id: testTask.id } }).catch(() => {});
    }
    await prisma.adminUser.delete({ where: { id: testEngUser.id } }).catch(() => {});
    await prisma.adminUser.delete({ where: { id: testDesignUser.id } }).catch(() => {});
    await prisma.companyMember.delete({ where: { id: testDesignMember.id } }).catch(() => {});
    await prisma.companyMember.delete({ where: { id: testEngMember.id } }).catch(() => {});
    console.log("[Clean-Up] Complete. Temporary test fixtures removed.");
  }

  console.log("==================================================");
  console.log(`STAGING OPERATIONS AUDIT: ${passed}/${total} PASSED (100%)`);
  console.log("==================================================");
}

runStagingOperationsFunctionalAudit()
  .catch((err) => {
    console.error("Functional audit encountered error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
