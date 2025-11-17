import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Add mutation to offline queue
export const queueMutation = mutation({
  args: {
    mutationType: v.string(), // e.g., "issues.update"
    mutationArgs: v.string(), // JSON string of arguments
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();

    return await ctx.db.insert("offlineSyncQueue", {
      userId,
      mutationType: args.mutationType,
      mutationArgs: args.mutationArgs,
      status: "pending",
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get pending mutations for user
export const getPendingMutations = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("offlineSyncQueue")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "pending"))
      .order("asc") // Process in order
      .collect();
  },
});

// Mark mutation as syncing
export const markSyncing = mutation({
  args: {
    queueId: v.id("offlineSyncQueue"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const item = await ctx.db.get(args.queueId);
    if (!item) throw new Error("Queue item not found");

    if (item.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.queueId, {
      status: "syncing",
      lastAttempt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Mark mutation as completed
export const markCompleted = mutation({
  args: {
    queueId: v.id("offlineSyncQueue"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const item = await ctx.db.get(args.queueId);
    if (!item) throw new Error("Queue item not found");

    if (item.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.queueId, {
      status: "completed",
      updatedAt: Date.now(),
    });
  },
});

// Mark mutation as failed
export const markFailed = mutation({
  args: {
    queueId: v.id("offlineSyncQueue"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const item = await ctx.db.get(args.queueId);
    if (!item) throw new Error("Queue item not found");

    if (item.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const attempts = item.attempts + 1;
    const maxAttempts = 3;

    // If max attempts reached, mark as permanently failed
    const status = attempts >= maxAttempts ? "failed" : "pending";

    await ctx.db.patch(args.queueId, {
      status,
      attempts,
      error: args.error,
      lastAttempt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get sync queue status for user
export const getSyncStatus = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId)
      return {
        pending: 0,
        syncing: 0,
        failed: 0,
        hasItems: false,
      };

    const pending = await ctx.db
      .query("offlineSyncQueue")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "pending"))
      .collect();

    const syncing = await ctx.db
      .query("offlineSyncQueue")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "syncing"))
      .collect();

    const failed = await ctx.db
      .query("offlineSyncQueue")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "failed"))
      .collect();

    return {
      pending: pending.length,
      syncing: syncing.length,
      failed: failed.length,
      hasItems: pending.length > 0 || syncing.length > 0 || failed.length > 0,
    };
  },
});

// Clear completed items (cleanup)
export const clearCompleted = mutation({
  args: {
    olderThan: v.optional(v.number()), // Clear items older than timestamp
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const cutoff = args.olderThan ?? Date.now() - 24 * 60 * 60 * 1000; // Default: 24 hours ago

    const completed = await ctx.db
      .query("offlineSyncQueue")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "completed"))
      .filter((q) => q.lt(q.field("updatedAt"), cutoff))
      .collect();

    for (const item of completed) {
      await ctx.db.delete(item._id);
    }

    return { deleted: completed.length };
  },
});

// Retry failed items
export const retryFailed = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const failed = await ctx.db
      .query("offlineSyncQueue")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "failed"))
      .collect();

    for (const item of failed) {
      await ctx.db.patch(item._id, {
        status: "pending",
        attempts: 0,
        error: undefined,
        updatedAt: Date.now(),
      });
    }

    return { retried: failed.length };
  },
});

// Get all queue items for debugging
export const listQueue = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("offlineSyncQueue")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50); // Limit to recent 50 items
  },
});
