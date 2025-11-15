import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertMinimumRole } from "./rbac";

// Get all custom fields for a project
export const list = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    try {
      await assertMinimumRole(ctx, args.projectId, userId, "viewer");
    } catch {
      return [];
    }

    return await ctx.db
      .query("customFields")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// Create a new custom field
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    fieldKey: v.string(),
    fieldType: v.union(
      v.literal("text"),
      v.literal("number"),
      v.literal("select"),
      v.literal("multiselect"),
      v.literal("date"),
      v.literal("checkbox"),
      v.literal("url")
    ),
    options: v.optional(v.array(v.string())),
    isRequired: v.boolean(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await assertMinimumRole(ctx, args.projectId, userId, "admin");

    // Check if field key already exists for this project
    const existing = await ctx.db
      .query("customFields")
      .withIndex("by_project_key", (q) =>
        q.eq("projectId", args.projectId).eq("fieldKey", args.fieldKey)
      )
      .first();

    if (existing) {
      throw new Error("A field with this key already exists");
    }

    return await ctx.db.insert("customFields", {
      projectId: args.projectId,
      name: args.name,
      fieldKey: args.fieldKey,
      fieldType: args.fieldType,
      options: args.options,
      isRequired: args.isRequired,
      description: args.description,
      createdBy: userId,
      createdAt: Date.now(),
    });
  },
});

// Update a custom field
export const update = mutation({
  args: {
    id: v.id("customFields"),
    name: v.optional(v.string()),
    options: v.optional(v.array(v.string())),
    isRequired: v.optional(v.boolean()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const field = await ctx.db.get(args.id);
    if (!field) {
      throw new Error("Field not found");
    }

    await assertMinimumRole(ctx, field.projectId, userId, "admin");

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.options !== undefined) updates.options = args.options;
    if (args.isRequired !== undefined) updates.isRequired = args.isRequired;
    if (args.description !== undefined) updates.description = args.description;

    await ctx.db.patch(args.id, updates);
  },
});

// Delete a custom field
export const remove = mutation({
  args: {
    id: v.id("customFields"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const field = await ctx.db.get(args.id);
    if (!field) {
      throw new Error("Field not found");
    }

    await assertMinimumRole(ctx, field.projectId, userId, "admin");

    // Delete all values for this field
    const values = await ctx.db
      .query("customFieldValues")
      .withIndex("by_field", (q) => q.eq("fieldId", args.id))
      .collect();

    for (const value of values) {
      await ctx.db.delete(value._id);
    }

    await ctx.db.delete(args.id);
  },
});

// Get custom field values for an issue
export const getValuesForIssue = query({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const issue = await ctx.db.get(args.issueId);
    if (!issue) return [];

    try {
      await assertMinimumRole(ctx, issue.projectId, userId, "viewer");
    } catch {
      return [];
    }

    const values = await ctx.db
      .query("customFieldValues")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .collect();

    // Enrich with field definitions
    const enrichedValues = await Promise.all(
      values.map(async (value) => {
        const field = await ctx.db.get(value.fieldId);
        return {
          ...value,
          field,
        };
      })
    );

    return enrichedValues.filter((v) => v.field !== null);
  },
});

// Set a custom field value for an issue
export const setValue = mutation({
  args: {
    issueId: v.id("issues"),
    fieldId: v.id("customFields"),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    await assertMinimumRole(ctx, issue.projectId, userId, "editor");

    const field = await ctx.db.get(args.fieldId);
    if (!field) {
      throw new Error("Field not found");
    }

    // Validate value based on field type
    if (field.fieldType === "number" && isNaN(Number(args.value))) {
      throw new Error("Value must be a valid number");
    }

    if (field.fieldType === "url") {
      try {
        new URL(args.value);
      } catch {
        throw new Error("Value must be a valid URL");
      }
    }

    if (
      (field.fieldType === "select" || field.fieldType === "multiselect") &&
      field.options
    ) {
      const values =
        field.fieldType === "multiselect"
          ? args.value.split(",")
          : [args.value];
      for (const val of values) {
        if (!field.options.includes(val.trim())) {
          throw new Error(`Invalid option: ${val}`);
        }
      }
    }

    // Check if value already exists
    const existing = await ctx.db
      .query("customFieldValues")
      .withIndex("by_issue_field", (q) =>
        q.eq("issueId", args.issueId).eq("fieldId", args.fieldId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("customFieldValues", {
        issueId: args.issueId,
        fieldId: args.fieldId,
        value: args.value,
        updatedAt: Date.now(),
      });
    }

    // Log activity
    await ctx.db.insert("issueActivity", {
      issueId: args.issueId,
      userId,
      action: "updated",
      field: `custom_${field.fieldKey}`,
      newValue: args.value,
      createdAt: Date.now(),
    });
  },
});

// Remove a custom field value
export const removeValue = mutation({
  args: {
    issueId: v.id("issues"),
    fieldId: v.id("customFields"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    await assertMinimumRole(ctx, issue.projectId, userId, "editor");

    const existing = await ctx.db
      .query("customFieldValues")
      .withIndex("by_issue_field", (q) =>
        q.eq("issueId", args.issueId).eq("fieldId", args.fieldId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);

      const field = await ctx.db.get(args.fieldId);
      if (field) {
        await ctx.db.insert("issueActivity", {
          issueId: args.issueId,
          userId,
          action: "updated",
          field: `custom_${field.fieldKey}`,
          oldValue: existing.value,
          newValue: "",
          createdAt: Date.now(),
        });
      }
    }
  },
});
