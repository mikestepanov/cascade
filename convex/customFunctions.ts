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
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getProjectRole } from "./workspaceAccess";

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
  args: { workspaceId: v.id("workspaces") },
  input: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    // Check if user has access to project
    const project = await ctx.db.get(args.workspaceId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check if user is member or project is public
    const role = await getProjectRole(ctx, args.workspaceId, userId);
    if (!(role || project.isPublic)) {
      throw new Error("Access denied - not a project member");
    }

    return {
      ctx: { ...ctx, userId, workspaceId: args.workspaceId, role, project },
      args: {},
    };
  },
});

/**
 * Project Mutation with viewer role requirement
 * User must be at least a viewer
 */
export const viewerMutation = customMutation(mutation, {
  args: { workspaceId: v.id("workspaces") },
  input: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const project = await ctx.db.get(args.workspaceId);
    if (!project) {
      throw new Error("Project not found");
    }

    const role = await getProjectRole(ctx, args.workspaceId, userId);
    if (!role) {
      throw new Error("Access denied - must be a project member");
    }

    return {
      ctx: { ...ctx, userId, workspaceId: args.workspaceId, role, project },
      args: {},
    };
  },
});

/**
 * Project Mutation with editor role requirement
 * User must be at least an editor
 */
export const editorMutation = customMutation(mutation, {
  args: { workspaceId: v.id("workspaces") },
  input: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const project = await ctx.db.get(args.workspaceId);
    if (!project) {
      throw new Error("Project not found");
    }

    const role = await getProjectRole(ctx, args.workspaceId, userId);

    // Check minimum role
    const roleHierarchy = { viewer: 1, editor: 2, admin: 3 };
    const userRoleLevel = role ? roleHierarchy[role] : 0;
    const requiredRoleLevel = roleHierarchy.editor;

    if (userRoleLevel < requiredRoleLevel) {
      throw new Error("Access denied - editor role required");
    }

    return {
      ctx: { ...ctx, userId, workspaceId: args.workspaceId, role, project },
      args: {},
    };
  },
});

/**
 * Project Mutation with admin role requirement
 * User must be an admin
 */
export const adminMutation = customMutation(mutation, {
  args: { workspaceId: v.id("workspaces") },
  input: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const project = await ctx.db.get(args.workspaceId);
    if (!project) {
      throw new Error("Project not found");
    }

    const role = await getProjectRole(ctx, args.workspaceId, userId);

    if (role !== "admin") {
      throw new Error("Access denied - admin role required");
    }

    return {
      ctx: { ...ctx, userId, workspaceId: args.workspaceId, role, project },
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

    const project = await ctx.db.get(issue.workspaceId);
    if (!project) {
      throw new Error("Project not found");
    }

    const role = await getProjectRole(ctx, issue.workspaceId, userId);

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
        workspaceId: issue.workspaceId,
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
  workspaceId: Id<"workspaces">;
  role: "viewer" | "editor" | "admin" | null;
  project: {
    _id: Id<"workspaces">;
    _creationTime: number;
    name: string;
    key: string;
    description?: string;
    isPublic: boolean;
    createdBy: Id<"users">;
    workflowStates: Array<{
      id: string;
      name: string;
      category: "todo" | "inProgress" | "done";
      color: string;
    }>;
    boardType: "kanban" | "scrum";
  };
};

export type IssueMutationCtx = ProjectQueryCtx & {
  issue: {
    _id: Id<"issues">;
    _creationTime: number;
    workspaceId: Id<"workspaces">;
    key: string;
    title: string;
    description?: string;
    type: "story" | "bug" | "task" | "epic";
    status: string;
    priority: "lowest" | "low" | "medium" | "high" | "highest";
    assigneeId?: Id<"users">;
    reporterId: Id<"users">;
    sprintId?: Id<"sprints">;
    epicId?: Id<"issues">;
  };
};
