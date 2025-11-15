import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

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
        .withIndex("by_user_read", (q) =>
          q.eq("userId", userId).eq("isRead", false)
        );
    }

    const notifications = await notificationsQuery
      .order("desc")
      .take(limit);

    return notifications;
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
      .withIndex("by_user_read", (q) =>
        q.eq("userId", userId).eq("isRead", false)
      )
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
      .withIndex("by_user_read", (q) =>
        q.eq("userId", userId).eq("isRead", false)
      )
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
    type: v.union(
      v.literal("issue_assigned"),
      v.literal("issue_mentioned"),
      v.literal("issue_commented"),
      v.literal("issue_status_changed"),
      v.literal("sprint_started"),
      v.literal("sprint_ended")
    ),
    title: v.string(),
    message: v.string(),
    issueId: v.optional(v.id("issues")),
    projectId: v.optional(v.id("projects")),
    sprintId: v.optional(v.id("sprints")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      issueId: args.issueId,
      projectId: args.projectId,
      sprintId: args.sprintId,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});
