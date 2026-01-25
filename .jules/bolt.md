## 2024-05-22 - [Initial Entry]
**Learning:** Performance journals help track what works and what doesn't.
**Action:** Document critical performance learnings here.

## 2024-05-22 - [Calendar View Optimization]
**Learning:** Fetching all issues for a project just to filter them in the client for a calendar view is inefficient (O(N) vs O(K)). Adding a compound index `["projectId", "dueDate"]` and a targeted query drastically reduces data transfer.
**Action:** Always check if a view requires all data or just a subset based on time/status, and use indexed queries for that subset.

## 2026-01-24 - [Done Column Pagination Optimization]
**Learning:** Pagination queries using `lt` on timestamp MUST use `.order("desc")` to return the *next* older items; defaulting to ASC returns the *oldest* items in the database. Also, moving filter conditions into the index range query (e.g., `.lt("updatedAt", ...)` inside `withIndex`) turns O(N) scans into O(K) lookups.
**Action:** When implementing infinite scroll/pagination, always verify sort order and ensure filters use index bounds.

## 2026-01-24 - [Tooltip Provider Optimization]
**Learning:** Wrapping every `Tooltip` in its own `TooltipProvider` creates excessive Context overhead and breaks Radix UI's "grace period" (one tooltip open at a time).
**Action:** Move `TooltipProvider` to the application root (and test render wrapper) to share a single context, reducing DOM node count and enabling proper UX.

## 2024-05-24 - [Query Optimization Regression]
**Learning:** Optimizing a query by using a different index (e.g., filtering in memory instead of database) can change the implicit sort order. If the original query used an index that sorted by the field (e.g. `by_project_due_date`), switching to a non-sorting index (e.g. `by_sprint`) requires manual sorting in memory to preserve API contract.
**Action:** When replacing a DB query with an in-memory filter, always verify if the original query provided a specific sort order and replicate it.
