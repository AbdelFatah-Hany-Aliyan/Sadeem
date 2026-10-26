import { PrismaClient, AdminRole } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

async function bootstrap() {
  console.log("==================================================");
  console.log("🔐 SADEEM STUDIO — ADMINISTRATOR BOOTSTRAP TOOL");
  console.log("==================================================\n");

  // Parse command line arguments:
  // e.g. tsx scripts/bootstrap-admin.ts --email=admin@sadeem.studio --password=MySecurePassword123! --name="Studio Admin" --role=SUPER_ADMIN
  const args = process.argv.slice(2);
  const argMap: Record<string, string> = {};

  for (const arg of args) {
    if (arg.startsWith("--")) {
      const [key, ...rest] = arg.slice(2).split("=");
      argMap[key] = rest.join("=");
    }
  }

  const email = argMap.email || process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = argMap.password || process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const name = argMap.name || process.env.BOOTSTRAP_ADMIN_NAME || "Sadeem Super Admin";
  const roleStr = (argMap.role || process.env.BOOTSTRAP_ADMIN_ROLE || "SUPER_ADMIN").toUpperCase();

  if (!email || !password) {
    console.error("❌ Error: Missing required credentials.");
    console.log("\nUsage:");
    console.log("  npx tsx scripts/bootstrap-admin.ts --email=<email> --password=<password> [--name=<name>] [--role=SUPER_ADMIN|EDITOR]");
    console.log("\nOr define environment variables:");
    console.log("  BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD\n");
    process.exit(1);
  }

  // Basic validation
  if (!email.includes("@") || !email.includes(".")) {
    console.error("❌ Error: Invalid email format.");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("❌ Error: Password must be at least 8 characters long.");
    process.exit(1);
  }

  const role = roleStr === "EDITOR" ? AdminRole.EDITOR : AdminRole.SUPER_ADMIN;

  console.log(`Checking existing account for: ${email}...`);
  const existing = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (existing) {
    console.log(`⚠️ User with email ${email} already exists (ID: ${existing.id}, Role: ${existing.role}).`);
    console.log("To change credentials, use the database or admin dashboard.");
    process.exit(0);
  }

  console.log("Hashing password securely with bcrypt (12 rounds)...");
  const passwordHash = await hashPassword(password);

  const newAdmin = await prisma.adminUser.create({
    data: {
      email,
      passwordHash,
      name,
      role,
      isActive: true,
    },
  });

  // Record bootstrap audit log
  await prisma.auditLog.create({
    data: {
      userId: newAdmin.id,
      action: "ADMIN_BOOTSTRAP",
      entityType: "AdminUser",
      entityId: newAdmin.id,
      details: {
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role,
        provisionedVia: "CLI_BOOTSTRAP_SCRIPT",
      },
    },
  });

  console.log(`\n✅ Administrator successfully created!`);
  console.log(`   ID:    ${newAdmin.id}`);
  console.log(`   Email: ${newAdmin.email}`);
  console.log(`   Name:  ${newAdmin.name}`);
  console.log(`   Role:  ${newAdmin.role}`);
  console.log("\n🔒 Password has been hashed and stored securely. (Never logged or printed).");
  console.log("==================================================");
}

bootstrap()
  .catch((e) => {
    console.error("❌ Bootstrap failed with exception:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
