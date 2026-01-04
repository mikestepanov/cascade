/**
 * Rate Limiter Configuration
 *
 * Uses @convex-dev/rate-limiter component for efficient token bucket rate limiting.
 * This replaces the previous O(N) approach with O(1) operations.
 *
 * The rate limiter component is already configured in convex.config.ts
 */

import { MINUTE } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Check rate limit for an API key using the rate limiter component
 * Returns whether the request is allowed or rate limited with retry time
 */
export async function checkApiKeyRateLimit(
  ctx: MutationCtx | QueryCtx,
  keyId: string,
  limit: number,
): Promise<{ ok: true } | { ok: false; retryAfter: number }> {
  // Use the rate limiter component's checkRateLimit internal query
  const result = await ctx.runQuery(components.rateLimiter.lib.checkRateLimit, {
    name: `api-key-${keyId}`,
    config: {
      kind: "token bucket",
      rate: limit,
      period: MINUTE,
      capacity: limit,
    },
  });

  return result;
}
