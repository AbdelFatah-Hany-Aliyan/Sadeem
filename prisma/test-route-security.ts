import prisma from "../src/lib/prisma";
import { AdminRole } from "@prisma/client";
import { signSessionToken } from "../src/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/session";

async function runRouteSecurityTests() {
  console.log("==================================================");
  console.log("🛡️ SADEEM PHASE 4.8 — LIVE HTTP ROUTE SECURITY AUDIT");
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

  const BASE_URL = "http://localhost:3000";

  // 1. ANONYMOUS ACCESS TO PUBLIC ROUTES
  console.log("SUITE 1: Anonymous Access to Public Routes");

  const publicRoutes = [
    { path: "/", name: "Homepage" },
    { path: "/contact", name: "Contact Hub" },
    { path: "/start-project", name: "Start a Project" },
    { path: "/pitch-idea", name: "Pitch an Idea" },
    { path: "/admin/login", name: "Admin Login Page" },
  ];

  for (const r of publicRoutes) {
    const res = await fetch(`${BASE_URL}${r.path}`);
    assert(res.status === 200, `${r.name} (${r.path}) returns HTTP 200 OK for anonymous visitors`);
  }

  // 2. ANONYMOUS ACCESS TO DRAFT CASE STUDIES (MUST BE 404)
  console.log("\nSUITE 2: Anonymous Access to Unpublished Draft Case Studies");
  const draftSlugs = ["cucu-leaf-scan", "wesal", "tabadul", "lama-school"];

  for (const slug of draftSlugs) {
    const res = await fetch(`${BASE_URL}/work/${slug}`);
    assert(res.status === 404, `Public detail route /work/${slug} strictly returns HTTP 404 for DRAFT record`);
  }

  // 3. ANONYMOUS ACCESS TO INTERNAL PREVIEW ROUTES (MUST BE 404)
  console.log("\nSUITE 3: Anonymous Access to Internal Preview Routes");
  const anonPreviewRes = await fetch(`${BASE_URL}/work-preview`);
  assert(anonPreviewRes.status === 404, `/work-preview strictly returns HTTP 404 for anonymous visitors`);

  for (const slug of draftSlugs) {
    const res = await fetch(`${BASE_URL}/work-preview/${slug}`);
    assert(res.status === 404, `/work-preview/${slug} strictly returns HTTP 404 for anonymous visitors`);
  }

  // 4. ANONYMOUS ACCESS TO ADMIN MANAGEMENT ROUTES (MUST REDIRECT TO LOGIN)
  console.log("\nSUITE 4: Anonymous Access to Admin Management Routes");
  const adminRoutes = [
    "/admin",
    "/admin/projects",
    "/admin/projects/new",
    "/admin/content",
    "/admin/media",
    "/admin/inquiries",
  ];

  for (const path of adminRoutes) {
    const res = await fetch(`${BASE_URL}${path}`, { redirect: "manual" });
    const isRedirect = [302, 307, 308].includes(res.status);
    const location = res.headers.get("location") || "";
    assert(
      isRedirect && location.includes("/admin/login"),
      `Anonymous access to ${path} returns HTTP ${res.status} redirecting to /admin/login`
    );
  }

  // 5. AUTHENTICATED ACCESS TO PREVIEW & ADMIN ROUTES
  console.log("\nSUITE 5: Authenticated Administrator Access");
  const dbAdmin = await prisma.adminUser.findFirst({
    where: { role: AdminRole.SUPER_ADMIN, isActive: true },
  });

  if (!dbAdmin) {
    console.error("  ❌ Aborting Suite 5: No active admin user found in database");
    return;
  }

  const token = await signSessionToken({
    userId: dbAdmin.id,
    email: dbAdmin.email,
    name: dbAdmin.name,
    role: dbAdmin.role,
    tokenVersion: dbAdmin.tokenVersion,
  });

  const authHeaders = {
    Cookie: `${SESSION_COOKIE_NAME}=${token}`,
  };

  const authPreviewRes = await fetch(`${BASE_URL}/work-preview`, { headers: authHeaders });
  assert(authPreviewRes.status === 200, `Authenticated admin can access /work-preview (HTTP 200)`);

  const authDetailRes = await fetch(`${BASE_URL}/work-preview/cucu-leaf-scan`, { headers: authHeaders });
  assert(authDetailRes.status === 200, `Authenticated admin can access /work-preview/cucu-leaf-scan (HTTP 200)`);

  const authAdminRes = await fetch(`${BASE_URL}/admin`, { headers: authHeaders, redirect: "manual" });
  assert(authAdminRes.status === 200, `Authenticated admin can access /admin (HTTP 200)`);

  const authInquiriesRes = await fetch(`${BASE_URL}/admin/inquiries`, { headers: authHeaders, redirect: "manual" });
  assert(authInquiriesRes.status === 200, `Authenticated admin can access /admin/inquiries (HTTP 200)`);

  // 6. VERIFY NO LEAK OF DRAFT DATA IN ANONYMOUS HOMEPAGE HTML
  console.log("\nSUITE 6: Public Data Leakage Audit");
  const homeHtml = await (await fetch(`${BASE_URL}/`)).text();
  assert(
    !homeHtml.includes("EXPERIMENTAL UNPUBLISHED"),
    "Homepage HTML does not contain experimental draft text"
  );

  console.log("\n==================================================");
  console.log(`🏁 LIVE ROUTE AUDIT: ${passed} / ${total} PASSED`);
  console.log("==================================================");

  if (passed === total) {
    console.log("🎉 ALL ROUTE SECURITY ASSERTIONS VERIFIED PERFECTLY!");
  } else {
    process.exit(1);
  }
}

runRouteSecurityTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
