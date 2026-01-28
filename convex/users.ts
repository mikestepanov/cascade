import { v } from "convex/values";
import { pruneNull } from "convex-helpers";
import { internalQuery } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { batchFetchUsers } from "./lib/batchHelpers";
import { conflict, validation } from "./lib/errors";
import { MAX_PAGE_SIZE } from "./lib/queryLimits";
import { notDeleted } from "./lib/softDeleteHelpers";
import { sanitizeUserForAuth } from "./lib/userUtils";
import { digestFrequencies } from "./validators";

// Limits for user stats queries
const MAX_ISSUES_FOR_STATS = 1000;
const MAX_COMMENTS_FOR_STATS = 1000;

// Helper: Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Internal query to get user by ID (system use only)
 */
export const getInternal = internalQuery({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get a user by ID (sanitized for authenticated users)
 * Note: Does not check if requester should see this user.
 * For team contexts, ensure proper access checks.
 */
export const get = authenticatedQuery({
  args: { id: v.id("users") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      image: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    // Return sanitized user - strips sensitive fields beyond email
    return sanitizeUserForAuth(user);
  },
});

export const getCurrent = authenticatedQuery({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      image: v.optional(v.string()),
      // Add other fields as optional
      emailVerificationTime: v.optional(v.number()),
      phone: v.optional(v.string()),
      phoneVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      defaultOrganizationId: v.optional(v.id("organizations")),
      bio: v.optional(v.string()),
      timezone: v.optional(v.string()),
      emailNotifications: v.optional(v.boolean()),
      desktopNotifications: v.optional(v.boolean()),
      inviteId: v.optional(v.id("invites")),
      isTestUser: v.optional(v.boolean()),
      testUserCreatedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx) => {
    // Current user can see their full profile
    return await ctx.db.get(ctx.userId);
  },
});

export const updateProfile = authenticatedMutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
    bio: v.optional(v.string()),
    timezone: v.optional(v.string()), // IANA timezone e.g. "America/New_York"
    emailNotifications: v.optional(v.boolean()),
    desktopNotifications: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: {
      name?: string;
      email?: string;
      image?: string;
      bio?: string;
      timezone?: string;
      emailNotifications?: boolean;
      desktopNotifications?: boolean;
      emailVerificationTime?: number;
    } = {};

    if (args.name !== undefined) updates.name = args.name;

    if (args.email !== undefined) {
      if (!isValidEmail(args.email)) {
        throw validation("email", "Invalid email address");
      }

      // Check if email is already in use by another user
      const existingUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", args.email))
        .first();

      if (existingUser && existingUser._id !== ctx.userId) {
        throw conflict("Email already in use");
      }

      // Check if email actually changed
      const currentUser = await ctx.db.get(ctx.userId);
      if (currentUser?.email !== args.email) {
        updates.email = args.email;
        // Revoke email verification if email changed
        updates.emailVerificationTime = undefined;
      }
    }

    if (args.avatar !== undefined) updates.image = args.avatar;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.timezone !== undefined) updates.timezone = args.timezone;
    if (args.emailNotifications !== undefined) updates.emailNotifications = args.emailNotifications;
    if (args.desktopNotifications !== undefined)
      updates.desktopNotifications = args.desktopNotifications;

    await ctx.db.patch(ctx.userId, updates);
  },
});

/**
 * Check if the current user is an organization admin
 * Returns true if user is:
 * - Owner or admin in any organization
 * - Creator of any project (backward compatibility)
 * - Admin in any project (backward compatibility)
 */
export const isOrganizationAdmin = authenticatedQuery({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    // Primary: Check if user is admin or owner in any organization
    const adminMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user_role", (q) => q.eq("userId", ctx.userId).eq("role", "admin"))
      .first();

    if (adminMembership) return true;

    const ownerMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user_role", (q) => q.eq("userId", ctx.userId).eq("role", "owner"))
      .first();

    return !!ownerMembership;
  },
});

export const getUserStats = authenticatedQuery({
  args: { userId: v.id("users") },
  returns: v.object({
    issuesCreated: v.number(),
    issuesAssigned: v.number(),
    issuesCompleted: v.number(),
    comments: v.number(),
    projects: v.number(),
  }),
  handler: async (ctx, args) => {
    // If viewing another user, only count data from shared projects
    let allowedProjectIds: Set<string> | null = null;
    if (ctx.userId !== args.userId) {
      const myMemberships = await ctx.db
        .query("projectMembers")
        .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
        .filter(notDeleted)
        .take(MAX_PAGE_SIZE);
      allowedProjectIds = new Set(myMemberships.map((m) => m.projectId));
    }

    // Get issues created
    const issuesCreatedAll = await ctx.db
      .query("issues")
      .withIndex("by_reporter", (q) => q.eq("reporterId", args.userId))
      .filter(notDeleted)
      .take(MAX_ISSUES_FOR_STATS);

    const issuesCreated = allowedProjectIds
      ? issuesCreatedAll.filter((i) => allowedProjectIds.has(i.projectId))
      : issuesCreatedAll;

    // Get issues assigned
    const issuesAssignedAll = await ctx.db
      .query("issues")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.userId))
      .filter(notDeleted)
      .take(MAX_ISSUES_FOR_STATS);

    const issuesAssigned = allowedProjectIds
      ? issuesAssignedAll.filter((i) => allowedProjectIds.has(i.projectId))
      : issuesAssignedAll;

    // Get comments - filter by allowed projects when viewing another user
    const commentsAll = await ctx.db
      .query("issueComments")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .filter(notDeleted)
      .take(MAX_COMMENTS_FOR_STATS);

    // Filter comments by allowed projects (requires fetching parent issues)
    let comments = commentsAll;
    if (allowedProjectIds) {
      // Batch fetch unique issue IDs to check project membership
      const issueIds = [...new Set(commentsAll.map((c) => c.issueId))];
      const issues = await Promise.all(issueIds.map((id) => ctx.db.get(id)));
      const allowedIssueIds = new Set(
        issues
          .filter((issue) => issue && allowedProjectIds.has(issue.projectId))
          .map((issue) => issue?._id),
      );
      comments = commentsAll.filter((c) => allowedIssueIds.has(c.issueId));
    }

    // Get projects (as member)
    const projectMembershipsAll = await ctx.db
      .query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter(notDeleted)
      .take(MAX_PAGE_SIZE);

    const projectMemberships = allowedProjectIds
      ? projectMembershipsAll.filter((m) => allowedProjectIds.has(m.projectId))
      : projectMembershipsAll;

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
    frequency: digestFrequencies,
  },
  returns: v.array(
    v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      image: v.optional(v.string()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    // Bounded query for notification preferences
    const prefs = await ctx.db.query("notificationPreferences").take(1000);

    const filtered = prefs.filter(
      (pref) => pref.emailEnabled && pref.emailDigest === args.frequency,
    );

    // Batch fetch users to avoid N+1 queries
    const userIds = filtered.map((pref) => pref.userId);
    const userMap = await batchFetchUsers(ctx, userIds);

    // Return users that exist (filter out deleted users)
    return pruneNull(
      filtered.map((pref) => {
        const user = userMap.get(pref.userId);
        if (!user) return null;
        return {
          _id: user._id,
          name: user.name ?? user.email ?? "Unknown",
          email: user.email,
          image: user.image,
          createdAt: user._creationTime,
        };
      }),
    );
  },
});
