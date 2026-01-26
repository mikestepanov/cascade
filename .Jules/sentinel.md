## 2025-02-21 - [IDOR in Workspace Project Listing]
**Vulnerability:** `getWorkspaceProjects` query allowed any authenticated user to list projects in any workspace if they knew the `workspaceId`, bypassing organization membership checks.
**Learning:** `authenticatedQuery` only guarantees the user is logged in, not that they have access to the specific resource. Helper functions like `getWorkspaceProjects` that operate on IDs must explicitly verify authorization (e.g., organization membership) before returning data.
**Prevention:** Always verify that the user has the appropriate role or membership in the parent organization/team when accessing resources by ID. Use `isOrganizationMember` or similar helpers.
