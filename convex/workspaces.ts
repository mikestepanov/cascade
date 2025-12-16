import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { batchFetchUsers, batchFetchWorkspaces, getUserName } from "./lib/batchHelpers";
import { assertIsProjectAdmin, canAccessProject, getProjectRole } from "./workspaceAccess";

export const create = mutation({
  args: {
    name: v.string(),
    key: v.string(),
    description: v.optional(v.string()),
    boardType: v.union(v.literal("kanban"), v.literal("scrum")),
    // New ownership fields
    companyId: v.optional(v.id("companies")), // Company this project belongs to
    teamId: v.optional(v.id("teams")), // Team owner (optional)
    ownerId: v.optional(v.id("users")), // User owner (optional, defaults to creator if not team project)
    isCompanyPublic: v.optional(v.boolean()), // Share with company
    sharedWithTeamIds: v.optional(v.array(v.id("teams"))), // Share with specific teams
    // Legacy field for backward compatibility
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if project key already exists
    const existingProject = await ctx.db
      .query("workspaces")
      .withIndex("by_key", (q) => q.eq("key", args.key.toUpperCase()))
      .first();

    if (existingProject) {
      throw new Error("Project key already exists");
    }

    const now = Date.now();
    const defaultWorkflowStates = [
      { id: "todo", name: "To Do", category: "todo" as const, order: 0 },
      { id: "inprogress", name: "In Progress", category: "inprogress" as const, order: 1 },
      { id: "review", name: "Review", category: "inprogress" as const, order: 2 },
      { id: "done", name: "Done", category: "done" as const, order: 3 },
    ];

    // Determine ownership: if teamId provided, it's a team project; otherwise user-owned
    const ownerId = args.teamId ? undefined : args.ownerId || userId;

    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.name,
      key: args.key.toUpperCase(),
      description: args.description,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      boardType: args.boardType,
      workflowStates: defaultWorkflowStates,
      // Ownership & sharing
      companyId: args.companyId,
      teamId: args.teamId,
      ownerId,
      isCompanyPublic: args.isCompanyPublic ?? false,
      sharedWithTeamIds: args.sharedWithTeamIds ?? [],
      // Legacy
      isPublic: args.isPublic ?? false,
    });

    // Add creator as admin in workspaceMembers table (for individual access control)
    await ctx.db.insert("workspaceMembers", {
      workspaceId,
      userId,
      role: "admin",
      addedBy: userId,
      addedAt: now,
    });

    return workspaceId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Query memberships directly via index (NOT loading all workspaces!)
    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (memberships.length === 0) {
      return [];
    }

    // Batch fetch all workspaces user is a member of
    const workspaceIds = memberships.map((m) => m.workspaceId);
    const workspaceMap = await batchFetchWorkspaces(ctx, workspaceIds);

    // Build role map from memberships
    const roleMap = new Map(memberships.map((m) => [m.workspaceId.toString(), m.role]));

    // Batch fetch creators
    const creatorIds = [...workspaceMap.values()].map((w) => w.createdBy);
    const creatorMap = await batchFetchUsers(ctx, creatorIds);

    // Fetch issue counts per workspace using index with reasonable limit
    // Cap at 1000 for performance - UI can show "1000+" if needed
    const MAX_ISSUE_COUNT = 1000;
    const issueCountsPromises = workspaceIds.map(async (workspaceId) => {
      const issues = await ctx.db
        .query("issues")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
        .take(MAX_ISSUE_COUNT + 1);
      return {
        workspaceId,
        count: Math.min(issues.length, MAX_ISSUE_COUNT),
      };
    });
    const issueCounts = await Promise.all(issueCountsPromises);
    const issueCountByWorkspace = new Map(
      issueCounts.map(({ workspaceId, count }) => [workspaceId.toString(), count]),
    );

    // Build result using pre-fetched data (no N+1!)
    const result = memberships
      .map((membership) => {
        const project = workspaceMap.get(membership.workspaceId);
        if (!project) return null;

        const creator = creatorMap.get(project.createdBy);
        const wsId = membership.workspaceId.toString();

        return {
          ...project,
          creatorName: getUserName(creator),
          issueCount: issueCountByWorkspace.get(wsId) ?? 0,
          isOwner: project.ownerId === userId || project.createdBy === userId,
          userRole: roleMap.get(wsId) ?? null,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    return result;
  },
});

export const get = query({
  args: { id: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const project = await ctx.db.get(args.id);

    if (!project) {
      return null;
    }

    // Check access permissions using new access control
    if (userId) {
      const hasAccess = await canAccessProject(ctx, project._id, userId);
      if (!hasAccess) {
        throw new Error("Not authorized to access this project");
      }
    } else {
      // Unauthenticated users can only access public projects
      if (!project.isPublic) {
        throw new Error("Not authorized to access this project");
      }
    }

    const creator = await ctx.db.get(project.createdBy);

    // Get members with their roles from workspaceMembers table
    const workspaceMembers = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", project._id))
      .collect();

    // Batch fetch all members to avoid N+1
    const memberUserIds = workspaceMembers.map((m) => m.userId);
    const memberMap = await batchFetchUsers(ctx, memberUserIds);

    const members = workspaceMembers.map((membership) => {
      const member = memberMap.get(membership.userId);
      return {
        _id: membership.userId,
        name: member?.name || member?.email || "Unknown",
        email: member?.email,
        image: member?.image,
        role: membership.role,
        addedAt: membership.addedAt,
      };
    });

    const userRole = userId ? await getProjectRole(ctx, project._id, userId) : null;

    return {
      ...project,
      creatorName: creator?.name || creator?.email || "Unknown",
      members,
      isOwner: project.ownerId === userId || project.createdBy === userId,
      userRole,
    };
  },
});

// Get project by key (e.g., "PROJ")
export const getByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    // Find project by key
    const project = await ctx.db
      .query("workspaces")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (!project) {
      return null;
    }

    // Check access permissions
    if (userId) {
      const hasAccess = await canAccessProject(ctx, project._id, userId);
      if (!hasAccess) {
        return null; // Return null instead of throwing for cleaner UI handling
      }
    } else {
      // Unauthenticated users can only access public projects
      if (!project.isPublic) {
        return null;
      }
    }

    const creator = await ctx.db.get(project.createdBy);

    // Get members with their roles from workspaceMembers table
    const workspaceMembers = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", project._id))
      .collect();

    // Batch fetch all members to avoid N+1
    const memberUserIds = workspaceMembers.map((m) => m.userId);
    const memberMap = await batchFetchUsers(ctx, memberUserIds);

    const members = workspaceMembers.map((membership) => {
      const member = memberMap.get(membership.userId);
      return {
        _id: membership.userId,
        name: member?.name || member?.email || "Unknown",
        email: member?.email,
        image: member?.image,
        role: membership.role,
        addedAt: membership.addedAt,
      };
    });

    const userRole = userId ? await getProjectRole(ctx, project._id, userId) : null;

    return {
      ...project,
      creatorName: creator?.name || creator?.email || "Unknown",
      members,
      isOwner: project.ownerId === userId || project.createdBy === userId,
      userRole,
    };
  },
});

export const update = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    isCompanyPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.workspaceId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Only project admins can update project settings
    await assertIsProjectAdmin(ctx, args.workspaceId, userId);

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      updates.name = args.name;
    }
    if (args.description !== undefined) {
      updates.description = args.description;
    }
    if (args.isPublic !== undefined) {
      updates.isPublic = args.isPublic;
    }
    if (args.isCompanyPublic !== undefined) {
      updates.isCompanyPublic = args.isCompanyPublic;
    }

    await ctx.db.patch(args.workspaceId, updates);
    return { workspaceId: args.workspaceId };
  },
});

export const deleteProject = mutation({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.workspaceId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Only project owner can delete the project
    if (project.createdBy !== userId && project.ownerId !== userId) {
      throw new Error("Only project owner can delete the project");
    }

    // Delete all related data using batch operations (parallel deletes)

    // 1. Get all issues for this workspace
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const issueIds = issues.map((i) => i._id);

    // 2. Batch fetch all related data for issues in parallel
    const [allComments, allActivities, allLinksFrom, allLinksTo, sprints, members] =
      await Promise.all([
        // Get all comments for all issues
        Promise.all(
          issueIds.map((issueId) =>
            ctx.db
              .query("issueComments")
              .withIndex("by_issue", (q) => q.eq("issueId", issueId))
              .collect(),
          ),
        ).then((arrays) => arrays.flat()),
        // Get all activities for all issues
        Promise.all(
          issueIds.map((issueId) =>
            ctx.db
              .query("issueActivity")
              .withIndex("by_issue", (q) => q.eq("issueId", issueId))
              .collect(),
          ),
        ).then((arrays) => arrays.flat()),
        // Get all links from issues
        Promise.all(
          issueIds.map((issueId) =>
            ctx.db
              .query("issueLinks")
              .withIndex("by_from_issue", (q) => q.eq("fromIssueId", issueId))
              .collect(),
          ),
        ).then((arrays) => arrays.flat()),
        // Get all links to issues
        Promise.all(
          issueIds.map((issueId) =>
            ctx.db
              .query("issueLinks")
              .withIndex("by_to_issue", (q) => q.eq("toIssueId", issueId))
              .collect(),
          ),
        ).then((arrays) => arrays.flat()),
        // Get all sprints
        ctx.db
          .query("sprints")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
          .collect(),
        // Get all members
        ctx.db
          .query("workspaceMembers")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
          .collect(),
      ]);

    // 3. Batch delete all related data in parallel
    await Promise.all([
      // Delete comments
      ...allComments.map((c) => ctx.db.delete(c._id)),
      // Delete activities
      ...allActivities.map((a) => ctx.db.delete(a._id)),
      // Delete links
      ...allLinksFrom.map((l) => ctx.db.delete(l._id)),
      ...allLinksTo.map((l) => ctx.db.delete(l._id)),
      // Delete sprints
      ...sprints.map((s) => ctx.db.delete(s._id)),
      // Delete members
      ...members.map((m) => ctx.db.delete(m._id)),
      // Delete issues
      ...issues.map((i) => ctx.db.delete(i._id)),
    ]);

    // 4. Delete the project itself
    await ctx.db.delete(args.workspaceId);
    return { deleted: true };
  },
});

export const updateWorkflow = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    workflowStates: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        category: v.union(v.literal("todo"), v.literal("inprogress"), v.literal("done")),
        order: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.workspaceId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Only project admins can modify workflow
    await assertIsProjectAdmin(ctx, args.workspaceId, userId);

    await ctx.db.patch(args.workspaceId, {
      workflowStates: args.workflowStates,
      updatedAt: Date.now(),
    });
  },
});

export const addMember = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userEmail: v.string(),
    role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.workspaceId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Only project admins can add members
    await assertIsProjectAdmin(ctx, args.workspaceId, userId);

    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.userEmail))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if already a member
    const existingMembership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id),
      )
      .first();

    if (existingMembership) {
      throw new Error("User is already a member");
    }

    const now = Date.now();

    // Add to workspaceMembers table
    await ctx.db.insert("workspaceMembers", {
      workspaceId: args.workspaceId,
      userId: user._id,
      role: args.role,
      addedBy: userId,
      addedAt: now,
    });
  },
});

export const updateMemberRole = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    memberId: v.id("users"),
    newRole: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.workspaceId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Only project admins can change roles
    await assertIsProjectAdmin(ctx, args.workspaceId, userId);

    // Can't change project owner's role
    if (project.ownerId === args.memberId || project.createdBy === args.memberId) {
      throw new Error("Cannot change project owner's role");
    }

    // Find membership
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", args.memberId),
      )
      .first();

    if (!membership) {
      throw new Error("User is not a member of this project");
    }

    await ctx.db.patch(membership._id, {
      role: args.newRole,
    });
  },
});

export const removeMember = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    memberId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.workspaceId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Only project admins can remove members
    await assertIsProjectAdmin(ctx, args.workspaceId, userId);

    // Can't remove the project owner
    if (project.ownerId === args.memberId || project.createdBy === args.memberId) {
      throw new Error("Cannot remove project owner");
    }

    // Find and delete membership
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", args.memberId),
      )
      .first();

    if (membership) {
      await ctx.db.delete(membership._id);
    }
  },
});

/**
 * Get user's role in a project/workspace
 */
export const getUserRole = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await getProjectRole(ctx, args.workspaceId, userId);
  },
});
