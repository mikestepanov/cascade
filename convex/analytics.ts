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
import { canAccessProject } from "./workspaceAccess";

/**
 * Get project analytics overview
 */
export const getProjectAnalytics = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.workspaceId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check access
    if (!(await canAccessProject(ctx, args.workspaceId, userId))) {
      throw new Error("Not authorized to access this project");
    }

    // Use aggregates for fast O(log n) counting instead of O(n)
    const statusCounts = await issueCountByStatus.lookup(ctx, {
      workspaceId: args.workspaceId,
    });
    const typeCounts = await issueCountByType.lookup(ctx, {
      workspaceId: args.workspaceId,
    });
    const priorityCounts = await issueCountByPriority.lookup(ctx, {
      workspaceId: args.workspaceId,
    });
    const assigneeCounts = await issueCountByAssignee.lookup(ctx, {
      workspaceId: args.workspaceId,
    });

    // Initialize with zeros for all workflow states
    const issuesByStatus: Record<string, number> = {};
    project.workflowStates.forEach((state) => {
      issuesByStatus[state.id] = statusCounts[state.id] || 0;
    });

    // Ensure all types are present
    const issuesByType = {
      task: typeCounts.task || 0,
      bug: typeCounts.bug || 0,
      story: typeCounts.story || 0,
      epic: typeCounts.epic || 0,
      subtask: typeCounts.subtask || 0,
    };

    // Ensure all priorities are present
    const issuesByPriority = {
      lowest: priorityCounts.lowest || 0,
      low: priorityCounts.low || 0,
      medium: priorityCounts.medium || 0,
      high: priorityCounts.high || 0,
      highest: priorityCounts.highest || 0,
    };

    // Get unassigned count
    const unassignedCount = assigneeCounts.unassigned || 0;

    // Enrich assignee data with user info
    const issuesByAssignee: Record<string, { count: number; name: string }> = {};
    await Promise.all(
      Object.entries(assigneeCounts)
        .filter(([assigneeId]) => assigneeId !== "unassigned")
        .map(async ([assigneeId, count]) => {
          const user = await ctx.db.get(assigneeId as Id<"users">);
          issuesByAssignee[assigneeId] = {
            count,
            name: user?.name || user?.email || "Unknown",
          };
        }),
    );

    // Calculate total issues
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
    if (!(await canAccessProject(ctx, sprint.workspaceId, userId))) {
      throw new Error("Not authorized to access this sprint");
    }

    // Get all issues in the sprint
    const sprintIssues = await ctx.db
      .query("issues")
      .withIndex("by_sprint", (q) => q.eq("sprintId", args.sprintId))
      .collect();

    const project = await ctx.db.get(sprint.workspaceId);
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
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check access
    if (!(await canAccessProject(ctx, args.workspaceId, userId))) {
      throw new Error("Not authorized to access this project");
    }

    const project = await ctx.db.get(args.workspaceId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Get completed sprints
    const completedSprints = await ctx.db
      .query("sprints")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .order("desc")
      .take(10); // Last 10 sprints

    // Get done states
    const doneStates = project.workflowStates.filter((s) => s.category === "done").map((s) => s.id);

    const velocityData = await Promise.all(
      completedSprints.map(async (sprint) => {
        const sprintIssues = await ctx.db
          .query("issues")
          .withIndex("by_sprint", (q) => q.eq("sprintId", sprint._id))
          .collect();

        const completedPoints = sprintIssues
          .filter((issue) => doneStates.includes(issue.status))
          .reduce((sum, issue) => sum + (issue.storyPoints || issue.estimatedHours || 0), 0);

        return {
          sprintName: sprint.name,
          sprintId: sprint._id,
          points: completedPoints,
          issuesCompleted: sprintIssues.filter((i) => doneStates.includes(i.status)).length,
        };
      }),
    );

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
  args: { workspaceId: v.id("workspaces"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check access
    if (!(await canAccessProject(ctx, args.workspaceId, userId))) {
      throw new Error("Not authorized to access this project");
    }

    // Get all project issues
    const projectIssues = await ctx.db
      .query("issues")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const issueIds = projectIssues.map((i) => i._id);

    // Get recent activity across all project issues
    const activities = await ctx.db.query("issueActivity").order("desc").take(1000); // Get a large sample

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
      }),
    );
  },
});
