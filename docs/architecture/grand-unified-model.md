# Cascade Grand Unified Model

**The Master Schema**

This document provides a single, zoomed-out view of the entire Cascade application state.
It combines all 9 domains (PM, CRM, AI, Dev, etc.) into one massive Entity Relationship Diagram.

```mermaid
erDiagram
    %% --- Organization Domain ---
    ORGANIZATION ||--o{ WORKSPACE : "has"
    ORGANIZATION ||--o{ ORG_MEMBER : "staffs"
    WORKSPACE ||--o{ TEAM : "organizes"
    TEAM ||--o{ PROJECT : "owns"

    ORGANIZATION {
        id _id PK
        string slug
    }

    WORKSPACE {
        id _id PK
        string slug
    }

    %% --- Project Management Domain ---
    PROJECT ||--o{ SPRINT : "cycles"
    PROJECT ||--o{ ISSUE : "tasks"
    PROJECT ||--o{ LABEL : "tags"
    PROJECT ||--o{ SAVED_FILTER : "views"
    ISSUE ||--o{ ISSUE_COMMENT : "discusses"
    ISSUE ||--o{ ISSUE_LINK : "relates"
    ISSUE ||--o{ CUSTOM_FIELD_VALUE : "extensions"

    PROJECT {
        id _id PK
        string key "PROJ"
        json workflowStates
    }

    SPRINT {
        id _id PK
        enum status "ACTIVE|FUTURE"
        id projectId FK "→ Project"
    }

    ISSUE {
        id _id PK
        string title
        id assigneeId FK
        id workspaceId FK "→ Workspace"
    }

    %% --- Agency & CRM Domain ---
    USER_PROFILE ||--o{ TIME_ENTRY : "logs"
    TIME_ENTRY }|--|| PROJECT : "bills"
    BOOKING_PAGE ||--o{ BOOKING : "schedules"
    USER ||--o{ AVAILABILITY_SLOT : "defines"
    USER ||--o{ CALENDAR_EVENT : "attends"

    TIME_ENTRY {
        int duration
        money estimatedCost
    }

    CALENDAR_EVENT {
        timestamp startTime
        timestamp endTime
    }

    %% --- AI & Intelligence Domain ---
    MEETING_RECORDING ||--|| TRANSCRIPT : "generates"
    TRANSCRIPT ||--|| SUMMARY : "analyzes"
    SUMMARY ||--o{ ACTION_ITEM : "extracts"
    USER ||--o{ AI_CHAT : "chats"

    MEETING_RECORDING {
        string meetingUrl
        enum status "PROCESSING"
    }

    SUMMARY {
        string executiveSummary
        string[] decisions
    }

    %% --- Dev Ecosystem Domain ---
    GITHUB_REPO ||--o{ GITHUB_PR : "syncs"
    GITHUB_REPO ||--o{ GITHUB_COMMIT : "syncs"
    ISSUE ||--o{ GITHUB_PR : "linked"
    PROJECT ||--o{ GITHUB_REPO : "connects"

    GITHUB_PR {
        int prNumber
        enum state "OPEN|MERGED"
    }

    %% --- Knowledge Base Domain ---
    DOCUMENT ||--o{ DOCUMENT_VERSION : "history"
    PROJECT ||--o{ DOCUMENT : "wiki"

    DOCUMENT {
        string title
        boolean isPublic
    }

    %% --- System & Templates Domain ---
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ OFFLINE_SYNC_QUEUE : "syncs"
    PROJECT_TEMPLATE ||--o{ PROJECT : "creates"
    ISSUE_TEMPLATE ||--o{ ISSUE : "creates"
    DOCUMENT_TEMPLATE ||--o{ DOCUMENT : "creates"

    NOTIFICATION {
        string type "MENTION"
        boolean isRead
    }

    %% --- Internal Libraries ---
    AUTH_SESSION ||--|| USER : "auth"
    RATE_LIMIT ||--o{ USER : "limits"
    AGGREGATE ||--o{ PROJECT : "counts"
    PRESENCE ||--o{ DOCUMENT : "viewing"

    AGGREGATE {
        string key
        int value
    }
```
