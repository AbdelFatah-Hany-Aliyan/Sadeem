/**
 * SADEEM STUDIO — CLIENT INQUIRY & LEAD MANAGEMENT SERVICE
 * 
 * Provides:
 * 1. Strongly typed validation for public intake (Start a Project & Pitch an Idea).
 * 2. Spam prevention: honeypot field verification and submission speed threshold.
 * 3. Public rate limiting: protection against automated lead-stuffing attacks.
 * 4. Administrative CRM workflow: pipeline status updates, internal notes, assignments.
 * 5. Privacy compliance: consent recording, separation of public vs internal notes.
 * 6. Audit trail: persistence to PostgreSQL AuditLog without sensitive secrets.
 */

import prisma from "@/lib/prisma";
import { 
  InquiryType, 
  InquiryStatus, 
  ContactChannel, 
  VentureStage, 
  ProjectCategory, 
  ExpectedTimeline, 
  BudgetRange,
  AdminRole,
  Prisma
} from "@prisma/client";
import { CurrentUserSession } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/auth/audit";
import { checkRateLimit, recordFailedAttempt } from "@/lib/auth/rate-limit";

// Field validation limits
const MAX_SHORT_STRING = 120;
const MAX_LONG_TEXT = 3000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export interface BusinessProjectFormInput {
  name: string;
  email: string;
  company?: string;
  contactChannel?: ContactChannel;
  phoneOrHandle?: string;
  projectCategory: ProjectCategory;
  problemStatement: string;
  desiredOutcome: string;
  expectedTimeline: ExpectedTimeline;
  budgetRange?: BudgetRange;
  locale?: string;
  consentGiven: boolean;
  honeypot?: string;
  formLoadedAt?: number;
}

export interface VenturePitchFormInput {
  name: string;
  email: string;
  contactChannel?: ContactChannel;
  phoneOrHandle?: string;
  ideaName?: string;
  problemStatement: string;
  targetAudience: string;
  ventureStage: VentureStage;
  founderExpertise: string;
  expectedInvolvement: string;
  existingResources?: string;
  locale?: string;
  consentGiven: boolean;
  honeypot?: string;
  formLoadedAt?: number;
}

export interface GeneralInquiryFormInput {
  name: string;
  email: string;
  company?: string;
  contactChannel?: ContactChannel;
  phoneOrHandle?: string;
  message: string;
  locale?: string;
  consentGiven: boolean;
  honeypot?: string;
  formLoadedAt?: number;
}

export interface InquiryFilterOptions {
  type?: InquiryType;
  status?: InquiryStatus;
  search?: string;
  assignedToId?: string;
  page?: number;
  limit?: number;
}

/**
 * Validates common submitter contact fields.
 */
function validateContactFields(data: { name: string; email: string }): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const trimmedName = data.name?.trim();
  if (!trimmedName || trimmedName.length < 2) {
    errors.push("Full name must be at least 2 characters.");
  } else if (trimmedName.length > MAX_SHORT_STRING) {
    errors.push(`Full name cannot exceed ${MAX_SHORT_STRING} characters.`);
  }

  const trimmedEmail = data.email?.trim();
  if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
    errors.push("Please provide a valid contact email address.");
  } else if (trimmedEmail.length > MAX_SHORT_STRING) {
    errors.push(`Email address cannot exceed ${MAX_SHORT_STRING} characters.`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Verifies spam signals (honeypot field and bot submission speed).
 */
function verifySpamSignals(honeypot?: string, formLoadedAt?: number): { isSpam: boolean; reason?: string } {
  // 1. Honeypot check: If the hidden honeypot field is filled by a bot, reject
  if (honeypot && honeypot.trim().length > 0) {
    return { isSpam: true, reason: "HONEYPOT_TRIGGERED" };
  }

  // 2. Submission speed check: Machine scripts submit in sub-seconds
  if (formLoadedAt && typeof formLoadedAt === "number") {
    const now = Date.now();
    const elapsedMs = now - formLoadedAt;

    // Clock drift guard: If client clock is slightly ahead of server clock (e.g., NTP skew up to 60s),
    // do not trigger false positive. Only flag if elapsed time is positive and sub-second (<1200ms).
    if (elapsedMs >= 0 && elapsedMs < 1200) {
      return { isSpam: true, reason: "SUBMISSION_TOO_FAST" };
    }

    // Absurd future timestamp (>1 hour in future) indicates spoofed payload
    if (formLoadedAt > now + 60 * 60 * 1000) {
      return { isSpam: true, reason: "SPOOFED_FUTURE_TIMESTAMP" };
    }
  }

  return { isSpam: false };
}

/**
 * Public Intake: Start a Project (Business System / Digital Platform)
 */
export async function submitBusinessProjectInquiry(
  input: BusinessProjectFormInput,
  clientIp?: string
): Promise<{ success: boolean; inquiryId?: string; errors?: string[] }> {
  try {
    // 1. Rate limiting check by IP or email
    const rateLimitKey = `inquiry:${clientIp || input.email.toLowerCase().trim()}`;
    const rateLimit = checkRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      return {
        success: false,
        errors: [`Too many submissions. Please wait ${rateLimit.retryAfterSeconds || 60} seconds before submitting again.`],
      };
    }

    // 2. Anti-spam checks
    const spamCheck = verifySpamSignals(input.honeypot, input.formLoadedAt);
    if (spamCheck.isSpam) {
      recordFailedAttempt(rateLimitKey);
      // Return synthetic success to confuse automated scrapers without polluting the database
      return { success: true };
    }

    // 3. Contact validation
    const contactVal = validateContactFields(input);
    if (!contactVal.valid) {
      return { success: false, errors: contactVal.errors };
    }

    // 4. Consent validation
    if (!input.consentGiven) {
      return { success: false, errors: ["Consent to the privacy notice is required to process your inquiry."] };
    }

    // 5. Purpose-specific validation
    const errors: string[] = [];
    if (!input.projectCategory) {
      errors.push("Please select a project category.");
    }
    if (!input.problemStatement?.trim() || input.problemStatement.trim().length < 10) {
      errors.push("Problem statement must be at least 10 characters.");
    } else if (input.problemStatement.length > MAX_LONG_TEXT) {
      errors.push(`Problem statement exceeds maximum limit of ${MAX_LONG_TEXT} characters.`);
    }

    if (!input.desiredOutcome?.trim() || input.desiredOutcome.trim().length < 10) {
      errors.push("Desired outcome must be at least 10 characters.");
    } else if (input.desiredOutcome.length > MAX_LONG_TEXT) {
      errors.push(`Desired outcome exceeds maximum limit of ${MAX_LONG_TEXT} characters.`);
    }

    if (!input.expectedTimeline) {
      errors.push("Please select an expected timeline.");
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // 6. Database persistence
    const inquiry = await prisma.inquiry.create({
      data: {
        inquiryType: InquiryType.BUSINESS_PROJECT,
        status: InquiryStatus.NEW,
        name: input.name.trim(),
        email: input.email.toLowerCase().trim(),
        company: input.company?.trim() || null,
        contactChannel: input.contactChannel || ContactChannel.EMAIL,
        phoneOrHandle: input.phoneOrHandle?.trim() || null,
        projectCategory: input.projectCategory,
        problemStatement: input.problemStatement.trim(),
        desiredOutcome: input.desiredOutcome.trim(),
        expectedTimeline: input.expectedTimeline,
        budgetRange: input.budgetRange || BudgetRange.UNDISCLOSED,
        locale: input.locale === "ar" ? "ar" : "en",
        sourceRoute: "/start-project",
        consentGiven: true,
        consentVersion: "v1.0-2026",
        consentGivenAt: new Date(),
        ipAddress: clientIp || null,
      },
    });

    // 7. Audit log (excluding sensitive secrets)
    await recordAuditLog({
      action: "INQUIRY_CREATED",
      entityType: "Inquiry",
      entityId: inquiry.id,
      details: {
        inquiryType: inquiry.inquiryType,
        email: inquiry.email,
        company: inquiry.company,
        projectCategory: inquiry.projectCategory,
      },
    });

    return { success: true, inquiryId: inquiry.id };
  } catch (error: any) {
    console.error("submitBusinessProjectInquiry error:", error);
    return { success: false, errors: ["An unexpected error occurred while saving your inquiry. Please try again."] };
  }
}

/**
 * Public Intake: Pitch an Idea (Venture Studio / Co-founding Exploration)
 */
export async function submitVenturePitchInquiry(
  input: VenturePitchFormInput,
  clientIp?: string
): Promise<{ success: boolean; inquiryId?: string; errors?: string[] }> {
  try {
    // 1. Rate limiting check
    const rateLimitKey = `inquiry:${clientIp || input.email.toLowerCase().trim()}`;
    const rateLimit = checkRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      return {
        success: false,
        errors: [`Too many submissions. Please wait ${rateLimit.retryAfterSeconds || 60} seconds before submitting again.`],
      };
    }

    // 2. Anti-spam checks
    const spamCheck = verifySpamSignals(input.honeypot, input.formLoadedAt);
    if (spamCheck.isSpam) {
      recordFailedAttempt(rateLimitKey);
      return { success: true };
    }

    // 3. Contact validation
    const contactVal = validateContactFields(input);
    if (!contactVal.valid) {
      return { success: false, errors: contactVal.errors };
    }

    // 4. Consent validation
    if (!input.consentGiven) {
      return { success: false, errors: ["Consent to the privacy notice is required to explore a venture pitch."] };
    }

    // 5. Purpose-specific validation
    const errors: string[] = [];
    if (!input.problemStatement?.trim() || input.problemStatement.trim().length < 10) {
      errors.push("Problem being addressed must be at least 10 characters.");
    } else if (input.problemStatement.length > MAX_LONG_TEXT) {
      errors.push(`Problem statement exceeds ${MAX_LONG_TEXT} characters.`);
    }

    if (!input.targetAudience?.trim() || input.targetAudience.trim().length < 5) {
      errors.push("Intended audience must be at least 5 characters.");
    }

    if (!input.ventureStage) {
      errors.push("Please select the current stage of the idea/product.");
    }

    if (!input.founderExpertise?.trim() || input.founderExpertise.trim().length < 10) {
      errors.push("Founder/domain expertise must be at least 10 characters.");
    }

    if (!input.expectedInvolvement?.trim() || input.expectedInvolvement.trim().length < 10) {
      errors.push("Expected contribution or involvement must be at least 10 characters.");
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // 6. Database persistence
    const inquiry = await prisma.inquiry.create({
      data: {
        inquiryType: InquiryType.VENTURE_PITCH,
        status: InquiryStatus.NEW,
        name: input.name.trim(),
        email: input.email.toLowerCase().trim(),
        contactChannel: input.contactChannel || ContactChannel.EMAIL,
        phoneOrHandle: input.phoneOrHandle?.trim() || null,
        ideaName: input.ideaName?.trim() || null,
        problemStatement: input.problemStatement.trim(),
        targetAudience: input.targetAudience.trim(),
        ventureStage: input.ventureStage,
        founderExpertise: input.founderExpertise.trim(),
        expectedInvolvement: input.expectedInvolvement.trim(),
        existingResources: input.existingResources?.trim() || null,
        locale: input.locale === "ar" ? "ar" : "en",
        sourceRoute: "/pitch-idea",
        consentGiven: true,
        consentVersion: "v1.0-2026",
        consentGivenAt: new Date(),
        ipAddress: clientIp || null,
      },
    });

    // 7. Audit log
    await recordAuditLog({
      action: "INQUIRY_CREATED",
      entityType: "Inquiry",
      entityId: inquiry.id,
      details: {
        inquiryType: inquiry.inquiryType,
        email: inquiry.email,
        ideaName: inquiry.ideaName,
        ventureStage: inquiry.ventureStage,
      },
    });

    return { success: true, inquiryId: inquiry.id };
  } catch (error: any) {
    console.error("submitVenturePitchInquiry error:", error);
    return { success: false, errors: ["An unexpected error occurred while saving your pitch. Please try again."] };
  }
}

/**
 * Public Intake: General Inquiries
 */
export async function submitGeneralInquiry(
  input: GeneralInquiryFormInput,
  clientIp?: string
): Promise<{ success: boolean; inquiryId?: string; errors?: string[] }> {
  try {
    const rateLimitKey = `inquiry:${clientIp || input.email.toLowerCase().trim()}`;
    const rateLimit = checkRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      return {
        success: false,
        errors: [`Too many submissions. Please wait ${rateLimit.retryAfterSeconds || 60} seconds before submitting again.`],
      };
    }

    const spamCheck = verifySpamSignals(input.honeypot, input.formLoadedAt);
    if (spamCheck.isSpam) {
      recordFailedAttempt(rateLimitKey);
      return { success: true };
    }

    const contactVal = validateContactFields(input);
    if (!contactVal.valid) {
      return { success: false, errors: contactVal.errors };
    }

    if (!input.consentGiven) {
      return { success: false, errors: ["Consent to the privacy notice is required."] };
    }

    if (!input.message?.trim() || input.message.trim().length < 10) {
      return { success: false, errors: ["Message must be at least 10 characters."] };
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        inquiryType: InquiryType.GENERAL,
        status: InquiryStatus.NEW,
        name: input.name.trim(),
        email: input.email.toLowerCase().trim(),
        company: input.company?.trim() || null,
        contactChannel: input.contactChannel || ContactChannel.EMAIL,
        phoneOrHandle: input.phoneOrHandle?.trim() || null,
        message: input.message.trim(),
        locale: input.locale === "ar" ? "ar" : "en",
        sourceRoute: "/contact",
        consentGiven: true,
        consentVersion: "v1.0-2026",
        consentGivenAt: new Date(),
        ipAddress: clientIp || null,
      },
    });

    await recordAuditLog({
      action: "INQUIRY_CREATED",
      entityType: "Inquiry",
      entityId: inquiry.id,
      details: {
        inquiryType: inquiry.inquiryType,
        email: inquiry.email,
      },
    });

    return { success: true, inquiryId: inquiry.id };
  } catch (error: any) {
    console.error("submitGeneralInquiry error:", error);
    return { success: false, errors: ["Failed to submit inquiry."] };
  }
}

/**
 * Administrative CRM: Retrieve filterable inquiries catalog.
 */
export async function getAdminInquiries(filters: InquiryFilterOptions = {}) {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(50, Math.max(1, filters.limit || 20));
  const skip = (page - 1) * limit;

  const where: Prisma.InquiryWhereInput = {};

  if (filters.type) {
    where.inquiryType = filters.type;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.assignedToId) {
    where.assignedToId = filters.assignedToId;
  }
  if (filters.search) {
    const q = filters.search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { company: { contains: q, mode: "insensitive" } },
      { ideaName: { contains: q, mode: "insensitive" } },
    ];
  }

  const [totalCount, items, countsByStatus, newCount] = await Promise.all([
    prisma.inquiry.count({ where }),
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.inquiry.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.inquiry.count({
      where: { status: InquiryStatus.NEW },
    }),
  ]);

  return {
    items,
    pagination: {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
    countsByStatus: countsByStatus.reduce((acc, curr) => {
      acc[curr.status] = curr._count.status;
      return acc;
    }, {} as Record<string, number>),
    newCount,
  };
}

/**
 * Administrative CRM: Retrieve single inquiry detail.
 * Automatically marks first view timestamp (`reviewedAt`).
 */
export async function getAdminInquiryDetail(id: string, session: CurrentUserSession) {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  if (!inquiry) return null;

  // Mark reviewed if currently unreviewed
  if (!inquiry.reviewedAt) {
    const updated = await prisma.inquiry.update({
      where: { id },
      data: {
        reviewedAt: new Date(),
        status: inquiry.status === InquiryStatus.NEW ? InquiryStatus.REVIEWING : inquiry.status,
      },
    });

    await recordAuditLog({
      userId: session.userId,
      action: "INQUIRY_REVIEWED",
      entityType: "Inquiry",
      entityId: id,
      details: { email: inquiry.email, initialStatus: inquiry.status },
    });

    return { ...inquiry, reviewedAt: updated.reviewedAt, status: updated.status };
  }

  return inquiry;
}

/**
 * Administrative CRM: Update inquiry status in pipeline.
 */
export async function updateInquiryStatus(
  id: string,
  newStatus: InquiryStatus,
  session: CurrentUserSession
): Promise<{ success: boolean; errors?: string[] }> {
  try {
    const existing = await prisma.inquiry.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, errors: ["Inquiry not found."] };
    }

    const isClosing = newStatus === InquiryStatus.CLOSED || newStatus === InquiryStatus.REJECTED;

    await prisma.inquiry.update({
      where: { id },
      data: {
        status: newStatus,
        closedAt: isClosing ? new Date() : existing.closedAt,
      },
    });

    await recordAuditLog({
      userId: session.userId,
      action: "INQUIRY_STATUS_CHANGED",
      entityType: "Inquiry",
      entityId: id,
      details: {
        previousStatus: existing.status,
        newStatus,
        updatedBy: session.email,
      },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, errors: [error.message || "Failed to update status."] };
  }
}

/**
 * Administrative CRM: Assign inquiry to a team member.
 */
export async function assignInquiry(
  id: string,
  assignedToId: string | null,
  session: CurrentUserSession
): Promise<{ success: boolean; errors?: string[] }> {
  try {
    const existing = await prisma.inquiry.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, errors: ["Inquiry not found."] };
    }

    // If assigning to a specific user, ensure user exists and is active
    if (assignedToId) {
      const targetUser = await prisma.adminUser.findUnique({ where: { id: assignedToId } });
      if (!targetUser || !targetUser.isActive) {
        return { success: false, errors: ["Target administrator not found or is inactive."] };
      }
    }

    await prisma.inquiry.update({
      where: { id },
      data: { assignedToId },
    });

    await recordAuditLog({
      userId: session.userId,
      action: "INQUIRY_ASSIGNMENT_CHANGED",
      entityType: "Inquiry",
      entityId: id,
      details: {
        previousAssignee: existing.assignedToId,
        newAssignee: assignedToId,
        updatedBy: session.email,
      },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, errors: [error.message || "Failed to assign inquiry."] };
  }
}

/**
 * Administrative CRM: Update private internal notes.
 */
export async function updateInquiryInternalNotes(
  id: string,
  internalNotes: string,
  followUpDate: Date | null,
  session: CurrentUserSession
): Promise<{ success: boolean; errors?: string[] }> {
  try {
    const existing = await prisma.inquiry.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, errors: ["Inquiry not found."] };
    }

    await prisma.inquiry.update({
      where: { id },
      data: {
        internalNotes: internalNotes.trim() || null,
        followUpDate: followUpDate || null,
      },
    });

    await recordAuditLog({
      userId: session.userId,
      action: "INQUIRY_NOTES_UPDATED",
      entityType: "Inquiry",
      entityId: id,
      details: { updatedBy: session.email },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, errors: [error.message || "Failed to update notes."] };
  }
}

/**
 * Administrative CRM: Archive or delete inquiry (SUPER_ADMIN only).
 */
export async function archiveOrDeleteInquiry(
  id: string,
  session: CurrentUserSession,
  permanentDelete: boolean = false
): Promise<{ success: boolean; errors?: string[] }> {
  if (session.role !== AdminRole.SUPER_ADMIN) {
    return { success: false, errors: ["FORBIDDEN: Only SUPER_ADMIN can archive or delete inquiries."] };
  }

  try {
    const existing = await prisma.inquiry.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, errors: ["Inquiry not found."] };
    }

    if (permanentDelete) {
      await prisma.inquiry.delete({ where: { id } });
      await recordAuditLog({
        userId: session.userId,
        action: "INQUIRY_DELETED",
        entityType: "Inquiry",
        entityId: id,
        details: { email: existing.email, deletedBy: session.email },
      });
    } else {
      await prisma.inquiry.update({
        where: { id },
        data: { status: InquiryStatus.CLOSED, closedAt: new Date() },
      });
      await recordAuditLog({
        userId: session.userId,
        action: "INQUIRY_ARCHIVED",
        entityType: "Inquiry",
        entityId: id,
        details: { email: existing.email, archivedBy: session.email },
      });
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, errors: [error.message || "Failed to process inquiry deletion."] };
  }
}

/**
 * Retrieves active admin users for assignment dropdown.
 */
export async function getActiveAdminUsers() {
  return prisma.adminUser.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });
}

