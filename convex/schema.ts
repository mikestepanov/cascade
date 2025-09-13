import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const applicationTables = {
  documents: defineTable({
    title: v.string(),
    isPublic: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    projectId: v.optional(v.id("projects")), // Link documents to projects
  })
    .index("by_creator", ["createdBy"])
    .index("by_public", ["isPublic"])
    .index("by_created_at", ["createdAt"])
    .index("by_project", ["projectId"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["isPublic", "createdBy", "projectId"],
    }),

  projects: defineTable({
    name: v.string(),
    key: v.string(), // Project key like "PROJ"
    description: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    isPublic: v.boolean(),
    members: v.array(v.id("users")),
    boardType: v.union(v.literal("kanban"), v.literal("scrum")),
    workflowStates: v.array(v.object({
      id: v.string(),
      name: v.string(),
      category: v.union(v.literal("todo"), v.literal("inprogress"), v.literal("done")),
      order: v.number(),
    })),
  })
    .index("by_creator", ["createdBy"])
    .index("by_key", ["key"])
    .index("by_public", ["isPublic"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["isPublic", "createdBy"],
    }),

  issues: defineTable({
    projectId: v.id("projects"),
    key: v.string(), // Issue key like "PROJ-123"
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("task"), v.literal("bug"), v.literal("story"), v.literal("epic")),
    status: v.string(), // References workflow state id
    priority: v.union(v.literal("lowest"), v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("highest")),
    assigneeId: v.optional(v.id("users")),
    reporterId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    dueDate: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
    loggedHours: v.optional(v.number()),
    labels: v.array(v.string()),
    sprintId: v.optional(v.id("sprints")),
    epicId: v.optional(v.id("issues")),
    linkedDocuments: v.array(v.id("documents")),
    attachments: v.array(v.id("_storage")),
    order: v.number(), // For ordering within status columns
  })
    .index("by_project", ["projectId"])
    .index("by_assignee", ["assigneeId"])
    .index("by_reporter", ["reporterId"])
    .index("by_status", ["status"])
    .index("by_sprint", ["sprintId"])
    .index("by_epic", ["epicId"])
    .index("by_project_status", ["projectId", "status"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["projectId", "type", "status", "priority"],
    }),

  issueComments: defineTable({
    issueId: v.id("issues"),
    authorId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_issue", ["issueId"])
    .index("by_author", ["authorId"]),

  issueLinks: defineTable({
    fromIssueId: v.id("issues"),
    toIssueId: v.id("issues"),
    linkType: v.union(v.literal("blocks"), v.literal("relates"), v.literal("duplicates")),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_from_issue", ["fromIssueId"])
    .index("by_to_issue", ["toIssueId"]),

  sprints: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    goal: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: v.union(v.literal("future"), v.literal("active"), v.literal("completed")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_status", ["status"]),

  issueActivity: defineTable({
    issueId: v.id("issues"),
    userId: v.id("users"),
    action: v.string(), // "created", "updated", "commented", "assigned", etc.
    field: v.optional(v.string()), // Field that was changed
    oldValue: v.optional(v.string()),
    newValue: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_issue", ["issueId"])
    .index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
