import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface CreateAuditLogParams {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

/**
 * Persists an audit log entry.
 * Sanitizes details to ensure credentials, tokens, and secrets are NEVER logged.
 */
export async function recordAuditLog({
  userId,
  action,
  entityType,
  entityId,
  details,
}: CreateAuditLogParams): Promise<void> {
  try {
    const sanitizedDetails: Record<string, unknown> = {};

    if (details) {
      for (const [key, value] of Object.entries(details)) {
        // Strip sensitive credentials and tokens while preserving domain keys like sectionKey
        if (/password|hash|token|secret|cookie|auth|credential|apikey|api_key|privatekey|private_key|secretkey|secret_key/i.test(key)) {
          sanitizedDetails[key] = "[REDACTED]";
        } else {
          sanitizedDetails[key] = value;
        }
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId: entityId || null,
        details: Object.keys(sanitizedDetails).length > 0 ? (sanitizedDetails as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (error) {
    // Non-blocking error handling: logging failures should not crash user operations
    console.error("Failed to persist audit log:", error);
  }
}
