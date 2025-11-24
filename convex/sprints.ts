import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertMinimumRole, canAccessProject } from "./rbac";

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
    await assertMinimumRole(ctx, args.projectId, userId, "editor");

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

    const sprints = await ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();

    return await Promise.all(
      sprints.map(async (sprint) => {
        const issueCount = await ctx.db
          .query("issues")
          .withIndex("by_sprint", (q) => q.eq("sprintId", sprint._id))
          .collect()
          .then((issues) => issues.length);

        return {
          ...sprint,
          issueCount,
        };
      }),
    );
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

    const project = await ctx.db.get(sprint.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check permissions - requires editor role to start sprints
    await assertMinimumRole(ctx, sprint.projectId, userId, "editor");

    // End any currently active sprint
    const activeSprints = await ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", sprint.projectId))
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

    const project = await ctx.db.get(sprint.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check permissions - requires editor role to complete sprints
    await assertMinimumRole(ctx, sprint.projectId, userId, "editor");

    await ctx.db.patch(args.sprintId, {
      status: "completed",
      updatedAt: Date.now(),
    });
  },
});
