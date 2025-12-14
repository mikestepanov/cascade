import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { assertCanAccessProject, assertCanEditProject } from "./workspaceAccess";

// Create an issue template
export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
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
    await assertCanEditProject(ctx, args.workspaceId, userId);

    const templateId = await ctx.db.insert("issueTemplates", {
      workspaceId: args.workspaceId,
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
    workspaceId: v.id("workspaces"),
    type: v.optional(
      v.union(v.literal("task"), v.literal("bug"), v.literal("story"), v.literal("epic")),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user has access to project
    await assertCanAccessProject(ctx, args.workspaceId, userId);

    let templates: Array<Doc<"issueTemplates">>;
    if (args.type) {
      const templateType = args.type; // Store in variable for type narrowing
      templates = await ctx.db
        .query("issueTemplates")
        .withIndex("by_workspace_type", (q) =>
          q.eq("workspaceId", args.workspaceId).eq("type", templateType),
        )
        .collect();
    } else {
      templates = await ctx.db
        .query("issueTemplates")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .collect();
    }

    return templates;
  },
});

// Alias for backwards compatibility
export const list = listByProject;

// Get a single template
export const get = query({
  args: { id: v.id("issueTemplates") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const template = await ctx.db.get(args.id);
    if (!template) return null;

    // Check if user has access to project
    await assertCanAccessProject(ctx, template.workspaceId, userId);

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
    await assertCanEditProject(ctx, template.workspaceId, userId);

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
    await assertCanEditProject(ctx, template.workspaceId, userId);

    await ctx.db.delete(args.id);
  },
});
