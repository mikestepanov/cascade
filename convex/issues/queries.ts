import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { internalQuery, type QueryCtx, query } from "../_generated/server";
import { authenticatedQuery, projectQuery } from "../customFunctions";
import { batchFetchUsers } from "../lib/batchHelpers";
import { BOUNDED_LIST_LIMIT, BOUNDED_SEARCH_LIMIT, safeCollect } from "../lib/boundedQueries";
import { forbidden, notFound } from "../lib/errors";
import {
  type EnrichedIssue,
  enrichIssue,
  enrichIssues,
  fetchPaginatedIssues,
} from "../lib/issueHelpers";
import { notDeleted } from "../lib/softDeleteHelpers";
import { sanitizeUserForAuth } from "../lib/userUtils";
import { canAccessProject } from "../projectAccess";
import { matchesSearchFilters, ROOT_ISSUE_TYPES } from "./helpers";

const ISSUE_COUNT_LIMIT = 2000;

/**
 * Internal query for API usage that accepts explicit userId
 * Bypasses getAuthUserId() which returns null in HTTP actions
 */
export const listIssuesInternal = internalQuery({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // 1. Verify access for the specific user
    const hasAccess = await canAccessProject(ctx, args.projectId, args.userId);
    if (!hasAccess) {
      throw forbidden();
    }

    // 2. Fetch issues
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter(notDeleted)
      .order("desc")
      .take(100); // Limit for API

    // 3. enrich issues
    return await enrichIssues(ctx, issues);
  },
});

/**
 * List all issues assigned to or reported by the current user
 * Used by onboarding checklist to track user progress
 * Returns paginated results to handle users with many issues
 */
/**
 * Get count of issues assigned to current user (for onboarding)
 * More efficient than loading all issues
 */
export const getUserIssueCount = authenticatedQuery({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", ctx.userId))
      .filter(notDeleted)
      .take(1); // Just need to know if there's at least one

    return issues.length;
  },
});

export const listByUser = authenticatedQuery({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // Paginate assigned issues
    const assignedResult = await ctx.db
      .query("issues")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", ctx.userId))
      .filter(notDeleted)
      .paginate(args.paginationOpts);

    const mappedIssues = assignedResult.page.map((issue) => ({
      _id: issue._id,
      key: issue.key,
      title: issue.title,
      status: issue.status,
      type: issue.type,
      priority: issue.priority,
      projectId: issue.projectId as Id<"projects">,
    }));

    return {
      page: mappedIssues,
      isDone: assignedResult.isDone,
      continueCursor: assignedResult.continueCursor,
    };
  },
});

/**
 * List epics for a project (for dropdowns/filters)
 * Optimized to only return epics, avoiding loading all issues
 */
export const listEpics = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const hasAccess = await canAccessProject(ctx, args.projectId, ctx.userId);
    if (!hasAccess) {
      return [];
    }

    const epics = await safeCollect(
      ctx.db
        .query("issues")
        .withIndex("by_project_type", (q) => q.eq("projectId", args.projectId).eq("type", "epic"))
        .filter(notDeleted),
      200, // Reasonable limit for epics
      "project epics",
    );

    return epics.map((e) => ({
      _id: e._id,
      key: e.key,
      title: e.title,
    }));
  },
});

export const listRoadmapIssues = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
    // Backend filters to avoid client-side filtering
    epicId: v.optional(v.id("issues")), // Filter by epic
    excludeEpics: v.optional(v.boolean()), // Exclude epic type issues
    hasDueDate: v.optional(v.boolean()), // Only issues with due dates
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return [];
    }

    const hasAccess = await canAccessProject(ctx, args.projectId, ctx.userId);
    if (!hasAccess) {
      return [];
    }

    let issues: Doc<"issues">[] = [];
    if (args.sprintId) {
      // Bounded: sprint issues are typically limited (<500 per sprint)
      const allSprintIssues = await safeCollect(
        ctx.db
          .query("issues")
          .withIndex("by_project_sprint_status", (q) =>
            q.eq("projectId", args.projectId).eq("sprintId", args.sprintId),
          )
          .filter(notDeleted),
        BOUNDED_LIST_LIMIT,
        "roadmap sprint issues",
      );

      issues = allSprintIssues.filter((i) =>
        (ROOT_ISSUE_TYPES as readonly string[]).includes(i.type),
      );
    } else {
      // Bounded: fetch by type with limits
      const outcomes = await Promise.all(
        ROOT_ISSUE_TYPES.map((type) =>
          safeCollect(
            ctx.db
              .query("issues")
              .withIndex("by_project_type", (q) =>
                q.eq("projectId", args.projectId).eq("type", type as Doc<"issues">["type"]),
              )
              .filter(notDeleted),
            BOUNDED_LIST_LIMIT,
            `roadmap issues type=${type}`,
          ),
        ),
      );
      issues = outcomes.flat();
    }

    // Apply backend filters
    if (args.excludeEpics) {
      issues = issues.filter((i) => i.type !== "epic");
    }
    if (args.epicId) {
      issues = issues.filter((i) => i.epicId === args.epicId);
    }
    if (args.hasDueDate) {
      issues = issues.filter((i) => i.dueDate !== undefined);
    }

    return await enrichIssues(ctx, issues);
  },
});

export const listRoadmapIssuesPaginated = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    const hasAccess = await canAccessProject(ctx, args.projectId, ctx.userId);
    if (!hasAccess) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    if (args.sprintId) {
      const result = await ctx.db
        .query("issues")
        .withIndex("by_project_sprint_status", (q) =>
          q.eq("projectId", args.projectId).eq("sprintId", args.sprintId),
        )
        .filter(notDeleted)
        .paginate(args.paginationOpts);

      const rootIssues = result.page.filter((i: Doc<"issues">) =>
        (ROOT_ISSUE_TYPES as readonly string[]).includes(i.type),
      );

      return {
        ...result,
        page: await enrichIssues(ctx, rootIssues),
      };
    }

    const result = await ctx.db
      .query("issues")
      .withIndex("by_project_type", (q) =>
        q.eq("projectId", args.projectId).eq("type", ROOT_ISSUE_TYPES[0]),
      )
      .filter(notDeleted)
      .paginate(args.paginationOpts);

    return {
      ...result,
      page: await enrichIssues(ctx, result.page),
    };
  },
});

export const listSelectableIssues = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    // Check if user has access to the project
    const hasAccess = await canAccessProject(ctx, args.projectId, ctx.userId);
    if (!hasAccess) {
      return [];
    }

    const issues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(500);

    return issues
      .filter((i: Doc<"issues">) => !i.parentId && i.type !== "subtask")
      .map((i) => ({
        _id: i._id,
        key: i.key,
        title: i.title,
      }));
  },
});

export const listProjectIssues = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
    status: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const hasAccess = await canAccessProject(ctx, args.projectId, ctx.userId);
    if (!hasAccess) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    return await fetchPaginatedIssues(ctx, {
      paginationOpts: args.paginationOpts,
      query: (db) => {
        if (args.sprintId) {
          return db
            .query("issues")
            .withIndex("by_project_sprint_status", (q) =>
              q.eq("projectId", args.projectId).eq("sprintId", args.sprintId),
            )
            .order("desc");
        }
        if (args.status) {
          return db
            .query("issues")
            .withIndex("by_project_status", (q) =>
              q.eq("projectId", args.projectId).eq("status", args.status as string),
            )
            .order("desc");
        }
        return db
          .query("issues")
          .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
          .order("desc");
      },
    });
  },
});

export const listTeamIssues = authenticatedQuery({
  args: {
    teamId: v.id("teams"),
    status: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const teamMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q) => q.eq("teamId", args.teamId).eq("userId", ctx.userId))
      .filter(notDeleted)
      .first();

    if (!teamMember) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    return await fetchPaginatedIssues(ctx, {
      paginationOpts: args.paginationOpts,
      query: (db) => {
        if (args.status) {
          return db
            .query("issues")
            .withIndex("by_team_status", (q) =>
              q.eq("teamId", args.teamId).eq("status", args.status as string),
            )
            .order("desc");
        }
        return db
          .query("issues")
          .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
          .order("desc");
      },
    });
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

    const project = await ctx.db.get(issue.projectId as Id<"projects">);
    if (!project) {
      return null;
    }

    if (userId) {
      const hasAccess = await canAccessProject(ctx, issue.projectId as Id<"projects">, userId);
      if (!hasAccess) {
        throw forbidden();
      }
    } else {
      if (!project.isPublic) {
        throw forbidden();
      }
    }

    const [comments, activities, enriched]: [
      Doc<"issueComments">[],
      Doc<"issueActivity">[],
      EnrichedIssue,
    ] = await Promise.all([
      ctx.db
        .query("issueComments")
        .withIndex("by_issue", (q) => q.eq("issueId", args.id))
        .order("asc")
        .take(200),
      ctx.db
        .query("issueActivity")
        .withIndex("by_issue", (q) => q.eq("issueId", args.id))
        .order("desc")
        .take(20),
      enrichIssue(ctx, issue),
    ]);

    const commentAuthorIds = comments.map((c) => c.authorId);
    const activityUserIds = activities.map((a) => a.userId);
    const allUserIds = [...commentAuthorIds, ...activityUserIds];
    const userMap = await batchFetchUsers(ctx, allUserIds);

    const commentsWithAuthors = comments.map((comment) => {
      const author = userMap.get(comment.authorId);
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
    });

    const activity = activities.map((act) => {
      const user = userMap.get(act.userId);
      return {
        ...act,
        user: sanitizeUserForAuth(user),
      };
    });

    return {
      ...enriched,
      project,
      comments: commentsWithAuthors,
      activity,
    };
  },
});

export const listComments = query({
  args: {
    issueId: v.id("issues"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const issue = await ctx.db.get(args.issueId);

    if (!issue) {
      throw notFound("issue", args.issueId);
    }

    const project = await ctx.db.get(issue.projectId as Id<"projects">);
    if (!project) {
      throw notFound("project");
    }

    if (userId) {
      const hasAccess = await canAccessProject(ctx, issue.projectId as Id<"projects">, userId);
      if (!hasAccess) {
        throw forbidden();
      }
    } else {
      if (!project.isPublic) {
        throw forbidden();
      }
    }

    const results = await ctx.db
      .query("issueComments")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .order("asc")
      .paginate(args.paginationOpts);

    const authorIds = results.page.map((c) => c.authorId);
    const userMap = await batchFetchUsers(ctx, authorIds);

    const enrichedPage = results.page.map((comment) => {
      const author = userMap.get(comment.authorId);
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
    });

    return {
      ...results,
      page: enrichedPage,
    };
  },
});

export const getByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    const issue = await ctx.db
      .query("issues")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .filter(notDeleted)
      .first();

    if (!issue) {
      return null;
    }

    // Check if user has access to the project
    if (userId) {
      const hasAccess = await canAccessProject(ctx, issue.projectId, userId);
      if (!hasAccess) {
        return null;
      }
    } else {
      // Unauthenticated users can only see issues in public projects
      const project = await ctx.db.get(issue.projectId);
      if (!project?.isPublic) {
        return null;
      }
    }

    return await enrichIssue(ctx, issue);
  },
});

export const listSubtasks = authenticatedQuery({
  args: { parentId: v.id("issues") },
  handler: async (ctx, args) => {
    const parentIssue = await ctx.db.get(args.parentId);
    if (!parentIssue) {
      return [];
    }

    const project = await ctx.db.get(parentIssue.projectId as Id<"projects">);
    if (!project) {
      return [];
    }

    // Bounded: subtasks per issue are typically limited (<100)
    const subtasks = await safeCollect(
      ctx.db
        .query("issues")
        .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
        .filter(notDeleted),
      100, // Issues rarely have >100 subtasks
      "subtasks",
    );

    if (subtasks.length === 0) {
      return [];
    }

    const userIds = [
      ...subtasks.map((s) => s.assigneeId).filter(Boolean),
      ...subtasks.map((s) => s.reporterId),
    ] as Id<"users">[];
    const userMap = await batchFetchUsers(ctx, userIds);

    const enrichedSubtasks = subtasks.map((subtask) => {
      const assignee = subtask.assigneeId ? userMap.get(subtask.assigneeId) : null;
      const reporter = userMap.get(subtask.reporterId);

      return {
        ...subtask,
        assignee: sanitizeUserForAuth(assignee),
        reporter: sanitizeUserForAuth(reporter),
      };
    });

    return enrichedSubtasks;
  },
});

export const search = authenticatedQuery({
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
    // Exclude a specific issue from results (useful for dependencies)
    excludeIssueId: v.optional(v.id("issues")),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const offset = args.offset ?? 0;

    // Calculate fetch limit: need enough to filter and still get requested results
    // Fetch 3x the needed amount to account for filtering, capped at search limit
    const fetchLimit = Math.min((offset + limit) * 3, BOUNDED_SEARCH_LIMIT);

    let issues: Doc<"issues">[] = [];

    // If query is provided, use search index
    if (args.query) {
      // Bounded: search results limited to prevent huge result sets
      issues = await safeCollect(
        ctx.db
          .query("issues")
          .withSearchIndex("search_title", (q) => q.search("searchContent", args.query as string))
          .filter(notDeleted),
        fetchLimit,
        "issue search",
      );
    } else if (args.projectId) {
      const projectId = args.projectId;
      // Bounded: project issues limited
      issues = await safeCollect(
        ctx.db
          .query("issues")
          .withIndex("by_project", (q) => q.eq("projectId", projectId))
          .filter(notDeleted)
          .order("desc"),
        fetchLimit,
        "issue search by project",
      );
    } else {
      // Return empty if no filter is provided to prevent scanning the entire table
      return { page: [], total: 0 };
    }

    // Apply advanced filters in memory
    let filteredIssues = issues.filter((issue: Doc<"issues">) =>
      matchesSearchFilters(issue, args, ctx.userId),
    );

    // Exclude specific issue if requested (for dependencies)
    if (args.excludeIssueId) {
      filteredIssues = filteredIssues.filter((i) => i._id !== args.excludeIssueId);
    }

    // Return paginated slice
    // Note: total may be approximate if results were truncated
    return {
      page: filteredIssues.slice(offset, offset + limit),
      total: filteredIssues.length,
    };
  },
});

// Import the rest of the smart loading queries
import { DEFAULT_PAGE_SIZE, getDoneColumnThreshold } from "../lib/pagination";

export const listByProjectSmart = projectQuery({
  args: {
    sprintId: v.optional(v.id("sprints")),
    doneColumnDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // ctx.userId provided by projectQuery wrapper
    const doneThreshold = getDoneColumnThreshold(Date.now(), args.doneColumnDays);

    const workflowStates = ctx.project.workflowStates;
    const issuesByColumn: Record<string, Doc<"issues">[]> = {};

    await Promise.all(
      workflowStates.map(async (state: { id: string; category: string }) => {
        const q = (() => {
          if (args.sprintId) {
            if (state.category === "done") {
              return ctx.db
                .query("issues")
                .withIndex("by_project_sprint_status_updated", (q) =>
                  q
                    .eq("projectId", ctx.project._id)
                    .eq("sprintId", args.sprintId as Id<"sprints">)
                    .eq("status", state.id)
                    .gte("updatedAt", doneThreshold),
                )
                .filter(notDeleted);
            }

            return ctx.db
              .query("issues")
              .withIndex("by_project_sprint_status", (q) =>
                q
                  .eq("projectId", ctx.project._id)
                  .eq("sprintId", args.sprintId as Id<"sprints">)
                  .eq("status", state.id),
              )
              .filter(notDeleted);
          }

          if (state.category === "done") {
            return ctx.db
              .query("issues")
              .withIndex("by_project_status_updated", (q) =>
                q
                  .eq("projectId", ctx.project._id)
                  .eq("status", state.id)
                  .gte("updatedAt", doneThreshold),
              )
              .filter(notDeleted);
          }

          return ctx.db
            .query("issues")
            .withIndex("by_project_status", (q) =>
              q.eq("projectId", ctx.project._id).eq("status", state.id),
            )
            .filter(notDeleted);
        })();

        issuesByColumn[state.id] = await q.take(DEFAULT_PAGE_SIZE);
      }),
    );

    // Optimize: Batch enrichment for all issues at once
    const allIssues: Doc<"issues">[] = [];
    const meta: { statusId: string; count: number }[] = [];

    for (const state of workflowStates) {
      const issues = issuesByColumn[state.id] || [];
      allIssues.push(...issues);
      meta.push({ statusId: state.id, count: issues.length });
    }

    const enrichedAll = await enrichIssues(ctx, allIssues);

    const enrichedIssuesByStatus: Record<string, EnrichedIssue[]> = {};
    let offset = 0;
    for (const { statusId, count } of meta) {
      enrichedIssuesByStatus[statusId] = enrichedAll.slice(offset, offset + count);
      offset += count;
    }

    return {
      issuesByStatus: enrichedIssuesByStatus,
      workflowStates: workflowStates,
    };
  },
});

export const listByTeamSmart = authenticatedQuery({
  args: {
    teamId: v.id("teams"),
    doneColumnDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const teamMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q) => q.eq("teamId", args.teamId).eq("userId", ctx.userId))
      .filter(notDeleted)
      .first();

    if (!teamMember) return [];

    const team = await ctx.db.get(args.teamId);
    if (!team) return [];

    const workspace = await ctx.db.get(team.workspaceId);
    // Workspace may have custom workflow states, fallback to defaults
    const workflowStates: { id: string; name: string; category: string; order: number }[] = (
      workspace as {
        defaultWorkflowStates?: { id: string; name: string; category: string; order: number }[];
      }
    )?.defaultWorkflowStates || [
      { id: "todo", name: "To Do", category: "todo", order: 0 },
      { id: "inprogress", name: "In Progress", category: "inprogress", order: 1 },
      { id: "done", name: "Done", category: "done", order: 2 },
    ];

    const doneThreshold = getDoneColumnThreshold(Date.now(), args.doneColumnDays);
    const issuesByColumn: Record<string, Doc<"issues">[]> = {};

    await Promise.all(
      workflowStates.map(async (state: { id: string; category: string }) => {
        const q = (() => {
          if (state.category === "done") {
            return ctx.db
              .query("issues")
              .withIndex("by_team_status_updated", (q) =>
                q.eq("teamId", args.teamId).eq("status", state.id).gte("updatedAt", doneThreshold),
              )
              .filter(notDeleted);
          }

          return ctx.db
            .query("issues")
            .withIndex("by_team_status", (q) => q.eq("teamId", args.teamId).eq("status", state.id))
            .filter(notDeleted);
        })();

        issuesByColumn[state.id] = await q.take(DEFAULT_PAGE_SIZE);
      }),
    );

    // Enrich all issues by status
    const enrichedIssuesByStatus: Record<string, EnrichedIssue[]> = {};
    for (const [statusId, issues] of Object.entries(issuesByColumn)) {
      enrichedIssuesByStatus[statusId] = await enrichIssues(ctx, issues);
    }

    return {
      issuesByStatus: enrichedIssuesByStatus,
      workflowStates: workflowStates,
    };
  },
});

export const getTeamIssueCounts = authenticatedQuery({
  args: {
    teamId: v.id("teams"),
    doneColumnDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) return null;

    const workflowStates = [
      { id: "todo", name: "To Do", category: "todo", order: 0 },
      { id: "inprogress", name: "In Progress", category: "inprogress", order: 1 },
      { id: "done", name: "Done", category: "done", order: 2 },
    ];

    const doneThreshold = getDoneColumnThreshold(Date.now(), args.doneColumnDays);
    const counts: Record<string, { total: number; visible: number; hidden: number }> = {};

    await Promise.all(
      workflowStates.map(async (state: { id: string; category: string }) => {
        let visibleCount = 0;
        let totalCount = 0;

        if (state.category === "done") {
          // Optimization: fetch visible items efficiently using index
          const visibleIssues = await ctx.db
            .query("issues")
            .withIndex("by_team_status_updated", (q) =>
              q.eq("teamId", args.teamId).eq("status", state.id).gte("updatedAt", doneThreshold),
            )
            .filter(notDeleted)
            .take(DEFAULT_PAGE_SIZE + 1);

          visibleCount = Math.min(visibleIssues.length, DEFAULT_PAGE_SIZE);

          // Fetch total count capped at limit
          const totalIssues = await ctx.db
            .query("issues")
            .withIndex("by_team_status", (q) => q.eq("teamId", args.teamId).eq("status", state.id))
            .filter(notDeleted)
            .take(ISSUE_COUNT_LIMIT);

          totalCount = totalIssues.length;
        } else {
          // Non-done columns: safe to limit by creation time
          const allIssues = await ctx.db
            .query("issues")
            .withIndex("by_team_status", (q) => q.eq("teamId", args.teamId).eq("status", state.id))
            .order("desc")
            .filter(notDeleted)
            .take(ISSUE_COUNT_LIMIT);

          totalCount = allIssues.length;
          visibleCount = Math.min(totalCount, DEFAULT_PAGE_SIZE);
        }

        counts[state.id] = {
          total: totalCount,
          visible: visibleCount,
          hidden: Math.max(0, totalCount - DEFAULT_PAGE_SIZE),
        };
      }),
    );

    return counts;
  },
});

export const getIssueCounts = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
    doneColumnDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    const hasAccess = await canAccessProject(ctx, args.projectId, ctx.userId);
    if (!hasAccess) return null;

    const doneThreshold = getDoneColumnThreshold(Date.now(), args.doneColumnDays);
    const counts: Record<string, { total: number; visible: number; hidden: number }> = {};

    const addCounts = (
      statusId: string,
      countsObj: { total: number; visible: number; hidden: number },
    ) => {
      counts[statusId] = countsObj;
    };

    if (args.sprintId) {
      await getSprintIssueCounts(
        ctx,
        args.projectId,
        args.sprintId,
        project.workflowStates,
        doneThreshold,
        addCounts,
      );
    } else {
      await Promise.all(
        project.workflowStates.map(async (state: { id: string; category: string }) => {
          let visibleCount = 0;
          let totalCount = 0;

          if (state.category === "done") {
            // Optimization: fetch visible items efficiently using index
            const visibleIssues = await ctx.db
              .query("issues")
              .withIndex("by_project_status_updated", (q) =>
                q
                  .eq("projectId", args.projectId)
                  .eq("status", state.id)
                  .gte("updatedAt", doneThreshold),
              )
              .filter(notDeleted)
              .take(DEFAULT_PAGE_SIZE + 1);

            visibleCount = Math.min(visibleIssues.length, DEFAULT_PAGE_SIZE);

            // Fetch total count capped at limit
            const totalIssues = await ctx.db
              .query("issues")
              .withIndex("by_project_status", (q) =>
                q.eq("projectId", args.projectId).eq("status", state.id),
              )
              .order("desc")
              .filter(notDeleted)
              .take(ISSUE_COUNT_LIMIT);

            totalCount = totalIssues.length;
          } else {
            const allIssues = await ctx.db
              .query("issues")
              .withIndex("by_project_status", (q) =>
                q.eq("projectId", args.projectId).eq("status", state.id),
              )
              .order("desc")
              .filter(notDeleted)
              .take(ISSUE_COUNT_LIMIT);

            totalCount = allIssues.length;
            visibleCount = Math.min(totalCount, DEFAULT_PAGE_SIZE);
          }

          addCounts(state.id, {
            total: totalCount,
            visible: visibleCount,
            hidden: Math.max(0, totalCount - DEFAULT_PAGE_SIZE),
          });
        }),
      );
    }

    return counts;
  },
});

export const loadMoreDoneIssues = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
    beforeTimestamp: v.optional(v.number()),
    beforeId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return [];

    const doneStates = project.workflowStates.filter((s) => s.category === "done").map((s) => s.id);

    const outcomes = await Promise.all(
      doneStates.map(async (status) => {
        let q = ctx.db
          .query("issues")
          .withIndex("by_project_status_updated", (q) =>
            q.eq("projectId", args.projectId).eq("status", status),
          )
          .filter(notDeleted);

        if (args.sprintId) {
          q = q.filter((q) => q.eq(q.field("sprintId"), args.sprintId));
        }

        if (args.beforeTimestamp) {
          q = q.filter((q) => q.lt(q.field("updatedAt"), args.beforeTimestamp as number));
        }

        return await q.take(args.limit ?? DEFAULT_PAGE_SIZE);
      }),
    );

    const allIssues = outcomes.flat();
    return await enrichIssues(ctx, allIssues);
  },
});

async function getSprintIssueCounts(
  ctx: QueryCtx,
  projectId: Id<"projects">,
  sprintId: Id<"sprints">,
  workflowStates: { id: string; category: string }[],
  doneThreshold: number,
  addCounts: (statusId: string, counts: { total: number; visible: number; hidden: number }) => void,
) {
  await Promise.all(
    workflowStates.map(async (state: { id: string; category: string }) => {
      let visibleCount = 0;
      let totalCount = 0;

      if (state.category === "done") {
        // Optimization: fetch visible items efficiently using index
        const visibleIssues = await ctx.db
          .query("issues")
          .withIndex("by_project_sprint_status_updated", (q) =>
            q
              .eq("projectId", projectId)
              .eq("sprintId", sprintId)
              .eq("status", state.id)
              .gte("updatedAt", doneThreshold),
          )
          .filter(notDeleted)
          .take(DEFAULT_PAGE_SIZE + 1);

        visibleCount = Math.min(visibleIssues.length, DEFAULT_PAGE_SIZE);

        // Fetch total count capped at limit
        const totalIssues = await ctx.db
          .query("issues")
          .withIndex("by_project_sprint_status", (q) =>
            q.eq("projectId", projectId).eq("sprintId", sprintId).eq("status", state.id),
          )
          .filter(notDeleted)
          .take(ISSUE_COUNT_LIMIT);

        totalCount = totalIssues.length;
      } else {
        // Non-done columns: safe to limit by creation time
        const allIssues = await ctx.db
          .query("issues")
          .withIndex("by_project_sprint_status", (q) =>
            q.eq("projectId", projectId).eq("sprintId", sprintId).eq("status", state.id),
          )
          .order("desc")
          .filter(notDeleted)
          .take(ISSUE_COUNT_LIMIT);

        totalCount = allIssues.length;
        visibleCount = Math.min(totalCount, DEFAULT_PAGE_SIZE);
      }

      addCounts(state.id, {
        total: totalCount,
        visible: visibleCount,
        hidden: Math.max(0, totalCount - DEFAULT_PAGE_SIZE),
      });
    }),
  );
}

export const listIssuesByDateRange = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
    from: v.number(),
    to: v.number(),
  },
  handler: async (ctx, args) => {
    const hasAccess = await canAccessProject(ctx, args.projectId, ctx.userId);
    if (!hasAccess) {
      return [];
    }

    // Bounded: calendar date range queries limited to prevent large result sets
    const issues = await safeCollect(
      ctx.db
        .query("issues")
        .withIndex("by_project_due_date", (q) =>
          q.eq("projectId", args.projectId).gte("dueDate", args.from).lte("dueDate", args.to),
        )
        .filter(notDeleted),
      BOUNDED_LIST_LIMIT,
      "issues by date range",
    );

    // If sprintId is provided, filter in memory
    const filteredIssues = args.sprintId
      ? issues.filter((i) => i.sprintId === args.sprintId)
      : issues;

    // Optimization: Return raw issues instead of enriching them.
    // CalendarView only uses basic fields (title, status, priority) and does not display
    // assignee, reporter, or labels, so we skip the expensive enrichment (N+1 lookups).
    return filteredIssues;
  },
});
