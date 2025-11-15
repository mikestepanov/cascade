/**
 * RBAC (Role-Based Access Control) utilities for Cascade
 *
 * Roles:
 * - admin: Full control - manage settings, members, delete project
 * - editor: Can create/edit/delete issues, sprints, documents
 * - viewer: Read-only access
 */

import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export type ProjectRole = "admin" | "editor" | "viewer";

/**
 * Get user's role in a project
 */
export async function getUserRole(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">
): Promise<ProjectRole | null> {
  const project = await ctx.db.get(projectId);
  if (!project) return null;

  // Creator is always admin
  if (project.createdBy === userId) {
    return "admin";
  }

  // Check projectMembers table
  const membership = await ctx.db
    .query("projectMembers")
    .withIndex("by_project_user", (q) =>
      q.eq("projectId", projectId).eq("userId", userId)
    )
    .first();

  return membership?.role || null;
}

/**
 * Check if user has at least the specified role
 * Roles hierarchy: viewer < editor < admin
 */
export function hasMinimumRole(
  userRole: ProjectRole | null,
  requiredRole: ProjectRole
): boolean {
  if (!userRole) return false;

  const roleHierarchy: Record<ProjectRole, number> = {
    viewer: 1,
    editor: 2,
    admin: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Check if user can access project (any role or public)
 */
export async function canAccessProject(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users"> | null
): Promise<boolean> {
  const project = await ctx.db.get(projectId);
  if (!project) return false;

  // Public projects are accessible to everyone
  if (project.isPublic) return true;

  // Must be authenticated for private projects
  if (!userId) return false;

  // Check if user has any role
  const role = await getUserRole(ctx, projectId, userId);
  return role !== null;
}

/**
 * Check if user can edit in project (editor or admin)
 */
export async function canEditProject(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">
): Promise<boolean> {
  const role = await getUserRole(ctx, projectId, userId);
  return hasMinimumRole(role, "editor");
}

/**
 * Check if user can manage project (admin only)
 */
export async function canManageProject(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">
): Promise<boolean> {
  const role = await getUserRole(ctx, projectId, userId);
  return hasMinimumRole(role, "admin");
}

/**
 * Assert user has minimum role, throw error if not
 */
export async function assertMinimumRole(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users"> | null,
  requiredRole: ProjectRole
): Promise<void> {
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const role = await getUserRole(ctx, projectId, userId);
  if (!hasMinimumRole(role, requiredRole)) {
    throw new Error(
      `Insufficient permissions. Required role: ${requiredRole}, your role: ${role || "none"}`
    );
  }
}
