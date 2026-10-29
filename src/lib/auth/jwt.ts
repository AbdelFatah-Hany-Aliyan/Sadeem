import { SignJWT, jwtVerify } from "jose";
import { AdminRole } from "@prisma/client";
import { randomUUID } from "crypto";

const DEFAULT_DEV_SECRET = "sadeem_dev_secret_studio_auth_key_2026_min_32_bytes";

function getJwtKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET;
  
  if (process.env.NODE_ENV === "production") {
    if (!secret) {
      throw new Error(
        "CRITICAL SECURITY CONFIGURATION ERROR: AUTH_SECRET or JWT_SECRET must be configured in production environment variables."
      );
    }
    if (secret.length < 32) {
      throw new Error(
        "CRITICAL SECURITY CONFIGURATION ERROR: AUTH_SECRET must be at least 32 characters long in production."
      );
    }
    return new TextEncoder().encode(secret);
  }

  // Development & testing fallback
  return new TextEncoder().encode(secret || DEFAULT_DEV_SECRET);
}

export interface AdminSessionPayload {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  tokenVersion: number;
  jti: string;
  [key: string]: unknown;
}

const SESSION_DURATION_SECONDS = 60 * 60 * 24; // 24 hours

/**
 * Creates and signs a secure JWT session token with unique JTI and tokenVersion.
 */
export async function signSessionToken(payload: {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  tokenVersion?: number;
  jti?: string;
}): Promise<string> {
  const jti = payload.jti || randomUUID();
  const tokenVersion = payload.tokenVersion ?? 1;

  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    tokenVersion,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getJwtKey());
}

/**
 * Verifies and decodes a JWT session token.
 * Returns null if the token is invalid, tampered with, or expired.
 */
export async function verifySessionToken(token: string): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtKey(), {
      algorithms: ["HS256"],
    });

    if (!payload.userId || !payload.email || !payload.role || !payload.jti) {
      return null;
    }

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: (payload.name as string) || "Administrator",
      role: payload.role as AdminRole,
      tokenVersion: typeof payload.tokenVersion === "number" ? payload.tokenVersion : 1,
      jti: payload.jti as string,
    };
  } catch {
    return null;
  }
}
