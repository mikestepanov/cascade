import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";
import {
  batchFetchIssues,
  batchFetchProjects,
  batchFetchUsers,
  getUserName,
} from "./lib/batchHelpers";
import { assertCanAccessProject, assertIsProjectAdmin } from "./projectAccess";

/**
 * Native Time Tracking - Kimai-like Features
 *
 * Track time on projects and issues, calculate burn rate,
 * manage costs and hourly rates.
 */

// Helper: Build time entry field updates
function buildTimeEntryUpdates(args: {
  description?: string;
  activity?: string;
  tags?: string[];
  billable?: boolean;
  startTime?: number;
  endTime?: number;
}): Record<string, unknown> {
  const updates: Record<string, unknown> = { updatedAt: Date.now() };

  if (args.description !== undefined) updates.description = args.description;
  if (args.activity !== undefined) updates.activity = args.activity;
  if (args.tags !== undefined) updates.tags = args.tags;
  if (args.billable !== undefined) updates.billable = args.billable;
  if (args.startTime !== undefined) updates.startTime = args.startTime;
  if (args.endTime !== undefined) updates.endTime = args.endTime;

  return updates;
}

// Helper: Calculate duration and cost for time entry
function calculateTimeEntryCost(
  startTime: number,
  endTime: number,
  hourlyRate?: number,
): { duration: number; totalCost: number } {
  const duration = Math.floor((endTime - startTime) / 1000);
  const hours = duration / 3600;
  const totalCost = hourlyRate ? hours * hourlyRate : 0;

  return { duration, totalCost };
}

// ===== Time Entry Management =====

export const startTimer = mutation({
  args: {
    projectId: v.optional(v.id("projects")),
    issueId: v.optional(v.id("issues")),
    description: v.optional(v.string()),
    activity: v.optional(v.string()),
    billable: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user has any running timers
    const runningTimers = await ctx.db
      .query("timeEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("endTime"), undefined))
      .collect();

    if (runningTimers.length > 0) {
      throw new Error("You already have a running timer. Stop it first.");
    }

    // Check project permissions if specified
    if (args.projectId) {
      await assertCanAccessProject(ctx, args.projectId, userId);
    }

    // Get user's current rate
    const rate = await getUserCurrentRate(ctx, userId, args.projectId);

    const now = Date.now();
    const startOfDay = new Date(now).setHours(0, 0, 0, 0);

    return await ctx.db.insert("timeEntries", {
      userId,
      projectId: args.projectId,
      issueId: args.issueId,
      startTime: now,
      endTime: undefined,
      duration: 0,
      date: startOfDay,
      description: args.description,
      activity: args.activity,
      tags: args.tags ?? [],
      hourlyRate: rate?.hourlyRate,
      totalCost: 0,
      currency: rate?.currency || "USD",
      billable: args.billable ?? false,
      billed: false,
      invoiceId: undefined,
      isEquityHour: false,
      equityValue: undefined,
      isLocked: false,
      isApproved: false,
      approvedBy: undefined,
      approvedAt: undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const stopTimer = mutation({
  args: {
    entryId: v.id("timeEntries"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error("Time entry not found");
    }

    if (entry.userId !== userId) {
      throw new Error("Not authorized");
    }

    if (entry.endTime) {
      throw new Error("Timer already stopped");
    }

    const now = Date.now();
    const duration = Math.floor((now - entry.startTime) / 1000); // seconds
    const hours = duration / 3600;
    const totalCost = entry.hourlyRate ? hours * entry.hourlyRate : 0;

    await ctx.db.patch(args.entryId, {
      endTime: now,
      duration,
      totalCost,
      updatedAt: now,
    });

    return { duration, totalCost };
  },
});

export const createTimeEntry = mutation({
  args: {
    projectId: v.optional(v.id("projects")),
    issueId: v.optional(v.id("issues")),
    startTime: v.number(),
    endTime: v.number(),
    description: v.optional(v.string()),
    activity: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    billable: v.optional(v.boolean()),
    isEquityHour: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check project permissions if specified
    if (args.projectId) {
      await assertCanAccessProject(ctx, args.projectId, userId);
    }

    // Validate time range
    if (args.endTime <= args.startTime) {
      throw new Error("End time must be after start time");
    }

    // Get user's current rate
    const rate = await getUserCurrentRate(ctx, userId, args.projectId);

    const duration = Math.floor((args.endTime - args.startTime) / 1000);
    const hours = duration / 3600;
    const totalCost = rate?.hourlyRate ? hours * rate.hourlyRate : 0;

    const now = Date.now();
    const startOfDay = new Date(args.startTime).setHours(0, 0, 0, 0);

    return await ctx.db.insert("timeEntries", {
      userId,
      projectId: args.projectId,
      issueId: args.issueId,
      startTime: args.startTime,
      endTime: args.endTime,
      duration,
      date: startOfDay,
      description: args.description,
      activity: args.activity,
      tags: args.tags || [],
      hourlyRate: rate?.hourlyRate,
      totalCost,
      currency: rate?.currency || "USD",
      billable: args.billable ?? true,
      billed: false,
      invoiceId: undefined,
      isEquityHour: args.isEquityHour ?? false,
      equityValue: undefined,
      isLocked: false,
      isApproved: false,
      approvedBy: undefined,
      approvedAt: undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateTimeEntry = mutation({
  args: {
    entryId: v.id("timeEntries"),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    description: v.optional(v.string()),
    activity: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    billable: v.optional(v.boolean()),
    isEquityHour: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error("Time entry not found");
    }

    if (entry.userId !== userId) {
      throw new Error("Not authorized");
    }

    if (entry.isLocked) {
      throw new Error("Cannot edit locked time entry");
    }

    // Build basic field updates
    const updates = buildTimeEntryUpdates(args);

    // Recalculate duration and cost if times changed
    const startTime = args.startTime ?? entry.startTime;
    const endTime = args.endTime ?? entry.endTime;

    if (endTime && startTime) {
      const { duration, totalCost } = calculateTimeEntryCost(startTime, endTime, entry.hourlyRate);
      updates.duration = duration;
      updates.totalCost = totalCost;
    }

    await ctx.db.patch(args.entryId, updates);
  },
});

export const deleteTimeEntry = mutation({
  args: {
    entryId: v.id("timeEntries"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error("Time entry not found");
    }

    if (entry.userId !== userId) {
      throw new Error("Not authorized");
    }

    if (entry.isLocked) {
      throw new Error("Cannot delete locked time entry");
    }

    if (entry.billed) {
      throw new Error("Cannot delete billed time entry");
    }

    await ctx.db.delete(args.entryId);
  },
});

// ===== Queries =====

export const getRunningTimer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const runningTimer = await ctx.db
      .query("timeEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("endTime"), undefined))
      .first();

    if (!runningTimer) {
      return null;
    }

    // Enrich with project and issue data
    const project = runningTimer.projectId ? await ctx.db.get(runningTimer.projectId) : null;
    const issue = runningTimer.issueId ? await ctx.db.get(runningTimer.issueId) : null;

    // Calculate current duration
    const now = Date.now();
    const currentDuration = Math.floor((now - runningTimer.startTime) / 1000);
    const hours = currentDuration / 3600;
    const currentCost = runningTimer.hourlyRate ? hours * runningTimer.hourlyRate : 0;

    return {
      ...runningTimer,
      currentDuration,
      currentCost,
      project: project
        ? {
            _id: project._id,
            name: project.name,
            key: project.key,
          }
        : null,
      issue: issue
        ? {
            _id: issue._id,
            key: issue.key,
            title: issue.title,
          }
        : null,
    };
  },
});

export const listTimeEntries = query({
  args: {
    projectId: v.optional(v.id("projects")),
    issueId: v.optional(v.id("issues")),
    userId: v.optional(v.id("users")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      return [];
    }

    const userId = args.userId || currentUserId;

    let entries: Doc<"timeEntries">[];

    if (args.projectId && args.startDate !== undefined && args.endDate !== undefined) {
      const startDate = args.startDate;
      const endDate = args.endDate;
      const projectId = args.projectId;
      entries = await ctx.db
        .query("timeEntries")
        .withIndex("by_project_date", (q) =>
          q.eq("projectId", projectId).gte("date", startDate).lte("date", endDate),
        )
        .filter((q) => q.eq(q.field("userId"), userId))
        .order("desc")
        .take(args.limit || 100);
    } else if (args.startDate !== undefined && args.endDate !== undefined) {
      const startDate = args.startDate;
      const endDate = args.endDate;
      entries = await ctx.db
        .query("timeEntries")
        .withIndex("by_user_date", (q) =>
          q.eq("userId", userId).gte("date", startDate).lte("date", endDate),
        )
        .order("desc")
        .take(args.limit || 100);
    } else if (args.issueId) {
      entries = await ctx.db
        .query("timeEntries")
        .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
        .filter((q) => q.eq(q.field("userId"), userId))
        .order("desc")
        .take(args.limit || 100);
    } else {
      entries = await ctx.db
        .query("timeEntries")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .take(args.limit || 100);
    }

    // Batch fetch all related data (avoid N+1!)
    const userIds = entries.map((e) => e.userId);
    const projectIds = entries.map((e) => e.projectId);
    const issueIds = entries.map((e) => e.issueId);

    const [userMap, projectMap, issueMap] = await Promise.all([
      batchFetchUsers(ctx, userIds),
      batchFetchProjects(ctx, projectIds),
      batchFetchIssues(ctx, issueIds),
    ]);

    // Enrich with pre-fetched data (no N+1)
    return entries.map((entry) => {
      const user = userMap.get(entry.userId);
      const project = entry.projectId ? projectMap.get(entry.projectId) : null;
      const issue = entry.issueId ? issueMap.get(entry.issueId) : null;

      return {
        ...entry,
        user: user
          ? {
              _id: user._id,
              name: user.name || user.email || "Unknown",
              email: user.email,
              image: user.image,
            }
          : null,
        project: project
          ? {
              _id: project._id,
              name: project.name,
              key: project.key,
            }
          : null,
        issue: issue
          ? {
              _id: issue._id,
              key: issue.key,
              title: issue.title,
            }
          : null,
      };
    });
  },
});

// Get current week timesheet for the logged in user
export const getCurrentWeekTimesheet = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // Calculate week start (Monday) and end (Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diffToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const startDate = weekStart.getTime();
    const endDate = weekEnd.getTime();

    // Get all entries for the week
    const entries = await ctx.db
      .query("timeEntries")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).gte("date", startDate).lte("date", endDate),
      )
      .collect();

    // Group by day
    const byDay: Record<string, Array<Doc<"timeEntries"> & { hours: number }>> = {};
    let totalHours = 0;
    let billableHours = 0;

    for (const entry of entries) {
      const dayKey = new Date(entry.date).toISOString().split("T")[0];
      const hours = entry.duration / 3600;

      if (!byDay[dayKey]) {
        byDay[dayKey] = [];
      }

      byDay[dayKey].push({ ...entry, hours });
      totalHours += hours;

      if (entry.billable) {
        billableHours += hours;
      }
    }

    return {
      startDate,
      endDate,
      byDay,
      totalHours,
      billableHours,
      entries: entries.length,
    };
  },
});

// ===== Burn Rate & Cost Analysis =====

export const getBurnRate = query({
  args: {
    projectId: v.id("projects"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // Check permissions
    await assertCanAccessProject(ctx, args.projectId, userId);

    // Get all time entries in date range
    const entries = await ctx.db
      .query("timeEntries")
      .withIndex("by_project_date", (q) =>
        q.eq("projectId", args.projectId).gte("date", args.startDate).lte("date", args.endDate),
      )
      .collect();

    // Batch fetch all users upfront (avoid N+1!)
    const userIds = [...new Set(entries.map((e) => e.userId))];
    const userMap = await batchFetchUsers(ctx, userIds);

    // Calculate totals
    let totalCost = 0;
    let totalHours = 0;
    let billableHours = 0;
    let billableCost = 0;

    const userCosts: Record<string, { hours: number; cost: number; name: string }> = {};

    for (const entry of entries) {
      const hours = entry.duration / 3600;
      const cost = entry.totalCost || 0;

      totalHours += hours;
      totalCost += cost;

      if (entry.billable) {
        billableHours += hours;
        billableCost += cost;
      }

      // Track per-user costs (using pre-fetched data)
      const userIdStr = entry.userId;
      if (!userCosts[userIdStr]) {
        const user = userMap.get(entry.userId);
        userCosts[userIdStr] = {
          hours: 0,
          cost: 0,
          name: getUserName(user),
        };
      }
      userCosts[userIdStr].hours += hours;
      userCosts[userIdStr].cost += cost;
    }

    // Calculate burn rate (cost per day/week/month)
    const days = Math.max(1, (args.endDate - args.startDate) / (1000 * 60 * 60 * 24));
    const burnRatePerDay = totalCost / days;
    const burnRatePerWeek = burnRatePerDay * 7;
    const burnRatePerMonth = burnRatePerDay * 30;

    return {
      totalCost,
      totalHours,
      billableCost,
      billableHours,
      burnRatePerDay,
      burnRatePerWeek,
      burnRatePerMonth,
      userCosts: Object.entries(userCosts).map(([userId, data]) => ({
        userId,
        ...data,
      })),
      entriesCount: entries.length,
    };
  },
});

export const getTeamCosts = query({
  args: {
    projectId: v.optional(v.id("projects")),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get all time entries in date range
    let entries: Doc<"timeEntries">[];
    if (args.projectId) {
      await assertCanAccessProject(ctx, args.projectId, userId);
      entries = await ctx.db
        .query("timeEntries")
        .withIndex("by_project_date", (q) =>
          q.eq("projectId", args.projectId).gte("date", args.startDate).lte("date", args.endDate),
        )
        .collect();
    } else {
      entries = await ctx.db
        .query("timeEntries")
        .withIndex("by_date", (q) => q.gte("date", args.startDate).lte("date", args.endDate))
        .collect();
    }

    // Batch fetch all users upfront (avoid N+1!)
    const userIds = [...new Set(entries.map((e) => e.userId))];
    const userMap = await batchFetchUsers(ctx, userIds);

    // Group by user (using pre-fetched data)
    const userCosts: Record<
      string,
      {
        hours: number;
        cost: number;
        user: {
          _id: Id<"users">;
          name: string;
          email: string | undefined;
          image: string | undefined;
        } | null;
        billableHours: number;
        billableCost: number;
      }
    > = {};

    for (const entry of entries) {
      const userIdStr = entry.userId;
      if (!userCosts[userIdStr]) {
        const user = userMap.get(entry.userId);
        userCosts[userIdStr] = {
          hours: 0,
          cost: 0,
          billableHours: 0,
          billableCost: 0,
          user: user
            ? {
                _id: user._id,
                name: user.name || user.email || "Unknown",
                email: user.email,
                image: user.image,
              }
            : null,
        };
      }

      const hours = entry.duration / 3600;
      const cost = entry.totalCost || 0;

      userCosts[userIdStr].hours += hours;
      userCosts[userIdStr].cost += cost;

      if (entry.billable) {
        userCosts[userIdStr].billableHours += hours;
        userCosts[userIdStr].billableCost += cost;
      }
    }

    return Object.values(userCosts).sort((a, b) => b.cost - a.cost);
  },
});

// ===== User Rates Management =====

export const setUserRate = mutation({
  args: {
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    hourlyRate: v.number(),
    currency: v.string(),
    rateType: v.union(v.literal("internal"), v.literal("billable")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    // Check permissions - must be admin of project or setting own rate
    if (args.projectId) {
      await assertIsProjectAdmin(ctx, args.projectId, currentUserId);
    } else if (args.userId !== currentUserId) {
      throw new Error("Not authorized");
    }

    // End current rate for this user/project/type combination
    const currentRates = await ctx.db
      .query("userRates")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", args.userId).eq("projectId", args.projectId),
      )
      .collect();

    const now = Date.now();

    for (const rate of currentRates) {
      if (rate.rateType === args.rateType && !rate.effectiveTo) {
        await ctx.db.patch(rate._id, { effectiveTo: now });
      }
    }

    // Create new rate
    return await ctx.db.insert("userRates", {
      userId: args.userId,
      projectId: args.projectId,
      hourlyRate: args.hourlyRate,
      currency: args.currency,
      effectiveFrom: now,
      effectiveTo: undefined,
      rateType: args.rateType,
      setBy: currentUserId,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getUserRate = query({
  args: {
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    rateType: v.optional(v.union(v.literal("internal"), v.literal("billable"))),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      return null;
    }

    return await getUserCurrentRate(ctx, args.userId, args.projectId, args.rateType);
  },
});

export const listUserRates = query({
  args: {
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Check permissions if project-specific
    if (args.projectId) {
      await assertIsProjectAdmin(ctx, args.projectId, userId);
    }

    const rates = args.projectId
      ? await ctx.db
          .query("userRates")
          .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
          .filter((q) => q.eq(q.field("effectiveTo"), undefined))
          .collect()
      : await ctx.db
          .query("userRates")
          .filter((q) => q.eq(q.field("effectiveTo"), undefined))
          .collect();

    // Batch fetch all users (avoid N+1!)
    const userIds = rates.map((r) => r.userId);
    const userMap = await batchFetchUsers(ctx, userIds);

    // Enrich with pre-fetched user data
    return rates.map((rate) => {
      const user = userMap.get(rate.userId);
      return {
        ...rate,
        user: user
          ? {
              _id: user._id,
              name: user.name || user.email || "Unknown",
              email: user.email,
            }
          : null,
      };
    });
  },
});

// Get billing summary for a project
export const getProjectBilling = query({
  args: {
    projectId: v.id("projects"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        totalHours: 0,
        billableHours: 0,
        nonBillableHours: 0,
        totalRevenue: 0,
        entries: 0,
        byUser: {},
      };
    }

    await assertCanAccessProject(ctx, args.projectId, userId);

    // Get time entries for this project
    let entries: Doc<"timeEntries">[];
    const { startDate, endDate } = args;
    if (startDate !== undefined && endDate !== undefined) {
      entries = await ctx.db
        .query("timeEntries")
        .withIndex("by_project_date", (q) =>
          q.eq("projectId", args.projectId).gte("date", startDate).lte("date", endDate),
        )
        .collect();
    } else {
      entries = await ctx.db
        .query("timeEntries")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect();
    }

    // Batch fetch all users upfront (avoid N+1!)
    const userIds = [...new Set(entries.map((e) => e.userId))];
    const userMap = await batchFetchUsers(ctx, userIds);

    // Aggregate stats
    let totalHours = 0;
    let billableHours = 0;
    let totalRevenue = 0;

    // FIX: Group by userId (not userName) to avoid merging different users with same name
    const byUserData: Record<
      string,
      { userId: string; userName: string; hours: number; billableHours: number; revenue: number }
    > = {};

    for (const entry of entries) {
      const hours = entry.duration / 3600;
      totalHours += hours;

      if (entry.billable) {
        billableHours += hours;
        totalRevenue += entry.totalCost || 0;
      }

      // Group by userId (using pre-fetched data)
      const userIdStr = entry.userId.toString();
      if (!byUserData[userIdStr]) {
        const user = userMap.get(entry.userId);
        byUserData[userIdStr] = {
          userId: userIdStr,
          userName: getUserName(user),
          hours: 0,
          billableHours: 0,
          revenue: 0,
        };
      }

      byUserData[userIdStr].hours += hours;
      if (entry.billable) {
        byUserData[userIdStr].billableHours += hours;
        byUserData[userIdStr].revenue += entry.totalCost || 0;
      }
    }

    // Convert to byUser format keyed by userName (for backward compatibility)
    // but now it's correctly aggregated by userId first
    const byUser: Record<string, { hours: number; billableHours: number; revenue: number }> = {};
    for (const data of Object.values(byUserData)) {
      byUser[data.userName] = {
        hours: data.hours,
        billableHours: data.billableHours,
        revenue: data.revenue,
      };
    }

    return {
      totalHours,
      billableHours,
      nonBillableHours: totalHours - billableHours,
      totalRevenue,
      entries: entries.length,
      byUser,
    };
  },
});

// ===== Helper Functions =====

async function getUserCurrentRate(
  ctx: { db: QueryCtx["db"] },
  userId: Id<"users">,
  projectId?: Id<"projects">,
  rateType?: "internal" | "billable",
) {
  // Try project-specific rate first
  if (projectId) {
    const projectRate = await ctx.db
      .query("userRates")
      .withIndex("by_user_project", (q) => q.eq("userId", userId).eq("projectId", projectId))
      .filter((q) => q.eq(q.field("effectiveTo"), undefined))
      .first();

    if (projectRate && (!rateType || projectRate.rateType === rateType)) {
      return projectRate;
    }
  }

  // Fall back to default user rate
  const defaultRate = await ctx.db
    .query("userRates")
    .withIndex("by_user_project", (q) => q.eq("userId", userId).eq("projectId", undefined))
    .filter((q) => q.eq(q.field("effectiveTo"), undefined))
    .first();

  if (defaultRate && (!rateType || defaultRate.rateType === rateType)) {
    return defaultRate;
  }

  return null;
}
