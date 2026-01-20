/**
 * Custom Convex Functions with convex-helpers
 *
 * Provides authenticated query/mutation/action builders that:
 * - Automatically inject user context
 * - Check RBAC permissions
 * - Add rate limiting
 * - Improve code reusability
 *
 * @module customFunctions
 * @see {@link https://www.npmjs.com/package/convex-helpers} convex-helpers documentation
 *
 * ## Usage
 *
 * Import the appropriate custom function based on your needs:
 *
 * ```typescript
 * // For queries/mutations that just need authentication
 * import { authenticatedQuery, authenticatedMutation } from "./customFunctions";
 *
 * // For project-scoped operations with RBAC
 * import { projectQuery, viewerMutation, editorMutation } from "./customFunctions";
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
import { getProjectRole } from "./projectAccess";

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

/**
 * Project Query - requires viewer role or public project access.
 *
 * Automatically loads the project and checks permissions. Injects into context:
 * - `userId`: The authenticated user's ID
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
export const projectQuery = customQuery(query, {
  args: { projectId: v.id("projects") },
  input: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw unauthenticated();
    }

    // Check if user has access to project
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw notFound("project", args.projectId);
    }

    // Check if user is member or project is public
    const role = await getProjectRole(ctx, args.projectId, userId);
    if (!(role || project.isPublic)) {
      throw forbidden();
    }

    return {
      ctx: { ...ctx, userId, projectId: args.projectId, role, project },
      args: {},
    };
  },
});

/**
 * Viewer Mutation - requires viewer role or higher.
 *
 * Use for operations where any project member should have access.
 * Injects same context as `projectQuery`.
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
export const viewerMutation = customMutation(mutation, {
  args: { projectId: v.id("projects") },
  input: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw unauthenticated();
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw notFound("project", args.projectId);
    }

    const role = await getProjectRole(ctx, args.projectId, userId);
    if (!role) {
      throw forbidden("viewer");
    }

    return {
      ctx: { ...ctx, userId, projectId: args.projectId, role, project },
      args: {},
    };
  },
});

/**
 * Editor Mutation - requires editor role or higher.
 *
 * Use for operations that modify project content (issues, sprints, documents).
 * Injects same context as `projectQuery`.
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
export const editorMutation = customMutation(mutation, {
  args: { projectId: v.id("projects") },
  input: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw unauthenticated();
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw notFound("project", args.projectId);
    }

    const role = await getProjectRole(ctx, args.projectId, userId);

    // Check minimum role
    const roleHierarchy = { viewer: 1, editor: 2, admin: 3 };
    const userRoleLevel = role ? roleHierarchy[role] : 0;
    const requiredRoleLevel = roleHierarchy.editor;

    if (userRoleLevel < requiredRoleLevel) {
      throw forbidden("editor");
    }

    return {
      ctx: { ...ctx, userId, projectId: args.projectId, role, project },
      args: {},
    };
  },
});

/**
 * Issue Mutation - requires editor role to modify issues.
 *
 * Automatically loads the issue and its parent project, checks permissions.
 * Injects into context:
 * - `userId`, `projectId`, `role`, `project` (same as projectQuery)
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
export const issueMutation = customMutation(mutation, {
  args: { issueId: v.id("issues") },
  input: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw unauthenticated();
    }

    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw notFound("issue", args.issueId);
    }

    // Issues always belong to projects now
    const project = await ctx.db.get(issue.projectId);
    if (!project) {
      throw notFound("project", issue.projectId);
    }

    // Get role from project (handles both team and workspace-level projects)
    const role = await getProjectRole(ctx, issue.projectId, userId);

    // Check minimum role (editor required for issueMutation)
    const roleHierarchy = { viewer: 1, editor: 2, admin: 3 };
    const userRoleLevel = role ? roleHierarchy[role] : 0;
    const requiredRoleLevel = roleHierarchy.editor;

    if (userRoleLevel < requiredRoleLevel) {
      throw forbidden("editor");
    }

    return {
      ctx: {
        ...ctx,
        userId,
        projectId: issue.projectId,
        role,
        project,
        issue,
      },
      args: {},
    };
  },
});

/**
 * Issue Viewer Mutation - requires viewer role for issue access.
 *
 * Use for operations where any project member should have access (e.g., commenting).
 * Injects same context as `issueMutation`.
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
export const issueViewerMutation = customMutation(mutation, {
  args: { issueId: v.id("issues") },
  input: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw unauthenticated();
    }

    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw notFound("issue", args.issueId);
    }

    // Issues always belong to projects now
    const project = await ctx.db.get(issue.projectId);
    if (!project) {
      throw notFound("project", issue.projectId);
    }

    // Get role from project (handles both team and workspace-level projects)
    const role = await getProjectRole(ctx, issue.projectId, userId);

    // Check minimum role (viewer or higher)
    if (!role) {
      throw forbidden("viewer");
    }

    return {
      ctx: {
        ...ctx,
        userId,
        projectId: issue.projectId,
        role,
        project,
        issue,
      },
      args: {},
    };
  },
});

/**
 * Sprint Query - requires viewer role or public project access.
 *
 * Automatically loads the sprint and its parent project. Injects into context:
 * - `userId`, `projectId`, `role`, `project` (same as projectQuery)
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
export const sprintQuery = customQuery(query, {
  args: { sprintId: v.id("sprints") },
  input: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw unauthenticated();
    }

    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) {
      throw notFound("sprint", args.sprintId);
    }

    // Sprints always belong to projects
    const project = await ctx.db.get(sprint.projectId);
    if (!project) {
      throw notFound("project", sprint.projectId);
    }

    // Check if user is member or project is public
    const role = await getProjectRole(ctx, sprint.projectId, userId);
    if (!(role || project.isPublic)) {
      throw forbidden();
    }

    return {
      ctx: {
        ...ctx,
        userId,
        projectId: sprint.projectId,
        role,
        project,
        sprint,
      },
      args: {},
    };
  },
});

/**
 * Sprint Mutation - requires editor role to modify sprints.
 *
 * Automatically loads the sprint and its parent project, checks permissions.
 * Injects same context as `sprintQuery`.
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
export const sprintMutation = customMutation(mutation, {
  args: { sprintId: v.id("sprints") },
  input: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw unauthenticated();
    }

    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) {
      throw notFound("sprint", args.sprintId);
    }

    // Sprints always belong to projects
    const project = await ctx.db.get(sprint.projectId);
    if (!project) {
      throw notFound("project", sprint.projectId);
    }

    // Get role from project
    const role = await getProjectRole(ctx, sprint.projectId, userId);

    // Check minimum role (editor required for sprint mutations)
    const roleHierarchy = { viewer: 1, editor: 2, admin: 3 };
    const userRoleLevel = role ? roleHierarchy[role] : 0;
    const requiredRoleLevel = roleHierarchy.editor;

    if (userRoleLevel < requiredRoleLevel) {
      throw forbidden("editor");
    }

    return {
      ctx: {
        ...ctx,
        userId,
        projectId: sprint.projectId,
        role,
        project,
        sprint,
      },
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
