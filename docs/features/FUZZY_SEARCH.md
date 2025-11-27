# Fuzzy Search Implementation Guide

## Overview

Nixelo uses a **hybrid search approach** combining Convex and Fuse.js:

- **Convex Search** - Server-side, permission-filtered, exact/prefix matching
- **Fuse.js** - Client-side, typo-tolerant, fuzzy matching

## When to Use Each

### Use Convex Search For:
✅ Global search across entire dataset
✅ Search requiring permission checks (only show what user can access)
✅ Search with complex filters (by date, status, assignee, etc.)
✅ Searching large datasets (thousands+ records)
✅ Search results that need to be paginated

**Example:** Main search bar, document search, issue search

```typescript
const results = useQuery(api.issues.search, {
  projectId,
  query: "bug fix",
  status: "open"
});
```

### Use Fuse.js Fuzzy Search For:
✅ Interactive dropdowns (assignee picker, label selector)
✅ Autocomplete fields
✅ Filtering data already loaded in memory
✅ Typo-tolerant search (user types "jhon" matches "john")
✅ Approximate matching ("proj" matches "project")
✅ Small to medium datasets (hundreds of records)

**Example:** Assignee dropdown, project switcher, label filter

```typescript
import { useUserFuzzySearch } from "@/hooks/useFuzzySearch";

const { results, search, query } = useUserFuzzySearch(projectMembers);

// In your dropdown
<input value={query} onChange={(e) => search(e.target.value)} />
{results.map(({ item, score }) => (
  <div key={item._id}>{item.name}</div>
))}
```

## Hybrid Approach Example

```typescript
// Step 1: Load data from Convex (with permissions)
const projectMembers = useQuery(api.projects.getMembers, { projectId });

// Step 2: Use fuzzy search on loaded data for interactive filtering
const { results, search, query } = useUserFuzzySearch(projectMembers);

// Result: Permission-safe + typo-tolerant search
```

## API Reference

### `useFuzzySearch<T>(items, options)`

Generic fuzzy search hook.

**Options:**
- `keys` - Fields to search (supports nested paths and weights)
- `threshold` - Match sensitivity (0.0 = exact, 1.0 = anything, default: 0.4)
- `limit` - Max results to return
- `minMatchCharLength` - Minimum characters before matching
- `includeScore` - Include match score (default: true)

**Returns:**
- `results` - Array of matched items with scores
- `query` - Current search query
- `search(query)` - Update search
- `clear()` - Clear search
- `isSearching` - Whether actively searching
- `hasResults` - Whether results exist

### Pre-configured Hooks

#### `useUserFuzzySearch(users)`
Searches users by name (weight: 2) and email (weight: 1).
Threshold: 0.3 (strict), Limit: 10

```typescript
const { results, search } = useUserFuzzySearch(allUsers);
```

#### `useProjectFuzzySearch(projects)`
Searches projects by name (weight: 3), key (weight: 2), description (weight: 1).
Threshold: 0.35, Limit: 15

```typescript
const { results, search } = useProjectFuzzySearch(allProjects);
```

#### `useIssueFuzzySearch(issues)`
Searches issues by key (weight: 3), title (weight: 2), description (weight: 1).
Threshold: 0.3, Limit: 20

```typescript
const { results, search } = useIssueFuzzySearch(projectIssues);
```

#### `useLabelFuzzySearch(labels)`
Searches labels/tags (string array).
Threshold: 0.2 (very strict), Limit: 10

```typescript
const { results, search } = useLabelFuzzySearch(availableLabels);
```

## Usage Examples

### Example 1: Assignee Dropdown with Fuzzy Search

```typescript
import { useUserFuzzySearch } from "@/hooks/useFuzzySearch";

function AssigneeSelect({ projectId, value, onChange }) {
  const members = useQuery(api.projects.getMembers, { projectId });
  const { results, search, query, clear } = useUserFuzzySearch(members);

  return (
    <div>
      <input
        type="text"
        placeholder="Search assignee..."
        value={query}
        onChange={(e) => search(e.target.value)}
      />
      <div className="dropdown">
        {results.map(({ item, score }) => (
          <button
            key={item._id}
            onClick={() => {
              onChange(item._id);
              clear();
            }}
          >
            {item.name}
            {score && score > 0 ? ` (${(score * 100).toFixed(0)}% match)` : ""}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Example 2: Project Switcher

```typescript
import { useProjectFuzzySearch } from "@/hooks/useFuzzySearch";

function ProjectSwitcher() {
  const projects = useQuery(api.projects.listUserProjects);
  const { results, search, query } = useProjectFuzzySearch(projects);

  return (
    <div>
      <input
        type="search"
        placeholder="Find project (try typos!)"
        value={query}
        onChange={(e) => search(e.target.value)}
      />
      <ul>
        {results.map(({ item }) => (
          <li key={item._id}>
            <a href={`/projects/${item._id}`}>
              {item.key} - {item.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Example 3: Custom Search with Highlighting

```typescript
import { useFuzzySearch } from "@/hooks/useFuzzySearch";

function DocumentSearch() {
  const documents = useQuery(api.documents.list);
  const { results, search, query } = useFuzzySearch(documents, {
    keys: [
      { name: "title", weight: 3 },
      { name: "content", weight: 1 }
    ],
    threshold: 0.4,
    includeScore: true,
    limit: 5
  });

  return (
    <div>
      <input value={query} onChange={(e) => search(e.target.value)} />
      {results.map(({ item, score, matches }) => (
        <div key={item._id}>
          <h3>{item.title}</h3>
          <p>Relevance: {((1 - (score ?? 0)) * 100).toFixed(0)}%</p>
        </div>
      ))}
    </div>
  );
}
```

## Performance Considerations

### Memory Usage
Fuse.js builds an index in memory. For large datasets:
- ✅ Good: 10-1000 items (~100KB-1MB)
- ⚠️ Careful: 1000-5000 items (~1-5MB)
- ❌ Avoid: 5000+ items (use Convex search instead)

### Optimization Tips

1. **Use `limit` option** to cap results:
```typescript
useFuzzySearch(items, { keys: ["name"], limit: 10 })
```

2. **Debounce search input** for large datasets:
```typescript
import { useDebouncedValue } from "@mantine/hooks";

const [query, setQuery] = useState("");
const [debouncedQuery] = useDebouncedValue(query, 200);

const { results } = useFuzzySearch(items, { keys: ["name"] });
// Search only when user stops typing
```

3. **Use stricter thresholds** to reduce false positives:
```typescript
// Stricter = faster, fewer results
threshold: 0.2

// More permissive = slower, more results
threshold: 0.6
```

4. **Memoize items** to prevent recreating Fuse index:
```typescript
const items = useMemo(() => rawData?.map(...), [rawData]);
const { results } = useFuzzySearch(items, options);
```

## Configuration Guide

### Threshold Values
- `0.0` - Perfect match only (exact string)
- `0.1-0.2` - Very strict (1-2 character differences)
- `0.3-0.4` - **Balanced (recommended)** - tolerates typos
- `0.5-0.6` - Permissive (many false positives)
- `0.7-1.0` - Very loose (not recommended)

### Key Weights
Higher weight = more important for matching:

```typescript
keys: [
  { name: "title", weight: 3 },      // Most important
  { name: "description", weight: 1 }, // Least important
]
```

## Testing

```typescript
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFuzzySearch } from "./useFuzzySearch";

describe("useFuzzySearch", () => {
  it("should find items with typos", () => {
    const items = [
      { name: "John Doe" },
      { name: "Jane Smith" }
    ];

    const { result } = renderHook(() =>
      useFuzzySearch(items, { keys: ["name"] })
    );

    act(() => {
      result.current.search("jhon"); // Typo
    });

    expect(result.current.results[0].item.name).toBe("John Doe");
  });
});
```

## Migration Path

### Current State
- ❌ Fuse.js installed but unused (0 imports)

### Recommended Migration
1. ✅ Keep using Convex search for main search features
2. ✅ Add fuzzy search to interactive components:
   - Assignee dropdown
   - Label selector
   - Project switcher
   - Sprint selector
3. ✅ Use hybrid approach (Convex + Fuse.js) for best UX

### Files to Update
- `src/components/CreateIssueModal.tsx` - Add fuzzy assignee search
- `src/components/IssueDetailsModal.tsx` - Add fuzzy assignee search
- `src/components/ProjectSwitcher.tsx` - Add fuzzy project search
- `src/components/SprintSelector.tsx` - Add fuzzy sprint search

## Comparison with Convex Search

| Feature | Convex Search | Fuse.js Fuzzy |
|---------|--------------|---------------|
| **Location** | Server-side | Client-side |
| **Permissions** | ✅ Built-in | ❌ Manual |
| **Fuzzy Matching** | ❌ No | ✅ Yes |
| **Typo Tolerance** | ❌ No | ✅ Yes |
| **Dataset Size** | Unlimited | < 5000 items |
| **Latency** | Network round-trip | Instant |
| **Use Case** | Global search | Dropdowns |

## Best Practices

1. **Always filter by permissions first** (use Convex)
2. **Then apply fuzzy search** on the filtered set
3. **Keep datasets small** for fuzzy search (< 1000 items)
4. **Use debouncing** for large datasets
5. **Show match scores** to help users understand results
6. **Test with typos** to validate threshold settings

## Resources

- [Fuse.js Documentation](https://fusejs.io/)
- [Convex Search Documentation](https://docs.convex.dev/search)
- [Stack Post: Fuzzy Search in Convex](https://stack.convex.dev/fuzzy-search)

---

*Last Updated: 2025-11-27*
