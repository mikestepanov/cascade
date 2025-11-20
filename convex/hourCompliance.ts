import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// Check if user is admin (copied from userProfiles.ts)
async function isAdmin(ctx: any, userId: string) {
  const createdProjects = await ctx.db
    .query("projects")
    .withIndex("by_creator", (q: any) => q.eq("createdBy", userId))
    .first();

  if (createdProjects) return true;

  const adminMembership = await ctx.db
    .query("projectMembers")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .filter((q: any) => q.eq(q.field("role"), "admin"))
    .first();

  return !!adminMembership;
}

// Helper to calculate start/end of week
function getWeekBounds(date: Date): { start: number; end: number } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Adjust to Sunday
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start: start.getTime(), end: end.getTime() };
}

// Helper to calculate start/end of month
function getMonthBounds(date: Date): { start: number; end: number } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start: start.getTime(), end: end.getTime() };
}

// Internal helper for compliance checking logic
async function checkUserComplianceInternal(
  ctx: any,
  args: {
    userId: Id<"users">;
    periodType: "week" | "month";
    periodStart: number;
    periodEnd: number;
  },
): Promise<Id<"hourComplianceRecords">> {
  // Get user profile
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
    .first();

  if (!profile) {
    throw new Error("User profile not found");
  }

  // Get all time entries for the period
  const timeEntries = await ctx.db
    .query("timeEntries")
    .withIndex("by_user_date", (q: any) => q.eq("userId", args.userId))
    .filter((q: any) =>
      q.and(q.gte(q.field("date"), args.periodStart), q.lte(q.field("date"), args.periodEnd)),
    )
    .collect();

  // Calculate total hours
  const totalSeconds = timeEntries.reduce((sum: number, entry: any) => sum + entry.duration, 0);
  const totalHoursWorked = totalSeconds / 3600;

  // Calculate equity hours
  const equityEntries = timeEntries.filter((e: any) => e.isEquityHour);
  const totalEquitySeconds = equityEntries.reduce(
    (sum: number, entry: any) => sum + entry.duration,
    0,
  );
  const totalEquityHours = totalEquitySeconds / 3600;

  // Determine requirements based on period type
  let requiredHours = 0;
  let requiredEquityHours = 0;
  let maxHours = 0;

  if (args.periodType === "week") {
    requiredHours = profile.maxHoursPerWeek || 40; // Default to 40 if not set
    requiredEquityHours = profile.requiredEquityHoursPerWeek || 0;
    maxHours = profile.maxHoursPerWeek || 0;
  } else {
    // Month - multiply weekly by ~4.33
    requiredHours = profile.maxHoursPerWeek ? profile.maxHoursPerWeek * 4.33 : 173;
    requiredEquityHours = profile.requiredEquityHoursPerMonth || 0;
    maxHours = profile.maxHoursPerWeek ? profile.maxHoursPerWeek * 4.33 : 0;
  }

  // Determine compliance status
  let status: "compliant" | "under_hours" | "over_hours" | "equity_under";
  let hoursDeficit = 0;
  let hoursExcess = 0;
  let equityHoursDeficit = 0;

  // Check equity hours first (if applicable)
  if (profile.hasEquity && requiredEquityHours > 0 && totalEquityHours < requiredEquityHours) {
    status = "equity_under";
    equityHoursDeficit = requiredEquityHours - totalEquityHours;
  }
  // Check if under required hours
  else if (totalHoursWorked < requiredHours) {
    status = "under_hours";
    hoursDeficit = requiredHours - totalHoursWorked;
  }
  // Check if over max hours (if max is set)
  else if (maxHours > 0 && totalHoursWorked > maxHours) {
    status = "over_hours";
    hoursExcess = totalHoursWorked - maxHours;
  } else {
    status = "compliant";
  }

  // Check if record already exists for this period
  const existingRecord = await ctx.db
    .query("hourComplianceRecords")
    .withIndex("by_user_period", (q: any) =>
      q.eq("userId", args.userId).eq("periodStart", args.periodStart),
    )
    .first();

  const now = Date.now();
  const recordData = {
    userId: args.userId,
    periodType: args.periodType,
    periodStart: args.periodStart,
    periodEnd: args.periodEnd,
    totalHoursWorked,
    totalEquityHours: totalEquityHours > 0 ? totalEquityHours : undefined,
    requiredHoursPerWeek: args.periodType === "week" ? requiredHours : undefined,
    requiredHoursPerMonth: args.periodType === "month" ? requiredHours : undefined,
    requiredEquityHoursPerWeek:
      args.periodType === "week" && requiredEquityHours > 0 ? requiredEquityHours : undefined,
    requiredEquityHoursPerMonth:
      args.periodType === "month" && requiredEquityHours > 0 ? requiredEquityHours : undefined,
    maxHoursPerWeek: maxHours > 0 ? maxHours : undefined,
    status,
    hoursDeficit: hoursDeficit > 0 ? hoursDeficit : undefined,
    hoursExcess: hoursExcess > 0 ? hoursExcess : undefined,
    equityHoursDeficit: equityHoursDeficit > 0 ? equityHoursDeficit : undefined,
    notificationSent: false,
    updatedAt: now,
  };

  let recordId: Id<"hourComplianceRecords">;
  if (existingRecord) {
    await ctx.db.patch(existingRecord._id, recordData);
    recordId = existingRecord._id;
  } else {
    recordId = await ctx.db.insert("hourComplianceRecords", {
      ...recordData,
      createdAt: now,
    });
  }

  // Create notification if not compliant and notification not already sent
  if (status !== "compliant" && !existingRecord?.notificationSent) {
    const user = await ctx.db.get(args.userId);
    let message = "";
    let title = "";

    switch (status) {
      case "under_hours":
        title = "Hour Requirement Not Met";
        message = `${user?.name || "User"} worked ${totalHoursWorked.toFixed(1)} hours (${hoursDeficit.toFixed(1)} hours short of ${requiredHours} required)`;
        break;
      case "over_hours":
        title = "Maximum Hours Exceeded";
        message = `${user?.name || "User"} worked ${totalHoursWorked.toFixed(1)} hours (${hoursExcess.toFixed(1)} hours over ${maxHours} maximum)`;
        break;
      case "equity_under":
        title = "Equity Hour Requirement Not Met";
        message = `${user?.name || "User"} worked ${totalEquityHours.toFixed(1)} equity hours (${equityHoursDeficit.toFixed(1)} hours short of ${requiredEquityHours} required)`;
        break;
    }

    // Create notification for admins and manager
    const adminUsers = await ctx.db.query("users").collect();
    const notifications = [];

    for (const admin of adminUsers) {
      const isAdminUser = await isAdmin(ctx, admin._id);
      const isManager = profile.managerId === admin._id;

      if (isAdminUser || isManager) {
        const notificationId = await ctx.db.insert("notifications", {
          userId: admin._id,
          type: "hour_compliance",
          title,
          message,
          isRead: false,
          createdAt: now,
        });
        notifications.push(notificationId);
      }
    }

    // Update record with notification info
    if (notifications.length > 0) {
      await ctx.db.patch(recordId, {
        notificationSent: true,
        notificationId: notifications[0], // Store first notification ID
      });
    }
  }

  return recordId;
}

// Check and record compliance for a user for a specific period
export const checkUserCompliance = mutation({
  args: {
    userId: v.id("users"),
    periodType: v.union(v.literal("week"), v.literal("month")),
    periodStart: v.number(),
    periodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    // Only admins can check compliance
    if (!(await isAdmin(ctx, currentUserId))) {
      throw new Error("Admin access required");
    }

    return await checkUserComplianceInternal(ctx, args);
  },
});

// Check compliance for all active users for a period
export const checkAllUsersCompliance = mutation({
  args: {
    periodType: v.union(v.literal("week"), v.literal("month")),
    periodStart: v.number(),
    periodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (!(await isAdmin(ctx, userId))) {
      throw new Error("Admin access required");
    }

    // Get all active user profiles
    const profiles = await ctx.db
      .query("userProfiles")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const results = [];
    for (const profile of profiles) {
      try {
        const recordId = await checkUserComplianceInternal(ctx, {
          userId: profile.userId,
          periodType: args.periodType,
          periodStart: args.periodStart,
          periodEnd: args.periodEnd,
        });
        results.push({ userId: profile.userId, recordId, success: true });
      } catch (error) {
        results.push({
          userId: profile.userId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  },
});

// List compliance records (admin only)
export const listComplianceRecords = query({
  args: {
    userId: v.optional(v.id("users")),
    status: v.optional(
      v.union(
        v.literal("compliant"),
        v.literal("under_hours"),
        v.literal("over_hours"),
        v.literal("equity_under"),
      ),
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (!(await isAdmin(ctx, userId))) {
      throw new Error("Admin access required");
    }

    let records;

    if (args.userId && args.status) {
      const userId = args.userId;
      const status = args.status;
      records = await ctx.db
        .query("hourComplianceRecords")
        .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", status))
        .order("desc")
        .take(args.limit || 50);
    } else if (args.userId) {
      const userId = args.userId;
      records = await ctx.db
        .query("hourComplianceRecords")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .take(args.limit || 50);
    } else if (args.status) {
      const status = args.status;
      records = await ctx.db
        .query("hourComplianceRecords")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .take(args.limit || 50);
    } else {
      records = await ctx.db
        .query("hourComplianceRecords")
        .order("desc")
        .take(args.limit || 50);
    }

    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      records = records.filter((r) => {
        if (args.startDate && r.periodStart < args.startDate) return false;
        if (args.endDate && r.periodEnd > args.endDate) return false;
        return true;
      });
    }

    // Fetch user details
    const recordsWithUsers = await Promise.all(
      records.map(async (record) => {
        const user = await ctx.db.get(record.userId);
        return {
          ...record,
          user,
        };
      }),
    );

    return recordsWithUsers;
  },
});

// Get compliance summary stats
export const getComplianceSummary = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (!(await isAdmin(ctx, userId))) {
      throw new Error("Admin access required");
    }

    let records = await ctx.db
      .query("hourComplianceRecords")
      .order("desc")
      .take(1000); // Get recent records

    // Filter by date range
    if (args.startDate || args.endDate) {
      records = records.filter((r) => {
        if (args.startDate && r.periodStart < args.startDate) return false;
        if (args.endDate && r.periodEnd > args.endDate) return false;
        return true;
      });
    }

    const summary = {
      totalRecords: records.length,
      compliant: records.filter((r) => r.status === "compliant").length,
      underHours: records.filter((r) => r.status === "under_hours").length,
      overHours: records.filter((r) => r.status === "over_hours").length,
      equityUnder: records.filter((r) => r.status === "equity_under").length,
      complianceRate:
        records.length > 0
          ? (records.filter((r) => r.status === "compliant").length / records.length) * 100
          : 0,
    };

    return summary;
  },
});

// Mark compliance record as reviewed
export const reviewComplianceRecord = mutation({
  args: {
    recordId: v.id("hourComplianceRecords"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (!(await isAdmin(ctx, userId))) {
      throw new Error("Admin access required");
    }

    await ctx.db.patch(args.recordId, {
      reviewedBy: userId,
      reviewedAt: Date.now(),
      reviewNotes: args.notes,
    });
  },
});
