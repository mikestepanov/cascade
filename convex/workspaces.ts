import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertIsProjectAdmin, canAccessProject, getProjectRole } from "./projectAccess";

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
      .query("projects")
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

    const projectId = await ctx.db.insert("projects", {
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
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get all projects and filter using new access control
    const allProjects = await ctx.db.query("projects").collect();
    const accessibleProjects = [];

    for (const project of allProjects) {
      const hasAccess = await canAccessProject(ctx, project._id, userId);
      if (hasAccess) {
        accessibleProjects.push(project);
      }
    }

    return await Promise.all(
      accessibleProjects.map(async (project) => {
        const creator = await ctx.db.get(project.createdBy);
        const issueCount = await ctx.db
          .query("issues")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect()
          .then((issues) => issues.length);

        const userRole = await getProjectRole(ctx, project._id, userId);

        return {
          ...project,
          creatorName: creator?.name || creator?.email || "Unknown",
          issueCount,
          isOwner: project.ownerId === userId || project.createdBy === userId,
          userRole,
        };
      }),
    );
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

    // Get members with their roles from projectMembers table
    const projectMembers = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .collect();

    const members = await Promise.all(
      projectMembers.map(async (membership) => {
        const member = await ctx.db.get(membership.userId);
        return {
          _id: membership.userId,
          name: member?.name || member?.email || "Unknown",
          email: member?.email,
          image: member?.image,
          role: membership.role,
          addedAt: membership.addedAt,
        };
      }),
    );

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

    // Get members with their roles from projectMembers table
    const projectMembers = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .collect();

    const members = await Promise.all(
      projectMembers.map(async (membership) => {
        const member = await ctx.db.get(membership.userId);
        return {
          _id: membership.userId,
          name: member?.name || member?.email || "Unknown",
          email: member?.email,
          image: member?.image,
          role: membership.role,
          addedAt: membership.addedAt,
        };
      }),
    );

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
    projectId: v.id("projects"),
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
    if (args.isCompanyPublic !== undefined) {
      updates.isCompanyPublic = args.isCompanyPublic;
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

    // Delete all related data
    // 1. Delete all issues
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const issue of issues) {
      // Delete issue comments
      const comments = await ctx.db
        .query("issueComments")
        .withIndex("by_issue", (q) => q.eq("issueId", issue._id))
        .collect();
      for (const comment of comments) {
        await ctx.db.delete(comment._id);
      }

      // Delete issue activity
      const activities = await ctx.db
        .query("issueActivity")
        .withIndex("by_issue", (q) => q.eq("issueId", issue._id))
        .collect();
      for (const activity of activities) {
        await ctx.db.delete(activity._id);
      }

      // Delete issue links
      const linksFrom = await ctx.db
        .query("issueLinks")
        .withIndex("by_from_issue", (q) => q.eq("fromIssueId", issue._id))
        .collect();
      for (const link of linksFrom) {
        await ctx.db.delete(link._id);
      }
      const linksTo = await ctx.db
        .query("issueLinks")
        .withIndex("by_to_issue", (q) => q.eq("toIssueId", issue._id))
        .collect();
      for (const link of linksTo) {
        await ctx.db.delete(link._id);
      }

      await ctx.db.delete(issue._id);
    }

    // 2. Delete all sprints
    const sprints = await ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const sprint of sprints) {
      await ctx.db.delete(sprint._id);
    }

    // 3. Delete all project members
    const members = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const member of members) {
      await ctx.db.delete(member._id);
    }

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
      .withIndex("by_project_user", (q) => q.eq("projectId", args.projectId).eq("userId", user._id))
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
      .withIndex("by_project_user", (q) =>
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
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", args.memberId),
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
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await getProjectRole(ctx, args.projectId, userId);
  },
});
