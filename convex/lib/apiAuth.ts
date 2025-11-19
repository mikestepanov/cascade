import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

/**
 * API Authentication Utilities
 *
 * Helper functions for authenticating and authorizing API requests.
 */

// Hash API key using SHA-256
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface ApiAuthContext {
  userId: Id<"users">;
  keyId: Id<"apiKeys">;
  scopes: string[];
  projectId?: Id<"projects">;
  rateLimit: number;
}

/**
 * Extract API key from Authorization header
 */
export function extractApiKey(headers: Headers): string | null {
  const authHeader = headers.get("authorization");
  if (!authHeader) return null;

  // Support both "Bearer token" and "token" formats
  const parts = authHeader.split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
    return parts[1];
  }
  if (parts.length === 1) {
    return parts[0];
  }

  return null;
}

/**
 * Validate API key and return auth context (for use in queries/mutations)
 * Note: For HTTP actions, use internal.apiKeys.validateApiKeyInternal instead
 */
export async function validateApiKey(
  ctx: { db: QueryCtx["db"] },
  apiKey: string,
): Promise<ApiAuthContext | null> {
  // Hash the provided key
  const keyHash = await hashApiKey(apiKey);

  // Find key by hash
  const key = await ctx.db
    .query("apiKeys")
    .withIndex("by_key_hash", (q) => q.eq("keyHash", keyHash))
    .first();

  if (!key) return null;
  if (!key.isActive) return null;
  if (key.expiresAt && key.expiresAt < Date.now()) return null;

  return {
    userId: key.userId,
    keyId: key._id,
    scopes: key.scopes,
    projectId: key.projectId,
    rateLimit: key.rateLimit,
  };
}

/**
 * Check if auth context has required scope
 */
export function hasScope(auth: ApiAuthContext, requiredScope: string): boolean {
  // Wildcard scope grants all permissions
  if (auth.scopes.includes("*")) return true;

  // Check for exact scope match
  if (auth.scopes.includes(requiredScope)) return true;

  // Check for resource:* wildcard (e.g., "issues:*" grants "issues:read", "issues:write", etc.)
  const [resource] = requiredScope.split(":");
  if (auth.scopes.includes(`${resource}:*`)) return true;

  return false;
}

/**
 * Verify project access (if API key is scoped to a project)
 */
export function verifyProjectAccess(
  auth: ApiAuthContext,
  requestedProjectId?: Id<"projects">,
): boolean {
  // If key is not project-scoped, allow any project
  if (!auth.projectId) return true;

  // If key is project-scoped, only allow that project
  return auth.projectId === requestedProjectId;
}

/**
 * Rate limiting check
 * Returns null if allowed, or { retryAfter: seconds } if rate limited
 */
export async function checkRateLimit(
  ctx: { db: QueryCtx["db"] },
  keyId: Id<"apiKeys">,
): Promise<{ allowed: true } | { allowed: false; retryAfter: number }> {
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;

  // Get key to check rate limit
  const key = await ctx.db.get(keyId);
  if (!key) return { allowed: false, retryAfter: 60 };

  // Count requests in last minute
  const recentRequests = await ctx.db
    .query("apiUsageLogs")
    .withIndex("by_api_key_created", (q) => q.eq("apiKeyId", keyId).gt("createdAt", oneMinuteAgo))
    .collect();

  if (recentRequests.length >= key.rateLimit) {
    // Calculate retry-after (seconds until oldest request expires)
    const oldestRequest = recentRequests[0];
    const retryAfter = Math.ceil((oldestRequest.createdAt + 60 * 1000 - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

/**
 * Create a standard API error response
 */
export function createErrorResponse(
  statusCode: number,
  message: string,
  details?: Record<string, unknown>,
): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: statusCode,
        message,
        ...details,
      },
    }),
    {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

/**
 * Create a standard API success response
 */
export function createSuccessResponse(data: unknown, statusCode: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
