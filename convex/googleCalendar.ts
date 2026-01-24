import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { decrypt, encrypt } from "./lib/encryption";
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

    // Encrypt tokens before storage
    const encryptedAccessToken = await encrypt(connectionArgs.accessToken);
    const encryptedRefreshToken = connectionArgs.refreshToken
      ? await encrypt(connectionArgs.refreshToken)
      : undefined;

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
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
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
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt: connectionArgs.expiresAt,
      syncDirection: connectionArgs.syncDirection || "bidirectional",
      syncEnabled: true,
      lastSyncAt: undefined,
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
    // Encrypt tokens before storage
    const encryptedAccessToken = await encrypt(args.accessToken);
    const encryptedRefreshToken = args.refreshToken ? await encrypt(args.refreshToken) : undefined;

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
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
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
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt: args.expiresAt,
      syncEnabled: true,
      syncDirection: args.syncDirection ?? "bidirectional",
      lastSyncAt: undefined,
      updatedAt: now,
    });
  },
});

// Get Google Calendar connection (without decrypted tokens - for UI display)
export const getConnection = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    const connection = await ctx.db
      .query("calendarConnections")
      .withIndex("by_user_provider", (q) => q.eq("userId", ctx.userId).eq("provider", "google"))
      .first();

    if (!connection) return null;

    // Return connection without exposing tokens to frontend
    return {
      _id: connection._id,
      _creationTime: connection._creationTime,
      userId: connection.userId,
      provider: connection.provider,
      providerAccountId: connection.providerAccountId,
      expiresAt: connection.expiresAt,
      syncEnabled: connection.syncEnabled,
      syncDirection: connection.syncDirection,
      lastSyncAt: connection.lastSyncAt,
      updatedAt: connection.updatedAt,
      // Don't expose tokens to frontend
      hasAccessToken: !!connection.accessToken,
      hasRefreshToken: !!connection.refreshToken,
    };
  },
});

// Internal helper to get decrypted tokens (for backend sync processes)
export const getDecryptedTokens = internalMutation({
  args: {
    connectionId: v.id("calendarConnections"),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) return null;

    return {
      accessToken: await decrypt(connection.accessToken),
      refreshToken: connection.refreshToken ? await decrypt(connection.refreshToken) : undefined,
      expiresAt: connection.expiresAt,
    };
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

    // Encrypt new tokens before storage
    const encryptedAccessToken = await encrypt(args.newAccessToken);
    const encryptedRefreshToken = args.newRefreshToken
      ? await encrypt(args.newRefreshToken)
      : connection.refreshToken;

    await ctx.db.patch(args.connectionId, {
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
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
      .take(BOUNDED_LIST_LIMIT);
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

    const now = Date.now();

    // Insert all events in parallel
    await Promise.all(
      args.events.map((event) =>
        ctx.db.insert("calendarEvents", {
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
          updatedAt: now,
        }),
      ),
    );

    await ctx.db.patch(args.connectionId, {
      lastSyncAt: now,
      updatedAt: now,
    });

    return { imported: args.events.length };
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
      .take(BOUNDED_LIST_LIMIT);
  },
});
