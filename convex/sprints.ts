import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { notDeleted } from "./lib/softDeleteHelpers";
import { assertCanEditProject, canAccessProject } from "./projectAccess";

export const create = mutation({
  args: {
    projectId: v.id("projects"),
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

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check permissions - requires editor role to create sprints
    await assertCanEditProject(ctx, args.projectId, userId);

    const now = Date.now();
    return await ctx.db.insert("sprints", {
      projectId: args.projectId,
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
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return [];
    }

    // Check permissions - requires at least viewer role or public project
    const hasAccess = await canAccessProject(ctx, args.projectId, userId);
    if (!hasAccess) {
      return [];
    }

    // Sprints per project are typically few (10-50), add reasonable limit
    const MAX_SPRINTS = 100;
    const sprints = await ctx.db
      .query("sprints")
      .withIndex("by_workspace", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .filter(notDeleted)      .take(MAX_SPRINTS);

    if (sprints.length === 0) {
      return [];
    }

    // Fetch issues per sprint using index (more efficient than loading all issues)
    const sprintIds = sprints.map((s) => s._id);
    const issueCountsPromises = sprintIds.map(async (sprintId) => {
      const issues = await ctx.db
        .query("issues")
        .withIndex("by_sprint", (q) => q.eq("sprintId", sprintId))
        .filter(notDeleted)        .collect();
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

    if (!sprint.projectId) {
      throw new Error("Sprint has no project");
    }

    const project = await ctx.db.get(sprint.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check permissions - requires editor role to start sprints
    await assertCanEditProject(ctx, sprint.projectId, userId);

    // End any currently active sprint
    const activeSprints = await ctx.db
      .query("sprints")
      .withIndex("by_workspace", (q) => q.eq("projectId", sprint.projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .filter(notDeleted)      .collect();

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

    if (!sprint.projectId) {
      throw new Error("Sprint has no project");
    }

    const project = await ctx.db.get(sprint.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check permissions - requires editor role to complete sprints
    await assertCanEditProject(ctx, sprint.projectId, userId);

    await ctx.db.patch(args.sprintId, {
      status: "completed",
      updatedAt: Date.now(),
    });
  },
});
