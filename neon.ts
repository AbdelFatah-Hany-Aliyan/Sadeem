import { defineConfig } from "@neon/config/v1";

/**
 * Sadeem Studio — Neon Infrastructure-as-Code Configuration
 * 
 * Declares backend cloud primitives for the Sadeem staging branch.
 * Scope:
 * - PostgreSQL is provided as the Lakebase database foundation.
 * - Object Storage bucket ('sadeem-media-staging') is private by default.
 * - Strictly excludes Neon Auth / Managed Better Auth (Sadeem uses custom JWT/Prisma auth).
 * - Strictly excludes Data API, Functions, AI Gateway, and Realtime.
 */
export default defineConfig({
  buckets: {
    "sadeem-media-staging": {
      access: "private",
    },
  },
});
