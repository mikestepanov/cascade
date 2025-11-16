import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertMinimumRole } from "./rbac";

// Create an issue template
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    type: v.union(v.literal("task"), v.literal("bug"), v.literal("story"), v.literal("epic")),
    titleTemplate: v.string(),
    descriptionTemplate: v.string(),
    defaultPriority: v.union(
      v.literal("lowest"),
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("highest"),
    ),
    defaultLabels: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user can edit project (requires editor role or higher)
    await assertMinimumRole(ctx, args.projectId, userId, "editor");

    const templateId = await ctx.db.insert("issueTemplates", {
      projectId: args.projectId,
      name: args.name,
      type: args.type,
      titleTemplate: args.titleTemplate,
      descriptionTemplate: args.descriptionTemplate,
      defaultPriority: args.defaultPriority,
      defaultLabels: args.defaultLabels,
      createdBy: userId,
      createdAt: Date.now(),
    });

    return templateId;
  },
});

// List templates for a project
export const listByProject = query({
  args: {
    projectId: v.id("projects"),
    type: v.optional(
      v.union(v.literal("task"), v.literal("bug"), v.literal("story"), v.literal("epic")),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user has access to project
    await assertMinimumRole(ctx, args.projectId, userId, "viewer");

    let templates: Array<Doc<"issueTemplates">>;
    if (args.type) {
      templates = await ctx.db
        .query("issueTemplates")
        .withIndex("by_project_type", (q) =>
          q.eq("projectId", args.projectId).eq("type", args.type),
        )
        .collect();
    } else {
      templates = await ctx.db
        .query("issueTemplates")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect();
    }

    return templates;
  },
});

// Get a single template
export const get = query({
  args: { id: v.id("issueTemplates") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const template = await ctx.db.get(args.id);
    if (!template) return null;

    // Check if user has access to project
    await assertMinimumRole(ctx, template.projectId, userId, "viewer");

    return template;
  },
});

// Update a template
export const update = mutation({
  args: {
    id: v.id("issueTemplates"),
    name: v.optional(v.string()),
    titleTemplate: v.optional(v.string()),
    descriptionTemplate: v.optional(v.string()),
    defaultPriority: v.optional(
      v.union(
        v.literal("lowest"),
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("highest"),
      ),
    ),
    defaultLabels: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const template = await ctx.db.get(args.id);
    if (!template) throw new Error("Template not found");

    // Check if user can edit project
    await assertMinimumRole(ctx, template.projectId, userId, "editor");

    const updates: Partial<typeof template> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.titleTemplate !== undefined) updates.titleTemplate = args.titleTemplate;
    if (args.descriptionTemplate !== undefined)
      updates.descriptionTemplate = args.descriptionTemplate;
    if (args.defaultPriority !== undefined) updates.defaultPriority = args.defaultPriority;
    if (args.defaultLabels !== undefined) updates.defaultLabels = args.defaultLabels;

    await ctx.db.patch(args.id, updates);
  },
});

// Delete a template
export const remove = mutation({
  args: { id: v.id("issueTemplates") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const template = await ctx.db.get(args.id);
    if (!template) throw new Error("Template not found");

    // Check if user can edit project
    await assertMinimumRole(ctx, template.projectId, userId, "editor");

    await ctx.db.delete(args.id);
  },
});
