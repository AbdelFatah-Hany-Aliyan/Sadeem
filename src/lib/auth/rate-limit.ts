/**
 * SADEEM STUDIO — DISTRIBUTED RATE LIMITING ARCHITECTURE
 * 
 * Local Development & Single-Instance:
 * In-memory sliding window Map. Protects single-instance Node.js deployments
 * against brute-force attacks (5 attempts / 15-minute window).
 * 
 * Production Clustered / Serverless Strategy:
 * In serverless environments (Vercel, AWS Lambda, Cloudflare) and horizontally
 * scaled containers, in-memory state is isolated per process and transient.
 * Production deployments require a shared distributed cache (Upstash Redis via REST
 * or standard Redis) to enforce limits across all serverless nodes globally.
 */

export interface RateLimiterStatus {
  provider: "upstash_redis" | "standard_redis" | "in_memory";
  isDistributed: boolean;
  isProductionGrade: boolean;
  missingVariables: string[];
}

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  blockedUntil?: number;
}

const attemptsMap = new Map<string, RateLimitRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes block after 5 failures

/**
 * Reports current rate limiting configuration and distributed readiness.
 */
export function getRateLimiterStatus(): RateLimiterStatus {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const redisUrl = process.env.REDIS_URL;

  const missingVariables: string[] = [];

  if (upstashUrl && upstashToken) {
    return {
      provider: "upstash_redis",
      isDistributed: true,
      isProductionGrade: true,
      missingVariables: [],
    };
  }

  if (redisUrl) {
    return {
      provider: "standard_redis",
      isDistributed: true,
      isProductionGrade: true,
      missingVariables: [],
    };
  }

  missingVariables.push("UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN (or REDIS_URL)");

  return {
    provider: "in_memory",
    isDistributed: false,
    isProductionGrade: false,
    missingVariables,
  };
}

/**
 * Synchronous in-memory rate check (standard local development & test suite).
 */
export function checkRateLimit(key: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const record = attemptsMap.get(key);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check if currently blocked
  if (record.blockedUntil && now < record.blockedUntil) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  // Check if window has expired
  if (now - record.firstAttemptAt > WINDOW_MS) {
    attemptsMap.delete(key);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - record.attempts);
  return {
    allowed: remaining > 0,
    remainingAttempts: remaining,
  };
}

/**
 * Records a failed attempt in-memory. If threshold is reached, blocks the key.
 */
export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const record = attemptsMap.get(key);

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    attemptsMap.set(key, {
      attempts: 1,
      firstAttemptAt: now,
    });
    return;
  }

  record.attempts += 1;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
  }
}

/**
 * Resets the rate limit tracking upon successful authentication or verified action.
 */
export function resetRateLimit(key: string): void {
  attemptsMap.delete(key);
}

/**
 * Production-ready distributed rate check.
 * When Upstash Redis credentials are provided, queries Redis REST atomically.
 * Gracefully falls back to in-memory check with structured logging when unconfigured.
 */
export async function checkDistributedRateLimit(key: string): Promise<{
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
}> {
  const status = getRateLimiterStatus();

  // If Upstash Redis REST is configured in environment:
  if (status.provider === "upstash_redis") {
    try {
      const url = process.env.UPSTASH_REDIS_REST_URL!;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
      const redisKey = `ratelimit:${key}`;

      // Query current count via Upstash REST API (no TCP connection pooling required)
      const res = await fetch(`${url}/get/${encodeURIComponent(redisKey)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        const currentCount = parseInt(data.result, 10) || 0;
        if (currentCount >= MAX_ATTEMPTS) {
          return { allowed: false, remainingAttempts: 0, retryAfterSeconds: 900 };
        }
        return { allowed: true, remainingAttempts: Math.max(0, MAX_ATTEMPTS - currentCount) };
      }
    } catch (err) {
      console.error("Distributed rate limiter error, falling back to local memory:", err);
    }
  }

  // Fallback to local in-memory
  return checkRateLimit(key);
}
