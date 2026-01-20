/**
 * Team Access Control Helpers
 *
 * This module provides team-level access checks.
 * Separated from teams.ts to avoid circular dependencies with customFunctions.
 */

import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Retrieve the role of a user within a team.
 *
 * @returns `'lead'` if the user is a team lead, `'member'` if the user is a team member, `null` if the user is not a member of the team
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
 * Determine whether a user is the lead of a team.
 *
 * @returns `true` if the user is the lead of the specified team, `false` otherwise.
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
 * Determines whether a user is a member of a specified team.
 *
 * @returns `true` if the user is a member of the team, `false` otherwise.
 */
export async function isTeamMember(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  userId: Id<"users">,
): Promise<boolean> {
  const role = await getTeamRole(ctx, teamId, userId);
  return role !== null;
}