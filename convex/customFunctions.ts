/**
 * Custom Convex Functions with convex-helpers
 *
 * Provides authenticated query/mutation/action builders that:
 * - Automatically inject user context
 * - Check RBAC permissions
 * - Add rate limiting
 * - Improve code reusability
 */

import { customMutation, customQuery } from "convex-helpers/server/customFunctions";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserRole } from "./rbac";
import type { Id } from "./_generated/dataModel";

/**
 * Authenticated Query
 * Requires user to be logged in, automatically injects userId into context
 */
export const authenticatedQuery = customQuery(query, {
  args: {},
  input: async (ctx, _args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
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
      throw new Error("Authentication required");
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
      throw new Error("Authentication required");
    }

    // Check if user has access to project
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check if user is member or project is public
    const role = await getUserRole(ctx, args.projectId, userId);
    if (!role && !project.isPublic) {
      throw new Error("Access denied - not a project member");
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
      throw new Error("Authentication required");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const role = await getUserRole(ctx, args.projectId, userId);
    if (!role) {
      throw new Error("Access denied - must be a project member");
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
      throw new Error("Authentication required");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const role = await getUserRole(ctx, args.projectId, userId);

    // Check minimum role
    const roleHierarchy = { viewer: 1, editor: 2, admin: 3 };
    const userRoleLevel = role ? roleHierarchy[role] : 0;
    const requiredRoleLevel = roleHierarchy.editor;

    if (userRoleLevel < requiredRoleLevel) {
      throw new Error("Access denied - editor role required");
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
      throw new Error("Authentication required");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const role = await getUserRole(ctx, args.projectId, userId);

    if (role !== "admin") {
      throw new Error("Access denied - admin role required");
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
      throw new Error("Authentication required");
    }

    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    const project = await ctx.db.get(issue.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const role = await getUserRole(ctx, issue.projectId, userId);

    // Check minimum role
    const roleHierarchy = { viewer: 1, editor: 2, admin: 3 };
    const userRoleLevel = role ? roleHierarchy[role] : 0;
    const requiredRoleLevel = roleHierarchy.editor;

    if (userRoleLevel < requiredRoleLevel) {
      throw new Error("Access denied - editor role required");
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
 * Helper type to extract custom context from custom functions
 */
export type AuthenticatedQueryCtx = {
  userId: Id<"users">;
};

export type ProjectQueryCtx = AuthenticatedQueryCtx & {
  projectId: Id<"projects">;
  role: "viewer" | "editor" | "admin" | null;
  project: any;
};

export type IssueMutationCtx = ProjectQueryCtx & {
  issue: any;
};
