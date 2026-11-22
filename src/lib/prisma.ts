import { PrismaClient } from "@prisma/client";

// Prevent multiple instances of Prisma Client in development (Next.js hot reloading)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Sanitizes DATABASE_URL for Prisma compatibility.
 * Removes 'channel_binding=require' which is unsupported by Prisma's Rust engine driver.
 * Configures connection pool limits suitable for Neon serverless pooler.
 */
function getSanitizedDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  let sanitized = url;
  if (sanitized.includes("channel_binding=require")) {
    sanitized = sanitized
      .replace("channel_binding=require&", "")
      .replace("&channel_binding=require", "")
      .replace("?channel_binding=require", "?")
      .replace(/\?$/, "");
  }
  // Enforce connection limit of 10 to handle concurrent App Router queries
  if (!sanitized.includes("connection_limit=")) {
    const separator = sanitized.includes("?") ? "&" : "?";
    sanitized = `${sanitized}${separator}connection_limit=10`;
  }
  // Enforce pool timeout of 30 seconds to gracefully handle WAN latency and cold starts
  if (!sanitized.includes("pool_timeout=")) {
    const separator = sanitized.includes("?") ? "&" : "?";
    sanitized = `${sanitized}${separator}pool_timeout=30`;
  }
  return sanitized;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: process.env.DATABASE_URL
      ? {
          db: {
            url: getSanitizedDatabaseUrl(),
          },
        }
      : undefined,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

// Always store singleton in globalThis to avoid duplicate connection pools across chunks/workers
globalForPrisma.prisma = prisma;

export default prisma;
