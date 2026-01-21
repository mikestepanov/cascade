import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { authenticatedMutation, authenticatedQuery, projectEditorMutation, projectQuery } from "./customFunctions";
import { forbidden, notFound } from "./lib/errors";
import { assertCanAccessProject, assertCanEditProject } from "./projectAccess";
import { issuePriorities, issueTypes } from "./validators";

// Create an issue template
export const create = projectEditorMutation({
  args: {
    name: v.string(),
    type: issueTypes,
    titleTemplate: v.string(),
    descriptionTemplate: v.string(),
    defaultPriority: issuePriorities,
    defaultLabels: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // editorMutation handles auth + editor check
    const templateId = await ctx.db.insert("issueTemplates", {
      projectId: ctx.projectId,
      name: args.name,
      type: args.type,
      titleTemplate: args.titleTemplate,
      descriptionTemplate: args.descriptionTemplate,
      defaultPriority: args.defaultPriority,
      defaultLabels: args.defaultLabels,
      createdBy: ctx.userId,
      createdAt: Date.now(),
    });

    return templateId;
  },
});

// List templates for a project
export const listByProject = projectQuery({
  args: {
    type: v.optional(issueTypes),
  },
  handler: async (ctx, args) => {
    // projectQuery handles auth + project access check
    let templates: Array<Doc<"issueTemplates">>;
    if (args.type) {
      const templateType = args.type; // Store in variable for type narrowing
      templates = await ctx.db
        .query("issueTemplates")
        .withIndex("by_project_type", (q) =>
          q.eq("projectId", ctx.projectId).eq("type", templateType),
        )
        .collect();
    } else {
      templates = await ctx.db
        .query("issueTemplates")
        .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
        .collect();
    }

    return templates;
  },
});

// Get a single template
export const get = authenticatedQuery({
  args: { id: v.id("issueTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) return null;

    // Check if user has access to project
    if (template.projectId) {
      await assertCanAccessProject(ctx, template.projectId, ctx.userId);
    }

    return template;
  },
});

// Update a template
export const update = authenticatedMutation({
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
    const template = await ctx.db.get(args.id);
    if (!template) throw notFound("template", args.id);

    // Check if user can edit project
    if (template.projectId) {
      await assertCanEditProject(ctx, template.projectId, ctx.userId);
    } else {
      throw forbidden("edit global templates");
    }

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
export const remove = authenticatedMutation({
  args: { id: v.id("issueTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) throw notFound("template", args.id);

    // Check if user can edit project
    if (template.projectId) {
      await assertCanEditProject(ctx, template.projectId, ctx.userId);
    } else {
      throw forbidden("delete global templates");
    }

    await ctx.db.delete(args.id);
  },
});
