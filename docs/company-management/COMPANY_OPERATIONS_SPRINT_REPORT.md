# SADEEM — COMPANY OPERATIONS SPRINT REPORT
## Department Workspaces, Task Collaboration, & Review Workflows

**Project:** Sadeem — Technology & Venture Studio  
**Branch:** `feature/company-operations`  
**Base Commit:** `1f0ebbe`  
**Sprint Focus:** Operationalization of Company Departments, Kanban Board, Task Collaboration, Discussions, Deliverables, and Review Workflows  
**Date:** 2026-11-15  

---

## 1. Executive Summary

This sprint transforms Sadeem's Company Management module from an administrative directory into a **daily operational collaboration workspace**. It delivers:
- **Shared Department Workspaces** (`/admin/company/departments/[code]`) covering `ANALYSIS`, `DESIGN`, `ENGINEERING`, and `MARKETING`, with a prioritized focus on **Marketing Operations**.
- **Interactive 5-Column Kanban Board** (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `BLOCKED`, `DONE`) with real-time filtering, search, and accessible non-drag status transitions.
- **Task Collaboration Modal** supporting subtask checklists with completion progress bars, multi-collaborator assignment, and responsibility boundaries.
- **Task Discussions** with chronological comment threads, `@MemberName` and `@all` mentions, and in-app notification dispatch.
- **Deliverables & Attachments** supporting Figma links, GitHub repo/PR links, document URLs, and private object storage file uploads (up to 15MB) with signed download security.
- **Formal Review & Approval Workflow** enforcing review gates (`IN_REVIEW` -> `DONE` or `CHANGES_REQUESTED`) so tasks requiring review cannot be marked `DONE` without authorized sign-off.
- **Enhanced Personal Workspace** (`/admin/my-work`) organizing owned tasks, collaborations, review queue, submitted deliverables, and guidance in a mobile-friendly view.
- **Multi-Tier Scope Authorization** combining system role permissions with department membership verification and resource scopes.

---

## 2. Additive Database Schema & Migration

### Migration Identifier
- **Name:** `20261114205021_add_task_collaboration_and_deliverables`
- **Location:** `prisma/migrations/20261114205021_add_task_collaboration_and_deliverables/migration.sql`
- **Application Target:** Applied and tested on isolated local development database (`sadeem_dev` on `localhost:5432`). **Neon Staging was NOT modified.**

### Schema Invariants & New Models
All schema changes are strictly **additive** and preserve 100% of existing `CompanyTask`, `CompanyMember`, and `AdminUser` data:

1. **`DeliverableType` (Enum):** `FIGMA_LINK`, `GITHUB_LINK`, `DOCUMENT_LINK`, `FILE_UPLOAD`, `OTHER`.
2. **`DeliverableStatus` (Enum):** `SUBMITTED`, `CHANGES_REQUESTED`, `APPROVED`, `SUPERSEDED`.
3. **`CompanyNotificationType` (Enum Additions):** `TASK_COMMENT_MENTION`, `TASK_REVIEW_APPROVED`, `TASK_CHANGES_REQUESTED`, `TEAM_ANNOUNCEMENT`.
4. **`TaskCollaborator` (Table):** Tracks supplementary team members collaborating on a task (`taskId`, `memberId`, `assignedAt`) while keeping `assignedMemberId` as the primary accountable owner.
5. **`TaskChecklistItem` (Table):** Lightweight subtasks (`taskId`, `title`, `isCompleted`, `order`, `completedAt`, `completedById`) enabling progress calculation.
6. **`TaskComment` (Table):** Threaded discussion messages (`taskId`, `authorAdminId`, `authorMemberId`, `content`, `isEdited`, `isDeleted`).
7. **`TaskDeliverable` (Table):** Attachments and deliverable URLs (`taskId`, `type`, `url`, `storageKey`, `fileName`, `fileSize`, `status`, `reviewNotes`, `reviewedById`).

---

## 3. Shared Department Workspaces

- **Route:** `/admin/company/departments/[code]`
- **Supported Department Codes:** `ANALYSIS`, `DESIGN`, `ENGINEERING`, `MARKETING`.
- **Reusable Shared Architecture:** Built on `DepartmentWorkspaceView.tsx`, avoiding duplicated code while delivering tailored operational hubs:
  - **Department Overview & KPIs:** Total tasks, in-progress count, pending review queue, blocked count, overdue tasks count, and upcoming deadlines (< 7 days).
  - **Team Lead & Member Directory:** Department lead profile card, member cards with roles (`LEAD`, `MEMBER`, `REVIEWER`), contact info, and active assignments.
  - **Allocated Ventures:** Projects and ventures linked to the department with status badges and quick links.
  - **Announcements & Guidance:** Lead broadcast announcement trigger and department recommendations with 1-click acknowledgment.

### Department-Specific Operational Focus Sections

| Department | Operational Focus | Key Deliverables & Integrations |
|---|---|---|
| **MARKETING** *(Primary Focus)* | Content editorial calendar, campaign preparation, creative copy sign-offs, publication schedules | Marketing deliverables, campaign task tracking, creative asset approval queue |
| **ENGINEERING** | Development repositories, pull request reviews, testing checklists, deployment tracking | GitHub repository & PR links, CI/CD checklists, code review queue |
| **DESIGN** | UI/UX design mockups, design systems, visual feedback, prototype approvals | Figma prototype links, design review status, design assets |
| **ANALYSIS** | Product requirements documents (PRD), market research, stakeholder approvals | PRD links, research reports, business requirements sign-offs |

---

## 4. Kanban Task Board & Collaboration

- **Component:** `DepartmentKanbanBoard.tsx`
- **Columns:** `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `BLOCKED`, `DONE`.
- **Filter Bar:** Instant text search across titles and descriptions, priority filter (`URGENT`, `HIGH`, `MEDIUM`, `LOW`), member filter, and project filter.
- **Card Features:**
  - Priority badge (red for urgent, amber for high, neutral for medium/low).
  - Subtask checklist completion indicator and progress bar (`X/Y` items, % completed).
  - Primary owner name and collaborator count badge.
  - Deliverable indicators (`Paperclip`), comments count (`MessageSquare`), and due date with overdue highlight.
  - Accessible non-drag status transition selector.
- **Modal Integration:** Clicking any task opens `TaskCollaborationModal.tsx` for immediate in-place work.

---

## 5. Task Discussions, Mentions & Notifications

- **Chronological Discussion Thread:** Real-time comment stream showing author names, avatars, timestamps, and edit/deletion indicators.
- **Smart Mention Detection:** Mentions in comment text (e.g. `@Sara` or `@all`) are automatically parsed:
  - `@all`: Resolves all active department members and dispatches `TASK_COMMENT_MENTION` notifications.
  - `@MemberName`: Resolves specific department members and notifies them directly.
  - Deduplication: Recipient lists are deduplicated to prevent multiple notifications from a single comment.
- **Moderation Policy:** Authors can edit their own comments. Authors, department leads, and company admins can soft-delete comments (`isDeleted: true`).
- **Communication Scope:** Discussions remain strictly scoped to authorized task participants; no external live chat or public exposure.

---

## 6. Deliverables, Attachments & Storage Security

- **Link Deliverables:** Members can attach Figma files, GitHub PRs/repositories, Google Docs, Notion specs, or other external URLs with status `SUBMITTED`.
- **File Upload Deliverables:**
  - Validated by `validateDeliverableFile` in `storageProvider.ts`.
  - Allowed types: PDF (`application/pdf`), Word (`.docx`, `.doc`), Excel (`.xlsx`), PowerPoint (`.pptx`), Markdown, Plain Text, JSON, ZIP, and standard images (PNG, JPEG, WebP, GIF).
  - Strictly blocked: Executable binaries (`.exe`, `.sh`, `.bat`, `.cmd`, `.js`, `.php`, etc.).
  - Size ceiling: 15.00 MB.
  - Private Neon Object Storage partitioning: `deliverables/{year}/{month}/{uuid}-{fileName}`.
  - Signed download authorization: Downloads use time-limited presigned URLs (`getSignedDownloadUrl`), keeping storage credentials 100% private.

---

## 7. Review & Approval Workflow

- **Review Submission:** Members click "Submit for Review / تسليم للمراجعة" with optional submission notes. The task transitions to `IN_REVIEW`, deliverables move to `SUBMITTED`, and reviewer is notified with `TASK_REVIEW_REQUESTED`.
- **Authorized Review Actions:**
  - **Approve:** Moves task to `DONE`, records `completedAt`, marks deliverables `APPROVED`, logs feedback notes in discussion and history, and notifies task owner with `TASK_REVIEW_APPROVED`.
  - **Request Changes:** Returns task to `IN_PROGRESS`, marks deliverables `CHANGES_REQUESTED` with reviewer feedback, automatically posts a comment with requested revisions, and notifies owner with `TASK_CHANGES_REQUESTED`.
- **Review Protection Guard:** Server-side transition validation strictly blocks review-required tasks from transitioning to `DONE` directly from `IN_PROGRESS` without authorized reviewer approval.

---

## 8. Enhanced Personal Workspace (`/admin/my-work`)

- **Component:** `MyWorkHubView.tsx`
- **Sections & Tabs:**
  1. **مهامي المسندة / Owned Tasks:** Primary assigned tasks with subtask progress bars and due date status.
  2. **أتعاون فيها / Collaborating Tasks:** Tasks where the user is an active collaborator.
  3. **بانتظار مراجعتي / Review Queue:** Actionable review queue for team leads, QA reviewers, and appointed reviewers.
  4. **مخرجاتي المسلمة / My Deliverables:** Overview of submitted work with review status badges and reviewer notes.
  5. **التوجيهات الإدارية / Guidance:** Direct recommendations with 1-click acknowledgment.
  6. **مشاريعي النشطة / My Projects:** Linked venture assignments.
- **Overdue Warnings:** Prominent warning banner appears whenever any assigned task passes its deadline.

---

## 9. Scope Authorization & Security Architecture

- **Capability + Scope Checking:** Implemented in `src/lib/auth/scopeGuard.ts` and `src/lib/auth/permissions.ts`.
- **Least Privilege:**
  - `SUPER_ADMIN` and `COMPANY_ADMIN`: Unrestricted organizational access across all departments and tasks.
  - `TEAM_LEAD`: Management of tasks, reviews, deliverables, and announcements within their authorized department.
  - `PROJECT_MANAGER`: Task coordination across assigned projects.
  - `TEAM_MEMBER`: View own department workspace, participate in assigned and collaborative tasks, submit deliverables and comments. Blocked from other departments.
  - `QA_REVIEWER`: Review and approve tasks and deliverables across assigned departments/projects.
- **Deny-by-Default:** All server actions verify session validity and resource permissions server-side.

---

## 10. Quality Assurance & Verification Evidence

### Automated Test Results (100% Passing)

| Test Suite | File | Scenarios Tested | Passed | Status |
|---|---|:---:|:---:|:---:|
| **Operations Sprint Suite** | `scripts/test-company-operations.ts` | 19 | 19/19 | **PASSED** |
| **Company Management Suite** | `scripts/test-company-management.ts` | 37 | 37/37 | **PASSED** |
| **Authentication Reliability** | `scripts/test-auth-reliability.ts` | 20 | 20/20 | **PASSED** |
| **CMS Data Flow & Staging** | `scripts/test-cms-data-flow.ts` | 22 | 22/22 | **PASSED** |
| **Total Automated Tests** | — | **98** | **98/98** | **100% GREEN** |

### Build & Type Verification
- **`npx prisma validate`:** Schema valid with 0 errors.
- **`npx tsc --noEmit`:** TypeScript checks completed with **0 errors**.
- **`npm run lint`:** ESLint completed with **0 warnings and 0 errors**.
- **`npm run build`:** Production compilation succeeded; generated all 25 static and dynamic pages including `/admin/company/departments/[code]` and `/admin/my-work`.

---

## 11. Staging Deployment & Migration Guide

When the owner approves rolling this sprint out to Neon Staging:

1. **Verify Staging Target:**
   ```bash
   npx dotenv -e .env.staging -- prisma migrate status
   ```
2. **Apply Additive Migration to Staging:**
   ```bash
   npx dotenv -e .env.staging -- prisma migrate deploy
   ```
3. **Verify Staging Tables:**
   Confirm `TaskCollaborator`, `TaskChecklistItem`, `TaskComment`, and `TaskDeliverable` exist on `ep-restless-sound-b3sfv7ak`.
4. **Deploy Vercel Preview:**
   Create preview deployment from `feature/company-operations`.
