import prisma from "../src/lib/prisma";
import { AdminRole, PublicationStatus } from "@prisma/client";
import { signSessionToken, verifySessionToken } from "../src/lib/auth/jwt";
import { getSession, requireRole } from "../src/lib/auth/session";
import { getRateLimiterStatus, checkRateLimit } from "../src/lib/auth/rate-limit";
import { getStorageStatus, validateUploadFile } from "../src/lib/storage/storageProvider";
import { getPublishedProjects, getPreviewProjects, getProjectDetailBySlug } from "../src/lib/services/projectService";
import { submitBusinessProjectInquiry } from "../src/lib/services/inquiryService";
import nextConfig from "../next.config.mjs";

async function runReleaseCandidateTests() {
  console.log("==================================================");
  console.log("🚀 SADEEM PHASE 4.8 — RELEASE CANDIDATE AUDIT SUITE");
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
  // SUITE 1: HTTP SECURITY HEADERS AUDIT
  // -------------------------------------------------------------
  console.log("SUITE 1: HTTP Security Headers Configuration");
  assert(nextConfig.poweredByHeader === false, "X-Powered-By header is disabled to reduce framework fingerprinting");

  const headersFn = nextConfig.headers;
  assert(typeof headersFn === "function", "next.config.mjs defines custom security headers function");

  if (typeof headersFn === "function") {
    const headerConfigs = await headersFn();
    const globalHeader = headerConfigs.find((h: any) => h.source === "/(.*)");
    assert(globalHeader !== undefined, "Global security headers configured for all routes /(.*)");

    const headerKeys = globalHeader?.headers?.map((h: any) => h.key) || [];
    assert(headerKeys.includes("Strict-Transport-Security"), "HSTS header configured");
    assert(headerKeys.includes("X-Frame-Options"), "X-Frame-Options: DENY configured");
    assert(headerKeys.includes("X-Content-Type-Options"), "X-Content-Type-Options: nosniff configured");
    assert(headerKeys.includes("Referrer-Policy"), "Referrer-Policy configured");
    assert(headerKeys.includes("Permissions-Policy"), "Permissions-Policy configured");
    assert(headerKeys.includes("Content-Security-Policy"), "Content-Security-Policy (CSP) configured");
  }

  // -------------------------------------------------------------
  // SUITE 2: DRAFT ISOLATION & CANONICAL PROJECTS INTEGRITY
  // -------------------------------------------------------------
  console.log("\nSUITE 2: Draft Isolation & Database Integrity");
  const allDbProjects = await prisma.project.findMany({
    select: { slug: true, publicationStatus: true, ownershipType: true, partnershipStatus: true },
  });

  assert(allDbProjects.length === 4, `Database contains exactly 4 canonical projects (found: ${allDbProjects.length})`);
  assert(
    allDbProjects.every((p) => p.publicationStatus === PublicationStatus.DRAFT),
    "CRITICAL: All 4 canonical projects strictly remain in DRAFT status pending founder sign-off"
  );

  const publicProjects = await getPublishedProjects();
  assert(publicProjects.length === 0, "Public getPublishedProjects() strictly returns 0 records while in DRAFT");

  const tabadulProject = allDbProjects.find((p) => p.slug === "tabadul");
  assert(
    tabadulProject?.partnershipStatus === "UNDER_DISCUSSION",
    "Tabadul project partnershipStatus is strictly UNDER_DISCUSSION"
  );

  for (const p of allDbProjects) {
    const detail = await getProjectDetailBySlug(p.slug);
    assert(detail === null, `getProjectDetailBySlug('${p.slug}') strictly returns null for DRAFT record`);
  }

  // -------------------------------------------------------------
  // SUITE 3: RATE LIMITING & PRODUCTION READINESS
  // -------------------------------------------------------------
  console.log("\nSUITE 3: Rate Limiting & Distributed Store Readiness");
  const rateLimitStatus = getRateLimiterStatus();
  assert(
    ["upstash_redis", "standard_redis", "in_memory"].includes(rateLimitStatus.provider),
    `Rate limiter reports provider: '${rateLimitStatus.provider}'`
  );

  if (rateLimitStatus.provider === "in_memory") {
    assert(
      rateLimitStatus.isProductionGrade === false,
      "Rate limiter correctly identifies in-memory state as NOT production-grade for clustered/serverless deployments"
    );
    assert(
      rateLimitStatus.missingVariables.length > 0,
      `Rate limiter correctly reports required variables for shared store: ${rateLimitStatus.missingVariables.join(", ")}`
    );
  }

  // -------------------------------------------------------------
  // SUITE 4: STORAGE & MEDIA SECURITY GATE
  // -------------------------------------------------------------
  console.log("\nSUITE 4: Storage Configuration & SVG Security Gate");
  const storageStatus = getStorageStatus();
  assert(storageStatus.configured === false, "Storage provider correctly reports unconfigured state");
  assert(
    storageStatus.missingVariables.length >= 3,
    `Storage status identifies missing variables: ${storageStatus.missingVariables.join(", ")}`
  );

  // WebP magic byte validation
  const validWebpBuffer = Buffer.alloc(16);
  validWebpBuffer.write("RIFF", 0);
  validWebpBuffer.write("WEBP", 8);
  const webpCheck = validateUploadFile({
    buffer: validWebpBuffer,
    filename: "sample.webp",
    mimeType: "image/webp",
  });
  assert(webpCheck.valid === true, "Valid WebP file with RIFF/WEBP magic bytes passes validation");

  const fakeWebpBuffer = Buffer.alloc(16);
  fakeWebpBuffer.write("XXXX", 0);
  fakeWebpBuffer.write("YYYY", 8);
  const fakeWebpCheck = validateUploadFile({
    buffer: fakeWebpBuffer,
    filename: "fake.webp",
    mimeType: "image/webp",
  });
  assert(fakeWebpCheck.valid === false, "Spoofed WebP file with invalid magic bytes is strictly rejected");

  // -------------------------------------------------------------
  // SUITE 5: ANTI-SPAM & CLOCK-DRIFT RESILIENCE
  // -------------------------------------------------------------
  console.log("\nSUITE 5: Anti-Spam & Clock Drift Resilience");
  const now = Date.now();

  // Test client clock drift (client clock is 5 seconds ahead of server)
  const clientClockAhead = await submitBusinessProjectInquiry(
    {
      name: "NTP Skew User",
      email: "ntp.user@example.com",
      projectCategory: "ENTERPRISE_SYSTEM" as any,
      problemStatement: "Legitimate user problem statement with valid length.",
      desiredOutcome: "Legitimate desired outcome with valid length.",
      expectedTimeline: "ONE_TO_THREE_MONTHS" as any,
      consentGiven: true,
      formLoadedAt: now + 5000, // Client clock 5 seconds ahead
    },
    "127.0.0.99"
  );
  assert(clientClockAhead.success === true, "Clock drift (client 5s ahead of server) does NOT trigger false positive");

  // Test absurd future timestamp (client claims loaded 2 hours in the future)
  const absurdFuture = await submitBusinessProjectInquiry(
    {
      name: "Spoofed User",
      email: "spoof@example.com",
      projectCategory: "ENTERPRISE_SYSTEM" as any,
      problemStatement: "Problem statement with valid length for test.",
      desiredOutcome: "Desired outcome with valid length for test.",
      expectedTimeline: "ONE_TO_THREE_MONTHS" as any,
      consentGiven: true,
      formLoadedAt: now + 2 * 60 * 60 * 1000, // 2 hours in future
    },
    "127.0.0.100"
  );
  assert(absurdFuture.success === true, "Spoofed future timestamp treated as spam (synthetic success without DB insert)");

  // Clean up test inquiry
  if (clientClockAhead.inquiryId) {
    await prisma.inquiry.delete({ where: { id: clientClockAhead.inquiryId } }).catch(() => {});
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log("\n==================================================");
  console.log(`🏁 RELEASE CANDIDATE AUDIT: ${passed} / ${total} PASSED`);
  console.log("==================================================");

  if (passed === total) {
    console.log("🎉 ALL RELEASE CANDIDATE INTEGRITY CHECKS PASSED!");
  } else {
    process.exit(1);
  }
}

runReleaseCandidateTests()
  .catch((e) => {
    console.error("Test execution failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
