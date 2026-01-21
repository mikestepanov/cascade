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
 * Layer 2: Project-scoped (adds project loading + RBAC)
 * └── projectQuery, viewerMutation, editorMutation, adminMutation
 *
 * Layer 3: Entity-scoped (adds entity loading, derives project)
 * └── issueMutation, issueViewerMutation, sprintQuery, sprintMutation
 * ```
 *
 * ## Usage
 *
 * ```typescript
 * // For queries/mutations that just need authentication
 * import { authenticatedQuery, authenticatedMutation } from "./customFunctions";
 *
 * // For project-scoped operations with RBAC
 * import { projectQuery, viewerMutation, editorMutation, adminMutation } from "./customFunctions";
 *
 * // For issue-scoped operations
 * import { issueMutation, issueViewerMutation } from "./customFunctions";
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
// Layer 2: Project-Scoped with RBAC
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

    const { getProjectRole } = await import("./projectAccess");
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
 * Viewer Mutation - requires viewer role or higher.
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
 * export const addBookmark = viewerMutation({
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
export const viewerMutation = customMutation(authenticatedMutation, {
  args: { projectId: v.id("projects") },
  input: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw notFound("project", args.projectId);
    }

    const { getProjectRole } = await import("./projectAccess");
    const role = await getProjectRole(ctx, args.projectId, ctx.userId);
    requireMinimumRole(role, "viewer");

    return {
      ctx: { ...ctx, projectId: args.projectId, role, project },
      args: {},
    };
  },
});

/**
 * Editor Mutation - requires editor role or higher.
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
 * export const createIssue = editorMutation({
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
export const editorMutation = customMutation(authenticatedMutation, {
  args: { projectId: v.id("projects") },
  input: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw notFound("project", args.projectId);
    }

    const { getProjectRole } = await import("./projectAccess");
    const role = await getProjectRole(ctx, args.projectId, ctx.userId);
    requireMinimumRole(role, "editor");

    return {
      ctx: { ...ctx, projectId: args.projectId, role, project },
      args: {},
    };
  },
});

/**
 * Admin Mutation - requires admin role.
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
 * export const updateProjectSettings = adminMutation({
 *   args: { settings: v.object({ ... }) },
 *   handler: async (ctx, args) => {
 *     await ctx.db.patch(ctx.projectId, { settings: args.settings });
 *   },
 * });
 * ```
 */
export const adminMutation = customMutation(authenticatedMutation, {
  args: { projectId: v.id("projects") },
  input: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw notFound("project", args.projectId);
    }

    const { getProjectRole } = await import("./projectAccess");
    const role = await getProjectRole(ctx, args.projectId, ctx.userId);
    requireMinimumRole(role, "admin");

    return {
      ctx: { ...ctx, projectId: args.projectId, role, project },
      args: {},
    };
  },
});

// =============================================================================
// Layer 3: Entity-Scoped (Issue, Sprint)
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

    const { getProjectRole } = await import("./projectAccess");
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

    const { getProjectRole } = await import("./projectAccess");
    const role = await getProjectRole(ctx, issue.projectId, ctx.userId);
    requireMinimumRole(role, "viewer");

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

    const { getProjectRole } = await import("./projectAccess");
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

    const { getProjectRole } = await import("./projectAccess");
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
