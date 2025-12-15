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

    // Sprints per workspace are typically few (10-50), add reasonable limit
    const MAX_SPRINTS = 100;
    const sprints = await ctx.db
      .query("sprints")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .take(MAX_SPRINTS);

    if (sprints.length === 0) {
      return [];
    }

    // Fetch issues per sprint using index (more efficient than loading all issues)
    const sprintIds = sprints.map((s) => s._id);
    const issueCountsPromises = sprintIds.map(async (sprintId) => {
      const issues = await ctx.db
        .query("issues")
        .withIndex("by_sprint", (q) => q.eq("sprintId", sprintId))
        .collect();
      return { sprintId, count: issues.length };
    });
    const issueCounts = await Promise.all(issueCountsPromises);

    // Build count map from results
    const issueCountBySprint = new Map(
      issueCounts.map(({ sprintId, count }) => [sprintId.toString(), count]),
    );

    return sprints.map((sprint) => ({
      ...sprint,
      issueCount: issueCountBySprint.get(sprint._id.toString()) ?? 0,
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
