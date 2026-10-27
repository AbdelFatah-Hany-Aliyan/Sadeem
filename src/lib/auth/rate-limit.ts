/**
 * SADEEM STUDIO — AUTHENTICATION RATE LIMITING ARCHITECTURE
 * 
 * Local Development & Single-Instance:
 * In-memory token/attempt bucket Map. Protects single-instance Node.js deployments
 * against rapid brute-force credential stuffing attacks (5 attempts / 15-minute lockout).
 * 
 * Production Multi-Instance Strategy:
 * In multi-region, serverless, or containerized environments (Kubernetes, AWS ECS, Vercel),
 * in-memory state is isolated per process. For production clustering, this module is designed
 * to be backed by a centralized Redis instance (e.g., Upstash Redis via `@upstash/ratelimit`
 * or AWS ElastiCache) using an atomic sliding window token algorithm.
 */

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
 * Checks if an identifier (IP address or email) is currently rate-limited.
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
 * Records a failed login attempt. If threshold is reached, blocks the key.
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
 * Resets the rate limit tracking upon successful authentication.
 */
export function resetRateLimit(key: string): void {
  attemptsMap.delete(key);
}
