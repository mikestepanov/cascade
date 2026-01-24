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

## Summary: Priority Matrix

### P1 - Must Have (Next 3 months)

| Feature                   | Current Gap | Effort |
| ------------------------- | ----------- | ------ |
| Description search        | ❌          | Low    |
| Comment reactions         | ❌          | Low    |
| Verify rich text comments | ⚠️          | Low    |

### P2 - Should Have (Months 4-6)

| Feature                  | Current Gap | Effort |
| ------------------------ | ----------- | ------ |
| Label groups             | ❌          | Medium |
| User picker custom field | ❌          | Medium |
| Velocity charts          | ❌          | Medium |
| Timer widget             | ❌          | Medium |
| Slack integration        | ❌          | Medium |

### P3 - Nice to Have (Months 7-12)

| Feature            | Current Gap | Effort |
| ------------------ | ----------- | ------ |
| Label descriptions | ❌          | Low    |
| Query language     | ❌          | High   |
| Swimlanes          | ❌          | Medium |
| WIP limits         | ❌          | Low    |
| Auto-cycles        | ❌          | Medium |

---

_More features to add: Documents, Attachments, Permissions, Integrations, API, Audit Logs, Automation Rules_

**TODO:** Continue deep dive on remaining 7 features.
