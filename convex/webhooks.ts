import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { assertIsProjectAdmin } from "./projectAccess";

// Create a webhook
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    url: v.string(),
    events: v.array(v.string()),
    secret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Only admins can create webhooks
    await assertIsProjectAdmin(ctx, args.projectId, userId);

    const webhookId = await ctx.db.insert("webhooks", {
      projectId: args.projectId,
      name: args.name,
      url: args.url,
      events: args.events,
      secret: args.secret,
      isActive: true,
      createdBy: userId,
      createdAt: Date.now(),
    });

    return webhookId;
  },
});

// List webhooks for a project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Only admins can view webhooks
    await assertIsProjectAdmin(ctx, args.projectId, userId);

    const webhooks = await ctx.db
      .query("webhooks")
      .withIndex("by_workspace", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Don't expose secrets to the client - only show if secret is configured
    return webhooks.map((w) => ({
      ...w,
      secret: undefined,
      hasSecret: !!w.secret,
    }));
  },
});

// Update a webhook
export const update = mutation({
  args: {
    id: v.id("webhooks"),
    name: v.optional(v.string()),
    url: v.optional(v.string()),
    events: v.optional(v.array(v.string())),
    secret: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const webhook = await ctx.db.get(args.id);
    if (!webhook) throw new Error("Webhook not found");

    // Only admins can update webhooks
    if (!webhook.projectId) {
      throw new Error("Webhook has no project");
    }
    await assertIsProjectAdmin(ctx, webhook.projectId, userId);

    const updates: Partial<typeof webhook> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.url !== undefined) updates.url = args.url;
    if (args.events !== undefined) updates.events = args.events;
    if (args.secret !== undefined) updates.secret = args.secret;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.id, updates);
  },
});

// Delete a webhook
export const remove = mutation({
  args: { id: v.id("webhooks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const webhook = await ctx.db.get(args.id);
    if (!webhook) throw new Error("Webhook not found");

    // Only admins can delete webhooks
    if (!webhook.projectId) {
      throw new Error("Webhook has no project");
    }
    await assertIsProjectAdmin(ctx, webhook.projectId, userId);

    await ctx.db.delete(args.id);
  },
});

// Internal action to trigger webhooks
export const trigger = internalAction({
  args: {
    projectId: v.id("projects"),
    event: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    // Get all active webhooks for this project that listen to this event directly via database
    const webhooks = await ctx.runQuery(internal.webhooks.getActiveWebhooksForEvent, {
      projectId: args.projectId,
      event: args.event,
    });

    // Trigger each webhook
    for (const webhook of webhooks) {
      const requestPayload = JSON.stringify({
        event: args.event,
        payload: args.payload,
        timestamp: Date.now(),
      });

      // Create execution log
      const executionId = await ctx.runMutation(internal.webhooks.createExecution, {
        webhookId: webhook._id,
        event: args.event,
        requestPayload,
      });

      try {
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Event": args.event,
            ...(webhook.secret && {
              "X-Webhook-Signature": await generateSignature(requestPayload, webhook.secret),
            }),
          },
          body: requestPayload,
        });

        const responseBody = await response.text();

        // Update execution log with success
        await ctx.runMutation(internal.webhooks.updateExecution, {
          id: executionId,
          status: response.ok ? "success" : "failed",
          responseStatus: response.status,
          responseBody: responseBody.substring(0, 1000), // Limit to 1000 chars
          error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
        });

        // Update last triggered time
        await ctx.runMutation(internal.webhooks.updateLastTriggered, {
          id: webhook._id,
        });
      } catch (error) {
        // Update execution log with failure
        await ctx.runMutation(internal.webhooks.updateExecution, {
          id: executionId,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  },
});

// Internal query to get active webhooks for an event
export const getActiveWebhooksForEvent = internalQuery({
  args: {
    projectId: v.id("projects"),
    event: v.string(),
  },
  handler: async (ctx, args) => {
    const webhooks = await ctx.db
      .query("webhooks")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    return webhooks.filter((w) => w.projectId === args.projectId && w.events.includes(args.event));
  },
});

// Internal mutation to update last triggered time
export const updateLastTriggered = internalMutation({
  args: { id: v.id("webhooks") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      lastTriggered: Date.now(),
    });
  },
});

// Query webhook executions for a webhook
export const listExecutions = query({
  args: {
    webhookId: v.id("webhooks"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook) throw new Error("Webhook not found");

    // Only admins can view webhook logs
    if (!webhook.projectId) {
      throw new Error("Webhook has no project");
    }
    await assertIsProjectAdmin(ctx, webhook.projectId, userId);

    const executions = await ctx.db
      .query("webhookExecutions")
      .withIndex("by_webhook_created", (q) => q.eq("webhookId", args.webhookId))
      .order("desc")
      .take(args.limit || 50);

    return executions;
  },
});

// Test webhook (sends ping event)
export const test = mutation({
  args: { id: v.id("webhooks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const webhook = await ctx.db.get(args.id);
    if (!webhook) throw new Error("Webhook not found");

    // Only admins can test webhooks
    if (!webhook.projectId) {
      throw new Error("Webhook has no project");
    }
    await assertIsProjectAdmin(ctx, webhook.projectId, userId);

    // Schedule the test webhook delivery
    await ctx.scheduler.runAfter(0, internal.webhooks.deliverTestWebhook, {
      webhookId: args.id,
    });

    return { success: true };
  },
});

// Internal action to deliver test webhook
export const deliverTestWebhook = internalAction({
  args: { webhookId: v.id("webhooks") },
  handler: async (ctx, args) => {
    const webhook = await ctx.runQuery(internal.webhooks.getWebhookById, {
      id: args.webhookId,
    });
    if (!webhook) return;

    const requestPayload = JSON.stringify({
      event: "ping",
      payload: { message: "Test webhook from Nixelo" },
      timestamp: Date.now(),
    });

    // Create execution log
    const executionId = await ctx.runMutation(internal.webhooks.createExecution, {
      webhookId: webhook._id,
      event: "ping",
      requestPayload,
    });

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Event": "ping",
          ...(webhook.secret && {
            "X-Webhook-Signature": await generateSignature(requestPayload, webhook.secret),
          }),
        },
        body: requestPayload,
      });

      const responseBody = await response.text();

      // Update execution log
      await ctx.runMutation(internal.webhooks.updateExecution, {
        id: executionId,
        status: response.ok ? "success" : "failed",
        responseStatus: response.status,
        responseBody: responseBody.substring(0, 1000),
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      });
    } catch (error) {
      await ctx.runMutation(internal.webhooks.updateExecution, {
        id: executionId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
});

// Internal query to get webhook by ID
export const getWebhookById = internalQuery({
  args: { id: v.id("webhooks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Internal mutation to create execution log
export const createExecution = internalMutation({
  args: {
    webhookId: v.id("webhooks"),
    event: v.string(),
    requestPayload: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("webhookExecutions", {
      webhookId: args.webhookId,
      event: args.event,
      requestPayload: args.requestPayload,
      status: "retrying",
      attempts: 1,
      createdAt: Date.now(),
    });
  },
});

// Internal mutation to update execution log
export const updateExecution = internalMutation({
  args: {
    id: v.id("webhookExecutions"),
    status: v.union(v.literal("success"), v.literal("failed")),
    responseStatus: v.optional(v.number()),
    responseBody: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      responseStatus: args.responseStatus,
      responseBody: args.responseBody,
      error: args.error,
      completedAt: Date.now(),
    });
  },
});

// Retry failed webhook execution
export const retryExecution = mutation({
  args: { id: v.id("webhookExecutions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const execution = await ctx.db.get(args.id);
    if (!execution) throw new Error("Execution not found");

    const webhook = await ctx.db.get(execution.webhookId);
    if (!webhook) throw new Error("Webhook not found");

    // Only admins can retry webhooks
    if (!webhook.projectId) {
      throw new Error("Webhook has no project");
    }
    await assertIsProjectAdmin(ctx, webhook.projectId, userId);

    // Schedule the retry
    await ctx.scheduler.runAfter(0, internal.webhooks.retryWebhookDelivery, {
      executionId: args.id,
      webhookId: webhook._id,
    });

    return { success: true };
  },
});

// Internal action to retry webhook delivery
export const retryWebhookDelivery = internalAction({
  args: {
    executionId: v.id("webhookExecutions"),
    webhookId: v.id("webhooks"),
  },
  handler: async (ctx, args) => {
    const execution = await ctx.runQuery(internal.webhooks.getExecutionById, {
      id: args.executionId,
    });
    if (!execution) return;

    const webhook = await ctx.runQuery(internal.webhooks.getWebhookById, {
      id: args.webhookId,
    });
    if (!webhook) return;

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Event": execution.event,
          ...(webhook.secret && {
            "X-Webhook-Signature": await generateSignature(
              execution.requestPayload,
              webhook.secret,
            ),
          }),
        },
        body: execution.requestPayload,
      });

      const responseBody = await response.text();

      // Update execution log
      await ctx.runMutation(internal.webhooks.incrementExecutionAttempt, {
        id: args.executionId,
        status: response.ok ? "success" : "failed",
        responseStatus: response.status,
        responseBody: responseBody.substring(0, 1000),
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      });
    } catch (error) {
      await ctx.runMutation(internal.webhooks.incrementExecutionAttempt, {
        id: args.executionId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
});

// Internal query to get execution by ID
export const getExecutionById = internalQuery({
  args: { id: v.id("webhookExecutions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Internal mutation to increment execution attempt
export const incrementExecutionAttempt = internalMutation({
  args: {
    id: v.id("webhookExecutions"),
    status: v.union(v.literal("success"), v.literal("failed")),
    responseStatus: v.optional(v.number()),
    responseBody: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const execution = await ctx.db.get(args.id);
    if (!execution) return;

    await ctx.db.patch(args.id, {
      status: args.status,
      responseStatus: args.responseStatus,
      responseBody: args.responseBody,
      error: args.error,
      attempts: execution.attempts + 1,
      completedAt: Date.now(),
    });
  },
});

// Helper function to generate HMAC signature
async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
