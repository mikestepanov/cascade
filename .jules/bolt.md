## 2024-05-22 - [Initial Entry]
**Learning:** Performance journals help track what works and what doesn't.
**Action:** Document critical performance learnings here.

## 2024-05-22 - [Calendar View Optimization]
**Learning:** Fetching all issues for a project just to filter them in the client for a calendar view is inefficient (O(N) vs O(K)). Adding a compound index `["projectId", "dueDate"]` and a targeted query drastically reduces data transfer.
**Action:** Always check if a view requires all data or just a subset based on time/status, and use indexed queries for that subset.
