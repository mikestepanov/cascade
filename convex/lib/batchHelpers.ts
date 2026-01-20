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

import { pruneNull } from "convex-helpers";
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
  return new Map(pruneNull(users).map((u) => [u._id, u]));
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
  return new Map(pruneNull(issues).map((i) => [i._id, i]));
}

/**
 * Batch fetch projects by ID
 */
export async function batchFetchProjects(
  ctx: QueryCtx,
  projectIds: (Id<"projects"> | undefined)[],
): Promise<Map<Id<"projects">, Doc<"projects">>> {
  const uniqueIds = [...new Set(projectIds.filter((id): id is Id<"projects"> => !!id))];
  if (uniqueIds.length === 0) return new Map();

  const projects = await Promise.all(uniqueIds.map((id) => ctx.db.get(id)));
  return new Map(pruneNull(projects).map((p) => [p._id, p]));
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
  return new Map(pruneNull(events).map((e) => [e._id, e]));
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
  return new Map(pruneNull(teams).map((t) => [t._id, t]));
}

/**
 * Batch fetch organizations by ID
 */
export async function batchFetchOrganizations(
  ctx: QueryCtx,
  organizationIds: (Id<"organizations"> | undefined)[],
): Promise<Map<Id<"organizations">, Doc<"organizations">>> {
  const uniqueIds = [...new Set(organizationIds.filter((id): id is Id<"organizations"> => !!id))];
  if (uniqueIds.length === 0) return new Map();

  const organizations = await Promise.all(uniqueIds.map((id) => ctx.db.get(id)));
  return new Map(pruneNull(organizations).map((o) => [o._id, o]));
}

/**
 * Batch fetch sprints by ID
 */
export async function batchFetchSprints(
  ctx: QueryCtx,
  sprintIds: (Id<"sprints"> | undefined)[],
): Promise<Map<Id<"sprints">, Doc<"sprints">>> {
  const uniqueIds = [...new Set(sprintIds.filter((id): id is Id<"sprints"> => !!id))];
  if (uniqueIds.length === 0) return new Map();

  const sprints = await Promise.all(uniqueIds.map((id) => ctx.db.get(id)));
  return new Map(pruneNull(sprints).map((s) => [s._id, s]));
}

/**
 * Batch fetch booking pages by ID
 */
export async function batchFetchBookingPages(
  ctx: QueryCtx,
  pageIds: (Id<"bookingPages"> | undefined)[],
): Promise<Map<Id<"bookingPages">, Doc<"bookingPages">>> {
  const uniqueIds = [...new Set(pageIds.filter((id): id is Id<"bookingPages"> => !!id))];
  if (uniqueIds.length === 0) return new Map();

  const pages = await Promise.all(uniqueIds.map((id) => ctx.db.get(id)));
  return new Map(pruneNull(pages).map((p) => [p._id, p]));
}

/**
 * Batch fetch documents by ID
 */
export async function batchFetchDocuments(
  ctx: QueryCtx,
  docIds: (Id<"documents"> | undefined)[],
): Promise<Map<Id<"documents">, Doc<"documents">>> {
  const uniqueIds = [...new Set(docIds.filter((id): id is Id<"documents"> => !!id))];
  if (uniqueIds.length === 0) return new Map();

  const docs = await Promise.all(uniqueIds.map((id) => ctx.db.get(id)));
  return new Map(pruneNull(docs).map((d) => [d._id, d]));
}

/**
 * Batch fetch custom fields by ID
 */
export async function batchFetchCustomFields(
  ctx: QueryCtx,
  fieldIds: (Id<"customFields"> | undefined)[],
): Promise<Map<Id<"customFields">, Doc<"customFields">>> {
  const uniqueIds = [...new Set(fieldIds.filter((id): id is Id<"customFields"> => !!id))];
  if (uniqueIds.length === 0) return new Map();

  const fields = await Promise.all(uniqueIds.map((id) => ctx.db.get(id)));
  return new Map(pruneNull(fields).map((f) => [f._id, f]));
}

/**
 * Batch fetch recordings by ID
 */
export async function batchFetchRecordings(
  ctx: QueryCtx,
  recordingIds: (Id<"meetingRecordings"> | undefined)[],
): Promise<Map<Id<"meetingRecordings">, Doc<"meetingRecordings">>> {
  const uniqueIds = [...new Set(recordingIds.filter((id): id is Id<"meetingRecordings"> => !!id))];
  if (uniqueIds.length === 0) return new Map();

  const recordings = await Promise.all(uniqueIds.map((id) => ctx.db.get(id)));
  return new Map(pruneNull(recordings).map((r) => [r._id, r]));
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
 * Format project/project for API response
 */
export function formatProject(project: Doc<"projects"> | undefined | null) {
  if (!project) return null;
  return {
    _id: project._id,
    name: project.name,
    key: project.key,
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
