import { cookies } from "next/headers";
import { AdminRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { verifySessionToken, AdminSessionPayload } from "./jwt";

export const SESSION_COOKIE_NAME = "sadeem_admin_session";

export interface CurrentUserSession extends AdminSessionPayload {
  isActive: boolean;
}

/**
 * Retrieves and validates the current administrator session from HttpOnly cookies.
 * Security enforcement:
 * 1. Cryptographic JWT signature and expiration verification.
 * 2. Instant token revocation check (RevokedToken table).
 * 3. Database user existence & active status verification (isActive === true).
 * 4. Token version alignment (tokenVersion check for password changes/global session resets).
 */
export async function getSession(): Promise<CurrentUserSession | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }

    const payload = await verifySessionToken(sessionCookie.value);
    if (!payload || !payload.userId || !payload.jti) {
      return null;
    }

    // Check token revocation blacklist
    const isRevoked = await prisma.revokedToken.findUnique({
      where: { jti: payload.jti },
      select: { id: true },
    });

    if (isRevoked) {
      return null;
    }

    // Verify active status and token version in database
    const user = await prisma.adminUser.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, role: true, isActive: true, tokenVersion: true },
    });

    if (!user || !user.isActive) {
      return null;
    }

    // If token version doesn't match, session was invalidated by password change or admin reset
    if (user.tokenVersion !== payload.tokenVersion) {
      return null;
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
    console.error("Session verification error:", error);
    return null;
  }
}

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
