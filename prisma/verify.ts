import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  console.log("🔍 Verifying Sadeem Database Foundation...");

  const projects = await prisma.project.findMany({
    include: {
      translations: true,
      technologies: {
        include: {
          technology: true,
        },
      },
    },
    orderBy: { displayOrder: "asc" },
  });

  console.log(`\n📊 Total Projects in Database: ${projects.length}`);
  if (projects.length !== 4) {
    throw new Error(`Expected exactly 4 projects, found ${projects.length}`);
  }

  for (const p of projects) {
    const en = p.translations.find((t) => t.locale === "en");
    const ar = p.translations.find((t) => t.locale === "ar");
    const techNames = p.technologies.map((t) => t.technology.name).join(", ");

    console.log(`\n• Project: [${p.slug}]`);
    console.log(`  - Type: ${p.type}`);
    console.log(`  - Dev Status: ${p.developmentStatus}`);
    console.log(`  - Pub Status: ${p.publicationStatus}`);
    console.log(`  - Ownership: ${p.ownershipType}`);
    console.log(`  - Partnership Status: ${p.partnershipStatus}`);
    console.log(`  - Title (EN): ${en?.title}`);
    console.log(`  - Title (AR): ${ar?.title}`);
    console.log(`  - Technologies: ${techNames}`);

    // Verification asserts
    if (!en || !ar) {
      throw new Error(`Project ${p.slug} is missing translations`);
    }
    if (p.publicationStatus !== "DRAFT") {
      throw new Error(`Project ${p.slug} must be DRAFT, got ${p.publicationStatus}`);
    }
  }

  // Check Tabadul specific integrity
  const tabadul = projects.find((p) => p.slug === "tabadul");
  if (!tabadul) throw new Error("Tabadul project not found");
  if (tabadul.ownershipType !== "COLLABORATIVE_PARTNERSHIP" || tabadul.partnershipStatus !== "UNDER_DISCUSSION") {
    throw new Error("Tabadul ownership or partnership status violates requirements!");
  }

  const settingsCount = await prisma.siteSetting.count();
  console.log(`\n⚙️ Site Settings Count: ${settingsCount}`);

  const techCount = await prisma.technology.count();
  console.log(`💻 Technology Records: ${techCount}`);

  console.log("\n🎉 ALL DATABASE INTEGRITY CHECKS PASSED!");
}

verify()
  .catch((e) => {
    console.error("Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
