## 2024-05-23 - CSRF Bypass via x-api-key Header
**Vulnerability:** The CSRF middleware allowed bypassing CSRF validation if the `x-api-key` header was present, regardless of whether the request also contained session cookies.
**Learning:** Middleware logic that skips checks based on headers must verify that the skipped check's protection isn't needed. In this case, `x-api-key` implies "API client", but browsers can also send this header (if CORS allows or via XSS), while still sending cookies. This allowed attackers to use cookie-based authentication while bypassing CSRF by injecting a fake header.
**Prevention:** Logic was added to ensure that the `x-api-key` bypass ONLY applies if no authentication cookies (`access_token`, `session_id`) are present. If cookies are present, CSRF is enforced regardless of headers.

## 2024-05-24 - Timing Attack via Authentication Flow
**Vulnerability:** The login flow returned significantly faster for non-existent users compared to existing users with incorrect passwords (due to skipping the expensive bcrypt comparison).
**Learning:** Early returns in authentication logic, especially before expensive operations like hashing, leak state information. Attackers can use this time difference to enumerate valid email addresses.
**Prevention:** Implemented a constant-time comparison strategy using a dummy bcrypt hash. The authentication service now performs a hash comparison in all failure paths, ensuring response times are indistinguishable regardless of user existence.

## 2025-05-25 - Denial of Service via Memory Buffering in S3 Uploads
**Vulnerability:** The `S3StorageAdapter` was buffering entire file streams into memory (`chunks.push(chunk)`) before uploading to S3. This allowed an attacker to trigger an Out-Of-Memory (OOM) crash by uploading a large file (e.g., 5GB video), causing a Denial of Service.
**Learning:** Using `Buffer.concat` on streams without size limits is dangerous. Node.js processes have limited memory (default ~2GB). Always assume streams can exceed available memory.
**Prevention:** Refactored the upload logic to use `@aws-sdk/lib-storage`'s `Upload` class, which streams data directly to S3 using multipart uploads. Added a `PassThrough` stream to track file size without buffering.
