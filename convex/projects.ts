import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

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

    return await ctx.db.insert("projects", {
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
        project.isPublic ||
        project.createdBy === userId ||
        project.members.includes(userId)
    );

    return await Promise.all(
      accessibleProjects.map(async (project) => {
        const creator = await ctx.db.get(project.createdBy);
        const issueCount = await ctx.db
          .query("issues")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect()
          .then((issues) => issues.length);

        return {
          ...project,
          creatorName: creator?.name || creator?.email || "Unknown",
          issueCount,
          isMember: project.members.includes(userId),
          isOwner: project.createdBy === userId,
        };
      })
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
    if (!project.isPublic && project.createdBy !== userId && (!userId || !project.members.includes(userId))) {
      throw new Error("Not authorized to access this project");
    }

    const creator = await ctx.db.get(project.createdBy);
    const members = await Promise.all(
      project.members.map(async (memberId) => {
        const member = await ctx.db.get(memberId);
        return {
          _id: memberId,
          name: member?.name || member?.email || "Unknown",
          email: member?.email,
          image: member?.image,
        };
      })
    );

    return {
      ...project,
      creatorName: creator?.name || creator?.email || "Unknown",
      members,
      isMember: userId ? project.members.includes(userId) : false,
      isOwner: project.createdBy === userId,
    };
  },
});

export const updateWorkflow = mutation({
  args: {
    projectId: v.id("projects"),
    workflowStates: v.array(v.object({
      id: v.string(),
      name: v.string(),
      category: v.union(v.literal("todo"), v.literal("inprogress"), v.literal("done")),
      order: v.number(),
    })),
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

    if (project.createdBy !== userId) {
      throw new Error("Not authorized to edit this project");
    }

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

    if (project.createdBy !== userId) {
      throw new Error("Not authorized to add members to this project");
    }

    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.userEmail))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    if (project.members.includes(user._id)) {
      throw new Error("User is already a member");
    }

    await ctx.db.patch(args.projectId, {
      members: [...project.members, user._id],
      updatedAt: Date.now(),
    });
  },
});
