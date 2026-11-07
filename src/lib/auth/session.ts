import * as React from "react";
import { cookies } from "next/headers";
import { AdminRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { verifySessionToken, AdminSessionPayload } from "./jwt";

export const SESSION_COOKIE_NAME = "sadeem_admin_session";

export interface CurrentUserSession extends AdminSessionPayload {
  isActive: boolean;
}

/**
 * Distinct typed infrastructure error representing a database or network outage during session verification.
 * Distinguishes infrastructure failures (P2024, P1001, ConnectionReset) from unauthenticated/invalid sessions.
 */
export class AuthInfrastructureError extends Error {
  readonly isInfrastructureError = true;
  readonly code: string;

  constructor(message: string, code: string = "AUTH_DEPENDENCY_UNAVAILABLE") {
    super(message);
    this.name = "AuthInfrastructureError";
    this.code = code;
    Object.setPrototypeOf(this, AuthInfrastructureError.prototype);
  }
}

/**
 * Detects whether an error thrown during session verification is an infrastructure failure.
 */
export function isDatabaseInfrastructureError(err: unknown): { isInfra: boolean; code: string } {
  if (!err || typeof err !== "object") return { isInfra: false, code: "" };
  const e = err as any;
  const code = (typeof e.code === "string" ? e.code : "") || (typeof e.errorCode === "string" ? e.errorCode : "");
  const name = typeof e.name === "string" ? e.name : "";
  const msg = typeof e.message === "string" ? e.message : "";

  if (code === "P2024" || code === "P1001" || code === "P1000" || code === "P2010" || code === "P2021") {
    return { isInfra: true, code };
  }
  if (
    name === "PrismaClientInitializationError" ||
    name === "PrismaClientRustPanicError" ||
    name === "PrismaClientUnknownRequestError"
  ) {
    return { isInfra: true, code: code || name };
  }
  if (
    msg.includes("P2024") ||
    msg.includes("P1001") ||
    msg.includes("10054") ||
    msg.includes("ConnectionReset") ||
    msg.includes("Timed out fetching a new connection") ||
    msg.includes("Can't reach database server") ||
    msg.includes("Server closed connection") ||
    msg.includes("Closed")
  ) {
    return { isInfra: true, code: code || "DATABASE_CONNECTION_ERROR" };
  }

  return { isInfra: false, code: "" };
}

// Request-scoped memoization helper:
// In Next.js React Server Components, React.cache provides request-scoped deduplication.
// In non-RSC environments (standalone scripts, tests, actions), falls back to direct execution.
const requestCache = typeof (React as any).cache === "function"
  ? (React as any).cache
  : <T extends (...args: any[]) => any>(fn: T): T => fn;

/**
 * Retrieves and validates the current administrator session from HttpOnly cookies.
 * Wrapped in requestCache (React.cache) to deduplicate repeated calls within the same Server Component render tree
 * (e.g. AdminLayout + child Admin Page) without making redundant WAN database round trips.
 *
 * Security & Reliability Enforcement:
 * 1. Cryptographic JWT signature and expiration verification (pure in-memory).
 * 2. Instant token revocation check (RevokedToken table).
 * 3. Database user existence & active status verification (isActive === true).
 * 4. Token version alignment (tokenVersion check for password changes/global session resets).
 * 5. Distinct infrastructure error propagation: Prisma P2024/P1001/ConnectionReset throws AuthInfrastructureError
 *    instead of falsely classifying the user as logged out.
 * 6. Staging-only diagnostic timing instrumentation (performance.now()).
 */
export const getSession = requestCache(async function getSession(): Promise<CurrentUserSession | null> {
  const tTotalStart = performance.now();
  let tJwtDuration = 0;
  let tRevokeDuration = 0;
  let tUserDuration = 0;

  const isTimingEnabled =
    process.env.NEON_BRANCH === "staging" ||
    process.env.AUTH_TIMING === "true" ||
    process.env.NODE_ENV !== "production";

  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }

    const tJwtStart = performance.now();
    const payload = await verifySessionToken(sessionCookie.value);
    tJwtDuration = Math.round((performance.now() - tJwtStart) * 100) / 100;

    if (!payload || !payload.userId || !payload.jti) {
      if (isTimingEnabled) {
        console.log(`[AUTH_TIMING] op=jwt_verify duration=${tJwtDuration}ms status=rejected`);
      }
      return null;
    }

    if (isTimingEnabled) {
      console.log(`[AUTH_TIMING] op=jwt_verify duration=${tJwtDuration}ms status=ok`);
    }

    // Consolidated Session & Revocation Database Lookup (pipelined)
    const tLookupStart = performance.now();
    let tLookupDuration = 0;
    let user: {
      id: string;
      email: string;
      name: string;
      role: AdminRole;
      isActive: boolean;
      tokenVersion: number;
      revokedTokens: { id: string }[];
    } | null = null;

    try {
      user = await prisma.adminUser.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          tokenVersion: true,
          revokedTokens: {
            where: { jti: payload.jti },
            select: { id: true },
          },
        },
      });
      tLookupDuration = Math.round((performance.now() - tLookupStart) * 100) / 100;
      if (isTimingEnabled) {
        console.log(`[AUTH_TIMING] op=session_db_lookup duration=${tLookupDuration}ms status=ok`);
      }
    } catch (err: any) {
      tLookupDuration = Math.round((performance.now() - tLookupStart) * 100) / 100;
      const infraCheck = isDatabaseInfrastructureError(err);
      if (isTimingEnabled) {
        console.warn(`[AUTH_TIMING] op=session_db_lookup duration=${tLookupDuration}ms status=error code=${infraCheck.code || "UNKNOWN"}`);
      }
      if (infraCheck.isInfra) {
        throw new AuthInfrastructureError(
          `Authentication dependency failed during session lookup: [${infraCheck.code}].`,
          infraCheck.code
        );
      }
      throw err;
    }

    if (!user) {
      if (isTimingEnabled) {
        console.log(`[AUTH_TIMING] op=admin_lookup status=user_not_found`);
      }
      return null;
    }

    // Check token revocation blacklist
    if (user.revokedTokens && user.revokedTokens.length > 0) {
      if (isTimingEnabled) {
        console.log(`[AUTH_TIMING] op=revocation_lookup status=token_revoked`);
      }
      return null;
    }

    if (!user.isActive) {
      if (isTimingEnabled) {
        console.log(`[AUTH_TIMING] op=admin_lookup status=user_inactive`);
      }
      return null;
    }

    // If token version doesn't match, session was invalidated by password change or admin reset
    if (user.tokenVersion !== payload.tokenVersion) {
      if (isTimingEnabled) {
        console.log(`[AUTH_TIMING] op=admin_lookup status=token_version_mismatch`);
      }
      return null;
    }

    const tTotalDuration = Math.round((performance.now() - tTotalStart) * 100) / 100;
    if (isTimingEnabled) {
      console.log(`[AUTH_TIMING] op=getSession total=${tTotalDuration}ms status=authenticated`);
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tokenVersion: user.tokenVersion,
      jti: payload.jti,
      isActive: user.isActive,
    };
  } catch (error) {
    if (error instanceof AuthInfrastructureError || (error as any)?.isInfrastructureError) {
      const tTotalDuration = Math.round((performance.now() - tTotalStart) * 100) / 100;
      if (isTimingEnabled) {
        console.warn(`[AUTH_TIMING] op=getSession total=${tTotalDuration}ms status=error code=${(error as any).code}`);
      }
      throw error;
    }
    console.error("Session verification error:", error);
    return null;
  }
});

/**
 * Sets the secure session cookie with production-conscious flags.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * Revokes the current session token in database and deletes the cookie upon logout.
 */
export async function revokeCurrentSession(): Promise<void> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (sessionCookie?.value) {
      const payload = await verifySessionToken(sessionCookie.value);
      if (payload?.jti) {
        await prisma.revokedToken.upsert({
          where: { jti: payload.jti },
          update: {},
          create: {
            jti: payload.jti,
            userId: payload.userId,
            reason: "LOGOUT",
            expiresAt: new Date(Date.now() + 60 * 60 * 24 * 1000),
          },
        });
      }
    }
  } catch (error) {
    console.error("Error revoking session:", error);
  } finally {
    const cookieStore = cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}

/**
 * Invalidates all active sessions for a user (e.g. after password change or admin revocation).
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await prisma.adminUser.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
}

/**
 * Clears the session cookie upon logout (legacy fallback).
 */
export async function clearSessionCookie(): Promise<void> {
  await revokeCurrentSession();
}

/**
 * Server-side guard: Ensures the user is authenticated.
 * Throws an Error if unauthenticated.
 */
export async function requireAuth(): Promise<CurrentUserSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED: Active administrator session required.");
  }
  return session;
}

/**
 * Server-side guard: Enforces role permissions.
 * Throws an Error if the user's role is not within the allowed set.
 */
export async function requireRole(allowedRoles: AdminRole[]): Promise<CurrentUserSession> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new Error(`FORBIDDEN: Operation requires one of [${allowedRoles.join(", ")}]. Your role is ${session.role}.`);
  }
  return session;
}

/**
 * Checks if a given role can publish or unpublish projects.
 * Only SUPER_ADMIN is permitted to publish/unpublish.
 */
export function canPublish(role: AdminRole): boolean {
  return role === AdminRole.SUPER_ADMIN;
}

/**
 * Checks if a given role can archive projects.
 * Only SUPER_ADMIN is permitted to archive.
 */
export function canArchive(role: AdminRole): boolean {
  return role === AdminRole.SUPER_ADMIN;
}

/**
 * Checks if a given role can edit project content.
 * Both SUPER_ADMIN and EDITOR can edit.
 */
export function canEdit(role: AdminRole): boolean {
  return role === AdminRole.SUPER_ADMIN || role === AdminRole.EDITOR;
}
