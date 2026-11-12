/**
 * SADEEM — ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSIONS SYSTEM
 * 
 * Enforces least privilege, deny-by-default, and granular role capabilities across
 * Company Management, Projects, CMS, and System Administration.
 */

import { AdminRole } from "@prisma/client";
import { getSession, CurrentUserSession } from "@/lib/auth/session";

export type Permission =
  // Company & Org
  | "company:view"
  | "teams:view"
  | "teams:manage"
  // Members & Lifecycle
  | "members:view"
  | "members:create"
  | "members:edit"
  | "members:invite"
  | "members:approve"
  | "members:suspend"
  | "invitations:create"
  | "invitations:approve"
  | "admin_notes:read"
  // Tasks
  | "tasks:view_all"
  | "tasks:view_team"
  | "tasks:view_own"
  | "tasks:create"
  | "tasks:assign"
  | "tasks:update_status"
  | "tasks:review"
  | "tasks:delete"
  // Recommendations
  | "recommendations:view_all"
  | "recommendations:view_team"
  | "recommendations:view_own"
  | "recommendations:create"
  | "recommendations:acknowledge"
  // System & Audit
  | "permissions:manage"
  | "audit:view"
  | "projects:manage"
  | "content:manage";

const ALL_PERMISSIONS: Permission[] = [
  "company:view",
  "teams:view",
  "teams:manage",
  "members:view",
  "members:create",
  "members:edit",
  "members:invite",
  "members:approve",
  "members:suspend",
  "invitations:create",
  "invitations:approve",
  "admin_notes:read",
  "tasks:view_all",
  "tasks:view_team",
  "tasks:view_own",
  "tasks:create",
  "tasks:assign",
  "tasks:update_status",
  "tasks:review",
  "tasks:delete",
  "recommendations:view_all",
  "recommendations:view_team",
  "recommendations:view_own",
  "recommendations:create",
  "recommendations:acknowledge",
  "permissions:manage",
  "audit:view",
  "projects:manage",
  "content:manage",
];

const ROLE_PERMISSIONS: Record<AdminRole, Set<Permission>> = {
  SUPER_ADMIN: new Set<Permission>(ALL_PERMISSIONS),

  COMPANY_ADMIN: new Set<Permission>([
    "company:view",
    "teams:view",
    "teams:manage",
    "members:view",
    "members:create",
    "members:edit",
    "members:invite",
    "members:approve",
    "members:suspend",
    "invitations:create",
    "invitations:approve",
    "admin_notes:read",
    "tasks:view_all",
    "tasks:view_team",
    "tasks:view_own",
    "tasks:create",
    "tasks:assign",
    "tasks:update_status",
    "tasks:review",
    "tasks:delete",
    "recommendations:view_all",
    "recommendations:view_team",
    "recommendations:view_own",
    "recommendations:create",
    "recommendations:acknowledge",
    "audit:view",
    "projects:manage",
    "content:manage",
  ]),

  TEAM_LEAD: new Set<Permission>([
    "company:view",
    "teams:view",
    "members:view",
    "tasks:view_team",
    "tasks:view_own",
    "tasks:create",
    "tasks:assign",
    "tasks:update_status",
    "tasks:review",
    "recommendations:view_team",
    "recommendations:view_own",
    "recommendations:create",
    "recommendations:acknowledge",
    "projects:manage",
  ]),

  PROJECT_MANAGER: new Set<Permission>([
    "company:view",
    "teams:view",
    "members:view",
    "tasks:view_all",
    "tasks:view_team",
    "tasks:view_own",
    "tasks:create",
    "tasks:assign",
    "tasks:update_status",
    "tasks:review",
    "recommendations:view_all",
    "recommendations:view_own",
    "recommendations:create",
    "recommendations:acknowledge",
    "projects:manage",
  ]),

  TEAM_MEMBER: new Set<Permission>([
    "company:view",
    "teams:view",
    "members:view",
    "tasks:view_team",
    "tasks:view_own",
    "tasks:update_status",
    "recommendations:view_own",
    "recommendations:acknowledge",
  ]),

  QA_REVIEWER: new Set<Permission>([
    "company:view",
    "teams:view",
    "members:view",
    "tasks:view_all",
    "tasks:view_team",
    "tasks:view_own",
    "tasks:update_status",
    "tasks:review",
    "recommendations:view_own",
    "recommendations:acknowledge",
    "projects:manage",
  ]),

  EDITOR: new Set<Permission>([
    "company:view",
    "teams:view",
    "members:view",
    "tasks:view_own",
    "recommendations:view_own",
    "projects:manage",
    "content:manage",
  ]),

  VIEWER: new Set<Permission>([
    "company:view",
    "teams:view",
    "members:view",
    "tasks:view_own",
    "recommendations:view_own",
  ]),
};

/**
 * Checks if a given AdminRole holds a specific permission.
 */
export function hasPermission(role: AdminRole, permission: Permission): boolean {
  const allowed = ROLE_PERMISSIONS[role];
  if (!allowed) return false;
  if (allowed.has(permission)) return true;

  // Handle aliases
  if (permission === "invitations:create" && allowed.has("members:invite")) return true;
  if (permission === "members:invite" && allowed.has("invitations:create")) return true;
  if (permission === "invitations:approve" && allowed.has("members:approve")) return true;
  if (permission === "members:approve" && allowed.has("invitations:approve")) return true;

  return false;
}

/**
 * Server-side guard: Enforces that the current authenticated user has a specific permission.
 * Rejects unauthorized operations with an explicit FORBIDDEN Error.
 * Accepts either (permission) or (role, permission).
 */
export async function requirePermission(
  roleOrPermission: AdminRole | Permission,
  maybePermission?: Permission
): Promise<CurrentUserSession> {
  if (maybePermission) {
    const role = roleOrPermission as AdminRole;
    const permission = maybePermission;
    if (!hasPermission(role, permission)) {
      throw new Error(
        `FORBIDDEN: Permission '${permission}' is required. Your role is '${role}'.`
      );
    }
    const session = await getSession();
    if (!session) {
      throw new Error("UNAUTHORIZED: Active session required.");
    }
    return session;
  }

  const permission = roleOrPermission as Permission;
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED: Active session required.");
  }

  if (!hasPermission(session.role, permission)) {
    throw new Error(
      `FORBIDDEN: Permission '${permission}' is required. Your role is '${session.role}'.`
    );
  }

  return session;
}
