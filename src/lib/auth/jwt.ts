import { SignJWT, jwtVerify } from "jose";
import { AdminRole } from "@prisma/client";

const DEFAULT_SECRET = "sadeem_super_secret_studio_auth_key_2026_min_32_bytes";
const JWT_SECRET = process.env.AUTH_SECRET || process.env.JWT_SECRET || DEFAULT_SECRET;
const key = new TextEncoder().encode(JWT_SECRET);

export interface AdminSessionPayload {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  [key: string]: unknown;
}

const SESSION_DURATION_SECONDS = 60 * 60 * 24; // 24 hours

/**
 * Creates and signs a secure JWT session token.
 */
export async function signSessionToken(payload: AdminSessionPayload): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(key);
}

/**
 * Verifies and decodes a JWT session token.
 * Returns null if the token is invalid, tampered with, or expired.
 */
export async function verifySessionToken(token: string): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });

    if (!payload.userId || !payload.email || !payload.role) {
      return null;
    }

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: (payload.name as string) || "Administrator",
      role: payload.role as AdminRole,
    };
  } catch {
    return null;
  }
}
