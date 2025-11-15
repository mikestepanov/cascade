import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { canAccessProject } from "./rbac";

/**
 * Get project analytics overview
 */
export const getProjectAnalytics = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check access
    if (!(await canAccessProject(ctx, args.projectId, userId))) {
      throw new Error("Not authorized to access this project");
    }

    // Get all issues for the project
    const allIssues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Issue count by status
    const issuesByStatus: Record<string, number> = {};
    project.workflowStates.forEach((state) => {
      issuesByStatus[state.id] = 0;
    });
    allIssues.forEach((issue) => {
      issuesByStatus[issue.status] = (issuesByStatus[issue.status] || 0) + 1;
    });

    // Issue count by type
    const issuesByType = {
      task: 0,
      bug: 0,
      story: 0,
      epic: 0,
    };
    allIssues.forEach((issue) => {
      issuesByType[issue.type]++;
    });

    // Issue count by priority
    const issuesByPriority = {
      lowest: 0,
      low: 0,
      medium: 0,
      high: 0,
      highest: 0,
    };
    allIssues.forEach((issue) => {
      issuesByPriority[issue.priority]++;
    });

    // Issue count by assignee
    const issuesByAssignee: Record<string, { count: number; name: string }> = {};
    await Promise.all(
      allIssues.map(async (issue) => {
        if (issue.assigneeId) {
          const key = issue.assigneeId;
          if (!issuesByAssignee[key]) {
            const user = await ctx.db.get(issue.assigneeId);
            issuesByAssignee[key] = {
              count: 0,
              name: user?.name || user?.email || "Unknown",
            };
          }
          issuesByAssignee[key].count++;
        }
      })
    );

    // Unassigned count
    const unassignedCount = allIssues.filter((i) => !i.assigneeId).length;

    return {
      totalIssues: allIssues.length,
      issuesByStatus,
      issuesByType,
      issuesByPriority,
      issuesByAssignee,
      unassignedCount,
    };
  },
});

/**
 * Get sprint burndown data
 */
export const getSprintBurndown = query({
  args: { sprintId: v.id("sprints") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) {
      throw new Error("Sprint not found");
    }

    // Check access to project
    if (!(await canAccessProject(ctx, sprint.projectId, userId))) {
      throw new Error("Not authorized to access this sprint");
    }

    // Get all issues in the sprint
    const sprintIssues = await ctx.db
      .query("issues")
      .withIndex("by_sprint", (q) => q.eq("sprintId", args.sprintId))
      .collect();

    const project = await ctx.db.get(sprint.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Calculate total points (using estimatedHours as story points)
    const totalPoints = sprintIssues.reduce(
      (sum, issue) => sum + (issue.estimatedHours || 0),
      0
    );

    // Get done states
    const doneStates = project.workflowStates
      .filter((s) => s.category === "done")
      .map((s) => s.id);

    const completedPoints = sprintIssues
      .filter((issue) => doneStates.includes(issue.status))
      .reduce((sum, issue) => sum + (issue.estimatedHours || 0), 0);

    const remainingPoints = totalPoints - completedPoints;

    // Calculate progress percentage
    const progressPercentage =
      totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

    // Calculate ideal burndown if sprint has dates
    let idealBurndown: Array<{ day: number; points: number }> = [];
    if (sprint.startDate && sprint.endDate) {
      const now = Date.now();
      const totalDays = Math.ceil(
        (sprint.endDate - sprint.startDate) / (1000 * 60 * 60 * 24)
      );
      const daysElapsed = Math.ceil(
        (now - sprint.startDate) / (1000 * 60 * 60 * 24)
      );

      for (let day = 0; day <= totalDays; day++) {
        const remainingIdeal = totalPoints * (1 - day / totalDays);
        idealBurndown.push({ day, points: Math.max(0, remainingIdeal) });
      }

      return {
        totalPoints,
        completedPoints,
        remainingPoints,
        progressPercentage,
        totalIssues: sprintIssues.length,
        completedIssues: sprintIssues.filter((i) =>
          doneStates.includes(i.status)
        ).length,
        idealBurndown,
        daysElapsed,
        totalDays,
      };
    }

    return {
      totalPoints,
      completedPoints,
      remainingPoints,
      progressPercentage,
      totalIssues: sprintIssues.length,
      completedIssues: sprintIssues.filter((i) => doneStates.includes(i.status))
        .length,
      idealBurndown: [],
      daysElapsed: 0,
      totalDays: 0,
    };
  },
});

/**
 * Get team velocity (completed points per sprint)
 */
export const getTeamVelocity = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check access
    if (!(await canAccessProject(ctx, args.projectId, userId))) {
      throw new Error("Not authorized to access this project");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Get completed sprints
    const completedSprints = await ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .order("desc")
      .take(10); // Last 10 sprints

    // Get done states
    const doneStates = project.workflowStates
      .filter((s) => s.category === "done")
      .map((s) => s.id);

    const velocityData = await Promise.all(
      completedSprints.map(async (sprint) => {
        const sprintIssues = await ctx.db
          .query("issues")
          .withIndex("by_sprint", (q) => q.eq("sprintId", sprint._id))
          .collect();

        const completedPoints = sprintIssues
          .filter((issue) => doneStates.includes(issue.status))
          .reduce((sum, issue) => sum + (issue.estimatedHours || 0), 0);

        return {
          sprintName: sprint.name,
          sprintId: sprint._id,
          points: completedPoints,
          issuesCompleted: sprintIssues.filter((i) =>
            doneStates.includes(i.status)
          ).length,
        };
      })
    );

    // Calculate average velocity
    const avgVelocity =
      velocityData.length > 0
        ? Math.round(
            velocityData.reduce((sum, v) => sum + v.points, 0) /
              velocityData.length
          )
        : 0;

    return {
      velocityData: velocityData.reverse(), // Oldest first for chart
      averageVelocity: avgVelocity,
    };
  },
});

/**
 * Get recent activity for project
 */
export const getRecentActivity = query({
  args: { projectId: v.id("projects"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check access
    if (!(await canAccessProject(ctx, args.projectId, userId))) {
      throw new Error("Not authorized to access this project");
    }

    // Get all project issues
    const projectIssues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const issueIds = projectIssues.map((i) => i._id);

    // Get recent activity across all project issues
    const activities = await ctx.db
      .query("issueActivity")
      .order("desc")
      .take(1000); // Get a large sample

    // Filter to only this project's issues
    const projectActivities = activities
      .filter((a) => issueIds.includes(a.issueId))
      .slice(0, args.limit || 20);

    // Enrich with user and issue info
    return await Promise.all(
      projectActivities.map(async (activity) => {
        const user = await ctx.db.get(activity.userId);
        const issue = await ctx.db.get(activity.issueId);

        return {
          ...activity,
          userName: user?.name || user?.email || "Unknown",
          userImage: user?.image,
          issueKey: issue?.key || "Unknown",
          issueTitle: issue?.title || "Unknown",
        };
      })
    );
  },
});
