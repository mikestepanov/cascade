import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { notDeleted } from "../lib/softDeleteHelpers";

export const ROOT_ISSUE_TYPES = ["task", "bug", "story", "epic"] as const;

// Helper: Combined searchable content for issues
export function getSearchContent(title: string, description?: string) {
  return `${title} ${description || ""}`.trim();
}

// Helper: Validate parent issue and get inherited epic
export async function validateParentIssue(
  ctx: MutationCtx,
  parentId: Id<"issues"> | undefined,
  issueType: string,
  epicId: Id<"issues"> | undefined,
) {
  if (!parentId) {
    // No parent - epics are root-level issues and can't be subtasks
    if (issueType === "epic") {
      return epicId; // Epics don't have parents or epicId
    }
    return epicId;
  }

  const parentIssue = await ctx.db.get(parentId);
  if (!parentIssue) {
    throw new Error("Parent issue not found");
  }

  // Prevent sub-tasks of sub-tasks (only 1 level deep)
  if (parentIssue.parentId) {
    throw new Error("Cannot create sub-task of a sub-task. Sub-tasks can only be one level deep.");
  }

  // Sub-tasks must be of type "subtask"
  if (issueType !== "subtask") {
    throw new Error("Issues with a parent must be of type 'subtask'");
  }

  // Inherit epicId from parent if not explicitly provided
  return epicId || parentIssue.epicId;
}

// Helper: Generate issue key
export async function generateIssueKey(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  projectKey: string,
) {
  // Get the most recent issue to determine the next number
  // Order by _creationTime desc to get the latest issue
  // TODO: Potential race condition - consider using atomic counter for guaranteed uniqueness
  const latestIssue = await ctx.db
    .query("issues")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .order("desc")
    .filter(notDeleted)
    .first();

  let issueNumber = 1;
  if (latestIssue) {
    // Parse the number from the key (e.g., "PROJ-123" -> 123)
    const match = latestIssue.key.match(/-(\d+)$/);
    if (match) {
      issueNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `${projectKey}-${issueNumber}`;
}

// Helper: Get max order for status column
export async function getMaxOrderForStatus(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  status: string,
) {
  // Limit to 1000 issues per status - reasonable cap for any Kanban column
  const MAX_ISSUES_PER_STATUS = 1000;
  const issuesInStatus = await ctx.db
    .query("issues")
    .withIndex("by_project_status", (q) => q.eq("projectId", projectId).eq("status", status))
    .take(MAX_ISSUES_PER_STATUS);

  // Handle empty array case - return -1 if no issues
  if (issuesInStatus.length === 0) return -1;
  return Math.max(...issuesInStatus.map((i) => i.order));
}

// Helper: Track field change and add to changes array
export function trackFieldChange<T>(
  changes: Array<{
    field: string;
    oldValue: string | number | null | undefined;
    newValue: string | number | null | undefined;
  }>,
  field: string,
  oldValue: T,
  newValue: T | undefined,
): boolean {
  if (newValue !== undefined && newValue !== oldValue) {
    changes.push({
      field,
      oldValue: oldValue as string | number | null | undefined,
      newValue: newValue as string | number | null | undefined,
    });
    return true;
  }
  return false;
}

// Helper: Track and update a nullable field
export function trackNullableFieldUpdate<T>(
  updates: Record<string, unknown>,
  changes: Array<{
    field: string;
    oldValue: string | number | null | undefined;
    newValue: string | number | null | undefined;
  }>,
  fieldName: string,
  oldValue: T | undefined,
  newValue: T | null | undefined,
  valueTransform?: (val: T | null | undefined) => string | number | null | undefined,
): void {
  if (newValue !== undefined && newValue !== oldValue) {
    updates[fieldName] = newValue ?? undefined;
    changes.push({
      field: fieldName,
      oldValue: valueTransform
        ? valueTransform(oldValue)
        : (oldValue as string | number | undefined),
      newValue: valueTransform
        ? valueTransform(newValue)
        : (newValue as string | number | null | undefined),
    });
  }
}

// Helper: Process issue update fields and track changes
export function processIssueUpdates(
  issue: {
    title: string;
    description?: string;
    priority: string;
    assigneeId?: Id<"users">;
    labels: string[];
    dueDate?: number;
    estimatedHours?: number;
    storyPoints?: number;
  },
  args: {
    title?: string;
    description?: string;
    priority?: string;
    assigneeId?: Id<"users"> | null;
    labels?: string[];
    dueDate?: number | null;
    estimatedHours?: number | null;
    storyPoints?: number | null;
  },
  changes: Array<{
    field: string;
    oldValue: string | number | null | undefined;
    newValue: string | number | null | undefined;
  }>,
) {
  const updates: Record<string, unknown> = { updatedAt: Date.now() };

  // Track simple field changes
  if (trackFieldChange(changes, "title", issue.title, args.title)) {
    updates.title = args.title;
  }
  if (trackFieldChange(changes, "description", issue.description, args.description)) {
    updates.description = args.description;
  }
  if (trackFieldChange(changes, "priority", issue.priority, args.priority)) {
    updates.priority = args.priority;
  }

  // Update search content if title or description changed
  if (args.title !== undefined || args.description !== undefined) {
    const newTitle = args.title ?? issue.title;
    const newDescription = args.description !== undefined ? args.description : issue.description;
    updates.searchContent = getSearchContent(newTitle, newDescription);
  }

  // Track nullable field changes
  trackNullableFieldUpdate(updates, changes, "assigneeId", issue.assigneeId, args.assigneeId);
  trackNullableFieldUpdate(updates, changes, "dueDate", issue.dueDate, args.dueDate);
  trackNullableFieldUpdate(
    updates,
    changes,
    "estimatedHours",
    issue.estimatedHours,
    args.estimatedHours,
  );
  trackNullableFieldUpdate(updates, changes, "storyPoints", issue.storyPoints, args.storyPoints);

  // Handle labels specially (array to string transform)
  if (args.labels !== undefined) {
    updates.labels = args.labels;
    changes.push({
      field: "labels",
      oldValue: issue.labels.join(", "),
      newValue: args.labels.join(", "),
    });
  }

  return updates;
}

// Helper: Check if issue matches assignee filter
export function matchesAssigneeFilter(
  issue: { assigneeId?: Id<"users"> },
  assigneeFilter: Id<"users"> | "unassigned" | "me" | undefined,
  userId: Id<"users">,
): boolean {
  if (!assigneeFilter) return true;

  if (assigneeFilter === "unassigned") {
    return !issue.assigneeId;
  }
  if (assigneeFilter === "me") {
    return issue.assigneeId === userId;
  }
  return issue.assigneeId === assigneeFilter;
}

// Helper: Check if issue matches sprint filter
export function matchesSprintFilter(
  issue: { sprintId?: Id<"sprints"> },
  sprintFilter: Id<"sprints"> | "backlog" | "none" | undefined,
): boolean {
  if (!sprintFilter) return true;

  if (sprintFilter === "backlog" || sprintFilter === "none") {
    return !issue.sprintId;
  }
  return issue.sprintId === sprintFilter;
}

// Helper: Check if issue matches epic filter
export function matchesEpicFilter(
  issue: { epicId?: Id<"issues"> },
  epicFilter: Id<"issues"> | "none" | undefined,
): boolean {
  if (!epicFilter) return true;

  if (epicFilter === "none") {
    return !issue.epicId;
  }
  return issue.epicId === epicFilter;
}

// Helper: Check if value matches array filter
export function matchesArrayFilter<T>(value: T, filterArray: T[] | undefined): boolean {
  if (!filterArray || filterArray.length === 0) return true;
  return filterArray.includes(value);
}

// Helper: Check if issue matches date range
export function matchesDateRange(createdAt: number, dateFrom?: number, dateTo?: number): boolean {
  if (dateFrom && createdAt < dateFrom) return false;
  if (dateTo && createdAt > dateTo) return false;
  return true;
}

// Helper: Check if issue matches labels filter (all labels must be present)
export function matchesLabelsFilter(issueLabels: string[], filterLabels?: string[]): boolean {
  if (!filterLabels || filterLabels.length === 0) return true;
  return filterLabels.every((label) => issueLabels.includes(label));
}

// Helper: Check if issue matches all search filters
export function matchesSearchFilters(
  issue: {
    projectId: Id<"projects">;
    assigneeId?: Id<"users">;
    reporterId: Id<"users">;
    type: string;
    status: string;
    priority: string;
    labels: string[];
    sprintId?: Id<"sprints">;
    epicId?: Id<"issues">;
    createdAt: number;
  },
  filters: {
    projectId?: Id<"projects">;
    assigneeId?: Id<"users"> | "unassigned" | "me";
    reporterId?: Id<"users">;
    type?: string[];
    status?: string[];
    priority?: string[];
    labels?: string[];
    sprintId?: Id<"sprints"> | "backlog" | "none";
    epicId?: Id<"issues"> | "none";
    dateFrom?: number;
    dateTo?: number;
  },
  userId: Id<"users">,
): boolean {
  // Simple ID filters
  if (filters.projectId && (issue.projectId as Id<"projects">) !== filters.projectId) return false;
  if (filters.reporterId && issue.reporterId !== filters.reporterId) return false;

  // Complex filters using helpers
  if (!matchesAssigneeFilter(issue, filters.assigneeId, userId)) return false;
  if (!matchesArrayFilter(issue.type, filters.type)) return false;
  if (!matchesArrayFilter(issue.status, filters.status)) return false;
  if (!matchesArrayFilter(issue.priority, filters.priority)) return false;
  if (!matchesLabelsFilter(issue.labels, filters.labels)) return false;
  if (!matchesSprintFilter(issue, filters.sprintId)) return false;
  if (!matchesEpicFilter(issue, filters.epicId)) return false;
  if (!matchesDateRange(issue.createdAt, filters.dateFrom, filters.dateTo)) return false;

  return true;
}
