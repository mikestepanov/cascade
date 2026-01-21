/**
 * Custom Convex Functions with convex-helpers
 *
 * Provides authenticated query/mutation/action builders that:
 * - Automatically inject user context
 * - Check RBAC permissions
 * - Improve code reusability
 *
 * @module customFunctions
 * @see {@link https://www.npmjs.com/package/convex-helpers} convex-helpers documentation
 *
 * ## Architecture
 *
 * Functions are composed in layers, each building on the previous:
 *
 * ```
 * Layer 1: Base (authentication only)
 * └── authenticatedQuery / authenticatedMutation
 *
 * Layer 2: Organization-scoped (adds organization loading + role checks)
 * └── organizationQuery, organizationMemberMutation, organizationAdminMutation
 *
 * Layer 3: Workspace-scoped (adds workspace loading, checks workspace membership)
 * └── workspaceQuery, workspaceMemberMutation, workspaceEditorMutation, workspaceAdminMutation
 *
 * Layer 4: Team-scoped (adds team loading, checks team/org roles)
 * └── teamQuery, teamMemberMutation, teamLeadMutation
 *
 * Layer 5: Project-scoped (adds project loading + RBAC)
 * └── projectQuery, projectViewerMutation, projectEditorMutation, projectAdminMutation
 *
 * Layer 6: Entity-scoped (adds entity loading, derives project)
 * └── issueQuery, issueMutation, issueViewerMutation, sprintQuery, sprintMutation
 * ```
 *
 * ## Usage
 *
 * ```typescript
 * // For queries/mutations that just need authentication
 * import { authenticatedQuery, authenticatedMutation } from "./customFunctions";
 *
 * // For organization-scoped operations
 * import { organizationQuery, organizationMemberMutation, organizationAdminMutation } from "./customFunctions";
 *
 * // For workspace-scoped operations
 * import { workspaceQuery, workspaceMemberMutation, workspaceEditorMutation, workspaceAdminMutation } from "./customFunctions";
 *
 * // For team-scoped operations
 * import { teamQuery, teamMemberMutation, teamLeadMutation } from "./customFunctions";
 *
 * // For project-scoped operations with RBAC
 * import { projectQuery, projectViewerMutation, projectEditorMutation, projectAdminMutation } from "./customFunctions";
 *
 * // For issue-scoped operations
 * import { issueQuery, issueMutation, issueViewerMutation } from "./customFunctions";
 *
 * // For sprint-scoped operations
 * import { sprintQuery, sprintMutation } from "./customFunctions";
 * ```
 *
 * ## Role Hierarchy
 *
 * - `viewer` (1): Read-only access, can comment
 * - `editor` (2): Can create/edit/delete issues, sprints, documents
 * - `admin` (3): Full control including settings, members, workflow
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { customMutation, customQuery } from "convex-helpers/server/customFunctions";
import type { Doc, Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, type QueryCtx, query } from "./_generated/server";
import { forbidden, notFound, unauthenticated } from "./lib/errors";
import { getOrganizationRole, isOrganizationAdmin } from "./lib/organizationAccess";
import { getTeamRole } from "./lib/teamAccess";
import { getWorkspaceRole, isWorkspaceEditor } from "./lib/workspaceAccess";
import { getProjectRole } from "./projectAccess";

// =============================================================================
// Role Checking Helpers
// =============================================================================

const ROLE_HIERARCHY = { viewer: 1, editor: 2, admin: 3 } as const;
type Role = "viewer" | "editor" | "admin";

/**
 * Check if a role meets the minimum required role level.
 */
function hasMinimumRole(role: Role | null, requiredRole: Role): boolean {
  const userLevel = role ? ROLE_HIERARCHY[role] : 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole];
  return userLevel >= requiredLevel;
}

/**
 * Require a minimum role, throwing FORBIDDEN if not met.
 */
function requireMinimumRole(role: Role | null, requiredRole: Role): void {
  if (!hasMinimumRole(role, requiredRole)) {
    throw forbidden(requiredRole);
  }
}

// =============================================================================
// Layer 1: Base Authentication
// =============================================================================

/**
 * Authenticated Query - requires user to be logged in.
 *
 * Automatically injects `userId` into the context for use in the handler.
 *
 * @throws {ConvexError} UNAUTHENTICATED - If user is not logged in
 *
 * @example
 * ```typescript
 * export const getMyProfile = authenticatedQuery({
 *   args: {},
 *   handler: async (ctx) => {
 *     // ctx.userId is guaranteed to exist
 *     return await ctx.db.get(ctx.userId);
 *   },
 * });
 * ```
 */
export const authenticatedQuery = customQuery(query, {
  args: {},
  input: async (ctx, _args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw unauthenticated();
    }

    return {
      ctx: { ...ctx, userId },
      args: {},
    };
  },
});

/**
 * Authenticated Mutation - requires user to be logged in.
 *
 * Automatically injects `userId` into the context for use in the handler.
 *
 * @throws {ConvexError} UNAUTHENTICATED - If user is not logged in
 *
 * @example
 * ```typescript
 * export const updateProfile = authenticatedMutation({
 *   args: { name: v.string() },
 *   handler: async (ctx, args) => {
 *     await ctx.db.patch(ctx.userId, { name: args.name });
 *   },
 * });
 * ```
 */
export const authenticatedMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, _args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw unauthenticated();
    }

    return {
      ctx: { ...ctx, userId },
      args: {},
    };
  },
});

// =============================================================================
// Layer 2: Organization-Scoped
// =============================================================================

type OrganizationRole = "owner" | "admin" | "member";

/**
 * Check if a role meets the minimum required organization role level.
 */
function hasMinimumOrgRole(role: OrganizationRole | null, requiredRole: OrganizationRole): boolean {
  const ORG_ROLE_HIERARCHY = { member: 1, admin: 2, owner: 3 } as const;
  const userLevel = role ? ORG_ROLE_HIERARCHY[role] : 0;
  const requiredLevel = ORG_ROLE_HIERARCHY[requiredRole];
  return userLevel >= requiredLevel;
}

/**
 * Organization Query - requires membership in the organization.
 *
 * Builds on `authenticatedQuery`. Automatically loads the organization and checks
 * that the user is a member.
 *
 * Injects into context:
 * - `userId`: The authenticated user's ID
 * - `organizationId`: The organization ID from args
 * - `organizationRole`: The user's role in the organization (owner/admin/member)
 * - `organization`: The full organization document
 *
 * @throws {ConvexError} UNAUTHENTICATED - If user is not logged in
 * @throws {ConvexError} NOT_FOUND - If organization doesn't exist
 * @throws {ConvexError} FORBIDDEN - If user is not an organization member
 *
 * @example
 * ```typescript
 * export const getOrgStats = organizationQuery({
 *   args: {},
 *   handler: async (ctx) => {
 *     const workspaces = await ctx.db
 *       .query("workspaces")
 *       .withIndex("by_organization", q => q.eq("organizationId", ctx.organizationId))
 *       .collect();
 *     return { workspaceCount: workspaces.length };
 *   },
 * });
 * ```
 */
export const organizationQuery = customQuery(authenticatedQuery, {
  args: { organizationId: v.id("organizations") },
  input: async (ctx, args) => {
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw notFound("organization", args.organizationId);
    }

    const organizationRole = await getOrganizationRole(ctx, args.organizationId, ctx.userId);
    if (!organizationRole) {
      throw forbidden("member", "You must be an organization member to access this resource");
    }

    return {
      ctx: { ...ctx, organizationId: args.organizationId, organizationRole, organization },
      args: {},
    };
  },
});

/**
 * Organization Member Mutation - requires membership in the organization.
 *
 * Builds on `authenticatedMutation`. Use for operations where any organization
 * member should have access.
 *
 * @throws {ConvexError} UNAUTHENTICATED - If user is not logged in
 * @throws {ConvexError} NOT_FOUND - If organization doesn't exist
 * @throws {ConvexError} FORBIDDEN - If user is not an organization member
 *
 * @example
 * ```typescript
 * export const createTeam = organizationMemberMutation({
 *   args: { name: v.string() },
 *   handler: async (ctx, args) => {
 *     return await ctx.db.insert("teams", {
 *       organizationId: ctx.organizationId,
 *       name: args.name,
 *       createdBy: ctx.userId,
 *     });
 *   },
 * });
 * ```
 */
export const organizationMemberMutation = customMutation(authenticatedMutation, {
  args: { organizationId: v.id("organizations") },
  input: async (ctx, args) => {
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw notFound("organization", args.organizationId);
    }

    const organizationRole = await getOrganizationRole(ctx, args.organizationId, ctx.userId);
    if (!organizationRole) {
      throw forbidden("member", "You must be an organization member to perform this action");
    }

    return {
      ctx: { ...ctx, organizationId: args.organizationId, organizationRole, organization },
      args: {},
    };
  },
});

/**
 * Organization Admin Mutation - requires admin role (owner or admin) in the organization.
 *
 * Builds on `authenticatedMutation`. Use for operations that require administrative
 * control (managing workspaces, members, settings).
 *
 * @throws {ConvexError} UNAUTHENTICATED - If user is not logged in
 * @throws {ConvexError} NOT_FOUND - If organization doesn't exist
 * @throws {ConvexError} FORBIDDEN - If user is not an organization admin
 *
 * @example
 * ```typescript
 * export const createWorkspace = organizationAdminMutation({
 *   args: { name: v.string(), slug: v.string() },
 *   handler: async (ctx, args) => {
 *     return await ctx.db.insert("workspaces", {
 *       organizationId: ctx.organizationId,
 *       name: args.name,
 *       slug: args.slug,
 *       createdBy: ctx.userId,
 *     });
 *   },
 * });
 * ```
 */
export const organizationAdminMutation = customMutation(authenticatedMutation, {
  args: { organizationId: v.id("organizations") },
  input: async (ctx, args) => {
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw notFound("organization", args.organizationId);
    }

    const organizationRole = await getOrganizationRole(ctx, args.organizationId, ctx.userId);
    if (!hasMinimumOrgRole(organizationRole, "admin")) {
      throw forbidden("admin", "Only organization admins can perform this action");
    }

    return {
      ctx: { ...ctx, organizationId: args.organizationId, organizationRole, organization },
      args: {},
    };
  },
});

// =============================================================================
// Layer 3: Workspace-Scoped
// =============================================================================

/**
 * Workspace Query - requires membership in the parent organization.
 *
 * Builds on `authenticatedQuery`. Automatically loads the workspace and its
 * parent organization, checks that the user is an organization member.
 *
 * Injects into context:
 * - `userId`: The authenticated user's ID
 * - `workspaceId`: The workspace ID from args
 * - `workspace`: The full workspace document
 * - `organizationId`: The parent organization ID
 *
 * @throws {ConvexError} UNAUTHENTICATED - If user is not logged in
 * @throws {ConvexError} NOT_FOUND - If workspace doesn't exist
 * @throws {ConvexError} FORBIDDEN - If user is not an organization member
 *
 * @example
 * ```typescript
 * export const getWorkspaceTeams = workspaceQuery({
 *   args: {},
 *   handler: async (ctx) => {
 *     return await ctx.db
 *       .query("teams")
 *       .withIndex("by_workspace", q => q.eq("workspaceId", ctx.workspaceId))
 *       .collect();
 *   },
 * });
 * ```
 */
export const workspaceQuery = customQuery(authenticatedQuery, {
  args: { workspaceId: v.id("workspaces") },
  input: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw notFound("workspace", args.workspaceId);
    }

    const organizationRole = await getOrganizationRole(ctx, workspace.organizationId, ctx.userId);
    if (!organizationRole) {
      throw forbidden("member", "You must be an organization member to access this workspace");
    }

    // Organization admins/owners can access any workspace in the org
    const isOrgAdmin = organizationRole === "owner" || organizationRole === "admin";

    // Get workspace membership
    const workspaceRole = await getWorkspaceRole(ctx, args.workspaceId, ctx.userId);

    // User must be org admin OR workspace member
    if (!isOrgAdmin && !workspaceRole) {
      throw forbidden("member", "You must be a workspace member to access this workspace");
    }

    return {
      ctx: {
        ...ctx,
        workspaceId: args.workspaceId,
        workspace,
        organizationId: workspace.organizationId,
        organizationRole,
        workspaceRole,
        isOrgAdmin,
      },
      args: {},
    };
  },
});

/**
 * Workspace Admin Mutation - requires workspace admin or organization admin.
 *
 * Builds on `authenticatedMutation`. Use for operations that require admin
 * access to the workspace (managing settings, members, etc.).
 *
 * @throws {ConvexError} UNAUTHENTICATED - If user is not logged in
 * @throws {ConvexError} NOT_FOUND - If workspace doesn't exist
 * @throws {ConvexError} FORBIDDEN - If user is not a workspace admin or org admin
 *
 * @example
 * ```typescript
 * export const updateWorkspace = workspaceAdminMutation({
 *   args: { name: v.string() },
 *   handler: async (ctx, args) => {
 *     await ctx.db.patch(ctx.workspaceId, { name: args.name });
 *   },
 * });
 * ```
 */
export const workspaceAdminMutation = customMutation(authenticatedMutation, {
  args: { workspaceId: v.id("workspaces") },
  input: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw notFound("workspace", args.workspaceId);
    }

    const organizationRole = await getOrganizationRole(ctx, workspace.organizationId, ctx.userId);
    if (!organizationRole) {
      throw forbidden("member", "You must be an organization member");
    }

    const isOrgAdmin = hasMinimumOrgRole(organizationRole, "admin");
    const workspaceRole = await getWorkspaceRole(ctx, args.workspaceId, ctx.userId);

    // Require org admin OR workspace admin
    if (!isOrgAdmin && workspaceRole !== "admin") {
      throw forbidden("admin", "Only workspace admins or organization admins can perform this action");
    }

    return {
      ctx: {
        ...ctx,
        workspaceId: args.workspaceId,
        workspace,
        organizationId: workspace.organizationId,
        organizationRole,
        workspaceRole,
        isOrgAdmin,
      },
      args: {},
    };
  },
});

/**
 * Workspace Editor Mutation - requires editor access to the workspace.
 *
 * Builds on `authenticatedMutation`. Use for operations that create/edit
 * workspace-level content (documents, etc.).
 *
 * @throws {ConvexError} UNAUTHENTICATED - If user is not logged in
 * @throws {ConvexError} NOT_FOUND - If workspace doesn't exist
 * @throws {ConvexError} FORBIDDEN - If user doesn't have editor access
 *
 * @example
 * ```typescript
 * export const createDocument = workspaceEditorMutation({
 *   args: { title: v.string() },
 *   handler: async (ctx, args) => {
 *     return await ctx.db.insert("documents", { ... });
 *   },
 * });
 * ```
 */
export const workspaceEditorMutation = customMutation(authenticatedMutation, {
  args: { workspaceId: v.id("workspaces") },
  input: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw notFound("workspace", args.workspaceId);
    }

    const organizationRole = await getOrganizationRole(ctx, workspace.organizationId, ctx.userId);
    if (!organizationRole) {
      throw forbidden("member", "You must be an organization member");
    }

    const isOrgAdmin = hasMinimumOrgRole(organizationRole, "admin");
    const workspaceRole = await getWorkspaceRole(ctx, args.workspaceId, ctx.userId);

    // Require org admin OR workspace admin/editor
    const hasEditorAccess = workspaceRole === "admin" || workspaceRole === "editor";
    if (!isOrgAdmin && !hasEditorAccess) {
      throw forbidden("editor", "Only workspace editors can perform this action");
    }

    return {
      ctx: {
        ...ctx,
        workspaceId: args.workspaceId,
        workspace,
        organizationId: workspace.organizationId,
        organizationRole,
        workspaceRole,
        isOrgAdmin,
      },
      args: {},
    };
  },
});

/**
 * Workspace Member Mutation - requires membership in the workspace.
 *
 * Builds on `authenticatedMutation`. Use for operations that any workspace
 * member can perform.
 *
 * @throws {ConvexError} UNAUTHENTICATED - If user is not logged in
 * @throws {ConvexError} NOT_FOUND - If workspace doesn't exist
 * @throws {ConvexError} FORBIDDEN - If user is not a workspace member
 *
 * @example
 * ```typescript
 * export const viewDocument = workspaceMemberMutation({
 *   args: { documentId: v.id("documents") },
 *   handler: async (ctx, args) => {
 *     // Track view, etc.
 *   },
 * });
 * ```
 */
export const workspaceMemberMutation = customMutation(authenticatedMutation, {
  args: { workspaceId: v.id("workspaces") },
  input: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw notFound("workspace", args.workspaceId);
    }

    const organizationRole = await getOrganizationRole(ctx, workspace.organizationId, ctx.userId);
    if (!organizationRole) {
      throw forbidden("member", "You must be an organization member");
    }

    const isOrgAdmin = hasMinimumOrgRole(organizationRole, "admin");
    const workspaceRole = await getWorkspaceRole(ctx, args.workspaceId, ctx.userId);

    // Require org admin OR workspace member (any role)
    if (!isOrgAdmin && !workspaceRole) {
      throw forbidden("member", "You must be a workspace member to perform this action");
    }

    return {
      ctx: {
        ...ctx,
        workspaceId: args.workspaceId,
        workspace,
        organizationId: workspace.organizationId,
        organizationRole,
        workspaceRole,
        isOrgAdmin,
      },
      args: {},
    };
  },
});

// =============================================================================
// Layer 4: Team-Scoped
// =============================================================================

type TeamRole = "admin" | "member";

/**
 * Team Query - requires team membership or organization admin.
 *
 * Builds on `authenticatedQuery`. Automatically loads the team and checks
 * that the user is either a team member or an organization admin.
 *
 * Injects into context:
 * - `userId`: The authenticated user's ID
 * - `teamId`: The team ID from args
 * - `team`: The full team document
 * - `teamRole`: The user's role in the team (admin/member or null if org admin)
 * - `organizationId`: The parent organization ID
 *
 * @throws {ConvexError} UNAUTHENTICATED - If user is not logged in
 * @throws {ConvexError} NOT_FOUND - If team doesn't exist
 * @throws {ConvexError} FORBIDDEN - If user is not a team member or org admin
 *
 * @example
 * ```typescript
 * export const getTeamProjects = teamQuery({
 *   args: {},
 *   handler: async (ctx) => {
 *     return await ctx.db
 *       .query("projects")
 *       .withIndex("by_team", q => q.eq("teamId", ctx.teamId))
 *       .collect();
 *   },
 * });
 * ```
 */
export const teamQuery = customQuery(authenticatedQuery, {
  args: { teamId: v.id("teams") },
  input: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw notFound("team", args.teamId);
    }

    const teamRole = await getTeamRole(ctx, args.teamId, ctx.userId);
    const isOrgAdmin = await isOrganizationAdmin(ctx, team.organizationId, ctx.userId);

    if (!teamRole && !isOrgAdmin) {
      throw forbidden("member", "You must be a team member or organization admin to access this team");
    }

    return {
      ctx: {
        ...ctx,
        teamId: args.teamId,
        team,
        teamRole,
        organizationId: team.organizationId,
        isOrgAdmin,
      },
      args: {},
    };
  },
});

/**
 * Team Member Mutation - requires team membership.
 *
 * Builds on `authenticatedMutation`. Use for operations where any team member
 * should have access.
 *
 * @throws {ConvexError} UNAUTHENTICATED - If user is not logged in
 * @throws {ConvexError} NOT_FOUND - If team doesn't exist
 * @throws {ConvexError} FORBIDDEN - If user is not a team member
 *
 * @example
 * ```typescript
 * export const createProject = teamMemberMutation({
 *   args: { name: v.string() },
 *   handler: async (ctx, args) => {
 *     return await ctx.db.insert("projects", {
 *       teamId: ctx.teamId,
 *       name: args.name,
 *     });
 *   },
 * });
 * ```
 */
export const teamMemberMutation = customMutation(authenticatedMutation, {
  args: { teamId: v.id("teams") },
  input: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw notFound("team", args.teamId);
    }

    const teamRole = await getTeamRole(ctx, args.teamId, ctx.userId);
    const isOrgAdmin = await isOrganizationAdmin(ctx, team.organizationId, ctx.userId);

    if (!teamRole && !isOrgAdmin) {
      throw forbidden("member", "You must be a team member to perform this action");
    }

    return {
      ctx: {
        ...ctx,
        teamId: args.teamId,
        team,
        teamRole,
        organizationId: team.organizationId,
        isOrgAdmin,
      },
      args: {},
    };
  },
});

/**
 * Team Admin Mutation - requires team admin role or organization admin.
 *
 * Builds on `authenticatedMutation`. Use for operations that require team
 * management permissions (adding/removing members, updating team settings).
 *
 * @throws {ConvexError} UNAUTHENTICATED - If user is not logged in
 * @throws {ConvexError} NOT_FOUND - If team doesn't exist
 * @throws {ConvexError} FORBIDDEN - If user is not a team admin or org admin
 *
 * @example
 * ```typescript
 * export const updateTeamSettings = teamLeadMutation({
 *   args: { isPrivate: v.boolean() },
 *   handler: async (ctx, args) => {
 *     await ctx.db.patch(ctx.teamId, { isPrivate: args.isPrivate });
 *   },
 * });
 * ```
 */
export const teamLeadMutation = customMutation(authenticatedMutation, {
  args: { teamId: v.id("teams") },
  input: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw notFound("team", args.teamId);
    }

    const teamRole = await getTeamRole(ctx, args.teamId, ctx.userId);
    const isOrgAdmin = await isOrganizationAdmin(ctx, team.organizationId, ctx.userId);

    if (teamRole !== "admin" && !isOrgAdmin) {
      throw forbidden("admin", "Only team admins or organization admins can perform this action");
    }

    return {
      ctx: {
        ...ctx,
        teamId: args.teamId,
        team,
        teamRole,
        organizationId: team.organizationId,
        isOrgAdmin,
      },
      args: {},
    };
  },
});

// =============================================================================
// Layer 5: Project-Scoped with RBAC
// =============================================================================

/**
 * Project Query - requires viewer role or public project access.
 *
 * Builds on `authenticatedQuery`. Automatically loads the project and checks permissions.
 * Injects into context:
 * - `userId`: The authenticated user's ID (from authenticatedQuery)
 * - `projectId`: The project ID from args
 * - `role`: The user's role in the project (viewer/editor/admin or null)
 * - `project`: The full project document
 *
 * @throws {ConvexError} UNAUTHENTICATED - If user is not logged in
 * @throws {ConvexError} NOT_FOUND - If project doesn't exist
 * @throws {ConvexError} FORBIDDEN - If user lacks access and project is not public
 *
 * @example
 * ```typescript
 * export const getProjectStats = projectQuery({
 *   args: {},
 *   handler: async (ctx) => {
 *     // ctx.project and ctx.role are available
 *     const issues = await ctx.db
 *       .query("issues")
 *       .withIndex("by_project", q => q.eq("projectId", ctx.projectId))
 *       .collect();
 *     return { issueCount: issues.length, role: ctx.role };
 *   },
 * });
 * ```
 */
export const projectQuery = customQuery(authenticatedQuery, {
  args: { projectId: v.id("projects") },
  input: async (ctx, args) => {
    // ctx.userId available from authenticatedQuery
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw notFound("project", args.projectId);
    }

    const role = await getProjectRole(ctx, args.projectId, ctx.userId);
    if (!(role || project.isPublic)) {
      throw forbidden();
    }

    return {
      ctx: { ...ctx, projectId: args.projectId, role, project },
      args: {},
    };
  },
});

/**
 * Project Viewer Mutation - requires viewer role or higher on a project.
 *
 * Builds on `authenticatedMutation`. Use for operations where any project member
 * should have access.
 *
 * @throws {ConvexError} UNAUTHENTICATED - If user is not logged in
 * @throws {ConvexError} NOT_FOUND - If project doesn't exist
 * @throws {ConvexError} FORBIDDEN - If user is not a project member
 *
 * @example
 * ```typescript
 * export const addBookmark = projectViewerMutation({
 *   args: { issueId: v.id("issues") },
 *   handler: async (ctx, args) => {
 *     await ctx.db.insert("bookmarks", {
 *       userId: ctx.userId,
 *       projectId: ctx.projectId,
 *       issueId: args.issueId,
 *     });
 *   },
 * });
 * ```
 */
export const projectViewerMutation = customMutation(authenticatedMutation, {
  args: { projectId: v.id("projects") },
  input: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw notFound("project", args.projectId);
    }

    const role = await getProjectRole(ctx, args.projectId, ctx.userId);
    requireMinimumRole(role, "viewer");

    return {
      ctx: { ...ctx, projectId: args.projectId, role, project },
      args: {},
    };
  },
});

/**
 * Project Editor Mutation - requires editor role or higher on a project.
 *
 * Builds on `authenticatedMutation`. Use for operations that modify project content
 * (issues, sprints, documents).
 *
 * @throws {ConvexError} UNAUTHENTICATED - If user is not logged in
 * @throws {ConvexError} NOT_FOUND - If project doesn't exist
 * @throws {ConvexError} FORBIDDEN - If user role is below editor
 *
 * @example
 * ```typescript
 * export const createIssue = projectEditorMutation({
 *   args: { title: v.string() },
 *   handler: async (ctx, args) => {
 *     return await ctx.db.insert("issues", {
 *       projectId: ctx.projectId,
 *       title: args.title,
 *       createdBy: ctx.userId,
 *     });
 *   },
 * });
 * ```
 */
export const projectEditorMutation = customMutation(authenticatedMutation, {
  args: { projectId: v.id("projects") },
  input: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw notFound("project", args.projectId);
    }

    const role = await getProjectRole(ctx, args.projectId, ctx.userId);
    requireMinimumRole(role, "editor");

    return {
      ctx: { ...ctx, projectId: args.projectId, role, project },
      args: {},
    };
  },
});

/**
 * Project Admin Mutation - requires admin role on a project.
 *
 * Builds on `authenticatedMutation`. Use for operations that require full project
 * control (settings, members, workflow, deletion).
 *
 * @throws {ConvexError} UNAUTHENTICATED - If user is not logged in
 * @throws {ConvexError} NOT_FOUND - If project doesn't exist
 * @throws {ConvexError} FORBIDDEN - If user role is below admin
 *
 * @example
 * ```typescript
 * export const updateProjectSettings = projectAdminMutation({
 *   args: { settings: v.object({ ... }) },
 *   handler: async (ctx, args) => {
 *     await ctx.db.patch(ctx.projectId, { settings: args.settings });
 *   },
 * });
 * ```
 */
export const projectAdminMutation = customMutation(authenticatedMutation, {
  args: { projectId: v.id("projects") },
  input: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw notFound("project", args.projectId);
    }

    const role = await getProjectRole(ctx, args.projectId, ctx.userId);
    requireMinimumRole(role, "admin");

    return {
      ctx: { ...ctx, projectId: args.projectId, role, project },
      args: {},
    };
  },
});

// =============================================================================
// Layer 6: Entity-Scoped (Issue, Sprint)
// =============================================================================

/**
 * Issue Mutation - requires editor role to modify issues.
 *
 * Builds on `authenticatedMutation`. Automatically loads the issue and its parent
 * project, checks permissions. Use for operations that modify a specific issue.
 *
 * Injects into context:
 * - `userId`: The authenticated user's ID
 * - `projectId`: The issue's project ID (derived from issue)
 * - `role`: The user's role in the project
 * - `project`: The full project document
 * - `issue`: The full issue document
 *
 * @throws {ConvexError} UNAUTHENTICATED - If user is not logged in
 * @throws {ConvexError} NOT_FOUND - If issue or project doesn't exist
 * @throws {ConvexError} FORBIDDEN - If user role is below editor
 *
 * @example
 * ```typescript
 * export const updateIssue = issueMutation({
 *   args: { title: v.optional(v.string()) },
 *   handler: async (ctx, args) => {
 *     // ctx.issue is the loaded issue
 *     if (args.title) {
 *       await ctx.db.patch(ctx.issue._id, { title: args.title });
 *     }
 *   },
 * });
 * ```
 */
export const issueMutation = customMutation(authenticatedMutation, {
  args: { issueId: v.id("issues") },
  input: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw notFound("issue", args.issueId);
    }

    const project = await ctx.db.get(issue.projectId);
    if (!project) {
      throw notFound("project", issue.projectId);
    }

    const role = await getProjectRole(ctx, issue.projectId, ctx.userId);
    requireMinimumRole(role, "editor");

    return {
      ctx: { ...ctx, projectId: issue.projectId, role, project, issue },
      args: {},
    };
  },
});

/**
 * Issue Viewer Mutation - requires viewer role for issue access.
 *
 * Builds on `authenticatedMutation`. Use for operations where any project member
 * should have access (e.g., commenting, watching).
 *
 * @throws {ConvexError} UNAUTHENTICATED - If user is not logged in
 * @throws {ConvexError} NOT_FOUND - If issue or project doesn't exist
 * @throws {ConvexError} FORBIDDEN - If user is not a project member
 *
 * @example
 * ```typescript
 * export const addComment = issueViewerMutation({
 *   args: { content: v.string() },
 *   handler: async (ctx, args) => {
 *     return await ctx.db.insert("issueComments", {
 *       issueId: ctx.issue._id,
 *       authorId: ctx.userId,
 *       content: args.content,
 *     });
 *   },
 * });
 * ```
 */
export const issueViewerMutation = customMutation(authenticatedMutation, {
  args: { issueId: v.id("issues") },
  input: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw notFound("issue", args.issueId);
    }

    const project = await ctx.db.get(issue.projectId);
    if (!project) {
      throw notFound("project", issue.projectId);
    }

    const role = await getProjectRole(ctx, issue.projectId, ctx.userId);
    requireMinimumRole(role, "viewer");

    return {
      ctx: { ...ctx, projectId: issue.projectId, role, project, issue },
      args: {},
    };
  },
});

/**
 * Issue Query - requires viewer role or public project access.
 *
 * Builds on `authenticatedQuery`. Automatically loads the issue and its parent project.
 *
 * Injects into context:
 * - `userId`: The authenticated user's ID
 * - `projectId`: The issue's project ID (derived from issue)
 * - `role`: The user's role in the project
 * - `project`: The full project document
 * - `issue`: The full issue document
 *
 * @throws {ConvexError} UNAUTHENTICATED - If user is not logged in
 * @throws {ConvexError} NOT_FOUND - If issue or project doesn't exist
 * @throws {ConvexError} FORBIDDEN - If user lacks access and project is not public
 *
 * @example
 * ```typescript
 * export const getIssueAttachments = issueQuery({
 *   args: {},
 *   handler: async (ctx) => {
 *     return ctx.issue.attachments ?? [];
 *   },
 * });
 * ```
 */
export const issueQuery = customQuery(authenticatedQuery, {
  args: { issueId: v.id("issues") },
  input: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw notFound("issue", args.issueId);
    }

    const project = await ctx.db.get(issue.projectId);
    if (!project) {
      throw notFound("project", issue.projectId);
    }

    const role = await getProjectRole(ctx, issue.projectId, ctx.userId);
    if (!(role || project.isPublic)) {
      throw forbidden();
    }

    return {
      ctx: { ...ctx, projectId: issue.projectId, role, project, issue },
      args: {},
    };
  },
});

/**
 * Sprint Query - requires viewer role or public project access.
 *
 * Builds on `authenticatedQuery`. Automatically loads the sprint and its parent project.
 *
 * Injects into context:
 * - `userId`: The authenticated user's ID
 * - `projectId`: The sprint's project ID (derived from sprint)
 * - `role`: The user's role in the project
 * - `project`: The full project document
 * - `sprint`: The full sprint document
 *
 * @throws {ConvexError} UNAUTHENTICATED - If user is not logged in
 * @throws {ConvexError} NOT_FOUND - If sprint or project doesn't exist
 * @throws {ConvexError} FORBIDDEN - If user lacks access and project is not public
 *
 * @example
 * ```typescript
 * export const getSprintIssues = sprintQuery({
 *   args: {},
 *   handler: async (ctx) => {
 *     const issues = await ctx.db
 *       .query("issues")
 *       .withIndex("by_sprint", q => q.eq("sprintId", ctx.sprint._id))
 *       .collect();
 *     return issues;
 *   },
 * });
 * ```
 */
export const sprintQuery = customQuery(authenticatedQuery, {
  args: { sprintId: v.id("sprints") },
  input: async (ctx, args) => {
    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) {
      throw notFound("sprint", args.sprintId);
    }

    const project = await ctx.db.get(sprint.projectId);
    if (!project) {
      throw notFound("project", sprint.projectId);
    }

    const role = await getProjectRole(ctx, sprint.projectId, ctx.userId);
    if (!(role || project.isPublic)) {
      throw forbidden();
    }

    return {
      ctx: { ...ctx, projectId: sprint.projectId, role, project, sprint },
      args: {},
    };
  },
});

/**
 * Sprint Mutation - requires editor role to modify sprints.
 *
 * Builds on `authenticatedMutation`. Automatically loads the sprint and its parent
 * project, checks permissions.
 *
 * @throws {ConvexError} UNAUTHENTICATED - If user is not logged in
 * @throws {ConvexError} NOT_FOUND - If sprint or project doesn't exist
 * @throws {ConvexError} FORBIDDEN - If user role is below editor
 *
 * @example
 * ```typescript
 * export const updateSprintGoal = sprintMutation({
 *   args: { goal: v.string() },
 *   handler: async (ctx, args) => {
 *     await ctx.db.patch(ctx.sprint._id, { goal: args.goal });
 *   },
 * });
 * ```
 */
export const sprintMutation = customMutation(authenticatedMutation, {
  args: { sprintId: v.id("sprints") },
  input: async (ctx, args) => {
    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) {
      throw notFound("sprint", args.sprintId);
    }

    const project = await ctx.db.get(sprint.projectId);
    if (!project) {
      throw notFound("project", sprint.projectId);
    }

    const role = await getProjectRole(ctx, sprint.projectId, ctx.userId);
    requireMinimumRole(role, "editor");

    return {
      ctx: { ...ctx, projectId: sprint.projectId, role, project, sprint },
      args: {},
    };
  },
});

// =============================================================================
// Context Types
// =============================================================================
// These types represent the enhanced context provided by each custom function.
// Use them to type your handler functions for better IDE support.

/**
 * Base context type for authenticated queries/mutations.
 * Contains the authenticated user's ID.
 */
export type AuthenticatedQueryCtx = {
  userId: Id<"users">;
};

/**
 * Context type for `organizationQuery`.
 * Includes organization data and the user's role.
 */
export type OrganizationQueryCtx = QueryCtx &
  AuthenticatedQueryCtx & {
    organizationId: Id<"organizations">;
    organizationRole: "owner" | "admin" | "member";
    organization: Doc<"organizations">;
  };

/**
 * Context type for organization mutations (member/admin).
 * Same as OrganizationQueryCtx but with MutationCtx.
 */
export type OrganizationMutationCtx = MutationCtx &
  AuthenticatedQueryCtx & {
    organizationId: Id<"organizations">;
    organizationRole: "owner" | "admin" | "member";
    organization: Doc<"organizations">;
  };

/**
 * Context type for `workspaceQuery`.
 * Includes workspace data, roles, and the parent organization ID.
 */
export type WorkspaceQueryCtx = QueryCtx &
  AuthenticatedQueryCtx & {
    workspaceId: Id<"workspaces">;
    workspace: Doc<"workspaces">;
    organizationId: Id<"organizations">;
    organizationRole: "owner" | "admin" | "member";
    workspaceRole: "admin" | "editor" | "member" | null;
    isOrgAdmin: boolean;
  };

/**
 * Context type for workspace mutations.
 * Same as WorkspaceQueryCtx but with MutationCtx.
 */
export type WorkspaceMutationCtx = MutationCtx &
  AuthenticatedQueryCtx & {
    workspaceId: Id<"workspaces">;
    workspace: Doc<"workspaces">;
    organizationId: Id<"organizations">;
    organizationRole: "owner" | "admin" | "member";
    workspaceRole: "admin" | "editor" | "member" | null;
    isOrgAdmin: boolean;
  };

/**
 * Context type for `teamQuery`.
 * Includes team data and roles.
 */
export type TeamQueryCtx = QueryCtx &
  AuthenticatedQueryCtx & {
    teamId: Id<"teams">;
    team: Doc<"teams">;
    teamRole: "admin" | "member" | null;
    organizationId: Id<"organizations">;
    isOrgAdmin: boolean;
  };

/**
 * Context type for team mutations (member/admin).
 * Same as TeamQueryCtx but with MutationCtx.
 */
export type TeamMutationCtx = MutationCtx &
  AuthenticatedQueryCtx & {
    teamId: Id<"teams">;
    team: Doc<"teams">;
    teamRole: "admin" | "member" | null;
    organizationId: Id<"organizations">;
    isOrgAdmin: boolean;
  };

/**
 * Context type for `projectQuery` and role-based project mutations.
 * Includes project data and the user's role.
 */
export type ProjectQueryCtx = QueryCtx &
  AuthenticatedQueryCtx & {
    projectId: Id<"projects">;
    role: "viewer" | "editor" | "admin" | null;
    project: Doc<"projects">;
  };

/**
 * Context type for project mutations (viewer/editor/admin).
 * Same as ProjectQueryCtx but with MutationCtx.
 */
export type ProjectMutationCtx = MutationCtx &
  AuthenticatedQueryCtx & {
    projectId: Id<"projects">;
    role: "viewer" | "editor" | "admin" | null;
    project: Doc<"projects">;
  };

/**
 * Context type for `issueQuery`.
 * Includes issue data in addition to project context.
 */
export type IssueQueryCtx = QueryCtx &
  AuthenticatedQueryCtx & {
    projectId: Id<"projects">;
    role: "viewer" | "editor" | "admin" | null;
    project: Doc<"projects">;
    issue: Doc<"issues">;
  };

/**
 * Context type for `issueMutation` and `issueViewerMutation`.
 * Includes issue data in addition to project context.
 */
export type IssueMutationCtx = MutationCtx &
  AuthenticatedQueryCtx & {
    projectId: Id<"projects">;
    role: "viewer" | "editor" | "admin" | null;
    project: Doc<"projects">;
    issue: Doc<"issues">;
  };

/**
 * Context type for `sprintQuery`.
 * Includes sprint data in addition to project context.
 */
export type SprintQueryCtx = QueryCtx &
  AuthenticatedQueryCtx & {
    projectId: Id<"projects">;
    role: "viewer" | "editor" | "admin" | null;
    project: Doc<"projects">;
    sprint: Doc<"sprints">;
  };

/**
 * Context type for `sprintMutation`.
 * Includes sprint data in addition to project context.
 */
export type SprintMutationCtx = MutationCtx &
  AuthenticatedQueryCtx & {
    projectId: Id<"projects">;
    role: "viewer" | "editor" | "admin" | null;
    project: Doc<"projects">;
    sprint: Doc<"sprints">;
  };
