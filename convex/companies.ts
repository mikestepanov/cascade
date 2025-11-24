import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, type QueryCtx, query } from "./_generated/server";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get user's role in a company
 * Returns null if user is not a member
 */
export async function getCompanyRole(
  ctx: QueryCtx | MutationCtx,
  companyId: Id<"companies">,
  userId: Id<"users">,
): Promise<"owner" | "admin" | "member" | null> {
  const membership = await ctx.db
    .query("companyMembers")
    .withIndex("by_company_user", (q) => q.eq("companyId", companyId).eq("userId", userId))
    .first();

  return membership?.role ?? null;
}

/**
 * Check if user is company admin (owner or admin role)
 */
export async function isCompanyAdmin(
  ctx: QueryCtx | MutationCtx,
  companyId: Id<"companies">,
  userId: Id<"users">,
): Promise<boolean> {
  const role = await getCompanyRole(ctx, companyId, userId);
  return role === "owner" || role === "admin";
}

/**
 * Assert user is company admin - throws if not
 */
async function assertCompanyAdmin(
  ctx: QueryCtx | MutationCtx,
  companyId: Id<"companies">,
  userId: Id<"users">,
): Promise<void> {
  const isAdmin = await isCompanyAdmin(ctx, companyId, userId);
  if (!isAdmin) {
    throw new Error("Only company admins can perform this action");
  }
}

/**
 * Assert user is company owner - throws if not
 */
async function assertCompanyOwner(
  ctx: QueryCtx | MutationCtx,
  companyId: Id<"companies">,
  userId: Id<"users">,
): Promise<void> {
  const role = await getCompanyRole(ctx, companyId, userId);
  if (role !== "owner") {
    throw new Error("Only company owner can perform this action");
  }
}

/**
 * Generate URL-friendly slug from company name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Create a new company
 * Creator automatically becomes owner
 */
export const createCompany = mutation({
  args: {
    name: v.string(),
    timezone: v.string(), // IANA timezone
    settings: v.optional(
      v.object({
        defaultMaxHoursPerWeek: v.number(),
        defaultMaxHoursPerDay: v.number(),
        requiresTimeApproval: v.boolean(),
        billingEnabled: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Generate slug from name
    const baseSlug = generateSlug(args.name);
    let slug = baseSlug;
    let counter = 1;

    // Ensure slug is unique
    while (true) {
      const existing = await ctx.db
        .query("companies")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();

      if (!existing) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const now = Date.now();

    // Create company
    const companyId = await ctx.db.insert("companies", {
      name: args.name,
      slug,
      timezone: args.timezone,
      settings: args.settings,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Add creator as owner
    await ctx.db.insert("companyMembers", {
      companyId,
      userId,
      role: "owner",
      addedBy: userId,
      addedAt: now,
    });

    // Set as user's default company if they don't have one
    const user = await ctx.db.get(userId);
    if (!user?.defaultCompanyId) {
      await ctx.db.patch(userId, { defaultCompanyId: companyId });
    }

    return { companyId, slug };
  },
});

/**
 * Update company details
 * Admin only
 */
export const updateCompany = mutation({
  args: {
    companyId: v.id("companies"),
    name: v.optional(v.string()),
    timezone: v.optional(v.string()),
    settings: v.optional(
      v.object({
        defaultMaxHoursPerWeek: v.number(),
        defaultMaxHoursPerDay: v.number(),
        requiresTimeApproval: v.boolean(),
        billingEnabled: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await assertCompanyAdmin(ctx, args.companyId, userId);

    const updates: Partial<Doc<"companies">> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      updates.name = args.name;
      // Regenerate slug if name changes
      const baseSlug = generateSlug(args.name);
      let slug = baseSlug;
      let counter = 1;

      while (true) {
        const existing = await ctx.db
          .query("companies")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .first();

        if (!existing || existing._id === args.companyId) break;

        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      updates.slug = slug;
    }

    if (args.timezone !== undefined) updates.timezone = args.timezone;
    if (args.settings !== undefined) updates.settings = args.settings;

    await ctx.db.patch(args.companyId, updates);

    return { success: true };
  },
});

/**
 * Delete company
 * Owner only - will also delete all company members
 */
export const deleteCompany = mutation({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await assertCompanyOwner(ctx, args.companyId, userId);

    // Delete all company members
    const members = await ctx.db
      .query("companyMembers")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    for (const member of members) {
      await ctx.db.delete(member._id);

      // Clear defaultCompanyId if this was the user's default
      const user = await ctx.db.get(member.userId);
      if (user?.defaultCompanyId === args.companyId) {
        await ctx.db.patch(member.userId, { defaultCompanyId: undefined });
      }
    }

    // Delete company
    await ctx.db.delete(args.companyId);

    return { success: true };
  },
});

/**
 * Add member to company
 * Admin only
 */
export const addMember = mutation({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member")), // Can't directly add as owner
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    await assertCompanyAdmin(ctx, args.companyId, currentUserId);

    // Check if user is already a member
    const existing = await ctx.db
      .query("companyMembers")
      .withIndex("by_company_user", (q) =>
        q.eq("companyId", args.companyId).eq("userId", args.userId),
      )
      .first();

    if (existing) {
      throw new Error("User is already a member of this company");
    }

    const now = Date.now();

    await ctx.db.insert("companyMembers", {
      companyId: args.companyId,
      userId: args.userId,
      role: args.role,
      addedBy: currentUserId,
      addedAt: now,
    });

    // Set as user's default company if they don't have one
    const user = await ctx.db.get(args.userId);
    if (!user?.defaultCompanyId) {
      await ctx.db.patch(args.userId, { defaultCompanyId: args.companyId });
    }

    return { success: true };
  },
});

/**
 * Update member role
 * Owner only - owner role can't be changed
 */
export const updateMemberRole = mutation({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    await assertCompanyOwner(ctx, args.companyId, currentUserId);

    const membership = await ctx.db
      .query("companyMembers")
      .withIndex("by_company_user", (q) =>
        q.eq("companyId", args.companyId).eq("userId", args.userId),
      )
      .first();

    if (!membership) {
      throw new Error("User is not a member of this company");
    }

    if (membership.role === "owner") {
      throw new Error("Cannot change owner role");
    }

    await ctx.db.patch(membership._id, {
      role: args.role,
    });

    return { success: true };
  },
});

/**
 * Remove member from company
 * Admin only - owner can't be removed
 */
export const removeMember = mutation({
  args: {
    companyId: v.id("companies"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    await assertCompanyAdmin(ctx, args.companyId, currentUserId);

    const membership = await ctx.db
      .query("companyMembers")
      .withIndex("by_company_user", (q) =>
        q.eq("companyId", args.companyId).eq("userId", args.userId),
      )
      .first();

    if (!membership) {
      throw new Error("User is not a member of this company");
    }

    if (membership.role === "owner") {
      throw new Error("Cannot remove company owner");
    }

    await ctx.db.delete(membership._id);

    // Clear defaultCompanyId if this was the user's default
    const user = await ctx.db.get(args.userId);
    if (user?.defaultCompanyId === args.companyId) {
      await ctx.db.patch(args.userId, { defaultCompanyId: undefined });
    }

    return { success: true };
  },
});

// ============================================================================
// Queries
// ============================================================================

/**
 * Get company by ID
 */
export const getCompany = query({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const company = await ctx.db.get(args.companyId);
    if (!company) return null;

    // Check if user is a member
    const role = await getCompanyRole(ctx, args.companyId, userId);
    if (!role) return null;

    return {
      ...company,
      userRole: role,
    };
  },
});

/**
 * Get company by slug
 */
export const getCompanyBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const company = await ctx.db
      .query("companies")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!company) return null;

    // Check if user is a member
    const role = await getCompanyRole(ctx, company._id, userId);
    if (!role) return null;

    return {
      ...company,
      userRole: role,
    };
  },
});

/**
 * Get all companies user is a member of
 */
export const getUserCompanies = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const memberships = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const companies = await Promise.all(
      memberships.map(async (membership) => {
        const company = await ctx.db.get(membership.companyId);
        if (!company) return null;

        // Get member count
        const memberCount = await ctx.db
          .query("companyMembers")
          .withIndex("by_company", (q) => q.eq("companyId", membership.companyId))
          .collect();

        // Get project count
        const projectCount = await ctx.db
          .query("projects")
          .withIndex("by_company", (q) => q.eq("companyId", membership.companyId))
          .collect();

        return {
          ...company,
          userRole: membership.role,
          memberCount: memberCount.length,
          projectCount: projectCount.length,
        };
      }),
    );

    return companies.filter((c): c is NonNullable<typeof c> => c !== null);
  },
});

/**
 * Get all members of a company
 * Admin only
 */
export const getCompanyMembers = query({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await assertCompanyAdmin(ctx, args.companyId, userId);

    const memberships = await ctx.db
      .query("companyMembers")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const members = await Promise.all(
      memberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        const addedBy = await ctx.db.get(membership.addedBy);

        return {
          ...membership,
          user,
          addedByName: addedBy?.name || addedBy?.email || "Unknown",
        };
      }),
    );

    return members;
  },
});

/**
 * Get user's role in a company (public query version)
 */
export const getUserRole = query({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await getCompanyRole(ctx, args.companyId, userId);
  },
});

// ============================================================================
// Migration & Initialization
// ============================================================================

/**
 * Initialize default company for existing users
 * Creates a default company and assigns all existing users to it
 * This is a one-time migration function
 */
export const initializeDefaultCompany = mutation({
  args: {
    companyName: v.optional(v.string()), // Optional custom name, defaults to "Default Company"
    timezone: v.optional(v.string()), // Optional timezone, defaults to "America/New_York"
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if default company already exists
    const existingCompany = await ctx.db
      .query("companies")
      .withIndex("by_slug", (q) => q.eq("slug", "default-company"))
      .first();

    if (existingCompany) {
      return {
        companyId: existingCompany._id,
        message: "Default company already exists",
        usersAssigned: 0,
      };
    }

    const now = Date.now();
    const companyName = args.companyName || "Default Company";
    const timezone = args.timezone || "America/New_York";

    // Create default company
    const companyId = await ctx.db.insert("companies", {
      name: companyName,
      slug: "default-company",
      timezone,
      settings: {
        defaultMaxHoursPerWeek: 40,
        defaultMaxHoursPerDay: 8,
        requiresTimeApproval: false,
        billingEnabled: true,
      },
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Get all users
    const allUsers = await ctx.db.query("users").collect();

    // Assign all users to default company as members
    let usersAssigned = 0;
    for (const user of allUsers) {
      // Check if user is already a company member somewhere
      const existingMembership = await ctx.db
        .query("companyMembers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (existingMembership) continue; // Skip if already a member of any company

      // Add user as member
      const role = user._id === userId ? "owner" : "member";
      await ctx.db.insert("companyMembers", {
        companyId,
        userId: user._id,
        role,
        addedBy: userId,
        addedAt: now,
      });

      // Set as user's default company if they don't have one
      if (!user.defaultCompanyId) {
        await ctx.db.patch(user._id, { defaultCompanyId: companyId });
      }

      usersAssigned++;
    }

    return {
      companyId,
      message: `Default company created with ${usersAssigned} users`,
      usersAssigned,
    };
  },
});
