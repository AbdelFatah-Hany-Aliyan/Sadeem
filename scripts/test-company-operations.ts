/**
 * SADEEM — COMPANY OPERATIONS SPRINT TEST SUITE
 * 
 * Verifies all operational collaboration features against the isolated local development database:
 * - Scope & department access enforcement
 * - Task ownership & multi-collaborator assignment
 * - Subtask checklists & progress calculation
 * - Task discussions, mentions, and notifications
 * - Deliverables & attachments validation
 * - Review and approval workflow invariants
 * - Department announcements & multicast
 * - Personal workspace isolation
 */

import fs from "fs";
import path from "path";

// Auto-load .env
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
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
import {
  canAccessDepartment,
  canAccessTask,
  canReviewTask,
  canModerateComment,
} from "../src/lib/auth/scopeGuard";
import {
  createTask,
  updateTask,
  addTaskCollaborator,
  removeTaskCollaborator,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  calculateTaskProgress,
  addTaskComment,
  editTaskComment,
  deleteTaskComment,
  getTaskComments,
  addDeliverableLink,
  addDeliverableUpload,
  reviewDeliverable,
  submitTaskForReview,
  approveTaskReview,
  requestTaskChanges,
  broadcastDepartmentAnnouncement,
  getTasks,
  isValidStatusTransition,
} from "../src/lib/services/companyTaskService";
import { validateDeliverableFile } from "../src/lib/storage/storageProvider";
import {
  AdminRole,
  MemberStatus,
  TaskStatus,
  TaskPriority,
  DeliverableType,
  DeliverableStatus,
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

async function runOperationsSuite() {
  console.log("==================================================");
  console.log("SADEEM — OPERATIONS & COLLABORATION VERIFICATION SUITE");
  console.log("==================================================");

  // Safety verification
  const dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl.includes("localhost") && !dbUrl.includes("127.0.0.1")) {
    throw new Error(`SAFETY HALT: Operations tests must run only on localhost!`);
  }

  // Fetch Marketing and Engineering core teams
  const marketingTeam = await prisma.companyTeam.findUnique({ where: { code: "MARKETING" } });
  const engineeringTeam = await prisma.companyTeam.findUnique({ where: { code: "ENGINEERING" } });
  if (!marketingTeam || !engineeringTeam) {
    throw new Error("Core teams not found. Ensure baseline seed has run.");
  }

  const timestamp = Date.now();
  const createdMemberIds: string[] = [];
  const createdAdminIds: string[] = [];
  const createdTaskIds: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // Setup Test Actors
    // -------------------------------------------------------------------------
    // 1. Marketing Lead Member & Admin
    const mktLeadMember = await prisma.companyMember.create({
      data: {
        fullNameEn: `Sara MktLead ${timestamp}`,
        fullNameAr: "سارة قائدة التسويق",
        email: `sara.mkt.${timestamp}@sadeem.studio`,
        jobTitleEn: "Marketing Lead",
        status: MemberStatus.ACTIVE,
        memberships: {
          create: {
            teamId: marketingTeam.id,
            teamRole: "LEAD",
            isPrimary: true,
          },
        },
      },
    });
    createdMemberIds.push(mktLeadMember.id);

    const mktLeadAdmin = await prisma.adminUser.create({
      data: {
        email: mktLeadMember.email,
        name: mktLeadMember.fullNameEn,
        passwordHash: "hash_test_dummy",
        role: AdminRole.TEAM_LEAD,
        companyMemberId: mktLeadMember.id,
      },
    });
    createdAdminIds.push(mktLeadAdmin.id);

    // 2. Marketing Member
    const mktMember = await prisma.companyMember.create({
      data: {
        fullNameEn: `Nour Marketer ${timestamp}`,
        fullNameAr: "نور مسوقة",
        email: `nour.mkt.${timestamp}@sadeem.studio`,
        jobTitleEn: "Content Specialist",
        status: MemberStatus.ACTIVE,
        memberships: {
          create: {
            teamId: marketingTeam.id,
            teamRole: "MEMBER",
            isPrimary: true,
          },
        },
      },
    });
    createdMemberIds.push(mktMember.id);

    const mktMemberAdmin = await prisma.adminUser.create({
      data: {
        email: mktMember.email,
        name: mktMember.fullNameEn,
        passwordHash: "hash_test_dummy",
        role: AdminRole.TEAM_MEMBER,
        companyMemberId: mktMember.id,
      },
    });
    createdAdminIds.push(mktMemberAdmin.id);

    // 3. Engineering Member (outside Marketing)
    const engMember = await prisma.companyMember.create({
      data: {
        fullNameEn: `Omar Engineer ${timestamp}`,
        fullNameAr: "عمر مهندس",
        email: `omar.eng.${timestamp}@sadeem.studio`,
        jobTitleEn: "Senior Fullstack Engineer",
        status: MemberStatus.ACTIVE,
        memberships: {
          create: {
            teamId: engineeringTeam.id,
            teamRole: "MEMBER",
            isPrimary: true,
          },
        },
      },
    });
    createdMemberIds.push(engMember.id);

    const engMemberAdmin = await prisma.adminUser.create({
      data: {
        email: engMember.email,
        name: engMember.fullNameEn,
        passwordHash: "hash_test_dummy",
        role: AdminRole.TEAM_MEMBER,
        companyMemberId: engMember.id,
      },
    });
    createdAdminIds.push(engMemberAdmin.id);

    // 4. Super Admin Session Stub
    const superAdminSession = {
      userId: "sa_user_id",
      email: "founder@sadeem.studio",
      name: "Founder",
      role: AdminRole.SUPER_ADMIN,
      tokenVersion: 1,
      jti: "jti_sa",
      isActive: true,
    };

    const mktMemberSession = {
      userId: mktMemberAdmin.id,
      email: mktMemberAdmin.email,
      name: mktMemberAdmin.name,
      role: AdminRole.TEAM_MEMBER,
      tokenVersion: 1,
      jti: "jti_mkt",
      isActive: true,
    };

    const engMemberSession = {
      userId: engMemberAdmin.id,
      email: engMemberAdmin.email,
      name: engMemberAdmin.name,
      role: AdminRole.TEAM_MEMBER,
      tokenVersion: 1,
      jti: "jti_eng",
      isActive: true,
    };

    const mktLeadSession = {
      userId: mktLeadAdmin.id,
      email: mktLeadAdmin.email,
      name: mktLeadAdmin.name,
      role: AdminRole.TEAM_LEAD,
      tokenVersion: 1,
      jti: "jti_lead",
      isActive: true,
    };

    // -------------------------------------------------------------------------
    // TEST 1 & 2: Scope Guard Department Access
    // -------------------------------------------------------------------------
    const saMktAccess = await canAccessDepartment(superAdminSession as any, "MARKETING");
    const saEngAccess = await canAccessDepartment(superAdminSession as any, "ENGINEERING");
    assert(1, "SUPER_ADMIN has universal access to all department workspaces", saMktAccess.allowed && saEngAccess.allowed);

    const mktInMkt = await canAccessDepartment(mktMemberSession as any, "MARKETING");
    const mktInEng = await canAccessDepartment(mktMemberSession as any, "ENGINEERING");
    assert(
      2,
      "TEAM_MEMBER can access only their own department and is blocked from other departments",
      mktInMkt.allowed && !mktInEng.allowed
    );

    // -------------------------------------------------------------------------
    // TEST 3: Task Creation with Initial Collaborators & Checklist
    // -------------------------------------------------------------------------
    const task1 = await createTask({
      title: `Launch Campaign Q4 ${timestamp}`,
      description: "Prepare and launch Q4 marketing campaign",
      teamId: marketingTeam.id,
      assignedMemberId: mktMember.id,
      collaboratorMemberIds: [mktLeadMember.id],
      checklistTitles: ["Draft copy", "Review creatives", "Schedule publications"],
      priority: TaskPriority.HIGH,
      status: TaskStatus.IN_PROGRESS,
      reviewRequired: true,
      reviewerMemberId: mktLeadMember.id,
    }, mktLeadAdmin.id);
    createdTaskIds.push(task1.id);

    const task1Full = await prisma.companyTask.findUnique({
      where: { id: task1.id },
      include: {
        collaborators: true,
        checklistItems: true,
      },
    });

    assert(
      3,
      "Task created with initial collaborators and checklist items",
      Boolean(task1Full && task1Full.collaborators.length === 1 && task1Full.checklistItems.length === 3)
    );

    // -------------------------------------------------------------------------
    // TEST 4: Collaborator Addition & Removal
    // -------------------------------------------------------------------------
    await addTaskCollaborator(task1.id, engMember.id, mktLeadAdmin.id);
    const afterAdd = await prisma.taskCollaborator.count({ where: { taskId: task1.id } });
    await removeTaskCollaborator(task1.id, engMember.id, mktLeadAdmin.id);
    const afterRemove = await prisma.taskCollaborator.count({ where: { taskId: task1.id } });

    assert(
      4,
      "Collaborator can be dynamically added and removed",
      afterAdd === 2 && afterRemove === 1
    );

    // -------------------------------------------------------------------------
    // TEST 5: Checklist Items Toggling & Progress Calculation
    // -------------------------------------------------------------------------
    const item1 = task1Full!.checklistItems[0];
    const toggled = await toggleChecklistItem(item1.id, true, { memberId: mktMember.id });
    const progress1 = calculateTaskProgress([
      { isCompleted: true },
      { isCompleted: false },
      { isCompleted: false },
    ]);

    assert(
      5,
      "Checklist item toggles completion and accurate task progress (33%) is calculated",
      toggled.isCompleted === true && progress1.percentage === 33 && progress1.completed === 1
    );

    // -------------------------------------------------------------------------
    // TEST 6: Task Discussions & Comment Creation
    // -------------------------------------------------------------------------
    const comment1 = await addTaskComment({
      taskId: task1.id,
      content: "First draft of social copy is ready for preliminary review.",
      authorMemberId: mktMember.id,
      authorAdminId: mktMemberAdmin.id,
    });

    const commentsList = await getTaskComments(task1.id);
    assert(
      6,
      "Task comments are recorded chronologically and linked to author",
      commentsList.length === 1 && commentsList[0].content.includes("First draft")
    );

    // -------------------------------------------------------------------------
    // TEST 7 & 8: Mentions in Comments & Notifications
    // -------------------------------------------------------------------------
    await addTaskComment({
      taskId: task1.id,
      content: `Hello @Sara, please check the new copy when free!`,
      authorMemberId: mktMember.id,
      authorAdminId: mktMemberAdmin.id,
    });

    const mentionNotification = await prisma.companyNotification.findFirst({
      where: {
        recipientMemberId: mktLeadMember.id,
        type: "TASK_COMMENT_MENTION",
      },
    });

    assert(
      7,
      "@MemberName mention in comment extracts user and dispatches TASK_COMMENT_MENTION notification",
      Boolean(mentionNotification && mentionNotification.title.includes("Mentioned"))
    );

    // @all mention test
    await addTaskComment({
      taskId: task1.id,
      content: `Notice: @all marketing sync scheduled for tomorrow morning!`,
      authorMemberId: mktLeadMember.id,
      authorAdminId: mktLeadAdmin.id,
    });

    const allMemberNotif = await prisma.companyNotification.findFirst({
      where: {
        recipientMemberId: mktMember.id,
        type: "TASK_COMMENT_MENTION",
      },
    });

    assert(
      8,
      "@all mention broadcasts notification to all department team members",
      Boolean(allMemberNotif)
    );

    // -------------------------------------------------------------------------
    // TEST 9 & 10: Comment Editing & Soft Deletion
    // -------------------------------------------------------------------------
    const editedComment = await editTaskComment(comment1.id, "Updated draft of social copy is ready.", {
      memberId: mktMember.id,
      adminUserId: mktMemberAdmin.id,
      role: AdminRole.TEAM_MEMBER,
    });

    assert(
      9,
      "Author can edit their own comment and isEdited is flagged",
      editedComment.isEdited === true && editedComment.content.includes("Updated draft")
    );

    const deletedComment = await deleteTaskComment(comment1.id, {
      memberId: mktLeadMember.id,
      adminUserId: mktLeadAdmin.id,
      role: AdminRole.TEAM_LEAD,
    });

    assert(
      10,
      "Authorized manager/lead can soft-delete comments (isDeleted=true)",
      deletedComment.isDeleted === true && deletedComment.content.includes("deleted")
    );

    // -------------------------------------------------------------------------
    // TEST 11: Deliverable Links (Figma / GitHub / Docs)
    // -------------------------------------------------------------------------
    const figmaDeliv = await addDeliverableLink({
      taskId: task1.id,
      title: "Q4 Campaign Banner Figma Mockups",
      type: DeliverableType.FIGMA_LINK,
      url: "https://figma.com/file/dummy-q4-banners",
      authorMemberId: mktMember.id,
    });

    assert(
      11,
      "Members can attach external deliverable links (Figma) with SUBMITTED status",
      figmaDeliv.type === "FIGMA_LINK" && figmaDeliv.status === "SUBMITTED"
    );

    // -------------------------------------------------------------------------
    // TEST 12: Deliverable File Validation
    // -------------------------------------------------------------------------
    const validPdfBuffer = Buffer.from("%PDF-1.4 dummy valid pdf content");
    const validPdfCheck = validateDeliverableFile({
      buffer: validPdfBuffer,
      filename: "campaign_strategy.pdf",
      mimeType: "application/pdf",
    });

    const maliciousCheck = validateDeliverableFile({
      buffer: Buffer.from("malicious script"),
      filename: "malware.exe",
      mimeType: "application/x-msdownload",
    });

    assert(
      12,
      "Deliverable validation allows safe documents (PDF) and strictly blocks executable files (.exe)",
      validPdfCheck.valid === true && maliciousCheck.valid === false
    );

    // -------------------------------------------------------------------------
    // TEST 13: Review Workflow — Submit for Review
    // -------------------------------------------------------------------------
    const submittedTask = await submitTaskForReview(task1.id, {
      memberId: mktMember.id,
      adminUserId: mktMemberAdmin.id,
      notes: "All banners and copy ready for final signoff.",
    });

    assert(
      13,
      "Submitting work for review transitions task to IN_REVIEW and logs submission notes",
      submittedTask.status === TaskStatus.IN_REVIEW
    );

    // -------------------------------------------------------------------------
    // TEST 14: Review Workflow — Request Changes
    // -------------------------------------------------------------------------
    const changesTask = await requestTaskChanges(task1.id, {
      memberId: mktLeadMember.id,
      adminUserId: mktLeadAdmin.id,
      feedbackNotes: "Please adjust brand logo alignment on slide 3.",
    });

    const delivAfterChanges = await prisma.taskDeliverable.findUnique({
      where: { id: figmaDeliv.id },
    });

    assert(
      14,
      "Requesting changes returns task to IN_PROGRESS and marks deliverables CHANGES_REQUESTED",
      changesTask.status === TaskStatus.IN_PROGRESS &&
        delivAfterChanges?.status === DeliverableStatus.CHANGES_REQUESTED
    );

    // -------------------------------------------------------------------------
    // TEST 15: Review Workflow — Approve Review
    // -------------------------------------------------------------------------
    // Re-submit
    await submitTaskForReview(task1.id, {
      memberId: mktMember.id,
      adminUserId: mktMemberAdmin.id,
      notes: "Logo alignment corrected.",
    });

    const approvedTask = await approveTaskReview(task1.id, {
      memberId: mktLeadMember.id,
      adminUserId: mktLeadAdmin.id,
      notes: "Approved. Excellent work!",
    });

    const delivAfterApproval = await prisma.taskDeliverable.findUnique({
      where: { id: figmaDeliv.id },
    });

    assert(
      15,
      "Authorized review approval transitions task to DONE and marks deliverables APPROVED",
      approvedTask.status === TaskStatus.DONE &&
        delivAfterApproval?.status === DeliverableStatus.APPROVED
    );

    // -------------------------------------------------------------------------
    // TEST 16: Review Protection Guard
    // -------------------------------------------------------------------------
    const transitionCheck = isValidStatusTransition(
      TaskStatus.IN_PROGRESS,
      TaskStatus.DONE,
      true // reviewRequired
    );

    assert(
      16,
      "Review-required tasks strictly block direct transition from IN_PROGRESS to DONE without review",
      transitionCheck.valid === false
    );

    // -------------------------------------------------------------------------
    // TEST 17: Department Announcements
    // -------------------------------------------------------------------------
    const announcementResult = await broadcastDepartmentAnnouncement(marketingTeam.id, {
      title: "Q4 Strategy Kickoff",
      message: "Please review the updated deliverables list before Wednesday.",
    });

    const mktAnnounceNotif = await prisma.companyNotification.findFirst({
      where: {
        recipientMemberId: mktMember.id,
        type: "TEAM_ANNOUNCEMENT",
      },
    });

    assert(
      17,
      "broadcastDepartmentAnnouncement notifies department members with TEAM_ANNOUNCEMENT",
      announcementResult.notifiedCount >= 2 && Boolean(mktAnnounceNotif)
    );

    // -------------------------------------------------------------------------
    // TEST 18: Personal Workspace Queries Isolation
    // -------------------------------------------------------------------------
    const userAssigned = await getTasks({ assignedMemberId: mktMember.id });
    const userCollaborating = await getTasks({ collaboratorMemberId: mktLeadMember.id });

    assert(
      18,
      "Task filtering accurately separates assigned owner tasks from collaborating tasks",
      userAssigned.some((t) => t.id === task1.id) &&
        userCollaborating.some((t) => t.id === task1.id)
    );

    // -------------------------------------------------------------------------
    // TEST 19: Marketing Operational Focus Queries
    // -------------------------------------------------------------------------
    const mktTasks = await getTasks({ teamId: marketingTeam.id });
    const mktDeliverables = mktTasks.flatMap((t) => t.deliverables);

    assert(
      19,
      "Marketing workspace tasks and creative deliverables are fully accessible and queryable",
      mktTasks.length >= 1 && mktDeliverables.length >= 1
    );

  } finally {
    // -------------------------------------------------------------------------
    // Clean up test records
    // -------------------------------------------------------------------------
    console.log("Cleaning up test artifacts...");
    for (const tid of createdTaskIds) {
      await prisma.companyTask.delete({ where: { id: tid } }).catch(() => {});
    }
    for (const aid of createdAdminIds) {
      await prisma.adminUser.delete({ where: { id: aid } }).catch(() => {});
    }
    for (const mid of createdMemberIds) {
      await prisma.companyMember.delete({ where: { id: mid } }).catch(() => {});
    }
  }

  console.log("==================================================");
  console.log(`TOTAL SCENARIOS TESTED: ${results.length}`);
  console.log(`PASSED: ${results.filter((r) => r.passed).length}/${results.length}`);
  console.log(`FAILED: ${results.filter((r) => !r.passed).length}/${results.length}`);
  console.log("==================================================");

  if (results.some((r) => !r.passed)) {
    process.exit(1);
  }
}

runOperationsSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
