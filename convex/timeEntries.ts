import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Start a timer for an issue
export const startTimer = mutation({
  args: {
    issueId: v.id("issues"),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Stop any existing timer for this user
    const existingTimer = await ctx.db
      .query("activeTimers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingTimer) {
      await ctx.db.delete(existingTimer._id);
    }

    // Start new timer
    return await ctx.db.insert("activeTimers", {
      userId,
      issueId: args.issueId,
      startedAt: Date.now(),
      description: args.description,
    });
  },
});

// Stop timer and create time entry
export const stopTimer = mutation({
  args: {
    billable: v.optional(v.boolean()),
    hourlyRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const timer = await ctx.db
      .query("activeTimers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!timer) throw new Error("No active timer");

    const hours = (Date.now() - timer.startedAt) / (1000 * 60 * 60); // Convert ms to hours

    // Get project to determine default billable status
    const issue = await ctx.db.get(timer.issueId);
    if (!issue) throw new Error("Issue not found");

    const project = await ctx.db.get(issue.projectId);

    // Create time entry
    const entryId = await ctx.db.insert("timeEntries", {
      issueId: timer.issueId,
      userId: userId,
      hours: Math.round(hours * 100) / 100, // Round to 2 decimals
      description: timer.description,
      date: timer.startedAt, // Use start time as date
      billable: args.billable ?? true, // Default to billable
      hourlyRate: args.hourlyRate ?? project?.defaultHourlyRate,
      createdAt: Date.now(),
    });

    // Update issue's total logged hours
    const currentHours = issue.loggedHours ?? 0;
    await ctx.db.patch(timer.issueId, {
      loggedHours: currentHours + hours,
    });

    // Log activity
    await ctx.db.insert("issueActivity", {
      issueId: timer.issueId,
      userId: userId,
      action: "logged_time",
      field: "loggedHours",
      newValue: `${Math.round(hours * 100) / 100}h`,
      createdAt: Date.now(),
    });

    // Delete timer
    await ctx.db.delete(timer._id);

    return entryId;
  },
});

// Get active timer for current user
export const getActiveTimer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const timer = await ctx.db
      .query("activeTimers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!timer) return null;

    // Enrich with issue data
    const issue = await ctx.db.get(timer.issueId);
    return {
      ...timer,
      issueKey: issue?.key,
      issueTitle: issue?.title,
      elapsed: Date.now() - timer.startedAt, // Milliseconds
    };
  },
});

// Log time on an issue (manual entry)
export const create = mutation({
  args: {
    issueId: v.id("issues"),
    hours: v.number(),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
    billable: v.optional(v.boolean()),
    hourlyRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const issue = await ctx.db.get(args.issueId);
    if (!issue) throw new Error("Issue not found");

    // Get project for default rate
    const project = await ctx.db.get(issue.projectId);

    // Create time entry
    const entryId = await ctx.db.insert("timeEntries", {
      issueId: args.issueId,
      userId: userId,
      hours: args.hours,
      description: args.description,
      date: args.date ?? Date.now(),
      billable: args.billable ?? true,
      hourlyRate: args.hourlyRate ?? project?.defaultHourlyRate,
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
    billable: v.optional(v.boolean()),
    hourlyRate: v.optional(v.number()),
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
    if (args.billable !== undefined) updates.billable = args.billable;
    if (args.hourlyRate !== undefined) updates.hourlyRate = args.hourlyRate;

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

// Get billing report for a project (for agencies)
export const getProjectBilling = query({
  args: {
    projectId: v.id("projects"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get all issues for this project
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const issueIds = issues.map((i) => i._id);

    // Get all time entries for these issues
    let allEntries: any[] = [];
    for (const issueId of issueIds) {
      const entries = await ctx.db
        .query("timeEntries")
        .withIndex("by_issue", (q) => q.eq("issueId", issueId))
        .collect();
      allEntries.push(...entries);
    }

    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      allEntries = allEntries.filter((entry) => {
        if (args.startDate && entry.date < args.startDate) return false;
        if (args.endDate && entry.date > args.endDate) return false;
        return true;
      });
    }

    // Calculate totals
    const totalHours = allEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const billableHours = allEntries
      .filter((e) => e.billable)
      .reduce((sum, entry) => sum + entry.hours, 0);
    const nonBillableHours = totalHours - billableHours;

    const totalRevenue = allEntries
      .filter((e) => e.billable && e.hourlyRate)
      .reduce((sum, entry) => sum + entry.hours * (entry.hourlyRate || 0), 0);

    // Group by user
    const byUser: Record<string, { hours: number; billableHours: number; revenue: number }> = {};
    for (const entry of allEntries) {
      const user = await ctx.db.get(entry.userId);
      const userName = user?.name ?? "Unknown";

      if (!byUser[userName]) {
        byUser[userName] = { hours: 0, billableHours: 0, revenue: 0 };
      }

      byUser[userName].hours += entry.hours;
      if (entry.billable) {
        byUser[userName].billableHours += entry.hours;
        byUser[userName].revenue += entry.hours * (entry.hourlyRate || 0);
      }
    }

    return {
      totalHours,
      billableHours,
      nonBillableHours,
      totalRevenue,
      byUser,
      entries: allEntries.length,
    };
  },
});

// Get timesheet for current week (for agencies)
export const getCurrentWeekTimesheet = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get start of current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust when day is Sunday
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    const startDate = monday.getTime();
    const endDate = monday.getTime() + 7 * 24 * 60 * 60 * 1000; // 7 days later

    // Get entries for the week
    let entries = await ctx.db
      .query("timeEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    entries = entries.filter((entry) => entry.date >= startDate && entry.date < endDate);

    // Enrich with issue/project data
    const enriched = await Promise.all(
      entries.map(async (entry) => {
        const issue = await ctx.db.get(entry.issueId);
        const project = issue ? await ctx.db.get(issue.projectId) : null;
        return {
          ...entry,
          issueKey: issue?.key,
          issueTitle: issue?.title,
          projectKey: project?.key,
          projectName: project?.name,
        };
      }),
    );

    // Group by day
    const byDay: Record<string, any[]> = {};
    for (const entry of enriched) {
      const date = new Date(entry.date);
      const dayKey = date.toISOString().split("T")[0];
      if (!byDay[dayKey]) {
        byDay[dayKey] = [];
      }
      byDay[dayKey].push(entry);
    }

    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
    const billableHours = entries.filter((e) => e.billable).reduce((sum, e) => sum + e.hours, 0);

    return {
      startDate,
      endDate,
      entries: enriched,
      byDay,
      totalHours,
      billableHours,
    };
  },
});
