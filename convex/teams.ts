import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, type QueryCtx, query } from "./_generated/server";
import { isCompanyAdmin } from "./companies";
import { batchFetchTeams, batchFetchUsers, getUserName } from "./lib/batchHelpers";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get user's role in a team
 * Returns null if user is not a member
 */
export async function getTeamRole(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  userId: Id<"users">,
): Promise<"lead" | "member" | null> {
  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_team_user", (q) => q.eq("teamId", teamId).eq("userId", userId))
    .first();

  return membership?.role ?? null;
}

/**
 * Check if user is team lead
 */
async function isTeamLead(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  userId: Id<"users">,
): Promise<boolean> {
  const role = await getTeamRole(ctx, teamId, userId);
  return role === "lead";
}

/**
 * Check if user can manage team (team lead or company admin)
 */
async function canManageTeam(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  userId: Id<"users">,
): Promise<boolean> {
  const team = await ctx.db.get(teamId);
  if (!team) return false;

  // Team lead can manage
  const isLead = await isTeamLead(ctx, teamId, userId);
  if (isLead) return true;

  // Company admin can manage
  return await isCompanyAdmin(ctx, team.companyId, userId);
}

/**
 * Assert user can manage team
 */
async function assertCanManageTeam(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  userId: Id<"users">,
): Promise<void> {
  const canManage = await canManageTeam(ctx, teamId, userId);
  if (!canManage) {
    throw new Error("Only team leads or company admins can perform this action");
  }
}

/**
 * Generate URL-friendly slug from team name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ============================================================================
// Mutations - Teams
// ============================================================================

/**
 * Create a new team
 * Company admin or member can create
 */
export const createTeam = mutation({
  args: {
    companyId: v.id("companies"),
    name: v.string(),
    description: v.optional(v.string()),
    isPrivate: v.boolean(), // Default privacy for team projects
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Must be company member to create team
    const companyMembership = await ctx.db
      .query("companyMembers")
      .withIndex("by_company_user", (q) => q.eq("companyId", args.companyId).eq("userId", userId))
      .first();

    if (!companyMembership) {
      throw new Error("You must be a company member to create a team");
    }

    // Generate unique slug
    const baseSlug = generateSlug(args.name);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await ctx.db
        .query("teams")
        .withIndex("by_company_slug", (q) => q.eq("companyId", args.companyId).eq("slug", slug))
        .first();

      if (!existing) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const now = Date.now();

    // Create team
    const teamId = await ctx.db.insert("teams", {
      companyId: args.companyId,
      name: args.name,
      slug,
      description: args.description,
      isPrivate: args.isPrivate,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Add creator as team lead
    await ctx.db.insert("teamMembers", {
      teamId,
      userId,
      role: "lead",
      addedBy: userId,
      addedAt: now,
    });

    return { teamId, slug };
  },
});

/**
 * Update team details
 * Team lead or company admin only
 */
export const updateTeam = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await assertCanManageTeam(ctx, args.teamId, userId);

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    const updates: {
      name?: string;
      slug?: string;
      description?: string;
      isPrivate?: boolean;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      updates.name = args.name;
      // Regenerate slug
      const baseSlug = generateSlug(args.name);
      let slug = baseSlug;
      let counter = 1;

      while (true) {
        const existing = await ctx.db
          .query("teams")
          .withIndex("by_company_slug", (q) => q.eq("companyId", team.companyId).eq("slug", slug))
          .first();

        if (!existing || existing._id === args.teamId) break;

        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      updates.slug = slug;
    }

    if (args.description !== undefined) updates.description = args.description;
    if (args.isPrivate !== undefined) updates.isPrivate = args.isPrivate;

    await ctx.db.patch(args.teamId, updates);

    return { success: true };
  },
});

/**
 * Delete team
 * Team lead or company admin only
 * Will also delete all team members
 */
export const deleteTeam = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await assertCanManageTeam(ctx, args.teamId, userId);

    // Delete all team members
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete team
    await ctx.db.delete(args.teamId);

    return { success: true };
  },
});

// ============================================================================
// Mutations - Team Members
// ============================================================================

/**
 * Add member to team
 * Team lead or company admin only
 */
export const addTeamMember = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(v.literal("lead"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    await assertCanManageTeam(ctx, args.teamId, currentUserId);

    // Check if user is already a member
    const existing = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q) => q.eq("teamId", args.teamId).eq("userId", args.userId))
      .first();

    if (existing) {
      throw new Error("User is already a member of this team");
    }

    // Verify user is company member
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    const companyMembership = await ctx.db
      .query("companyMembers")
      .withIndex("by_company_user", (q) =>
        q.eq("companyId", team.companyId).eq("userId", args.userId),
      )
      .first();

    if (!companyMembership) {
      throw new Error("User must be a company member to join this team");
    }

    const now = Date.now();

    await ctx.db.insert("teamMembers", {
      teamId: args.teamId,
      userId: args.userId,
      role: args.role,
      addedBy: currentUserId,
      addedAt: now,
    });

    return { success: true };
  },
});

/**
 * Update team member role
 * Team lead or company admin only
 */
export const updateTeamMemberRole = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(v.literal("lead"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    await assertCanManageTeam(ctx, args.teamId, currentUserId);

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q) => q.eq("teamId", args.teamId).eq("userId", args.userId))
      .first();

    if (!membership) {
      throw new Error("User is not a member of this team");
    }

    await ctx.db.patch(membership._id, {
      role: args.role,
    });

    return { success: true };
  },
});

/**
 * Remove member from team
 * Team lead or company admin only
 */
export const removeTeamMember = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    await assertCanManageTeam(ctx, args.teamId, currentUserId);

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q) => q.eq("teamId", args.teamId).eq("userId", args.userId))
      .first();

    if (!membership) {
      throw new Error("User is not a member of this team");
    }

    await ctx.db.delete(membership._id);

    return { success: true };
  },
});

// ============================================================================
// Queries
// ============================================================================

/**
 * Get team by ID
 */
export const getTeam = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const team = await ctx.db.get(args.teamId);
    if (!team) return null;

    // Check if user has access (team member or company admin)
    const role = await getTeamRole(ctx, args.teamId, userId);
    const isAdmin = await isCompanyAdmin(ctx, team.companyId, userId);

    if (!(role || isAdmin)) return null;

    return {
      ...team,
      userRole: role,
      isAdmin,
    };
  },
});

/**
 * Get all teams in a company
 */
export const getCompanyTeams = query({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Must be company member
    const companyMembership = await ctx.db
      .query("companyMembers")
      .withIndex("by_company_user", (q) => q.eq("companyId", args.companyId).eq("userId", userId))
      .first();

    if (!companyMembership) return [];

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const isAdmin = await isCompanyAdmin(ctx, args.companyId, userId);

    // Fetch team members and workspaces per team using indexes (NOT loading all!)
    const teamIds = teams.map((t) => t._id);

    const [teamMembersArrays, workspacesArrays] = await Promise.all([
      Promise.all(
        teamIds.map((teamId) =>
          ctx.db
            .query("teamMembers")
            .withIndex("by_team", (q) => q.eq("teamId", teamId))
            .collect(),
        ),
      ),
      Promise.all(
        teamIds.map((teamId) =>
          ctx.db
            .query("workspaces")
            .withIndex("by_team", (q) => q.eq("teamId", teamId))
            .collect(),
        ),
      ),
    ]);

    // Build count maps
    const memberCountByTeam = new Map<string, number>();
    const userRoleByTeam = new Map<string, "lead" | "member">();

    teamIds.forEach((teamId, index) => {
      const members = teamMembersArrays[index];
      const teamIdStr = teamId.toString();
      memberCountByTeam.set(teamIdStr, members.length);

      // Track current user's role
      const userMembership = members.find((m) => m.userId === userId);
      if (userMembership) {
        userRoleByTeam.set(teamIdStr, userMembership.role);
      }
    });

    const projectCountByTeam = new Map<string, number>();
    teamIds.forEach((teamId, index) => {
      const workspaces = workspacesArrays[index];
      projectCountByTeam.set(teamId.toString(), workspaces.length);
    });

    // Enrich teams with pre-computed data (no N+1)
    const teamsWithInfo = teams.map((team) => {
      const teamIdStr = team._id.toString();
      return {
        ...team,
        userRole: userRoleByTeam.get(teamIdStr) ?? null,
        isAdmin,
        memberCount: memberCountByTeam.get(teamIdStr) ?? 0,
        projectCount: projectCountByTeam.get(teamIdStr) ?? 0,
      };
    });

    return teamsWithInfo;
  },
});

/**
 * Get all teams user is a member of
 */
export const getUserTeams = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (memberships.length === 0) return [];

    // Batch fetch all teams (avoid N+1!)
    const teamIds = memberships.map((m) => m.teamId);
    const teamMap = await batchFetchTeams(ctx, teamIds);

    // Fetch team members and workspaces per team using indexes (NOT loading all!)
    const [teamMembersArrays, workspacesArrays] = await Promise.all([
      Promise.all(
        teamIds.map((teamId) =>
          ctx.db
            .query("teamMembers")
            .withIndex("by_team", (q) => q.eq("teamId", teamId))
            .collect(),
        ),
      ),
      Promise.all(
        teamIds.map((teamId) =>
          ctx.db
            .query("workspaces")
            .withIndex("by_team", (q) => q.eq("teamId", teamId))
            .collect(),
        ),
      ),
    ]);

    // Build count maps
    const memberCountByTeam = new Map<string, number>();
    teamIds.forEach((teamId, index) => {
      memberCountByTeam.set(teamId.toString(), teamMembersArrays[index].length);
    });

    const projectCountByTeam = new Map<string, number>();
    teamIds.forEach((teamId, index) => {
      projectCountByTeam.set(teamId.toString(), workspacesArrays[index].length);
    });

    // Enrich with pre-fetched data (no N+1)
    const teams = memberships
      .map((membership) => {
        const team = teamMap.get(membership.teamId);
        if (!team) return null;

        const teamIdStr = membership.teamId.toString();
        return {
          ...team,
          userRole: membership.role,
          memberCount: memberCountByTeam.get(teamIdStr) ?? 0,
          projectCount: projectCountByTeam.get(teamIdStr) ?? 0,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);

    return teams;
  },
});

/**
 * Get all members of a team
 * Team member or company admin only
 */
export const getTeamMembers = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    // Check access
    const role = await getTeamRole(ctx, args.teamId, userId);
    const isAdmin = await isCompanyAdmin(ctx, team.companyId, userId);

    if (!(role || isAdmin)) {
      throw new Error("Only team members or company admins can view team members");
    }

    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Batch fetch all users (both members and addedBy) (avoid N+1!)
    // Deduplicate to avoid redundant fetches
    const allUserIds = [
      ...new Set([...memberships.map((m) => m.userId), ...memberships.map((m) => m.addedBy)]),
    ];
    const userMap = await batchFetchUsers(ctx, allUserIds);

    // Enrich with pre-fetched data (no N+1)
    const members = memberships.map((membership) => {
      const user = userMap.get(membership.userId);
      const addedBy = userMap.get(membership.addedBy);

      return {
        ...membership,
        user,
        addedByName: getUserName(addedBy),
      };
    });

    return members;
  },
});
