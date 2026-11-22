import prisma from "../src/lib/prisma";
import { 
  InquiryType, 
  InquiryStatus, 
  ContactChannel, 
  ProjectCategory, 
  ExpectedTimeline, 
  BudgetRange, 
  VentureStage,
  AdminRole 
} from "@prisma/client";
import { 
  submitBusinessProjectInquiry, 
  submitVenturePitchInquiry, 
  submitGeneralInquiry,
  getAdminInquiries,
  getAdminInquiryDetail,
  updateInquiryStatus,
  assignInquiry,
  updateInquiryInternalNotes,
  archiveOrDeleteInquiry,
  getActiveAdminUsers
} from "../src/lib/services/inquiryService";
import { validateUploadFile } from "../src/lib/storage/storageProvider";
import { resetRateLimit } from "../src/lib/auth/rate-limit";

async function runInquiryManagementTests() {
  console.log("==================================================");
  console.log("🧪 SADEEM PHASE 4.7 — INQUIRY & CRM TEST SUITE");
  console.log("==================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
    }
  }

  // Retrieve existing real admin users from database
  const dbAdmin = await prisma.adminUser.findFirst({
    where: { role: AdminRole.SUPER_ADMIN, isActive: true },
  });
  const dbEditor = await prisma.adminUser.findFirst({
    where: { role: AdminRole.EDITOR, isActive: true },
  }) || dbAdmin;

  if (!dbAdmin) {
    throw new Error("No active SUPER_ADMIN user found in database. Please seed or bootstrap admin first.");
  }

  const superAdminSession = {
    userId: dbAdmin.id,
    email: dbAdmin.email,
    name: dbAdmin.name,
    role: AdminRole.SUPER_ADMIN,
    tokenVersion: dbAdmin.tokenVersion,
    jti: "mock-jti-1",
    isActive: true,
  };

  const editorSession = {
    userId: dbEditor!.id,
    email: dbEditor!.email,
    name: dbEditor!.name,
    role: AdminRole.EDITOR,
    tokenVersion: dbEditor!.tokenVersion,
    jti: "mock-jti-2",
    isActive: true,
  };

  try {
    // -------------------------------------------------------------
    // SUITE 1: PUBLIC INTAKE — PATH A (START A PROJECT)
    // -------------------------------------------------------------
    console.log("SUITE 1: Path A — Start a Project Validation & Intake");

    // Reset rate limit for test emails
    const businessEmail = "client.corp@innovate.sa";
    resetRateLimit(`inquiry:${businessEmail}`);
    resetRateLimit(`inquiry:127.0.0.1`);

    // 1.1 Valid Business Project submission
    const now = Date.now();
    const validProject = await submitBusinessProjectInquiry(
      {
        name: "Sami Al-Mansoor",
        email: businessEmail,
        company: "Mansoor Logistics Co.",
        contactChannel: ContactChannel.WHATSAPP,
        phoneOrHandle: "+966501234567",
        projectCategory: ProjectCategory.ENTERPRISE_SYSTEM,
        problemStatement: "We need an integrated fleet tracking and automated dispatch engine to eliminate dispatch bottlenecks.",
        desiredOutcome: "Sub-second route optimization and real-time dashboard for 200+ transport units.",
        expectedTimeline: ExpectedTimeline.THREE_TO_SIX_MONTHS,
        budgetRange: BudgetRange.FIFTY_K_PLUS,
        locale: "ar",
        consentGiven: true,
        honeypot: "",
        formLoadedAt: now - 3000, // 3 seconds ago (human speed)
      },
      "127.0.0.1"
    );

    assert(validProject.success === true && !!validProject.inquiryId, "Valid Business Project inquiry saved with generated ID");

    const savedProjectInquiry = await prisma.inquiry.findUnique({
      where: { id: validProject.inquiryId },
    });

    assert(savedProjectInquiry?.status === InquiryStatus.NEW, "New Business Project inquiry starts with status NEW");
    assert(savedProjectInquiry?.inquiryType === InquiryType.BUSINESS_PROJECT, "InquiryType set to BUSINESS_PROJECT");
    assert(savedProjectInquiry?.projectCategory === ProjectCategory.ENTERPRISE_SYSTEM, "ProjectCategory saved accurately");
    assert(savedProjectInquiry?.budgetRange === BudgetRange.FIFTY_K_PLUS, "BudgetRange saved accurately");
    assert(savedProjectInquiry?.consentGiven === true && savedProjectInquiry?.consentVersion === "v1.0-2026", "Consent version and flag persisted");

    // 1.2 Missing consent rejection
    const noConsentProject = await submitBusinessProjectInquiry(
      {
        name: "Test User",
        email: "test.noconsent@example.com",
        projectCategory: ProjectCategory.MOBILE_APPLICATION,
        problemStatement: "Problem statement with sufficient length for test.",
        desiredOutcome: "Desired outcome with sufficient length for test.",
        expectedTimeline: ExpectedTimeline.ONE_TO_THREE_MONTHS,
        consentGiven: false,
        formLoadedAt: now - 2000,
      },
      "127.0.0.2"
    );
    assert(noConsentProject.success === false, "Submission without consent is rejected");

    // 1.3 Invalid email rejection
    const invalidEmailProject = await submitBusinessProjectInquiry(
      {
        name: "Test User",
        email: "not-an-email",
        projectCategory: ProjectCategory.WEB_PLATFORM,
        problemStatement: "Problem statement with sufficient length.",
        desiredOutcome: "Desired outcome with sufficient length.",
        expectedTimeline: ExpectedTimeline.ONE_TO_THREE_MONTHS,
        consentGiven: true,
        formLoadedAt: now - 2000,
      },
      "127.0.0.3"
    );
    assert(invalidEmailProject.success === false, "Invalid email address format is rejected");

    // -------------------------------------------------------------
    // SUITE 2: PUBLIC INTAKE — PATH B (PITCH AN IDEA / VENTURE STUDIO)
    // -------------------------------------------------------------
    console.log("\nSUITE 2: Path B — Pitch an Idea Validation & Legal Compliance");

    const founderEmail = "founder@nextgenfin.io";
    resetRateLimit(`inquiry:${founderEmail}`);
    resetRateLimit(`inquiry:127.0.0.4`);

    // 2.1 Valid Venture Pitch submission
    const validPitch = await submitVenturePitchInquiry(
      {
        name: "Reem Al-Ghamdi",
        email: founderEmail,
        ideaName: "FinPulse Protocol",
        contactChannel: ContactChannel.PHONE,
        phoneOrHandle: "+966555123456",
        ventureStage: VentureStage.PROTOTYPE,
        problemStatement: "SMEs face 45-day payment cycles with zero liquidity options in the regional supply chain.",
        targetAudience: "B2B suppliers and wholesalers across Saudi Arabia",
        founderExpertise: "8 years in investment banking and trade finance risk modeling.",
        expectedInvolvement: "Leading business development full-time; seeking Sadeem as technical co-founding partner.",
        existingResources: "https://figma.com/proto/test-prototype-link",
        locale: "en",
        consentGiven: true,
        honeypot: "",
        formLoadedAt: now - 5000,
      },
      "127.0.0.4"
    );

    assert(validPitch.success === true && !!validPitch.inquiryId, "Valid Venture Pitch inquiry successfully persisted");

    const savedPitchInquiry = await prisma.inquiry.findUnique({
      where: { id: validPitch.inquiryId },
    });

    assert(savedPitchInquiry?.inquiryType === InquiryType.VENTURE_PITCH, "InquiryType set to VENTURE_PITCH");
    assert(savedPitchInquiry?.ventureStage === VentureStage.PROTOTYPE, "VentureStage correctly saved");
    assert(savedPitchInquiry?.ideaName === "FinPulse Protocol", "Idea name persisted");
    assert(savedPitchInquiry?.sourceRoute === "/pitch-idea", "Source route marked /pitch-idea");

    // 2.2 Short problem statement rejection
    const shortProblemPitch = await submitVenturePitchInquiry(
      {
        name: "Founder",
        email: "f@test.com",
        ventureStage: VentureStage.IDEA,
        problemStatement: "Too short",
        targetAudience: "Everyone",
        founderExpertise: "Domain expert in the industry",
        expectedInvolvement: "Full time partner",
        consentGiven: true,
        formLoadedAt: now - 3000,
      },
      "127.0.0.5"
    );
    assert(shortProblemPitch.success === false, "Venture pitch with insufficient problem statement rejected");

    // -------------------------------------------------------------
    // SUITE 3: GENERAL CONTACT INTAKE
    // -------------------------------------------------------------
    console.log("\nSUITE 3: General Inquiries");

    const generalEmail = "press@techmagazine.com";
    resetRateLimit(`inquiry:${generalEmail}`);
    resetRateLimit(`inquiry:127.0.0.6`);

    const validGeneral = await submitGeneralInquiry(
      {
        name: "Tariq Press",
        email: generalEmail,
        company: "Tech Magazine MENA",
        message: "We would like to interview Sadeem's founders regarding the newly launched Venture Studio Engine.",
        locale: "ar",
        consentGiven: true,
        honeypot: "",
        formLoadedAt: now - 4000,
      },
      "127.0.0.6"
    );
    assert(validGeneral.success === true && !!validGeneral.inquiryId, "General inquiry successfully created");

    // -------------------------------------------------------------
    // SUITE 4: SPAM & BOT DEFENSE SIGNALS
    // -------------------------------------------------------------
    console.log("\nSUITE 4: Anti-Spam & Bot Mitigation");

    // 4.1 Honeypot filled by bot -> synthetic success without DB insertion
    const countBeforeHoneypot = await prisma.inquiry.count();
    const honeypotSubmission = await submitBusinessProjectInquiry(
      {
        name: "Bot Spammer",
        email: "bot@spammer.org",
        honeypot: "http://malicious-spam-link.ru", // Bot filled hidden field
        projectCategory: ProjectCategory.ENTERPRISE_SYSTEM,
        problemStatement: "Buy cheap backlinks today at our website right now.",
        desiredOutcome: "Massive SEO boosts instantly.",
        expectedTimeline: ExpectedTimeline.ONE_TO_THREE_MONTHS,
        consentGiven: true,
        formLoadedAt: now - 4000,
      },
      "127.0.0.7"
    );
    const countAfterHoneypot = await prisma.inquiry.count();

    assert(
      honeypotSubmission.success === true && countAfterHoneypot === countBeforeHoneypot,
      "Honeypot returns synthetic success to confuse bot scraper and records ZERO database rows"
    );

    // 4.2 Sub-second submission (< 1200ms) -> rejected as machine scripted
    const subSecondSubmission = await submitBusinessProjectInquiry(
      {
        name: "Fast Bot",
        email: "fastbot@spammer.org",
        honeypot: "",
        projectCategory: ProjectCategory.ENTERPRISE_SYSTEM,
        problemStatement: "Problem text with sufficient characters.",
        desiredOutcome: "Desired outcome with sufficient characters.",
        expectedTimeline: ExpectedTimeline.ONE_TO_THREE_MONTHS,
        consentGiven: true,
        formLoadedAt: Date.now() - 200, // Submitted in 200ms
      },
      "127.0.0.8"
    );
    const countAfterSubSecond = await prisma.inquiry.count();

    assert(
      subSecondSubmission.success === true && countAfterSubSecond === countBeforeHoneypot,
      "Sub-second submission rejected without DB pollution"
    );

    // -------------------------------------------------------------
    // SUITE 5: ADMINISTRATIVE CRM & PIPELINE WORKFLOWS
    // -------------------------------------------------------------
    console.log("\nSUITE 5: Administrative CRM Pipeline & Lifecycle");

    // 5.1 Retrieval with filtering
    const catalog = await getAdminInquiries({ limit: 50 });
    assert(catalog.items.length >= 3, "getAdminInquiries() returns populated lead items");
    assert(typeof catalog.newCount === "number", "catalog reports unreviewed count");

    // 5.2 Filter by Type
    const projectOnly = await getAdminInquiries({ type: InquiryType.BUSINESS_PROJECT });
    assert(
      projectOnly.items.every((i) => i.inquiryType === InquiryType.BUSINESS_PROJECT),
      "Filtering by InquiryType.BUSINESS_PROJECT isolates business leads"
    );

    // 5.3 First inspection automatically marks reviewedAt
    const unreviewed = await prisma.inquiry.findUnique({
      where: { id: validProject.inquiryId! },
    });
    assert(unreviewed?.reviewedAt === null, "New inquiry reviewedAt is initially null");

    const inspected = await getAdminInquiryDetail(validProject.inquiryId!, superAdminSession);
    assert(
      inspected !== null && inspected.reviewedAt !== null,
      "Opening inquiry detail automatically marks reviewedAt timestamp"
    );
    assert(
      inspected?.status === InquiryStatus.REVIEWING,
      "Inquiry status automatically advances from NEW to REVIEWING on first team inspection"
    );

    // 5.4 Advance pipeline: REVIEWING -> QUALIFIED -> DISCOVERY -> ACCEPTED
    const statusUpdateRes = await updateInquiryStatus(
      validProject.inquiryId!,
      InquiryStatus.QUALIFIED,
      superAdminSession
    );
    assert(statusUpdateRes.success === true, "updateInquiryStatus() transitions lead to QUALIFIED");

    const statusCheck = await prisma.inquiry.findUnique({ where: { id: validProject.inquiryId! } });
    assert(statusCheck?.status === InquiryStatus.QUALIFIED, "Database reflects QUALIFIED status");

    // 5.5 Team Assignment
    const activeAdmins = await getActiveAdminUsers();
    assert(activeAdmins.length > 0, "getActiveAdminUsers() retrieves active administrators");

    const targetAdmin = activeAdmins[0];
    const assignRes = await assignInquiry(validProject.inquiryId!, targetAdmin.id, superAdminSession);
    assert(assignRes.success === true, "assignInquiry() assigns lead to team member");

    const assignedCheck = await prisma.inquiry.findUnique({
      where: { id: validProject.inquiryId! },
      include: { assignedTo: true },
    });
    assert(assignedCheck?.assignedToId === targetAdmin.id, "Lead assignedToId persisted in database");
    assert(assignedCheck?.assignedTo?.email === targetAdmin.email, "Relation to AdminUser properly joined");

    // 5.6 Internal Notes and Follow-Up Date
    const followUp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const notesRes = await updateInquiryInternalNotes(
      validProject.inquiryId!,
      "Introductory call completed. Client requested technical architecture outline for fleet routing.",
      followUp,
      superAdminSession
    );
    assert(notesRes.success === true, "updateInquiryInternalNotes() successfully saves notes and follow-up date");

    const notesCheck = await prisma.inquiry.findUnique({ where: { id: validProject.inquiryId! } });
    assert(
      notesCheck?.internalNotes?.includes("Introductory call completed") === true,
      "Internal notes verified in database"
    );
    assert(notesCheck?.followUpDate !== null, "Follow-up date verified in database");

    // -------------------------------------------------------------
    // SUITE 6: ROLE-BASED ACCESS CONTROL (RBAC) & ARCHIVAL
    // -------------------------------------------------------------
    console.log("\nSUITE 6: RBAC & Archival Security");

    // 6.1 Editor cannot archive or delete inquiry
    const editorArchiveAttempt = await archiveOrDeleteInquiry(
      validGeneral.inquiryId!,
      editorSession,
      false
    );
    assert(
      editorArchiveAttempt.success === false && editorArchiveAttempt.errors?.[0]?.includes("FORBIDDEN") === true,
      "EDITOR role is prohibited from archiving or deleting leads"
    );

    // 6.2 SUPER_ADMIN can safely archive inquiry
    const superAdminArchiveRes = await archiveOrDeleteInquiry(
      validGeneral.inquiryId!,
      superAdminSession,
      false
    );
    assert(superAdminArchiveRes.success === true, "SUPER_ADMIN can archive leads");

    const archivedCheck = await prisma.inquiry.findUnique({ where: { id: validGeneral.inquiryId! } });
    assert(archivedCheck?.status === InquiryStatus.CLOSED, "Archived inquiry status transitioned to CLOSED");
    assert(archivedCheck?.closedAt !== null, "Archived inquiry closedAt timestamp set");

    // -------------------------------------------------------------
    // SUITE 7: AUDIT LOG VERIFICATION
    // -------------------------------------------------------------
    console.log("\nSUITE 7: Audit Logging & Sensitive Data Exclusion");

    const inquiryAuditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: "Inquiry",
        entityId: validProject.inquiryId!,
      },
      orderBy: { createdAt: "desc" },
    });

    assert(inquiryAuditLogs.length >= 4, "AuditLog recorded all lifecycle events for inquiry");

    const actions = inquiryAuditLogs.map((l) => l.action);
    assert(actions.includes("INQUIRY_CREATED"), "INQUIRY_CREATED action recorded in AuditLog");
    assert(actions.includes("INQUIRY_REVIEWED"), "INQUIRY_REVIEWED action recorded in AuditLog");
    assert(actions.includes("INQUIRY_STATUS_CHANGED"), "INQUIRY_STATUS_CHANGED action recorded in AuditLog");
    assert(actions.includes("INQUIRY_ASSIGNMENT_CHANGED"), "INQUIRY_ASSIGNMENT_CHANGED action recorded in AuditLog");
    assert(actions.includes("INQUIRY_NOTES_UPDATED"), "INQUIRY_NOTES_UPDATED action recorded in AuditLog");

    // Verify no secret leak in audit logs
    const hasSecretsInLogs = inquiryAuditLogs.some((l) => {
      const s = JSON.stringify(l.details || {});
      return s.includes("password") || s.includes("token") || s.includes("secret");
    });
    assert(!hasSecretsInLogs, "AuditLog contains ZERO passwords, tokens, or private secrets");

    // -------------------------------------------------------------
    // SUITE 8: SVG UPLOAD SECURITY GATE (PHASE 4.6 CLOSURE)
    // -------------------------------------------------------------
    console.log("\nSUITE 8: SVG Upload Security Verification");

    // Valid SVG
    const safeSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40"/></svg>');
    const safeCheck = validateUploadFile({
      buffer: safeSvg,
      filename: "diagram.svg",
      mimeType: "image/svg+xml",
    });
    assert(safeCheck.valid === true, "Valid clean SVG is approved by upload validator");

    // Malicious SVG with script
    const maliciousScriptSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert("xss")</script></svg>');
    const scriptCheck = validateUploadFile({
      buffer: maliciousScriptSvg,
      filename: "exploit.svg",
      mimeType: "image/svg+xml",
    });
    assert(
      scriptCheck.valid === false && scriptCheck.error?.includes("forbidden executable markup") === true,
      "SVG containing <script> is strictly rejected"
    );

    // Malicious SVG with onload handler
    const maliciousOnloadSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><rect width="100" height="100"/></svg>');
    const onloadCheck = validateUploadFile({
      buffer: maliciousOnloadSvg,
      filename: "onload_exploit.svg",
      mimeType: "image/svg+xml",
    });
    assert(
      onloadCheck.valid === false && onloadCheck.error?.includes("forbidden executable markup") === true,
      "SVG containing onload= handler is strictly rejected"
    );

    // -------------------------------------------------------------
    // CLEANUP TEST RECORDS
    // -------------------------------------------------------------
    console.log("\nCleaning up test inquiries...");
    await prisma.auditLog.deleteMany({
      where: {
        entityId: {
          in: [validProject.inquiryId!, validPitch.inquiryId!, validGeneral.inquiryId!].filter(Boolean) as string[],
        },
      },
    });

    await prisma.inquiry.deleteMany({
      where: {
        id: {
          in: [validProject.inquiryId!, validPitch.inquiryId!, validGeneral.inquiryId!].filter(Boolean) as string[],
        },
      },
    });

    console.log("Test records safely removed from sadeem_dev.\n");

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log("==================================================");
    console.log(`🏁 TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
    console.log("==================================================");

    if (passedTests === totalTests) {
      console.log("🎉 ALL INQUIRY MANAGEMENT & CRM TESTS PASSED PERFECTLY!");
    } else {
      console.error(`⚠️ ${totalTests - passedTests} TESTS FAILED`);
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runInquiryManagementTests();
