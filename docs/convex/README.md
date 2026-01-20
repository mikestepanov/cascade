# Convex Backend Documentation

> Best practices, patterns, and guides for working with Convex in Nixelo.

## Documents

| Document | Description |
|----------|-------------|
| [Best Practices](./BEST_PRACTICES.md) | Query optimization, error handling, patterns |
| [Components](./COMPONENTS.md) | Rate limiter, cache, aggregates |
| [Errors](./ERRORS.md) | Error handling patterns, ConvexError usage |
| [Performance](./PERFORMANCE.md) | Query limits, indexing, optimization |
| [Pagination](./PAGINATION.md) | Cursor-based pagination patterns |

## Quick Reference

### Error Handling
```typescript
import { ConvexError } from "convex/values";
import { forbidden, notFound, validation } from "./lib/errors";

// Use semantic error helpers
throw forbidden("Not authorized to access this resource");
throw notFound("Issue not found");
throw validation("Title is required");
```

### Query Limits
```typescript
import { QUERY_LIMITS } from "./lib/queryLimits";

// Always limit queries
const results = await ctx.db
  .query("issues")
  .withIndex("by_project", q => q.eq("projectId", projectId))
  .take(QUERY_LIMITS.DEFAULT); // 100
```

### Pagination
```typescript
const { page, continueCursor } = await ctx.db
  .query("issues")
  .withIndex("by_project", q => q.eq("projectId", projectId))
  .paginate(paginationOpts);
```

## Related

- [Convex Official Docs](https://docs.convex.dev)
- [Backend README](../../convex/README.md)
