import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { batchFetchProjects, batchFetchUsers, getUserName } from "./lib/batchHelpers";
import { conflict, forbidden, notFound, validation } from "./lib/errors";
import { fetchPaginatedQuery } from "./lib/queryHelpers";
import { cascadeSoftDelete } from "./lib/relationships";
import { notDeleted, softDeleteFields } from "./lib/softDeleteHelpers";
import { assertIsProjectAdmin, canAccessProject, getProjectRole } from "./projectAccess";
import { isTest } from "./testConfig";

export const createProject = authenticatedMutation({
  args: {
    name: v.string(),
    key: v.string(),
    description: v.optional(v.string()),
    boardType: v.union(v.literal("kanban"), v.literal("scrum")),
    // Ownership (required)
    organizationId: v.id("organizations"), // organization this project belongs to
    workspaceId: v.id("workspaces"), // Workspace this project belongs to
    // Optional ownership overrides
    teamId: v.optional(v.id("teams")), // Team owner (optional - null for workspace projects)
    ownerId: v.optional(v.id("users")), // User owner (defaults to creator)
    // Sharing settings
    isPublic: v.optional(v.boolean()), // Visible to all organization members
    sharedWithTeamIds: v.optional(v.array(v.id("teams"))), // Share with specific teams
  },
  handler: async (ctx, args) => {
    // Check if project key already exists
    const existingProject = await ctx.db
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", args.key.toUpperCase()))
      .filter(notDeleted)
      .first();

    if (existingProject) throw conflict("Project key already exists");

    // Validate: if teamId provided, ensure it belongs to the workspace
    if (args.teamId) {
      const team = await ctx.db.get(args.teamId);
      if (!team) throw notFound("team", args.teamId);
      if (team.workspaceId !== args.workspaceId) {
        throw validation("teamId", "Team must belong to the specified workspace");
      }
    }

    const now = Date.now();
    const defaultWorkflowStates = [
      { id: "todo", name: "To Do", category: "todo" as const, order: 0 },
      { id: "inprogress", name: "In Progress", category: "inprogress" as const, order: 1 },
      { id: "review", name: "Review", category: "inprogress" as const, order: 2 },
      { id: "done", name: "Done", category: "done" as const, order: 3 },
    ];

    // Owner is the specified user, or defaults to creator
    const ownerId = args.ownerId ?? ctx.userId;

    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      key: args.key.toUpperCase(),
      description: args.description,
      createdBy: ctx.userId,
      createdAt: now,
      updatedAt: now,
      boardType: args.boardType,
      workflowStates: defaultWorkflowStates,
      // Ownership (required)
      organizationId: args.organizationId,
      workspaceId: args.workspaceId,
      ownerId,
      // Optional
      teamId: args.teamId,
      isPublic: args.isPublic ?? false,
      sharedWithTeamIds: args.sharedWithTeamIds ?? [],
    });

    // Add creator as admin in projectMembers table (for individual access control)
    await ctx.db.insert("projectMembers", {
      projectId,
      userId: ctx.userId,
      role: "admin",
      addedBy: ctx.userId,
      addedAt: now,
    });

    if (!isTest) {
      await ctx.scheduler.runAfter(0, internal.auditLogs.log, {
        action: "project_created",
        actorId: ctx.userId,
        targetId: projectId,
        targetType: "projects",
        metadata: {
          name: args.name,
          key: args.key,
          organizationId: args.organizationId,
        },
      });
    }

    return projectId;
  },
});

export const getCurrentUserProjects = authenticatedQuery({
  args: {
    organizationId: v.optional(v.id("organizations")),
    paginationOpts: v.optional(paginationOptsValidator),
  },
  handler: async (ctx, args) => {
    const paginationOpts = args.paginationOpts || { numItems: 20, cursor: null };

    // Paginate memberships directly via index
    const results = await fetchPaginatedQuery<Doc<"projectMembers">>(ctx, {
      paginationOpts,
      query: (db) =>
        db.query("projectMembers").withIndex("by_user", (q) => q.eq("userId", ctx.userId)),
    });

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
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .take(MAX_ISSUE_COUNT + 1);
      return {
        projectId,
        count: Math.min(issues.length, MAX_ISSUE_COUNT),
      };
    });
    const issueCounts = await Promise.all(issueCountsPromises);
    const issueCountByProject = new Map(
      issueCounts.map(({ projectId, count }) => [projectId.toString(), count]),
    );

    // Build result
    const page = results.page
      .map((membership) => {
        const project = projectMap.get(membership.projectId);
        if (!project) return null;

        // Filter by organizationId if provided
        if (args.organizationId && project.organizationId !== args.organizationId) {
          return null;
        }

        const creator = creatorMap.get(project.createdBy);
        const projId = membership.projectId.toString();

        return {
          ...project,
          creatorName: getUserName(creator),
          issueCount: issueCountByProject.get(projId) ?? 0,
          isOwner: project.ownerId === ctx.userId || project.createdBy === ctx.userId,
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

export const getTeamProjects = authenticatedQuery({
  args: {
    teamId: v.id("teams"),
    paginationOpts: v.optional(paginationOptsValidator),
  },
  handler: async (ctx, args) => {
    // Check access control
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const { getTeamRole } = await import("./teams");
    const { isOrganizationAdmin } = await import("./organizations");

    const role = await getTeamRole(ctx, args.teamId, ctx.userId);
    const isAdmin = await isOrganizationAdmin(ctx, team.organizationId, ctx.userId);

    if (!(role || isAdmin)) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    return await fetchPaginatedQuery(ctx, {
      paginationOpts: args.paginationOpts || { numItems: 20, cursor: null },
      query: (db) => db.query("projects").withIndex("by_team", (q) => q.eq("teamId", args.teamId)),
    });
  },
});

export const getWorkspaceProjects = authenticatedQuery({
  args: {
    workspaceId: v.id("workspaces"),
    paginationOpts: v.optional(paginationOptsValidator),
  },
  handler: async (ctx, args) => {
    // Check workspace access
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      return { page: [], isDone: true, continueCursor: "" };
    }
    // Ideally check if user is in organization, but for now existence + auth is better than crashing on type mismatch against projectAccess

    // Fetch projects directly attached to workspace but NO teamId
    // We use by_workspace index. Since we can't complex filter efficiently in pagination
    // without a specific index (by_workspace_no_team?), we rely on filtering stream
    // or we scan.
    // But `filter` in `paginate` is supported.
    return await fetchPaginatedQuery(ctx, {
      paginationOpts: args.paginationOpts || { numItems: 20, cursor: null },
      query: (db) =>
        db
          .query("projects")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
          // Note: We use a filter here because we lack a specific `by_workspace_no_team` index.
          // This works for now as the number of projects per workspace is manageable,
          // but for high scale, we should add an index or a "orphaned" status field.
          .filter((q) => q.eq(q.field("teamId"), undefined)),
    });
  },
});

export const getProject = authenticatedQuery({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.id);

    if (!project) {
      return null;
    }

    // Check access permissions
    const hasAccess = await canAccessProject(ctx, project._id, ctx.userId);
    if (!hasAccess) throw forbidden();

    const creator = await ctx.db.get(project.createdBy);

    // Get members with their roles from projectMembers table
    const projectMembers = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .filter(notDeleted)
      .collect();

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

    const userRole = await getProjectRole(ctx, project._id, ctx.userId);

    return {
      ...project,

      creatorName: getUserName(creator),
      members,
      isOwner: project.ownerId === ctx.userId || project.createdBy === ctx.userId,
      userRole,
    };
  },
});

// Get project by key (e.g., "PROJ")
export const getByKey = authenticatedQuery({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    // Find project by key
    const project = await ctx.db
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .filter(notDeleted)
      .first();

    if (!project) {
      return null;
    }

    const hasAccess = await canAccessProject(ctx, project._id, ctx.userId);
    if (!hasAccess) {
      return null; // Return null instead of throwing for cleaner UI handling
    }

    const creator = await ctx.db.get(project.createdBy);

    // Get members with their roles from projectMembers table
    const memberships = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .filter(notDeleted)
      .collect();

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

    const userRole = await getProjectRole(ctx, project._id, ctx.userId);

    return {
      ...project,

      creatorName: getUserName(creator),
      members,
      isOwner: project.ownerId === ctx.userId || project.createdBy === ctx.userId,
      userRole,
    };
  },
});

export const updateProject = authenticatedMutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()), // organization-visible
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw notFound("project", args.projectId);

    // Only project admins can update project settings
    await assertIsProjectAdmin(ctx, args.projectId, ctx.userId);

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

    if (!isTest) {
      await ctx.scheduler.runAfter(0, internal.auditLogs.log, {
        action: "project_updated",
        actorId: ctx.userId,
        targetId: args.projectId,
        targetType: "projects",
        metadata: updates,
      });
    }

    return { projectId: args.projectId };
  },
});

export const softDeleteProject = authenticatedMutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw notFound("project", args.projectId);

    // Only project owner can delete the project
    if (project.createdBy !== ctx.userId && project.ownerId !== ctx.userId) {
      throw forbidden("owner");
    }

    // Soft delete with automatic cascading
    const deletedAt = Date.now();
    await ctx.db.patch(args.projectId, softDeleteFields(ctx.userId));
    await cascadeSoftDelete(ctx, "projects", args.projectId, ctx.userId, deletedAt);

    if (!isTest) {
      await ctx.scheduler.runAfter(0, internal.auditLogs.log, {
        action: "project_deleted",
        actorId: ctx.userId,
        targetId: args.projectId,
        targetType: "projects",
        metadata: { deletedAt },
      });
    }

    return { deleted: true };
  },
});

export const restoreProject = authenticatedMutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw notFound("project", args.projectId);

    if (!project.isDeleted) {
      throw validation("projectId", "Project is not deleted");
    }

    // Only project owner can restore
    if (project.createdBy !== ctx.userId && project.ownerId !== ctx.userId) {
      throw forbidden("owner");
    }

    // Restore with automatic cascading
    await ctx.db.patch(args.projectId, {
      isDeleted: undefined,
      deletedAt: undefined,
      deletedBy: undefined,
    });

    // Note: Cascade restore not implemented yet - would need cascadeRestore function
    // For now, just restore the project itself

    if (!isTest) {
      await ctx.scheduler.runAfter(0, internal.auditLogs.log, {
        action: "project_restored",
        actorId: ctx.userId,
        targetId: args.projectId,
        targetType: "projects",
      });
    }

    return { restored: true };
  },
});

export const updateWorkflow = authenticatedMutation({
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
    const project = await ctx.db.get(args.projectId);
    if (!project) throw notFound("project", args.projectId);

    // Only project admins can modify workflow
    await assertIsProjectAdmin(ctx, args.projectId, ctx.userId);

    await ctx.db.patch(args.projectId, {
      workflowStates: args.workflowStates,
      updatedAt: Date.now(),
    });

    if (!isTest) {
      await ctx.scheduler.runAfter(0, internal.auditLogs.log, {
        action: "workflow_updated",
        actorId: ctx.userId,
        targetId: args.projectId,
        targetType: "projects",
        metadata: { workflowStates: args.workflowStates },
      });
    }
  },
});

export const addProjectMember = authenticatedMutation({
  args: {
    projectId: v.id("projects"),
    userEmail: v.string(),
    role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw notFound("project", args.projectId);

    // Only project admins can add members
    await assertIsProjectAdmin(ctx, args.projectId, ctx.userId);

    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.userEmail))
      .first();

    if (!user) throw notFound("user");

    // Check if already a member
    const existingMembership = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) => q.eq("projectId", args.projectId).eq("userId", user._id))
      .first();

    if (existingMembership) throw conflict("User is already a member");

    const now = Date.now();

    // Add to projectMembers table
    await ctx.db.insert("projectMembers", {
      projectId: args.projectId,
      userId: user._id,
      role: args.role,
      addedBy: ctx.userId,
      addedAt: now,
    });

    if (!isTest) {
      await ctx.scheduler.runAfter(0, internal.auditLogs.log, {
        action: "member_added",
        actorId: ctx.userId,
        targetId: args.projectId,
        targetType: "projects",
        metadata: {
          memberId: user._id,
          role: args.role,
        },
      });
    }
  },
});

export const updateProjectMemberRole = authenticatedMutation({
  args: {
    projectId: v.id("projects"),
    memberId: v.id("users"),
    newRole: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw notFound("project", args.projectId);

    // Only project admins can change roles
    await assertIsProjectAdmin(ctx, args.projectId, ctx.userId);

    // Can't change project owner's role
    if (project.ownerId === args.memberId || project.createdBy === args.memberId) {
      throw forbidden(undefined, "Cannot change project owner's role");
    }

    // Find membership
    const membership = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", args.memberId),
      )
      .first();

    if (!membership) throw notFound("membership");

    await ctx.db.patch(membership._id, {
      role: args.newRole,
    });

    if (!isTest) {
      await ctx.scheduler.runAfter(0, internal.auditLogs.log, {
        action: "member_role_updated",
        actorId: ctx.userId,
        targetId: args.projectId,
        targetType: "projects",
        metadata: {
          memberId: args.memberId,
          newRole: args.newRole,
        },
      });
    }
  },
});

export const removeProjectMember = authenticatedMutation({
  args: {
    projectId: v.id("projects"),
    memberId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw notFound("project", args.projectId);

    // Only project admins can remove members
    await assertIsProjectAdmin(ctx, args.projectId, ctx.userId);

    // Can't remove the project owner
    if (project.ownerId === args.memberId || project.createdBy === args.memberId) {
      throw forbidden(undefined, "Cannot remove project owner");
    }

    // Find and delete membership
    const membership = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", args.memberId),
      )
      .first();

    if (membership) {
      await ctx.db.delete(membership._id);

      if (!isTest) {
        await ctx.scheduler.runAfter(0, internal.auditLogs.log, {
          action: "member_removed",
          actorId: ctx.userId,
          targetId: args.projectId,
          targetType: "projects",
          metadata: {
            memberId: args.memberId,
          },
        });
      }
    }
  },
});

/**
 * Get user's role in a project
 */
export const getProjectUserRole = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await getProjectRole(ctx, args.projectId, ctx.userId);
  },
});
