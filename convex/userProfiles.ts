import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, type QueryCtx, query } from "./_generated/server";

// Check if user is admin (has admin role in any project they created)
async function isAdmin(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  // Check if user has created any projects (project creators are admins)
  const createdProjects = await ctx.db
    .query("projects")
    .withIndex("by_creator", (q) => q.eq("createdBy", userId))
    .first();

  if (createdProjects) return true;

  // Check if user has admin role in any project
  const adminMembership = await ctx.db
    .query("projectMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("role"), "admin"))
    .first();

  return !!adminMembership;
}

// ===== EMPLOYMENT TYPE CONFIGURATIONS =====

// Initialize default employment type configurations (run once)
export const initializeEmploymentTypes = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if configs already exist
    const existing = await ctx.db.query("employmentTypeConfigs").first();
    if (existing) {
      return { message: "Employment type configurations already exist" };
    }

    const now = Date.now();
    const configs = [
      {
        type: "employee" as const,
        name: "Full-time Employee",
        description: "Standard full-time employees with regular work hours",
        defaultMaxHoursPerWeek: 40,
        defaultMaxHoursPerDay: 8,
        defaultRequiresApproval: false,
        defaultCanWorkOvertime: true,
        canAccessBilling: true,
        canManageProjects: true,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        type: "contractor" as const,
        name: "Contractor",
        description: "Independent contractors with flexible hours",
        defaultMaxHoursPerWeek: 40,
        defaultMaxHoursPerDay: 10,
        defaultRequiresApproval: true,
        defaultCanWorkOvertime: true,
        canAccessBilling: false,
        canManageProjects: false,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        type: "intern" as const,
        name: "Intern",
        description: "Interns with limited work hours and supervision",
        defaultMaxHoursPerWeek: 20,
        defaultMaxHoursPerDay: 4,
        defaultRequiresApproval: true,
        defaultCanWorkOvertime: false,
        canAccessBilling: false,
        canManageProjects: false,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const config of configs) {
      await ctx.db.insert("employmentTypeConfigs", config);
    }

    return { message: `Created ${configs.length} employment type configurations` };
  },
});

// Get all employment type configurations
export const getEmploymentTypeConfigs = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const configs = await ctx.db.query("employmentTypeConfigs").collect();
    return configs;
  },
});

// Get a specific employment type configuration
export const getEmploymentTypeConfig = query({
  args: {
    type: v.union(v.literal("employee"), v.literal("contractor"), v.literal("intern")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const config = await ctx.db
      .query("employmentTypeConfigs")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .first();

    return config;
  },
});

// Update employment type configuration (admin only)
export const updateEmploymentTypeConfig = mutation({
  args: {
    type: v.union(v.literal("employee"), v.literal("contractor"), v.literal("intern")),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    defaultMaxHoursPerWeek: v.optional(v.number()),
    defaultMaxHoursPerDay: v.optional(v.number()),
    defaultRequiresApproval: v.optional(v.boolean()),
    defaultCanWorkOvertime: v.optional(v.boolean()),
    canAccessBilling: v.optional(v.boolean()),
    canManageProjects: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check admin permissions
    if (!(await isAdmin(ctx, userId))) {
      throw new Error("Admin access required");
    }

    const config = await ctx.db
      .query("employmentTypeConfigs")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .first();

    if (!config) {
      throw new Error("Employment type configuration not found");
    }

    const updates: {
      updatedAt: number;
      name?: string;
      description?: string;
      defaultMaxHoursPerWeek?: number;
      defaultMaxHoursPerDay?: number;
      defaultRequiresApproval?: boolean;
      defaultCanWorkOvertime?: boolean;
      canAccessBilling?: boolean;
      canManageProjects?: boolean;
    } = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.defaultMaxHoursPerWeek !== undefined)
      updates.defaultMaxHoursPerWeek = args.defaultMaxHoursPerWeek;
    if (args.defaultMaxHoursPerDay !== undefined)
      updates.defaultMaxHoursPerDay = args.defaultMaxHoursPerDay;
    if (args.defaultRequiresApproval !== undefined)
      updates.defaultRequiresApproval = args.defaultRequiresApproval;
    if (args.defaultCanWorkOvertime !== undefined)
      updates.defaultCanWorkOvertime = args.defaultCanWorkOvertime;
    if (args.canAccessBilling !== undefined) updates.canAccessBilling = args.canAccessBilling;
    if (args.canManageProjects !== undefined) updates.canManageProjects = args.canManageProjects;

    await ctx.db.patch(config._id, updates);
  },
});

// ===== USER PROFILES =====

// Create or update user profile (admin only)
export const upsertUserProfile = mutation({
  args: {
    userId: v.id("users"),
    employmentType: v.union(v.literal("employee"), v.literal("contractor"), v.literal("intern")),
    maxHoursPerWeek: v.optional(v.number()),
    maxHoursPerDay: v.optional(v.number()),
    requiresApproval: v.optional(v.boolean()),
    canWorkOvertime: v.optional(v.boolean()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    department: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    managerId: v.optional(v.id("users")),
    // Equity compensation
    hasEquity: v.boolean(),
    equityPercentage: v.optional(v.number()),
    requiredEquityHoursPerWeek: v.optional(v.number()),
    requiredEquityHoursPerMonth: v.optional(v.number()),
    maxEquityHoursPerWeek: v.optional(v.number()),
    equityHourlyValue: v.optional(v.number()),
    equityNotes: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check admin permissions
    if (!(await isAdmin(ctx, userId))) {
      throw new Error("Admin access required");
    }

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();
    const profileData = {
      userId: args.userId,
      employmentType: args.employmentType,
      maxHoursPerWeek: args.maxHoursPerWeek,
      maxHoursPerDay: args.maxHoursPerDay,
      requiresApproval: args.requiresApproval,
      canWorkOvertime: args.canWorkOvertime,
      startDate: args.startDate,
      endDate: args.endDate,
      department: args.department,
      jobTitle: args.jobTitle,
      managerId: args.managerId,
      hasEquity: args.hasEquity ?? false,
      equityPercentage: args.equityPercentage,
      requiredEquityHoursPerWeek: args.requiredEquityHoursPerWeek,
      requiredEquityHoursPerMonth: args.requiredEquityHoursPerMonth,
      maxEquityHoursPerWeek: args.maxEquityHoursPerWeek,
      equityHourlyValue: args.equityHourlyValue,
      equityNotes: args.equityNotes,
      isActive: args.isActive,
      updatedAt: now,
    };

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, profileData);
      return existingProfile._id;
    }

    return await ctx.db.insert("userProfiles", {
      ...profileData,
      createdBy: userId,
      createdAt: now,
    });
  },
});

// Get user profile
export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    return profile;
  },
});

// Get user profile with computed effective hours (merging defaults with overrides)
export const getUserProfileWithDefaults = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) return null;

    // Get employment type defaults
    const typeConfig = await ctx.db
      .query("employmentTypeConfigs")
      .withIndex("by_type", (q) => q.eq("type", profile.employmentType))
      .first();

    if (!typeConfig) return profile;

    // Merge defaults with overrides
    return {
      ...profile,
      effectiveMaxHoursPerWeek: profile.maxHoursPerWeek ?? typeConfig.defaultMaxHoursPerWeek,
      effectiveMaxHoursPerDay: profile.maxHoursPerDay ?? typeConfig.defaultMaxHoursPerDay,
      effectiveRequiresApproval: profile.requiresApproval ?? typeConfig.defaultRequiresApproval,
      effectiveCanWorkOvertime: profile.canWorkOvertime ?? typeConfig.defaultCanWorkOvertime,
      typeConfig,
    };
  },
});

// List all user profiles (admin only)
export const listUserProfiles = query({
  args: {
    employmentType: v.optional(
      v.union(v.literal("employee"), v.literal("contractor"), v.literal("intern")),
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check admin permissions - return empty for non-admins (UI-driven visibility)
    if (!(await isAdmin(ctx, userId))) {
      return [];
    }

    let profiles: Doc<"userProfiles">[];
    if (args.employmentType && args.isActive !== undefined) {
      const employmentType = args.employmentType;
      const isActive = args.isActive;
      profiles = await ctx.db
        .query("userProfiles")
        .withIndex("by_employment_active", (q) =>
          q.eq("employmentType", employmentType).eq("isActive", isActive),
        )
        .collect();
    } else if (args.employmentType) {
      const employmentType = args.employmentType;
      profiles = await ctx.db
        .query("userProfiles")
        .withIndex("by_employment_type", (q) => q.eq("employmentType", employmentType))
        .collect();
    } else if (args.isActive !== undefined) {
      const isActive = args.isActive;
      profiles = await ctx.db
        .query("userProfiles")
        .withIndex("by_active", (q) => q.eq("isActive", isActive))
        .collect();
    } else {
      profiles = await ctx.db.query("userProfiles").collect();
    }

    // Fetch user details for each profile
    const profilesWithUsers = await Promise.all(
      profiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        const manager = profile.managerId ? await ctx.db.get(profile.managerId) : null;
        return {
          ...profile,
          user,
          manager,
        };
      }),
    );

    return profilesWithUsers;
  },
});

// Get all users without profiles (for admin to assign)
export const getUsersWithoutProfiles = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check admin permissions - return empty for non-admins (UI-driven visibility)
    if (!(await isAdmin(ctx, userId))) {
      return [];
    }

    // Get all users
    const allUsers = await ctx.db.query("users").collect();

    // Get all profiles
    const allProfiles = await ctx.db.query("userProfiles").collect();
    const profileUserIds = new Set(allProfiles.map((p) => p.userId));

    // Filter users without profiles
    const usersWithoutProfiles = allUsers.filter((user) => !profileUserIds.has(user._id));

    return usersWithoutProfiles;
  },
});

// Delete user profile (admin only)
export const deleteUserProfile = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check admin permissions
    if (!(await isAdmin(ctx, userId))) {
      throw new Error("Admin access required");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      throw new Error("User profile not found");
    }

    await ctx.db.delete(profile._id);
  },
});

// Get equity hours statistics for a user (for a specific time period)
export const getEquityHoursStats = query({
  args: {
    userId: v.id("users"),
    startDate: v.number(), // Unix timestamp
    endDate: v.number(), // Unix timestamp
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Users can view their own stats, admins can view anyone's
    const isAdminUser = await isAdmin(ctx, userId);
    if (userId !== args.userId && !isAdminUser) {
      throw new Error("Not authorized to view equity hours for this user");
    }

    // Get user profile with equity configuration
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile?.hasEquity) {
      return {
        hasEquity: false,
        totalEquityHours: 0,
        requiredEquityHoursPerWeek: 0,
        requiredEquityHoursPerMonth: 0,
        maxEquityHoursPerWeek: 0,
      };
    }

    // Get all equity time entries for the period
    const allEntries = await ctx.db
      .query("timeEntries")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate),
          q.eq(q.field("isEquityHour"), true),
        ),
      )
      .collect();

    const totalEquitySeconds = allEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalEquityHours = totalEquitySeconds / 3600;

    const totalEquityValue = allEntries.reduce((sum, entry) => sum + (entry.equityValue || 0), 0);

    // Calculate weeks in period
    const periodDays = (args.endDate - args.startDate) / (1000 * 60 * 60 * 24);
    const weeksInPeriod = Math.ceil(periodDays / 7);

    return {
      hasEquity: true,
      totalEquityHours,
      totalEquityValue,
      entriesCount: allEntries.length,
      requiredEquityHoursPerWeek: profile.requiredEquityHoursPerWeek,
      requiredEquityHoursPerMonth: profile.requiredEquityHoursPerMonth,
      maxEquityHoursPerWeek: profile.maxEquityHoursPerWeek,
      equityHourlyValue: profile.equityHourlyValue,
      equityPercentage: profile.equityPercentage,
      weeksInPeriod,
      // Compliance metrics
      requiredTotalHours: profile.requiredEquityHoursPerWeek
        ? profile.requiredEquityHoursPerWeek * weeksInPeriod
        : 0,
      isCompliant:
        !profile.requiredEquityHoursPerWeek ||
        totalEquityHours >= profile.requiredEquityHoursPerWeek * weeksInPeriod,
    };
  },
});
