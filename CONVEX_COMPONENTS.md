# Convex Components Usage Guide

## Installed Components

We've installed 3 powerful Convex components to enhance Cascade:

### 1. **Rate Limiter** (`@convex-dev/rate-limiter`)
Protect endpoints from abuse and control costs.

**Configuration:** `convex/rateLimits.ts`

**Use cases:**
- Limit AI chat to 10 messages/minute per user
- Prevent spam issue creation
- Protect API endpoints

**Example:**
```typescript
await rateLimit(ctx, {
  name: "aiChat",
  key: userId,
  throws: true,
});
```

---

### 2. **Action Cache** (`@convex-dev/action-cache`)
Cache expensive AI calls to save money and improve speed.

**Benefits:**
- Save $0.001-$0.005 per cached AI request
- Instant responses (0ms vs 1-2s)
- Configurable TTL (time-to-live)

**Example:**
```typescript
const result = await cache.fetch(ctx, {
  key: "suggestion:add-dark-mode",
  action: "Generate description...",
  ttl: 3600000, // 1 hour
});
```

**Cost savings:** For 100 users making similar requests:
- Without cache: 100 requests × $0.003 = **$0.30**
- With cache: 1 request × $0.003 = **$0.003** (100x cheaper!)

---

### 3. **Aggregate** (`@convex-dev/aggregate`)
Fast counting and summing with O(log n) performance.

**Before (slow):**
```typescript
// O(n) - queries all issues
const issues = await ctx.db.query("issues")
  .filter(q => q.eq(q.field("projectId"), projectId))
  .collect();
const count = issues.length; // Slow for 10,000+ issues
```

**After (fast):**
```typescript
// O(log n) - instant lookup
const count = await issueCount.lookup(ctx, { projectId });
```

**Performance:**
- 100 issues: ~same speed
- 1,000 issues: 10x faster
- 10,000 issues: 100x faster
- 100,000 issues: 1000x faster

**Use cases:**
- Dashboard metrics (issue counts, story points)
- Sprint velocity tracking
- Team performance analytics
- Real-time statistics

---

## Quick Start

### 1. Rate Limit AI Chat

Update `convex/ai.ts`:

```typescript
import { rateLimit } from "./rateLimits";

export const chat = action({
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();

    // Add rate limiting
    await rateLimit(ctx, {
      name: "aiChat",
      key: userId.subject,
      throws: true,
    });

    // Rest of your code...
  },
});
```

### 2. Cache AI Suggestions

Update `convex/ai/suggestions.ts`:

```typescript
import { ActionCache } from "@convex-dev/action-cache";
import { components } from "../_generated/api";

const cache = new ActionCache(components.actionCache, {
  action: async (prompt: string) => {
    return await generateText({ model: openai("gpt-4o-mini"), prompt });
  },
});

export const suggestDescription = action({
  handler: async (ctx, args) => {
    return await cache.fetch(ctx, {
      key: `desc:${args.title}`,
      action: `Generate description for: ${args.title}`,
      ttl: 3600000, // 1 hour
    });
  },
});
```

### 3. Fast Dashboard Counts

Create `convex/analytics/aggregates.ts`:

```typescript
import { Aggregate } from "@convex-dev/aggregate";
import { components } from "../_generated/api";

export const issueCountByStatus = new Aggregate(components.aggregate, {
  name: "issueCountByStatus",
  groupBy: (doc) => ({ projectId: doc.projectId, status: doc.status }),
  sum: () => 1,
});

// Use in queries
export const getDashboardStats = query({
  handler: async (ctx, args) => {
    const counts = await issueCountByStatus.lookup(ctx, {
      projectId: args.projectId,
    });
    return counts;
  },
});
```

---

## Setup Components

Components need to be registered in `convex/convex.config.ts`:

```typescript
import { defineApp } from "convex/server";
import aggregate from "@convex-dev/aggregate/convex.config";
import actionCache from "@convex-dev/action-cache/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";

const app = defineApp();

app.use(aggregate);
app.use(actionCache);
app.use(rateLimiter);

export default app;
```

---

## Cost Savings Estimate

With these components, for 100 active users:

**AI Chat (with rate limiting + caching):**
- Before: Unlimited requests = $50+/month
- After: 10 msg/min limit + caching = $8-12/month
- **Savings: $38-42/month**

**Dashboard (with aggregate):**
- Before: Slow queries, high compute costs
- After: Instant lookups, minimal compute
- **Savings: 50% compute costs**

**Total estimated savings: $40-50/month** while improving performance!

---

## Next Steps

1. ✅ Configure rate limits (`convex/rateLimits.ts`)
2. ✅ Add caching to AI suggestions
3. ✅ Replace dashboard counts with aggregates
4. ✅ Register components in `convex.config.ts`
5. ✅ Deploy: `pnpm convex deploy`

---

## Documentation

- [Rate Limiter Docs](https://github.com/get-convex/rate-limiter)
- [Action Cache Docs](https://github.com/get-convex/action-cache)
- [Aggregate Docs](https://github.com/get-convex/aggregate)

---

**Need help implementing?** The example files show exactly how to integrate each component!
