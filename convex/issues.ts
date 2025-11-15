import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertMinimumRole } from "./rbac";

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("task"), v.literal("bug"), v.literal("story"), v.literal("epic")),
    priority: v.union(v.literal("lowest"), v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("highest")),
    assigneeId: v.optional(v.id("users")),
    sprintId: v.optional(v.id("sprints")),
    epicId: v.optional(v.id("issues")),
    labels: v.optional(v.array(v.id("labels"))),
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

    // Check if user can create issues (requires editor role or higher)
    await assertMinimumRole(ctx, args.projectId, userId, "editor");

    // Generate issue key
    const existingIssues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    
    const issueNumber = existingIssues.length + 1;
    const issueKey = `${project.key}-${issueNumber}`;

    // Get the first workflow state as default status
    const defaultStatus = project.workflowStates[0]?.id || "todo";

    // Get max order for the status column
    const issuesInStatus = await ctx.db
      .query("issues")
      .withIndex("by_project_status", (q) => q.eq("projectId", args.projectId).eq("status", defaultStatus))
      .collect();
    
    const maxOrder = Math.max(...issuesInStatus.map(i => i.order), -1);

    const now = Date.now();
    const issueId = await ctx.db.insert("issues", {
      projectId: args.projectId,
      key: issueKey,
      title: args.title,
      description: args.description,
      type: args.type,
      status: defaultStatus,
      priority: args.priority,
      assigneeId: args.assigneeId,
      reporterId: userId,
      createdAt: now,
      updatedAt: now,
      labels: args.labels || [],
      sprintId: args.sprintId,
      epicId: args.epicId,
      linkedDocuments: [],
      attachments: [],
      order: maxOrder + 1,
    });

    // Log activity
    await ctx.db.insert("issueActivity", {
      issueId,
      userId,
      action: "created",
      createdAt: now,
    });

    return issueId;
  },
});

export const listByProject = query({
  args: { 
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return [];
    }

    // Check access permissions
    if (!project.isPublic && project.createdBy !== userId && (!userId || !project.members.includes(userId))) {
      return [];
    }

    const issuesQuery = ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId));

    const issues = await issuesQuery.collect();

    // Filter by sprint if specified
    const filteredIssues = args.sprintId 
      ? issues.filter(issue => issue.sprintId === args.sprintId)
      : issues.filter(issue => !issue.sprintId); // Backlog items

    return await Promise.all(
      filteredIssues.map(async (issue) => {
        const assignee = issue.assigneeId ? await ctx.db.get(issue.assigneeId) : null;
        const reporter = await ctx.db.get(issue.reporterId);
        const epic = issue.epicId ? await ctx.db.get(issue.epicId) : null;

        return {
          ...issue,
          assignee: assignee ? {
            _id: assignee._id,
            name: assignee.name || assignee.email || "Unknown",
            email: assignee.email,
            image: assignee.image,
          } : null,
          reporter: reporter ? {
            _id: reporter._id,
            name: reporter.name || reporter.email || "Unknown",
            email: reporter.email,
            image: reporter.image,
          } : null,
          epic: epic ? {
            _id: epic._id,
            key: epic.key,
            title: epic.title,
          } : null,
        };
      })
    );
  },
});

export const get = query({
  args: { id: v.id("issues") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const issue = await ctx.db.get(args.id);
    
    if (!issue) {
      return null;
    }

    const project = await ctx.db.get(issue.projectId);
    if (!project) {
      return null;
    }

    // Check access permissions
    if (!project.isPublic && project.createdBy !== userId && (!userId || !project.members.includes(userId))) {
      throw new Error("Not authorized to access this issue");
    }

    const assignee = issue.assigneeId ? await ctx.db.get(issue.assigneeId) : null;
    const reporter = await ctx.db.get(issue.reporterId);
    const epic = issue.epicId ? await ctx.db.get(issue.epicId) : null;

    // Get comments
    const comments = await ctx.db
      .query("issueComments")
      .withIndex("by_issue", (q) => q.eq("issueId", args.id))
      .order("asc")
      .collect();

    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        return {
          ...comment,
          author: author ? {
            _id: author._id,
            name: author.name || author.email || "Unknown",
            email: author.email,
            image: author.image,
          } : null,
        };
      })
    );

    // Get activity
    const activity = await ctx.db
      .query("issueActivity")
      .withIndex("by_issue", (q) => q.eq("issueId", args.id))
      .order("desc")
      .take(20)
      .then(activities => Promise.all(
        activities.map(async (act) => {
          const user = await ctx.db.get(act.userId);
          return {
            ...act,
            user: user ? {
              _id: user._id,
              name: user.name || user.email || "Unknown",
              image: user.image,
            } : null,
          };
        })
      ));

    return {
      ...issue,
      project,
      assignee: assignee ? {
        _id: assignee._id,
        name: assignee.name || assignee.email || "Unknown",
        email: assignee.email,
        image: assignee.image,
      } : null,
      reporter: reporter ? {
        _id: reporter._id,
        name: reporter.name || reporter.email || "Unknown",
        email: reporter.email,
        image: reporter.image,
      } : null,
      epic: epic ? {
        _id: epic._id,
        key: epic.key,
        title: epic.title,
      } : null,
      comments: commentsWithAuthors,
      activity,
    };
  },
});

export const updateStatus = mutation({
  args: {
    issueId: v.id("issues"),
    newStatus: v.string(),
    newOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    const project = await ctx.db.get(issue.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check permissions (requires editor role or higher)
    await assertMinimumRole(ctx, issue.projectId, userId, "editor");

    const oldStatus = issue.status;
    const now = Date.now();

    await ctx.db.patch(args.issueId, {
      status: args.newStatus,
      order: args.newOrder,
      updatedAt: now,
    });

    // Log activity
    if (oldStatus !== args.newStatus) {
      await ctx.db.insert("issueActivity", {
        issueId: args.issueId,
        userId,
        action: "updated",
        field: "status",
        oldValue: oldStatus,
        newValue: args.newStatus,
        createdAt: now,
      });
    }
  },
});

export const update = mutation({
  args: {
    issueId: v.id("issues"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("lowest"), v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("highest"))),
    assigneeId: v.optional(v.union(v.id("users"), v.null())),
    labels: v.optional(v.array(v.string())),
    dueDate: v.optional(v.union(v.number(), v.null())),
    estimatedHours: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    const project = await ctx.db.get(issue.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check permissions (requires editor role or higher)
    await assertMinimumRole(ctx, issue.projectId, userId, "editor");

    const updates: any = { updatedAt: Date.now() };
    const now = Date.now();

    // Track changes for activity log
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

    if (args.title !== undefined && args.title !== issue.title) {
      updates.title = args.title;
      changes.push({ field: "title", oldValue: issue.title, newValue: args.title });
    }

    if (args.description !== undefined && args.description !== issue.description) {
      updates.description = args.description;
      changes.push({ field: "description", oldValue: issue.description, newValue: args.description });
    }

    if (args.priority !== undefined && args.priority !== issue.priority) {
      updates.priority = args.priority;
      changes.push({ field: "priority", oldValue: issue.priority, newValue: args.priority });
    }

    if (args.assigneeId !== undefined && args.assigneeId !== issue.assigneeId) {
      updates.assigneeId = args.assigneeId;
      changes.push({ field: "assignee", oldValue: issue.assigneeId, newValue: args.assigneeId });
    }

    if (args.labels !== undefined) {
      updates.labels = args.labels;
      changes.push({ field: "labels", oldValue: issue.labels.join(", "), newValue: args.labels.join(", ") });
    }

    if (args.dueDate !== undefined && args.dueDate !== issue.dueDate) {
      updates.dueDate = args.dueDate;
      changes.push({ field: "dueDate", oldValue: issue.dueDate, newValue: args.dueDate });
    }

    if (args.estimatedHours !== undefined && args.estimatedHours !== issue.estimatedHours) {
      updates.estimatedHours = args.estimatedHours;
      changes.push({ field: "estimatedHours", oldValue: issue.estimatedHours, newValue: args.estimatedHours });
    }

    if (Object.keys(updates).length > 1) { // More than just updatedAt
      await ctx.db.patch(args.issueId, updates);

      // Log activities
      for (const change of changes) {
        await ctx.db.insert("issueActivity", {
          issueId: args.issueId,
          userId,
          action: "updated",
          field: change.field,
          oldValue: String(change.oldValue || ""),
          newValue: String(change.newValue || ""),
          createdAt: now,
        });
      }
    }
  },
});

export const addComment = mutation({
  args: {
    issueId: v.id("issues"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    const project = await ctx.db.get(issue.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check permissions (any role can comment, even viewers)
    await assertMinimumRole(ctx, issue.projectId, userId, "viewer");

    const now = Date.now();
    const commentId = await ctx.db.insert("issueComments", {
      issueId: args.issueId,
      authorId: userId,
      content: args.content,
      createdAt: now,
      updatedAt: now,
    });

    // Log activity
    await ctx.db.insert("issueActivity", {
      issueId: args.issueId,
      userId,
      action: "commented",
      createdAt: now,
    });

    return commentId;
  },
});

// Search issues
export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const results = await ctx.db
      .query("issues")
      .withSearchIndex("search_title", (q) => q.search("title", args.query))
      .take(args.limit ?? 20);

    // Filter to only issues user has access to
    const filtered = [];
    for (const issue of results) {
      try {
        await assertMinimumRole(ctx, issue.projectId, userId, "viewer");
        filtered.push(issue);
      } catch {
        // User doesn't have access, skip this issue
      }
    }

    return filtered;
  },
});
