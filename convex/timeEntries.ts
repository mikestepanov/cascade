import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Log time on an issue
export const create = mutation({
  args: {
    issueId: v.id("issues"),
    hours: v.number(),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const issue = await ctx.db.get(args.issueId);
    if (!issue) throw new Error("Issue not found");

    // Create time entry
    const entryId = await ctx.db.insert("timeEntries", {
      issueId: args.issueId,
      userId: userId,
      hours: args.hours,
      description: args.description,
      date: args.date ?? Date.now(),
      createdAt: Date.now(),
    });

    // Update issue's total logged hours
    const currentHours = issue.loggedHours ?? 0;
    await ctx.db.patch(args.issueId, {
      loggedHours: currentHours + args.hours,
    });

    // Log activity
    await ctx.db.insert("issueActivity", {
      issueId: args.issueId,
      userId: userId,
      action: "logged_time",
      field: "loggedHours",
      newValue: `${args.hours}h`,
      createdAt: Date.now(),
    });

    return entryId;
  },
});

// Get time entries for an issue
export const listByIssue = query({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const entries = await ctx.db
      .query("timeEntries")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .collect();

    // Enrich with user data
    const enriched = await Promise.all(
      entries.map(async (entry) => {
        const user = await ctx.db.get(entry.userId);
        return {
          ...entry,
          userName: user?.name ?? "Unknown User",
        };
      }),
    );

    return enriched.sort((a, b) => b.date - a.date);
  },
});

// Get time entries for a user
export const listByUser = query({
  args: {
    userId: v.optional(v.id("users")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const targetUserId = args.userId ?? userId;

    let entries = await ctx.db
      .query("timeEntries")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .collect();

    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      entries = entries.filter((entry) => {
        if (args.startDate && entry.date < args.startDate) return false;
        if (args.endDate && entry.date > args.endDate) return false;
        return true;
      });
    }

    // Enrich with issue data
    const enriched = await Promise.all(
      entries.map(async (entry) => {
        const issue = await ctx.db.get(entry.issueId);
        return {
          ...entry,
          issueKey: issue?.key,
          issueTitle: issue?.title,
        };
      }),
    );

    return enriched.sort((a, b) => b.date - a.date);
  },
});

// Update a time entry
export const update = mutation({
  args: {
    id: v.id("timeEntries"),
    hours: v.optional(v.number()),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const entry = await ctx.db.get(args.id);
    if (!entry) throw new Error("Time entry not found");

    // Only the creator can edit their time entry
    if (entry.userId !== userId) {
      throw new Error("Not authorized");
    }

    const oldHours = entry.hours;
    const updates: Partial<typeof entry> = {};
    if (args.hours !== undefined) updates.hours = args.hours;
    if (args.description !== undefined) updates.description = args.description;
    if (args.date !== undefined) updates.date = args.date;

    await ctx.db.patch(args.id, updates);

    // Update issue's total if hours changed
    if (args.hours !== undefined && args.hours !== oldHours) {
      const issue = await ctx.db.get(entry.issueId);
      if (issue) {
        const currentTotal = issue.loggedHours ?? 0;
        const newTotal = currentTotal - oldHours + args.hours;
        await ctx.db.patch(entry.issueId, {
          loggedHours: Math.max(0, newTotal),
        });
      }
    }
  },
});

// Delete a time entry
export const remove = mutation({
  args: { id: v.id("timeEntries") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const entry = await ctx.db.get(args.id);
    if (!entry) throw new Error("Time entry not found");

    // Only the creator can delete their time entry
    if (entry.userId !== userId) {
      throw new Error("Not authorized");
    }

    // Update issue's total
    const issue = await ctx.db.get(entry.issueId);
    if (issue) {
      const currentTotal = issue.loggedHours ?? 0;
      await ctx.db.patch(entry.issueId, {
        loggedHours: Math.max(0, currentTotal - entry.hours),
      });
    }

    await ctx.db.delete(args.id);
  },
});
