# Tech Debt

> **Priority:** P2
> **Effort:** Small-Medium
> **Status:** Not started

---

## Tasks

### 1. Type Consistency

**What:** Ensure all TypeScript types (`IssueType`, `IssuePriority`, `IssueStatus`, etc.) are imported from canonical sources, not duplicated.

**Problem:** Types are defined in multiple places:
- `convex/schema.ts` - Source of truth for database types
- `src/lib/issue-utils.ts` - UI-specific type definitions
- `src/components/*.tsx` - Local type definitions

**Example of the problem:**

```typescript
// convex/schema.ts
export const issueTypes = v.union(
  v.literal("story"),
  v.literal("task"),
  v.literal("bug"),
  v.literal("epic"),
);

// src/components/SomeComponent.tsx
type IssueType = "story" | "task" | "bug" | "epic";  // ❌ Duplicated!
```

**Solution:**

1. Define types in one canonical location
2. Export from a shared types file
3. Import everywhere else

```typescript
// src/types/issues.ts (or convex/_generated/dataModel.d.ts)
export type IssueType = "story" | "task" | "bug" | "epic";
export type IssuePriority = "highest" | "high" | "medium" | "low" | "lowest";
export type IssueStatus = "backlog" | "todo" | "in_progress" | "in_review" | "done";

// All components import from here
import type { IssueType, IssuePriority } from "@/types/issues";
```

**Implementation:**
- [ ] Audit all type definitions with: `grep -r "IssueType\|IssuePriority\|IssueStatus" src --include="*.ts*"`
- [ ] Create canonical `src/types/issues.ts` (or use Convex-generated types)
- [ ] Update all imports to use canonical source
- [ ] Add lint rule to prevent local type redefinition

---

### 2. Docstring Coverage

**What:** Add JSDoc comments to Convex functions for better documentation.

**Current state:** 32.5% coverage (CodeRabbit threshold is 80%)

**Priority functions to document:**
1. All public queries in `convex/*.ts`
2. All public mutations in `convex/*.ts`
3. All exported utility functions

**Example:**

```typescript
// Before
export const get = query({
  args: { id: v.id("issues") },
  handler: async (ctx, args) => {
    // ...
  },
});

// After
/**
 * Get a single issue by ID.
 *
 * @param id - The issue document ID
 * @returns The issue document, or null if not found or unauthorized
 * @throws Error if user is not authenticated
 *
 * @example
 * const issue = await ctx.runQuery(api.issues.get, { id: issueId });
 */
export const get = query({
  args: { id: v.id("issues") },
  handler: async (ctx, args) => {
    // ...
  },
});
```

**Implementation:**
- [ ] Run: `grep -L "@param\|@returns" convex/*.ts` to find undocumented files
- [ ] Add JSDoc to all exported queries/mutations
- [ ] Add JSDoc to complex utility functions
- [ ] Target: 80% coverage

---

### 3. Remove Console Logs in Production Code

**What:** Audit and remove debug `console.log` statements from production code.

**Why:** Logs clutter browser console, may leak sensitive data.

**How to find:**
```bash
grep -r "console\.log" src --include="*.ts*" | grep -v ".test." | grep -v "// DEBUG"
```

**Allowed exceptions:**
- Error logging with `console.error`
- Explicit `// DEBUG:` comments that are meant to be removed before merge

**Implementation:**
- [ ] Run audit command
- [ ] Remove or convert to proper logging
- [ ] Add lint rule: `no-console` with `allow: ["warn", "error"]`

---

### 4. Biome Complexity Warnings

**What:** Address functions flagged by Biome for excessive cognitive complexity.

**Current warnings:**

| File | Function | Complexity | Max |
|------|----------|------------|-----|
| `convex/migrations/blockNoteToPlate.ts` | `convertBlockNoteBlock` | 19 | 15 |
| `convex/migrations/blockNoteToPlate.ts` | content.map callback | 18 | 15 |
| `convex/migrations/blockNoteToPlate.ts` | `convertProseMirrorNode` | 18 | 15 |
| `convex/migrations/blockNoteToPlate.ts` | `getProseMirrorChildren` | 20 | 15 |
| `src/components/FilterBar.tsx` | `FilterBar` | 25 | 15 |
| `src/components/KanbanBoard.tsx` | filter callback | 17 | 15 |
| `src/lib/plate/markdown.ts` | `parseMarkdown` | 43 | 15 |

**Approach:**
- Extract helper functions
- Use early returns
- Split large switch statements into lookup objects

**Implementation:**
- [ ] Refactor `parseMarkdown` (43 complexity - worst offender)
- [ ] Refactor `FilterBar` component
- [ ] Refactor BlockNote migration functions
- [ ] Target: All functions under 15 complexity

---

## Acceptance Criteria

- [ ] No duplicate type definitions in codebase
- [ ] JSDoc coverage ≥ 80% for convex functions
- [ ] No `console.log` in production code (except error/warn)
- [ ] All Biome complexity warnings resolved

---

## Related Files

- `convex/schema.ts` - Type definitions
- `src/types/` - Shared types
- `biome.json` - Linter config
