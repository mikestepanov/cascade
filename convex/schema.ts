import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
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
    members: v.array(v.id("users")), // Kept for backwards compatibility, deprecated
    boardType: v.union(v.literal("kanban"), v.literal("scrum")),
    workflowStates: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        category: v.union(v.literal("todo"), v.literal("inprogress"), v.literal("done")),
        order: v.number(),
      }),
    ),
    // Agency features
    defaultHourlyRate: v.optional(v.number()), // Default billing rate for this project
    clientName: v.optional(v.string()), // Client name for agency work
    budget: v.optional(v.number()), // Project budget in currency
  })
    .index("by_creator", ["createdBy"])
    .index("by_key", ["key"])
    .index("by_public", ["isPublic"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["isPublic", "createdBy"],
    }),

  projectMembers: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
    addedBy: v.id("users"),
    addedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_user", ["userId"])
    .index("by_project_user", ["projectId", "userId"]),

  issues: defineTable({
    projectId: v.id("projects"),
    key: v.string(), // Issue key like "PROJ-123"
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("task"), v.literal("bug"), v.literal("story"), v.literal("epic")),
    status: v.string(), // References workflow state id
    priority: v.union(
      v.literal("lowest"),
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("highest"),
    ),
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
    mentions: v.array(v.id("users")), // User IDs mentioned in comment
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

  issueWatchers: defineTable({
    issueId: v.id("issues"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_issue", ["issueId"])
    .index("by_user", ["userId"])
    .index("by_issue_user", ["issueId", "userId"]),

  labels: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    color: v.string(), // Hex color code like "#3B82F6"
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_name", ["projectId", "name"]),

  timeEntries: defineTable({
    issueId: v.id("issues"),
    userId: v.id("users"),
    hours: v.number(),
    description: v.optional(v.string()),
    date: v.number(), // Timestamp of when work was done
    billable: v.boolean(), // For agency billing - is this billable to client?
    hourlyRate: v.optional(v.number()), // Override project rate if needed
    createdAt: v.number(),
  })
    .index("by_issue", ["issueId"])
    .index("by_user", ["userId"])
    .index("by_date", ["date"]),

  activeTimers: defineTable({
    userId: v.id("users"),
    issueId: v.id("issues"),
    startedAt: v.number(),
    description: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_issue", ["issueId"]),

  issueTemplates: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    type: v.union(v.literal("task"), v.literal("bug"), v.literal("story"), v.literal("epic")),
    titleTemplate: v.string(),
    descriptionTemplate: v.string(),
    defaultPriority: v.union(
      v.literal("lowest"),
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("highest"),
    ),
    defaultLabels: v.array(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_type", ["projectId", "type"]),

  webhooks: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    url: v.string(),
    events: v.array(v.string()), // e.g., ["issue.created", "issue.updated"]
    secret: v.optional(v.string()), // For HMAC signature
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    lastTriggered: v.optional(v.number()),
  })
    .index("by_project", ["projectId"])
    .index("by_active", ["isActive"]),

  webhookExecutions: defineTable({
    webhookId: v.id("webhooks"),
    event: v.string(), // Event that triggered: "issue.created", etc.
    status: v.union(v.literal("success"), v.literal("failed"), v.literal("retrying")),
    requestPayload: v.string(), // JSON string of the request body
    responseStatus: v.optional(v.number()), // HTTP status code
    responseBody: v.optional(v.string()), // Response from webhook endpoint
    error: v.optional(v.string()), // Error message if failed
    attempts: v.number(), // Number of delivery attempts
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_webhook", ["webhookId"])
    .index("by_webhook_created", ["webhookId", "createdAt"])
    .index("by_status", ["status"]),

  savedFilters: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    name: v.string(),
    filters: v.object({
      type: v.optional(
        v.array(
          v.union(v.literal("task"), v.literal("bug"), v.literal("story"), v.literal("epic")),
        ),
      ),
      status: v.optional(v.array(v.string())),
      priority: v.optional(
        v.array(
          v.union(
            v.literal("lowest"),
            v.literal("low"),
            v.literal("medium"),
            v.literal("high"),
            v.literal("highest"),
          ),
        ),
      ),
      assigneeId: v.optional(v.array(v.id("users"))),
      labels: v.optional(v.array(v.string())),
      sprintId: v.optional(v.id("sprints")),
      epicId: v.optional(v.id("issues")),
    }),
    isPublic: v.boolean(), // Whether other team members can use this filter
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_user", ["userId"])
    .index("by_project_public", ["projectId", "isPublic"]),

  projectTemplates: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.string(), // "software", "marketing", "design", etc.
    icon: v.string(), // Emoji or icon identifier
    boardType: v.union(v.literal("kanban"), v.literal("scrum")),
    workflowStates: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        category: v.union(v.literal("todo"), v.literal("inprogress"), v.literal("done")),
        order: v.number(),
      }),
    ),
    defaultLabels: v.array(
      v.object({
        name: v.string(),
        color: v.string(),
      }),
    ),
    isBuiltIn: v.boolean(), // Built-in templates vs user-created
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_built_in", ["isBuiltIn"]),

  automationRules: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    trigger: v.string(), // Trigger type: "status_changed", "assignee_changed", etc.
    triggerValue: v.optional(v.string()), // Optional trigger value (e.g., specific status)
    actionType: v.string(), // Action: "set_assignee", "add_label", "send_notification", etc.
    actionValue: v.string(), // Action value/params as JSON string
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    executionCount: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_active", ["isActive"])
    .index("by_project_active", ["projectId", "isActive"]),

  customFields: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    fieldKey: v.string(), // Unique key like "customer_id"
    fieldType: v.union(
      v.literal("text"),
      v.literal("number"),
      v.literal("select"),
      v.literal("multiselect"),
      v.literal("date"),
      v.literal("checkbox"),
      v.literal("url"),
    ),
    options: v.optional(v.array(v.string())), // For select/multiselect types
    isRequired: v.boolean(),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_key", ["projectId", "fieldKey"]),

  customFieldValues: defineTable({
    issueId: v.id("issues"),
    fieldId: v.id("customFields"),
    value: v.string(), // Stored as string, parsed based on field type
    updatedAt: v.number(),
  })
    .index("by_issue", ["issueId"])
    .index("by_field", ["fieldId"])
    .index("by_issue_field", ["issueId", "fieldId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(), // "mention", "assigned", "comment", "status_change", etc.
    title: v.string(),
    message: v.string(),
    issueId: v.optional(v.id("issues")),
    projectId: v.optional(v.id("projects")),
    documentId: v.optional(v.id("documents")),
    actorId: v.optional(v.id("users")), // Who triggered the notification
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "isRead"])
    .index("by_user_created", ["userId", "createdAt"]),

  notificationPreferences: defineTable({
    userId: v.id("users"),
    // Master toggles
    emailEnabled: v.boolean(), // Master switch for all email notifications
    // Individual notification type preferences
    emailMentions: v.boolean(), // Send email when @mentioned
    emailAssignments: v.boolean(), // Send email when assigned to issue
    emailComments: v.boolean(), // Send email for comments on my issues
    emailStatusChanges: v.boolean(), // Send email for status changes on watched issues
    // Digest preferences
    emailDigest: v.union(v.literal("none"), v.literal("daily"), v.literal("weekly")),
    digestDay: v.optional(v.string()), // "monday", "tuesday", etc. (for weekly digest)
    digestTime: v.optional(v.string()), // "09:00", "17:00", etc. (24h format)
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  unsubscribeTokens: defineTable({
    userId: v.id("users"),
    token: v.string(),
    createdAt: v.number(),
    usedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  userOnboarding: defineTable({
    userId: v.id("users"),
    onboardingCompleted: v.boolean(),
    onboardingStep: v.optional(v.number()), // Current step (0-5)
    sampleProjectCreated: v.boolean(), // Whether sample project was generated
    tourShown: v.boolean(), // Whether welcome tour was shown
    wizardCompleted: v.boolean(), // Whether project wizard was completed
    checklistDismissed: v.boolean(), // Whether checklist was dismissed
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
