/**
 * Rate Limiting Configuration
 *
 * Protects endpoints from abuse and controls costs
 */

import { RateLimiter, type RunMutationCtx, type RunQueryCtx } from "@convex-dev/rate-limiter";

import { components } from "./_generated/api";

const rateLimiter = new RateLimiter(components.rateLimiter, {
  // AI Chat: 10 messages per minute per user
  aiChat: { kind: "fixed window", rate: 10, period: 60_000 }, // 1 minute

  // AI Suggestions: 20 per hour per user (more expensive)
  aiSuggestion: { kind: "fixed window", rate: 20, period: 3_600_000 }, // 1 hour

  // Semantic Search: 30 per minute per user
  semanticSearch: { kind: "token bucket", rate: 30, period: 60_000, capacity: 10 },

  // Issue Creation: Prevent spam
  createIssue: { kind: "token bucket", rate: 10, period: 60_000, capacity: 3 },

  // API Endpoints: General rate limit
  apiEndpoint: { kind: "fixed window", rate: 100, period: 60_000 }, // 100/min
});

export const rateLimit = <Name extends keyof typeof rateLimiter.limits>(
  ctx: RunMutationCtx,
  name: Name,
  options?: Parameters<typeof rateLimiter.limit<Name>>[2],
) => rateLimiter.limit(ctx, name, options);

export const checkRateLimit = <Name extends keyof typeof rateLimiter.limits>(
  ctx: RunQueryCtx,
  name: Name,
  options?: Parameters<typeof rateLimiter.check<Name>>[2],
) => rateLimiter.check(ctx, name, options);

export const resetRateLimit = <Name extends keyof typeof rateLimiter.limits>(
  ctx: RunMutationCtx,
  name: Name,
  args?: { key?: string },
) => rateLimiter.reset(ctx, name, args);
