## 2024-05-21 - Weak Random Number Generation
**Vulnerability:** Usage of `Math.random()` for generating sensitive secrets (API keys, tokens).
**Learning:** Developers might default to `Math.random()` for string generation without realizing the security implications for secrets.
**Prevention:** Enforce use of `crypto.getRandomValues()` for any security-sensitive random generation.

## 2025-01-05 - Insecure Unsubscribe Tokens
**Vulnerability:** `convex/unsubscribe.ts` was using `Math.random()` to generate unsubscribe tokens, making them potentially predictable.
**Learning:** Even low-risk tokens like unsubscribe links should use secure randomness to prevent enumeration attacks.
**Prevention:** Replaced `Math.random()` with `crypto.getRandomValues()` and increased entropy to 64 hex characters.
