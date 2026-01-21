/**
 * Organization Access Control Helpers
 *
 * This module provides organization-level access checks.
 * Separated from organizations.ts to avoid circular dependencies with customFunctions.
 */

import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Retrieve a user's role within an organization.
 *
 * @returns The user's role — `owner`, `admin`, or `member` — if they belong to the organization, `null` otherwise.
 */
export async function getOrganizationRole(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
  userId: Id<"users">,
): Promise<"owner" | "admin" | "member" | null> {
  const membership = await ctx.db
    .query("organizationMembers")
    .withIndex("by_organization_user", (q) =>
      q.eq("organizationId", organizationId).eq("userId", userId),
    )
    .first();

  return membership?.role ?? null;
}

/**
 * Determine whether a user has an owner or admin role within an organization.
 *
 * @returns `true` if the user has role `"owner"` or `"admin"` in the organization, `false` otherwise.
 */
export async function isOrganizationAdmin(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
  userId: Id<"users">,
): Promise<boolean> {
  const role = await getOrganizationRole(ctx, organizationId, userId);
  return role === "owner" || role === "admin";
}

/**
 * Determines whether a user is a member of the specified organization.
 *
 * @returns `true` if the user has any role in the organization, `false` otherwise.
 */
export async function isOrganizationMember(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
  userId: Id<"users">,
): Promise<boolean> {
  const role = await getOrganizationRole(ctx, organizationId, userId);
  return role !== null;
}
