## 2024-05-21 - Weak Random Number Generation
**Vulnerability:** Usage of `Math.random()` for generating sensitive secrets (API keys, tokens).
**Learning:** Developers might default to `Math.random()` for string generation without realizing the security implications for secrets.
**Prevention:** Enforce use of `crypto.getRandomValues()` for any security-sensitive random generation.

## 2025-01-05 - Insecure Unsubscribe Tokens
**Vulnerability:** `convex/unsubscribe.ts` was using `Math.random()` to generate unsubscribe tokens, making them potentially predictable.
**Learning:** Even low-risk tokens like unsubscribe links should use secure randomness to prevent enumeration attacks.
**Prevention:** Replaced `Math.random()` with `crypto.getRandomValues()` and increased entropy to 64 hex characters.

## 2025-01-28 - Missing Workspace Permissions
**Vulnerability:** `convex/workspaces.ts` had `// TODO` comments in place of actual permission checks for `update` and `remove` mutations, allowing any authenticated user to modify workspaces.
**Learning:** TODO comments acting as placeholders for security checks are dangerous if the code is deployed before they are addressed.
**Prevention:** Implemented strict `isCompanyAdmin` checks. Future feature flags or role implementations (like "Workspace Admin") must be fully implemented before relaxing these checks.

## 2025-02-14 - Insecure Usage Logging
**Vulnerability:** `recordUsage` mutation in `convex/apiKeys.ts` was exported as a public mutation, allowing any user to fabricate API usage statistics.
**Learning:** Helper mutations used by backend logic (like logging or stats) must be `internalMutation` to prevent external manipulation, even if they don't modify sensitive data.
**Prevention:** Converted `recordUsage` to `internalMutation` and updated calls to use `internal.apiKeys.recordUsage`.

## 2025-02-14 - Mutation in Mutation Error
**Vulnerability:** Attempted to call a mutation (`rateLimit`) from within another mutation (`validateAndRateLimit`) which causes a runtime error in Convex.
**Learning:** Convex Mutations are atomic and cannot call other mutations via `ctx.runMutation`. Orchestration of multiple mutations or query+mutation flows must happen in an Action.
**Prevention:** Moved orchestration logic to the HTTP Action handler.

## 2026-01-19 - Exposed API Key Validation
**Vulnerability:** `validateApiKey` and `validate` queries in `convex/apiKeys.ts` were public `query`, exposing API keys in function arguments logs and potentially allowing public validation.
**Learning:** Validation queries that accept secrets as arguments must be `internalQuery` to avoid logging secrets in the dashboard and prevent public access to validation logic.
**Prevention:** Converted `validateApiKey` and `validate` to `internalQuery` and updated call sites to use `internal.apiKeys`.

## 2026-01-23 - Multi-Tenant Document Leak
**Vulnerability:** `api.documents.list` and `get` treated "public" documents as globally accessible across all organizations, allowing users in Org A to see public documents from Org B.
**Learning:** In multi-tenant applications, "Public" is ambiguous. Developers often implement it as "globally public" (like a blog post) when users expect "public to my team/organization".
**Prevention:** Always scope "public" data queries by `organizationId`. Added `by_organization_public` index and enforced strict organization membership checks for all shared resources.

## 2026-01-24 - Insecure Default in E2E Endpoints
**Vulnerability:** E2E endpoints in `convex/e2e.ts` were "Fail Open" when `E2E_API_KEY` was missing, allowing access unless `NODE_ENV` was explicitly "production". This could expose dangerous endpoints in misconfigured environments (e.g. staging or where env vars are missing).
**Learning:** Security checks must "Fail Secure" (Deny by default). Relying on an environment variable to NOT be a specific value (like "production") is unsafe because it treats unknown states (undefined, "staging") as safe.
**Prevention:** Refactored `validateE2EApiKey` to explicit allow-listing: Access is denied by default unless `NODE_ENV` is explicitly "development" or "test".
