/**
 * RBAC (Role-Based Access Control) utilities for Nixelo
 *
 * @deprecated Most functions in this file are replaced by projectAccess.ts
 * Use projectAccess.ts for comprehensive access control with teams and companies.
 * This file is kept for backward compatibility and utility functions.
 *
 * Roles:
 * - admin: Full control - manage settings, members, delete project
 * - editor: Can create/edit/delete issues, sprints, documents
 * - viewer: Read-only access
 */

import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import * as ProjectAccess from "./workspaceAccess";

export type ProjectRole = "admin" | "editor" | "viewer";

/**
 * Get user's role in a project
 * @deprecated Use getProjectRole from projectAccess.ts for comprehensive team/company support
 * This is kept for backward compatibility
 */
export async function getUserRole(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">,
  userId: Id<"users">,
): Promise<ProjectRole | null> {
  // Delegate to new access control system
  return await ProjectAccess.getProjectRole(ctx, workspaceId, userId);
}

/**
 * Check if user has at least the specified role
 * Roles hierarchy: viewer < editor < admin
 */
export function hasMinimumRole(userRole: ProjectRole | null, requiredRole: ProjectRole): boolean {
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
 * @deprecated Use canAccessProject from projectAccess.ts for comprehensive team/company support
 * This is kept for backward compatibility
 */
export async function canAccessProject(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">,
  userId: Id<"users"> | null,
): Promise<boolean> {
  if (!userId) {
    // For unauthenticated users, check if project is public
    const project = await ctx.db.get(workspaceId);
    return project?.isPublic ?? false;
  }

  // Delegate to new access control system
  return await ProjectAccess.canAccessProject(ctx, workspaceId, userId);
}

/**
 * Check if user can edit in project (editor or admin)
 * @deprecated Use canEditProject from projectAccess.ts for comprehensive team/company support
 * This is kept for backward compatibility
 */
export async function canEditProject(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">,
  userId: Id<"users">,
): Promise<boolean> {
  // Delegate to new access control system
  return await ProjectAccess.canEditProject(ctx, workspaceId, userId);
}

/**
 * Check if user can manage project (admin only)
 * @deprecated Use isProjectAdmin from projectAccess.ts for comprehensive team/company support
 * This is kept for backward compatibility
 */
export async function canManageProject(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">,
  userId: Id<"users">,
): Promise<boolean> {
  // Delegate to new access control system
  return await ProjectAccess.isProjectAdmin(ctx, workspaceId, userId);
}

/**
 * Assert user has minimum role, throw error if not
 * @deprecated Use assertCanEditProject or assertIsProjectAdmin from projectAccess.ts
 * This is kept for backward compatibility
 */
export async function assertMinimumRole(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">,
  userId: Id<"users"> | null,
  requiredRole: ProjectRole,
): Promise<void> {
  if (!userId) {
    throw new Error("Not authenticated");
  }

  // Use new access control assertions
  if (requiredRole === "admin") {
    await ProjectAccess.assertIsProjectAdmin(ctx, workspaceId, userId);
  } else if (requiredRole === "editor") {
    await ProjectAccess.assertCanEditProject(ctx, workspaceId, userId);
  } else {
    // viewer level - just check access
    await ProjectAccess.assertCanAccessProject(ctx, workspaceId, userId);
  }
}
