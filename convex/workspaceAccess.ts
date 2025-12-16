import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { isCompanyAdmin } from "./companies";
import { getTeamRole } from "./teams";

// ============================================================================
// Workspace Access Control Helpers
// ============================================================================

/**
 * Check company-level access permissions
 */
async function checkCompanyAccess(
  ctx: QueryCtx | MutationCtx,
  workspace: Doc<"workspaces">,
  userId: Id<"users">,
): Promise<boolean> {
  const companyId = workspace.companyId;
  if (!companyId) return false;

  // 1. Company admin has full access
  const isAdmin = await isCompanyAdmin(ctx, companyId, userId);
  if (isAdmin) return true;

  // 2. Company-visible workspace (isPublic=true) + user is company member
  if (workspace.isPublic) {
    const companyMembership = await ctx.db
      .query("companyMembers")
      .withIndex("by_company_user", (q) => q.eq("companyId", companyId).eq("userId", userId))
      .first();

    if (companyMembership) return true;
  }

  return false;
}

/**
 * Check team-level access permissions
 */
async function checkTeamAccess(
  ctx: QueryCtx | MutationCtx,
  workspace: Doc<"workspaces">,
  userId: Id<"users">,
): Promise<boolean> {
  // 1. User is member of owning team
  if (workspace.teamId) {
    const teamRole = await getTeamRole(ctx, workspace.teamId, userId);
    if (teamRole) return true;
  }

  // 2. User is member of shared team
  if (workspace.sharedWithTeamIds) {
    for (const sharedTeamId of workspace.sharedWithTeamIds) {
      const teamRole = await getTeamRole(ctx, sharedTeamId, userId);
      if (teamRole) return true;
    }
  }

  return false;
}

/**
 * Check direct user access (Owner, Creator, Collaborator)
 */
async function checkDirectAccess(
  ctx: QueryCtx | MutationCtx,
  workspace: Doc<"workspaces">,
  userId: Id<"users">,
): Promise<boolean> {
  // 1. User owns the workspace
  if (workspace.ownerId === userId) return true;

  // 2. Legacy: creator has access
  if (workspace.createdBy === userId) return true;

  // 3. User is individual collaborator (workspaceMembers)
  const workspaceMembership = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_workspace_user", (q) => q.eq("workspaceId", workspace._id).eq("userId", userId))
    .first();

  if (workspaceMembership) return true;

  return false;
}

/**
 * Check if user can access a workspace (read access)
 *
 * Access is granted if ANY of the following are true:
 * 1. User is company admin
 * 2. Workspace is company-visible (isPublic=true) AND user is company member
 * 3. User owns the workspace (ownerId)
 * 4. User is member of team that owns the workspace (teamId)
 * 5. User is in workspaceMembers (individual collaborator)
 * 6. User is member of a team in sharedWithTeamIds
 */
export async function canAccessWorkspace(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">,
  userId: Id<"users">,
): Promise<boolean> {
  const workspace = await ctx.db.get(workspaceId);
  if (!workspace) return false;

  // Check access levels in order of specificity: direct, then team, then company
  if (await checkDirectAccess(ctx, workspace, userId)) return true;
  if (await checkTeamAccess(ctx, workspace, userId)) return true;
  if (await checkCompanyAccess(ctx, workspace, userId)) return true;

  return false;
}

/**
 * Check if user can edit a workspace (write access)
 *
 * Edit access is granted if ANY of the following are true:
 * 1. User is company admin
 * 2. User owns the workspace (ownerId)
 * 3. User is member of team that owns the workspace (teamId)
 * 4. User is admin or editor in workspaceMembers
 */
export async function canEditWorkspace(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">,
  userId: Id<"users">,
): Promise<boolean> {
  const workspace = await ctx.db.get(workspaceId);
  if (!workspace) return false;

  // 1. Company admin has full access (if workspace belongs to company)
  if (workspace.companyId) {
    const isAdmin = await isCompanyAdmin(ctx, workspace.companyId, userId);
    if (isAdmin) return true;
  }

  // 2. User owns the workspace
  if (workspace.ownerId === userId) return true;

  // Legacy: creator has edit access
  if (workspace.createdBy === userId) return true;

  // 3. User is member of owning team
  if (workspace.teamId) {
    const teamRole = await getTeamRole(ctx, workspace.teamId, userId);
    if (teamRole) return true;
  }

  // 4. User is admin or editor in workspaceMembers
  const workspaceMembership = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_workspace_user", (q) => q.eq("workspaceId", workspaceId).eq("userId", userId))
    .first();

  if (
    workspaceMembership &&
    (workspaceMembership.role === "admin" || workspaceMembership.role === "editor")
  ) {
    return true;
  }

  return false;
}

/**
 * Check if user is workspace admin (can manage settings, members, delete)
 *
 * Admin access is granted if ANY of the following are true:
 * 1. User is company admin
 * 2. User owns the workspace (ownerId)
 * 3. User is team lead of owning team (teamId)
 * 4. User is admin in workspaceMembers
 */
export async function isWorkspaceAdmin(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">,
  userId: Id<"users">,
): Promise<boolean> {
  const workspace = await ctx.db.get(workspaceId);
  if (!workspace) return false;

  // 1. Company admin has full access (if workspace belongs to company)
  if (workspace.companyId) {
    const isAdmin = await isCompanyAdmin(ctx, workspace.companyId, userId);
    if (isAdmin) return true;
  }

  // 2. User owns the workspace
  if (workspace.ownerId === userId) return true;

  // 3. Legacy: creator has admin access (backward compatibility)
  if (workspace.createdBy === userId) return true;

  // 4. User is team lead of owning team
  if (workspace.teamId) {
    const teamRole = await getTeamRole(ctx, workspace.teamId, userId);
    if (teamRole === "lead") return true;
  }

  // 5. User is admin in workspaceMembers
  const workspaceMembership = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_workspace_user", (q) => q.eq("workspaceId", workspaceId).eq("userId", userId))
    .first();

  if (workspaceMembership && workspaceMembership.role === "admin") {
    return true;
  }

  return false;
}

/**
 * Assert user can access workspace
 */
export async function assertCanAccessWorkspace(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">,
  userId: Id<"users">,
): Promise<void> {
  const canAccess = await canAccessWorkspace(ctx, workspaceId, userId);
  if (!canAccess) {
    throw new Error("You don't have permission to access this workspace");
  }
}

/**
 * Assert user can edit workspace
 */
export async function assertCanEditWorkspace(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">,
  userId: Id<"users">,
): Promise<void> {
  const canEdit = await canEditWorkspace(ctx, workspaceId, userId);
  if (!canEdit) {
    throw new Error("You don't have permission to edit this workspace");
  }
}

/**
 * Assert user is workspace admin
 */
export async function assertIsWorkspaceAdmin(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">,
  userId: Id<"users">,
): Promise<void> {
  const isAdmin = await isWorkspaceAdmin(ctx, workspaceId, userId);
  if (!isAdmin) {
    throw new Error("Only workspace admins can perform this action");
  }
}

/**
 * Get user's effective role in a workspace
 * Returns the highest privilege level
 */
export async function getWorkspaceRole(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<"workspaces">,
  userId: Id<"users">,
): Promise<"admin" | "editor" | "viewer" | null> {
  const workspace = await ctx.db.get(workspaceId);
  if (!workspace) return null;

  // Check if can access at all
  const canAccess = await canAccessWorkspace(ctx, workspaceId, userId);
  if (!canAccess) return null;

  // Check admin level
  const isAdmin = await isWorkspaceAdmin(ctx, workspaceId, userId);
  if (isAdmin) return "admin";

  // Check editor level
  const canEdit = await canEditWorkspace(ctx, workspaceId, userId);
  if (canEdit) return "editor";

  // Has read-only access
  return "viewer";
}

// Legacy aliases for backward compatibility (deprecated)
export const canAccessProject = canAccessWorkspace;
export const canEditProject = canEditWorkspace;
export const isProjectAdmin = isWorkspaceAdmin;
export const assertCanAccessProject = assertCanAccessWorkspace;
export const assertCanEditProject = assertCanEditWorkspace;
export const assertIsProjectAdmin = assertIsWorkspaceAdmin;
export const getProjectRole = getWorkspaceRole;
