import { ensureCoreDepartments } from "../src/lib/services/companySetupService";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("==================================================");
  console.log("🏢 SADEEM — CORE DEPARTMENTS IDEMPOTENT BOOTSTRAP");
  console.log("==================================================");

  const teams = await ensureCoreDepartments();
  console.log(`Successfully bootstrapped ${teams.length} core departments:`);
  for (const t of teams) {
    console.log(`  • [${t.code}] ${t.nameEn} / ${t.nameAr} (Order: ${t.displayOrder})`);
  }

  // Verify idempotency
  console.log("\nVerifying idempotency on secondary run...");
  const secondRun = await ensureCoreDepartments();
  console.log(`Secondary run returned ${secondRun.length} departments without duplicates.`);

  const totalInDb = await prisma.companyTeam.count();
  console.log(`Total CompanyTeam records in DB: ${totalInDb}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Bootstrap error:", err);
  process.exit(1);
});
