import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { internalMutation, internalQuery } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { batchFetchIssues, batchFetchUsers } from "./lib/batchHelpers";
import { notFound, requireOwned } from "./lib/errors";
import { fetchPaginatedQuery } from "./lib/queryHelpers";
import { notDeleted, softDeleteFields } from "./lib/softDeleteHelpers";

// Get notifications for current user
export const list = authenticatedQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    onlyUnread: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const onlyUnread = args.onlyUnread ?? false;

    const results = await fetchPaginatedQuery<Doc<"notifications">>(ctx, {
      paginationOpts: args.paginationOpts,
      query: (db) => {
        if (onlyUnread) {
          return db
            .query("notifications")
            .withIndex("by_user_read", (q) => q.eq("userId", ctx.userId).eq("isRead", false))
            .filter(notDeleted);
        }
        return db
          .query("notifications")
          .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
          .filter(notDeleted);
      },
    });

    // Batch fetch all actors (avoid N+1!)
    const actorIds = results.page.map((n) => n.actorId);
    const actorMap = await batchFetchUsers(ctx, actorIds);

    // Enrich with pre-fetched data (no N+1)
    const enrichedPage = results.page.map((notification) => {
      const actor = notification.actorId ? actorMap.get(notification.actorId) : null;
      return {
        ...notification,
        actorName: actor?.name,
      };
    });

    return {
      ...results,
      page: enrichedPage,
    };
  },
});

// Get unread count (capped at 99+ for display)
export const getUnreadCount = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    // Cap at 100 - UI typically shows "99+" anyway
    const MAX_UNREAD_COUNT = 100;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", ctx.userId).eq("isRead", false))
      .filter(notDeleted)
      .take(MAX_UNREAD_COUNT);

    return unread.length;
  },
});

// Mark notification as read
export const markAsRead = authenticatedMutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.id);
    requireOwned(notification, ctx.userId, "notification");

    await ctx.db.patch(args.id, { isRead: true });
  },
});

// Mark all as read (with reasonable limit per call)
export const markAllAsRead = authenticatedMutation({
  args: {},
  returns: v.object({ marked: v.number(), hasMore: v.boolean() }),
  handler: async (ctx) => {
    // Limit per mutation call - can be called multiple times if needed
    const MAX_TO_MARK = 500;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", ctx.userId).eq("isRead", false))
      .filter(notDeleted)
      .take(MAX_TO_MARK);

    // Batch update all notifications in parallel
    await Promise.all(unread.map((n) => ctx.db.patch(n._id, { isRead: true })));

    // Return count so client knows if more remain
    return { marked: unread.length, hasMore: unread.length === MAX_TO_MARK };
  },
});

// Delete a notification
export const softDeleteNotification = authenticatedMutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.id);
    requireOwned(notification, ctx.userId, "notification");

    await ctx.db.patch(args.id, softDeleteFields(ctx.userId));
  },
});

// Internal mutation to create a notification
export const createNotification = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    issueId: v.optional(v.id("issues")),
    projectId: v.optional(v.id("projects")),
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
      projectId: args.projectId,
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
    projectId: v.optional(v.id("projects")),
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
          projectId: args.projectId,
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
    // Limit for digest - most recent notifications since startTime
    const MAX_DIGEST_NOTIFICATIONS = 100;
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q) =>
        q.eq("userId", args.userId).gte("createdAt", args.startTime),
      )
      .order("desc")
      .take(MAX_DIGEST_NOTIFICATIONS);

    // Batch fetch all actors and issues (avoid N+1!)
    const actorIds = notifications.map((n) => n.actorId);
    const issueIds = notifications.map((n) => n.issueId);

    const [actorMap, issueMap] = await Promise.all([
      batchFetchUsers(ctx, actorIds),
      batchFetchIssues(ctx, issueIds),
    ]);

    // Enrich with pre-fetched data (no N+1)
    return notifications.map((notification) => {
      const actor = notification.actorId ? actorMap.get(notification.actorId) : null;
      const issue = notification.issueId ? issueMap.get(notification.issueId) : null;

      return {
        ...notification,
        actorName: actor?.name,
        issueKey: issue?.key,
      };
    });
  },
});
