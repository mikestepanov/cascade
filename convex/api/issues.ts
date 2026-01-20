import { MINUTE } from "@convex-dev/rate-limiter";
import { components, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { type ActionCtx, httpAction } from "../_generated/server";
import {
  type ApiAuthContext,
  createErrorResponse,
  createSuccessResponse,
  extractApiKey,
  hasScope,
  verifyProjectAccess,
} from "../lib/apiAuth";

/**
 * REST API for Issues
 */

export const handler = httpAction(async (ctx, request) => {
  const startTime = Date.now();
  const url = new URL(request.url);
  const method = request.method;
  const userAgent = request.headers.get("user-agent") || undefined;
  const ipAddress =
    request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;

  let auth: ApiAuthContext | null = null;
  let response: Response;
  let error: string | undefined;

  try {
    const authResult = await authenticateAndRateLimit(ctx, request);
    if (authResult.response) {
      response = authResult.response;
      error = authResult.error;
    } else if (authResult.auth) {
      auth = authResult.auth;
      // Route based on method and path
      if (method === "GET" && url.pathname.endsWith("/api/issues")) {
        response = await handleList(ctx, request, auth);
      } else {
        response = createErrorResponse(404, "Not found");
      }
    } else {
      // Should not happen if authenticateAndRateLimit is correct
      response = createErrorResponse(500, "Authentication error");
    }
  } catch (e: unknown) {
    // biome-ignore lint/suspicious/noConsole: Logging critical API errors
    console.error(e);
    error = e instanceof Error ? e.message : String(e);
    // Explicitly handle unauthorized errors from internal queries
    if (error.includes("Not authorized")) {
      response = createErrorResponse(403, "Not authorized");
    } else {
      response = createErrorResponse(500, "Internal server error");
    }
  }

  // Record usage if authenticated
  if (auth?.keyId) {
    try {
      const responseTime = Date.now() - startTime;
      await ctx.runMutation(internal.apiKeys.recordUsage, {
        keyId: auth.keyId,
        method,
        endpoint: url.pathname,
        statusCode: response.status,
        responseTime,
        userAgent,
        ipAddress,
        error,
      });
    } catch (e) {
      // Ignore usage recording errors to not affect response
      // biome-ignore lint/suspicious/noConsole: Logging failed usage record
      console.error("Failed to record API usage", e);
    }
  }

  return response;
});

async function authenticateAndRateLimit(
  ctx: ActionCtx,
  request: Request,
): Promise<{
  auth: ApiAuthContext | null;
  response?: Response;
  error?: string;
}> {
  const apiKey = extractApiKey(request.headers);
  if (!apiKey) {
    return {
      auth: null,
      response: createErrorResponse(401, "Missing API key"),
      error: "Missing API key",
    };
  }

  // 1. Validate Key (Read-only)
  const auth = await ctx.runQuery(internal.apiKeys.validateApiKey, { apiKey });

  if (!auth) {
    return {
      auth: null,
      response: createErrorResponse(401, "Invalid or expired API key"),
      error: "Invalid API key",
    };
  }

  // 2. Enforce Rate Limit (Mutation)
  try {
    await ctx.runMutation(components.rateLimiter.lib.rateLimit, {
      name: `api-key-${auth.keyId}`,
      config: {
        kind: "token bucket",
        rate: auth.rateLimit,
        period: MINUTE,
        capacity: auth.rateLimit,
      },
    });
  } catch (e: unknown) {
    // Handle rate limit error from component
    if (e instanceof Error && e.message.includes("Rate limit")) {
      return {
        auth: null,
        response: createErrorResponse(429, "Rate limit exceeded"),
        error: "Rate limit exceeded",
      };
    }
    throw e;
  }

  return { auth };
}

async function handleList(ctx: ActionCtx, request: Request, auth: ApiAuthContext) {
  if (!hasScope(auth, "issues:read")) {
    return createErrorResponse(403, "Missing scope: issues:read");
  }

  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId") as Id<"projects"> | null;

  if (!projectId) {
    return createErrorResponse(400, "projectId required");
  }

  // 1. Check if the *key* allows this project (Key Scope)
  if (!verifyProjectAccess(auth, projectId)) {
    return createErrorResponse(403, "Not authorized for this project");
  }

  // 2. Call internal query to check if the *user* allows this project and fetch data
  // internal.issues.queries.listIssuesInternal handles the user RBAC check
  const issues = await ctx.runQuery(internal.issues.queries.listIssuesInternal, {
    projectId,
    userId: auth.userId,
  });

  return createSuccessResponse({ data: issues });
}
