import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertCanEditProject, canAccessProject } from "./workspaceAccess";

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    goal: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.workspaceId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check permissions - requires editor role to create sprints
    await assertCanEditProject(ctx, args.workspaceId, userId);

    const now = Date.now();
    return await ctx.db.insert("sprints", {
      workspaceId: args.workspaceId,
      name: args.name,
      goal: args.goal,
      startDate: args.startDate,
      endDate: args.endDate,
      status: "future",
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const listByProject = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const project = await ctx.db.get(args.workspaceId);
    if (!project) {
      return [];
    }

    // Check permissions - requires at least viewer role or public project
    const hasAccess = await canAccessProject(ctx, args.workspaceId, userId);
    if (!hasAccess) {
      return [];
    }

    const sprints = await ctx.db
      .query("sprints")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .collect();

    if (sprints.length === 0) {
      return [];
    }

    // Batch fetch all issues for this workspace to count per sprint
    // This is more efficient than N separate queries
    const allIssues = await ctx.db
      .query("issues")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Build count map by sprint ID
    const issueCountBySprint = new Map<string, number>();
    for (const issue of allIssues) {
      if (issue.sprintId) {
        const count = issueCountBySprint.get(issue.sprintId) ?? 0;
        issueCountBySprint.set(issue.sprintId, count + 1);
      }
    }

    return sprints.map((sprint) => ({
      ...sprint,
      issueCount: issueCountBySprint.get(sprint._id) ?? 0,
    }));
  },
});

export const startSprint = mutation({
  args: {
    sprintId: v.id("sprints"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) {
      throw new Error("Sprint not found");
    }

    const project = await ctx.db.get(sprint.workspaceId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check permissions - requires editor role to start sprints
    await assertCanEditProject(ctx, sprint.workspaceId, userId);

    // End any currently active sprint
    const activeSprints = await ctx.db
      .query("sprints")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", sprint.workspaceId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    for (const activeSprint of activeSprints) {
      await ctx.db.patch(activeSprint._id, {
        status: "completed",
        updatedAt: Date.now(),
      });
    }

    await ctx.db.patch(args.sprintId, {
      status: "active",
      startDate: args.startDate,
      endDate: args.endDate,
      updatedAt: Date.now(),
    });
  },
});

export const completeSprint = mutation({
  args: { sprintId: v.id("sprints") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) {
      throw new Error("Sprint not found");
    }

    const project = await ctx.db.get(sprint.workspaceId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check permissions - requires editor role to complete sprints
    await assertCanEditProject(ctx, sprint.workspaceId, userId);

    await ctx.db.patch(args.sprintId, {
      status: "completed",
      updatedAt: Date.now(),
    });
  },
});
