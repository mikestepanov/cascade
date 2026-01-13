import type { Doc } from "@convex/_generated/dataModel";

/**
 * WorkflowState type - the shape of workflow states in projects
 * This is the source of truth for workflow state types
 *
 * Extracted from Doc<"projects">["workflowStates"][number]
 */
export type WorkflowState = Doc<"projects">["workflowStates"][number];

/**
 * Extended WorkflowState with optional UI-specific properties
 * Use this when you need color/description that aren't in the schema
 */
export interface WorkflowStateDisplay extends WorkflowState {
  color?: string;
  description?: string;
}

/**
 * Workflow category type
 */
export type WorkflowCategory = "todo" | "inprogress" | "done";
