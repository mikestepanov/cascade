import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { isCompanyAdmin } from "./companies";
import { getTeamRole } from "./teams";

// ============================================================================
// Project Access Control Helpers
// ============================================================================

/**
 * Check company-level access permissions
 */
async function checkCompanyAccess(
  ctx: QueryCtx | MutationCtx,
  project: Doc<"projects">,
  userId: Id<"users">,
): Promise<boolean> {
  const companyId = project.companyId;
  if (!companyId) return false;

  // 1. Company admin has full access
  const isAdmin = await isCompanyAdmin(ctx, companyId, userId);
  if (isAdmin) return true;

  // 2. Company-visible project (isPublic=true) + user is company member
  if (project.isPublic) {
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
  project: Doc<"projects">,
  userId: Id<"users">,
): Promise<boolean> {
  // 1. User is member of owning team
  if (project.teamId) {
    const teamRole = await getTeamRole(ctx, project.teamId, userId);
    if (teamRole) return true;
  }

  // 2. User is member of shared team
  if (project.sharedWithTeamIds) {
    for (const sharedTeamId of project.sharedWithTeamIds) {
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
  project: Doc<"projects">,
  userId: Id<"users">,
): Promise<boolean> {
  // 1. User owns the project
  if (project.ownerId === userId) return true;

  // 2. Legacy: creator has access
  if (project.createdBy === userId) return true;

  // 3. User is individual collaborator (projectMembers)
  const projectMembership = await ctx.db
    .query("projectMembers")
    .withIndex("by_workspace_user", (q) => q.eq("projectId", project._id).eq("userId", userId))
    .first();

  if (projectMembership) return true;

  return false;
}

/**
 * Check if user can access a project (read access)
 *
 * Access is granted if ANY of the following are true:
 * 1. User is company admin
 * 2. Project is company-visible (isPublic=true) AND user is company member
 * 3. User owns the project (ownerId)
 * 4. User is member of team that owns the project (teamId)
 * 5. User is in projectMembers (individual collaborator)
 * 6. User is member of a team in sharedWithTeamIds
 */
export async function canAccessWorkspace(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
): Promise<boolean> {
  const project = await ctx.db.get(projectId);
  if (!project) return false;

  // Check access levels in order of specificity: direct, then team, then company
  if (await checkDirectAccess(ctx, project, userId)) return true;
  if (await checkTeamAccess(ctx, project, userId)) return true;
  if (await checkCompanyAccess(ctx, project, userId)) return true;

  return false;
}

/**
 * Check if user can edit a project (write access)
 *
 * Edit access is granted if ANY of the following are true:
 * 1. User is company admin
 * 2. User owns the project (ownerId)
 * 3. User is member of team that owns the project (teamId)
 * 4. User is admin or editor in projectMembers
 */
export async function canEditWorkspace(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
): Promise<boolean> {
  const project = await ctx.db.get(projectId);
  if (!project) return false;

  // 1. Company admin has full access (if project belongs to company)
  if (project.companyId) {
    const isAdmin = await isCompanyAdmin(ctx, project.companyId, userId);
    if (isAdmin) return true;
  }

  // 2. User owns the project
  if (project.ownerId === userId) return true;

  // Legacy: creator has edit access
  if (project.createdBy === userId) return true;

  // 3. User is member of owning team
  if (project.teamId) {
    const teamRole = await getTeamRole(ctx, project.teamId, userId);
    if (teamRole) return true;
  }

  // 4. User is admin or editor in projectMembers
  const projectMembership = await ctx.db
    .query("projectMembers")
    .withIndex("by_workspace_user", (q) => q.eq("projectId", projectId).eq("userId", userId))
    .first();

  if (
    projectMembership &&
    (projectMembership.role === "admin" || projectMembership.role === "editor")
  ) {
    return true;
  }

  return false;
}

/**
 * Check if user is project admin (can manage settings, members, delete)
 *
 * Admin access is granted if ANY of the following are true:
 * 1. User is company admin
 * 2. User owns the project (ownerId)
 * 3. User is team lead of owning team (teamId)
 * 4. User is admin in projectMembers
 */
export async function isWorkspaceAdmin(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
): Promise<boolean> {
  const project = await ctx.db.get(projectId);
  if (!project) return false;

  // 1. Company admin has full access (if project belongs to company)
  if (project.companyId) {
    const isAdmin = await isCompanyAdmin(ctx, project.companyId, userId);
    if (isAdmin) return true;
  }

  // 2. User owns the project
  if (project.ownerId === userId) return true;

  // 3. Legacy: creator has admin access (backward compatibility)
  if (project.createdBy === userId) return true;

  // 4. User is team lead of owning team
  if (project.teamId) {
    const teamRole = await getTeamRole(ctx, project.teamId, userId);
    if (teamRole === "lead") return true;
  }

  // 5. User is admin in projectMembers
  const projectMembership = await ctx.db
    .query("projectMembers")
    .withIndex("by_workspace_user", (q) => q.eq("projectId", projectId).eq("userId", userId))
    .first();

  if (projectMembership && projectMembership.role === "admin") {
    return true;
  }

  return false;
}

/**
 * Assert user can access project
 */
export async function assertCanAccessWorkspace(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
): Promise<void> {
  const canAccess = await canAccessWorkspace(ctx, projectId, userId);
  if (!canAccess) {
    throw new Error("You don't have permission to access this project");
  }
}

/**
 * Assert user can edit project
 */
export async function assertCanEditWorkspace(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
): Promise<void> {
  const canEdit = await canEditWorkspace(ctx, projectId, userId);
  if (!canEdit) {
    throw new Error("You don't have permission to edit this project");
  }
}

/**
 * Assert user is project admin
 */
export async function assertIsWorkspaceAdmin(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
): Promise<void> {
  const isAdmin = await isWorkspaceAdmin(ctx, projectId, userId);
  if (!isAdmin) {
    throw new Error("Only project admins can perform this action");
  }
}

/**
 * Get user's effective role in a project
 * Returns the highest privilege level
 */
export async function getWorkspaceRole(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
): Promise<"admin" | "editor" | "viewer" | null> {
  const project = await ctx.db.get(projectId);
  if (!project) return null;

  // Check if can access at all
  const canAccess = await canAccessWorkspace(ctx, projectId, userId);
  if (!canAccess) return null;

  // Check admin level
  const isAdmin = await isWorkspaceAdmin(ctx, projectId, userId);
  if (isAdmin) return "admin";

  // Check editor level
  const canEdit = await canEditWorkspace(ctx, projectId, userId);
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
