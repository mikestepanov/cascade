## 2024-05-23 - Covering Indexes for Soft Delete Counts
**Learning:** Convex `count()` queries with `.filter(notDeleted)` can be significantly optimized by including `isDeleted` in the index, even if `isDeleted` is optional/undefined. This creates a "covering index" that allows Convex to skip fetching the document to verify the filter, speeding up counts on large datasets (like board column counts).
**Action:** When using `notDeleted` filter frequently with `count()`, ensure the index includes `isDeleted` as the last field.
