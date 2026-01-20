# Pagination Patterns Guide

This document outlines the pagination patterns used in the codebase. Follow these patterns for consistent, performant data loading.

---

## Overview

We use two pagination strategies:

| Strategy | Use Case | Example |
|----------|----------|---------|
| **Smart Loading** | Kanban boards, dashboards | Load all active items, limit completed items |
| **Cursor-Based** | Lists, backlogs, search results | Traditional page-by-page loading |

---

## Pattern 1: Smart Loading (Kanban Boards)

**Use when:** Displaying items in columns where some columns should show everything and others should show recent items only.

### Concept

```
┌─────────────┬─────────────┬─────────────┐
│    TODO     │ IN PROGRESS │    DONE     │
├─────────────┼─────────────┼─────────────┤
│  Load ALL   │  Load ALL   │ Load 14 days│
│             │             │ + "Load 50  │
│             │             │   more"     │
└─────────────┴─────────────┴─────────────┘
```

### Backend Query

```typescript
// convex/issues.ts
import { getDoneColumnThreshold, DONE_COLUMN_DAYS } from "./lib/pagination";
import { enrichIssues, groupIssuesByStatus } from "./lib/issueHelpers";

export const listByWorkspaceSmart = query({
  args: {
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
    doneColumnDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // 1. Get workflow states to know which statuses are "done"
    const project = await ctx.db.get(args.projectId);
    const workflowStates = project.workflowStates || [];

    // 2. Build status -> category map
    const statusToCategory: Record<string, string> = {};
    for (const state of workflowStates) {
      statusToCategory[state.id] = state.category;
    }

    // 3. Calculate threshold (14 days ago by default)
    const doneThreshold = getDoneColumnThreshold(args.doneColumnDays ?? DONE_COLUMN_DAYS);

    // 4. Fetch all issues
    const allIssues = await ctx.db
      .query("issues")
      .withIndex("by_workspace", (q) => q.eq("projectId", args.projectId))
      .collect();

    // 5. Apply smart filtering
    const smartFiltered = allIssues.filter((issue) => {
      const category = statusToCategory[issue.status] || "todo";
      if (category === "done") {
        return issue.updatedAt >= doneThreshold;  // Only recent done items
      }
      return true;  // All todo/inprogress items
    });

    // 6. Count hidden done items for "Load X more" button
    const hiddenDoneCount = allIssues.filter((issue) => {
      const category = statusToCategory[issue.status] || "todo";
      return category === "done" && issue.updatedAt < doneThreshold;
    }).length;

    // 7. Batch enrich (NOT N+1!)
    const enriched = await enrichIssues(ctx, smartFiltered);

    // 8. Group by status for easy column rendering
    return {
      issuesByStatus: groupIssuesByStatus(enriched),
      hiddenDoneCount,
      totalCount: allIssues.length,
    };
  },
});
```

### Frontend Hook

```typescript
// src/hooks/useSmartBoardData.ts
export function useSmartBoardData({ projectId, sprintId }) {
  const smartData = useQuery(api.issues.listByWorkspaceSmart, {
    projectId,
    sprintId,
  });

  const loadMoreDone = useCallback(() => {
    // Trigger loading more done items
    setLoadMoreCursor(findOldestIssue());
  }, []);

  return {
    issuesByStatus: smartData?.issuesByStatus ?? {},
    hiddenDoneCount: smartData?.hiddenDoneCount ?? 0,
    loadMoreDone,
    isLoading: smartData === undefined,
  };
}
```

---

## Pattern 2: Cursor-Based Pagination

**Use when:** Loading large lists where users scroll/page through data.

### Cursor Format

We use base64-encoded `timestamp:id` cursors for stable pagination:

```typescript
// Encoding
const cursor = btoa(`${item.updatedAt}:${item._id}`);
// Result: "MTcwMjU0MDAwMDAwMDp4eHh4eHh4"

// Decoding
const decoded = atob(cursor);
const [timestamp, id] = decoded.split(":");
```

**Why timestamp + id?**
- Timestamp alone can have collisions (multiple items at same time)
- ID alone doesn't provide natural ordering
- Combined gives stable, deterministic pagination

### Backend Query

```typescript
// convex/issues.ts
import { decodeCursor, encodeCursor, DEFAULT_PAGE_SIZE } from "./lib/pagination";

export const listByWorkspacePaginated = query({
  args: {
    projectId: v.id("projects"),
    cursor: v.optional(v.string()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const pageSize = args.pageSize ?? DEFAULT_PAGE_SIZE;

    // 1. Query with index (REQUIRED for performance)
    let issues = await ctx.db
      .query("issues")
      .withIndex("by_workspace_updated", (q) =>
        q.eq("projectId", args.projectId)
      )
      .order("desc")
      .collect();

    // 2. Apply cursor with ID tiebreaking
    if (args.cursor) {
      try {
        const { timestamp, id } = decodeCursor(args.cursor);
        issues = issues.filter((i) =>
          i.updatedAt < timestamp ||
          (i.updatedAt === timestamp && i._id.toString() < id)
        );
      } catch {
        // Invalid cursor - start from beginning
      }
    }

    // 3. Fetch pageSize + 1 to check hasMore
    const pageItems = issues.slice(0, pageSize + 1);
    const hasMore = pageItems.length > pageSize;
    const resultItems = hasMore ? pageItems.slice(0, pageSize) : pageItems;

    // 4. Batch enrich
    const enriched = await enrichIssues(ctx, resultItems);

    // 5. Build next cursor
    const lastItem = resultItems[resultItems.length - 1];
    const nextCursor = hasMore && lastItem
      ? encodeCursor(lastItem.updatedAt, lastItem._id.toString())
      : null;

    return {
      items: enriched,
      nextCursor,
      hasMore,
    };
  },
});
```

### Frontend Usage

```typescript
// Using the paginated query
function IssueList({ projectId }) {
  const [cursor, setCursor] = useState<string | undefined>();
  const [allItems, setAllItems] = useState([]);

  const data = useQuery(api.issues.listByWorkspacePaginated, {
    projectId,
    cursor,
  });

  // Append new items when data arrives
  useEffect(() => {
    if (data?.items) {
      setAllItems(prev => cursor ? [...prev, ...data.items] : data.items);
    }
  }, [data, cursor]);

  const loadMore = () => {
    if (data?.nextCursor) {
      setCursor(data.nextCursor);
    }
  };

  return (
    <>
      {allItems.map(item => <IssueCard key={item._id} issue={item} />)}
      {data?.hasMore && (
        <Button onClick={loadMore}>Load More</Button>
      )}
    </>
  );
}
```

---

## Do's and Don'ts

### DO: Use Indexes

```typescript
// ✅ GOOD: Uses index for efficient query
const issues = await ctx.db
  .query("issues")
  .withIndex("by_workspace_updated", (q) =>
    q.eq("projectId", args.projectId)
  )
  .order("desc")
  .collect();

// ❌ BAD: Full table scan
const issues = await ctx.db
  .query("issues")
  .filter((q) => q.eq(q.field("projectId"), args.projectId))
  .collect();
```

### DO: Batch Enrich (Avoid N+1)

```typescript
// ✅ GOOD: Batch fetch all related data
const enriched = await enrichIssues(ctx, issues);

// ❌ BAD: N+1 queries
const enriched = await Promise.all(
  issues.map(async (issue) => {
    const assignee = await ctx.db.get(issue.assigneeId);  // N queries!
    return { ...issue, assignee };
  })
);
```

### DO: Handle Invalid Cursors

```typescript
// ✅ GOOD: Graceful fallback
if (args.cursor) {
  try {
    const { timestamp, id } = decodeCursor(args.cursor);
    // ... apply cursor
  } catch {
    // Invalid cursor - start fresh (don't crash)
  }
}

// ❌ BAD: Crash on invalid cursor
const { timestamp, id } = decodeCursor(args.cursor);  // Throws!
```

### DO: Use ID Tiebreaking

```typescript
// ✅ GOOD: Handles items with same timestamp
issues.filter((i) =>
  i.updatedAt < timestamp ||
  (i.updatedAt === timestamp && i._id.toString() < id)
);

// ❌ BAD: Misses items with same timestamp
issues.filter((i) => i.updatedAt < timestamp);
```

### DON'T: Use Offset Pagination

```typescript
// ❌ BAD: Offset pagination is slow and unstable
const items = await ctx.db
  .query("issues")
  .collect()
  .then(items => items.slice(offset, offset + limit));  // Re-reads all data!

// ✅ GOOD: Cursor pagination
const items = await ctx.db
  .query("issues")
  .withIndex("by_updated")
  .filter(/* cursor condition */)
  .take(limit + 1);
```

### DON'T: Double Collect

```typescript
// ❌ BAD: Two separate unbounded collects
const organizedEvents = await ctx.db
  .query("calendarEvents")
  .withIndex("by_organizer", (q) => q.eq("organizerId", userId))
  .collect();

const attendingEvents = await ctx.db
  .query("calendarEvents")
  .collect()  // Loads ENTIRE table!
  .filter(e => e.attendeeIds.includes(userId));

// ✅ GOOD: Single bounded query
const events = await ctx.db
  .query("calendarEvents")
  .withIndex("by_start_time")
  .filter((q) => q.and(
    q.gte(q.field("startTime"), startDate),
    q.lte(q.field("startTime"), endDate)
  ))
  .collect();
// Then filter in memory for organizer/attendee
```

### DON'T: Forget Total Count

```typescript
// ✅ GOOD: Get count from same query before cursor filter
let issues = await ctx.db.query("issues").withIndex(...).collect();
const totalCount = issues.length;  // Before filtering!

if (args.cursor) {
  issues = issues.filter(/* cursor condition */);
}

// ❌ BAD: Separate count query (wasteful)
const totalCount = await ctx.db.query("issues").collect().length;
const issues = await ctx.db.query("issues").withIndex(...).collect();
```

---

## Helper Functions Reference

### `convex/lib/pagination.ts`

| Function | Purpose |
|----------|---------|
| `encodeCursor(timestamp, id)` | Create cursor from timestamp + ID |
| `decodeCursor(cursor)` | Parse cursor back to timestamp + ID |
| `getDoneColumnThreshold(days)` | Get timestamp for N days ago |
| `buildPaginatedResult(items, pageSize)` | Build standard paginated response |

### `convex/lib/issueHelpers.ts`

| Function | Purpose |
|----------|---------|
| `enrichIssues(ctx, issues)` | Batch-fetch users/epics for issues |
| `enrichIssue(ctx, issue)` | Enrich single issue (3 queries) |
| `groupIssuesByStatus(issues)` | Group array into status buckets |
| `countIssuesByStatus(issues)` | Count items per status |

---

## When to Use Which Pattern

| Scenario | Pattern | Reason |
|----------|---------|--------|
| Kanban board | Smart Loading | Users need all active items visible |
| Issue backlog | Cursor | Long list, users scroll |
| Search results | Cursor | Unknown result size |
| Dashboard widgets | Smart Loading | Show recent + summary |
| Audit logs | Cursor | Chronological, large volume |
| Dropdown autocomplete | None (limit) | Just use `.take(10)` |

---

## Index Requirements

For pagination to be performant, ensure these indexes exist in `convex/schema.ts`:

```typescript
issues: defineTable({...})
  .index("by_workspace", ["projectId"])
  .index("by_workspace_updated", ["projectId", "updatedAt"])
  .index("by_workspace_status", ["projectId", "status"])

documents: defineTable({...})
  .index("by_creator", ["createdBy"])
  .index("by_created_at", ["createdAt"])

calendarEvents: defineTable({...})
  .index("by_start_time", ["startTime"])
  .index("by_organizer", ["organizerId"])
```

---

## Checklist for New Paginated Queries

- [ ] Uses appropriate index (not full table scan)
- [ ] Uses cursor-based pagination (not offset)
- [ ] Cursor includes ID for tiebreaking
- [ ] Handles invalid cursors gracefully
- [ ] Uses batch enrichment (not N+1)
- [ ] Returns `hasMore` flag
- [ ] Returns `nextCursor` (null if no more)
- [ ] Optionally returns `totalCount` (from same query)

---

*Created: 2024-12-14*
