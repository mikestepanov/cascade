import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";

export const get = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getCurrent = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
    bio: v.optional(v.string()),
    timezone: v.optional(v.string()), // IANA timezone e.g. "America/New_York"
    emailNotifications: v.optional(v.boolean()),
    desktopNotifications: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const updates: {
      name?: string;
      email?: string;
      image?: string;
      bio?: string;
      timezone?: string;
      emailNotifications?: boolean;
      desktopNotifications?: boolean;
    } = {};

    if (args.name !== undefined) updates.name = args.name;
    if (args.email !== undefined) updates.email = args.email;
    if (args.avatar !== undefined) updates.image = args.avatar;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.timezone !== undefined) updates.timezone = args.timezone;
    if (args.emailNotifications !== undefined) updates.emailNotifications = args.emailNotifications;
    if (args.desktopNotifications !== undefined)
      updates.desktopNotifications = args.desktopNotifications;

    await ctx.db.patch(userId, updates);
  },
});

/**
 * Check if the current user is a platform admin
 * Returns true if user is:
 * - Owner or admin in any company
 * - Creator of any project (backward compatibility)
 * - Admin in any project (backward compatibility)
 */
export const isPlatformAdmin = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    // Primary: Check if user is admin or owner in any company
    const companyMembership = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.or(q.eq(q.field("role"), "admin"), q.eq(q.field("role"), "owner")))
      .first();

    if (companyMembership) return true;

    // Fallback: Check if user has created a project (backward compatibility)
    const createdProjects = await ctx.db
      .query("projects")
      .withIndex("by_creator", (q) => q.eq("createdBy", userId))
      .first();

    if (createdProjects) return true;

    // Fallback: Check if user has admin role in any project (backward compatibility)
    const adminMembership = await ctx.db
      .query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    return !!adminMembership;
  },
});

export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get issues created
    const issuesCreated = await ctx.db
      .query("issues")
      .withIndex("by_reporter", (q) => q.eq("reporterId", args.userId))
      .collect();

    // Get issues assigned
    const issuesAssigned = await ctx.db
      .query("issues")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.userId))
      .collect();

    // Get comments
    const comments = await ctx.db
      .query("issueComments")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .collect();

    // Get projects (as member)
    const projectMemberships = await ctx.db
      .query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return {
      issuesCreated: issuesCreated.length,
      issuesAssigned: issuesAssigned.length,
      issuesCompleted: issuesAssigned.filter((i) => {
        // Check if issue is in a "done" state - you'd need to check workflow states
        return i.status === "done";
      }).length,
      comments: comments.length,
      projects: projectMemberships.length,
    };
  },
});

/**
 * Internal query to get users with specific digest preferences
 * Used by cron jobs to send digest emails
 */
export const listWithDigestPreference = internalQuery({
  args: {
    frequency: v.union(v.literal("daily"), v.literal("weekly")),
  },
  handler: async (ctx, args) => {
    // Get all notification preferences where digest matches frequency and email is enabled
    const prefs = await ctx.db.query("notificationPreferences").collect();

    const filtered = prefs.filter(
      (pref) => pref.emailEnabled && pref.emailDigest === args.frequency,
    );

    // Get user details for each preference
    const users = await Promise.all(filtered.map((pref) => ctx.db.get(pref.userId)));

    // Filter out null users (in case user was deleted)
    return users.filter((user): user is NonNullable<typeof user> => user !== null);
  },
});
