import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { batchFetchCustomFields } from "./lib/batchHelpers";
import {
  assertCanAccessProject,
  assertCanEditProject,
  assertIsProjectAdmin,
} from "./projectAccess";

// Helper: Validate number field value
function validateNumberField(value: string): void {
  if (Number.isNaN(Number(value))) {
    throw new Error("Value must be a valid number");
  }
}

// Helper: Validate URL field value
function validateUrlField(value: string): void {
  try {
    new URL(value);
  } catch {
    throw new Error("Value must be a valid URL");
  }
}

// Helper: Validate select/multiselect field value
function validateSelectField(
  value: string,
  fieldType: "select" | "multiselect",
  options: string[],
): void {
  const values = fieldType === "multiselect" ? value.split(",") : [value];
  for (const val of values) {
    if (!options.includes(val.trim())) {
      throw new Error(`Invalid option: ${val}`);
    }
  }
}

// Helper: Validate custom field value based on type
function validateCustomFieldValue(field: Doc<"customFields">, value: string): void {
  if (field.fieldType === "number") {
    validateNumberField(value);
  } else if (field.fieldType === "url") {
    validateUrlField(value);
  } else if ((field.fieldType === "select" || field.fieldType === "multiselect") && field.options) {
    validateSelectField(value, field.fieldType, field.options);
  }
}

// Get all custom fields for a project
export const list = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    try {
      await assertCanAccessProject(ctx, args.projectId, userId);
    } catch {
      return [];
    }

    return await ctx.db
      .query("customFields")
      .withIndex("by_workspace", (q) => q.eq("projectId", args.projectId))
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
      v.literal("url"),
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

    await assertIsProjectAdmin(ctx, args.projectId, userId);

    // Check if field key already exists for this project
    const existing = await ctx.db
      .query("customFields")
      .withIndex("by_workspace_key", (q) =>
        q.eq("projectId", args.projectId).eq("fieldKey", args.fieldKey),
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

    await assertIsProjectAdmin(ctx, field.projectId, userId);

    const updates: Partial<typeof field> = {};
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

    await assertIsProjectAdmin(ctx, field.projectId, userId);

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
      await assertCanAccessProject(ctx, issue.projectId, userId);
    } catch {
      return [];
    }

    const values = await ctx.db
      .query("customFieldValues")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .collect();

    // Batch fetch field definitions to avoid N+1 queries
    const fieldIds = values.map((v) => v.fieldId);
    const fieldMap = await batchFetchCustomFields(ctx, fieldIds);

    // Enrich with pre-fetched data (no N+1)
    const enrichedValues = values.map((value) => ({
      ...value,
      field: fieldMap.get(value.fieldId) ?? null,
    }));

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

    await assertCanEditProject(ctx, issue.projectId, userId);

    const field = await ctx.db.get(args.fieldId);
    if (!field) {
      throw new Error("Field not found");
    }

    // Validate value based on field type
    validateCustomFieldValue(field, args.value);

    // Check if value already exists
    const existing = await ctx.db
      .query("customFieldValues")
      .withIndex("by_issue_field", (q) => q.eq("issueId", args.issueId).eq("fieldId", args.fieldId))
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

    await assertCanEditProject(ctx, issue.projectId, userId);

    const existing = await ctx.db
      .query("customFieldValues")
      .withIndex("by_issue_field", (q) => q.eq("issueId", args.issueId).eq("fieldId", args.fieldId))
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
