import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { action, mutation, query } from "./_generated/server";

/**
 * Pumble Integration
 *
 * Send messages and notifications to Pumble channels via incoming webhooks.
 * Pumble is a team communication platform similar to Slack.
 */

/**
 * Add a new Pumble webhook
 */
export const addWebhook = mutation({
  args: {
    name: v.string(),
    webhookUrl: v.string(),
    projectId: v.optional(v.id("projects")),
    events: v.array(v.string()),
    sendMentions: v.optional(v.boolean()),
    sendAssignments: v.optional(v.boolean()),
    sendStatusChanges: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate webhook URL
    if (!args.webhookUrl.includes("pumble.com")) {
      throw new Error("Invalid Pumble webhook URL");
    }

    // If project is specified, verify access
    if (args.projectId) {
      const projectId = args.projectId;
      const project = await ctx.db.get(projectId);
      if (!project) throw new Error("Project not found");

      // Check if user has access to project
      const membership = await ctx.db
        .query("projectMembers")
        .withIndex("by_workspace_user", (q) =>
          q.eq("projectId", projectId).eq("userId", userId),
        )
        .first();

      if (!membership && project.createdBy !== userId) {
        throw new Error("Not authorized for this project");
      }
    }

    const webhookId = await ctx.db.insert("pumbleWebhooks", {
      userId,
      projectId: args.projectId,
      name: args.name,
      webhookUrl: args.webhookUrl,
      events: args.events,
      isActive: true,
      sendMentions: args.sendMentions ?? true,
      sendAssignments: args.sendAssignments ?? true,
      sendStatusChanges: args.sendStatusChanges ?? true,
      messagesSent: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return webhookId;
  },
});

/**
 * List user's Pumble webhooks
 */
export const listWebhooks = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("pumbleWebhooks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

/**
 * Get a single webhook
 */
export const getWebhook = query({
  args: { webhookId: v.id("pumbleWebhooks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook) return null;
    if (webhook.userId !== userId) throw new Error("Not authorized");

    return webhook;
  },
});

/**
 * Update webhook settings
 */
export const updateWebhook = mutation({
  args: {
    webhookId: v.id("pumbleWebhooks"),
    name: v.optional(v.string()),
    webhookUrl: v.optional(v.string()),
    events: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    sendMentions: v.optional(v.boolean()),
    sendAssignments: v.optional(v.boolean()),
    sendStatusChanges: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook) throw new Error("Webhook not found");
    if (webhook.userId !== userId) throw new Error("Not authorized");

    const updates: {
      updatedAt: number;
      name?: string;
      webhookUrl?: string;
      events?: string[];
      isActive?: boolean;
      sendMentions?: boolean;
      sendAssignments?: boolean;
      sendStatusChanges?: boolean;
    } = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.webhookUrl !== undefined) updates.webhookUrl = args.webhookUrl;
    if (args.events !== undefined) updates.events = args.events;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.sendMentions !== undefined) updates.sendMentions = args.sendMentions;
    if (args.sendAssignments !== undefined) updates.sendAssignments = args.sendAssignments;
    if (args.sendStatusChanges !== undefined) updates.sendStatusChanges = args.sendStatusChanges;

    await ctx.db.patch(args.webhookId, updates);
  },
});

/**
 * Delete a webhook
 */
export const deleteWebhook = mutation({
  args: { webhookId: v.id("pumbleWebhooks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook) throw new Error("Webhook not found");
    if (webhook.userId !== userId) throw new Error("Not authorized");

    await ctx.db.delete(args.webhookId);
  },
});

/**
 * Send a message to Pumble (Action - can call external APIs)
 */
export const sendMessage = action({
  args: {
    webhookId: v.id("pumbleWebhooks"),
    text: v.string(),
    title: v.optional(v.string()),
    color: v.optional(v.string()), // hex color for message sidebar
    fields: v.optional(
      v.array(
        v.object({
          title: v.string(),
          value: v.string(),
          short: v.optional(v.boolean()),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    // Get webhook
    const webhook = await ctx.runQuery(api.pumble.getWebhook, {
      webhookId: args.webhookId,
    });

    if (!webhook) {
      throw new Error("Webhook not found");
    }

    if (!webhook.isActive) {
      throw new Error("Webhook is not active");
    }

    // Build Pumble message payload
    const payload: {
      text: string;
      attachments?: Array<{
        title?: string;
        text: string;
        color?: string;
        fields?: Array<{ title: string; value: string; short?: boolean }>;
      }>;
    } = {
      text: args.text,
    };

    // Add rich formatting if provided
    if (args.title || args.fields || args.color) {
      payload.attachments = [
        {
          ...(args.title && { title: args.title }),
          text: args.text,
          ...(args.color && { color: args.color }),
          ...(args.fields && { fields: args.fields }),
        },
      ];
      payload.text = args.title || `${args.text.substring(0, 50)}...`;
    }

    try {
      // Send message to Pumble
      const response = await fetch(webhook.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Pumble API error: ${response.status} ${error}`);
      }

      // Update webhook stats
      await ctx.runMutation(api.pumble.updateWebhookStats, {
        webhookId: args.webhookId,
        success: true,
      });

      return { success: true };
    } catch (error) {
      // Update webhook stats with error
      await ctx.runMutation(api.pumble.updateWebhookStats, {
        webhookId: args.webhookId,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  },
});

/**
 * Update webhook statistics (internal mutation)
 */
export const updateWebhookStats = mutation({
  args: {
    webhookId: v.id("pumbleWebhooks"),
    success: v.boolean(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook) return;

    await ctx.db.patch(args.webhookId, {
      messagesSent: webhook.messagesSent + (args.success ? 1 : 0),
      lastMessageAt: args.success ? Date.now() : webhook.lastMessageAt,
      lastError: args.error,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Test a webhook by sending a test message
 */
export const testWebhook = action({
  args: { webhookId: v.id("pumbleWebhooks") },
  handler: async (ctx, args): Promise<unknown> => {
    return await ctx.runAction(api.pumble.sendMessage, {
      webhookId: args.webhookId,
      text: "🎉 Nixelo integration is working!",
      title: "Test Message",
      color: "#3b82f6",
      fields: [
        {
          title: "Status",
          value: "Connected ✅",
          short: true,
        },
        {
          title: "Time",
          value: new Date().toLocaleString(),
          short: true,
        },
      ],
    });
  },
});

/**
 * Send issue notification to Pumble
 * Called when issue events occur (created, updated, assigned, etc.)
 */
export const sendIssueNotification = action({
  args: {
    issueId: v.id("issues"),
    event: v.string(), // "issue.created", "issue.updated", "issue.assigned"
    userId: v.optional(v.id("users")), // User who triggered the event
  },
  handler: async (ctx, args) => {
    // Get issue details
    const issue = await ctx.runQuery(api.issues.get, {
      id: args.issueId,
    });

    if (!issue) return;

    // Find active webhooks for this project
    const webhooks = (await ctx.runQuery(api.pumble.listWebhooks, {})) as Doc<"pumbleWebhooks">[];

    const activeWebhooks = webhooks.filter(
      (w: Doc<"pumbleWebhooks">) =>
        w.isActive &&
        w.events.includes(args.event) &&
        (!w.projectId || w.projectId === issue.projectId),
    );

    // Send notification to each webhook
    for (const webhook of activeWebhooks) {
      try {
        const color = getColorForEvent(args.event);
        const title = getTitleForEvent(args.event, issue);

        await ctx.runAction(api.pumble.sendMessage, {
          webhookId: webhook._id,
          text: issue.description || "No description",
          title,
          color,
          fields: [
            {
              title: "Issue",
              value: `${issue.key}: ${issue.title}`,
              short: false,
            },
            {
              title: "Type",
              value: issue.type,
              short: true,
            },
            {
              title: "Priority",
              value: issue.priority,
              short: true,
            },
            {
              title: "Status",
              value: issue.status,
              short: true,
            },
            {
              title: "Assignee",
              value: issue.assignee?.name || "Unassigned",
              short: true,
            },
          ],
        });
      } catch (_error) {
        // Intentionally ignore Pumble notification failures - non-critical
      }
    }
  },
});

// Helper functions
function getColorForEvent(event: string): string {
  switch (event) {
    case "issue.created":
      return "#10b981"; // green
    case "issue.updated":
      return "#3b82f6"; // blue
    case "issue.assigned":
      return "#f59e0b"; // amber
    case "issue.completed":
      return "#8b5cf6"; // purple
    case "issue.deleted":
      return "#ef4444"; // red
    default:
      return "#6b7280"; // gray
  }
}

function getTitleForEvent(event: string, _issue: unknown): string {
  switch (event) {
    case "issue.created":
      return `🆕 New Issue Created`;
    case "issue.updated":
      return `✏️ Issue Updated`;
    case "issue.assigned":
      return `👤 Issue Assigned`;
    case "issue.completed":
      return `✅ Issue Completed`;
    case "issue.deleted":
      return `🗑️ Issue Deleted`;
    default:
      return `📋 Issue Event`;
  }
}
