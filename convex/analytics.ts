// @ts-nocheck - TODO: Fix aggregate component types after running convex dev
/**
 * NOTE: This file uses aggregates which require Convex dev server running.
 * Run `npx convex dev` to generate component types.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import {
  issueCountByAssignee,
  issueCountByPriority,
  issueCountByStatus,
  issueCountByType,
} from "./aggregates";
import { batchFetchIssues, batchFetchUsers, getUserName } from "./lib/batchHelpers";
import { MAX_ACTIVITY_FOR_ANALYTICS, MAX_VELOCITY_SPRINTS } from "./lib/queryLimits";
import { notDeleted } from "./lib/softDeleteHelpers";
import { canAccessProject } from "./projectAccess";

// Helper: Build issues by status from workflow states and counts
function buildIssuesByStatus(
  workflowStates: { id: string }[],
  statusCounts: Record<string, number>,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const state of workflowStates) {
    result[state.id] = statusCounts[state.id] || 0;
  }
  return result;
}

// Helper: Build issues by type with defaults
function buildIssuesByType(typeCounts: Record<string, number>) {
  return {
    task: typeCounts.task || 0,
    bug: typeCounts.bug || 0,
    story: typeCounts.story || 0,
    epic: typeCounts.epic || 0,
    subtask: typeCounts.subtask || 0,
  };
}

// Helper: Build issues by priority with defaults
function buildIssuesByPriority(priorityCounts: Record<string, number>) {
  return {
    lowest: priorityCounts.lowest || 0,
    low: priorityCounts.low || 0,
    medium: priorityCounts.medium || 0,
    high: priorityCounts.high || 0,
    highest: priorityCounts.highest || 0,
  };
}

/**
 * Get project analytics overview
 */
export const getProjectAnalytics = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    if (!(await canAccessProject(ctx, args.projectId, userId))) {
      throw new Error("Not authorized to access this project");
    }

    // Use aggregates for fast O(log n) counting instead of O(n)
    const [statusCounts, typeCounts, priorityCounts, assigneeCounts] = await Promise.all([
      issueCountByStatus.lookup(ctx, { projectId: args.projectId }),
      issueCountByType.lookup(ctx, { projectId: args.projectId }),
      issueCountByPriority.lookup(ctx, { projectId: args.projectId }),
      issueCountByAssignee.lookup(ctx, { projectId: args.projectId }),
    ]);

    // Build structured data using helpers
    const issuesByStatus = buildIssuesByStatus(project.workflowStates, statusCounts);
    const issuesByType = buildIssuesByType(typeCounts);
    const issuesByPriority = buildIssuesByPriority(priorityCounts);
    const unassignedCount = assigneeCounts.unassigned || 0;

    // Batch fetch assignee users and build assignee map
    const assigneeIds = Object.keys(assigneeCounts)
      .filter((id) => id !== "unassigned")
      .map((id) => id as Id<"users">);
    const userMap = await batchFetchUsers(ctx, assigneeIds);

    const issuesByAssignee: Record<string, { count: number; name: string }> = {};
    for (const [assigneeId, count] of Object.entries(assigneeCounts)) {
      if (assigneeId === "unassigned") continue;
      issuesByAssignee[assigneeId] = {
        count,
        name: getUserName(userMap.get(assigneeId as Id<"users">)),
      };
    }

    const totalIssues = Object.values(typeCounts).reduce((sum, count) => sum + count, 0);

    return {
      totalIssues,
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
      .filter(notDeleted)
      .collect();

    const project = await ctx.db.get(sprint.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Calculate total points (using storyPoints, fallback to estimatedHours)
    const totalPoints = sprintIssues.reduce(
      (sum, issue) => sum + (issue.storyPoints || issue.estimatedHours || 0),
      0,
    );

    // Get done states
    const doneStates = project.workflowStates.filter((s) => s.category === "done").map((s) => s.id);

    const completedPoints = sprintIssues
      .filter((issue) => doneStates.includes(issue.status))
      .reduce((sum, issue) => sum + (issue.storyPoints || issue.estimatedHours || 0), 0);

    const remainingPoints = totalPoints - completedPoints;

    // Calculate progress percentage
    const progressPercentage =
      totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

    // Calculate ideal burndown if sprint has dates
    const idealBurndown: Array<{ day: number; points: number }> = [];
    if (sprint.startDate && sprint.endDate) {
      const now = Date.now();
      const totalDays = Math.ceil((sprint.endDate - sprint.startDate) / (1000 * 60 * 60 * 24));
      const daysElapsed = Math.ceil((now - sprint.startDate) / (1000 * 60 * 60 * 24));

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
        completedIssues: sprintIssues.filter((i) => doneStates.includes(i.status)).length,
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
      completedIssues: sprintIssues.filter((i) => doneStates.includes(i.status)).length,
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
      .withIndex("by_workspace", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .order("desc")
      .take(MAX_VELOCITY_SPRINTS);

    // Get done states
    const doneStates = project.workflowStates.filter((s) => s.category === "done").map((s) => s.id);

    // Batch fetch issues for all sprints in parallel (not sequential)
    const sprintIds = completedSprints.map((s) => s._id);
    const sprintIssuesArrays = await Promise.all(
      sprintIds.map((sprintId) =>
        ctx.db
          .query("issues")
          .withIndex("by_sprint", (q) => q.eq("sprintId", sprintId))
          .filter(notDeleted)
          .collect(),
      ),
    );

    // Build sprint issues map
    const sprintIssuesMap = new Map(
      sprintIds.map((id, i) => [id.toString(), sprintIssuesArrays[i]]),
    );

    // Calculate velocity data using pre-fetched issues (no N+1)
    const velocityData = completedSprints.map((sprint) => {
      const sprintIssues = sprintIssuesMap.get(sprint._id.toString()) || [];

      const completedPoints = sprintIssues
        .filter((issue) => doneStates.includes(issue.status))
        .reduce((sum, issue) => sum + (issue.storyPoints || issue.estimatedHours || 0), 0);

      return {
        sprintName: sprint.name,
        sprintId: sprint._id,
        points: completedPoints,
        issuesCompleted: sprintIssues.filter((i) => doneStates.includes(i.status)).length,
      };
    });

    // Calculate average velocity
    const avgVelocity =
      velocityData.length > 0
        ? Math.round(velocityData.reduce((sum, v) => sum + v.points, 0) / velocityData.length)
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

    // Get recent activity (global, limited)
    const activities = await ctx.db
      .query("issueActivity")
      .order("desc")
      .take(MAX_ACTIVITY_FOR_ANALYTICS);

    // Batch fetch all referenced issues (NOT all project issues!)
    const activityIssueIds = activities.map((a) => a.issueId);
    const issueMap = await batchFetchIssues(ctx, activityIssueIds);

    // Filter to only activities for this project's issues
    const projectActivities = activities
      .filter((a) => {
        const issue = issueMap.get(a.issueId);
        return issue && issue.projectId === args.projectId;
      })
      .slice(0, args.limit || 20);

    // Batch fetch users for filtered activities
    const userIds = projectActivities.map((a) => a.userId);
    const userMap = await batchFetchUsers(ctx, userIds);

    // Enrich with pre-fetched data (no N+1)
    return projectActivities.map((activity) => {
      const user = userMap.get(activity.userId);
      const issue = issueMap.get(activity.issueId);

      return {
        ...activity,
        userName: getUserName(user),
        userImage: user?.image,
        issueKey: issue?.key || "Unknown",
        issueTitle: issue?.title || "Unknown",
      };
    });
  },
});
