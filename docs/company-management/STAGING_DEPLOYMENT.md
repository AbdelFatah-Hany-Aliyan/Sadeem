# SADEEM COMPANY MANAGEMENT SYSTEM — STAGING DEPLOYMENT RUNBOOK

**Target Project:** `ancient-boat-07531777`  
**Staging Branch:** `staging` (`br-tiny-salad-b3qjznbd`)  
**Database Host:** `ep-restless-sound-b3sfv7ak-pooler.ap-southeast-1.aws.neon.tech`  
**Git Branch:** `feature/company-management`  

---

## 1. Safety Rules & Pre-Flight Checks

> [!CAUTION]
> **Zero Direct Schema Pushes against Staging or Production.**
> All database migrations must be applied exclusively via committed SQL migration files through `prisma migrate deploy`.

### Pre-Deployment Verification Checklist
- [x] Code is committed on `feature/company-management`.
- [x] Full TypeScript type-check passed (`npx tsc --noEmit` exited code 0).
- [x] ESLint passed (`npm run lint` exited code 0).
- [x] Full Next.js production build succeeded (`npm run build` exited code 0).
- [x] 31/31 scenario integration test passed (`scripts/test-company-management.ts` exited code 0).
- [x] Additive migration script verified: `prisma/migrations/20261109185000_add_company_management_system/migration.sql`.

---

## 2. Staging Database Migration Procedure

When ready to apply the company management schema to Neon Staging:

### Step 1: Run Staging Migration Deploy
```powershell
# In PowerShell (with .env.staging configured for ep-restless-sound-b3sfv7ak):
$env:DATABASE_URL = (Get-Content .env.staging | Select-String "DATABASE_URL=").Line.Split("=")[1]
npx prisma migrate deploy
```

### Step 2: Bootstrap Core Departments on Staging
```powershell
npx tsx scripts/setup-company-departments.ts
```
This bootstraps the 4 core departments (ANALYSIS, DESIGN, ENGINEERING, MARKETING) with idempotent upserts (zero duplicates).

---

## 3. Vercel Preview Deployment Procedure

### Step 1: Push Branch to GitHub
```bash
git push origin feature/company-management
```

### Step 2: Ensure Vercel Environment Variables Are Configured
Verify that the Vercel Preview environment for branch `feature/company-management` has:
- `DATABASE_URL`: Connection string to Neon Staging pooler (`ep-restless-sound-b3sfv7ak-pooler...`)
- `DIRECT_URL`: Direct connection string to Neon Staging (`ep-restless-sound-b3sfv7ak...`)
- `AUTH_SECRET`: Minimum 32-character secret for signing JWT sessions
- `RESEND_API_KEY`: (Optional) Resend API key for live staging emails
- `NEXT_PUBLIC_APP_URL`: Vercel preview deployment URL

### Step 3: Trigger Vercel Preview Build
```bash
npx vercel deploy --preview
```

---

## 4. Rollback Plan

If any critical issue arises during staging testing:
1. Since the migration `20261109185000_add_company_management_system` is **100% additive** (all new tables, non-destructive enums, foreign keys with `onDelete: Cascade` or `SetNull`), existing CMS, portfolio, and auth records remain unaffected.
2. To revert code changes, check out `feature/vercel-staging-deployment`.
3. The existing `AdminUser`, `Project`, `AuditLog`, and `RevokedToken` tables maintain full backward compatibility.
