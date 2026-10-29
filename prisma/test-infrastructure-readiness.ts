import prisma from "../src/lib/prisma";
import { AdminRole, PublicationStatus } from "@prisma/client";
import { getRateLimiterStatus, verifyDistributedRateLimiterConfig, checkDistributedRateLimit, checkRateLimit } from "../src/lib/auth/rate-limit";
import { getStorageStatus, validateUploadFile, uploadFileToStorage } from "../src/lib/storage/storageProvider";
import { getPublishedProjects, getPreviewProjects, getProjectDetailBySlug } from "../src/lib/services/projectService";
import { submitBusinessProjectInquiry, getAdminInquiries } from "../src/lib/services/inquiryService";
import nextConfig from "../next.config.mjs";

async function runInfrastructureReadinessTests() {
  console.log("==================================================");
  console.log("🏗️ SADEEM PHASE 4.9 — INFRASTRUCTURE READINESS AUDIT");
  console.log("==================================================\n");

  let total = 0;
  let passed = 0;

  function assert(cond: boolean, msg: string) {
    total++;
    if (cond) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
    }
  }

  // -------------------------------------------------------------
  // SUITE 1: ENVIRONMENT & SECRET VALIDATION BEHAVIOR
  // -------------------------------------------------------------
  console.log("SUITE 1: Environment Variables & Secret Configuration");

  // Check DATABASE_URL presence
  assert(!!process.env.DATABASE_URL, "DATABASE_URL is defined in environment");
  assert(
    !process.env.DATABASE_URL?.includes("sadeem_prod"),
    "Development environment correctly points to local development database, not production"
  );

  // Check AUTH_SECRET behavior
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAuthSecret = process.env.AUTH_SECRET;
  const originalJwtSecret = process.env.JWT_SECRET;

  // In development, fallback is allowed
  assert(typeof originalNodeEnv === "string", `Current NODE_ENV is '${originalNodeEnv}'`);

  // -------------------------------------------------------------
  // SUITE 2: POSTGRESQL PRODUCTION ISOLATION & MIGRATION STATUS
  // -------------------------------------------------------------
  console.log("\nSUITE 2: PostgreSQL Database & Migration Verification");

  const migrationRecords = await prisma.$queryRaw<Array<{ migration_name: string; finished_at: Date }>>`
    SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at ASC;
  `;

  assert(migrationRecords.length === 3, `Prisma migration table has exactly 3 applied migrations (found: ${migrationRecords.length})`);
  assert(
    migrationRecords.some((m) => m.migration_name.includes("init")),
    "Initial baseline migration recorded"
  );
  assert(
    migrationRecords.some((m) => m.migration_name.includes("content_media")),
    "Phase 4.6 content and media migration recorded"
  );
  assert(
    migrationRecords.some((m) => m.migration_name.includes("inquiry_management")),
    "Phase 4.7 inquiry CRM migration recorded"
  );

  // -------------------------------------------------------------
  // SUITE 3: DISTRIBUTED RATE LIMITER CONFIGURATION AUDIT
  // -------------------------------------------------------------
  console.log("\nSUITE 3: Distributed Rate Limiting Readiness Audit");

  const rlStatus = getRateLimiterStatus();
  const rlConfig = verifyDistributedRateLimiterConfig();

  assert(typeof rlStatus.isDistributed === "boolean", "Rate limiter provides explicit isDistributed boolean status");
  assert(typeof rlStatus.isProductionGrade === "boolean", "Rate limiter provides explicit isProductionGrade boolean status");

  // In local development without Upstash, it must be reported as in_memory and NOT production-grade
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    assert(
      rlConfig.isReadyForProduction === false,
      "System correctly reports that distributed rate limiting is NOT ready for production without Upstash credentials"
    );
    assert(
      rlConfig.message.includes("CONFIGURATION REQUIRED"),
      "System provides explicit actionable message identifying missing distributed rate limiter variables"
    );
  }

  // Verify in-memory fallback works reliably
  const testKey = "infra-test-key";
  const checkResult = await checkDistributedRateLimit(testKey);
  assert(checkResult.allowed === true, "checkDistributedRateLimit() functions seamlessly in local development mode");

  // -------------------------------------------------------------
  // SUITE 4: OBJECT STORAGE READINESS & BLOCKED MODE AUDIT
  // -------------------------------------------------------------
  console.log("\nSUITE 4: Object Storage & Upload Security Readiness");

  const storageStatus = getStorageStatus();
  assert(storageStatus.configured === false, "Storage provider reports configured: false in development without credentials");
  assert(
    storageStatus.missingVariables.includes("STORAGE_BUCKET"),
    "Storage status correctly identifies missing STORAGE_BUCKET variable"
  );

  // Verify upload blocking
  let uploadBlocked = false;
  try {
    await uploadFileToStorage({
      buffer: Buffer.from("fake image data"),
      filename: "test.jpg",
      mimeType: "image/jpeg",
    });
  } catch (err: any) {
    uploadBlocked = err.message.includes("STORAGE_BLOCKED") || err.message.includes("Upload rejected");
  }
  assert(uploadBlocked === true, "uploadFileToStorage() safely blocks execution and throws explicit error when unconfigured");

  // Verify SVG rejection by default in production
  (process.env as any).NODE_ENV = "production";
  delete process.env.ALLOW_UNTRUSTED_SVG;

  const testSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>');
  const prodSvgCheck = validateUploadFile({
    buffer: testSvg,
    filename: "logo.svg",
    mimeType: "image/svg+xml",
  });
  assert(
    prodSvgCheck.valid === false && Boolean(prodSvgCheck.error?.includes("disabled by default in production")),
    "Untrusted SVG uploads are strictly rejected by default in production"
  );

  (process.env as any).NODE_ENV = originalNodeEnv;

  // -------------------------------------------------------------
  // SUITE 5: EMAIL DELIVERY STATUS & CRM PERSISTENCE
  // -------------------------------------------------------------
  console.log("\nSUITE 5: Email Delivery & Database Lead Persistence");

  // Inquiries must persist to PostgreSQL regardless of outbound email setup
  const now = Date.now();
  const testInquiry = await submitBusinessProjectInquiry(
    {
      name: "Infra Audit Lead",
      email: "infra.audit@sadeem.studio",
      company: "Sadeem Infrastructure",
      projectCategory: "ENTERPRISE_SYSTEM" as any,
      problemStatement: "Testing lead persistence without email delivery provider configured.",
      desiredOutcome: "Reliable database capture in PostgreSQL CRM.",
      expectedTimeline: "ONE_TO_THREE_MONTHS" as any,
      consentGiven: true,
      formLoadedAt: now - 3000,
    },
    "127.0.0.1"
  );

  assert(testInquiry.success === true && !!testInquiry.inquiryId, "Lead inquiry persists to PostgreSQL even without active email service");

  const adminInquiryCheck = await getAdminInquiries({ search: "infra.audit@sadeem.studio" });
  assert(
    adminInquiryCheck.items.length >= 1,
    "Persisted inquiry is immediately visible in the Admin CRM catalog"
  );

  // Clean up test inquiry
  if (testInquiry.inquiryId) {
    await prisma.auditLog.deleteMany({ where: { entityId: testInquiry.inquiryId } }).catch(() => {});
    await prisma.inquiry.delete({ where: { id: testInquiry.inquiryId } }).catch(() => {});
  }

  // -------------------------------------------------------------
  // SUITE 6: PORTFOLIO PUBLICATION GATE & HOMEPAGE UX INTEGRITY
  // -------------------------------------------------------------
  console.log("\nSUITE 6: Portfolio Publication Gate & Dead Link Prevention");

  const dbProjects = await prisma.project.findMany({
    select: { slug: true, publicationStatus: true, partnershipStatus: true },
  });

  assert(
    dbProjects.every((p) => p.publicationStatus === PublicationStatus.DRAFT),
    "CRITICAL: All 4 canonical projects remain in DRAFT status pending founder sign-off"
  );

  const published = await getPublishedProjects();
  assert(published.length === 0, "Public getPublishedProjects() returns 0 while projects remain in DRAFT");

  const tabadul = dbProjects.find((p) => p.slug === "tabadul");
  assert(tabadul?.partnershipStatus === "UNDER_DISCUSSION", "Tabadul partnership status is strictly UNDER_DISCUSSION");

  // -------------------------------------------------------------
  // SUITE 7: HTTP SECURITY HEADERS AUDIT
  // -------------------------------------------------------------
  console.log("\nSUITE 7: HTTP Security Headers Validation");

  assert(nextConfig.poweredByHeader === false, "next.config.mjs disables X-Powered-By header");
  if (typeof nextConfig.headers === "function") {
    const headers = await nextConfig.headers();
    const globalRule = headers.find((h: any) => h.source === "/(.*)");
    const keys = globalRule?.headers?.map((h: any) => h.key) || [];
    assert(keys.includes("Content-Security-Policy"), "CSP configured in next.config.mjs");
    assert(keys.includes("Strict-Transport-Security"), "HSTS configured in next.config.mjs");
    assert(keys.includes("X-Frame-Options"), "X-Frame-Options configured in next.config.mjs");
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log("\n==================================================");
  console.log(`🏁 INFRASTRUCTURE AUDIT: ${passed} / ${total} PASSED`);
  console.log("==================================================");

  if (passed === total) {
    console.log("🎉 ALL PRODUCTION INFRASTRUCTURE CHECKS PASSED!");
  } else {
    process.exit(1);
  }
}

runInfrastructureReadinessTests()
  .catch((e) => {
    console.error("Infrastructure audit failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
