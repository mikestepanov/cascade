import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { httpAction } from "../_generated/server";
import {
  checkRateLimit,
  createErrorResponse,
  createSuccessResponse,
  extractApiKey,
  hasScope,
  validateApiKey,
  verifyProjectAccess,
} from "../lib/apiAuth";

/**
 * REST API for Issues
 *
 * This is a simplified implementation - expand based on needs.
 * GET /api/issues?projectId=xxx - List issues
 * GET /api/issues/:key - Get single issue
 * POST /api/issues - Create issue
 * PATCH /api/issues/:key - Update issue
 */

// Note: Full implementation would require HTTP router setup
// This file shows the structure - actual routes registered in router.ts

export const handler = httpAction(async (ctx, request) => {
  const startTime = Date.now();
  const url = new URL(request.url);
  const method = request.method;

  try {
    // Authenticate
    const apiKey = extractApiKey(request.headers);
    if (!apiKey) return createErrorResponse(401, "Missing API key");

    const auth = await validateApiKey(ctx, apiKey);
    if (!auth) return createErrorResponse(401, "Invalid or expired API key");

    // Route based on method and path
    if (method === "GET" && url.pathname.endsWith("/api/issues")) {
      return await handleList(ctx, request, auth);
    }

    return createErrorResponse(404, "Not found");
  } catch (error) {
    console.error("API Error:", error);
    return createErrorResponse(500, "Internal server error");
  }
});

async function handleList(ctx: any, request: Request, auth: any) {
  if (!hasScope(auth, "issues:read")) {
    return createErrorResponse(403, "Missing scope: issues:read");
  }

  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId") as Id<"projects"> | null;

  if (!projectId) {
    return createErrorResponse(400, "projectId required");
  }

  if (!verifyProjectAccess(auth, projectId)) {
    return createErrorResponse(403, "Not authorized for this project");
  }

  const issues = await ctx.runQuery(api.issues.listByProject, { projectId });

  return createSuccessResponse({ data: issues });
}
