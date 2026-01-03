import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { assertCanAccessProject, assertIsProjectAdmin } from "./projectAccess";

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
      .query("automationRules")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    description: v.optional(v.string()),
    trigger: v.string(),
    triggerValue: v.optional(v.string()),
    actionType: v.string(),
    actionValue: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await assertIsProjectAdmin(ctx, args.projectId, userId);

    const now = Date.now();
    return await ctx.db.insert("automationRules", {
      projectId: args.projectId,
      name: args.name,
      description: args.description,
      isActive: true,
      trigger: args.trigger,
      triggerValue: args.triggerValue,
      actionType: args.actionType,
      actionValue: args.actionValue,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      executionCount: 0,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("automationRules"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    trigger: v.optional(v.string()),
    triggerValue: v.optional(v.string()),
    actionType: v.optional(v.string()),
    actionValue: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const rule = await ctx.db.get(args.id);
    if (!rule) {
      throw new Error("Rule not found");
    }

    if (!rule.projectId) {
      throw new Error("Rule has no project");
    }

    await assertIsProjectAdmin(ctx, rule.projectId, userId);

    const updates: Partial<typeof rule> & { updatedAt: number } = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.trigger !== undefined) updates.trigger = args.trigger;
    if (args.triggerValue !== undefined) updates.triggerValue = args.triggerValue;
    if (args.actionType !== undefined) updates.actionType = args.actionType;
    if (args.actionValue !== undefined) updates.actionValue = args.actionValue;

    await ctx.db.patch(args.id, updates);
  },
});

export const remove = mutation({
  args: {
    id: v.id("automationRules"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const rule = await ctx.db.get(args.id);
    if (!rule) {
      throw new Error("Rule not found");
    }

    if (!rule.projectId) {
      throw new Error("Rule has no project");
    }

    await assertIsProjectAdmin(ctx, rule.projectId, userId);

    await ctx.db.delete(args.id);
  },
});

// Internal mutation to execute automation rules
export const executeRules = internalMutation({
  args: {
    projectId: v.id("projects"),
    issueId: v.id("issues"),
    trigger: v.string(),
    triggerValue: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get active rules for this project and trigger
    const rules = await ctx.db
      .query("automationRules")
      .withIndex("by_project_active", (q) => q.eq("projectId", args.projectId).eq("isActive", true))
      .filter((q) => q.eq(q.field("trigger"), args.trigger))
      .collect();

    const issue = await ctx.db.get(args.issueId);
    if (!issue) return;

    for (const rule of rules) {
      // Check if trigger value matches (if specified)
      if (rule.triggerValue && rule.triggerValue !== args.triggerValue) {
        continue;
      }

      // Execute the action
      try {
        const actionParams = JSON.parse(rule.actionValue);

        switch (rule.actionType) {
          case "set_assignee":
            await ctx.db.patch(args.issueId, {
              assigneeId: actionParams.assigneeId || null,
              updatedAt: Date.now(),
            });
            break;

          case "set_priority":
            await ctx.db.patch(args.issueId, {
              priority: actionParams.priority,
              updatedAt: Date.now(),
            });
            break;

          case "add_label": {
            const currentLabels = issue.labels || [];
            if (!currentLabels.includes(actionParams.label)) {
              await ctx.db.patch(args.issueId, {
                labels: [...currentLabels, actionParams.label],
                updatedAt: Date.now(),
              });
            }
            break;
          }

          case "add_comment":
            await ctx.db.insert("issueComments", {
              issueId: args.issueId,
              authorId: rule.createdBy,
              content: actionParams.comment,
              mentions: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
            break;
        }

        // Increment execution count
        await ctx.db.patch(rule._id, {
          executionCount: rule.executionCount + 1,
        });
      } catch {
        // Continue with other rules even if action fails
      }
    }
  },
});
