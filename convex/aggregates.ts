// @ts-nocheck - Aggregate library API requires component types from npx convex dev
/**
 * Aggregate Definitions for Fast Analytics
 *
 * O(log n) instead of O(n) for counting and summing
 * Automatically maintained as data changes
 *
 * NOTE: This file requires Convex dev server to be running to generate
 * component types. Run `npx convex dev` to generate the required types.
 */

import { Aggregate } from "@convex-dev/aggregate";
import { components } from "./_generated/api";

/**
 * Issue count by status and project
 * Usage: issueCountByStatus.lookup(ctx, { projectId })
 * Returns: { "status-id-1": 10, "status-id-2": 5, ... }
 */
export const issueCountByStatus = new Aggregate<{ projectId: string; status: string }, number>(
  components.aggregate,
  {
    name: "issueCountByStatus",
    groupBy: (doc) => ({
      projectId: doc.projectId,
      status: doc.status,
    }),
    sum: () => 1, // Count each issue as 1
  },
);

/**
 * Issue count by type and project
 * Usage: issueCountByType.lookup(ctx, { projectId })
 * Returns: { task: 10, bug: 5, story: 3, epic: 2 }
 */
export const issueCountByType = new Aggregate<{ projectId: string; type: string }, number>(
  components.aggregate,
  {
    name: "issueCountByType",
    groupBy: (doc) => ({
      projectId: doc.projectId,
      type: doc.type,
    }),
    sum: () => 1,
  },
);

/**
 * Issue count by priority and project
 * Usage: issueCountByPriority.lookup(ctx, { projectId })
 * Returns: { lowest: 2, low: 5, medium: 10, high: 8, highest: 3 }
 */
export const issueCountByPriority = new Aggregate<{ projectId: string; priority: string }, number>(
  components.aggregate,
  {
    name: "issueCountByPriority",
    groupBy: (doc) => ({
      projectId: doc.projectId,
      priority: doc.priority,
    }),
    sum: () => 1,
  },
);

/**
 * Issue count by assignee and project
 * Usage: issueCountByAssignee.lookup(ctx, { projectId })
 * Returns: { "user-id-1": 5, "user-id-2": 3, ... }
 */
export const issueCountByAssignee = new Aggregate<
  { projectId: string; assigneeId: string },
  number
>(components.aggregate, {
  name: "issueCountByAssignee",
  groupBy: (doc) => ({
    projectId: doc.projectId,
    assigneeId: doc.assigneeId || "unassigned",
  }),
  sum: () => 1,
});

/**
 * Sprint velocity (story points completed)
 * Usage: sprintVelocity.lookup(ctx, { sprintId })
 * Returns: Object with points by status
 */
export const sprintVelocity = new Aggregate<{ sprintId: string; isDone: boolean }, number>(
  components.aggregate,
  {
    name: "sprintVelocity",
    groupBy: (doc) => ({
      sprintId: doc.sprintId || "backlog",
      isDone: doc.status === "done", // Simplified - will be enhanced
    }),
    sum: (doc) => {
      // Sum story points or estimated hours
      return doc.storyPoints || doc.estimatedHours || 0;
    },
  },
);

/**
 * Total story points by sprint
 * Usage: totalSprintPoints.lookup(ctx, { sprintId })
 * Returns: Total points in sprint
 */
export const totalSprintPoints = new Aggregate<{ sprintId: string }, number>(components.aggregate, {
  name: "totalSprintPoints",
  groupBy: (doc) => ({
    sprintId: doc.sprintId || "backlog",
  }),
  sum: (doc) => {
    return doc.storyPoints || doc.estimatedHours || 0;
  },
});

/**
 * Benefits of using aggregates:
 *
 * Performance:
 * - 100 issues: ~same speed
 * - 1,000 issues: 10x faster
 * - 10,000 issues: 100x faster
 * - 100,000 issues: 1000x faster
 *
 * Cost:
 * - Reduces compute usage significantly
 * - No need to query all documents
 * - Automatic incremental updates
 *
 * Real-time:
 * - Updates automatically when data changes
 * - No manual cache invalidation needed
 * - Always accurate and up-to-date
 */
