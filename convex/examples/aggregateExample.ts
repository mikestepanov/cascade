/**
 * Example: Using Aggregate for Fast Dashboard Counts
 *
 * O(log n) instead of O(n) for counting/summing
 */

import { Aggregate } from "@convex-dev/aggregate";
import { v } from "convex/values";
import { components } from "../_generated/api";
import { query } from "../_generated/server";

// Define aggregates
const issueCountByStatus = new Aggregate<{ projectId: string; status: string }, number>(
  components.aggregate,
  {
    name: "issueCountByStatus",
    // Group by project and status
    groupBy: (doc) => ({
      projectId: doc.projectId,
      status: doc.status,
    }),
    // Sum operation (count issues)
    sum: () => 1,
  },
);

/**
 * Get issue counts by status - FAST!
 *
 * Before: O(n) - ctx.db.query("issues").filter(...).collect().length
 * After: O(log n) - instant lookup
 */
export const getIssueCountsByStatus = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    // Get all status counts for a project
    const counts = await issueCountByStatus.lookup(ctx, {
      projectId: args.projectId,
    });

    // Returns: { "To Do": 10, "In Progress": 5, "Done": 20 }
    return counts;
  },
});

/**
 * Total issues in project
 */
export const getTotalIssues = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const counts = await issueCountByStatus.lookup(ctx, {
      projectId: args.projectId,
    });

    return Object.values(counts).reduce((sum, count) => sum + count, 0);
  },
});

/**
 * Sprint velocity (story points completed)
 */
const sprintVelocity = new Aggregate<{ sprintId: string }, number>(components.aggregate, {
  name: "sprintVelocity",
  groupBy: (doc) => ({
    sprintId: doc.sprintId || "backlog",
  }),
  sum: (doc) => {
    // Only count completed issues
    if (doc.status === "done") {
      return doc.storyPoints || 0;
    }
    return 0;
  },
});

export const getSprintVelocity = query({
  args: {
    sprintId: v.id("sprints"),
  },
  handler: async (ctx, args) => {
    const velocity = await sprintVelocity.lookup(ctx, {
      sprintId: args.sprintId,
    });

    return velocity;
  },
});

/**
 * Benefits:
 * - Dashboard loads 10-100x faster
 * - No more slow .collect() queries
 * - Updates automatically when data changes
 * - Scales to millions of issues
 */
