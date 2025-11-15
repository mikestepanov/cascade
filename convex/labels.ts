import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertMinimumRole } from "./rbac";

// Create a new label
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user can edit project (requires editor role or higher)
    await assertMinimumRole(ctx, args.projectId, userId, "editor");

    // Check if label with same name already exists in project
    const existing = await ctx.db
      .query("labels")
      .withIndex("by_project_name", (q) =>
        q.eq("projectId", args.projectId).eq("name", args.name)
      )
      .first();

    if (existing) {
      throw new Error("Label with this name already exists");
    }

    const labelId = await ctx.db.insert("labels", {
      projectId: args.projectId,
      name: args.name,
      color: args.color,
      createdBy: userId,
      createdAt: Date.now(),
    });

    return labelId;
  },
});

// List all labels for a project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user has access to project (viewer or higher)
    await assertMinimumRole(ctx, args.projectId, userId, "viewer");

    const labels = await ctx.db
      .query("labels")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return labels;
  },
});

// Update a label
export const update = mutation({
  args: {
    id: v.id("labels"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const label = await ctx.db.get(args.id);
    if (!label) throw new Error("Label not found");

    // Check if user can edit project
    await assertMinimumRole(ctx, label.projectId, userId, "editor");

    // If name is changing, check for duplicates
    if (args.name && args.name !== label.name) {
      const existing = await ctx.db
        .query("labels")
        .withIndex("by_project_name", (q) =>
          q.eq("projectId", label.projectId).eq("name", args.name)
        )
        .first();

      if (existing) {
        throw new Error("Label with this name already exists");
      }
    }

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.color !== undefined) updates.color = args.color;

    await ctx.db.patch(args.id, updates);
  },
});

// Delete a label
export const remove = mutation({
  args: { id: v.id("labels") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const label = await ctx.db.get(args.id);
    if (!label) throw new Error("Label not found");

    // Check if user can edit project
    await assertMinimumRole(ctx, label.projectId, userId, "editor");

    // Remove label from all issues
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", label.projectId))
      .collect();

    for (const issue of issues) {
      if (issue.labels.includes(label.name)) {
        await ctx.db.patch(issue._id, {
          labels: issue.labels.filter((l) => l !== label.name),
        });
      }
    }

    await ctx.db.delete(args.id);
  },
});
