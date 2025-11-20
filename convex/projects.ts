import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertMinimumRole, getUserRole } from "./rbac";

export const create = mutation({
  args: {
    name: v.string(),
    key: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    boardType: v.union(v.literal("kanban"), v.literal("scrum")),
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

    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      key: args.key.toUpperCase(),
      description: args.description,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      isPublic: args.isPublic,
      members: [userId],
      boardType: args.boardType,
      workflowStates: defaultWorkflowStates,
    });

    // Add creator as admin in projectMembers table
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

    // Get projects where user is a member or creator, or public projects
    const allProjects = await ctx.db.query("projects").collect();

    const accessibleProjects = allProjects.filter(
      (project) =>
        project.isPublic || project.createdBy === userId || project.members.includes(userId),
    );

    return await Promise.all(
      accessibleProjects.map(async (project) => {
        const creator = await ctx.db.get(project.createdBy);
        const issueCount = await ctx.db
          .query("issues")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect()
          .then((issues) => issues.length);

        const userRole = await getUserRole(ctx, project._id, userId);

        return {
          ...project,
          creatorName: creator?.name || creator?.email || "Unknown",
          issueCount,
          isMember: project.members.includes(userId),
          isOwner: project.createdBy === userId,
          userRole, // Add user's role in the project
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

    // Check access permissions
    if (
      !project.isPublic &&
      project.createdBy !== userId &&
      !(userId && project.members.includes(userId))
    ) {
      throw new Error("Not authorized to access this project");
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

    const userRole = userId ? await getUserRole(ctx, project._id, userId) : null;

    return {
      ...project,
      creatorName: creator?.name || creator?.email || "Unknown",
      members,
      isMember: userId ? project.members.includes(userId) : false,
      isOwner: project.createdBy === userId,
      userRole,
    };
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

    // Only admins can modify workflow
    await assertMinimumRole(ctx, args.projectId, userId, "admin");

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

    // Only admins can add members
    await assertMinimumRole(ctx, args.projectId, userId, "admin");

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

    // Also update the deprecated members array for backwards compatibility
    await ctx.db.patch(args.projectId, {
      members: [...project.members, user._id],
      updatedAt: now,
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

    // Only admins can change roles
    await assertMinimumRole(ctx, args.projectId, userId, "admin");

    // Can't change creator's role
    if (project.createdBy === args.memberId) {
      throw new Error("Cannot change project creator's role");
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

    // Only admins can remove members
    await assertMinimumRole(ctx, args.projectId, userId, "admin");

    // Can't remove the creator
    if (project.createdBy === args.memberId) {
      throw new Error("Cannot remove project creator");
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

    // Also update deprecated members array
    await ctx.db.patch(args.projectId, {
      members: project.members.filter((id) => id !== args.memberId),
      updatedAt: Date.now(),
    });
  },
});
