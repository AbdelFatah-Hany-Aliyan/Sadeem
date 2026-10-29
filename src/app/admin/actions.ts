"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AdminRole, PublicationStatus, ProjectType, DevelopmentStatus, OwnershipType, PartnershipStatus, InquiryStatus, InquiryType, MediaType } from "@prisma/client";
import { verifyPassword } from "@/lib/auth/password";
import { signSessionToken } from "@/lib/auth/jwt";
import { setSessionCookie, clearSessionCookie, revokeCurrentSession, getSession, requireRole, requireAuth } from "@/lib/auth/session";
import { checkRateLimit, checkDistributedRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/auth/rate-limit";
import { recordAuditLog } from "@/lib/auth/audit";
import { 
  createAdminProject, 
  updateAdminProject, 
  toggleProjectPublication, 
  archiveAdminProject,
  ProjectFormData 
} from "@/lib/services/adminProjectService";
import {
  saveAdminSectionDraft,
  publishAdminSection,
  revertAdminSectionDraft,
} from "@/lib/services/contentService";
import {
  createMediaRecord,
  associateMediaWithProject,
  disassociateMediaFromProject,
  updateMediaTranslations,
  reorderProjectMedia,
  deleteMediaAsset,
} from "@/lib/services/mediaService";
import { uploadFileToStorage } from "@/lib/storage/storageProvider";
import {
  submitBusinessProjectInquiry,
  submitVenturePitchInquiry,
  submitGeneralInquiry,
  updateInquiryStatus,
  assignInquiry,
  updateInquiryInternalNotes,
  archiveOrDeleteInquiry,
  BusinessProjectFormInput,
  VenturePitchFormInput,
  GeneralInquiryFormInput,
} from "@/lib/services/inquiryService";

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

  // Rate Limiting Check (distributed-ready)
  const rateLimitKey = `login:${email}`;
  const rateLimit = await checkDistributedRateLimit(rateLimitKey);

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
    tokenVersion: user.tokenVersion ?? 1,
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
 * Revokes token in database and clears session cookie.
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

  await revokeCurrentSession();
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

/**
 * =============================================================================
 * Content Management Server Actions
 * =============================================================================
 */

/**
 * Save Content Section Draft Server Action (SUPER_ADMIN or EDITOR)
 */
export async function saveContentDraftAction(
  sectionKey: string,
  data: { en: Record<string, unknown>; ar: Record<string, unknown> }
): Promise<FormState> {
  try {
    const session = await requireRole([AdminRole.SUPER_ADMIN, AdminRole.EDITOR]);
    const result = await saveAdminSectionDraft(sectionKey, data, session);

    if (!result.success) {
      return { success: false, errors: result.errors };
    }

    revalidatePath("/admin/content");
    revalidatePath(`/admin/content/${sectionKey}/edit`);

    return { success: true };
  } catch (error: any) {
    console.error("saveContentDraftAction error:", error);
    return { error: error.message || "Failed to save draft content." };
  }
}

/**
 * Publish Content Section Server Action (SUPER_ADMIN only)
 */
export async function publishContentSectionAction(sectionKey: string): Promise<FormState> {
  try {
    const session = await requireAuth();
    const result = await publishAdminSection(sectionKey, session);

    if (!result.success) {
      return { success: false, errors: result.errors };
    }

    revalidatePath("/");
    revalidatePath("/admin/content");
    revalidatePath(`/admin/content/${sectionKey}/edit`);

    return { success: true };
  } catch (error: any) {
    console.error("publishContentSectionAction error:", error);
    return { error: error.message || "Failed to publish content section." };
  }
}

/**
 * Revert Content Section Draft Server Action
 */
export async function revertContentDraftAction(sectionKey: string): Promise<FormState> {
  try {
    const session = await requireRole([AdminRole.SUPER_ADMIN, AdminRole.EDITOR]);
    const result = await revertAdminSectionDraft(sectionKey, session);

    if (!result.success) {
      return { success: false, errors: result.errors };
    }

    revalidatePath("/admin/content");
    revalidatePath(`/admin/content/${sectionKey}/edit`);

    return { success: true };
  } catch (error: any) {
    console.error("revertContentDraftAction error:", error);
    return { error: error.message || "Failed to revert content draft." };
  }
}

/**
 * =============================================================================
 * Media Management Server Actions
 * =============================================================================
 */

/**
 * Upload Media File Server Action
 */
export async function uploadMediaAction(formData: FormData): Promise<FormState & { mediaId?: string }> {
  try {
    const session = await requireRole([AdminRole.SUPER_ADMIN, AdminRole.EDITOR]);
    const file = formData.get("file") as File | null;
    const altTextEn = (formData.get("altTextEn") as string) || "";
    const altTextAr = (formData.get("altTextAr") as string) || "";
    const captionEn = (formData.get("captionEn") as string) || undefined;
    const captionAr = (formData.get("captionAr") as string) || undefined;
    const projectId = (formData.get("projectId") as string) || undefined;
    const mediaType = (formData.get("mediaType") as MediaType) || MediaType.SCREENSHOT;
    const isCover = formData.get("isCover") === "true";

    if (!file || file.size === 0) {
      return { error: "Please select a valid image file to upload." };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Attempt upload to object storage
    const uploadResult = await uploadFileToStorage({
      buffer,
      filename: file.name,
      mimeType: file.type || "image/png",
    });

    const createResult = await createMediaRecord(
      {
        projectId,
        mediaType,
        storageKey: uploadResult.storageKey,
        publicUrl: uploadResult.publicUrl,
        originalFilename: file.name,
        mimeType: uploadResult.mimeType,
        sizeBytes: uploadResult.sizeBytes,
        isCover,
        altTextEn,
        altTextAr,
        captionEn,
        captionAr,
      },
      session
    );

    if (!createResult.success) {
      return { success: false, errors: createResult.errors };
    }

    revalidatePath("/admin/media");
    if (projectId) {
      revalidatePath(`/admin/projects/${projectId}/edit`);
      revalidatePath("/work-preview");
      revalidatePath("/");
    }

    return { success: true, mediaId: createResult.mediaId };
  } catch (error: any) {
    console.error("uploadMediaAction error:", error);
    return { error: error.message || "Failed to upload media." };
  }
}

/**
 * Create Existing / Seeded Media Record Server Action
 */
export async function createMediaRecordAction(data: {
  storageKey: string;
  publicUrl?: string;
  originalFilename?: string;
  mimeType?: string;
  mediaType?: MediaType;
  projectId?: string;
  isCover?: boolean;
  altTextEn: string;
  altTextAr: string;
  captionEn?: string;
  captionAr?: string;
}): Promise<FormState & { mediaId?: string }> {
  try {
    const session = await requireRole([AdminRole.SUPER_ADMIN, AdminRole.EDITOR]);
    const result = await createMediaRecord(data, session);

    if (!result.success) {
      return { success: false, errors: result.errors };
    }

    revalidatePath("/admin/media");
    if (data.projectId) {
      revalidatePath(`/admin/projects/${data.projectId}/edit`);
      revalidatePath("/work-preview");
      revalidatePath("/");
    }

    return { success: true, mediaId: result.mediaId };
  } catch (error: any) {
    return { error: error.message || "Failed to register media asset." };
  }
}

/**
 * Associate Media with Project Server Action
 */
export async function associateMediaAction(
  mediaId: string,
  projectId: string,
  options?: { isCover?: boolean; displayOrder?: number }
): Promise<FormState> {
  try {
    await requireRole([AdminRole.SUPER_ADMIN, AdminRole.EDITOR]);
    const result = await associateMediaWithProject(mediaId, projectId, options);

    if (!result.success) {
      return { success: false, errors: result.errors };
    }

    revalidatePath("/admin/media");
    revalidatePath(`/admin/projects/${projectId}/edit`);
    revalidatePath("/work-preview");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to associate media." };
  }
}

/**
 * Disassociate Media from Project Server Action
 */
export async function disassociateMediaAction(mediaId: string, projectId?: string): Promise<FormState> {
  try {
    await requireRole([AdminRole.SUPER_ADMIN, AdminRole.EDITOR]);
    const result = await disassociateMediaFromProject(mediaId);

    if (!result.success) {
      return { success: false, errors: result.errors };
    }

    revalidatePath("/admin/media");
    if (projectId) {
      revalidatePath(`/admin/projects/${projectId}/edit`);
      revalidatePath("/work-preview");
      revalidatePath("/");
    }

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to disassociate media." };
  }
}

/**
 * Update Media Bilingual Translations Server Action
 */
export async function updateMediaTranslationsAction(
  mediaId: string,
  data: { altTextEn: string; altTextAr: string; captionEn?: string; captionAr?: string }
): Promise<FormState> {
  try {
    const session = await requireRole([AdminRole.SUPER_ADMIN, AdminRole.EDITOR]);
    const result = await updateMediaTranslations(mediaId, data, session);

    if (!result.success) {
      return { success: false, errors: result.errors };
    }

    revalidatePath("/admin/media");
    revalidatePath("/work-preview");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update media translations." };
  }
}

/**
 * Reorder Project Media Server Action
 */
export async function reorderMediaAction(
  projectId: string,
  orderedMediaIds: string[]
): Promise<FormState> {
  try {
    await requireRole([AdminRole.SUPER_ADMIN, AdminRole.EDITOR]);
    const result = await reorderProjectMedia(projectId, orderedMediaIds);

    if (!result.success) {
      return { success: false, errors: result.errors };
    }

    revalidatePath("/admin/media");
    revalidatePath(`/admin/projects/${projectId}/edit`);
    revalidatePath("/work-preview");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to reorder media." };
  }
}

/**
 * Delete Media Asset Server Action (SUPER_ADMIN only)
 */
export async function deleteMediaAction(mediaId: string): Promise<FormState> {
  try {
    const session = await requireAuth();
    const result = await deleteMediaAsset(mediaId, session);

    if (!result.success) {
      return { success: false, errors: result.errors };
    }

    revalidatePath("/admin/media");
    revalidatePath("/admin/projects");
    revalidatePath("/work-preview");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete media asset." };
  }
}

/**
 * =============================================================================
 * Client Inquiries & Lead Management Server Actions
 * =============================================================================
 */

function getClientIp(): string | undefined {
  try {
    const headerList = headers();
    const forwarded = headerList.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return headerList.get("x-real-ip") || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Public Server Action: Submit Business Project Inquiry (Start a Project)
 */
export async function submitBusinessProjectAction(input: BusinessProjectFormInput): Promise<FormState & { inquiryId?: string }> {
  try {
    const ip = getClientIp();
    const res = await submitBusinessProjectInquiry(input, ip);
    if (!res.success) {
      return { success: false, errors: res.errors };
    }
    return { success: true, inquiryId: res.inquiryId };
  } catch (error: any) {
    console.error("submitBusinessProjectAction error:", error);
    return { error: error.message || "Failed to process inquiry submission." };
  }
}

/**
 * Public Server Action: Submit Venture Pitch Inquiry (Pitch an Idea)
 */
export async function submitVenturePitchAction(input: VenturePitchFormInput): Promise<FormState & { inquiryId?: string }> {
  try {
    const ip = getClientIp();
    const res = await submitVenturePitchInquiry(input, ip);
    if (!res.success) {
      return { success: false, errors: res.errors };
    }
    return { success: true, inquiryId: res.inquiryId };
  } catch (error: any) {
    console.error("submitVenturePitchAction error:", error);
    return { error: error.message || "Failed to process pitch submission." };
  }
}

/**
 * Public Server Action: Submit General Contact Inquiry
 */
export async function submitGeneralInquiryAction(input: GeneralInquiryFormInput): Promise<FormState & { inquiryId?: string }> {
  try {
    const ip = getClientIp();
    const res = await submitGeneralInquiry(input, ip);
    if (!res.success) {
      return { success: false, errors: res.errors };
    }
    return { success: true, inquiryId: res.inquiryId };
  } catch (error: any) {
    console.error("submitGeneralInquiryAction error:", error);
    return { error: error.message || "Failed to process general inquiry." };
  }
}

/**
 * Admin Server Action: Update Inquiry Pipeline Status
 */
export async function updateInquiryStatusAction(id: string, newStatus: InquiryStatus): Promise<FormState> {
  try {
    const session = await requireAuth();
    const res = await updateInquiryStatus(id, newStatus, session);
    if (!res.success) {
      return { success: false, errors: res.errors };
    }

    revalidatePath("/admin/inquiries");
    revalidatePath(`/admin/inquiries/${id}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update inquiry status." };
  }
}

/**
 * Admin Server Action: Assign Inquiry to Team Member
 */
export async function assignInquiryAction(id: string, assignedToId: string | null): Promise<FormState> {
  try {
    const session = await requireAuth();
    const res = await assignInquiry(id, assignedToId, session);
    if (!res.success) {
      return { success: false, errors: res.errors };
    }

    revalidatePath("/admin/inquiries");
    revalidatePath(`/admin/inquiries/${id}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update inquiry assignment." };
  }
}

/**
 * Admin Server Action: Update Inquiry Internal Notes & Follow-up Date
 */
export async function updateInquiryNotesAction(
  id: string,
  internalNotes: string,
  followUpDate: Date | null
): Promise<FormState> {
  try {
    const session = await requireAuth();
    const res = await updateInquiryInternalNotes(id, internalNotes, followUpDate, session);
    if (!res.success) {
      return { success: false, errors: res.errors };
    }

    revalidatePath("/admin/inquiries");
    revalidatePath(`/admin/inquiries/${id}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update internal notes." };
  }
}

/**
 * Admin Server Action: Archive or Delete Inquiry (SUPER_ADMIN only)
 */
export async function archiveInquiryAction(id: string, permanentDelete: boolean = false): Promise<FormState> {
  try {
    const session = await requireAuth();
    const res = await archiveOrDeleteInquiry(id, session, permanentDelete);
    if (!res.success) {
      return { success: false, errors: res.errors };
    }

    revalidatePath("/admin/inquiries");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to archive or delete inquiry." };
  }
}
