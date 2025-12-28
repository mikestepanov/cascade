import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { batchFetchProjects, batchFetchUsers, getUserName } from "./lib/batchHelpers";
import { notDeleted } from "./lib/softDeleteHelpers";
import { assertIsProjectAdmin, canAccessProject, getProjectRole } from "./projectAccess";

export const create = mutation({
  args: {
    name: v.string(),
    key: v.string(),
    description: v.optional(v.string()),
    boardType: v.union(v.literal("kanban"), v.literal("scrum")),
    // Ownership (required)
    companyId: v.id("companies"), // Company this project belongs to
    // Optional ownership overrides
    teamId: v.optional(v.id("teams")), // Team owner (if team-owned)
    ownerId: v.optional(v.id("users")), // User owner (defaults to creator)
    // Sharing settings
    isPublic: v.optional(v.boolean()), // Visible to all company members
    sharedWithTeamIds: v.optional(v.array(v.id("teams"))), // Share with specific teams
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if project key already exists
    const existingProject = await ctx.db
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", args.key.toUpperCase()))
      .filter(notDeleted)      .first();

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

    // Owner is the specified user, or defaults to creator
    const ownerId = args.ownerId ?? userId;

    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      key: args.key.toUpperCase(),
      description: args.description,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      boardType: args.boardType,
      workflowStates: defaultWorkflowStates,
      // Ownership (required)
      companyId: args.companyId,
      ownerId,
      // Optional
      teamId: args.teamId,
      isPublic: args.isPublic ?? false,
      sharedWithTeamIds: args.sharedWithTeamIds ?? [],
    });

    // Add creator as admin in projectMembers table (for individual access control)
    await ctx.db.insert("projectMembers", {
      projectId,
      userId,
      role: "admin",
      addedBy: userId,
      addedAt: now,
    });

    return projectId;
  },
});

export const list = query({
  args: {
    companyId: v.optional(v.id("companies")),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    // Paginate memberships directly via index
    const results = await ctx.db
      .query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter(notDeleted)      .paginate(args.paginationOpts);

    if (results.page.length === 0) {
      return { ...results, page: [] };
    }

    // Batch fetch all projects
    const projectIds = results.page.map((m) => m.projectId);
    const projectMap = await batchFetchProjects(ctx, projectIds);

    // Build role map
    const roleMap = new Map(results.page.map((m) => [m.projectId.toString(), m.role]));

    // Batch fetch creators
    const creatorIds = [...projectMap.values()].map((w) => w.createdBy);
    const creatorMap = await batchFetchUsers(ctx, creatorIds);

    // Fetch issue counts
    const MAX_ISSUE_COUNT = 1000;
    const issueCountsPromises = projectIds.map(async (projectId) => {
      const issues = await ctx.db
        .query("issues")
        .withIndex("by_workspace", (q) => q.eq("projectId", projectId))
        .take(MAX_ISSUE_COUNT + 1);
      return {
        projectId,
        count: Math.min(issues.length, MAX_ISSUE_COUNT),
      };
    });
    const issueCounts = await Promise.all(issueCountsPromises);
    const issueCountByWorkspace = new Map(
      issueCounts.map(({ projectId, count }) => [projectId.toString(), count]),
    );

    // Build result
    const page = results.page
      .map((membership) => {
        const project = projectMap.get(membership.projectId);
        if (!project) return null;

        // Filter by companyId if provided
        if (args.companyId && project.companyId !== args.companyId) {
          return null;
        }

        const creator = creatorMap.get(project.createdBy);
        const projId = membership.projectId.toString();

        return {
          ...project,
          creatorName: getUserName(creator),
          issueCount: issueCountByWorkspace.get(projId) ?? 0,
          isOwner: project.ownerId === userId || project.createdBy === userId,
          userRole: roleMap.get(projId) ?? null,
        };
      })
      .filter((w): w is NonNullable<typeof w> => w !== null);

    return {
      ...results,
      page,
    };
  },
});

export const listByTeam = query({
  args: {
    teamId: v.id("teams"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    // Check access control
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const { getTeamRole } = await import("./teams");
    const { isCompanyAdmin } = await import("./companies");

    const role = await getTeamRole(ctx, args.teamId, userId);
    const isAdmin = await isCompanyAdmin(ctx, team.companyId, userId);

    if (!(role || isAdmin)) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    return await ctx.db
      .query("projects")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter(notDeleted)      .paginate(args.paginationOpts);
  },
});

export const listOrphanedProjects = query({
  args: {
    workspaceId: v.id("workspaces"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    // Check workspace access
    // Check workspace access
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      return { page: [], isDone: true, continueCursor: "" };
    }
    // Ideally check if user is in company, but for now existence + auth is better than crashing on type mismatch against projectAccess

    // Fetch projects directly attached to workspace but NO teamId
    // We use by_workspace index. Since we can't complex filter efficiently in pagination
    // without a specific index (by_workspace_no_team?), we rely on filtering stream
    // or we scan.
    // But `filter` in `paginate` is supported.
    return await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      // Note: We use a filter here because we lack a specific `by_workspace_no_team` index.
      // This works for now as the number of projects per workspace is manageable,
      // but for high scale, we should add an index or a "orphaned" status field.
      .filter((q) => q.eq(q.field("teamId"), undefined))
      .filter(notDeleted)      .paginate(args.paginationOpts);
  },
});

export const get = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const project = await ctx.db.get(args.id);

    if (!project) {
      return null;
    }

    // Check access permissions
    if (userId) {
      const hasAccess = await canAccessProject(ctx, project._id, userId);
      if (!hasAccess) {
        throw new Error("Not authorized to access this project");
      }
    } else {
      // Unauthenticated users cannot access projects
      throw new Error("Not authorized to access this project");
    }

    const creator = await ctx.db.get(project.createdBy);

    // Get members with their roles from projectMembers table
    const projectMembers = await ctx.db
      .query("projectMembers")
      .withIndex("by_workspace", (q) => q.eq("projectId", project._id))
      .filter(notDeleted)      .collect();

    // Batch fetch all members to avoid N+1
    const memberUserIds = projectMembers.map((m) => m.userId);
    const memberMap = await batchFetchUsers(ctx, memberUserIds);

    const members = projectMembers.map((membership) => {
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
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .filter(notDeleted)      .first();

    if (!project) {
      return null;
    }

    // Check access permissions (requires authentication)
    if (!userId) {
      return null; // Unauthenticated users cannot access projects
    }

    const hasAccess = await canAccessProject(ctx, project._id, userId);
    if (!hasAccess) {
      return null; // Return null instead of throwing for cleaner UI handling
    }

    const creator = await ctx.db.get(project.createdBy);

    // Get members with their roles from projectMembers table
    const memberships = await ctx.db
      .query("projectMembers")
      .withIndex("by_workspace", (q) => q.eq("projectId", project._id))
      .filter(notDeleted)      .collect();

    // Batch fetch all members to avoid N+1
    const memberUserIds = memberships.map((m) => m.userId);
    const memberMap = await batchFetchUsers(ctx, memberUserIds);

    const members = memberships.map((membership) => {
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

    const userRole = await getProjectRole(ctx, project._id, userId);

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
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()), // Company-visible
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Only project admins can update project settings
    await assertIsProjectAdmin(ctx, args.projectId, userId);

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

    await ctx.db.patch(args.projectId, updates);
    return { projectId: args.projectId };
  },
});

export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Only project owner can delete the project
    if (project.createdBy !== userId && project.ownerId !== userId) {
      throw new Error("Only project owner can delete the project");
    }

    // Delete all related data using batch operations (parallel deletes)

    // 1. Get all issues for this project
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_workspace", (q) => q.eq("projectId", args.projectId))
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
          .withIndex("by_workspace", (q) => q.eq("projectId", args.projectId))
          .collect(),
        // Get all members
        ctx.db
          .query("projectMembers")
          .withIndex("by_workspace", (q) => q.eq("projectId", args.projectId))
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
    await ctx.db.delete(args.projectId);
    return { deleted: true };
  },
});

export const updateWorkflow = mutation({
  args: {
    projectId: v.id("projects"),
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

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Only project admins can modify workflow
    await assertIsProjectAdmin(ctx, args.projectId, userId);

    await ctx.db.patch(args.projectId, {
      workflowStates: args.workflowStates,
      updatedAt: Date.now(),
    });
  },
});

export const addMember = mutation({
  args: {
    projectId: v.id("projects"),
    userEmail: v.string(),
    role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Only project admins can add members
    await assertIsProjectAdmin(ctx, args.projectId, userId);

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
      .query("projectMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", user._id),
      )
      .first();

    if (existingMembership) {
      throw new Error("User is already a member");
    }

    const now = Date.now();

    // Add to projectMembers table
    await ctx.db.insert("projectMembers", {
      projectId: args.projectId,
      userId: user._id,
      role: args.role,
      addedBy: userId,
      addedAt: now,
    });
  },
});

export const updateMemberRole = mutation({
  args: {
    projectId: v.id("projects"),
    memberId: v.id("users"),
    newRole: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Only project admins can change roles
    await assertIsProjectAdmin(ctx, args.projectId, userId);

    // Can't change project owner's role
    if (project.ownerId === args.memberId || project.createdBy === args.memberId) {
      throw new Error("Cannot change project owner's role");
    }

    // Find membership
    const membership = await ctx.db
      .query("projectMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", args.memberId),
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
    projectId: v.id("projects"),
    memberId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Only project admins can remove members
    await assertIsProjectAdmin(ctx, args.projectId, userId);

    // Can't remove the project owner
    if (project.ownerId === args.memberId || project.createdBy === args.memberId) {
      throw new Error("Cannot remove project owner");
    }

    // Find and delete membership
    const membership = await ctx.db
      .query("projectMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", args.memberId),
      )
      .first();

    if (membership) {
      await ctx.db.delete(membership._id);
    }
  },
});

/**
 * Get user's role in a project
 */
export const getUserRole = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await getProjectRole(ctx, args.projectId, userId);
  },
});
