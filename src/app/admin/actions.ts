"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AdminRole, PublicationStatus, ProjectType, DevelopmentStatus, OwnershipType, PartnershipStatus } from "@prisma/client";
import { verifyPassword } from "@/lib/auth/password";
import { signSessionToken } from "@/lib/auth/jwt";
import { setSessionCookie, clearSessionCookie, getSession, requireRole, requireAuth } from "@/lib/auth/session";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/auth/rate-limit";
import { recordAuditLog } from "@/lib/auth/audit";
import { 
  createAdminProject, 
  updateAdminProject, 
  toggleProjectPublication, 
  archiveAdminProject,
  ProjectFormData 
} from "@/lib/services/adminProjectService";

export interface FormState {
  success?: boolean;
  error?: string;
  errors?: string[];
}

/**
 * Administrative Login Server Action
 * Enforces rate limiting, bcrypt verification, and generic error reporting.
 */
export async function loginAction(
  prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please provide both email and password." };
  }

  // Rate Limiting Check
  const rateLimitKey = `login:${email}`;
  const rateLimit = checkRateLimit(rateLimitKey);

  if (!rateLimit.allowed) {
    return {
      error: `Too many failed attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.`,
    };
  }

  // Query User
  const user = await prisma.adminUser.findUnique({
    where: { email },
  });

  // Generic failure: protect against email enumeration
  if (!user || !user.isActive) {
    recordFailedAttempt(rateLimitKey);
    await recordAuditLog({
      action: "LOGIN_FAILED",
      entityType: "AdminUser",
      details: { emailAttempted: email, reason: "USER_NOT_FOUND_OR_INACTIVE" },
    });
    return { error: "Invalid email or password." };
  }

  // Verify Password
  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    recordFailedAttempt(rateLimitKey);
    await recordAuditLog({
      userId: user.id,
      action: "LOGIN_FAILED",
      entityType: "AdminUser",
      details: { email: user.email, reason: "INVALID_CREDENTIALS" },
    });
    return { error: "Invalid email or password." };
  }

  // Reset rate limit on success
  resetRateLimit(rateLimitKey);

  // Update Last Login
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Sign and Set Session Cookie
  const token = await signSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  await setSessionCookie(token);

  // Record Audit Log
  await recordAuditLog({
    userId: user.id,
    action: "LOGIN_SUCCESS",
    entityType: "AdminUser",
    details: { email: user.email, role: user.role },
  });

  redirect("/admin");
}

/**
 * Administrator Logout Server Action
 */
export async function logoutAction(): Promise<void> {
  const session = await getSession();
  if (session) {
    await recordAuditLog({
      userId: session.userId,
      action: "LOGOUT",
      entityType: "AdminUser",
      details: { email: session.email },
    });
  }

  await clearSessionCookie();
  redirect("/admin/login");
}

/**
 * Create Project Server Action
 */
export async function createProjectAction(data: ProjectFormData): Promise<FormState> {
  try {
    const session = await requireRole([AdminRole.SUPER_ADMIN, AdminRole.EDITOR]);
    const project = await createAdminProject(data, session);

    revalidatePath("/admin/projects");
    revalidatePath("/work-preview");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("createProjectAction error:", error);
    return { error: error.message || "Failed to create project." };
  }
}

/**
 * Update Project Server Action
 */
export async function updateProjectAction(
  id: string,
  data: ProjectFormData
): Promise<FormState> {
  try {
    const session = await requireRole([AdminRole.SUPER_ADMIN, AdminRole.EDITOR]);
    await updateAdminProject(id, data, session);

    revalidatePath("/admin/projects");
    revalidatePath(`/admin/projects/${id}/edit`);
    revalidatePath(`/work/${data.slug}`);
    revalidatePath(`/work-preview/${data.slug}`);
    revalidatePath("/work-preview");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("updateProjectAction error:", error);
    return { error: error.message || "Failed to update project." };
  }
}

/**
 * Toggle Project Publication Status Server Action (SUPER_ADMIN only)
 */
export async function togglePublicationAction(
  id: string,
  newStatus: PublicationStatus
): Promise<FormState> {
  try {
    const session = await requireAuth();
    const result = await toggleProjectPublication(id, newStatus, session);

    if (!result.success) {
      return {
        success: false,
        errors: result.errors || ["Failed to change publication status."],
      };
    }

    revalidatePath("/admin/projects");
    revalidatePath("/work-preview");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("togglePublicationAction error:", error);
    return { error: error.message || "An unexpected error occurred." };
  }
}

/**
 * Archive Project Server Action (SUPER_ADMIN only)
 */
export async function archiveProjectAction(id: string): Promise<FormState> {
  try {
    const session = await requireAuth();
    const result = await archiveAdminProject(id, session);

    if (!result.success) {
      return {
        success: false,
        errors: result.errors || ["Failed to archive project."],
      };
    }

    revalidatePath("/admin/projects");
    revalidatePath("/work-preview");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("archiveProjectAction error:", error);
    return { error: error.message || "An unexpected error occurred." };
  }
}
