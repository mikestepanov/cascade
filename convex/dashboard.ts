import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import {
  batchFetchIssues,
  batchFetchUsers,
  batchFetchWorkspaces,
  getUserName,
} from "./lib/batchHelpers";
import { DEFAULT_SEARCH_PAGE_SIZE, MAX_ACTIVITY_ITEMS } from "./lib/queryLimits";

// Get all issues assigned to the current user across all projects
export const getMyIssues = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const issues = await ctx.db
      .query("issues")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", userId))
      .collect();

    // Batch fetch all related data to avoid N+1 queries
    const projectIds = [
      ...new Set(
        issues
          .map((i) => i.projectId)
          .filter((id): id is Id<"projects"> => id !== undefined && id !== null),
      ),
    ];
    const userIds = [
      ...new Set(issues.flatMap((i) => [i.reporterId, i.assigneeId]).filter(Boolean)),
    ] as Id<"users">[];

    const [projects, users] = await Promise.all([
      Promise.all(projectIds.map((id) => ctx.db.get(id))),
      Promise.all(userIds.map((id) => ctx.db.get(id))),
    ]);

    const projectMap = new Map(
      projects.filter((p): p is NonNullable<typeof p> => p !== null).map((p) => [p._id, p]),
    );
    const userMap = new Map(
      users.filter((u): u is NonNullable<typeof u> => u !== null).map((u) => [u._id, u]),
    );

    // Enrich with pre-fetched data
    const enrichedIssues = issues.map((issue) => {
      const project = issue.projectId ? projectMap.get(issue.projectId) : null;
      const reporter = issue.reporterId ? userMap.get(issue.reporterId) : null;
      const assignee = issue.assigneeId ? userMap.get(issue.assigneeId) : null;

      return {
        ...issue,
        projectName: project?.name || "Unknown",
        projectKey: project?.key || "???",
        reporterName: reporter?.name || reporter?.email || "Unknown",
        assigneeName: assignee?.name || assignee?.email || "Unassigned",
      };
    });

    return enrichedIssues.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

// Get issues created by the current user
export const getMyCreatedIssues = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const issues = await ctx.db
      .query("issues")
      .withIndex("by_reporter", (q) => q.eq("reporterId", userId))
      .collect();

    // Batch fetch all related data to avoid N+1 queries
    const projectIds = [
      ...new Set(
        issues
          .map((i) => i.projectId)
          .filter((id): id is Id<"projects"> => id !== undefined && id !== null),
      ),
    ];
    const assigneeIds = [
      ...new Set(issues.map((i) => i.assigneeId).filter(Boolean)),
    ] as Id<"users">[];

    const [projects, assignees] = await Promise.all([
      Promise.all(projectIds.map((id) => ctx.db.get(id))),
      Promise.all(assigneeIds.map((id) => ctx.db.get(id))),
    ]);

    const projectMap = new Map(
      projects.filter((p): p is NonNullable<typeof p> => p !== null).map((p) => [p._id, p]),
    );
    const assigneeMap = new Map(
      assignees.filter((u): u is NonNullable<typeof u> => u !== null).map((u) => [u._id, u]),
    );

    // Enrich with pre-fetched data
    const enrichedIssues = issues.map((issue) => {
      const project = issue.projectId ? projectMap.get(issue.projectId) : null;
      const assignee = issue.assigneeId ? assigneeMap.get(issue.assigneeId) : null;

      return {
        ...issue,
        projectName: project?.name || "Unknown",
        projectKey: project?.key || "???",
        assigneeName: assignee?.name || assignee?.email || "Unassigned",
      };
    });

    return enrichedIssues.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get projects the user is a member of
export const getMyProjects = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get projects where user is a member
    const memberships = await ctx.db
      .query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (memberships.length === 0) return [];

    // Batch fetch all projects
    const projectIds = memberships.map((m) => m.projectId);
    const projectMap = await batchFetchWorkspaces(ctx, projectIds);

    // Fetch issues per project using index (NOT loading all issues!)
    const issuesByWorkspace = await Promise.all(
      projectIds.map((projectId) =>
        ctx.db
          .query("issues")
          .withIndex("by_workspace", (q) => q.eq("projectId", projectId))
          .collect(),
      ),
    );

    // Build counts per project
    const totalIssuesByWorkspace = new Map<string, number>();
    const myIssuesByWorkspace = new Map<string, number>();

    projectIds.forEach((projectId, index) => {
      const issues = issuesByWorkspace[index];
      const wsId = projectId.toString();
      totalIssuesByWorkspace.set(wsId, issues.length);
      myIssuesByWorkspace.set(wsId, issues.filter((i) => i.assigneeId === userId).length);
    });

    // Enrich memberships with project data and counts
    const projects = memberships
      .map((membership) => {
        const project = projectMap.get(membership.projectId);
        if (!project) return null;

        const wsId = membership.projectId.toString();
        return {
          ...project,
          _id: membership.projectId,
          role: membership.role,
          totalIssues: totalIssuesByWorkspace.get(wsId) ?? 0,
          myIssues: myIssuesByWorkspace.get(wsId) ?? 0,
        };
      })
      .filter((p) => p !== null);

    return projects;
  },
});

// Get recent activity across all projects the user has access to
export const getMyRecentActivity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const limit = args.limit || DEFAULT_SEARCH_PAGE_SIZE;

    // Get projects where user is a member
    const memberships = await ctx.db
      .query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const projectIdSet = new Set(memberships.map((m) => m.projectId.toString()));

    // Get recent activity
    const allActivity = await ctx.db.query("issueActivity").order("desc").take(MAX_ACTIVITY_ITEMS);

    // Batch fetch all issues referenced by activity
    const issueIds = allActivity.map((a) => a.issueId);
    const issueMap = await batchFetchIssues(ctx, issueIds);

    // Filter to only activities for accessible issues
    const accessibleActivity = allActivity.filter((activity) => {
      const issue = issueMap.get(activity.issueId);
      return issue?.projectId && projectIdSet.has(issue.projectId.toString());
    });

    // Batch fetch projects and users for accessible activities
    // Filter out undefined projectIds to prevent batch fetch failures
    const projectIdsToFetch = accessibleActivity
      .map((a) => issueMap.get(a.issueId)?.projectId)
      .filter((id): id is Id<"projects"> => id !== undefined);
    const userIds = accessibleActivity.map((a) => a.userId);

    const [projectMap, userMap] = await Promise.all([
      batchFetchWorkspaces(ctx, projectIdsToFetch),
      batchFetchUsers(ctx, userIds),
    ]);

    // Enrich activities
    const enrichedActivity = accessibleActivity
      .map((activity) => {
        const issue = issueMap.get(activity.issueId);
        if (!issue?.projectId) return null;
        const project = projectMap.get(issue.projectId);
        const user = userMap.get(activity.userId);

        return {
          ...activity,
          issueKey: issue.key,
          issueTitle: issue.title,
          projectName: project?.name || "Unknown",
          userName: getUserName(user),
        };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null);

    return enrichedActivity.slice(0, limit);
  },
});

// Get dashboard stats
export const getMyStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        assignedToMe: 0,
        createdByMe: 0,
        completedThisWeek: 0,
        highPriority: 0,
      };
    }

    // Issues assigned to me
    const assignedIssues = await ctx.db
      .query("issues")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", userId))
      .collect();

    // Filter for different stats
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Batch fetch all projects to check workflow states (avoid N+1)
    const projectIds = [...new Set(assignedIssues.map((i) => i.projectId))];
    const projectMap = await batchFetchWorkspaces(ctx, projectIds);

    // Build a map of projectId -> done workflow states
    const doneStatesMap = new Map<string, Set<string>>();
    projectMap.forEach((project, projectId) => {
      const doneStates = new Set(
        project.workflowStates.filter((s) => s.category === "done").map((s) => s.id),
      );
      doneStatesMap.set(projectId, doneStates);
    });

    const completedThisWeek = assignedIssues.filter((issue) => {
      if (!issue.projectId) return false;
      const doneStates = doneStatesMap.get(issue.projectId);
      return doneStates?.has(issue.status) && issue.updatedAt >= weekAgo;
    }).length;

    const highPriority = assignedIssues.filter(
      (i) => i.priority === "high" || i.priority === "highest",
    ).length;

    // Created by me - using index instead of filter (avoids full table scan)
    const createdByMe = await ctx.db
      .query("issues")
      .withIndex("by_reporter", (q) => q.eq("reporterId", userId))
      .collect();

    return {
      assignedToMe: assignedIssues.length,
      createdByMe: createdByMe.length,
      completedThisWeek,
      highPriority,
    };
  },
});
