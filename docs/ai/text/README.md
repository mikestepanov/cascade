# Text AI - Project Assistant

The Text AI system provides intelligent, text-based assistance for project management in Nixelo.

**All AI features use Anthropic Claude exclusively.**

## Features

### 1. AI Project Assistant (Chat)

Ask questions about your projects in natural language:
- "Show me all high-priority bugs in Sprint 5"
- "What issues are blocking PROJ-123?"
- "Summarize the current sprint progress"

Uses **Claude Opus 4.5** for high-quality responses.

```typescript
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

const chat = useMutation(api.ai.chat);

const response = await chat({
  projectId: "...",
  message: "What are the top priorities this week?",
});
```

### 2. Semantic Issue Search

Find issues by meaning, not just keywords. Automatically discovers similar issues even with different wording.

Uses **Voyage AI** for embeddings (Anthropic's recommended embedding provider).

```typescript
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";

const searchSimilar = useAction(api.ai.semanticSearch.searchSimilarIssues);

const results = await searchSimilar({
  query: "login button not working",
  projectId: "...",
  limit: 10,
});
```

### 3. Related Issues

Automatically find related issues based on semantic similarity.

```typescript
const getRelated = useAction(api.ai.semanticSearch.getRelatedIssues);

const related = await getRelated({
  issueId: "...",
  limit: 5,
});
```

### 4. Duplicate Detection

Prevent duplicate issues by finding similar existing issues before creation.

```typescript
const findDuplicates = useAction(api.ai.semanticSearch.findPotentialDuplicates);

const duplicates = await findDuplicates({
  title: "User can't log in",
  description: "When clicking the login button, nothing happens",
  projectId: "...",
  threshold: 0.85, // High similarity threshold
});
```

### 5. AI Suggestions

Uses **Claude Haiku 4.5** for fast, cost-effective suggestions.

#### Generate Issue Descriptions

```typescript
const suggestDescription = useAction(api.ai.suggestions.suggestIssueDescription);

const description = await suggestDescription({
  title: "Add dark mode",
  type: "task",
  projectId: "...",
});
```

#### Suggest Priority

```typescript
const suggestPriority = useAction(api.ai.suggestions.suggestPriority);

const priority = await suggestPriority({
  title: "Critical bug in payment flow",
  description: "Users can't complete checkout",
  type: "bug",
  projectId: "...",
});
// Returns: "highest"
```

#### Suggest Labels

```typescript
const suggestLabels = useAction(api.ai.suggestions.suggestLabels);

const labels = await suggestLabels({
  title: "Improve homepage performance",
  description: "Page takes 5 seconds to load",
  type: "task",
  projectId: "...",
});
// Returns: ["performance", "frontend", "optimization"]
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (React)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  AIChat     │  │ Suggestions │  │  Semantic Search UI     │  │
│  │  Component  │  │  Panel      │  │                         │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
└─────────┼────────────────┼──────────────────────┼───────────────┘
          │                │                      │
          ▼                ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Convex Backend                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  ai/actions │  │ ai/suggest- │  │  ai/semanticSearch      │  │
│  │  (chat)     │  │ ions        │  │  (vector search)        │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
│         │                │                      │               │
│         ▼                ▼                      ▼               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   Anthropic Claude                          ││
│  │         Opus 4.5 (chat)  |  Haiku 4.5 (suggestions)         ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   Voyage AI (embeddings)                    ││
│  │                   voyage-3-lite (512 dim)                   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
convex/ai/
├── config.ts          # AI provider configuration
├── providers.ts       # Provider abstraction layer
├── actions.ts         # Chat action handlers
├── queries.ts         # Context and data queries
├── mutations.ts       # Chat history mutations
├── semanticSearch.ts  # Vector search functionality
└── suggestions.ts     # AI-powered suggestions

src/components/AI/
├── AIAssistantButton.tsx   # Button to open assistant
├── AIAssistantPanel.tsx    # Side panel container
├── AIChat.tsx              # Chat interface
├── AISuggestionsPanel.tsx  # Suggestions display
├── AIErrorFallback.tsx     # Error boundary fallback
├── config.ts               # Frontend AI config
├── index.ts                # Component exports
└── hooks/
    ├── useAIChat.ts        # Chat hook
    ├── useAISuggestions.ts # Suggestions hook
    └── index.ts            # Hook exports
```

## Models Used

| Feature | Model | Why |
|---------|-------|-----|
| Chat | Claude Opus 4.5 | High quality, best reasoning |
| Suggestions | Claude Haiku 4.5 | Fast, cost-effective |
| Embeddings | Voyage AI voyage-3-lite | Anthropic recommended, 50M tokens/month free |

## Database Tables

| Table | Purpose |
|-------|---------|
| `aiChats` | Chat conversation records |
| `aiMessages` | Individual chat messages |
| `aiSuggestions` | AI-generated suggestions |
| `aiUsage` | Token usage tracking |

## Cost Estimation

Based on Anthropic pricing (as of 2025):

| Operation | Model | Cost |
|-----------|-------|------|
| Chat message | Opus 4.5 | ~$0.015-$0.075 |
| Suggestion | Haiku 4.5 | ~$0.00025-$0.00125 |
| Embedding | Voyage AI | Free (50M tokens/month) |

**Monthly estimate for 100 active users:**
- ~1,000 chat messages (Opus): $15-75
- ~2,000 suggestions (Haiku): $0.50-2.50
- Embeddings: Free
- **Total: ~$15-80/month**

## Rate Limiting

Built-in rate limits protect against abuse:

| Endpoint | Limit |
|----------|-------|
| Semantic search | 30/minute per user |
| AI suggestions | 20/hour per user |
| Chat messages | 10/minute per user |

## Best Practices

### 1. Automatic Embedding Generation

Generate embeddings when creating/updating issues:

```typescript
// In your issue creation mutation
const issueId = await ctx.db.insert("issues", { ...issueData });

// Generate embedding asynchronously
await ctx.scheduler.runAfter(0, internal.ai.generateIssueEmbedding, {
  issueId,
});
```

### 2. Caching

Suggestions are cached using `@convex-dev/action-cache` to reduce API calls and costs.

### 3. User Feedback

Track suggestion acceptance rates:

```typescript
const respondToSuggestion = useMutation(api.ai.suggestions.respondToSuggestion);

await respondToSuggestion({
  suggestionId: "...",
  accepted: true,
});
```

## Troubleshooting

### "Not authenticated" error

Ensure users are logged in before calling AI endpoints. All AI functions check authentication.

### "ANTHROPIC_API_KEY not configured" error

Check environment variables are set in Convex dashboard. See [SETUP.md](./SETUP.md).

### "VOYAGE_API_KEY not configured" error

Voyage AI is required for embeddings/semantic search. Get a free API key from [Voyage AI](https://www.voyageai.com/).

### Slow responses

- Opus 4.5 may take 2-5 seconds for complex queries
- Haiku 4.5 is typically fast (~1-2s)
- Add loading states in UI

---

**Related Documentation:**
- [Setup Guide](./SETUP.md)
- [Voice AI (Meeting Bot)](../voice/README.md)
- [AI Overview](../README.md)

---

*Last Updated: 2025-11-27*
