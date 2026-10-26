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
 * Cross-references with database to verify the user account has not been deactivated.
 */
export async function getSession(): Promise<CurrentUserSession | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }

    const payload = await verifySessionToken(sessionCookie.value);
    if (!payload || !payload.userId) {
      return null;
    }

    // Verify active status in database
    const user = await prisma.adminUser.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
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
 * Clears the session cookie upon logout.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
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
