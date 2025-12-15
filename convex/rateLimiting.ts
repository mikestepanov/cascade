/**
 * Rate Limiting Utilities
 *
 * Provides rate limiting for mutations and actions to prevent abuse
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { customMutation } from "convex-helpers/server/customFunctions";
import { mutation } from "./_generated/server";

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  /**
   * Maximum number of requests
   */
  maxRequests: number;

  /**
   * Time window in milliseconds
   */
  windowMs: number;

  /**
   * Identifier for rate limit bucket (user, ip, global)
   */
  keyPrefix: string;
}

/**
 * In-memory rate limit store (simple implementation)
 * In production, you might want to use a Convex table or external service
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Counter for periodic cleanup
 */
let checkCounter = 0;
const CLEANUP_INTERVAL = 100; // Clean up every 100 checks
const MAX_STORE_SIZE = 10000; // Force cleanup if store exceeds this size

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredBuckets(): void {
  const now = Date.now();
  for (const [key, bucket] of rateLimitStore.entries()) {
    if (now > bucket.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check if rate limit is exceeded
 */
function checkRateLimit(key: string, config: RateLimitConfig): boolean {
  const now = Date.now();

  // Periodic cleanup to prevent memory leak
  checkCounter++;
  if (checkCounter >= CLEANUP_INTERVAL || rateLimitStore.size > MAX_STORE_SIZE) {
    cleanupExpiredBuckets();
    checkCounter = 0;
  }

  const bucket = rateLimitStore.get(key);

  // No existing bucket or expired
  if (!bucket || now > bucket.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return true;
  }

  // Check if limit exceeded
  if (bucket.count >= config.maxRequests) {
    return false;
  }

  // Increment count
  bucket.count++;
  return true;
}

/**
 * Rate limited mutation - limits requests per user
 */
export function rateLimitedMutation(config: RateLimitConfig) {
  return customMutation(mutation, {
    args: {},
    input: async (ctx, _args) => {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new Error("Authentication required");
      }

      // Check rate limit
      const rateLimitKey = `${config.keyPrefix}:${userId}`;
      const allowed = checkRateLimit(rateLimitKey, config);

      if (!allowed) {
        throw new Error(
          `Rate limit exceeded. Maximum ${config.maxRequests} requests per ${config.windowMs / 1000} seconds.`,
        );
      }

      return {
        ctx: { ...ctx, userId },
        args: {},
      };
    },
  });
}

/**
 * Pre-configured rate limiters for common use cases
 */

/**
 * Strict rate limit: 10 requests per minute
 * Use for: Creating issues, sending invites, heavy mutations
 */
export const strictRateLimitedMutation = rateLimitedMutation({
  keyPrefix: "strict",
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
});

/**
 * Moderate rate limit: 30 requests per minute
 * Use for: Updating issues, comments, most mutations
 */
export const moderateRateLimitedMutation = rateLimitedMutation({
  keyPrefix: "moderate",
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
});

/**
 * Lenient rate limit: 100 requests per minute
 * Use for: Reads, lightweight updates
 */
export const lenientRateLimitedMutation = rateLimitedMutation({
  keyPrefix: "lenient",
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
});

/**
 * API rate limit: 60 requests per minute (1 per second average)
 * Use for: Public API endpoints
 */
export const apiRateLimitedMutation = rateLimitedMutation({
  keyPrefix: "api",
  maxRequests: 60,
  windowMs: 60 * 1000, // 1 minute
});
