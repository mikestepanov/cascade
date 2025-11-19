import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertMinimumRole } from "./rbac";

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("task"),
      v.literal("bug"),
      v.literal("story"),
      v.literal("epic"),
      v.literal("subtask"),
    ),
    priority: v.union(
      v.literal("lowest"),
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("highest"),
    ),
    assigneeId: v.optional(v.id("users")),
    sprintId: v.optional(v.id("sprints")),
    epicId: v.optional(v.id("issues")),
    parentId: v.optional(v.id("issues")),
    labels: v.optional(v.array(v.id("labels"))),
    estimatedHours: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    storyPoints: v.optional(v.number()),
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

    // Validate sub-task constraints
    let inheritedEpicId = args.epicId;
    if (args.parentId) {
      const parentIssue = await ctx.db.get(args.parentId);
      if (!parentIssue) {
        throw new Error("Parent issue not found");
      }

      // Prevent sub-tasks of sub-tasks (only 1 level deep)
      if (parentIssue.parentId) {
        throw new Error(
          "Cannot create sub-task of a sub-task. Sub-tasks can only be one level deep.",
        );
      }

      // Prevent epics from being parents (optional - remove if you want epics to have sub-tasks)
      // if (parentIssue.type === "epic") {
      //   throw new Error("Epics cannot have sub-tasks. Use stories/tasks under the epic instead.");
      // }

      // Inherit epicId from parent if not explicitly provided
      if (!inheritedEpicId && parentIssue.epicId) {
        inheritedEpicId = parentIssue.epicId;
      }

      // Sub-tasks must be of type "subtask"
      if (args.type !== "subtask") {
        throw new Error("Issues with a parent must be of type 'subtask'");
      }
    }

    // Epics cannot be sub-tasks
    if (args.type === "epic" && args.parentId) {
      throw new Error("Epics cannot be sub-tasks");
    }

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
      .withIndex("by_project_status", (q) =>
        q.eq("projectId", args.projectId).eq("status", defaultStatus),
      )
      .collect();

    const maxOrder = Math.max(...issuesInStatus.map((i) => i.order), -1);

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
      epicId: inheritedEpicId,
      parentId: args.parentId,
      linkedDocuments: [],
      attachments: [],
      estimatedHours: args.estimatedHours,
      dueDate: args.dueDate,
      storyPoints: args.storyPoints,
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
    if (
      !project.isPublic &&
      project.createdBy !== userId &&
      !(userId && project.members.includes(userId))
    ) {
      return [];
    }

    const issuesQuery = ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId));

    const issues = await issuesQuery.collect();

    // Filter by sprint if specified
    const filteredIssues = args.sprintId
      ? issues.filter((issue) => issue.sprintId === args.sprintId)
      : issues.filter((issue) => !issue.sprintId); // Backlog items

    return await Promise.all(
      filteredIssues.map(async (issue) => {
        const assignee = issue.assigneeId ? await ctx.db.get(issue.assigneeId) : null;
        const reporter = await ctx.db.get(issue.reporterId);
        const epic = issue.epicId ? await ctx.db.get(issue.epicId) : null;

        return {
          ...issue,
          assignee: assignee
            ? {
                _id: assignee._id,
                name: assignee.name || assignee.email || "Unknown",
                email: assignee.email,
                image: assignee.image,
              }
            : null,
          reporter: reporter
            ? {
                _id: reporter._id,
                name: reporter.name || reporter.email || "Unknown",
                email: reporter.email,
                image: reporter.image,
              }
            : null,
          epic: epic
            ? {
                _id: epic._id,
                key: epic.key,
                title: epic.title,
              }
            : null,
        };
      }),
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
    if (
      !project.isPublic &&
      project.createdBy !== userId &&
      !(userId && project.members.includes(userId))
    ) {
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
          author: author
            ? {
                _id: author._id,
                name: author.name || author.email || "Unknown",
                email: author.email,
                image: author.image,
              }
            : null,
        };
      }),
    );

    // Get activity
    const activity = await ctx.db
      .query("issueActivity")
      .withIndex("by_issue", (q) => q.eq("issueId", args.id))
      .order("desc")
      .take(20)
      .then((activities) =>
        Promise.all(
          activities.map(async (act) => {
            const user = await ctx.db.get(act.userId);
            return {
              ...act,
              user: user
                ? {
                    _id: user._id,
                    name: user.name || user.email || "Unknown",
                    image: user.image,
                  }
                : null,
            };
          }),
        ),
      );

    return {
      ...issue,
      project,
      assignee: assignee
        ? {
            _id: assignee._id,
            name: assignee.name || assignee.email || "Unknown",
            email: assignee.email,
            image: assignee.image,
          }
        : null,
      reporter: reporter
        ? {
            _id: reporter._id,
            name: reporter.name || reporter.email || "Unknown",
            email: reporter.email,
            image: reporter.image,
          }
        : null,
      epic: epic
        ? {
            _id: epic._id,
            key: epic.key,
            title: epic.title,
          }
        : null,
      comments: commentsWithAuthors,
      activity,
    };
  },
});

/**
 * Get issue by key (e.g., "PROJ-123")
 * Used by REST API for looking up issues by their human-readable key
 */
export const getByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    // Find issue by key
    const issues = await ctx.db.query("issues").collect();
    const issue = issues.find((i) => i.key === args.key);

    if (!issue) {
      return null;
    }

    // Use the existing get query to return full issue data
    return ctx.db
      .query("issues")
      .filter((q) => q.eq(q.field("_id"), issue._id))
      .first();
  },
});

export const listSubtasks = query({
  args: { parentId: v.id("issues") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const parentIssue = await ctx.db.get(args.parentId);
    if (!parentIssue) {
      return [];
    }

    // Check if user has access to the parent issue's project
    const project = await ctx.db.get(parentIssue.projectId);
    if (!project) {
      return [];
    }

    // Get all sub-tasks
    const subtasks = await ctx.db
      .query("issues")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect();

    // Enrich with assignee and reporter info
    const enrichedSubtasks = await Promise.all(
      subtasks.map(async (subtask) => {
        const assignee = subtask.assigneeId ? await ctx.db.get(subtask.assigneeId) : null;
        const reporter = subtask.reporterId ? await ctx.db.get(subtask.reporterId) : null;

        return {
          ...subtask,
          assignee: assignee
            ? {
                _id: assignee._id,
                name: assignee.name || assignee.email || "Unknown",
                image: assignee.image,
              }
            : null,
          reporter: reporter
            ? {
                _id: reporter._id,
                name: reporter.name || reporter.email || "Unknown",
              }
            : null,
        };
      }),
    );

    return enrichedSubtasks;
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
    priority: v.optional(
      v.union(
        v.literal("lowest"),
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("highest"),
      ),
    ),
    assigneeId: v.optional(v.union(v.id("users"), v.null())),
    labels: v.optional(v.array(v.string())),
    dueDate: v.optional(v.union(v.number(), v.null())),
    estimatedHours: v.optional(v.union(v.number(), v.null())),
    storyPoints: v.optional(v.union(v.number(), v.null())),
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

    const updates: Partial<typeof issue> = { updatedAt: Date.now() };
    const now = Date.now();

    // Track changes for activity log
    const changes: Array<{
      field: string;
      oldValue: string | number | null | undefined;
      newValue: string | number | null | undefined;
    }> = [];

    if (args.title !== undefined && args.title !== issue.title) {
      updates.title = args.title;
      changes.push({ field: "title", oldValue: issue.title, newValue: args.title });
    }

    if (args.description !== undefined && args.description !== issue.description) {
      updates.description = args.description;
      changes.push({
        field: "description",
        oldValue: issue.description,
        newValue: args.description,
      });
    }

    if (args.priority !== undefined && args.priority !== issue.priority) {
      updates.priority = args.priority;
      changes.push({ field: "priority", oldValue: issue.priority, newValue: args.priority });
    }

    if (args.assigneeId !== undefined && args.assigneeId !== issue.assigneeId) {
      updates.assigneeId = args.assigneeId ?? undefined;
      changes.push({
        field: "assignee",
        oldValue: issue.assigneeId,
        newValue: args.assigneeId ?? undefined,
      });

      // Send assignment email notification if assigned to someone new
      if (args.assigneeId && args.assigneeId !== userId) {
        // Import email helper dynamically to avoid circular deps
        const { sendEmailNotification } = await import("./email/helpers");
        await sendEmailNotification(ctx, {
          userId: args.assigneeId,
          type: "assigned",
          issueId: args.issueId,
          actorId: userId,
        });
      }
    }

    if (args.labels !== undefined) {
      updates.labels = args.labels;
      changes.push({
        field: "labels",
        oldValue: issue.labels.join(", "),
        newValue: args.labels.join(", "),
      });
    }

    if (args.dueDate !== undefined && args.dueDate !== issue.dueDate) {
      updates.dueDate = args.dueDate ?? undefined;
      changes.push({
        field: "dueDate",
        oldValue: issue.dueDate,
        newValue: args.dueDate ?? undefined,
      });
    }

    if (args.estimatedHours !== undefined && args.estimatedHours !== issue.estimatedHours) {
      updates.estimatedHours = args.estimatedHours ?? undefined;
      changes.push({
        field: "estimatedHours",
        oldValue: issue.estimatedHours,
        newValue: args.estimatedHours ?? undefined,
      });
    }

    if (args.storyPoints !== undefined && args.storyPoints !== issue.storyPoints) {
      updates.storyPoints = args.storyPoints ?? undefined;
      changes.push({
        field: "storyPoints",
        oldValue: issue.storyPoints,
        newValue: args.storyPoints ?? undefined,
      });
    }

    if (Object.keys(updates).length > 1) {
      // More than just updatedAt
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
    mentions: v.optional(v.array(v.id("users"))),
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
    const mentions = args.mentions || [];

    const commentId = await ctx.db.insert("issueComments", {
      issueId: args.issueId,
      authorId: userId,
      content: args.content,
      mentions,
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

    // Create notifications for mentioned users
    const author = await ctx.db.get(userId);
    const { sendEmailNotification } = await import("./email/helpers");

    for (const mentionedUserId of mentions) {
      if (mentionedUserId !== userId) {
        // Don't notify yourself
        await ctx.db.insert("notifications", {
          userId: mentionedUserId,
          type: "issue_mentioned",
          title: "You were mentioned",
          message: `${author?.name || "Someone"} mentioned you in ${issue.key}`,
          issueId: args.issueId,
          projectId: issue.projectId,
          isRead: false,
          createdAt: now,
        });

        // Send mention email
        await sendEmailNotification(ctx, {
          userId: mentionedUserId,
          type: "mention",
          issueId: args.issueId,
          actorId: userId,
          commentText: args.content,
        });
      }
    }

    // Notify issue reporter about comment (if not the commenter)
    if (issue.reporterId !== userId) {
      await ctx.db.insert("notifications", {
        userId: issue.reporterId,
        type: "issue_comment",
        title: "New comment",
        message: `${author?.name || "Someone"} commented on ${issue.key}`,
        issueId: args.issueId,
        projectId: issue.projectId,
        isRead: false,
        createdAt: now,
      });

      // Send comment email to reporter
      await sendEmailNotification(ctx, {
        userId: issue.reporterId,
        type: "comment",
        issueId: args.issueId,
        actorId: userId,
        commentText: args.content,
      });
    }

    return commentId;
  },
});

// Search issues with advanced filters and pagination
export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    projectId: v.optional(v.id("projects")),
    assigneeId: v.optional(v.union(v.id("users"), v.literal("unassigned"), v.literal("me"))),
    reporterId: v.optional(v.id("users")),
    type: v.optional(v.array(v.string())),
    status: v.optional(v.array(v.string())),
    priority: v.optional(v.array(v.string())),
    labels: v.optional(v.array(v.string())),
    sprintId: v.optional(v.union(v.id("sprints"), v.literal("backlog"), v.literal("none"))),
    epicId: v.optional(v.union(v.id("issues"), v.literal("none"))),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { results: [], total: 0, hasMore: false };

    // Get search results
    const searchResults = await ctx.db
      .query("issues")
      .withSearchIndex("search_title", (q) => q.search("title", args.query))
      .collect();

    // Filter to only issues user has access to and apply advanced filters
    const filtered = [];
    for (const issue of searchResults) {
      // Check access permissions
      try {
        await assertMinimumRole(ctx, issue.projectId, userId, "viewer");
      } catch {
        continue; // User doesn't have access, skip this issue
      }

      // Apply project filter
      if (args.projectId && issue.projectId !== args.projectId) {
        continue;
      }

      // Apply assignee filter
      if (args.assigneeId) {
        if (args.assigneeId === "unassigned" && issue.assigneeId) {
          continue;
        } else if (args.assigneeId === "me" && issue.assigneeId !== userId) {
          continue;
        } else if (
          args.assigneeId !== "unassigned" &&
          args.assigneeId !== "me" &&
          issue.assigneeId !== args.assigneeId
        ) {
          continue;
        }
      }

      // Apply reporter filter
      if (args.reporterId && issue.reporterId !== args.reporterId) {
        continue;
      }

      // Apply type filter
      if (args.type && args.type.length > 0 && !args.type.includes(issue.type)) {
        continue;
      }

      // Apply status filter
      if (args.status && args.status.length > 0 && !args.status.includes(issue.status)) {
        continue;
      }

      // Apply priority filter
      if (args.priority && args.priority.length > 0 && !args.priority.includes(issue.priority)) {
        continue;
      }

      // Apply labels filter (issue must have ALL specified labels)
      if (args.labels && args.labels.length > 0) {
        const hasAllLabels = args.labels.every((label) => issue.labels.includes(label));
        if (!hasAllLabels) {
          continue;
        }
      }

      // Apply sprint filter
      if (args.sprintId) {
        if (args.sprintId === "backlog" && issue.sprintId) {
          continue;
        } else if (args.sprintId === "none" && issue.sprintId) {
          continue;
        } else if (
          args.sprintId !== "backlog" &&
          args.sprintId !== "none" &&
          issue.sprintId !== args.sprintId
        ) {
          continue;
        }
      }

      // Apply epic filter
      if (args.epicId) {
        if (args.epicId === "none" && issue.epicId) {
          continue;
        } else if (args.epicId !== "none" && issue.epicId !== args.epicId) {
          continue;
        }
      }

      // Apply date range filter (createdAt)
      if (args.dateFrom && issue.createdAt < args.dateFrom) {
        continue;
      }
      if (args.dateTo && issue.createdAt > args.dateTo) {
        continue;
      }

      filtered.push(issue);
    }

    const total = filtered.length;
    const offset = args.offset ?? 0;
    const limit = args.limit ?? 20;

    // Apply pagination
    const paginatedResults = filtered.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    // Enrich with user and project data
    const enrichedResults = await Promise.all(
      paginatedResults.map(async (issue) => {
        const assignee = issue.assigneeId ? await ctx.db.get(issue.assigneeId) : null;
        const reporter = await ctx.db.get(issue.reporterId);
        const epic = issue.epicId ? await ctx.db.get(issue.epicId) : null;
        const project = await ctx.db.get(issue.projectId);

        return {
          ...issue,
          assignee: assignee
            ? {
                _id: assignee._id,
                name: assignee.name || assignee.email || "Unknown",
                email: assignee.email,
                image: assignee.image,
              }
            : null,
          reporter: reporter
            ? {
                _id: reporter._id,
                name: reporter.name || reporter.email || "Unknown",
                email: reporter.email,
                image: reporter.image,
              }
            : null,
          epic: epic
            ? {
                _id: epic._id,
                key: epic.key,
                title: epic.title,
              }
            : null,
          project: project
            ? {
                _id: project._id,
                name: project.name,
                key: project.key,
              }
            : null,
        };
      }),
    );

    return {
      results: enrichedResults,
      total,
      hasMore,
      offset,
      limit,
    };
  },
});

// Bulk Operations

export const bulkUpdateStatus = mutation({
  args: {
    issueIds: v.array(v.id("issues")),
    newStatus: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const results = [];

    for (const issueId of args.issueIds) {
      const issue = await ctx.db.get(issueId);
      if (!issue) continue;

      // Check permissions
      try {
        await assertMinimumRole(ctx, issue.projectId, userId, "editor");
      } catch {
        continue; // Skip issues user doesn't have access to
      }

      const oldStatus = issue.status;

      await ctx.db.patch(issueId, {
        status: args.newStatus,
        updatedAt: now,
      });

      // Log activity
      if (oldStatus !== args.newStatus) {
        await ctx.db.insert("issueActivity", {
          issueId,
          userId,
          action: "updated",
          field: "status",
          oldValue: oldStatus,
          newValue: args.newStatus,
          createdAt: now,
        });
      }

      results.push(issueId);
    }

    return { updated: results.length };
  },
});

export const bulkUpdatePriority = mutation({
  args: {
    issueIds: v.array(v.id("issues")),
    priority: v.union(
      v.literal("lowest"),
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("highest"),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const results = [];

    for (const issueId of args.issueIds) {
      const issue = await ctx.db.get(issueId);
      if (!issue) continue;

      try {
        await assertMinimumRole(ctx, issue.projectId, userId, "editor");
      } catch {
        continue;
      }

      const oldPriority = issue.priority;

      await ctx.db.patch(issueId, {
        priority: args.priority,
        updatedAt: now,
      });

      await ctx.db.insert("issueActivity", {
        issueId,
        userId,
        action: "updated",
        field: "priority",
        oldValue: oldPriority,
        newValue: args.priority,
        createdAt: now,
      });

      results.push(issueId);
    }

    return { updated: results.length };
  },
});

export const bulkAssign = mutation({
  args: {
    issueIds: v.array(v.id("issues")),
    assigneeId: v.union(v.id("users"), v.null()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const results = [];

    for (const issueId of args.issueIds) {
      const issue = await ctx.db.get(issueId);
      if (!issue) continue;

      try {
        await assertMinimumRole(ctx, issue.projectId, userId, "editor");
      } catch {
        continue;
      }

      const oldAssignee = issue.assigneeId;

      await ctx.db.patch(issueId, {
        assigneeId: args.assigneeId ?? undefined,
        updatedAt: now,
      });

      await ctx.db.insert("issueActivity", {
        issueId,
        userId,
        action: "updated",
        field: "assignee",
        oldValue: oldAssignee ? String(oldAssignee) : "",
        newValue: args.assigneeId ? String(args.assigneeId) : "",
        createdAt: now,
      });

      results.push(issueId);
    }

    return { updated: results.length };
  },
});

export const bulkAddLabels = mutation({
  args: {
    issueIds: v.array(v.id("issues")),
    labels: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const results = [];

    for (const issueId of args.issueIds) {
      const issue = await ctx.db.get(issueId);
      if (!issue) continue;

      try {
        await assertMinimumRole(ctx, issue.projectId, userId, "editor");
      } catch {
        continue;
      }

      // Merge existing labels with new labels (avoid duplicates)
      const updatedLabels = Array.from(new Set([...issue.labels, ...args.labels]));

      await ctx.db.patch(issueId, {
        labels: updatedLabels,
        updatedAt: now,
      });

      await ctx.db.insert("issueActivity", {
        issueId,
        userId,
        action: "updated",
        field: "labels",
        oldValue: issue.labels.join(", "),
        newValue: updatedLabels.join(", "),
        createdAt: now,
      });

      results.push(issueId);
    }

    return { updated: results.length };
  },
});

export const bulkMoveToSprint = mutation({
  args: {
    issueIds: v.array(v.id("issues")),
    sprintId: v.union(v.id("sprints"), v.null()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const results = [];

    for (const issueId of args.issueIds) {
      const issue = await ctx.db.get(issueId);
      if (!issue) continue;

      try {
        await assertMinimumRole(ctx, issue.projectId, userId, "editor");
      } catch {
        continue;
      }

      const oldSprint = issue.sprintId;

      await ctx.db.patch(issueId, {
        sprintId: args.sprintId ?? undefined,
        updatedAt: now,
      });

      await ctx.db.insert("issueActivity", {
        issueId,
        userId,
        action: "updated",
        field: "sprint",
        oldValue: oldSprint ? String(oldSprint) : "",
        newValue: args.sprintId ? String(args.sprintId) : "",
        createdAt: now,
      });

      results.push(issueId);
    }

    return { updated: results.length };
  },
});

export const bulkDelete = mutation({
  args: {
    issueIds: v.array(v.id("issues")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const results = [];

    for (const issueId of args.issueIds) {
      const issue = await ctx.db.get(issueId);
      if (!issue) continue;

      try {
        await assertMinimumRole(ctx, issue.projectId, userId, "admin");
      } catch {
        continue; // Only admins can delete
      }

      // Delete related data
      const comments = await ctx.db
        .query("issueComments")
        .withIndex("by_issue", (q) => q.eq("issueId", issueId))
        .collect();

      for (const comment of comments) {
        await ctx.db.delete(comment._id);
      }

      const activities = await ctx.db
        .query("issueActivity")
        .withIndex("by_issue", (q) => q.eq("issueId", issueId))
        .collect();

      for (const activity of activities) {
        await ctx.db.delete(activity._id);
      }

      const links = await ctx.db
        .query("issueLinks")
        .withIndex("by_from_issue", (q) => q.eq("fromIssueId", issueId))
        .collect();

      for (const link of links) {
        await ctx.db.delete(link._id);
      }

      const backlinks = await ctx.db
        .query("issueLinks")
        .withIndex("by_to_issue", (q) => q.eq("toIssueId", issueId))
        .collect();

      for (const link of backlinks) {
        await ctx.db.delete(link._id);
      }

      const watchers = await ctx.db
        .query("issueWatchers")
        .withIndex("by_issue", (q) => q.eq("issueId", issueId))
        .collect();

      for (const watcher of watchers) {
        await ctx.db.delete(watcher._id);
      }

      const timeEntries = await ctx.db
        .query("timeEntries")
        .withIndex("by_issue", (q) => q.eq("issueId", issueId))
        .collect();

      for (const entry of timeEntries) {
        await ctx.db.delete(entry._id);
      }

      // Finally delete the issue
      await ctx.db.delete(issueId);
      results.push(issueId);
    }

    return { deleted: results.length };
  },
});
