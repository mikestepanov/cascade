/**
 * Organization Access Control Helpers
 *
 * This module provides organization-level access checks.
 * Separated from organizations.ts to avoid circular dependencies with customFunctions.
 */

import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Get user's role in an organization
 * Returns null if user is not a member
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
 * Check if user is organization admin (owner or admin role)
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
 * Check if user is organization member (any role)
 */
export async function isOrganizationMember(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
  userId: Id<"users">,
): Promise<boolean> {
  const role = await getOrganizationRole(ctx, organizationId, userId);
  return role !== null;
}
