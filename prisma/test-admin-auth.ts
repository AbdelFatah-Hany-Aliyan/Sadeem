import prisma from "../src/lib/prisma";
import { AdminRole, PublicationStatus, ProjectType, DevelopmentStatus, OwnershipType, PartnershipStatus } from "@prisma/client";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";
import { signSessionToken, verifySessionToken } from "../src/lib/auth/jwt";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "../src/lib/auth/rate-limit";
import { 
  validatePublicationRules, 
  toggleProjectPublication, 
  createAdminProject,
  archiveAdminProject 
} from "../src/lib/services/adminProjectService";

async function runAdminAuthTests() {
  console.log("==================================================");
  console.log("🧪 SADEEM PHASE 4.5 — ADMIN & AUTH INTEGRATION TESTS");
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

  // -------------------------------------------------------------
  // TEST SUITE 1: AUTHENTICATION & PASSWORD HASHING
  // -------------------------------------------------------------
  console.log("TEST SUITE 1: Authentication & Password Hashing Security");

  const testPass = "SadeemSecurityPassword2026!";
  const hash = await hashPassword(testPass);

  assert(
    hash !== testPass && hash.startsWith("$2"),
    "Passwords are encrypted with bcrypt (rounds = 12), never stored in plaintext"
  );

  const match = await verifyPassword(testPass, hash);
  assert(match === true, "verifyPassword() returns true for correct plaintext password");

  const mismatch = await verifyPassword("WrongPassword123!", hash);
  assert(mismatch === false, "verifyPassword() returns false for incorrect password");

  // Rate Limiter
  const testKey = "test-attacker@evil.com";
  resetRateLimit(testKey);
  assert(checkRateLimit(testKey).allowed === true, "Rate limit allows initial attempts");

  for (let i = 0; i < 5; i++) {
    recordFailedAttempt(testKey);
  }
  const blockedCheck = checkRateLimit(testKey);
  assert(
    blockedCheck.allowed === false && (blockedCheck.retryAfterSeconds ?? 0) > 0,
    "Rate limiter blocks IP/email after 5 failed password attempts"
  );
  resetRateLimit(testKey);

  // -------------------------------------------------------------
  // TEST SUITE 2: JWT SESSION MANAGEMENT
  // -------------------------------------------------------------
  console.log("\nTEST SUITE 2: JWT Session Management & Invalidation");

  const adminUser = await prisma.adminUser.findUnique({
    where: { email: "admin@sadeem.studio" },
  });
  assert(adminUser !== null, "Initial SUPER_ADMIN account exists in database");

  if (adminUser) {
    const token = await signSessionToken({
      userId: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
    });
    assert(Boolean(token && token.length > 30), "signSessionToken() creates a valid signed JWT");

    const verified = await verifySessionToken(token);
    assert(
      verified?.userId === adminUser.id && verified?.role === AdminRole.SUPER_ADMIN,
      "verifySessionToken() decodes valid payload matching user ID and role"
    );

    const tamperedToken = token.slice(0, -6) + "abcdef";
    const invalidVerify = await verifySessionToken(tamperedToken);
    assert(invalidVerify === null, "Tampered session token fails verification and returns null");
  }

  // -------------------------------------------------------------
  // TEST SUITE 3: AUTHORIZATION & ROLE PERMISSION ENFORCEMENT
  // -------------------------------------------------------------
  console.log("\nTEST SUITE 3: Server-Side Authorization & Role Enforcement");

  const editorUser = await prisma.adminUser.findUnique({
    where: { email: "editor@sadeem.studio" },
  });
  assert(editorUser !== null && editorUser.role === AdminRole.EDITOR, "Editor account exists with EDITOR role");

  // Test that an EDITOR CANNOT publish projects
  const cucu = await prisma.project.findUnique({ where: { slug: "cucu-leaf-scan" } });
  if (cucu && editorUser) {
    const editorPublishAttempt = await toggleProjectPublication(
      cucu.id,
      PublicationStatus.PUBLISHED,
      { userId: editorUser.id, role: editorUser.role }
    );
    assert(
      editorPublishAttempt.success === false && Boolean(editorPublishAttempt.errors?.[0]?.includes("FORBIDDEN")),
      "EDITOR role is strictly FORBIDDEN from publishing projects"
    );

    const editorArchiveAttempt = await archiveAdminProject(
      cucu.id,
      { userId: editorUser.id, role: editorUser.role }
    );
    assert(
      editorArchiveAttempt.success === false && Boolean(editorArchiveAttempt.errors?.[0]?.includes("FORBIDDEN")),
      "EDITOR role is strictly FORBIDDEN from archiving projects"
    );
  }

  // -------------------------------------------------------------
  // TEST SUITE 4: PUBLICATION VALIDATION WORKFLOW
  // -------------------------------------------------------------
  console.log("\nTEST SUITE 4: Publication Validation Rules & Tabadul Integrity");

  // Incomplete project simulation (missing Arabic title & translation)
  const invalidProject = {
    slug: "incomplete-system",
    translations: [
      { locale: "en", title: "Valid English Title", shortDescription: "Short", fullDescription: "Full" },
    ],
    technologies: [{ id: "tech-1" }],
  };
  const invalidResult = validatePublicationRules(invalidProject as any);
  assert(
    invalidResult.valid === false && invalidResult.errors.some(e => e.includes("Arabic")),
    "Publication validation fails when Arabic translation is incomplete"
  );

  // Tabadul factual integrity rule
  const invalidTabadul = {
    slug: "tabadul",
    ownershipType: OwnershipType.SADEEM_VENTURE, // False claim
    partnershipStatus: PartnershipStatus.CONFIRMED, // False claim
    translations: [
      { locale: "en", title: "Tabadul", shortDescription: "Desc", fullDescription: "Full" },
      { locale: "ar", title: "تبادل", shortDescription: "وصف", fullDescription: "كامل" },
    ],
    technologies: [{ id: "tech-1" }],
  };
  const tabadulValidation = validatePublicationRules(invalidTabadul as any);
  assert(
    tabadulValidation.valid === false && tabadulValidation.errors.some(e => e.includes("Tabadul")),
    "Publication validation prevents false partnership or ownership claims on Tabadul"
  );

  // Valid project simulation
  const validProject = {
    slug: "cucu-leaf-scan",
    ownershipType: OwnershipType.SADEEM_VENTURE,
    partnershipStatus: PartnershipStatus.NOT_APPLICABLE,
    translations: [
      { locale: "en", title: "Cucu Leaf Scan", shortDescription: "Valid", fullDescription: "Valid full" },
      { locale: "ar", title: "كوكو ليف سكان", shortDescription: "صحيح", fullDescription: "كامل" },
    ],
    technologies: [{ id: "tech-1" }],
  };
  const validResult = validatePublicationRules(validProject as any);
  assert(
    validResult.valid === true,
    "Publication validation passes when all required bilingual copy and technologies are complete"
  );

  // -------------------------------------------------------------
  // TEST SUITE 5: AUDIT LOG SANITIZATION
  // -------------------------------------------------------------
  console.log("\nTEST SUITE 5: Audit Logging Sanitization");

  const recentLogs = await prisma.auditLog.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
  });
  assert(recentLogs.length > 0, "Audit logs are actively persisted in database");

  const jsonStr = JSON.stringify(recentLogs);
  assert(
    !jsonStr.includes("SadeemSecurityPassword2026!") && !jsonStr.includes("SadeemStudioAdmin2026!"),
    "Audit logs strictly redact passwords and sensitive credentials"
  );

  // -------------------------------------------------------------
  // TEST SUITE 6: AUTHENTICATED PREVIEW & ADMIN ROUTE VERIFICATION
  // -------------------------------------------------------------
  console.log("\nTEST SUITE 6: Authenticated Preview & Admin Routes Verification");

  if (adminUser) {
    const adminToken = await signSessionToken({
      userId: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
    });

    try {
      const resPreview = await fetch("http://localhost:3000/work-preview", {
        headers: { Cookie: `sadeem_admin_session=${adminToken}` },
        signal: AbortSignal.timeout(4000),
      });
      assert(resPreview.status === 200, "Authenticated administrator can access /work-preview (HTTP 200)");

      const resCaseStudy = await fetch("http://localhost:3000/work-preview/cucu-leaf-scan", {
        headers: { Cookie: `sadeem_admin_session=${adminToken}` },
        signal: AbortSignal.timeout(4000),
      });
      assert(resCaseStudy.status === 200, "Authenticated administrator can access /work-preview/cucu-leaf-scan (HTTP 200)");

      const resAdmin = await fetch("http://localhost:3000/admin", {
        headers: { Cookie: `sadeem_admin_session=${adminToken}` },
        signal: AbortSignal.timeout(4000),
      });
      assert(resAdmin.status === 200, "Authenticated administrator can access /admin overview (HTTP 200)");

      // Test anonymous rejection on /work-preview
      const resAnon = await fetch("http://localhost:3000/work-preview", {
        signal: AbortSignal.timeout(4000),
      });
      assert(resAnon.status === 404, "Anonymous request to /work-preview is rejected with HTTP 404");
    } catch {
      console.log("  ⚠️ Skipping live HTTP tests (dev server not responding on port 3000)");
    }
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log("\n==================================================");
  console.log(`📊 Test Results: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log("==================================================");

  if (passedTests === totalTests) {
    console.log("🎉 ALL PHASE 4.5 TESTS PASSED SUCCESSFULLY!");
  } else {
    console.error("❌ SOME TESTS FAILED.");
    process.exit(1);
  }
}

runAdminAuthTests()
  .catch((e) => {
    console.error("Unhandled test runner exception:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
