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

## 2025-02-18 - Public Secret Validation Queries
**Vulnerability:** `validateApiKey` and `validate` queries in `convex/apiKeys.ts` were public. While they didn't return sensitive data, they accepted the secret API key as an argument, which Convex logs in its dashboard, potentially exposing valid keys to anyone with dashboard access.
**Learning:** Any query or mutation that accepts a secret (API key, password, token) as an argument must be `internalQuery` or `internalMutation` to prevent the secret from being logged in the public function execution logs.
**Prevention:** Converted validation queries to `internalQuery` and updated HTTP actions to use `internal.apiKeys...`.
