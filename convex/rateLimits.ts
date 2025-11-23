/**
 * Rate Limiting Configuration
 *
 * Protects endpoints from abuse and controls costs
 */

import { defineRateLimits } from "@convex-dev/rate-limiter";

export const { checkRateLimit, rateLimit, resetRateLimit } = defineRateLimits({
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
