import type { Doc } from "../_generated/dataModel";

/**
 * WorkflowState type - the shape of workflow states in projects
 * This is the source of truth for workflow state types
 *
 * Extracted from Doc<"projects">["workflowStates"][number]
 */
export type WorkflowState = Doc<"projects">["workflowStates"][number];

/**
 * Workflow category type
 */
export type WorkflowCategory = "todo" | "inprogress" | "done";
