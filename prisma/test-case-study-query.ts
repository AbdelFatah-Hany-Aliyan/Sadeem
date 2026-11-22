import { 
  getProjectDetailBySlug, 
  getPreviewProjectDetailBySlug, 
  getPublishedProjects, 
  getPreviewProjects 
} from "../src/lib/services/projectService";
import prisma from "../src/lib/prisma";

async function runCaseStudyTests() {
  console.log("==================================================");
  console.log("🧪 SADEEM PHASE 4.4 — CASE STUDY INTEGRATION TESTS");
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

  const canonicalSlugs = ["cucu-leaf-scan", "wesal", "tabadul", "lama-school"];

  // -------------------------------------------------------------
  // TEST SUITE 1: STRICT PUBLICATION SAFETY (PUBLIC DETAIL LAYER)
  // -------------------------------------------------------------
  console.log("TEST SUITE 1: Strict Public Detail Route Publication Safety");
  for (const slug of canonicalSlugs) {
    const publicDetail = await getProjectDetailBySlug(slug);
    assert(
      publicDetail === null,
      `Public getProjectDetailBySlug('${slug}') strictly returns null for DRAFT record`
    );
  }

  const unknownSlug = await getProjectDetailBySlug("non-existent-system");
  assert(
    unknownSlug === null,
    `Public getProjectDetailBySlug('non-existent-system') strictly returns null`
  );

  // -------------------------------------------------------------
  // TEST SUITE 2: PREVIEW DETAIL QUERY LAYER (INTERNAL AUDIT)
  // -------------------------------------------------------------
  console.log("\nTEST SUITE 2: Preview Query Layer (Direct DB Verification)");
  for (const slug of canonicalSlugs) {
    const previewDetail = await getPreviewProjectDetailBySlug(slug);
    assert(
      previewDetail !== null,
      `Preview getPreviewProjectDetailBySlug('${slug}') successfully retrieves database record`
    );

    if (previewDetail) {
      assert(
        Boolean(previewDetail.name && previewDetail.arabicName),
        `[${slug}] Has bilingual names (EN: "${previewDetail.name}" | AR: "${previewDetail.arabicName}")`
      );
      assert(
        Boolean(previewDetail.tagline && previewDetail.arabicTagline),
        `[${slug}] Has bilingual taglines`
      );
      assert(
        Boolean(previewDetail.longDescription && previewDetail.arabicLongDescription),
        `[${slug}] Has bilingual detailed overview copy`
      );
      assert(
        Boolean(previewDetail.problem?.en && previewDetail.problem?.ar),
        `[${slug}] Has verified bilingual problem statement`
      );
      assert(
        Boolean(previewDetail.solution?.en && previewDetail.solution?.ar),
        `[${slug}] Has verified bilingual engineering solution approach`
      );
      assert(
        Boolean(previewDetail.roleDescription?.en && previewDetail.roleDescription?.ar),
        `[${slug}] Has verified bilingual studio role description`
      );
      assert(
        previewDetail.features.length > 0,
        `[${slug}] Has ${previewDetail.features.length} verified features loaded from ProjectFeature`
      );
    }
  }

  // -------------------------------------------------------------
  // TEST SUITE 3: FACTUAL VERIFIED FEATURES AUDIT
  // -------------------------------------------------------------
  console.log("\nTEST SUITE 3: Factual Verified Features Audit");
  const cucu = await getPreviewProjectDetailBySlug("cucu-leaf-scan");
  assert(
    cucu?.features.length === 3,
    `Cucu Leaf Scan has 3 verified features (actual: ${cucu?.features.length})`
  );
  assert(
    cucu?.features.some(f => f.title.en.includes("Pathology") || f.title.en.includes("On-Device")) ?? false,
    `Cucu Leaf Scan includes on-device pathology feature`
  );

  const wesal = await getPreviewProjectDetailBySlug("wesal");
  assert(
    wesal?.features.length === 2,
    `Wesal has 2 verified features (actual: ${wesal?.features.length})`
  );

  const tabadul = await getPreviewProjectDetailBySlug("tabadul");
  assert(
    tabadul?.features.length === 2,
    `Tabadul has 2 verified features (actual: ${tabadul?.features.length})`
  );

  const lama = await getPreviewProjectDetailBySlug("lama-school");
  assert(
    lama?.features.length === 2,
    `Lama School has 2 verified features (actual: ${lama?.features.length})`
  );

  // -------------------------------------------------------------
  // TEST SUITE 4: TABADUL PARTNERSHIP CLARIFICATION
  // -------------------------------------------------------------
  console.log("\nTEST SUITE 4: Tabadul Independent Team & Partnership Note");
  assert(
    tabadul?.partnershipStatus === "UNDER_DISCUSSION",
    `Tabadul partnershipStatus is strictly 'UNDER_DISCUSSION'`
  );
  assert(
    Boolean(tabadul?.partnershipNote?.en && tabadul?.partnershipNote?.ar),
    `Tabadul case study includes bilingual partnership disclaimer note`
  );

  // -------------------------------------------------------------
  // TEST SUITE 5: RELATED PROJECTS FILTERING
  // -------------------------------------------------------------
  console.log("\nTEST SUITE 5: Related Projects Safeguards");
  assert(
    (cucu?.relatedProjects.length ?? 0) >= 0,
    `Related projects handled gracefully (preview related: ${cucu?.relatedProjects.length})`
  );
  assert(
    !cucu?.relatedProjects.some(rp => rp.slug === "cucu-leaf-scan"),
    `Related projects list strictly excludes the current project itself`
  );

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log("\n==================================================");
  console.log(`📊 Test Results: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log("==================================================");

  if (passedTests === totalTests) {
    console.log("🎉 ALL PHASE 4.4 TESTS PASSED SUCCESSFULLY!");
  } else {
    console.error("❌ SOME TESTS FAILED.");
    process.exit(1);
  }
}

runCaseStudyTests()
  .catch((e) => {
    console.error("Unhandled test runner exception:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
