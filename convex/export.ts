import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertMinimumRole } from "./rbac";

// Export issues as CSV
export const exportIssuesCSV = query({
  args: {
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user has access to project
    await assertMinimumRole(ctx, args.projectId, userId, "viewer");

    // Get project to access workflow states
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Get issues
    let issuesQuery = ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId));

    let issues = await issuesQuery.collect();

    // Filter by sprint if specified
    if (args.sprintId) {
      issues = issues.filter((i) => i.sprintId === args.sprintId);
    }

    // Filter by status if specified
    if (args.status) {
      issues = issues.filter((i) => i.status === args.status);
    }

    // Enrich with user and sprint data
    const enrichedIssues = await Promise.all(
      issues.map(async (issue) => {
        const assignee = issue.assigneeId
          ? await ctx.db.get(issue.assigneeId)
          : null;
        const reporter = await ctx.db.get(issue.reporterId);
        const sprint = issue.sprintId
          ? await ctx.db.get(issue.sprintId)
          : null;

        // Get status name from workflow
        const statusState = project.workflowStates.find(
          (s) => s.id === issue.status
        );

        return {
          key: issue.key,
          title: issue.title,
          type: issue.type,
          status: statusState?.name ?? issue.status,
          priority: issue.priority,
          assignee: assignee?.name ?? "Unassigned",
          reporter: reporter?.name ?? "Unknown",
          sprint: sprint?.name ?? "No Sprint",
          estimatedHours: issue.estimatedHours ?? 0,
          loggedHours: issue.loggedHours ?? 0,
          labels: issue.labels.join(", "),
          dueDate: issue.dueDate
            ? new Date(issue.dueDate).toISOString().split("T")[0]
            : "",
          createdAt: new Date(issue.createdAt).toISOString().split("T")[0],
        };
      })
    );

    // Convert to CSV
    const headers = [
      "Key",
      "Title",
      "Type",
      "Status",
      "Priority",
      "Assignee",
      "Reporter",
      "Sprint",
      "Estimated Hours",
      "Logged Hours",
      "Labels",
      "Due Date",
      "Created",
    ];

    const rows = enrichedIssues.map((issue) => [
      issue.key,
      `"${issue.title.replace(/"/g, '""')}"`, // Escape quotes
      issue.type,
      issue.status,
      issue.priority,
      issue.assignee,
      issue.reporter,
      issue.sprint,
      issue.estimatedHours,
      issue.loggedHours,
      `"${issue.labels}"`,
      issue.dueDate,
      issue.createdAt,
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n"
    );

    return csv;
  },
});

// Export analytics data
export const exportAnalytics = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user has access to project
    await assertMinimumRole(ctx, args.projectId, userId, "viewer");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Get all issues
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Get all sprints
    const sprints = await ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Calculate metrics
    const totalIssues = issues.length;
    const completedIssues = issues.filter((i) => {
      const state = project.workflowStates.find((s) => s.id === i.status);
      return state?.category === "done";
    }).length;

    const issuesByType = issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const issuesByPriority = issues.reduce((acc, issue) => {
      acc[issue.priority] = (acc[issue.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalEstimated = issues.reduce(
      (sum, i) => sum + (i.estimatedHours ?? 0),
      0
    );
    const totalLogged = issues.reduce(
      (sum, i) => sum + (i.loggedHours ?? 0),
      0
    );

    return {
      projectName: project.name,
      projectKey: project.key,
      totalIssues,
      completedIssues,
      completionRate: totalIssues > 0 ? (completedIssues / totalIssues) * 100 : 0,
      issuesByType,
      issuesByPriority,
      totalEstimatedHours: totalEstimated,
      totalLoggedHours: totalLogged,
      totalSprints: sprints.length,
      completedSprints: sprints.filter((s) => s.status === "completed").length,
      exportedAt: new Date().toISOString(),
    };
  },
});
