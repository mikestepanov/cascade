import { query, mutation, action, internalAction, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertMinimumRole } from "./rbac";
import { api, internal } from "./_generated/api";

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
    await assertMinimumRole(ctx, args.projectId, userId, "admin");

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
    await assertMinimumRole(ctx, args.projectId, userId, "admin");

    const webhooks = await ctx.db
      .query("webhooks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return webhooks;
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
    await assertMinimumRole(ctx, webhook.projectId, userId, "admin");

    const updates: any = {};
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
    await assertMinimumRole(ctx, webhook.projectId, userId, "admin");

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
      try {
        await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Event": args.event,
            ...(webhook.secret && {
              "X-Webhook-Signature": await generateSignature(
                JSON.stringify(args.payload),
                webhook.secret
              ),
            }),
          },
          body: JSON.stringify({
            event: args.event,
            payload: args.payload,
            timestamp: Date.now(),
          }),
        });

        // Update last triggered time
        await ctx.runMutation(internal.webhooks.updateLastTriggered, {
          id: webhook._id,
        });
      } catch (error) {
        console.error(`Webhook ${webhook._id} failed:`, error);
        // Continue with other webhooks even if one fails
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

    return webhooks.filter(
      (w) =>
        w.projectId === args.projectId &&
        w.events.includes(args.event)
    );
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

// Helper function to generate HMAC signature
async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
