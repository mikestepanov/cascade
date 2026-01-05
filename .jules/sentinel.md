## 2024-05-21 - Weak Random Number Generation
**Vulnerability:** Usage of `Math.random()` for generating sensitive secrets (API keys, tokens).
**Learning:** Developers might default to `Math.random()` for string generation without realizing the security implications for secrets.
**Prevention:** Enforce use of `crypto.getRandomValues()` for any security-sensitive random generation.
