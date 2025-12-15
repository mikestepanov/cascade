/**
 * Batch Fetch Helpers
 *
 * Utilities for batch-fetching related data to avoid N+1 query patterns.
 * Use these instead of fetching inside loops or Promise.all maps.
 *
 * @example
 * // ❌ BAD: N+1 pattern
 * const enriched = await Promise.all(items.map(async (item) => {
 *   const user = await ctx.db.get(item.userId);
 *   return { ...item, userName: user?.name };
 * }));
 *
 * // ✅ GOOD: Batch pattern
 * const userMap = await batchFetchUsers(ctx, items.map(i => i.userId));
 * const enriched = items.map(item => ({
 *   ...item,
 *   userName: getUserName(userMap.get(item.userId))
 * }));
 */

import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

// ============================================================================
// BATCH FETCH FUNCTIONS
// ============================================================================

/**
 * Batch fetch users by ID
 * Returns a Map for O(1) lookups
 */
export async function batchFetchUsers(
  ctx: QueryCtx,
  userIds: (Id<"users"> | undefined)[],
): Promise<Map<Id<"users">, Doc<"users">>> {
  const uniqueIds = [...new Set(userIds.filter((id): id is Id<"users"> => !!id))];
  if (uniqueIds.length === 0) return new Map();

  const users = await Promise.all(uniqueIds.map((id) => ctx.db.get(id)));
  return new Map(users.filter((u): u is Doc<"users"> => u !== null).map((u) => [u._id, u]));
}

/**
 * Batch fetch issues by ID
 */
export async function batchFetchIssues(
  ctx: QueryCtx,
  issueIds: (Id<"issues"> | undefined)[],
): Promise<Map<Id<"issues">, Doc<"issues">>> {
  const uniqueIds = [...new Set(issueIds.filter((id): id is Id<"issues"> => !!id))];
  if (uniqueIds.length === 0) return new Map();

  const issues = await Promise.all(uniqueIds.map((id) => ctx.db.get(id)));
  return new Map(issues.filter((i): i is Doc<"issues"> => i !== null).map((i) => [i._id, i]));
}

/**
 * Batch fetch workspaces by ID
 */
export async function batchFetchWorkspaces(
  ctx: QueryCtx,
  workspaceIds: (Id<"workspaces"> | undefined)[],
): Promise<Map<Id<"workspaces">, Doc<"workspaces">>> {
  const uniqueIds = [...new Set(workspaceIds.filter((id): id is Id<"workspaces"> => !!id))];
  if (uniqueIds.length === 0) return new Map();

  const workspaces = await Promise.all(uniqueIds.map((id) => ctx.db.get(id)));
  return new Map(
    workspaces.filter((w): w is Doc<"workspaces"> => w !== null).map((w) => [w._id, w]),
  );
}

/**
 * Batch fetch calendar events by ID
 */
export async function batchFetchCalendarEvents(
  ctx: QueryCtx,
  eventIds: (Id<"calendarEvents"> | undefined)[],
): Promise<Map<Id<"calendarEvents">, Doc<"calendarEvents">>> {
  const uniqueIds = [...new Set(eventIds.filter((id): id is Id<"calendarEvents"> => !!id))];
  if (uniqueIds.length === 0) return new Map();

  const events = await Promise.all(uniqueIds.map((id) => ctx.db.get(id)));
  return new Map(
    events.filter((e): e is Doc<"calendarEvents"> => e !== null).map((e) => [e._id, e]),
  );
}

/**
 * Batch fetch teams by ID
 */
export async function batchFetchTeams(
  ctx: QueryCtx,
  teamIds: (Id<"teams"> | undefined)[],
): Promise<Map<Id<"teams">, Doc<"teams">>> {
  const uniqueIds = [...new Set(teamIds.filter((id): id is Id<"teams"> => !!id))];
  if (uniqueIds.length === 0) return new Map();

  const teams = await Promise.all(uniqueIds.map((id) => ctx.db.get(id)));
  return new Map(teams.filter((t): t is Doc<"teams"> => t !== null).map((t) => [t._id, t]));
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Format user for API response
 */
export function formatUser(user: Doc<"users"> | undefined | null) {
  if (!user) return null;
  return {
    _id: user._id,
    name: user.name || user.email || "Unknown",
    email: user.email,
    image: user.image,
  };
}

/**
 * Get user name with fallback
 */
export function getUserName(user: Doc<"users"> | undefined | null): string {
  return user?.name || user?.email || "Unknown";
}

/**
 * Format workspace/project for API response
 */
export function formatWorkspace(workspace: Doc<"workspaces"> | undefined | null) {
  if (!workspace) return null;
  return {
    _id: workspace._id,
    name: workspace.name,
    key: workspace.key,
  };
}

/**
 * Format issue for API response (minimal)
 */
export function formatIssueMinimal(issue: Doc<"issues"> | undefined | null) {
  if (!issue) return null;
  return {
    _id: issue._id,
    key: issue.key,
    title: issue.title,
  };
}
