/**
 * Notification Preferences
 *
 * Manages user email notification preferences
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

// Default preferences for new users
export const DEFAULT_PREFERENCES = {
  emailEnabled: true,
  emailMentions: true,
  emailAssignments: true,
  emailComments: true,
  emailStatusChanges: false, // Off by default (can be noisy)
  emailDigest: "none" as const,
  digestDay: undefined,
  digestTime: undefined,
};

/**
 * Get notification preferences for current user
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const prefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    // Return defaults if no preferences exist
    if (!prefs) {
      return {
        ...DEFAULT_PREFERENCES,
        userId,
        _id: undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    return prefs;
  },
});

/**
 * Get preferences for a specific user (internal only)
 */
export const getForUser = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!prefs) {
      return DEFAULT_PREFERENCES;
    }

    return prefs;
  },
});

/**
 * Update notification preferences
 */
export const update = mutation({
  args: {
    emailEnabled: v.optional(v.boolean()),
    emailMentions: v.optional(v.boolean()),
    emailAssignments: v.optional(v.boolean()),
    emailComments: v.optional(v.boolean()),
    emailStatusChanges: v.optional(v.boolean()),
    emailDigest: v.optional(v.union(v.literal("none"), v.literal("daily"), v.literal("weekly"))),
    digestDay: v.optional(v.string()),
    digestTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const updates = {
      ...args,
      updatedAt: Date.now(),
    };

    if (existing) {
      // Update existing preferences
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    } else {
      // Create new preferences
      return await ctx.db.insert("notificationPreferences", {
        userId,
        emailEnabled: args.emailEnabled ?? DEFAULT_PREFERENCES.emailEnabled,
        emailMentions: args.emailMentions ?? DEFAULT_PREFERENCES.emailMentions,
        emailAssignments: args.emailAssignments ?? DEFAULT_PREFERENCES.emailAssignments,
        emailComments: args.emailComments ?? DEFAULT_PREFERENCES.emailComments,
        emailStatusChanges: args.emailStatusChanges ?? DEFAULT_PREFERENCES.emailStatusChanges,
        emailDigest: args.emailDigest ?? DEFAULT_PREFERENCES.emailDigest,
        digestDay: args.digestDay,
        digestTime: args.digestTime,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Create default preferences for a new user (called during signup)
 */
export const createDefault = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Check if preferences already exist
    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create default preferences
    return await ctx.db.insert("notificationPreferences", {
      userId: args.userId,
      ...DEFAULT_PREFERENCES,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Check if user should receive email for a specific notification type
 */
export const shouldSendEmail = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.string(), // "mention", "assigned", "comment", "status_change"
  },
  handler: async (ctx, args): Promise<boolean> => {
    const prefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    // If no preferences, use defaults
    const preferences = prefs || DEFAULT_PREFERENCES;

    // Check master toggle
    if (!preferences.emailEnabled) {
      return false;
    }

    // Check specific notification type
    switch (args.type) {
      case "mention":
        return preferences.emailMentions;
      case "assigned":
        return preferences.emailAssignments;
      case "comment":
        return preferences.emailComments;
      case "status_change":
        return preferences.emailStatusChanges;
      default:
        return false;
    }
  },
});
