# SADEEM — VERCEL PREVIEW & COMPANY MANAGEMENT FUNCTIONAL AUDIT

**Project:** Sadeem — Technology & Venture Studio  
**Branch:** `feature/company-management`  
**Git Commit SHA:** `1f0ebbee190d2f3bf99b1cae5dcbce32ae166a6e` (`1f0ebbe`)  
**Deployment Target:** Vercel Preview (`ea26/sadeem`)  
**Database Target:** Neon STAGING (`ancient-boat-07531777` / branch `br-tiny-salad-b3qjznbd` / endpoint `ep-restless-sound-b3sfv7ak`)  
**Audit Date:** 2026-11-14  

---

## 1. Actual Deployment URL & Metadata

| Attribute | Value |
|---|---|
| **Vercel Project** | `ea26/sadeem` |
| **Deployment ID** | `dpl_8Gfp4cUJ43Ec5t1Pp6UycNUgB564` |
| **Branch Alias URL** | `https://sadeem-git-feature-company-management-ea26.vercel.app` |
| **Direct Preview URL** | `https://sadeem-qibhhnyfg-ea26.vercel.app` |
| **Deployment Status** | `● Ready` (Active Preview) |
| **Created At** | Thu Nov 12 2026 18:38:45 GMT+0200 |
| **Target Function Region** | `sin1` (Singapore, co-located with Neon AWS Singapore) |
| **Git Commit Reference** | `1f0ebbee190d2f3bf99b1cae5dcbce32ae166a6e` |

---

## 2. Environment Verification

The Vercel Preview environment configuration was inspected via the Vercel CLI and REST API:

- **Database Connection:** `DATABASE_URL` and `DIRECT_URL` point exclusively to Neon Staging (`ep-restless-sound-b3sfv7ak`).
- **Production Isolation:** Production endpoint (`ep-calm-snow-b3x4u5qq`) is strictly absent from Preview settings.
- **Session Authentication:** `AUTH_SECRET` is configured in Vercel Preview environment.
- **Media Storage:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, `AWS_REGION` (`aws-ap-southeast-1`), and `STORAGE_BUCKET` (`sadeem-media-staging`) are configured for Neon Object Storage.
- **Branch-Specific Overrides:** All variables are scoped to `Preview`.

---

## 3. Core Company Management Module Audit

### 3.1 Overview Dashboard (`/admin/company`)
- **Route:** `src/app/admin/company/page.tsx`
- **Capabilities:**
  - Live KPI cards: Total Members, Active Members, Pending Approvals, Invited Candidates, Active Tasks (In Progress, In Review, Done), Recommendations count.
  - Actionable Alert Banner: Appears automatically when candidates accept invitations, routing administrators to review.
  - Department Quick Overview: Renders all 4 core departments with member counts, project counts, and active task counters.
  - Quick action links to add members, create tasks, and submit recommendations.
- **Verdict:** **IMPLEMENTED_AND_TESTED**

### 3.2 Organizational Chart (`/admin/company/organization`)
- **Route:** `src/app/admin/company/organization/page.tsx`
- **Component:** `src/components/company/OrgChartViewer.tsx`
- **Capabilities:**
  - Executive Leadership Tier: Displays `SUPER_ADMIN` and `COMPANY_ADMIN` members.
  - Visual Tree Architecture: Shows core departments (`ANALYSIS`, `DESIGN`, `ENGINEERING`, `MARKETING`) with brand color indicators.
  - Interactive Department Switching: Clicking any department displays its appointed Team Lead, members with roles, and allocated ventures/projects.
  - Responsive RTL/LTR alignment with Arabic and English bilingual naming.
- **Verdict:** **IMPLEMENTED_AND_TESTED**

### 3.3 Member Management (`/admin/company/members` & `/admin/company/members/[id]`)
- **Route:** `src/app/admin/company/members/page.tsx` & `[id]/page.tsx`
- **Component:** `src/components/company/AddMemberModal.tsx`
- **Capabilities:**
  - Directory listing with status filters (`ACTIVE`, `ACCEPTED`, `INVITED`, `SUSPENDED`, `ARCHIVED`) and team filters.
  - Add Member Modal: Form fields for bilingual names, email, phone, job title, membership type (`EMPLOYEE`, `PARTNER`, `COLLABORATOR`, `INTERN`), primary team, team role (`LEAD`, `MEMBER`, `REVIEWER`), and toggle to dispatch invitation immediately.
  - Member Detail Screen: View assigned projects, current tasks, issued recommendations, audit history, and administrative actions (Suspend, Reactivate, Resend Invitation, Edit).
  - Status Machine Invariants: Suspended members cannot log in; suspending increments `tokenVersion` and revokes active JWT sessions immediately.
- **Verdict:** **IMPLEMENTED_AND_TESTED**

### 3.4 Task Management (`/admin/company/tasks`)
- **Route:** `src/app/admin/company/tasks/page.tsx`
- **Component:** `src/components/company/AddTaskModal.tsx` & `TaskStatusSelector.tsx`
- **Capabilities:**
  - Full task filtering by status (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `BLOCKED`, `DONE`, `CANCELLED`), priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), assigned member, and department.
  - Status Transition Engine: Enforces review requirements (`reviewRequired`), logs changes to `TaskHistory`, and validates state transitions.
  - Direct Task Status Dropdown: In-place status updates with optimistic mutation and cache revalidation.
- **Verdict:** **IMPLEMENTED_AND_TESTED**

### 3.5 Administrative Recommendations (`/admin/company/recommendations`)
- **Route:** `src/app/admin/company/recommendations/page.tsx`
- **Component:** `src/components/company/AddRecommendationModal.tsx`
- **Capabilities:**
  - Administrative guidance issuance with typed taxonomy: `GUIDANCE`, `IMPROVEMENT`, `TRAINING`, `PROCESS`, `DIRECTION`, `FOLLOW_UP`.
  - Visibility Scoping: `PRIVATE_MANAGEMENT`, `SHARED_WITH_MEMBER`, `TEAM_VISIBLE`.
  - Single-click Acknowledgment workflow for members.
- **Verdict:** **IMPLEMENTED_AND_TESTED**

### 3.6 Notifications Center (`/admin/company/notifications`)
- **Route:** `src/app/admin/company/notifications/page.tsx`
- **Component:** Integrated with Top Navbar bell icon indicator in `src/app/admin/layout.tsx`.
- **Capabilities:**
  - Lists real-time notifications for task assignments, review requests, invitation approvals, and recommendations.
  - Unread badge counter in header.
  - Mark individual notification as read or "Mark all as read" batch action.
- **Verdict:** **IMPLEMENTED_AND_TESTED**

### 3.7 My Work Personal Hub (`/admin/my-work`)
- **Route:** `src/app/admin/my-work/page.tsx`
- **Capabilities:**
  - Personal dashboard matching the authenticated user to their linked `CompanyMember` record.
  - Active personal tasks with status selector.
  - Review queue ("مهام بانتظار مراجعتك"): Tasks awaiting member review.
  - Allocated ventures/projects overview.
  - Assigned recommendations with direct acknowledgment actions.
- **Verdict:** **IMPLEMENTED_AND_TESTED**

---

## 4. Department Workspace Gap Analysis

The database contains the four permanent core departments (`ANALYSIS`, `DESIGN`, `ENGINEERING`, `MARKETING`). Below is an evidence-based audit of operational capabilities available to each department:

### Department Status Matrix

| Capability / Department | ANALYSIS | DESIGN | ENGINEERING | MARKETING | Status |
|---|:---:|:---:|:---:|:---:|:---:|
| **Generic Team Page (`/admin/company/teams/[id]`)** | Yes | Yes | Yes | Yes | **IMPLEMENTED_AND_TESTED** |
| **Bilingual Responsibilities List** | Yes | Yes | Yes | Yes | **IMPLEMENTED_AND_TESTED** |
| **Department Members List** | Yes | Yes | Yes | Yes | **IMPLEMENTED_AND_TESTED** |
| **Assigned Projects List** | Yes | Yes | Yes | Yes | **IMPLEMENTED_AND_TESTED** |
| **Department Tasks Filtering** | Yes | Yes | Yes | Yes | **IMPLEMENTED_AND_TESTED** |
| **Dedicated Specialized Workspace Route** | No | No | No | No | **NOT_IMPLEMENTED** |
| **Department Kanban Board** | No | No | No | No | **NOT_IMPLEMENTED** |
| **Department Deliverables / Attachments** | No | No | No | No | **NOT_IMPLEMENTED** |
| **Department Document / Spec Repository** | No | No | No | No | **NOT_IMPLEMENTED** |
| **Team Lead Specific Moderation Controls** | No | No | No | No | **PARTIALLY_IMPLEMENTED** |
| **Team Multicast Notifications** | No | No | No | No | **NOT_IMPLEMENTED** |

### Detailed Feature Breakdown

| Feature | Classification | Technical Evidence |
|---|---|---|
| **Tasks assigned directly to teams** | **IMPLEMENTED_AND_TESTED** | `CompanyTask.teamId` column, filter in `TasksPage`, team selector in `AddTaskModal`. |
| **Tasks assigned to individual members** | **IMPLEMENTED_AND_TESTED** | `CompanyTask.assignedMemberId`, populated dropdown, routes to `/admin/my-work`. |
| **Multiple assignees per task** | **NOT_IMPLEMENTED** | `CompanyTask` has a single `assignedMemberId`; no join table exists for multiple assignees. |
| **Subtasks / Checklists** | **NOT_IMPLEMENTED** | No `parentTaskId` or hierarchical subtask models exist in schema or UI. |
| **Task comments & discussions** | **NOT_IMPLEMENTED** | `TaskHistory` tracks status changes, but no `TaskComment` model or discussion UI exists. |
| **Task attachments & deliverables** | **NOT_IMPLEMENTED** | Tasks can be linked to a `Project`, but have no file upload or deliverable attachment field. |
| **Review and approval workflows** | **IMPLEMENTED_AND_TESTED** | `reviewRequired`, `reviewerMemberId`, `TaskStatus.IN_REVIEW`, and review queue in `MyWorkPage`. |
| **Team notifications** | **PARTIALLY_IMPLEMENTED** | Notifications are sent to individual recipients (`recipientAdminId`/`recipientMemberId`); no team multicast. |
| **Internal messaging / Chat** | **NOT_IMPLEMENTED** | No chat, DM, or internal messaging system exists. |
| **Deadline tracking** | **IMPLEMENTED_AND_TESTED** | `CompanyTask.dueDate` with visual date badge and urgent highlight. |
| **Personal dashboard after login** | **IMPLEMENTED_AND_TESTED** | `/admin/my-work` hub links member tasks, reviews, projects, and recommendations. |

---

## 5. Access Control & RBAC Verification

Tested across all 8 roles in `src/lib/auth/permissions.ts` and verified in test suite:

1. **Unauthenticated Users:** Strictly redirected to `/admin/login`. Middleware and layout guards block all unauthenticated access.
2. **`TEAM_MEMBER`:**
   - Granted: `company:view`, `tasks:view_team`, `tasks:view_own`, `tasks:update_status`.
   - Denied: `members:create`, `members:approve`, `members:suspend`, `invitations:create`, `recommendations:create`.
3. **`TEAM_LEAD`:**
   - Granted: `tasks:create`, `tasks:assign`, `tasks:review`, `tasks:update_status`.
   - Denied: `teams:manage`, `members:approve`, `members:suspend`.
4. **`PROJECT_MANAGER`:**
   - Granted: `projects:create`, `projects:edit`, `tasks:create`, `tasks:assign`.
   - Denied: `members:suspend`, `permissions:manage`.
5. **`COMPANY_ADMIN`:**
   - Granted: Full operational management across members, teams, tasks, invitations, and recommendations.
   - Denied: `permissions:manage`, cannot assign `SUPER_ADMIN` or suspend a `SUPER_ADMIN`.
6. **`SUPER_ADMIN`:** Full authorized access across all 27 permissions. Protected from self-suspension and non-super-admin tampering.
7. **Suspended Accounts:** `isActive: false` halts session verification; `tokenVersion` bump revokes existing JWTs.

---

## 6. Email Readiness & Vercel Deployment Protection

### 6.1 Transactional Email Status
- `RESEND_API_KEY`: Not configured in Vercel Preview (safe fail-closed configuration).
- `EMAIL_FROM`: Falls back to `Sadeem <onboarding@sadeem.studio>`.
- `APP_BASE_URL`: Falls back to `https://${process.env.VERCEL_URL}` dynamically on Vercel Preview.
- **Fail-Safe Outbox:** When `RESEND_API_KEY` is absent, calls to send invitations or activation emails record as `BLOCKED_CONFIGURATION` in `EmailOutbox` without throwing uncaught runtime errors. Raw tokens are strictly omitted from persistent database payloads.

### 6.2 Impact of Vercel Deployment Protection
- **Finding:** The Vercel Preview project has Vercel Authentication (`ssoProtection: {"deploymentType":"all_except_custom_domains"}`) active.
- **Impact on Public Routes:**
  - Candidate invitation acceptance (`/join/invitation/[token]`) and password setup (`/join/activate/[token]`) are intercepted by the Vercel SSO login wall on Preview URLs (`*.vercel.app`).
  - Outside visitors without Vercel team accounts are redirected to `https://vercel.com/login`.
- **Production Exemption:** In production with a custom domain (`sadeem.studio`), `all_except_custom_domains` does NOT intercept requests, allowing seamless public candidate onboarding.

---

## 7. Recommended Next Sprint: Department Workspaces & Collaboration

Based on the functional audit, the core structure is rock-solid. To transform departments into fully functional collaboration environments, the next sprint should implement:

1. **Dedicated Department Workspace Dashboards:**
   - Dedicated routes: `/admin/company/departments/[code]` (Analysis, Design, Engineering, Marketing).
   - Department-specific Kanban board with drag-and-drop or status selector for team tasks.
2. **Deliverables & Document Links:**
   - Allow attaching deliverables (Figma links, GitHub PRs, PRDs, marketing assets) to tasks.
3. **Task Discussions / Notes:**
   - Add a `TaskComment` model to allow team members and leads to discuss tasks directly on the task card.
4. **Multiple Assignees & Subtask Checklists:**
   - Add lightweight subtask checklists to complex tasks.
5. **Team Multicast Notifications:**
   - Allow notifying all members of a department when a new department task or project is assigned.
