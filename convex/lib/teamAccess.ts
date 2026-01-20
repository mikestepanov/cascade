/**
 * Team Access Control Helpers
 *
 * This module provides team-level access checks.
 * Separated from teams.ts to avoid circular dependencies with customFunctions.
 */

import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Get user's role in a team
 * Returns null if user is not a member
 */
export async function getTeamRole(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  userId: Id<"users">,
): Promise<"lead" | "member" | null> {
  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_team_user", (q) => q.eq("teamId", teamId).eq("userId", userId))
    .first();

  return membership?.role ?? null;
}

/**
 * Check if user is team lead
 */
export async function isTeamLead(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  userId: Id<"users">,
): Promise<boolean> {
  const role = await getTeamRole(ctx, teamId, userId);
  return role === "lead";
}

/**
 * Check if user is a team member (any role)
 */
export async function isTeamMember(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  userId: Id<"users">,
): Promise<boolean> {
  const role = await getTeamRole(ctx, teamId, userId);
  return role !== null;
}
