# SADEEM COMPANY MANAGEMENT SYSTEM — PERMISSION MATRIX

**Architecture:** Least Privilege, Deny-by-Default Role-Based Access Control (RBAC)  
**Implementation:** `src/lib/auth/permissions.ts`  

---

## 1. Granular Role Definitions

| Role | Operational Scope |
| :--- | :--- |
| `SUPER_ADMIN` | Full unrestricted system, security, organizational, and database authority. |
| `COMPANY_ADMIN` | Complete operational management of teams, members, tasks, and recommendations. Excludes permission/role modification. |
| `TEAM_LEAD` | Manages team tasks, assigns work within team, submits reviews, views team recommendations. Cannot manage members or other teams. |
| `PROJECT_MANAGER` | Oversees project tasks, creates and delegates tasks across teams, views progress. Cannot modify organization structure or suspend members. |
| `TEAM_MEMBER` | Views own tasks and team board, updates own task statuses, acknowledges guidance notes. |
| `QA_REVIEWER` | Cross-functional quality assurance; reviews tasks submitted for formal review, tests deliverables. |
| `EDITOR` | CMS and content management scope with basic member directory view. |
| `VIEWER` | Read-only observation of company structure and own tasks. |

---

## 2. Complete Capability Matrix

| Permission Key | Description | `SUPER_ADMIN` | `COMPANY_ADMIN` | `TEAM_LEAD` | `PROJECT_MANAGER` | `TEAM_MEMBER` | `QA_REVIEWER` | `EDITOR` | `VIEWER` |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `company:view` | Access company overview & KPIs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `teams:view` | View team directory & org chart | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `teams:manage` | Create, modify, or archive teams | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `members:view` | View company member directory | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `members:create` | Register new members in studio | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `members:edit` | Update member profiles & metadata | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `members:invite` / `invitations:create` | Dispatch candidate invitations | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `members:approve` / `invitations:approve` | Approve candidates & issue activation tokens | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `members:suspend` | Suspend member & revoke JWT sessions | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `admin_notes:read` | Read internal notes on member profiles | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `tasks:view_all` | View tasks across all studio teams | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `tasks:view_team` | View tasks assigned to own team | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `tasks:view_own` | View personal tasks in `/admin/my-work` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `tasks:create` | Create and delegate tasks | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `tasks:assign` | Reassign tasks between members | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `tasks:update_status` | Move tasks through workflow states | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `tasks:review` | Review & approve tasks in `IN_REVIEW` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `tasks:delete` | Permanently delete a task | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `recommendations:view_all` | View guidance across all members | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `recommendations:view_team` | View team-wide guidance notes | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `recommendations:view_own` | View recommendations directed to self | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `recommendations:create` | Issue administrative steering guidance | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `recommendations:acknowledge` | Confirm receipt of guidance note | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `permissions:manage` | Modify roles & system permissions | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `audit:view` | Inspect dual-actor security audit logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `projects:manage` | Create, edit, and publish studio projects | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| `content:manage` | Edit marketing site copy and translations | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## 3. Server-Side Guard Patterns

All administrative actions and mutation endpoints enforce security via typed guards:

```typescript
// Guard pattern inside Server Actions
import { requirePermission } from "@/lib/auth/permissions";

export async function createMemberAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  // Throws 403 Forbidden Error if unauthorized
  await requirePermission(session.role, "members:create");
  
  // Proceed with execution
}
```
