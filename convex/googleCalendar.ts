import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { notFound } from "./lib/errors";
import { syncDirections } from "./validators";

// Internal mutation for connecting Google Calendar (called from HTTP action)
export const connectGoogleInternal = internalMutation({
  args: {
    userId: v.id("users"),
    providerAccountId: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    syncDirection: v.optional(syncDirections),
  },
  handler: async (ctx, args) => {
    const { userId, ...connectionArgs } = args;

    // Check if connection already exists for this provider
    const existing = await ctx.db
      .query("calendarConnections")
      .withIndex("by_user_provider", (q) => q.eq("userId", userId).eq("provider", "google"))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing connection
      await ctx.db.patch(existing._id, {
        providerAccountId: connectionArgs.providerAccountId,
        accessToken: connectionArgs.accessToken,
        refreshToken: connectionArgs.refreshToken,
        expiresAt: connectionArgs.expiresAt,
        syncDirection: connectionArgs.syncDirection || "bidirectional",
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new connection
    return await ctx.db.insert("calendarConnections", {
      userId,
      provider: "google",
      providerAccountId: connectionArgs.providerAccountId,
      accessToken: connectionArgs.accessToken,
      refreshToken: connectionArgs.refreshToken,
      expiresAt: connectionArgs.expiresAt,
      syncDirection: connectionArgs.syncDirection || "bidirectional",
      syncEnabled: true,
      lastSyncAt: undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Connect Google Calendar (OAuth callback) - for authenticated users
export const connectGoogle = authenticatedMutation({
  args: {
    providerAccountId: v.string(), // Google email
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    syncDirection: v.optional(syncDirections),
  },
  handler: async (ctx, args) => {
    // Check if connection already exists for this provider
    const existing = await ctx.db
      .query("calendarConnections")
      .withIndex("by_user_provider", (q) => q.eq("userId", ctx.userId).eq("provider", "google"))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing connection
      await ctx.db.patch(existing._id, {
        providerAccountId: args.providerAccountId,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new connection
    return await ctx.db.insert("calendarConnections", {
      userId: ctx.userId,
      provider: "google",
      providerAccountId: args.providerAccountId,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresAt: args.expiresAt,
      syncEnabled: true,
      syncDirection: args.syncDirection ?? "bidirectional",
      lastSyncAt: undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get Google Calendar connection
export const getConnection = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("calendarConnections")
      .withIndex("by_user_provider", (q) => q.eq("userId", ctx.userId).eq("provider", "google"))
      .first();
  },
});

// Disconnect Google Calendar
export const disconnectGoogle = authenticatedMutation({
  args: {},
  handler: async (ctx) => {
    const connection = await ctx.db
      .query("calendarConnections")
      .withIndex("by_user_provider", (q) => q.eq("userId", ctx.userId).eq("provider", "google"))
      .first();

    if (connection) {
      await ctx.db.delete(connection._id);
    }
  },
});

// Update sync settings
export const updateSyncSettings = authenticatedMutation({
  args: {
    syncEnabled: v.optional(v.boolean()),
    syncDirection: v.optional(syncDirections),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("calendarConnections")
      .withIndex("by_user_provider", (q) => q.eq("userId", ctx.userId).eq("provider", "google"))
      .first();

    if (!connection) {
      throw notFound("calendarConnection");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.syncEnabled !== undefined) updates.syncEnabled = args.syncEnabled;
    if (args.syncDirection !== undefined) updates.syncDirection = args.syncDirection;

    await ctx.db.patch(connection._id, updates);
  },
});

// Refresh access token (called by backend sync process)
export const refreshToken = mutation({
  args: {
    connectionId: v.id("calendarConnections"),
    newAccessToken: v.string(),
    newRefreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) throw notFound("calendarConnection", args.connectionId);

    await ctx.db.patch(args.connectionId, {
      accessToken: args.newAccessToken,
      refreshToken: args.newRefreshToken ?? connection.refreshToken,
      expiresAt: args.expiresAt,
      updatedAt: Date.now(),
    });
  },
});

// Mark sync as completed
export const markSynced = mutation({
  args: {
    connectionId: v.id("calendarConnections"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      lastSyncAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get all calendar connections for user (for settings UI)
export const listConnections = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("calendarConnections")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .collect();
  },
});

// Sync Google Calendar events to Nixelo (called by scheduled action)
// This would be implemented with Google Calendar API calls in production
export const syncFromGoogle = mutation({
  args: {
    connectionId: v.id("calendarConnections"),
    events: v.array(
      v.object({
        googleEventId: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
        startTime: v.number(),
        endTime: v.number(),
        allDay: v.boolean(),
        location: v.optional(v.string()),
        attendees: v.optional(v.array(v.string())),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) throw notFound("calendarConnection", args.connectionId);

    if (!connection.syncEnabled || connection.syncDirection === "export") {
      return { imported: 0 };
    }

    let imported = 0;

    for (const event of args.events) {
      // Check if event already exists
      // Note: In production, you'd want to track Google event IDs
      // For now, we'll just create the event
      await ctx.db.insert("calendarEvents", {
        title: event.title,
        description: event.description,
        startTime: event.startTime,
        endTime: event.endTime,
        allDay: event.allDay,
        location: event.location,
        eventType: "meeting",
        organizerId: connection.userId,
        attendeeIds: [], // Would need to map external emails to user IDs
        externalAttendees: event.attendees,
        status: "confirmed",
        isRecurring: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      imported++;
    }

    await ctx.db.patch(args.connectionId, {
      lastSyncAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { imported };
  },
});

// Get events that need to be synced to Google
export const getEventsToSync = authenticatedQuery({
  args: {
    since: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get connection
    const connection = await ctx.db
      .query("calendarConnections")
      .withIndex("by_user_provider", (q) => q.eq("userId", ctx.userId).eq("provider", "google"))
      .first();

    if (!connection?.syncEnabled || connection.syncDirection === "import") {
      return [];
    }

    // Get user's events since last sync
    const sinceTime = args.since ?? connection.lastSyncAt ?? 0;

    return await ctx.db
      .query("calendarEvents")
      .withIndex("by_organizer", (q) => q.eq("organizerId", ctx.userId))
      .filter((q) => q.gte(q.field("updatedAt"), sinceTime))
      .collect();
  },
});
