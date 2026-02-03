## 2024-05-23 - Cross-Organization Integrity in Shared Schemas
**Vulnerability:** Document creation allowed linking projects/workspaces from Organization A to a document in Organization B.
**Learning:** In multi-tenant systems using shared tables (like `documents`), verifying the user's membership in the target organization is insufficient. You must also verify that all related foreign keys (project, workspace) belong to that same organization to prevent data integrity violations and confused deputy attacks.
**Prevention:** Always validate that optional foreign keys belong to the same root entity (Organization) as the primary entity being created.
