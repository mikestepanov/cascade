import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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
    const issuesQuery = ctx.db
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
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await assertMinimumRole(ctx, args.projectId, userId, "viewer");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Get issues with same filtering as CSV export
    const issuesQuery = ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId));

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
    projectId: v.id("projects"),
    jsonData: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await assertMinimumRole(ctx, args.projectId, userId, "editor");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    let data: unknown;
    try {
      data = JSON.parse(args.jsonData);
    } catch {
      throw new Error("Invalid JSON format");
    }

    // Type guard and validation
    if (!data || typeof data !== "object" || !("issues" in data) || !Array.isArray(data.issues)) {
      throw new Error("JSON must contain an 'issues' array");
    }

    const imported = [];
    const errors = [];

    for (const issueData of data.issues) {
      try {
        // Get the next issue number for this project
        const existingIssues = await ctx.db
          .query("issues")
          .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
          .collect();

        const issueNumbers = existingIssues
          .map((i) => parseInt(i.key.split("-")[1], 10))
          .filter((n) => !Number.isNaN(n));
        const nextNumber = Math.max(0, ...issueNumbers) + 1;
        const issueKey = `${project.key}-${nextNumber}`;

        // Validate required fields
        if (!issueData.title) {
          throw new Error("Missing required field: title");
        }

        // Create the issue
        const issueId = await ctx.db.insert("issues", {
          projectId: args.projectId,
          key: issueKey,
          title: issueData.title,
          description: issueData.description || undefined,
          type: issueData.type || "task",
          status: issueData.status || project.workflowStates[0].id,
          priority: issueData.priority || "medium",
          reporterId: userId,
          assigneeId: issueData.assigneeId || undefined,
          labels: issueData.labels || [],
          estimatedHours: issueData.estimatedHours || undefined,
          loggedHours: 0,
          dueDate: issueData.dueDate || undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          order: existingIssues.length,
          linkedDocuments: [],
          attachments: [],
        });

        // Log activity
        await ctx.db.insert("issueActivity", {
          issueId,
          userId,
          action: "created",
          createdAt: Date.now(),
        });

        imported.push(issueKey);
      } catch (error) {
        errors.push({
          title: issueData.title || "Unknown",
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
    projectId: v.id("projects"),
    csvData: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await assertMinimumRole(ctx, args.projectId, userId, "editor");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Parse CSV
    const lines = args.csvData.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSV must have at least a header row and one data row");
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const titleIndex = headers.indexOf("title");

    if (titleIndex === -1) {
      throw new Error("CSV must contain a 'title' column");
    }

    const typeIndex = headers.indexOf("type");
    const priorityIndex = headers.indexOf("priority");
    const descriptionIndex = headers.indexOf("description");
    const labelsIndex = headers.indexOf("labels");
    const estimatedIndex = headers.indexOf("estimated hours");
    const dueDateIndex = headers.indexOf("due date");

    const imported = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));

        if (!values[titleIndex]) {
          throw new Error("Title is required");
        }

        // Get the next issue number
        const existingIssues = await ctx.db
          .query("issues")
          .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
          .collect();

        const issueNumbers = existingIssues
          .map((issue) => parseInt(issue.key.split("-")[1], 10))
          .filter((n) => !Number.isNaN(n));
        const nextNumber = Math.max(0, ...issueNumbers) + 1;
        const issueKey = `${project.key}-${nextNumber}`;

        const issueId = await ctx.db.insert("issues", {
          projectId: args.projectId,
          key: issueKey,
          title: values[titleIndex],
          description: descriptionIndex !== -1 ? values[descriptionIndex] : undefined,
          type: ((typeIndex !== -1 && values[typeIndex]) || "task") as
            | "task"
            | "bug"
            | "story"
            | "epic",
          status: project.workflowStates[0].id,
          priority: ((priorityIndex !== -1 && values[priorityIndex]) || "medium") as
            | "lowest"
            | "low"
            | "medium"
            | "high"
            | "highest",
          reporterId: userId,
          labels:
            labelsIndex !== -1 && values[labelsIndex]
              ? values[labelsIndex].split(";").map((l) => l.trim())
              : [],
          estimatedHours:
            estimatedIndex !== -1 && values[estimatedIndex]
              ? parseFloat(values[estimatedIndex])
              : undefined,
          loggedHours: 0,
          dueDate:
            dueDateIndex !== -1 && values[dueDateIndex]
              ? new Date(values[dueDateIndex]).getTime()
              : undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          order: existingIssues.length,
          linkedDocuments: [],
          attachments: [],
        });

        await ctx.db.insert("issueActivity", {
          issueId,
          userId,
          action: "created",
          createdAt: Date.now(),
        });

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
