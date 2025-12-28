import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return settings;
  },
});

export const update = mutation({
  args: {
    dashboardLayout: v.optional(v.any()), // JSON
    theme: v.optional(v.string()),
    sidebarCollapsed: v.optional(v.boolean()),
    emailNotifications: v.optional(v.boolean()),
    desktopNotifications: v.optional(v.boolean()),
    timezone: v.optional(v.string()), // IANA timezone
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated");
    }

    const existinghelper = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existinghelper) {
      await ctx.db.patch(existinghelper._id, {
        ...args,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userSettings", {
        userId,
        ...args,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});
