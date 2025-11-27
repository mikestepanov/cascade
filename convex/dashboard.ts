import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

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
    const projectIds = [...new Set(issues.map((i) => i.projectId))];
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
      const project = projectMap.get(issue.projectId);
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
      .filter((q) => q.eq(q.field("reporterId"), userId))
      .collect();

    // Batch fetch all related data to avoid N+1 queries
    const projectIds = [...new Set(issues.map((i) => i.projectId))];
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
      const project = projectMap.get(issue.projectId);
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

    const projects = await Promise.all(
      memberships.map(async (membership) => {
        const project = await ctx.db.get(membership.projectId);
        if (!project) return null;

        // Get issue count for this project
        const issues = await ctx.db
          .query("issues")
          .withIndex("by_project", (q) => q.eq("projectId", membership.projectId))
          .collect();

        // Get my issues count
        const myIssues = issues.filter((i) => i.assigneeId === userId);

        return {
          ...project,
          _id: membership.projectId,
          role: membership.role,
          totalIssues: issues.length,
          myIssues: myIssues.length,
        };
      }),
    );

    return projects.filter((p) => p !== null);
  },
});

// Get recent activity across all projects the user has access to
export const getMyRecentActivity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const limit = args.limit || 20;

    // Get projects where user is a member
    const memberships = await ctx.db
      .query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const projectIds = memberships.map((m) => m.projectId);

    // Get recent activity from those projects
    const allActivity = await ctx.db.query("issueActivity").order("desc").take(100); // Take more to filter

    // Filter to only projects the user has access to
    const accessibleActivity = await Promise.all(
      allActivity.map(async (activity) => {
        const issue = await ctx.db.get(activity.issueId);
        if (!(issue && projectIds.includes(issue.projectId))) return null;

        const project = await ctx.db.get(issue.projectId);
        const user = await ctx.db.get(activity.userId);

        return {
          ...activity,
          issueKey: issue.key,
          issueTitle: issue.title,
          projectName: project?.name || "Unknown",
          userName: user?.name || "Unknown",
        };
      }),
    );

    return accessibleActivity.filter((a) => a !== null).slice(0, limit);
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

    // Get all projects to check workflow states
    const projectIds = [...new Set(assignedIssues.map((i) => i.projectId))];
    const projects = await Promise.all(projectIds.map(async (id) => await ctx.db.get(id)));

    // Build a map of projectId -> done workflow states
    const doneStatesMap = new Map<string, Set<string>>();
    projects.forEach((project) => {
      if (!project) return;
      const doneStates = new Set(
        project.workflowStates.filter((s) => s.category === "done").map((s) => s.id),
      );
      doneStatesMap.set(project._id, doneStates);
    });

    const completedThisWeek = assignedIssues.filter((issue) => {
      const doneStates = doneStatesMap.get(issue.projectId);
      return doneStates?.has(issue.status) && issue.updatedAt >= weekAgo;
    }).length;

    const highPriority = assignedIssues.filter(
      (i) => i.priority === "high" || i.priority === "highest",
    ).length;

    // Created by me
    const createdByMe = await ctx.db
      .query("issues")
      .filter((q) => q.eq(q.field("reporterId"), userId))
      .collect();

    return {
      assignedToMe: assignedIssues.length,
      createdByMe: createdByMe.length,
      completedThisWeek,
      highPriority,
    };
  },
});
