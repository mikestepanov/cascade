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

  // Calendar & Scheduling (Agency Features)
  calendarEvents: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(), // Unix timestamp
    endTime: v.number(), // Unix timestamp
    allDay: v.boolean(),
    location: v.optional(v.string()),
    eventType: v.union(
      v.literal("meeting"), // Team or client meetings
      v.literal("deadline"), // Project deadlines
      v.literal("timeblock"), // Focus time blocks
      v.literal("personal"), // Personal events
    ),
    // Attendees
    organizerId: v.id("users"),
    attendeeIds: v.array(v.id("users")), // Internal team members
    externalAttendees: v.optional(v.array(v.string())), // External emails
    // Links
    projectId: v.optional(v.id("projects")), // Link to project
    issueId: v.optional(v.id("issues")), // Link to issue
    // Status
    status: v.union(v.literal("confirmed"), v.literal("tentative"), v.literal("cancelled")),
    // Recurrence
    isRecurring: v.boolean(),
    recurrenceRule: v.optional(v.string()), // RRULE format (e.g., "FREQ=WEEKLY;BYDAY=MO,WE,FR")
    // Meeting details
    meetingUrl: v.optional(v.string()), // Zoom, Meet, etc.
    notes: v.optional(v.string()),
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organizer", ["organizerId"])
    .index("by_project", ["projectId"])
    .index("by_issue", ["issueId"])
    .index("by_start_time", ["startTime"])
    .index("by_status", ["status"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["organizerId", "projectId", "status"],
    }),

  // User availability for booking (Cal.com-style)
  availabilitySlots: defineTable({
    userId: v.id("users"),
    dayOfWeek: v.union(
      v.literal("monday"),
      v.literal("tuesday"),
      v.literal("wednesday"),
      v.literal("thursday"),
      v.literal("friday"),
      v.literal("saturday"),
      v.literal("sunday"),
    ),
    startTime: v.string(), // 24h format like "09:00"
    endTime: v.string(), // 24h format like "17:00"
    isActive: v.boolean(),
    timezone: v.string(), // IANA timezone like "America/New_York"
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_day", ["userId", "dayOfWeek"])
    .index("by_active", ["isActive"]),

  // Booking pages (Cal.com-style)
  bookingPages: defineTable({
    userId: v.id("users"),
    slug: v.string(), // Unique URL slug like "john-doe" or "team-discovery"
    title: v.string(), // e.g., "30 Minute Discovery Call"
    description: v.optional(v.string()),
    duration: v.number(), // Duration in minutes
    // Availability settings
    bufferTimeBefore: v.number(), // Minutes before meeting
    bufferTimeAfter: v.number(), // Minutes after meeting
    minimumNotice: v.number(), // Minimum hours notice required
    maxBookingsPerDay: v.optional(v.number()),
    // Meeting settings
    location: v.union(
      v.literal("phone"),
      v.literal("zoom"),
      v.literal("meet"),
      v.literal("teams"),
      v.literal("in-person"),
      v.literal("custom"),
    ),
    locationDetails: v.optional(v.string()), // Phone number, Zoom link, address, etc.
    // Questions for booker
    questions: v.optional(
      v.array(
        v.object({
          label: v.string(),
          type: v.union(v.literal("text"), v.literal("email"), v.literal("phone")),
          required: v.boolean(),
        }),
      ),
    ),
    // Settings
    isActive: v.boolean(),
    requiresConfirmation: v.boolean(), // Manual approval
    color: v.string(), // Calendar color hex
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_slug", ["slug"])
    .index("by_active", ["isActive"]),

  // Scheduled bookings
  bookings: defineTable({
    bookingPageId: v.id("bookingPages"),
    hostId: v.id("users"), // Person being booked
    // Booker information
    bookerName: v.string(),
    bookerEmail: v.string(),
    bookerPhone: v.optional(v.string()),
    bookerAnswers: v.optional(v.string()), // JSON string of question answers
    // Meeting details
    startTime: v.number(), // Unix timestamp
    endTime: v.number(), // Unix timestamp
    timezone: v.string(), // Booker's timezone
    location: v.string(),
    locationDetails: v.optional(v.string()),
    // Status
    status: v.union(
      v.literal("pending"), // Awaiting confirmation
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed"),
    ),
    cancelledBy: v.optional(v.union(v.literal("host"), v.literal("booker"))),
    cancellationReason: v.optional(v.string()),
    // Links to created event
    calendarEventId: v.optional(v.id("calendarEvents")),
    // Reminders
    reminderSent: v.boolean(),
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_booking_page", ["bookingPageId"])
    .index("by_host", ["hostId"])
    .index("by_email", ["bookerEmail"])
    .index("by_start_time", ["startTime"])
    .index("by_status", ["status"])
    .index("by_host_status", ["hostId", "status"]),

  // External calendar connections (Google, Outlook)
  calendarConnections: defineTable({
    userId: v.id("users"),
    provider: v.union(v.literal("google"), v.literal("outlook")),
    providerAccountId: v.string(), // Email/account ID from provider
    // OAuth tokens (encrypted in production)
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    // Settings
    syncEnabled: v.boolean(),
    syncDirection: v.union(
      v.literal("import"), // Only import from external calendar
      v.literal("export"), // Only export to external calendar
      v.literal("bidirectional"), // Two-way sync
    ),
    lastSyncAt: v.optional(v.number()),
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_provider", ["provider"])
    .index("by_user_provider", ["userId", "provider"]),

  // GitHub Integration
  githubConnections: defineTable({
    userId: v.id("users"),
    githubUserId: v.string(), // GitHub user ID
    githubUsername: v.string(), // GitHub username
    // OAuth tokens
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_github_user", ["githubUserId"]),

  githubRepositories: defineTable({
    projectId: v.id("projects"),
    repoOwner: v.string(), // Repository owner (org or user)
    repoName: v.string(), // Repository name
    repoFullName: v.string(), // "owner/repo"
    repoId: v.string(), // GitHub repository ID
    // Settings
    syncPRs: v.boolean(), // Sync pull requests
    syncIssues: v.boolean(), // Sync GitHub issues (optional)
    autoLinkCommits: v.boolean(), // Auto-link commits that mention issue keys
    // Metadata
    linkedBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_repo_id", ["repoId"])
    .index("by_repo_full_name", ["repoFullName"]),

  githubPullRequests: defineTable({
    issueId: v.optional(v.id("issues")), // Linked Cascade issue
    projectId: v.id("projects"),
    repositoryId: v.id("githubRepositories"),
    // GitHub PR data
    prNumber: v.number(),
    prId: v.string(), // GitHub PR ID
    title: v.string(),
    body: v.optional(v.string()),
    state: v.union(v.literal("open"), v.literal("closed"), v.literal("merged")),
    mergedAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
    // Author
    authorUsername: v.string(),
    authorAvatarUrl: v.optional(v.string()),
    // Links
    htmlUrl: v.string(), // GitHub PR URL
    // Status checks
    checksStatus: v.optional(
      v.union(v.literal("pending"), v.literal("success"), v.literal("failure")),
    ),
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_issue", ["issueId"])
    .index("by_project", ["projectId"])
    .index("by_repository", ["repositoryId"])
    .index("by_pr_id", ["prId"])
    .index("by_repository_pr_number", ["repositoryId", "prNumber"]),

  githubCommits: defineTable({
    issueId: v.optional(v.id("issues")), // Auto-linked via commit message
    projectId: v.id("projects"),
    repositoryId: v.id("githubRepositories"),
    // GitHub commit data
    sha: v.string(), // Commit SHA
    message: v.string(),
    authorUsername: v.string(),
    authorAvatarUrl: v.optional(v.string()),
    htmlUrl: v.string(), // GitHub commit URL
    committedAt: v.number(),
    // Metadata
    createdAt: v.number(),
  })
    .index("by_issue", ["issueId"])
    .index("by_project", ["projectId"])
    .index("by_repository", ["repositoryId"])
    .index("by_sha", ["sha"]),

  // Offline sync queue
  offlineSyncQueue: defineTable({
    userId: v.id("users"),
    mutationType: v.string(), // e.g., "issues.update", "issues.create"
    mutationArgs: v.string(), // JSON string of mutation arguments
    status: v.union(
      v.literal("pending"), // Waiting to be synced
      v.literal("syncing"), // Currently syncing
      v.literal("completed"), // Successfully synced
      v.literal("failed"), // Failed to sync (will retry)
    ),
    attempts: v.number(), // Number of sync attempts
    lastAttempt: v.optional(v.number()),
    error: v.optional(v.string()), // Error message if failed
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
