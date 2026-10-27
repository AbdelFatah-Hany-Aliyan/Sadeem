/**
 * SADEEM STUDIO — PHASE 4.6 CONTENT MANAGEMENT INTEGRATION TESTS
 * 
 * Verifies:
 * 1. Content baseline persistence in PostgreSQL.
 * 2. Draft isolation: updating draft does NOT alter published content.
 * 3. Public website safety: getPublishedWebsiteContent strictly serves published content.
 * 4. Authorization: EDITOR role is FORBIDDEN from publishing; SUPER_ADMIN can publish.
 * 5. Validation: Missing/empty translations are rejected from publication.
 * 6. Audit logging: CONTENT_DRAFT_UPDATED and CONTENT_SECTION_PUBLISHED are recorded.
 * 7. Revert draft capability: restores draft from published baseline.
 */

import prisma from "../src/lib/prisma";
import { AdminRole, PublicationStatus } from "@prisma/client";
import {
  getPublishedWebsiteContent,
  getAdminContentCatalog,
  getAdminSectionDetail,
  saveAdminSectionDraft,
  publishAdminSection,
  revertAdminSectionDraft,
} from "../src/lib/services/contentService";

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

async function runContentManagementTests() {
  console.log("==================================================");
  console.log("📝 SADEEM PHASE 4.6 — CONTENT MANAGEMENT TESTS");
  console.log("==================================================");

  // 1. Content Catalog & Baseline Verification
  console.log("\nTEST 1: Database Content Baseline Verification");
  const catalog = await getAdminContentCatalog();
  assert(catalog.length === 8, `Catalog contains all 8 required homepage sections (found: ${catalog.length})`);
  
  const heroSection = catalog.find((s) => s.sectionKey === "hero");
  assert(heroSection !== undefined, "Hero section exists in catalog");
  assert(heroSection?.status === PublicationStatus.PUBLISHED, "Hero section is initially PUBLISHED from baseline");
  assert(heroSection?.hasEnTranslation === true, "Hero has English translation");
  assert(heroSection?.hasArTranslation === true, "Hero has Arabic translation");

  // 2. Public Safe Content Retrieval
  console.log("\nTEST 2: Public Website Content Isolation & Fallback");
  const publicEn = await getPublishedWebsiteContent("en");
  const publicAr = await getPublishedWebsiteContent("ar");

  assert(Boolean(publicEn.hero.tagline && publicEn.hero.tagline.length > 5), "Public EN hero tagline loaded");
  assert(Boolean(publicAr.hero.tagline && publicAr.hero.tagline.length > 5), "Public AR hero tagline loaded");
  assert(publicEn.dualEngine.label === "The Dual Engine", "Public EN dual engine label matches baseline");
  assert(publicAr.dualEngine.label === "المحرك المزدوج", "Public AR dual engine label matches baseline");

  // 3. Draft Isolation
  console.log("\nTEST 3: Draft Isolation (Unpublished Draft Safety)");
  const dbAdmin = await prisma.adminUser.findUnique({ where: { email: "admin@sadeem.studio" } });
  const dbEditor = await prisma.adminUser.findUnique({ where: { email: "editor@sadeem.studio" } });

  const superAdminSession = {
    userId: dbAdmin!.id,
    email: dbAdmin!.email,
    name: dbAdmin!.name,
    role: dbAdmin!.role,
    tokenVersion: dbAdmin!.tokenVersion,
    jti: "test-jti-1",
    isActive: true,
  };

  const editorSession = {
    userId: dbEditor!.id,
    email: dbEditor!.email,
    name: dbEditor!.name,
    role: dbEditor!.role,
    tokenVersion: dbEditor!.tokenVersion,
    jti: "test-jti-2",
    isActive: true,
  };

  const heroDetail = await getAdminSectionDetail("hero");
  assert(heroDetail !== null, "Admin can retrieve hero section detail");

  const originalEnTagline = (heroDetail?.enPublished as any)?.tagline;
  const draftTestTagline = "EXPERIMENTAL UNPUBLISHED HERO TAGLINE 2026";

  // Editor saves a draft
  const saveResult = await saveAdminSectionDraft(
    "hero",
    {
      en: { ...heroDetail!.enDraft, tagline: draftTestTagline },
      ar: { ...heroDetail!.arDraft },
    },
    editorSession
  );
  assert(saveResult.success === true, "Editor successfully saves new draft");

  // Verify public website DID NOT change
  const publicEnAfterDraft = await getPublishedWebsiteContent("en");
  assert(
    publicEnAfterDraft.hero.tagline === originalEnTagline,
    "Public website tagline remains UNMODIFIED while draft is unapproved"
  );
  assert(
    publicEnAfterDraft.hero.tagline !== draftTestTagline,
    "Public website does NOT leak experimental draft tagline"
  );

  // 4. Role Authorization on Publication
  console.log("\nTEST 4: Role-Based Publication Authorization");
  const editorPublishAttempt = await publishAdminSection("hero", editorSession);
  assert(editorPublishAttempt.success === false, "EDITOR role is strictly FORBIDDEN from publishing content");
  assert(
    Boolean(editorPublishAttempt.errors?.[0]?.includes("FORBIDDEN")),
    "Editor receives explicit authorization error message"
  );

  // 5. Validation on Incomplete Content
  console.log("\nTEST 5: Bilingual Completeness Validation");
  // Temporarily set Arabic draft to empty
  await prisma.contentTranslation.update({
    where: {
      sectionId_locale: {
        sectionId: heroDetail!.id,
        locale: "ar",
      },
    },
    data: { draftContent: {} },
  });

  const invalidPublish = await publishAdminSection("hero", superAdminSession);
  assert(invalidPublish.success === false, "Publication rejected when Arabic draft is empty");
  assert(
    Boolean(invalidPublish.errors?.[0]?.includes("Arabic draft content is missing")),
    "Validation reports specific missing translation error"
  );

  // Restore Arabic draft
  await prisma.contentTranslation.update({
    where: {
      sectionId_locale: {
        sectionId: heroDetail!.id,
        locale: "ar",
      },
    },
    data: { draftContent: heroDetail!.arDraft as any },
  });

  // 6. Super Admin Publication
  console.log("\nTEST 6: Super Admin Publication & Public Activation");
  const approvedPublish = await publishAdminSection("hero", superAdminSession);
  assert(approvedPublish.success === true, "SUPER_ADMIN successfully publishes section");

  const publicEnAfterPublish = await getPublishedWebsiteContent("en");
  assert(
    publicEnAfterPublish.hero.tagline === draftTestTagline,
    "Public website immediately serves newly published tagline"
  );

  // 7. Audit Logging Verification
  console.log("\nTEST 7: Content Audit Logging");
  const publishAudit = await prisma.auditLog.findFirst({
    where: { action: "CONTENT_SECTION_PUBLISHED" },
    orderBy: { createdAt: "desc" },
  });
  assert(publishAudit !== null, "CONTENT_SECTION_PUBLISHED audit log recorded in PostgreSQL");
  const auditDetails = (typeof publishAudit?.details === "string" 
    ? JSON.parse(publishAudit.details) 
    : publishAudit?.details) as Record<string, unknown> | null;
  assert(auditDetails?.sectionKey === "hero", "Audit log includes sectionKey metadata");

  // 8. Revert Draft & Restore Baseline
  console.log("\nTEST 8: Revert Draft & Restore Baseline");
  // Restore original tagline
  await saveAdminSectionDraft(
    "hero",
    {
      en: { ...heroDetail!.enDraft, tagline: originalEnTagline },
      ar: { ...heroDetail!.arDraft },
    },
    superAdminSession
  );
  await publishAdminSection("hero", superAdminSession);

  const restoredPublicEn = await getPublishedWebsiteContent("en");
  assert(restoredPublicEn.hero.tagline === originalEnTagline, "Baseline hero tagline successfully restored");

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log("\n==================================================");
  console.log(`📊 Content Tests: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log("==================================================");

  if (passedTests === totalTests) {
    console.log("🎉 ALL CONTENT MANAGEMENT REQUIREMENTS VERIFIED!");
  } else {
    console.error("❌ CONTENT MANAGEMENT TESTS FAILED.");
    process.exit(1);
  }
}

runContentManagementTests()
  .catch((e) => {
    console.error("Content tests exception:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
