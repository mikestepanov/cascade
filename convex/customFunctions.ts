/**
 * Custom Convex Functions with convex-helpers
 *
 * Provides authenticated query/mutation/action builders that:
 * - Automatically inject user context
 * - Check RBAC permissions
 * - Add rate limiting
 * - Improve code reusability
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { customMutation, customQuery } from "convex-helpers/server/customFunctions";
import type { Doc, Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, type QueryCtx, query } from "./_generated/server";
import { forbidden, notFound, unauthenticated } from "./lib/errors";
import { getProjectRole } from "./projectAccess";

/**
 * Authenticated Query
 * Requires user to be logged in, automatically injects userId into context
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
 * Authenticated Mutation
 * Requires user to be logged in, automatically injects userId into context
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
 * Project Query with automatic permission checking
 * Requires viewer role or higher
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
 * Project Mutation with viewer role requirement
 * User must be at least a viewer
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
 * Project Mutation with editor role requirement
 * User must be at least an editor
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
 * Project Mutation with admin role requirement
 * User must be an admin
 */
export const adminMutation = customMutation(mutation, {
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

    if (role !== "admin") {
      throw forbidden("admin");
    }

    return {
      ctx: { ...ctx, userId, projectId: args.projectId, role, project },
      args: {},
    };
  },
});

/**
 * Issue Mutation - automatically loads issue and checks project permissions
 * Requires editor role or higher
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
 * Issue Viewer Mutation - automatically loads issue and checks viewer access
 * Requires viewer role or higher (any project member can use this)
 * Use for operations like commenting where viewers should have access
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
 * Team Query - automatically checks team membership
 * Requires user to be a member of the team
 */
export const teamQuery = customQuery(query, {
  args: { teamId: v.id("teams") },
  input: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw unauthenticated();
    }

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw notFound("team", args.teamId);
    }

    // Check team membership
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q) => q.eq("teamId", args.teamId).eq("userId", userId))
      .first();

    if (!membership || membership.isDeleted) {
      throw forbidden("team member");
    }

    return {
      ctx: {
        ...ctx,
        userId,
        teamId: args.teamId,
        team,
        membership,
      },
      args: {},
    };
  },
});

/**
 * Sprint Query - automatically loads sprint and checks project access
 * Requires viewer role or higher (or public project)
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
 * Sprint Mutation - automatically loads sprint and checks project permissions
 * Requires editor role or higher
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

/**
 * Helper type to extract custom context from custom functions
 */
export type AuthenticatedQueryCtx = {
  userId: Id<"users">;
};

export type ProjectQueryCtx = QueryCtx &
  AuthenticatedQueryCtx & {
    projectId: Id<"projects">;
    role: "viewer" | "editor" | "admin" | null;
    project: Doc<"projects">;
  };

export type IssueMutationCtx = MutationCtx &
  AuthenticatedQueryCtx & {
    projectId: Id<"projects">;
    role: "viewer" | "editor" | "admin" | null;
    project: Doc<"projects">;
    issue: Doc<"issues">;
  };

export type TeamQueryCtx = QueryCtx &
  AuthenticatedQueryCtx & {
    teamId: Id<"teams">;
    team: Doc<"teams">;
    membership: Doc<"teamMembers">;
  };

export type SprintQueryCtx = QueryCtx &
  AuthenticatedQueryCtx & {
    projectId: Id<"projects">;
    role: "viewer" | "editor" | "admin" | null;
    project: Doc<"projects">;
    sprint: Doc<"sprints">;
  };

export type SprintMutationCtx = MutationCtx &
  AuthenticatedQueryCtx & {
    projectId: Id<"projects">;
    role: "viewer" | "editor" | "admin" | null;
    project: Doc<"projects">;
    sprint: Doc<"sprints">;
  };
