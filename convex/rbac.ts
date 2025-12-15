/**
 * RBAC (Role-Based Access Control) utilities for Nixelo
 *
 * Most access control functions are now in workspaceAccess.ts.
 * This file contains utility functions for role hierarchy checks.
 *
 * Roles hierarchy: viewer < editor < admin
 */

export type ProjectRole = "admin" | "editor" | "viewer";

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
