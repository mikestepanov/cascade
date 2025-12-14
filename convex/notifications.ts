import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

// Get notifications for current user
export const list = query({
  args: {
    limit: v.optional(v.number()),
    onlyUnread: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit ?? 50;
    const onlyUnread = args.onlyUnread ?? false;

    let notificationsQuery = ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    if (onlyUnread) {
      notificationsQuery = ctx.db
        .query("notifications")
        .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("isRead", false));
    }

    const notifications = await notificationsQuery.order("desc").take(limit);

    // Enrich with actor information
    return await Promise.all(
      notifications.map(async (notification) => {
        const actor = notification.actorId ? await ctx.db.get(notification.actorId) : null;

        return {
          ...notification,
          actorName: actor?.name,
        };
      }),
    );
  },
});

// Get unread count
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("isRead", false))
      .collect();

    return unread.length;
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const notification = await ctx.db.get(args.id);
    if (!notification) throw new Error("Notification not found");

    if (notification.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.id, { isRead: true });
  },
});

// Mark all as read
export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("isRead", false))
      .collect();

    for (const notification of unread) {
      await ctx.db.patch(notification._id, { isRead: true });
    }
  },
});

// Delete a notification
export const remove = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const notification = await ctx.db.get(args.id);
    if (!notification) throw new Error("Notification not found");

    if (notification.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.id);
  },
});

// Internal mutation to create a notification
export const create = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    issueId: v.optional(v.id("issues")),
    workspaceId: v.optional(v.id("workspaces")),
    documentId: v.optional(v.id("documents")),
    actorId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Don't create notification if user is the actor
    if (args.actorId === args.userId) {
      return;
    }

    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      issueId: args.issueId,
      workspaceId: args.workspaceId,
      documentId: args.documentId,
      actorId: args.actorId,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

// Helper to create notifications for multiple users
export const createBulk = internalMutation({
  args: {
    userIds: v.array(v.id("users")),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    issueId: v.optional(v.id("issues")),
    workspaceId: v.optional(v.id("workspaces")),
    documentId: v.optional(v.id("documents")),
    actorId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await Promise.all(
      args.userIds.map((userId) => {
        // Don't create notification if user is the actor
        if (args.actorId === userId) {
          return Promise.resolve();
        }

        return ctx.db.insert("notifications", {
          userId,
          type: args.type,
          title: args.title,
          message: args.message,
          issueId: args.issueId,
          workspaceId: args.workspaceId,
          documentId: args.documentId,
          actorId: args.actorId,
          isRead: false,
          createdAt: Date.now(),
        });
      }),
    );
  },
});

// Internal query to get notifications for digest emails
export const listForDigest = internalQuery({
  args: {
    userId: v.id("users"),
    startTime: v.number(),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q) =>
        q.eq("userId", args.userId).gte("createdAt", args.startTime),
      )
      .order("desc")
      .collect();

    // Enrich with actor information and issue details
    return await Promise.all(
      notifications.map(async (notification) => {
        const actor = notification.actorId ? await ctx.db.get(notification.actorId) : null;
        const issue = notification.issueId ? await ctx.db.get(notification.issueId) : null;

        return {
          ...notification,
          actorName: actor?.name,
          issueKey: issue?.key,
        };
      }),
    );
  },
});
