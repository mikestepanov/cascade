import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { mutation } from "../_generated/server";
import {
  authenticatedMutation,
  editorMutation,
  issueMutation,
  issueViewerMutation,
} from "../customFunctions";
import { cascadeDelete } from "../lib/relationships";
import { assertCanEditProject, assertIsProjectAdmin } from "../projectAccess";
import {
  generateIssueKey,
  getMaxOrderForStatus,
  processIssueUpdates,
  validateParentIssue,
} from "./helpers";

export const create = editorMutation({
  args: {
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
    // Validate parent/epic constraints
    const inheritedEpicId = await validateParentIssue(ctx, args.parentId, args.type, args.epicId);

    // Generate issue key
    const issueKey = await generateIssueKey(ctx, ctx.projectId, ctx.project.key);

    // Get the first workflow state as default status
    const defaultStatus = ctx.project.workflowStates[0]?.id || "todo";

    // Get max order for the status column
    const maxOrder = await getMaxOrderForStatus(ctx, ctx.projectId, defaultStatus);

    const now = Date.now();
    const issueId = await ctx.db.insert("issues", {
      projectId: ctx.projectId,
      workspaceId: ctx.project.workspaceId!,
      teamId: ctx.project.teamId,
      key: issueKey,
      title: args.title,
      description: args.description,
      type: args.type,
      status: defaultStatus,
      priority: args.priority,
      assigneeId: args.assigneeId,
      reporterId: ctx.userId,
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
      loggedHours: 0,
      order: maxOrder + 1,
    });

    // Log activity
    await ctx.db.insert("issueActivity", {
      issueId,
      userId: ctx.userId,
      action: "created",
      createdAt: now,
    });

    return issueId;
  },
});

export const updateStatus = issueMutation({
  args: {
    newStatus: v.string(),
    newOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const oldStatus = ctx.issue.status;
    const now = Date.now();

    await ctx.db.patch(ctx.issue._id, {
      status: args.newStatus,
      order: args.newOrder,
      updatedAt: now,
    });

    if (oldStatus !== args.newStatus) {
      await ctx.db.insert("issueActivity", {
        issueId: ctx.issue._id,
        userId: ctx.userId,
        action: "updated",
        field: "status",
        oldValue: oldStatus,
        newValue: args.newStatus,
        createdAt: now,
      });
    }
  },
});

export const updateStatusByCategory = issueMutation({
  args: {
    category: v.union(v.literal("todo"), v.literal("inprogress"), v.literal("done")),
    newOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const workflowStates = ctx.project?.workflowStates || [];
    const targetState = [...workflowStates]
      .sort((a, b) => a.order - b.order)
      .find((s) => s.category === args.category);

    if (!targetState) {
      throw new Error(
        `No workflow state found for category ${args.category}${ctx.project ? ` in project ${ctx.project.name}` : ""}`,
      );
    }

    const oldStatus = ctx.issue.status;
    const now = Date.now();

    await ctx.db.patch(ctx.issue._id, {
      status: targetState.id,
      order: args.newOrder,
      updatedAt: now,
    });

    if (oldStatus !== targetState.id) {
      await ctx.db.insert("issueActivity", {
        issueId: ctx.issue._id,
        userId: ctx.userId,
        action: "updated",
        field: "status",
        oldValue: oldStatus,
        newValue: targetState.id,
        createdAt: now,
      });
    }
  },
});

export const update = issueMutation({
  args: {
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
    const now = Date.now();
    const changes: Array<{
      field: string;
      oldValue: string | number | null | undefined;
      newValue: string | number | null | undefined;
    }> = [];

    const updates = processIssueUpdates(ctx.issue, args, changes);

    if (
      args.assigneeId !== undefined &&
      args.assigneeId !== ctx.issue.assigneeId &&
      args.assigneeId &&
      args.assigneeId !== ctx.userId
    ) {
      // Dynamic import to avoid cycles
      const { sendEmailNotification } = await import("../email/helpers");
      await sendEmailNotification(ctx, {
        userId: args.assigneeId,
        type: "assigned",
        issueId: ctx.issue._id,
        actorId: ctx.userId,
      });
    }

    if (Object.keys(updates).length > 1) {
      await ctx.db.patch(ctx.issue._id, updates);

      for (const change of changes) {
        await ctx.db.insert("issueActivity", {
          issueId: ctx.issue._id,
          userId: ctx.userId,
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

export const addComment = issueViewerMutation({
  args: {
    content: v.string(),
    mentions: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const mentions = args.mentions || [];

    const commentId = await ctx.db.insert("issueComments", {
      issueId: ctx.issue._id,
      authorId: ctx.userId,
      content: args.content,
      mentions,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("issueActivity", {
      issueId: ctx.issue._id,
      userId: ctx.userId,
      action: "commented",
      createdAt: now,
    });

    const author = await ctx.db.get(ctx.userId);
    // Dynamic import to avoid cycles
    const { sendEmailNotification } = await import("../email/helpers");

    for (const mentionedUserId of mentions) {
      if (mentionedUserId !== ctx.userId) {
        await ctx.db.insert("notifications", {
          userId: mentionedUserId,
          type: "issue_mentioned",
          title: "You were mentioned",
          message: `${author?.name || "Someone"} mentioned you in ${ctx.issue.key}`,
          issueId: ctx.issue._id,
          projectId: ctx.projectId,
          isRead: false,
          createdAt: now,
        });

        await sendEmailNotification(ctx, {
          userId: mentionedUserId,
          type: "mention",
          issueId: ctx.issue._id,
          actorId: ctx.userId,
          commentText: args.content,
        });
      }
    }

    if (ctx.issue.reporterId !== ctx.userId) {
      await ctx.db.insert("notifications", {
        userId: ctx.issue.reporterId,
        type: "issue_comment",
        title: "New comment",
        message: `${author?.name || "Someone"} commented on ${ctx.issue.key}`,
        issueId: ctx.issue._id,
        projectId: ctx.projectId,
        isRead: false,
        createdAt: now,
      });

      await sendEmailNotification(ctx, {
        userId: ctx.issue.reporterId,
        type: "comment",
        issueId: ctx.issue._id,
        actorId: ctx.userId,
        commentText: args.content,
      });
    }

    return commentId;
  },
});

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

    const issues = await Promise.all(args.issueIds.map((id) => ctx.db.get(id)));

    const now = Date.now();
    const results = [];

    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      const issueId = args.issueIds[i];
      if (!issue) continue;

      try {
        await assertCanEditProject(ctx, issue.projectId as Id<"projects">, userId);
      } catch {
        continue;
      }

      const oldStatus = issue.status;

      await ctx.db.patch(issueId, {
        status: args.newStatus,
        updatedAt: now,
      });

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

    const issues = await Promise.all(args.issueIds.map((id) => ctx.db.get(id)));

    const now = Date.now();
    const results = [];

    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      const issueId = args.issueIds[i];
      if (!issue) continue;

      try {
        await assertCanEditProject(ctx, issue.projectId as Id<"projects">, userId);
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

export const bulkAssign = authenticatedMutation({
  args: {
    issueIds: v.array(v.id("issues")),
    assigneeId: v.union(v.id("users"), v.null()),
  },
  handler: async (ctx, args) => {
    const issues = await Promise.all(args.issueIds.map((id) => ctx.db.get(id)));

    const now = Date.now();
    const results = [];

    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      const issueId = args.issueIds[i];
      if (!issue) continue;

      try {
        await assertCanEditProject(ctx, issue.projectId as Id<"projects">, ctx.userId);
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
        userId: ctx.userId,
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

export const bulkAddLabels = authenticatedMutation({
  args: {
    issueIds: v.array(v.id("issues")),
    labels: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const issues = await Promise.all(args.issueIds.map((id) => ctx.db.get(id)));

    const now = Date.now();
    const results = [];

    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      const issueId = args.issueIds[i];
      if (!issue) continue;

      try {
        await assertCanEditProject(ctx, issue.projectId as Id<"projects">, ctx.userId);
      } catch {
        continue;
      }

      const updatedLabels = Array.from(new Set([...issue.labels, ...args.labels]));

      await ctx.db.patch(issueId, {
        labels: updatedLabels,
        updatedAt: now,
      });

      await ctx.db.insert("issueActivity", {
        issueId: issueId,
        userId: ctx.userId,
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

export const bulkMoveToSprint = authenticatedMutation({
  args: {
    issueIds: v.array(v.id("issues")),
    sprintId: v.union(v.id("sprints"), v.null()),
  },
  handler: async (ctx, args) => {
    const issues = await Promise.all(args.issueIds.map((id) => ctx.db.get(id)));

    const now = Date.now();
    const results = [];

    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      const issueId = args.issueIds[i];
      if (!issue) continue;

      try {
        await assertCanEditProject(ctx, issue.projectId as Id<"projects">, ctx.userId);
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
        userId: ctx.userId,
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

export const bulkDelete = authenticatedMutation({
  args: {
    issueIds: v.array(v.id("issues")),
  },
  handler: async (ctx, args) => {
    const issues = await Promise.all(args.issueIds.map((id) => ctx.db.get(id)));

    const results = [];

    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      const issueId = args.issueIds[i];
      if (!issue) continue;

      try {
        await assertIsProjectAdmin(ctx, issue.projectId as Id<"projects">, ctx.userId);
      } catch {
        continue;
      }

      await cascadeDelete(ctx, "issues", issueId);
      await ctx.db.delete(issueId);
      results.push(issueId);
    }

    return { deleted: results.length };
  },
});
