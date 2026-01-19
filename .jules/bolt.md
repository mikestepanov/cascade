## 2024-05-22 - [Initial Entry]
**Learning:** Performance journals help track what works and what doesn't.
**Action:** Document critical performance learnings here.

## 2024-05-22 - [Calendar View Optimization]
**Learning:** Fetching all issues for a project just to filter them in the client for a calendar view is inefficient (O(N) vs O(K)). Adding a compound index `["projectId", "dueDate"]` and a targeted query drastically reduces data transfer.
**Action:** Always check if a view requires all data or just a subset based on time/status, and use indexed queries for that subset.

## 2024-05-23 - [Sprint Board "Done" Column Optimization]
**Learning:** "Done" columns accumulate issues indefinitely. Fetching all of them (`.collect()`) just to filter by date in memory is an O(N) anti-pattern. Optimizing this requires a compound index ending in `updatedAt` (e.g., `["projectId", "sprintId", "status", "updatedAt"]`) to allow range queries in the database.
**Action:** When adding new views (e.g., Team Board), ensure corresponding `_updated` indexes exist to support efficient "Done" column windowing.
