# Cascade Workflows & Performance (Convex)

## 1. The "Real-Time" React Loop

_Convex handles data subscriptions automatically._

```mermaid
sequenceDiagram
    actor User
    participant ReactComp as React Component
    participant ConvexClient
    participant ConvexServer

    Note over ReactComp: useQuery(api.tasks.list)
    ReactComp->>ConvexClient: Subscribe
    ConvexClient->>ConvexServer: Open WebSocket
    ConvexServer-->>ReactComp: Initial Data

    Note right of User: User B adds a task...

    ConvexServer-->>ConvexClient: Push Update (Delta)
    ConvexClient-->>ReactComp: Re-render
    Note over ReactComp: UI Updates Instantly
```

## 2. Rapid Prototyping Workflow (Solo Dev)

Cascade is optimized for speed. No migration files.

1.  **Edit Schema**: Add field to `convex/schema.ts`.
    ```typescript
    tasks: defineTable({
      assignedTo: v.optional(v.id("users")), // Added field
    });
    ```
2.  **Save**: `npx convex dev` automatically pushes changes.
3.  **Use**: Field is immediately available in `ctx.db` in your functions.

## 3. Project Management Lifecycle

_Domain: Project Management_

The core loop from Issue Creation to Completion.

```mermaid
sequenceDiagram
    actor User
    participant App
    participant Convex
    participant GitHub
    participant NotificationService

    User->>App: Move Issue "In Progress"
    App->>Convex: mutation(updateStatus)
    Convex->>Convex: Update DB row

    par Side Effects
        Convex->>GitHub: Sync Issue Status (if linked)
        Convex->>NotificationService: Notify Watchers
        NotificationService->>App: In-App Toast
    end
```

## 4. AI Processing Pipeline

_Domain: AI & Meeting Intelligence_

Asynchronous processing of meeting recordings.

```mermaid
sequenceDiagram
    participant Webhook
    participant TransformationAction
    participant LLM as OpenAI/Anthropic
    participant VectorDB
    participant DB

    Webhook->>TransformationAction: New Recording Event
    TransformationAction->>LLM: Transcribe Audio
    LLM-->>TransformationAction: Transcript Text

    TransformationAction->>DB: Save Transcript

    par Analysis
        TransformationAction->>LLM: Generate Summary & Action Items
        TransformationAction->>LLM: Generate Embeddings
        TransformationAction->>VectorDB: Upsert Vectors
    end

    TransformationAction->>DB: Update Meeting Status (COMPLETED)
```

## 5. Offline Sync & Optimistic UI

_Domain: System_

How Cascade handles offline edits without conflicts.

```mermaid
sequenceDiagram
    actor User
    participant Client
    participant SyncQueue
    participant ConvexServer

    User->>Client: Edit Document (Offline)
    Client->>Client: UI Optimistic Update
    Client->>SyncQueue: Push Mutation (PENDING)

    Note right of Client: Connection Restored

    loop SyncQueue
        SyncQueue->>ConvexServer: Execute Mutation
        alt Success
            ConvexServer-->>Client: Confirmed Data
            Client->>SyncQueue: Remove Item
        else Conflict
            ConvexServer-->>Client: Error
            Client->>User: Prompt Resolution
        end
    end
```

## 6. Indexing in Convex

Indexes are defined directly on the table definition in schema.ts.

### Best Practices

- **Search**: Use `.searchIndex` for full-text search (e.g., Task Titles).
- **Vector**: Use `.vectorIndex` for AI embeddings.
- **Equality**: Use `.index` for exact matches (e.g., `by_owner`).

```typescript
// convex/schema.ts
export default defineSchema({
  tasks: defineTable({ ... })
    .index("by_owner", ["ownerId"])           // q.withIndex("by_owner")
    .searchIndex("search_title", {            // q.withSearchIndex("search_title")
       searchField: "title",
       filterFields: ["ownerId"]
    }),
});
```
