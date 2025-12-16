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
    const workspaceIds = [...new Set(issues.map((i) => i.workspaceId))];
    const userIds = [
      ...new Set(issues.flatMap((i) => [i.reporterId, i.assigneeId]).filter(Boolean)),
    ] as Id<"users">[];

    const [projects, users] = await Promise.all([
      Promise.all(workspaceIds.map((id) => ctx.db.get(id))),
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
      const project = projectMap.get(issue.workspaceId);
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
    const workspaceIds = [...new Set(issues.map((i) => i.workspaceId))];
    const assigneeIds = [
      ...new Set(issues.map((i) => i.assigneeId).filter(Boolean)),
    ] as Id<"users">[];

    const [projects, assignees] = await Promise.all([
      Promise.all(workspaceIds.map((id) => ctx.db.get(id))),
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
      const project = projectMap.get(issue.workspaceId);
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
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (memberships.length === 0) return [];

    // Batch fetch all workspaces
    const workspaceIds = memberships.map((m) => m.workspaceId);
    const workspaceMap = await batchFetchWorkspaces(ctx, workspaceIds);

    // Fetch issues per workspace using index (NOT loading all issues!)
    const issuesByWorkspace = await Promise.all(
      workspaceIds.map((workspaceId) =>
        ctx.db
          .query("issues")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
          .collect(),
      ),
    );

    // Build counts per workspace
    const totalIssuesByWorkspace = new Map<string, number>();
    const myIssuesByWorkspace = new Map<string, number>();

    workspaceIds.forEach((workspaceId, index) => {
      const issues = issuesByWorkspace[index];
      const wsId = workspaceId.toString();
      totalIssuesByWorkspace.set(wsId, issues.length);
      myIssuesByWorkspace.set(wsId, issues.filter((i) => i.assigneeId === userId).length);
    });

    // Enrich memberships with project data and counts
    const projects = memberships
      .map((membership) => {
        const project = workspaceMap.get(membership.workspaceId);
        if (!project) return null;

        const wsId = membership.workspaceId.toString();
        return {
          ...project,
          _id: membership.workspaceId,
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
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const workspaceIdSet = new Set(memberships.map((m) => m.workspaceId.toString()));

    // Get recent activity
    const allActivity = await ctx.db.query("issueActivity").order("desc").take(MAX_ACTIVITY_ITEMS);

    // Batch fetch all issues referenced by activity
    const issueIds = allActivity.map((a) => a.issueId);
    const issueMap = await batchFetchIssues(ctx, issueIds);

    // Filter to only activities for accessible issues
    const accessibleActivity = allActivity.filter((activity) => {
      const issue = issueMap.get(activity.issueId);
      return issue && workspaceIdSet.has(issue.workspaceId.toString());
    });

    // Batch fetch workspaces and users for accessible activities
    // Filter out undefined workspaceIds to prevent batch fetch failures
    const workspaceIdsToFetch = accessibleActivity
      .map((a) => issueMap.get(a.issueId)?.workspaceId)
      .filter((id): id is Id<"workspaces"> => id !== undefined);
    const userIds = accessibleActivity.map((a) => a.userId);

    const [workspaceMap, userMap] = await Promise.all([
      batchFetchWorkspaces(ctx, workspaceIdsToFetch),
      batchFetchUsers(ctx, userIds),
    ]);

    // Enrich activities
    const enrichedActivity = accessibleActivity
      .map((activity) => {
        const issue = issueMap.get(activity.issueId);
        if (!issue) return null;
        const project = workspaceMap.get(issue.workspaceId);
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
    const workspaceIds = [...new Set(assignedIssues.map((i) => i.workspaceId))];
    const workspaceMap = await batchFetchWorkspaces(ctx, workspaceIds);

    // Build a map of workspaceId -> done workflow states
    const doneStatesMap = new Map<string, Set<string>>();
    workspaceMap.forEach((project, projectId) => {
      const doneStates = new Set(
        project.workflowStates.filter((s) => s.category === "done").map((s) => s.id),
      );
      doneStatesMap.set(projectId, doneStates);
    });

    const completedThisWeek = assignedIssues.filter((issue) => {
      const doneStates = doneStatesMap.get(issue.workspaceId);
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
