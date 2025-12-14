import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, query } from "./_generated/server";
import { assertCanAccessProject, assertCanEditProject } from "./workspaceAccess";

// Helper: Generate next issue key for a project
async function generateNextIssueKey(
  ctx: MutationCtx,
  workspaceId: Id<"workspaces">,
  projectKey: string,
): Promise<{ key: string; order: number }> {
  const existingIssues = await ctx.db
    .query("issues")
    .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
    .collect();

  const issueNumbers = existingIssues
    .map((issue) => Number.parseInt(issue.key.split("-")[1], 10))
    .filter((n) => !Number.isNaN(n));

  const nextNumber = Math.max(0, ...issueNumbers) + 1;
  const key = `${projectKey}-${nextNumber}`;
  const order = existingIssues.length;

  return { key, order };
}

// Helper: Validate and parse JSON import data
function validateJSONImportData(jsonData: string): { issues: unknown[] } {
  let data: unknown;
  try {
    data = JSON.parse(jsonData);
  } catch {
    throw new Error("Invalid JSON format");
  }

  // Type guard and validation
  if (!data || typeof data !== "object" || !("issues" in data) || !Array.isArray(data.issues)) {
    throw new Error("JSON must contain an 'issues' array");
  }

  return { issues: data.issues };
}

// Helper: Process single issue from JSON import
async function processJSONIssue(
  ctx: MutationCtx,
  issue: unknown,
  workspaceId: Id<"workspaces">,
  projectKey: string,
  userId: Id<"users">,
  defaultStatus: string,
): Promise<string> {
  // Cast to any for runtime validation
  const issueData = issue as {
    title?: string;
    description?: string;
    type?: string;
    status?: string;
    priority?: string;
    assigneeId?: Id<"users">;
    epicId?: Id<"issues">;
    parentId?: Id<"issues">;
    sprintId?: Id<"sprints">;
    labels?: string[];
    estimatedHours?: number;
    dueDate?: number;
  };

  // Validate required fields
  if (!issueData.title) {
    throw new Error("Missing required field: title");
  }

  // Generate next issue key
  const { key: issueKey, order } = await generateNextIssueKey(ctx, workspaceId, projectKey);

  // Create the issue
  await createIssueWithActivity(
    ctx,
    {
      workspaceId,
      key: issueKey,
      title: issueData.title,
      description: issueData.description || undefined,
      type: (issueData.type || "task") as "task" | "bug" | "story" | "epic" | "subtask",
      status: issueData.status || defaultStatus,
      priority: (issueData.priority || "medium") as
        | "lowest"
        | "low"
        | "medium"
        | "high"
        | "highest",
      reporterId: userId,
      assigneeId: issueData.assigneeId || undefined,
      epicId: issueData.epicId || undefined,
      parentId: issueData.parentId || undefined,
      sprintId: issueData.sprintId || undefined,
      labels: issueData.labels || [],
      estimatedHours: issueData.estimatedHours || undefined,
      dueDate: issueData.dueDate || undefined,
      order,
    },
    userId,
  );

  return issueKey;
}

// Helper: Parse CSV headers to get column indices
function parseCSVHeaders(headerLine: string): {
  titleIndex: number;
  typeIndex: number;
  priorityIndex: number;
  descriptionIndex: number;
  labelsIndex: number;
  estimatedIndex: number;
  dueDateIndex: number;
} {
  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());
  const titleIndex = headers.indexOf("title");

  if (titleIndex === -1) {
    throw new Error("CSV must contain a 'title' column");
  }

  return {
    titleIndex,
    typeIndex: headers.indexOf("type"),
    priorityIndex: headers.indexOf("priority"),
    descriptionIndex: headers.indexOf("description"),
    labelsIndex: headers.indexOf("labels"),
    estimatedIndex: headers.indexOf("estimated hours"),
    dueDateIndex: headers.indexOf("due date"),
  };
}

// Helper: Parse CSV row into issue data
function parseCSVRow(
  values: string[],
  indices: ReturnType<typeof parseCSVHeaders>,
  workspaceId: Id<"workspaces">,
  issueKey: string,
  userId: Id<"users">,
  defaultStatus: string,
  order: number,
): {
  workspaceId: Id<"workspaces">;
  key: string;
  title: string;
  description?: string;
  type: "task" | "bug" | "story" | "epic" | "subtask";
  status: string;
  priority: "lowest" | "low" | "medium" | "high" | "highest";
  reporterId: Id<"users">;
  labels: string[];
  estimatedHours?: number;
  dueDate?: number;
  order: number;
} {
  if (!values[indices.titleIndex]) {
    throw new Error("Title is required");
  }

  return {
    workspaceId,
    key: issueKey,
    title: values[indices.titleIndex],
    description: indices.descriptionIndex !== -1 ? values[indices.descriptionIndex] : undefined,
    type: ((indices.typeIndex !== -1 && values[indices.typeIndex]) || "task") as
      | "task"
      | "bug"
      | "story"
      | "epic"
      | "subtask",
    status: defaultStatus,
    priority: ((indices.priorityIndex !== -1 && values[indices.priorityIndex]) || "medium") as
      | "lowest"
      | "low"
      | "medium"
      | "high"
      | "highest",
    reporterId: userId,
    labels:
      indices.labelsIndex !== -1 && values[indices.labelsIndex]
        ? values[indices.labelsIndex].split(";").map((l) => l.trim())
        : [],
    estimatedHours:
      indices.estimatedIndex !== -1 && values[indices.estimatedIndex]
        ? Number.parseFloat(values[indices.estimatedIndex])
        : undefined,
    dueDate:
      indices.dueDateIndex !== -1 && values[indices.dueDateIndex]
        ? new Date(values[indices.dueDateIndex]).getTime()
        : undefined,
    order,
  };
}

// Helper: Create issue and log activity
async function createIssueWithActivity(
  ctx: MutationCtx,
  issueData: {
    workspaceId: Id<"workspaces">;
    key: string;
    title: string;
    description?: string;
    type: "task" | "bug" | "story" | "epic" | "subtask";
    status: string;
    priority: "lowest" | "low" | "medium" | "high" | "highest";
    reporterId: Id<"users">;
    assigneeId?: Id<"users">;
    epicId?: Id<"issues">;
    parentId?: Id<"issues">;
    sprintId?: Id<"sprints">;
    labels: string[];
    estimatedHours?: number;
    dueDate?: number;
    order: number;
  },
  userId: Id<"users">,
): Promise<Id<"issues">> {
  const issueId = await ctx.db.insert("issues", {
    ...issueData,
    loggedHours: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    linkedDocuments: [],
    attachments: [],
  });

  await ctx.db.insert("issueActivity", {
    issueId,
    userId,
    action: "created",
    createdAt: Date.now(),
  });

  return issueId;
}

// Export issues as CSV
export const exportIssuesCSV = query({
  args: {
    workspaceId: v.id("workspaces"),
    sprintId: v.optional(v.id("sprints")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user has access to project
    await assertCanAccessProject(ctx, args.workspaceId, userId);

    // Get project to access workflow states
    const project = await ctx.db.get(args.workspaceId);
    if (!project) throw new Error("Project not found");

    // Get issues
    const issuesQuery = ctx.db
      .query("issues")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId));

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
        const assignee = issue.assigneeId ? await ctx.db.get(issue.assigneeId) : null;
        const reporter = await ctx.db.get(issue.reporterId);
        const sprint = issue.sprintId ? await ctx.db.get(issue.sprintId) : null;

        // Get status name from workflow
        const statusState = project.workflowStates.find((s) => s.id === issue.status);

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
          dueDate: issue.dueDate ? new Date(issue.dueDate).toISOString().split("T")[0] : "",
          createdAt: new Date(issue.createdAt).toISOString().split("T")[0],
        };
      }),
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

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    return csv;
  },
});

// Export analytics data
export const exportAnalytics = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user has access to project
    await assertCanAccessProject(ctx, args.workspaceId, userId);

    const project = await ctx.db.get(args.workspaceId);
    if (!project) throw new Error("Project not found");

    // Get all issues
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Get all sprints
    const sprints = await ctx.db
      .query("sprints")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Calculate metrics
    const totalIssues = issues.length;
    const completedIssues = issues.filter((i) => {
      const state = project.workflowStates.find((s) => s.id === i.status);
      return state?.category === "done";
    }).length;

    const issuesByType = issues.reduce(
      (acc, issue) => {
        acc[issue.type] = (acc[issue.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const issuesByPriority = issues.reduce(
      (acc, issue) => {
        acc[issue.priority] = (acc[issue.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalEstimated = issues.reduce((sum, i) => sum + (i.estimatedHours ?? 0), 0);
    const totalLogged = issues.reduce((sum, i) => sum + (i.loggedHours ?? 0), 0);

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

// Export issues as JSON
export const exportIssuesJSON = query({
  args: {
    workspaceId: v.id("workspaces"),
    sprintId: v.optional(v.id("sprints")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await assertCanAccessProject(ctx, args.workspaceId, userId);

    const project = await ctx.db.get(args.workspaceId);
    if (!project) throw new Error("Project not found");

    // Get issues with same filtering as CSV export
    const issuesQuery = ctx.db
      .query("issues")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId));

    let issues = await issuesQuery.collect();

    if (args.sprintId) {
      issues = issues.filter((i) => i.sprintId === args.sprintId);
    }

    if (args.status) {
      issues = issues.filter((i) => i.status === args.status);
    }

    // Enrich with related data
    const enrichedIssues = await Promise.all(
      issues.map(async (issue) => {
        const assignee = issue.assigneeId ? await ctx.db.get(issue.assigneeId) : null;
        const reporter = await ctx.db.get(issue.reporterId);
        const sprint = issue.sprintId ? await ctx.db.get(issue.sprintId) : null;
        const statusState = project.workflowStates.find((s) => s.id === issue.status);

        // Get comments
        const comments = await ctx.db
          .query("issueComments")
          .withIndex("by_issue", (q) => q.eq("issueId", issue._id))
          .collect();

        return {
          ...issue,
          statusName: statusState?.name ?? issue.status,
          assigneeName: assignee?.name,
          reporterName: reporter?.name,
          sprintName: sprint?.name,
          comments: comments.length,
        };
      }),
    );

    return JSON.stringify(
      {
        project: {
          name: project.name,
          key: project.key,
          description: project.description,
        },
        exportedAt: new Date().toISOString(),
        totalIssues: enrichedIssues.length,
        issues: enrichedIssues,
      },
      null,
      2,
    );
  },
});

// Import issues from JSON
export const importIssuesJSON = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    jsonData: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await assertCanEditProject(ctx, args.workspaceId, userId);

    const project = await ctx.db.get(args.workspaceId);
    if (!project) throw new Error("Project not found");

    // Validate and parse JSON data
    const { issues } = validateJSONImportData(args.jsonData);

    const imported = [];
    const errors = [];

    for (const issue of issues) {
      try {
        const issueKey = await processJSONIssue(
          ctx,
          issue,
          args.workspaceId,
          project.key,
          userId,
          project.workflowStates[0].id,
        );
        imported.push(issueKey);
      } catch (error) {
        errors.push({
          title: (issue as { title?: string }).title || "Unknown",
          error: error instanceof Error ? error.message : "Import failed",
        });
      }
    }

    return {
      imported: imported.length,
      failed: errors.length,
      errors: errors.slice(0, 10), // Return first 10 errors
    };
  },
});

// Import issues from CSV
export const importIssuesCSV = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    csvData: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await assertCanEditProject(ctx, args.workspaceId, userId);

    const project = await ctx.db.get(args.workspaceId);
    if (!project) throw new Error("Project not found");

    // Parse CSV
    const lines = args.csvData.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSV must have at least a header row and one data row");
    }

    // Parse headers to get column indices
    const indices = parseCSVHeaders(lines[0]);

    const imported = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));

        // Generate next issue key
        const { key: issueKey, order } = await generateNextIssueKey(
          ctx,
          args.workspaceId,
          project.key,
        );

        // Parse CSV row into issue data
        const issueData = parseCSVRow(
          values,
          indices,
          args.workspaceId,
          issueKey,
          userId,
          project.workflowStates[0].id,
          order,
        );

        await createIssueWithActivity(ctx, issueData, userId);
        imported.push(issueKey);
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : "Export failed",
        });
      }
    }

    return {
      imported: imported.length,
      failed: errors.length,
      errors: errors.slice(0, 10),
    };
  },
});
