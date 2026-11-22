import { getPublishedProjects, getPreviewProjects, getProjectBySlug, getPreviewProjectBySlug } from "../src/lib/services/projectService";
import prisma from "../src/lib/prisma";

async function runTests() {
  console.log("==================================================");
  console.log("🧪 SADEEM PHASE 4.3 — PORTFOLIO INTEGRATION TESTS");
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
  // TEST SUITE 1: DRAFT PUBLICATION SAFETY
  // -------------------------------------------------------------
  console.log("TEST SUITE 1: Draft Publication Safety Guard");
  const publishedProjects = await getPublishedProjects();
  assert(
    publishedProjects.length === 0,
    `getPublishedProjects() must return 0 projects while all records remain in DRAFT status (returned: ${publishedProjects.length})`
  );

  const publicCucu = await getProjectBySlug("cucu-leaf-scan");
  assert(
    publicCucu === null,
    `getProjectBySlug('cucu-leaf-scan') must return null for DRAFT record`
  );

  // -------------------------------------------------------------
  // TEST SUITE 2: PREVIEW QUERY LAYER & RECORD COUNT
  // -------------------------------------------------------------
  console.log("\nTEST SUITE 2: Preview Query Layer (Direct DB Access)");
  const previewProjects = await getPreviewProjects();
  assert(
    previewProjects.length === 4,
    `getPreviewProjects() must retrieve all 4 canonical records from PostgreSQL (retrieved: ${previewProjects.length})`
  );

  const expectedOrder = ["cucu-leaf-scan", "wesal", "tabadul", "lama-school"];
  const actualOrder = previewProjects.map(p => p.id);
  assert(
    JSON.stringify(actualOrder) === JSON.stringify(expectedOrder),
    `Projects must preserve displayOrder 1..4 (order: ${actualOrder.join(", ")})`
  );

  // -------------------------------------------------------------
  // TEST SUITE 3: BILINGUAL INTEGRITY & DTO MAPPING
  // -------------------------------------------------------------
  console.log("\nTEST SUITE 3: Bilingual Data Transfer Object (DTO) Mapping");
  for (const project of previewProjects) {
    assert(
      Boolean(project.name && project.arabicName),
      `[${project.id}] Has bilingual names (EN: "${project.name}" | AR: "${project.arabicName}")`
    );
    assert(
      Boolean(project.tagline && project.arabicTagline),
      `[${project.id}] Has bilingual taglines`
    );
    assert(
      Boolean(project.category && project.arabicCategory),
      `[${project.id}] Has bilingual category labels`
    );
    assert(
      Boolean(project.longDescription && project.arabicLongDescription),
      `[${project.id}] Has bilingual detailed descriptions`
    );
    assert(
      Boolean(project.status && project.arabicStatus && project.statusColor),
      `[${project.id}] Has valid status mapping (${project.status} / ${project.arabicStatus})`
    );
    assert(
      Boolean(project.ownership && project.arabicOwnership),
      `[${project.id}] Has bilingual ownership classification (${project.ownership})`
    );
    assert(
      Boolean(project.metric?.en && project.metric?.ar),
      `[${project.id}] Has factual non-statistical architectural metric (${project.metric?.en})`
    );
  }

  // -------------------------------------------------------------
  // TEST SUITE 4: AUDITED FACTUAL TECHNOLOGIES
  // -------------------------------------------------------------
  console.log("\nTEST SUITE 4: Audited Factual Technology Alignment");
  const cucu = previewProjects.find(p => p.id === "cucu-leaf-scan");
  assert(
    Boolean(cucu?.technologies.includes("Flutter") && cucu?.technologies.some(t => t.includes("MobileNet"))),
    `Cucu Leaf Scan has factual tech: ${cucu?.technologies.join(", ")}`
  );

  const wesal = previewProjects.find(p => p.id === "wesal");
  assert(
    Boolean(wesal?.technologies.includes("Next.js") && !wesal?.technologies.includes("WebSockets") && !wesal?.technologies.includes("React Native")),
    `Wesal has unverified claims removed: ${wesal?.technologies.join(", ")}`
  );

  const tabadul = previewProjects.find(p => p.id === "tabadul");
  assert(
    Boolean(tabadul?.technologies.includes("ASP.NET") && tabadul?.technologies.includes("React.js") && tabadul?.technologies.includes("Flutter")),
    `Tabadul has factual tech: ${tabadul?.technologies.join(", ")}`
  );

  const lama = previewProjects.find(p => p.id === "lama-school");
  assert(
    Boolean(lama?.technologies.includes("Next.js") && lama?.technologies.includes("TypeScript")),
    `Lama School has factual tech: ${lama?.technologies.join(", ")}`
  );

  // -------------------------------------------------------------
  // TEST SUITE 5: TABADUL PARTNERSHIP CLARIFICATION
  // -------------------------------------------------------------
  console.log("\nTEST SUITE 5: Tabadul Collaborative Partnership Clarification");
  assert(
    tabadul?.partnershipStatus === "UNDER_DISCUSSION",
    `Tabadul partnershipStatus must be 'UNDER_DISCUSSION'`
  );
  assert(
    Boolean(tabadul?.partnershipNote?.en && tabadul?.partnershipNote?.ar),
    `Tabadul must have bilingual disclaimer note: "${tabadul?.partnershipNote?.en}"`
  );

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log("\n==================================================");
  console.log(`📊 Test Results: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log("==================================================");

  if (passedTests === totalTests) {
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
  } else {
    console.error("❌ SOME TESTS FAILED.");
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("Unhandled test runner exception:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
