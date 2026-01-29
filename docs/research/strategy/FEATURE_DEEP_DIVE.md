# Nixelo Feature Deep Dive: Competitor Comparison

> **Created:** 2026-01-02
> **Purpose:** Detailed feature-by-feature analysis comparing Nixelo's implementation to competitors (Jira, Linear, Asana, ClickUp, Notion)
> **Format:** Each feature includes: Definition, Competitor Approaches, Nixelo Implementation, Gap Analysis, Recommendations

---

## Table of Contents

1. [Labels / Tags](#1-labels--tags)
2. [Custom Fields](#2-custom-fields)
3. [Workflows / Statuses](#3-workflows--statuses)
4. [Issue Types](#4-issue-types)
5. [Issue Hierarchy (Epics, Sub-tasks)](#5-issue-hierarchy)
6. [Sprints / Cycles](#6-sprints--cycles)
7. [Time Tracking](#7-time-tracking)
8. [Comments & Mentions](#8-comments--mentions)
9. [Notifications](#9-notifications)
10. [Search & Filters](#10-search--filters)
11. [Boards (Kanban)](#11-boards-kanban)
12. [Documents](#12-documents)
13. [Attachments](#13-attachments)
14. [Permissions / RBAC](#14-permissions--rbac)
15. [Integrations](#15-integrations)
16. [API](#16-api)
17. [Audit Logs](#17-audit-logs)
18. [Automation Rules](#18-automation-rules)

---

## 1. Labels / Tags

### What It Is

Colored tags that can be attached to issues for categorization, filtering, and visual identification.

### Competitor Approaches

| Tool        | Term         | Scope             | Storage                                  | Features                                                 |
| ----------- | ------------ | ----------------- | ---------------------------------------- | -------------------------------------------------------- |
| **Jira**    | Labels       | Instance-wide     | Dedicated field, user-created on-the-fly | No colors, free-form text, JQL filterable                |
| **Linear**  | Labels       | Workspace or Team | Separate table with IDs                  | Colors, label groups (exclusive selection), descriptions |
| **Asana**   | Tags         | Workspace-wide    | Separate table                           | Colors, cross-project, searchable                        |
| **ClickUp** | Tags         | Space-level       | Separate table                           | Colors, parent/child tags                                |
| **Notion**  | Multi-select | Per-database      | In-line property                         | Colors, database-scoped                                  |

### Nixelo Implementation

```
Schema:
- labels table: { projectId, name, color, createdBy, createdAt }
- issues.labels: v.array(v.string()) // Stores label NAMES (not IDs)
```

**Current State:**

- ✅ Labels are project-scoped (good isolation)
- ✅ Have colors (like Linear)
- ✅ Separate management table
- ✅ Labels displayed on standalone Issue Detail page
- ⚠️ Issues store label NAMES as strings (not IDs)
- ❌ No label groups
- ❌ No label descriptions

### Gap Analysis

| Feature        | Jira        | Linear | Nixelo | Gap?      |
| -------------- | ----------- | ------ | ------ | --------- |
| Colored labels | ❌          | ✅     | ✅     | ✅ No gap |
| Label groups   | ❌          | ✅     | ❌     | ⚠️ Gap    |
| Project-scoped | ❌ (global) | ✅     | ✅     | ✅ No gap |
| Unique storage | N/A         | IDs    | Names  | 🤔 Minor  |
| Descriptions   | ❌          | ✅     | ❌     | ⚠️ Gap    |

### Recommendations

1. **Add Label Groups** (P2)
   - Like Linear: group labels like "Priority", "Component", "Area"
   - Only one label from a group can be applied
   - Schema: Add `groupId` to labels table, create `labelGroups` table

2. **Add Descriptions** (P3)
   - Simple string field on labels table
   - Shows on hover in UI

3. **Consider ID-based Storage** (P3)
   - Currently storing names is simpler but breaks if labels are renamed
   - Linear stores IDs and enriches on query

---

## 2. Custom Fields

### What It Is

User-defined fields that extend the default issue schema (e.g., "Customer ID", "Story Points", "Due Date").

### Competitor Approaches

| Tool        | Scope               | Field Types                                         | Pricing |
| ----------- | ------------------- | --------------------------------------------------- | ------- |
| **Jira**    | Project or Instance | 20+ types including cascading selects, user pickers | Free    |
| **Linear**  | Team                | Text, Number, Date (limited)                        | Free    |
| **Asana**   | Project or Org      | Text, Number, Date, Currency, Multi-select, People  | Premium |
| **ClickUp** | Space/Folder/List   | 15+ types including formulas, relationships         | Free    |
| **Notion**  | Database            | Relations, Rollups, Formulas                        | Free    |

### Nixelo Implementation

```
Schema:
- customFields table: { projectId, name, fieldKey, fieldType, options, isRequired }
- customFieldValues table: { issueId, fieldId, value (as string) }

Field Types: text, number, select, multiselect, date, checkbox, url
```

**Current State:**

- ✅ Project-scoped
- ✅ 7 field types
- ✅ Required field option
- ❌ No formulas
- ❌ No relations/rollups
- ❌ No user picker type
- ❌ No cascading selects

### Gap Analysis

| Feature             | Jira    | Linear | Nixelo | Gap?              |
| ------------------- | ------- | ------ | ------ | ----------------- |
| Basic types         | ✅      | ✅     | ✅     | ✅ No gap         |
| User picker         | ✅      | ❌     | ❌     | ⚠️ Gap            |
| Formulas            | Plugins | ❌     | ❌     | Acceptable        |
| Relations           | ❌      | ❌     | ❌     | Acceptable        |
| Conditional display | ✅      | ❌     | ❌     | ⚠️ Enterprise gap |

### Recommendations

1. **Add User Picker Type** (P2)
   - Very common need for "Reviewer", "QA", "Designer" fields
   - Store as `v.id("users")`

2. **Improve Story Points Visibility** (✅ Done)
   - Story points now display as a badge on the standalone Issue Detail page.

3. **Add Cascading Select** (P3)
   - Parent/child dropdowns (e.g., Component → Sub-component)

---

## 3. Workflows / Statuses

### What It Is

The lifecycle states an issue moves through (e.g., To Do → In Progress → Done).

### Competitor Approaches

| Tool        | Customization                 | Transitions          | Conditions/Validators                        |
| ----------- | ----------------------------- | -------------------- | -------------------------------------------- |
| **Jira**    | Visual workflow builder       | Explicit transitions | Yes (validators, conditions, post-functions) |
| **Linear**  | Fixed states, custom per team | Implicit (any→any)   | No                                           |
| **Asana**   | Custom sections per project   | Implicit             | Rules engine                                 |
| **ClickUp** | Custom statuses per list      | Implicit             | Automations                                  |

### Nixelo Implementation

```
Schema:
- projects.workflowStates: v.array(v.object({
    id, name, category (todo/inprogress/done), order
  }))
- issues.status: v.string() // References workflowStates.id
```

**Current State:**

- ✅ Custom statuses per project
- ✅ Status categories (todo/inprogress/done)
- ✅ Ordered states
- ❌ No transition rules
- ❌ No validators/conditions
- ❌ Not a visual builder

### Gap Analysis

| Feature           | Jira | Linear | Nixelo | Gap?                             |
| ----------------- | ---- | ------ | ------ | -------------------------------- |
| Custom statuses   | ✅   | ✅     | ✅     | ✅ No gap                        |
| Status categories | ✅   | ✅     | ✅     | ✅ No gap                        |
| Transition rules  | ✅   | ❌     | ❌     | Acceptable (Linear doesn't have) |
| Validators        | ✅   | ❌     | ❌     | Enterprise feature               |
| Visual builder    | ✅   | ❌     | ❌     | Nice-to-have                     |

### Recommendations

1. **Keep Current Simple Model** (Linear-like)
   - Jira's transitions are often seen as overly complex
   - Linear's simplicity is a selling point

2. **Add Optional Transition Rules** (P3, Enterprise)
   - "Only allow Done transition if all subtasks are done"
   - Implement as automationRules integration

---

## 4. Issue Types

### What It Is

Classification of issues (e.g., Bug, Task, Story, Epic).

### Competitor Approaches

| Tool        | Default Types                   | Custom Types | Hierarchy                          |
| ----------- | ------------------------------- | ------------ | ---------------------------------- |
| **Jira**    | Epic, Story, Task, Bug, Subtask | ✅ Yes       | Epic → Story → Subtask             |
| **Linear**  | Issue only (labels for typing)  | ❌           | Cycle, Project, Issue              |
| **Asana**   | Task only                       | ❌           | Project → Section → Task → Subtask |
| **ClickUp** | Task only                       | ❌           | List → Task → Subtask              |

### Nixelo Implementation

```
Schema:
- issues.type: v.union(task, bug, story, epic, subtask)
```

**Current State:**

- ✅ 5 built-in types
- ✅ Type icons
- ❌ No custom issue types
- ❌ Types are hardcoded

### Gap Analysis

| Feature        | Jira | Linear           | Nixelo | Gap?       |
| -------------- | ---- | ---------------- | ------ | ---------- |
| Built-in types | ✅   | ❌ (uses labels) | ✅     | ✅ No gap  |
| Custom types   | ✅   | ❌               | ❌     | Acceptable |
| Type icons     | ✅   | ✅               | ✅     | ✅ No gap  |

### Recommendations

1. **Keep Fixed Types** (Current approach is fine)
   - Linear uses labels instead of types
   - Custom types add complexity without clear value
   - If needed, use custom fields

---

## 5. Issue Hierarchy

### What It Is

Parent-child relationships between issues (Epic → Story → Subtask).

### Competitor Approaches

| Tool        | Hierarchy Levels                  | Implementation          |
| ----------- | --------------------------------- | ----------------------- |
| **Jira**    | Epic → Story → Subtask (3 levels) | epicId, parentId fields |
| **Linear**  | Project → Issue → Sub-issue       | parentId field          |
| **Asana**   | Task → Subtask (2 levels max)     | parentId field          |
| **ClickUp** | Unlimited nesting                 | parentId field          |

### Nixelo Implementation

```
Schema:
- issues.epicId: v.optional(v.id("issues"))
- issues.parentId: v.optional(v.id("issues")) // For sub-tasks
```

**Current State:**

- ✅ Epic linking (epics as special issues)
- ✅ Parent/child for subtasks
- ✅ Subtasks inherit epic from parent
- ❌ Only 2 levels (Epic → Issue → Subtask)

### Gap Analysis

| Feature          | Jira | Linear            | Nixelo | Gap?       |
| ---------------- | ---- | ----------------- | ------ | ---------- |
| Epic linking     | ✅   | ✅ (via projects) | ✅     | ✅ No gap  |
| Subtasks         | ✅   | ✅                | ✅     | ✅ No gap  |
| Epic inheritance | ✅   | N/A               | ✅     | ✅ No gap  |
| 3+ levels        | ✅   | ❌                | ❌     | Acceptable |

### Recommendations

1. **Current Model is Good**
   - Matches Jira's most-used pattern
   - ✅ Recently refined standalone Issue Detail page with dedicated Sub-tasks section.

---

## 6. Sprints / Cycles

### What It Is

Time-boxed iterations for planning and tracking work.

### Competitor Approaches

| Tool        | Term                 | Features                                           |
| ----------- | -------------------- | -------------------------------------------------- |
| **Jira**    | Sprints              | Goals, velocity tracking, burndown, sprint reports |
| **Linear**  | Cycles               | Auto-schedule, cooldown periods, cycle automations |
| **Asana**   | N/A (use milestones) | -                                                  |
| **ClickUp** | Sprints              | Sprint points, automations                         |

### Nixelo Implementation

```
Schema:
- sprints: { projectId, name, goal, startDate, endDate, status }
- issues.sprintId: v.optional(v.id("sprints"))
```

**Current State:**

- ✅ Sprint CRUD
- ✅ Sprint goals
- ✅ Active/future/completed status
- ❌ No velocity tracking
- ❌ No burndown charts
- ❌ No auto-scheduling (like Linear cycles)

### Gap Analysis

| Feature         | Jira | Linear | Nixelo | Gap?              |
| --------------- | ---- | ------ | ------ | ----------------- |
| Basic sprints   | ✅   | ✅     | ✅     | ✅ No gap         |
| Sprint goals    | ✅   | ✅     | ✅     | ✅ No gap         |
| Velocity charts | ✅   | ✅     | ❌     | ⚠️ Gap            |
| Burndown        | ✅   | ❌     | ❌     | Nice-to-have      |
| Auto-schedule   | ❌   | ✅     | ❌     | ⚠️ Linear feature |

### Recommendations

1. **Add Velocity Tracking** (P2)
   - Track story points completed per sprint
   - Show average velocity over time

2. **Add Burndown Charts** (P2)
   - Visual progress tracking within sprints

3. **Consider Auto-Cycles** (P3)
   - Like Linear: automatically create next cycle

---

## 7. Time Tracking

### What It Is

Recording time spent on issues/projects for billing, reporting, and productivity.

### Competitor Approaches

| Tool        | Built-in          | Granularity  | Billing           |
| ----------- | ----------------- | ------------ | ----------------- |
| **Jira**    | Basic (log work)  | Per-issue    | Plugins           |
| **Linear**  | ❌                | -            | -                 |
| **Asana**   | ❌ (integrations) | -            | -                 |
| **ClickUp** | ✅ Full           | Per-task     | ✅                |
| **Kimai**   | ✅ Advanced       | Per-activity | ✅ Full invoicing |

### Nixelo Implementation

```
Schema:
- timeEntries: { userId, projectId, issueId, startTime, endTime, duration, billable, hourlyRate, etc. }
- userRates: { userId, projectId, hourlyRate, currency }
- userProfiles: { employmentType, maxHoursPerWeek, equityHours }
```

**Current State:**

- ✅ Full time tracking
- ✅ Billable/non-billable
- ✅ Hourly rates
- ✅ Equity hours (unique!)
- ✅ Hour compliance tracking
- ❌ No timer widget
- ❌ No invoicing

### Gap Analysis

| Feature       | Jira    | ClickUp | Kimai | Nixelo | Gap?                         |
| ------------- | ------- | ------- | ----- | ------ | ---------------------------- |
| Basic logging | ✅      | ✅      | ✅    | ✅     | ✅ No gap                    |
| Timer         | Plugins | ✅      | ✅    | ❌     | ⚠️ Gap                       |
| Hourly rates  | ❌      | ✅      | ✅    | ✅     | ✅ No gap                    |
| Invoicing     | Plugins | ❌      | ✅    | ❌     | ⚠️ Gap if targeting agencies |
| Equity hours  | ❌      | ❌      | ❌    | ✅     | ✅ Unique!                   |

### Recommendations

1. **Add Timer Widget** (✅ Done)
   - Timer widget implemented in `TimeTracker.tsx`
   - Start/stop timer from issue detail page

2. **Defer Invoicing** (P3)
   - Only if targeting agencies/freelancers
   - Kimai is better for this use case

---

## 8. Comments & Mentions

### What It Is

Discussion threads on issues with @mention notifications.

### Competitor Approaches

| Tool       | Rich Text | Reactions | Threads | Mentions |
| ---------- | --------- | --------- | ------- | -------- |
| **Jira**   | ✅        | ✅        | ❌      | ✅       |
| **Linear** | ✅        | ✅        | ❌      | ✅       |
| **Asana**  | ✅        | ✅        | ✅      | ✅       |
| **Notion** | ✅        | ❌        | ✅      | ✅       |

### Nixelo Implementation

```
Schema:
- issueComments: { issueId, authorId, content, mentions, createdAt }
```

**Current State:**

- ✅ Basic comments
- ✅ @mentions with notifications
- ✅ Emoji Reactions (👍, ❤️, 🔥, etc.) - Just added!
- ⚠️ No rich text (just plain text?)
- ❌ No threads

### Gap Analysis

| Feature   | Jira | Linear | Nixelo     | Gap?       |
| --------- | ---- | ------ | ---------- | ---------- |
| Comments  | ✅   | ✅     | ✅         | ✅ No gap  |
| @mentions | ✅   | ✅     | ✅         | ✅ No gap  |
| Rich text | ✅   | ✅     | ⚠️ Unclear | Check      |
| Reactions | ✅   | ✅     | ❌         | ⚠️ Gap     |
| Threads   | ❌   | ❌     | ❌         | Acceptable |

### Recommendations

1. **Add Reactions** (P2)
   - 👍 👎 ❤️ 🎉 etc.
   - Simple table: `commentReactions: { commentId, userId, emoji }`

2. **Verify Rich Text Support** (P1)
   - Document editor supports it, but do comments?

---

## 9. Notifications

### What It Is

Alerting users about relevant activity (assignments, mentions, status changes).

### Competitor Approaches

| Tool       | In-app | Email | Digests | Mobile Push |
| ---------- | ------ | ----- | ------- | ----------- |
| **Jira**   | ✅     | ✅    | ✅      | ✅          |
| **Linear** | ✅     | ✅    | ✅      | ✅          |
| **Asana**  | ✅     | ✅    | ✅      | ✅          |

### Nixelo Implementation

```
Schema:
- notifications: { userId, type, title, message, isRead, issueId, projectId }
- notificationPreferences: { emailEnabled, emailMentions, emailDigest, etc. }
```

**Current State:**

- ✅ In-app notifications
- ✅ Email notifications (just completed!)
- ✅ Email digests (daily/weekly)
- ✅ Unsubscribe tokens
- ✅ Per-type preferences
- ❌ No mobile push (no mobile app)
- ❌ No Slack/Teams integration

### Gap Analysis

| Feature     | Jira | Linear | Nixelo | Gap?                      |
| ----------- | ---- | ------ | ------ | ------------------------- |
| In-app      | ✅   | ✅     | ✅     | ✅ No gap                 |
| Email       | ✅   | ✅     | ✅     | ✅ No gap                 |
| Digests     | ✅   | ✅     | ✅     | ✅ No gap                 |
| Mobile push | ✅   | ✅     | ❌     | ⚠️ Gap (needs mobile app) |
| Slack       | ✅   | ✅     | ❌     | ⚠️ Gap                    |

### Recommendations

1. **Add Slack Integration** (P2)
   - Already have `pumbleWebhooks` table
   - Extend to Slack

2. **Mobile Push** (P3)
   - Requires mobile app first

---

## 10. Search & Filters

### What It Is

Finding and filtering issues using text search and attribute filters.

### Competitor Approaches

| Tool        | Text Search | Query Language  | Saved Filters |
| ----------- | ----------- | --------------- | ------------- |
| **Jira**    | ✅          | JQL (powerful)  | ✅            |
| **Linear**  | ✅          | Basic filters   | ✅            |
| **Asana**   | ✅          | Advanced search | ✅            |
| **ClickUp** | ✅          | Basic           | ✅            |

### Nixelo Implementation

```
Schema:
- issues search index: search_title (full-text on title)
- savedFilters: { projectId, filters, isPublic }
```

**Current State:**

- ✅ Full-text search on titles
- ✅ Saved filters
- ✅ Public/private saved filters
- ❌ No JQL-like query language
- ❌ Search only on title (not description)

### Gap Analysis

| Feature            | Jira     | Linear | Nixelo | Gap?              |
| ------------------ | -------- | ------ | ------ | ----------------- |
| Text search        | ✅       | ✅     | ✅     | ✅ No gap         |
| Saved filters      | ✅       | ✅     | ✅     | ✅ No gap         |
| Query language     | ✅ (JQL) | ❌     | ❌     | ⚠️ Power user gap |
| Description search | ✅       | ✅     | ❌     | ⚠️ Gap            |

### Recommendations

1. **Add Description Search** (✅ Done)
   - Verified that Convex backend indexes both titles and descriptions.

2. **Consider Simple Query Language** (P3)
   - Not full JQL, but `status:done priority:high`
   - Power user feature

---

## 11. Boards (Kanban)

### What It Is

Visual board view with drag-and-drop columns.

### Competitor Approaches

| Tool        | Board Types    | Swimlanes | WIP Limits |
| ----------- | -------------- | --------- | ---------- |
| **Jira**    | Kanban, Scrum  | ✅        | ✅         |
| **Linear**  | Board view     | ❌        | ❌         |
| **Asana**   | Board view     | ❌        | ❌         |
| **ClickUp** | Multiple views | ❌        | ❌         |

### Nixelo Implementation

```
Schema:
- projects.boardType: kanban | scrum
- projects.workflowStates: columns
- issues.order: position in column
```

**Current State:**

- ✅ Kanban and Scrum modes
- ✅ Drag-and-drop
- ✅ Column ordering
- ❌ No swimlanes
- ❌ No WIP limits

### Gap Analysis

| Feature     | Jira | Linear | Nixelo | Gap?         |
| ----------- | ---- | ------ | ------ | ------------ |
| Basic board | ✅   | ✅     | ✅     | ✅ No gap    |
| Drag-drop   | ✅   | ✅     | ✅     | ✅ No gap    |
| Swimlanes   | ✅   | ❌     | ❌     | Nice-to-have |
| WIP limits  | ✅   | ❌     | ❌     | Nice-to-have |

### Recommendations

1. **Consider WIP Limits** (P3)
   - Popular Kanban feature
   - Warn when column exceeds limit

---

## 12. Documents

### What It Is

Rich-text document editing integrated within the PM tool, enabling teams to maintain wikis, specs, and meeting notes alongside their issues.

### Competitor Approaches

| Tool        | Editor         | Real-time Collab | Versioning      | Permissions        |
| ----------- | -------------- | ---------------- | --------------- | ------------------ |
| **Jira**    | ❌ (Confluence) | ✅ (Confluence)  | ✅ Page history | ✅ Space/page-level |
| **Linear**  | ❌ None         | ❌               | ❌              | ❌                 |
| **Asana**   | ❌ (descriptions) | ❌             | ❌              | ❌                 |
| **ClickUp** | ✅ ClickUp Docs | ✅ Yes          | ⚠️ Basic        | ✅ Doc-level        |
| **Notion**  | ✅ Block editor | ✅ Yes           | ✅ Page history | ✅ Page-level       |

### Nixelo Implementation

```
Schema:
- documents: { title, isPublic, createdBy, organizationId, workspaceId?, projectId?, isDeleted?, deletedAt?, deletedBy? }
- documentVersions: { documentId, version, snapshot (ProseMirror), title, createdBy, changeDescription? }
- Real-time sync via ProseMirror Sync protocol over Convex
```

**Current State:**

- ✅ Full rich-text editor (BlockNote / ProseMirror)
- ✅ Real-time collaborative editing (ProseMirror Sync)
- ✅ Version history with snapshots
- ✅ Public/private document visibility
- ✅ Organization, workspace, and project scoping
- ✅ Soft delete with recoverability
- ✅ Full-text search on titles
- ❌ No document templates
- ❌ No export (PDF, Markdown)
- ❌ No nested page hierarchy (like Notion)

### Gap Analysis

| Feature            | Jira/Confluence | Notion | Nixelo | Gap?            |
| ------------------ | --------------- | ------ | ------ | --------------- |
| Rich text editor   | ✅              | ✅     | ✅     | ✅ No gap       |
| Real-time collab   | ✅              | ✅     | ✅     | ✅ No gap       |
| Version history    | ✅              | ✅     | ✅     | ✅ No gap       |
| Templates          | ✅              | ✅     | ❌     | ⚠️ Gap          |
| Export (PDF/MD)    | ✅              | ✅     | ❌     | ⚠️ Gap          |
| Nested pages       | ✅              | ✅     | ❌     | ⚠️ Gap          |
| Inline databases   | ❌              | ✅     | ❌     | Acceptable      |

### Recommendations

1. **Add Document Templates** (P2)
   - Pre-built templates: Meeting Notes, RFC, Sprint Retro
   - User-created templates from existing docs

2. **Add Export** (P2)
   - Markdown and PDF export from ProseMirror content
   - Important for external sharing

3. **Consider Nested Pages** (P3)
   - Notion-like page hierarchy for wikis
   - Add `parentDocumentId` to documents table

---

## 13. Attachments

### What It Is

File attachments on issues, comments, or documents — images, PDFs, design files, logs, etc.

### Competitor Approaches

| Tool        | Where              | Storage        | Inline Preview | Size Limits          |
| ----------- | ------------------ | -------------- | -------------- | -------------------- |
| **Jira**    | Issues, comments   | Dedicated      | ✅ Images, PDF | 10MB (free), 250MB+  |
| **Linear**  | Issues, comments   | Cloudflare R2  | ✅ Images      | Unlimited (paid)     |
| **Asana**   | Tasks, comments    | Dedicated      | ✅ Images      | 100MB per file       |
| **ClickUp** | Tasks, docs        | Dedicated      | ✅ Images, PDF | 100MB (free), 5GB+   |
| **Notion**  | Blocks (inline)    | S3-backed      | ✅ Everything  | 5MB (free), unlimited |

### Nixelo Implementation

```
Schema:
- No dedicated attachments table
- Files embedded inline via ProseMirror blocks (images, file blocks)
- Convex file storage for uploaded assets
- Issue descriptions and document content support file embedding
```

**Current State:**

- ✅ Inline images in documents (ProseMirror)
- ✅ File uploads via Convex storage
- ⚠️ No dedicated attachment list per issue
- ❌ No drag-and-drop file attachment on issues
- ❌ No attachment previews in issue list view
- ❌ No file size/type restrictions enforced

### Gap Analysis

| Feature              | Jira | Linear | Nixelo | Gap?         |
| -------------------- | ---- | ------ | ------ | ------------ |
| Inline images        | ✅   | ✅     | ✅     | ✅ No gap    |
| Attachment list      | ✅   | ✅     | ❌     | ⚠️ Gap       |
| Drag-and-drop upload | ✅   | ✅     | ❌     | ⚠️ Gap       |
| Preview thumbnails   | ✅   | ✅     | ❌     | ⚠️ Gap       |
| Storage limits       | ✅   | ✅     | ❌     | ⚠️ Enterprise |

### Recommendations

1. **Add Attachment Section to Issues** (P2)
   - Dedicated UI section showing all attached files
   - Drag-and-drop upload zone on issue detail page
   - Schema: Could add `attachments` array to issues or create `issueAttachments` table

2. **File Preview** (P3)
   - Thumbnail previews for images, PDFs
   - Click to expand / download

3. **Storage Limits** (P3, Enterprise)
   - Per-organization storage quotas
   - File size limits per upload

---

## 14. Permissions / RBAC

### What It Is

Role-based access control determining who can view, edit, or admin projects and resources.

### Competitor Approaches

| Tool        | Model                     | Granularity          | Custom Roles |
| ----------- | ------------------------- | -------------------- | ------------ |
| **Jira**    | Permission schemes        | Field/issue/project  | ✅ Yes       |
| **Linear**  | Workspace + Team roles    | Team-level           | ❌ No        |
| **Asana**   | Project-level roles       | Project/task-level   | ❌ No        |
| **ClickUp** | Space/folder/list roles   | Multi-level          | ✅ Yes       |
| **Notion**  | Workspace/teamspace/page  | Page-level           | ❌ No        |

### Nixelo Implementation

```
Schema:
- convex/rbac.ts: ProjectRole = "admin" | "editor" | "viewer"
- convex/projectAccess.ts: Access control logic
- Role hierarchy: viewer (1) < editor (2) < admin (3)
- projects.members[]: { userId, role } array on project
- hasMinimumRole(userRole, requiredRole) utility
```

**Current State:**

- ✅ Three-tier role hierarchy (admin > editor > viewer)
- ✅ Project-level role assignment
- ✅ Role check on every query/mutation (getAuthUserId)
- ✅ Type-safe role definitions
- ❌ No field-level permissions
- ❌ No custom roles
- ❌ No organization-level roles (only project-level)
- ❌ No SSO/SAML

### Gap Analysis

| Feature              | Jira | Linear | Nixelo | Gap?              |
| -------------------- | ---- | ------ | ------ | ----------------- |
| Role hierarchy       | ✅   | ✅     | ✅     | ✅ No gap         |
| Project-level roles  | ✅   | ✅     | ✅     | ✅ No gap         |
| Auth on every action | ✅   | ✅     | ✅     | ✅ No gap         |
| Custom roles         | ✅   | ❌     | ❌     | Acceptable        |
| Field-level perms    | ✅   | ❌     | ❌     | ⚠️ Enterprise gap |
| SSO/SAML             | ✅   | ✅     | ❌     | ⚠️ Enterprise gap |
| Org-level roles      | ✅   | ✅     | ❌     | ⚠️ Gap            |

### Recommendations

1. **Add Organization-Level Roles** (P2)
   - Org owner / org admin / org member
   - Controls who can create projects, invite members
   - Schema: Add role field to organization membership

2. **SSO/SAML** (P3, Enterprise)
   - Critical for enterprise adoption
   - Integrate via @convex-dev/auth providers

3. **Defer Custom Roles** (P4)
   - Three-tier model matches Linear's simplicity
   - Custom roles add significant complexity

---

## 15. Integrations

### What It Is

Connecting the PM tool with external services (Slack, GitHub, CI/CD, calendars, etc.) for automated workflows.

### Competitor Approaches

| Tool        | Marketplace | Webhooks | Native Integrations | API Triggers |
| ----------- | ----------- | -------- | ------------------- | ------------ |
| **Jira**    | 3,000+ apps | ✅       | Bitbucket, Slack    | ✅ Automation |
| **Linear**  | 30+ native  | ✅       | GitHub, Slack, Figma | ✅ Yes       |
| **Asana**   | 200+ apps   | ✅       | Slack, Teams, Zapier | ✅ Rules     |
| **ClickUp** | 100+ apps   | ✅       | GitHub, Slack, Zapier | ✅ Yes      |

### Nixelo Implementation

```
Schema:
- webhooks: { projectId, name, url, events[], secret?, isActive, lastTriggered? }
- webhookExecutions: { webhookId, event, status, requestPayload, responseStatus?, responseBody?, error?, attempts }
- pumbleWebhooks: { userId, projectId?, name, webhookUrl, events[], isActive, sendMentions, sendAssignments, sendStatusChanges, messagesSent, lastMessageAt?, lastError? }
```

**Current State:**

- ✅ Outgoing webhooks with HMAC signing
- ✅ Webhook execution tracking with retry logic
- ✅ Pumble (Slack-like) integration with granular event subscriptions
- ✅ Per-event filtering (issue.created, issue.updated, etc.)
- ✅ Delivery status monitoring
- ❌ No GitHub/GitLab integration
- ❌ No Slack native integration (only Pumble)
- ❌ No calendar sync (Google/Outlook)
- ❌ No Zapier/Make connector

### Gap Analysis

| Feature            | Jira  | Linear | Nixelo | Gap?         |
| ------------------ | ----- | ------ | ------ | ------------ |
| Outgoing webhooks  | ✅    | ✅     | ✅     | ✅ No gap    |
| Webhook monitoring | ✅    | ⚠️     | ✅     | ✅ No gap    |
| Chat integration   | ✅    | ✅     | ⚠️     | ⚠️ Pumble only |
| GitHub integration | ✅    | ✅     | ❌     | ⚠️ Gap       |
| Calendar sync      | ✅    | ❌     | ❌     | Nice-to-have |
| Marketplace        | ✅    | ❌     | ❌     | Long-term    |

### Recommendations

1. **Add Slack Integration** (P1)
   - Extend pumbleWebhooks pattern to Slack incoming webhooks
   - Slash commands for issue creation
   - Notification channels per project

2. **Add GitHub Integration** (P2)
   - PR-to-issue linking
   - Auto-close issues on merge
   - Commit references in issue activity

3. **Google Calendar Sync** (P2)
   - Already have `calendarEvents` table
   - Bi-directional sync for meetings and deadlines

---

## 16. API

### What It Is

Programmatic access to the platform for automation, custom integrations, and third-party tooling.

### Competitor Approaches

| Tool        | API Type        | Auth Method      | Rate Limits       | Docs Quality |
| ----------- | --------------- | ---------------- | ----------------- | ------------ |
| **Jira**    | REST + GraphQL  | OAuth 2.0, API token | Varies by plan | ⭐⭐⭐⭐    |
| **Linear**  | GraphQL         | OAuth 2.0, API key | 1,500 req/hr   | ⭐⭐⭐⭐⭐  |
| **Asana**   | REST            | OAuth 2.0, PAT   | 1,500 req/min    | ⭐⭐⭐⭐    |
| **ClickUp** | REST            | OAuth 2.0, API token | 100 req/min   | ⭐⭐⭐      |

### Nixelo Implementation

```
Schema:
- apiKeys: {
    userId, name, keyHash (SHA-256), keyPrefix (first 8 chars),
    scopes[] ("issues:read", "issues:write", "projects:read"),
    projectId? (optional restriction),
    rateLimit (requests/min, default 100),
    isActive, lastUsedAt?, usageCount,
    expiresAt?, rotatedFromId?, rotatedAt?, revokedAt?
  }
```

**Current State:**

- ✅ API key generation with SHA-256 hashing
- ✅ Scoped permissions (issues:read, issues:write, projects:read, etc.)
- ✅ Per-key rate limiting (configurable requests/min)
- ✅ Key rotation with grace period
- ✅ Usage tracking (count, last used)
- ✅ Optional project restriction
- ✅ Key expiration support
- ❌ No OAuth 2.0 flow
- ❌ No public API documentation
- ❌ No SDKs (JS, Python, etc.)

### Gap Analysis

| Feature            | Jira | Linear | Nixelo | Gap?            |
| ------------------ | ---- | ------ | ------ | --------------- |
| API keys           | ✅   | ✅     | ✅     | ✅ No gap       |
| Scoped permissions | ✅   | ✅     | ✅     | ✅ No gap       |
| Rate limiting      | ✅   | ✅     | ✅     | ✅ No gap       |
| Key rotation       | ✅   | ❌     | ✅     | ✅ Ahead        |
| OAuth 2.0          | ✅   | ✅     | ❌     | ⚠️ Gap          |
| API docs           | ✅   | ✅     | ❌     | ⚠️ Gap          |
| SDKs               | ✅   | ✅     | ❌     | Nice-to-have    |

### Recommendations

1. **Publish API Documentation** (P1)
   - Auto-generate from Convex function signatures
   - Include examples for common workflows

2. **Add OAuth 2.0** (P2, Enterprise)
   - Required for third-party app ecosystem
   - Authorization code flow for web apps

3. **JavaScript SDK** (P3)
   - Typed wrapper around API endpoints
   - npm package for easy integration

---

## 17. Audit Logs

### What It Is

Immutable record of security-relevant actions for compliance, debugging, and accountability.

### Competitor Approaches

| Tool        | Scope            | Retention   | Pricing            | Export       |
| ----------- | ---------------- | ----------- | ------------------ | ------------ |
| **Jira**    | Enterprise-only  | 180 days    | Enterprise plan    | ✅ CSV       |
| **Linear**  | All plans        | 90 days     | Included           | ✅ Yes       |
| **Asana**   | Enterprise-only  | 1 year      | Enterprise plan    | ✅ Yes       |
| **ClickUp** | Enterprise-only  | Varies      | Enterprise plan    | ✅ Yes       |

### Nixelo Implementation

```
Schema:
- auditLogs: {
    action (e.g., "team.create", "project.delete", "member.add"),
    actorId? (userId, optional for system actions),
    targetId (generic string for mixed types),
    targetType ("team", "project", "user", "webhook"),
    metadata? (structured: old values, new values),
    timestamp
  }
- Indexes: by_action, by_actor, by_target, by_timestamp
```

**Current State:**

- ✅ Audit log table with structured schema
- ✅ Actor tracking (who did it)
- ✅ Target tracking (what was affected)
- ✅ Action categorization (team.create, project.delete, etc.)
- ✅ Structured metadata (old/new values)
- ✅ Timestamp indexing for chronological queries
- ❌ No UI for viewing audit logs
- ❌ No retention policy
- ❌ No export functionality
- ❌ No alerting on suspicious activity

### Gap Analysis

| Feature             | Jira | Linear | Nixelo | Gap?            |
| ------------------- | ---- | ------ | ------ | --------------- |
| Action logging      | ✅   | ✅     | ✅     | ✅ No gap       |
| Actor/target track  | ✅   | ✅     | ✅     | ✅ No gap       |
| Structured metadata | ✅   | ✅     | ✅     | ✅ No gap       |
| UI viewer           | ✅   | ✅     | ❌     | ⚠️ Gap          |
| Export              | ✅   | ✅     | ❌     | ⚠️ Gap          |
| Retention policy    | ✅   | ✅     | ❌     | ⚠️ Enterprise   |
| Alerting            | ✅   | ❌     | ❌     | Nice-to-have    |

### Recommendations

1. **Build Audit Log UI** (P2)
   - Filterable table in org settings
   - Filter by actor, action, target type, date range

2. **Add CSV Export** (P2)
   - Required for compliance audits
   - Filter + export workflow

3. **Retention Policy** (P3, Enterprise)
   - Configurable retention (30/90/180/365 days)
   - Auto-archive older entries to cold storage

---

## 18. Automation Rules

### What It Is

If-this-then-that rules that automate repetitive project management actions (status changes, assignments, notifications).

### Competitor Approaches

| Tool        | Builder Type   | Trigger Types          | Action Types                    | Limits           |
| ----------- | -------------- | ---------------------- | ------------------------------- | ---------------- |
| **Jira**    | Visual builder | 40+ triggers           | 30+ actions + smart values      | Unlimited (paid) |
| **Linear**  | Basic rules    | Status/assignee change | Auto-close, auto-assign         | Limited          |
| **Asana**   | Rules engine   | 20+ triggers           | 15+ actions + custom fields     | 50/project (paid)|
| **ClickUp** | Automations    | 50+ triggers           | Extensive actions               | 100-25k/mo       |

### Nixelo Implementation

```
Schema:
- automationRules: {
    projectId, name, description?,
    isActive, trigger, triggerValue?,
    actionType, actionValue (JSON string),
    createdBy, updatedAt, executionCount
  }
- Triggers: "status_changed", "assignee_changed", etc.
- Actions: "set_assignee", "add_label", "send_notification", etc.
- Indexes: by_project, by_active, by_project_active
```

**Current State:**

- ✅ Rule definition with trigger/action pairs
- ✅ Per-project scoping
- ✅ Active/inactive toggle
- ✅ Execution count tracking
- ✅ Multiple trigger and action types
- ❌ No visual rule builder
- ❌ No multi-step automations (only single trigger → single action)
- ❌ No conditional logic (if field X = Y, then...)
- ❌ No scheduled triggers (cron-like)

### Gap Analysis

| Feature             | Jira | Linear | Nixelo | Gap?            |
| ------------------- | ---- | ------ | ------ | --------------- |
| Basic rules         | ✅   | ✅     | ✅     | ✅ No gap       |
| Project-scoped      | ✅   | ✅     | ✅     | ✅ No gap       |
| Execution tracking  | ✅   | ❌     | ✅     | ✅ Ahead        |
| Visual builder      | ✅   | ❌     | ❌     | Nice-to-have    |
| Multi-step chains   | ✅   | ❌     | ❌     | ⚠️ Gap          |
| Conditional logic   | ✅   | ❌     | ❌     | ⚠️ Gap          |
| Scheduled triggers  | ✅   | ❌     | ❌     | Nice-to-have    |

### Recommendations

1. **Add Conditional Logic** (P2)
   - "When status changes to Done AND assignee is X, then add label 'reviewed'"
   - Store conditions as JSON in a `conditions` field

2. **Add Multi-Step Chains** (P3)
   - "When issue created → assign to lead → add to sprint → notify channel"
   - Requires `automationSteps` table or JSON array

3. **Visual Rule Builder** (P3)
   - Drag-and-drop UI for non-technical users
   - Monday.com-style "When X happens, do Y"

---

## Summary: Priority Matrix

### P1 - Must Have (Next 3 months)

| Feature                   | Current Gap | Effort |
| ------------------------- | ----------- | ------ |
| Description search        | ✅ Done     | -      |
| Comment reactions         | ✅ Done     | -      |
| Slack integration         | ❌          | Medium |
| API documentation         | ❌          | Medium |

### P2 - Should Have (Months 4-6)

| Feature                  | Current Gap | Effort |
| ------------------------ | ----------- | ------ |
| Label groups             | ❌          | Medium |
| User picker custom field | ❌          | Medium |
| Velocity charts          | ❌          | Medium |
| Timer widget             | ✅ Done     | -      |
| Document templates       | ❌          | Medium |
| Document export          | ❌          | Medium |
| Attachment section       | ❌          | Medium |
| Org-level roles          | ❌          | Medium |
| GitHub integration       | ❌          | High   |
| Google Calendar sync     | ❌          | High   |
| Audit log UI             | ❌          | Medium |
| Audit log export         | ❌          | Low    |
| Conditional automations  | ❌          | Medium |
| OAuth 2.0                | ❌          | High   |

### P3 - Nice to Have (Months 7-12)

| Feature                | Current Gap | Effort |
| ---------------------- | ----------- | ------ |
| Label descriptions     | ❌          | Low    |
| Query language         | ❌          | High   |
| Swimlanes              | ❌          | Medium |
| WIP limits             | ❌          | Low    |
| Auto-cycles            | ❌          | Medium |
| Nested document pages  | ❌          | High   |
| File previews          | ❌          | Medium |
| SSO/SAML               | ❌          | High   |
| Retention policies     | ❌          | Medium |
| Multi-step automations | ❌          | High   |
| Visual rule builder    | ❌          | High   |
| JavaScript SDK         | ❌          | Medium |
