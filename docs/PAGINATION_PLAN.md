# Pagination Implementation Plan

## Problem Statement

The codebase has **185+ unbounded `.collect()` calls** with zero pagination. This causes:
- Performance degradation as data grows
- Memory issues on client and server
- Poor UX with slow load times

## Research Findings

### Industry Patterns (Jira)
- **Limit**: Max 5,000 issues per board (Cloud), recommended <500
- **Key feature**: "Hide completed issues older than X days" - only for Done column
- **Best practice**: Use filters like `resolution is EMPTY OR resolved >= -14d`
- Source: [Atlassian Kanban Performance](https://confluence.atlassian.com/jirakb/slow-loading-kanban-boards-in-jira-software-800686285.html)

### Open Source (Plane)
- **Grouped pagination**: `GroupedOffsetPaginator` for Kanban columns
- **Cursor-based pagination**: For efficient traversal
- **N+1 prevention**: Uses prefetch/select_related patterns
- **Date filtering**: `updated_at__gt` for incremental updates
- Source: [Plane GitHub](https://github.com/makeplane/plane)

### Virtual Scrolling
- **Syncfusion**: `enableVirtualization` renders only visible cards
- **react-kanban-kit**: Built-in virtualization + load more
- Source: [Syncfusion Kanban](https://ej2.syncfusion.com/react/documentation/kanban/virtual-scrolling)

---

## Proposed Architecture

### Core Principle: Smart Loading by Status Category

Different loading strategies based on workflow state category:

| Category | Strategy | Rationale |
|----------|----------|-----------|
| `todo` | Load all | Usually small, users need full visibility |
| `inprogress` | Load all | Active work, typically <50 items |
| `done` | Load recent only | Accumulates infinitely, load last 14 days default |

### Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND                                   │
├─────────────────────────────────────────────────────────────────┤
│  1. Schema Changes                                               │
│     - Add indexes for efficient filtering                        │
│     - by_project_status_updated (composite)                      │
│     - by_project_sprint_status                                   │
│                                                                  │
│  2. New Queries                                                  │
│     - listByProjectSmart() - category-aware loading              │
│     - listByProjectPaginated() - cursor-based for lists          │
│     - getIssueCount() - for "X more items" indicators            │
│                                                                  │
│  3. Shared Utilities                                             │
│     - Pagination helpers (cursor encode/decode)                  │
│     - Issue enrichment (DRY - assignee, reporter, epic)          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
├─────────────────────────────────────────────────────────────────┤
│  1. UI Components (using existing component library)             │
│     - LoadMoreButton - reusable "Load X more" button             │
│     - VirtualList - wrapper for react-window                     │
│     - PaginationInfo - "Showing X of Y items"                    │
│                                                                  │
│  2. Hooks                                                        │
│     - usePaginatedIssues() - wraps usePaginatedQuery             │
│     - useSmartBoardData() - category-aware loading               │
│                                                                  │
│  3. Updated Components                                           │
│     - KanbanBoard - smart loading per column                     │
│     - KanbanColumn - virtual scrolling for 50+ cards             │
│     - BacklogList - paginated list view                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Backend Infrastructure (2-3 days)

#### 1.1 Schema Updates
```typescript
// convex/schema.ts - Add new indexes
.index("by_project_status_updated", ["projectId", "status", "updatedAt"])
.index("by_project_sprint_created", ["projectId", "sprintId", "createdAt"])
```

#### 1.2 Pagination Utilities
```typescript
// convex/lib/pagination.ts
export const DEFAULT_PAGE_SIZE = 50;
export const DONE_COLUMN_DAYS = 14;

// Encode/decode cursors
export function encodeCursor(timestamp: number, id: string): string;
export function decodeCursor(cursor: string): { timestamp: number; id: string };

// Calculate date threshold
export function getDoneColumnThreshold(days: number = DONE_COLUMN_DAYS): number;
```

#### 1.3 Issue Enrichment Helper (DRY)
```typescript
// convex/lib/issueHelpers.ts
export async function enrichIssuesWithUsers(
  ctx: QueryCtx,
  issues: Doc<"issues">[]
): Promise<EnrichedIssue[]>;
```

#### 1.4 New Queries
```typescript
// convex/issues.ts

// Smart loading for Kanban boards
export const listByProjectSmart = query({
  args: {
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
    doneColumnDays: v.optional(v.number()), // default 14
  },
  handler: async (ctx, args) => {
    // 1. Get project and workflow states
    // 2. For each status category:
    //    - todo/inprogress: load all
    //    - done: load where updatedAt > (now - doneColumnDays)
    // 3. Return grouped by status with counts
  },
});

// Paginated for list views (backlog, search results)
export const listByProjectPaginated = query({
  args: {
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
    status: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // Cursor-based pagination
  },
});

// Get counts for "Load X more" UI
export const getIssueCounts = query({
  args: {
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
  },
  handler: async (ctx, args) => {
    // Return { [status]: count } map
  },
});
```

### Phase 2: Frontend Infrastructure (2-3 days)

#### 2.1 Reusable Components
```typescript
// src/components/ui/LoadMoreButton.tsx
interface LoadMoreButtonProps {
  onClick: () => void;
  isLoading: boolean;
  remainingCount?: number;
  label?: string;
}

// src/components/ui/VirtualList.tsx
interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  overscan?: number;
}

// src/components/ui/PaginationInfo.tsx
interface PaginationInfoProps {
  loaded: number;
  total: number;
  itemName?: string; // "issues", "documents", etc.
}
```

#### 2.2 Custom Hooks
```typescript
// src/hooks/usePaginatedIssues.ts
export function usePaginatedIssues(options: {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  pageSize?: number;
}) {
  // Wraps usePaginatedQuery with convenience methods
  return {
    issues,
    loadMore,
    hasMore,
    isLoading,
    totalCount,
  };
}

// src/hooks/useSmartBoardData.ts
export function useSmartBoardData(options: {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  doneColumnDays?: number;
}) {
  // Uses listByProjectSmart query
  // Returns issues grouped by status
  return {
    issuesByStatus,
    hiddenDoneCount, // "X more completed items"
    loadMoreDone,
    isLoading,
  };
}
```

### Phase 3: Component Updates (2-3 days)

#### 3.1 KanbanBoard Updates
```typescript
// Changes to KanbanBoard.tsx:
// 1. Replace useQuery(listByProject) with useSmartBoardData()
// 2. Pass hiddenDoneCount to Done column
// 3. Add "Show more completed" action
```

#### 3.2 KanbanColumn Updates
```typescript
// Changes to KanbanColumn.tsx:
// 1. Add optional "Load more" footer for Done column
// 2. Virtual scrolling when items > 50
// 3. Show count badge "(12 hidden)"
```

#### 3.3 Settings Integration
```typescript
// Project settings: "Hide completed issues older than X days"
// User preference: Override per-user
// Board toolbar: Quick toggle "Show all completed"
```

### Phase 4: Other Queries (3-4 days)

Apply similar patterns to other high-impact queries:

| Query | File | Strategy |
|-------|------|----------|
| `documents.list` | documents.ts | Cursor pagination |
| `notifications.list` | notifications.ts | Already bounded, add cursor |
| `calendarEvents.listMine` | calendarEvents.ts | Fix dual collect, add date range |
| `sprints.listByProject` | sprints.ts | Fix N+1 with aggregation |
| `timeTracking.listTimeEntries` | timeTracking.ts | Already bounded, verify |

---

## Database Indexes Required

```typescript
// issues table
.index("by_project_status_updated", ["projectId", "status", "updatedAt"])
.index("by_project_sprint_created", ["projectId", "sprintId", "createdAt"])
.index("by_project_updated", ["projectId", "updatedAt"])

// documents table
.index("by_creator_updated", ["createdBy", "updatedAt"])

// notifications table
.index("by_user_created", ["userId", "createdAt"])
```

---

## UI/UX Specifications

### Done Column Behavior
```
┌─────────────────────────────┐
│ Done (5)          [...]     │  <- Count shows visible only
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ PROJ-123 Fix login      │ │  <- Recent items visible
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ PROJ-122 Add tests      │ │
│ └─────────────────────────┘ │
│         ...                 │
├─────────────────────────────┤
│ Show 47 more completed →    │  <- Load more button
│ (older than 14 days)        │
└─────────────────────────────┘
```

### Board Toolbar Addition
```
[Sprint: v1.2 ▼] [Filter ▼] [Group ▼] | ⚙️ Show completed: [Last 14 days ▼]
```

### Settings Page Addition
```
Board Settings
├── Default view: [Kanban ▼]
├── Show completed issues: [Last 14 days ▼]
│   Options: Last 7 days, Last 14 days, Last 30 days, All
└── Virtual scrolling: [✓] Enable for columns with 50+ items
```

---

## Migration Strategy

1. **Backward compatible**: Keep existing `listByProject` query working
2. **Feature flag**: `useSmartBoardLoading` in constants
3. **Gradual rollout**:
   - Phase 1: Add new queries alongside old
   - Phase 2: Update components to use new queries
   - Phase 3: Deprecate old queries
   - Phase 4: Remove old queries

---

## Testing Plan

### Backend Tests
- [ ] Pagination cursor encoding/decoding
- [ ] Smart loading returns correct items per category
- [ ] Done column respects day threshold
- [ ] Issue enrichment helper works correctly
- [ ] Counts match actual data

### Frontend Tests
- [ ] LoadMoreButton renders and calls handler
- [ ] VirtualList renders correct visible items
- [ ] useSmartBoardData returns grouped data
- [ ] KanbanBoard shows "Load more" for Done
- [ ] Settings persist and apply correctly

### E2E Tests
- [ ] Board loads within performance budget (<2s)
- [ ] Load more works for Done column
- [ ] Settings change affects board display
- [ ] Large dataset (500+ issues) performs well

---

## Performance Targets

| Metric | Current | Target |
|--------|---------|--------|
| Initial board load | Unbounded | <2s for 500 issues |
| Done column load | All items | Last 14 days default |
| Memory usage | O(n) all issues | O(visible + buffer) |
| Database queries | N+1 patterns | Batched/optimized |

---

## Open Questions

1. **Per-column vs per-board pagination?**
   - Recommendation: Per-board with smart loading by category

2. **Virtual scrolling library?**
   - Options: react-window (lighter), react-virtualized (more features)
   - Recommendation: react-window for simplicity

3. **Done column default threshold?**
   - Options: 7, 14, 30 days
   - Recommendation: 14 days (matches Jira default)

4. **Store preference where?**
   - Options: Project setting, user preference, both
   - Recommendation: Project default + user override

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Backend | 2-3 days | None |
| Phase 2: Frontend infra | 2-3 days | Phase 1 |
| Phase 3: Component updates | 2-3 days | Phase 2 |
| Phase 4: Other queries | 3-4 days | Phase 1 |
| Testing & polish | 2 days | All phases |

**Total: ~12-15 days**

---

## Files to Create/Modify

### New Files
- `convex/lib/pagination.ts` - Pagination utilities
- `convex/lib/issueHelpers.ts` - Issue enrichment
- `src/components/ui/LoadMoreButton.tsx` - Load more button
- `src/components/ui/VirtualList.tsx` - Virtual scrolling wrapper
- `src/components/ui/PaginationInfo.tsx` - "X of Y" display
- `src/hooks/usePaginatedIssues.ts` - Pagination hook
- `src/hooks/useSmartBoardData.ts` - Smart board hook

### Modified Files
- `convex/schema.ts` - Add indexes
- `convex/issues.ts` - Add new queries
- `src/components/KanbanBoard.tsx` - Use smart loading
- `src/components/Kanban/KanbanColumn.tsx` - Add load more, virtual scroll
- `src/components/Kanban/BoardToolbar.tsx` - Add settings toggle
- `src/lib/constants.ts` - Add pagination constants
