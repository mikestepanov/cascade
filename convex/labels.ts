import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertCanAccessProject, assertCanEditProject } from "./projectAccess";

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
    await assertCanEditProject(ctx, args.projectId, userId);

    // Check if label with same name already exists in project
    const existing = await ctx.db
      .query("labels")
      .withIndex("by_workspace_name", (q) =>
        q.eq("projectId", args.projectId).eq("name", args.name),
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
export const list = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user has access to project (viewer or higher)
    await assertCanAccessProject(ctx, args.projectId, userId);

    const labels = await ctx.db
      .query("labels")
      .withIndex("by_workspace", (q) => q.eq("projectId", args.projectId))
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
    await assertCanEditProject(ctx, label.projectId, userId);

    // If name is changing, check for duplicates
    if (args.name && args.name !== label.name) {
      const newName = args.name; // Store in variable for type narrowing
      const existing = await ctx.db
        .query("labels")
        .withIndex("by_workspace_name", (q) =>
          q.eq("projectId", label.projectId).eq("name", newName),
        )
        .first();

      if (existing) {
        throw new Error("Label with this name already exists");
      }
    }

    const updates: Partial<typeof label> = {};
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
    await assertCanEditProject(ctx, label.projectId, userId);

    // Remove label from all issues (with reasonable limit)
    const MAX_ISSUES_TO_UPDATE = 5000;
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_workspace", (q) => q.eq("projectId", label.projectId))
      .take(MAX_ISSUES_TO_UPDATE);

    // Filter to issues that have this label, then batch update in parallel
    const issuesToUpdate = issues.filter((issue) => issue.labels.includes(label.name));
    await Promise.all(
      issuesToUpdate.map((issue) =>
        ctx.db.patch(issue._id, {
          labels: issue.labels.filter((l) => l !== label.name),
        }),
      ),
    );

    await ctx.db.delete(args.id);
  },
});
