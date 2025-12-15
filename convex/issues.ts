import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, query } from "./_generated/server";
import {
  assertCanAccessProject,
  assertCanEditProject,
  assertIsProjectAdmin,
  canAccessProject,
} from "./workspaceAccess";

// Helper: Validate parent issue and get inherited epic
async function validateParentIssue(
  ctx: MutationCtx,
  parentId: Id<"issues"> | undefined,
  issueType: string,
  epicId: Id<"issues"> | undefined,
) {
  if (!parentId) {
    if (issueType === "epic" && parentId) {
      throw new Error("Epics cannot be sub-tasks");
    }
    return epicId;
  }

  const parentIssue = await ctx.db.get(parentId);
  if (!parentIssue) {
    throw new Error("Parent issue not found");
  }

  // Prevent sub-tasks of sub-tasks (only 1 level deep)
  if (parentIssue.parentId) {
    throw new Error("Cannot create sub-task of a sub-task. Sub-tasks can only be one level deep.");
  }

  // Sub-tasks must be of type "subtask"
  if (issueType !== "subtask") {
    throw new Error("Issues with a parent must be of type 'subtask'");
  }

  // Inherit epicId from parent if not explicitly provided
  return epicId || parentIssue.epicId;
}

// Helper: Generate issue key
async function generateIssueKey(
  ctx: MutationCtx,
  workspaceId: Id<"workspaces">,
  projectKey: string,
) {
  const existingIssues = await ctx.db
    .query("issues")
    .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
    .collect();

  const issueNumber = existingIssues.length + 1;
  return `${projectKey}-${issueNumber}`;
}

// Helper: Get max order for status column
async function getMaxOrderForStatus(
  ctx: MutationCtx,
  workspaceId: Id<"workspaces">,
  status: string,
) {
  const issuesInStatus = await ctx.db
    .query("issues")
    .withIndex("by_workspace_status", (q) => q.eq("workspaceId", workspaceId).eq("status", status))
    .collect();

  return Math.max(...issuesInStatus.map((i) => i.order), -1);
}

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
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

    const project = await ctx.db.get(args.workspaceId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check if user can create issues (requires editor role or higher)
    await assertCanEditProject(ctx, args.workspaceId, userId);

    // Validate parent/epic constraints
    const inheritedEpicId = await validateParentIssue(ctx, args.parentId, args.type, args.epicId);

    // Generate issue key
    const issueKey = await generateIssueKey(ctx, args.workspaceId, project.key);

    // Get the first workflow state as default status
    const defaultStatus = project.workflowStates[0]?.id || "todo";

    // Get max order for the status column
    const maxOrder = await getMaxOrderForStatus(ctx, args.workspaceId, defaultStatus);

    const now = Date.now();
    const issueId = await ctx.db.insert("issues", {
      workspaceId: args.workspaceId,
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

/**
 * List all issues assigned to or reported by the current user
 * Used by onboarding checklist to track user progress
 */
export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get all issues where user is assignee or reporter
    const allIssues = await ctx.db.query("issues").collect();

    const userIssues = allIssues.filter(
      (issue) => issue.assigneeId === userId || issue.reporterId === userId,
    );

    return userIssues.map((issue) => ({
      _id: issue._id,
      key: issue.key,
      title: issue.title,
      status: issue.status,
      type: issue.type,
      priority: issue.priority,
      workspaceId: issue.workspaceId,
    }));
  },
});

export const listByProject = query({
  args: {
    workspaceId: v.id("workspaces"),
    sprintId: v.optional(v.id("sprints")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const project = await ctx.db.get(args.workspaceId);
    if (!project) {
      return [];
    }

    // Check access permissions
    const hasAccess = await canAccessProject(ctx, args.workspaceId, userId);
    if (!hasAccess) {
      return [];
    }

    const issuesQuery = ctx.db
      .query("issues")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId));

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

    const project = await ctx.db.get(issue.workspaceId);
    if (!project) {
      return null;
    }

    // Check access permissions
    if (userId) {
      const hasAccess = await canAccessProject(ctx, issue.workspaceId, userId);
      if (!hasAccess) {
        throw new Error("Not authorized to access this issue");
      }
    } else {
      // Unauthenticated users can only access public projects
      if (!project.isPublic) {
        throw new Error("Not authorized to access this issue");
      }
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
    const project = await ctx.db.get(parentIssue.workspaceId);
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

    const project = await ctx.db.get(issue.workspaceId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check permissions (requires editor role or higher)
    await assertCanEditProject(ctx, issue.workspaceId, userId);

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

// Helper: Track field change and add to changes array
function trackFieldChange<T>(
  changes: Array<{
    field: string;
    oldValue: string | number | null | undefined;
    newValue: string | number | null | undefined;
  }>,
  field: string,
  oldValue: T,
  newValue: T | undefined,
): boolean {
  if (newValue !== undefined && newValue !== oldValue) {
    changes.push({
      field,
      oldValue: oldValue as string | number | null | undefined,
      newValue: newValue as string | number | null | undefined,
    });
    return true;
  }
  return false;
}

// Helper: Track and update a nullable field
function trackNullableFieldUpdate<T>(
  updates: Record<string, unknown>,
  changes: Array<{
    field: string;
    oldValue: string | number | null | undefined;
    newValue: string | number | null | undefined;
  }>,
  fieldName: string,
  oldValue: T | undefined,
  newValue: T | null | undefined,
  valueTransform?: (val: T | null | undefined) => string | number | null | undefined,
): void {
  if (newValue !== undefined && newValue !== oldValue) {
    updates[fieldName] = newValue ?? undefined;
    changes.push({
      field: fieldName,
      oldValue: valueTransform
        ? valueTransform(oldValue)
        : (oldValue as string | number | undefined),
      newValue: valueTransform
        ? valueTransform(newValue)
        : (newValue as string | number | null | undefined),
    });
  }
}

// Helper: Process issue update fields and track changes
function processIssueUpdates(
  issue: {
    title: string;
    description?: string;
    priority: string;
    assigneeId?: Id<"users">;
    labels: string[];
    dueDate?: number;
    estimatedHours?: number;
    storyPoints?: number;
  },
  args: {
    title?: string;
    description?: string;
    priority?: string;
    assigneeId?: Id<"users"> | null;
    labels?: string[];
    dueDate?: number | null;
    estimatedHours?: number | null;
    storyPoints?: number | null;
  },
  changes: Array<{
    field: string;
    oldValue: string | number | null | undefined;
    newValue: string | number | null | undefined;
  }>,
) {
  const updates: Record<string, unknown> = { updatedAt: Date.now() };

  // Track simple field changes
  if (trackFieldChange(changes, "title", issue.title, args.title)) {
    updates.title = args.title;
  }
  if (trackFieldChange(changes, "description", issue.description, args.description)) {
    updates.description = args.description;
  }
  if (trackFieldChange(changes, "priority", issue.priority, args.priority)) {
    updates.priority = args.priority;
  }

  // Track nullable field changes
  trackNullableFieldUpdate(updates, changes, "assigneeId", issue.assigneeId, args.assigneeId);
  trackNullableFieldUpdate(updates, changes, "dueDate", issue.dueDate, args.dueDate);
  trackNullableFieldUpdate(
    updates,
    changes,
    "estimatedHours",
    issue.estimatedHours,
    args.estimatedHours,
  );
  trackNullableFieldUpdate(updates, changes, "storyPoints", issue.storyPoints, args.storyPoints);

  // Handle labels specially (array to string transform)
  if (args.labels !== undefined) {
    updates.labels = args.labels;
    changes.push({
      field: "labels",
      oldValue: issue.labels.join(", "),
      newValue: args.labels.join(", "),
    });
  }

  return updates;
}

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

    // Check permissions (requires editor role or higher)
    await assertCanEditProject(ctx, issue.workspaceId, userId);

    const now = Date.now();
    const changes: Array<{
      field: string;
      oldValue: string | number | null | undefined;
      newValue: string | number | null | undefined;
    }> = [];

    // Process all field updates and track changes
    const updates = processIssueUpdates(issue, args, changes);

    // Send assignment email notification if assigned to someone new
    if (
      args.assigneeId !== undefined &&
      args.assigneeId !== issue.assigneeId &&
      args.assigneeId &&
      args.assigneeId !== userId
    ) {
      const { sendEmailNotification } = await import("./email/helpers");
      await sendEmailNotification(ctx, {
        userId: args.assigneeId,
        type: "assigned",
        issueId: args.issueId,
        actorId: userId,
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

    const project = await ctx.db.get(issue.workspaceId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check permissions (any role can comment, even viewers)
    await assertCanAccessProject(ctx, issue.workspaceId, userId);

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
          workspaceId: issue.workspaceId,
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
        workspaceId: issue.workspaceId,
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
// Helper: Check if issue matches assignee filter
function matchesAssigneeFilter(
  issue: { assigneeId?: Id<"users"> },
  assigneeFilter: Id<"users"> | "unassigned" | "me" | undefined,
  userId: Id<"users">,
): boolean {
  if (!assigneeFilter) return true;

  if (assigneeFilter === "unassigned") {
    return !issue.assigneeId;
  }
  if (assigneeFilter === "me") {
    return issue.assigneeId === userId;
  }
  return issue.assigneeId === assigneeFilter;
}

// Helper: Check if issue matches sprint filter
function matchesSprintFilter(
  issue: { sprintId?: Id<"sprints"> },
  sprintFilter: Id<"sprints"> | "backlog" | "none" | undefined,
): boolean {
  if (!sprintFilter) return true;

  if (sprintFilter === "backlog" || sprintFilter === "none") {
    return !issue.sprintId;
  }
  return issue.sprintId === sprintFilter;
}

// Helper: Check if issue matches epic filter
function matchesEpicFilter(
  issue: { epicId?: Id<"issues"> },
  epicFilter: Id<"issues"> | "none" | undefined,
): boolean {
  if (!epicFilter) return true;

  if (epicFilter === "none") {
    return !issue.epicId;
  }
  return issue.epicId === epicFilter;
}

// Helper: Check if value matches array filter
function matchesArrayFilter<T>(value: T, filterArray: T[] | undefined): boolean {
  if (!filterArray || filterArray.length === 0) return true;
  return filterArray.includes(value);
}

// Helper: Check if issue matches date range
function matchesDateRange(createdAt: number, dateFrom?: number, dateTo?: number): boolean {
  if (dateFrom && createdAt < dateFrom) return false;
  if (dateTo && createdAt > dateTo) return false;
  return true;
}

// Helper: Check if issue matches labels filter (all labels must be present)
function matchesLabelsFilter(issueLabels: string[], filterLabels?: string[]): boolean {
  if (!filterLabels || filterLabels.length === 0) return true;
  return filterLabels.every((label) => issueLabels.includes(label));
}

// Helper: Check if issue matches all search filters
function matchesSearchFilters(
  issue: {
    workspaceId: Id<"workspaces">;
    assigneeId?: Id<"users">;
    reporterId: Id<"users">;
    type: string;
    status: string;
    priority: string;
    labels: string[];
    sprintId?: Id<"sprints">;
    epicId?: Id<"issues">;
    createdAt: number;
  },
  filters: {
    workspaceId?: Id<"workspaces">;
    assigneeId?: Id<"users"> | "unassigned" | "me";
    reporterId?: Id<"users">;
    type?: string[];
    status?: string[];
    priority?: string[];
    labels?: string[];
    sprintId?: Id<"sprints"> | "backlog" | "none";
    epicId?: Id<"issues"> | "none";
    dateFrom?: number;
    dateTo?: number;
  },
  userId: Id<"users">,
): boolean {
  // Simple ID filters
  if (filters.workspaceId && issue.workspaceId !== filters.workspaceId) return false;
  if (filters.reporterId && issue.reporterId !== filters.reporterId) return false;

  // Complex filters using helpers
  if (!matchesAssigneeFilter(issue, filters.assigneeId, userId)) return false;
  if (!matchesArrayFilter(issue.type, filters.type)) return false;
  if (!matchesArrayFilter(issue.status, filters.status)) return false;
  if (!matchesArrayFilter(issue.priority, filters.priority)) return false;
  if (!matchesLabelsFilter(issue.labels, filters.labels)) return false;
  if (!matchesSprintFilter(issue, filters.sprintId)) return false;
  if (!matchesEpicFilter(issue, filters.epicId)) return false;
  if (!matchesDateRange(issue.createdAt, filters.dateFrom, filters.dateTo)) return false;

  return true;
}

export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    workspaceId: v.optional(v.id("workspaces")),
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
        await assertCanAccessProject(ctx, issue.workspaceId, userId);
      } catch {
        continue; // User doesn't have access, skip this issue
      }

      // Apply all search filters
      if (!matchesSearchFilters(issue, args, userId)) {
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
        const project = await ctx.db.get(issue.workspaceId);

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

    // Batch fetch all issues at once to avoid N+1
    const issues = await Promise.all(args.issueIds.map((id) => ctx.db.get(id)));

    const now = Date.now();
    const results = [];

    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      const issueId = args.issueIds[i];
      if (!issue) continue;

      // Check permissions
      try {
        await assertCanEditProject(ctx, issue.workspaceId, userId);
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

    // Batch fetch all issues at once to avoid N+1
    const issues = await Promise.all(args.issueIds.map((id) => ctx.db.get(id)));

    const now = Date.now();
    const results = [];

    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      const issueId = args.issueIds[i];
      if (!issue) continue;

      try {
        await assertCanEditProject(ctx, issue.workspaceId, userId);
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

    // Batch fetch all issues at once to avoid N+1
    const issues = await Promise.all(args.issueIds.map((id) => ctx.db.get(id)));

    const now = Date.now();
    const results = [];

    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      const issueId = args.issueIds[i];
      if (!issue) continue;

      try {
        await assertCanEditProject(ctx, issue.workspaceId, userId);
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

    // Batch fetch all issues at once to avoid N+1
    const issues = await Promise.all(args.issueIds.map((id) => ctx.db.get(id)));

    const now = Date.now();
    const results = [];

    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      const issueId = args.issueIds[i];
      if (!issue) continue;

      try {
        await assertCanEditProject(ctx, issue.workspaceId, userId);
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

    // Batch fetch all issues at once to avoid N+1
    const issues = await Promise.all(args.issueIds.map((id) => ctx.db.get(id)));

    const now = Date.now();
    const results = [];

    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      const issueId = args.issueIds[i];
      if (!issue) continue;

      try {
        await assertCanEditProject(ctx, issue.workspaceId, userId);
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

// Helper: Delete all related records for an issue
async function deleteIssueRelatedRecords(ctx: MutationCtx, issueId: Id<"issues">): Promise<void> {
  // Delete comments
  const comments = await ctx.db
    .query("issueComments")
    .withIndex("by_issue", (q) => q.eq("issueId", issueId))
    .collect();
  for (const comment of comments) {
    await ctx.db.delete(comment._id);
  }

  // Delete activities
  const activities = await ctx.db
    .query("issueActivity")
    .withIndex("by_issue", (q) => q.eq("issueId", issueId))
    .collect();
  for (const activity of activities) {
    await ctx.db.delete(activity._id);
  }

  // Delete outgoing links
  const links = await ctx.db
    .query("issueLinks")
    .withIndex("by_from_issue", (q) => q.eq("fromIssueId", issueId))
    .collect();
  for (const link of links) {
    await ctx.db.delete(link._id);
  }

  // Delete incoming links
  const backlinks = await ctx.db
    .query("issueLinks")
    .withIndex("by_to_issue", (q) => q.eq("toIssueId", issueId))
    .collect();
  for (const link of backlinks) {
    await ctx.db.delete(link._id);
  }

  // Delete watchers
  const watchers = await ctx.db
    .query("issueWatchers")
    .withIndex("by_issue", (q) => q.eq("issueId", issueId))
    .collect();
  for (const watcher of watchers) {
    await ctx.db.delete(watcher._id);
  }

  // Delete time entries
  const timeEntries = await ctx.db
    .query("timeEntries")
    .withIndex("by_issue", (q) => q.eq("issueId", issueId))
    .collect();
  for (const entry of timeEntries) {
    await ctx.db.delete(entry._id);
  }
}

export const bulkDelete = mutation({
  args: {
    issueIds: v.array(v.id("issues")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Batch fetch all issues at once to avoid N+1
    const issues = await Promise.all(args.issueIds.map((id) => ctx.db.get(id)));

    const results = [];

    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      const issueId = args.issueIds[i];
      if (!issue) continue;

      try {
        await assertIsProjectAdmin(ctx, issue.workspaceId, userId);
      } catch {
        continue; // Only admins can delete
      }

      // Delete all related records
      await deleteIssueRelatedRecords(ctx, issueId);

      // Finally delete the issue
      await ctx.db.delete(issueId);
      results.push(issueId);
    }

    return { deleted: results.length };
  },
});

// ============================================================================
// PAGINATION & SMART LOADING QUERIES
// ============================================================================

import { countIssuesByStatus, enrichIssues, groupIssuesByStatus } from "./lib/issueHelpers";
import {
  DEFAULT_PAGE_SIZE,
  DONE_COLUMN_DAYS,
  decodeCursor,
  encodeCursor,
  getDoneColumnThreshold,
} from "./lib/pagination";

/**
 * Smart loading for Kanban boards
 * - todo/inprogress: Load all items
 * - done: Load only recent items (last N days)
 */
export const listByWorkspaceSmart = query({
  args: {
    workspaceId: v.id("workspaces"),
    sprintId: v.optional(v.id("sprints")),
    doneColumnDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await assertCanAccessProject(ctx, args.workspaceId, userId);

    const project = await ctx.db.get(args.workspaceId);
    if (!project) {
      throw new Error("Workspace not found");
    }

    const workflowStates = project.workflowStates || [];
    const doneThreshold = getDoneColumnThreshold(args.doneColumnDays ?? DONE_COLUMN_DAYS);

    // Build a map of status -> category
    const statusToCategory: Record<string, string> = {};
    for (const state of workflowStates) {
      statusToCategory[state.id] = state.category;
    }

    // Get all issues for this workspace (optionally filtered by sprint)
    const issuesQuery = ctx.db
      .query("issues")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId));

    const allIssues = await issuesQuery.collect();

    // Filter by sprint if provided
    const sprintFiltered = args.sprintId
      ? allIssues.filter((i) => i.sprintId === args.sprintId)
      : allIssues;

    // Apply smart loading: filter done items by date
    const smartFiltered = sprintFiltered.filter((issue) => {
      const category = statusToCategory[issue.status] || "todo";
      if (category === "done") {
        return issue.updatedAt >= doneThreshold;
      }
      return true; // Load all for todo/inprogress
    });

    // Count hidden done items
    const hiddenDoneCount = sprintFiltered.filter((issue) => {
      const category = statusToCategory[issue.status] || "todo";
      return category === "done" && issue.updatedAt < doneThreshold;
    }).length;

    // Enrich with user data
    const enriched = await enrichIssues(ctx, smartFiltered);

    // Group by status
    const byStatus = groupIssuesByStatus(enriched);

    return {
      issuesByStatus: byStatus,
      hiddenDoneCount,
      workflowStates,
      totalCount: sprintFiltered.length,
      loadedCount: smartFiltered.length,
    };
  },
});

/**
 * Paginated issue list for backlog/list views
 */
export const listByWorkspacePaginated = query({
  args: {
    workspaceId: v.id("workspaces"),
    sprintId: v.optional(v.id("sprints")),
    status: v.optional(v.string()),
    cursor: v.optional(v.string()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await assertCanAccessProject(ctx, args.workspaceId, userId);

    const pageSize = args.pageSize ?? DEFAULT_PAGE_SIZE;

    // Query issues with proper index
    let issues = await ctx.db
      .query("issues")
      .withIndex("by_workspace_updated", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .collect();

    // Apply filters
    if (args.sprintId) {
      issues = issues.filter((i) => i.sprintId === args.sprintId);
    }
    if (args.status) {
      issues = issues.filter((i) => i.status === args.status);
    }

    // Count total BEFORE cursor pagination (reuse already-fetched data)
    const totalCount = issues.length;

    // Apply cursor-based pagination with ID tiebreaking
    if (args.cursor) {
      const { timestamp, id } = decodeCursor(args.cursor);
      issues = issues.filter(
        (i) => i.updatedAt < timestamp || (i.updatedAt === timestamp && i._id.toString() < id),
      );
    }

    // Get one extra to check if there is more
    const pageItems = issues.slice(0, pageSize + 1);
    const hasMore = pageItems.length > pageSize;
    const resultItems = hasMore ? pageItems.slice(0, pageSize) : pageItems;

    // Enrich with user data
    const enriched = await enrichIssues(ctx, resultItems);

    // Build next cursor with ID for tiebreaking
    const lastItem = resultItems[resultItems.length - 1];
    const nextCursor =
      hasMore && lastItem ? encodeCursor(lastItem.updatedAt, lastItem._id.toString()) : null;

    return {
      items: enriched,
      nextCursor,
      hasMore,
      totalCount,
    };
  },
});

/**
 * Get issue counts by status for a workspace
 * Useful for "Load X more" indicators
 */
export const getIssueCounts = query({
  args: {
    workspaceId: v.id("workspaces"),
    sprintId: v.optional(v.id("sprints")),
    doneColumnDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await assertCanAccessProject(ctx, args.workspaceId, userId);

    const project = await ctx.db.get(args.workspaceId);
    if (!project) {
      throw new Error("Workspace not found");
    }

    const workflowStates = project.workflowStates || [];
    const doneThreshold = getDoneColumnThreshold(args.doneColumnDays ?? DONE_COLUMN_DAYS);

    // Build a map of status -> category
    const statusToCategory: Record<string, string> = {};
    for (const state of workflowStates) {
      statusToCategory[state.id] = state.category;
    }

    // Get all issues
    let issues = await ctx.db
      .query("issues")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Filter by sprint if provided
    if (args.sprintId) {
      issues = issues.filter((i) => i.sprintId === args.sprintId);
    }

    // Count totals by status
    const totalByStatus = countIssuesByStatus(issues);

    // Count visible (after smart loading filter) by status
    const visibleIssues = issues.filter((issue) => {
      const category = statusToCategory[issue.status] || "todo";
      if (category === "done") {
        return issue.updatedAt >= doneThreshold;
      }
      return true;
    });
    const visibleByStatus = countIssuesByStatus(visibleIssues);

    // Calculate hidden counts
    const hiddenByStatus: Record<string, number> = {};
    for (const status of Object.keys(totalByStatus)) {
      hiddenByStatus[status] = (totalByStatus[status] || 0) - (visibleByStatus[status] || 0);
    }

    return {
      total: issues.length,
      visible: visibleIssues.length,
      hidden: issues.length - visibleIssues.length,
      byStatus: {
        total: totalByStatus,
        visible: visibleByStatus,
        hidden: hiddenByStatus,
      },
    };
  },
});

/**
 * Load more done items (for expanding the done column)
 */
export const loadMoreDoneIssues = query({
  args: {
    workspaceId: v.id("workspaces"),
    sprintId: v.optional(v.id("sprints")),
    beforeTimestamp: v.optional(v.number()),
    beforeId: v.optional(v.string()), // For tiebreaking when timestamps match
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await assertCanAccessProject(ctx, args.workspaceId, userId);

    const project = await ctx.db.get(args.workspaceId);
    if (!project) {
      throw new Error("Workspace not found");
    }

    const workflowStates = project.workflowStates || [];
    const limit = args.limit ?? DEFAULT_PAGE_SIZE;

    // Get done status IDs
    const doneStatuses = workflowStates.filter((s) => s.category === "done").map((s) => s.id);

    // Query issues
    let issues = await ctx.db
      .query("issues")
      .withIndex("by_workspace_updated", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .collect();

    // Filter to done statuses only
    issues = issues.filter((i) => doneStatuses.includes(i.status));

    // Filter by sprint if provided
    if (args.sprintId) {
      issues = issues.filter((i) => i.sprintId === args.sprintId);
    }

    // Apply cursor with ID tiebreaking
    if (args.beforeTimestamp) {
      const threshold = args.beforeTimestamp;
      const beforeId = args.beforeId;
      issues = issues.filter((i) => {
        if (i.updatedAt < threshold) return true;
        if (i.updatedAt === threshold && beforeId && i._id.toString() < beforeId) return true;
        return false;
      });
    }

    // Get page + 1 to check hasMore
    const pageItems = issues.slice(0, limit + 1);
    const hasMore = pageItems.length > limit;
    const resultItems = hasMore ? pageItems.slice(0, limit) : pageItems;

    // Enrich
    const enriched = await enrichIssues(ctx, resultItems);

    const lastItem = resultItems[resultItems.length - 1];
    return {
      items: enriched,
      hasMore,
      nextTimestamp: lastItem?.updatedAt ?? null,
      nextId: lastItem?._id.toString() ?? null,
    };
  },
});
