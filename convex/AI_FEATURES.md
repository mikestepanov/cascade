# AI Features Documentation

## Overview

Cascade now includes powerful AI features powered by OpenAI to enhance your project management experience.

## Features

### 1. **AI Project Assistant (Chat)**
Ask questions about your projects in natural language:
- "Show me all high-priority bugs in Sprint 5"
- "What issues are blocking PROJ-123?"
- "Summarize the current sprint progress"

**Usage:**
```typescript
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

const chat = useMutation(api.ai.chat);

const response = await chat({
  projectId: "...",
  message: "What are the top priorities this week?",
});
```

### 2. **Semantic Issue Search**
Find issues by meaning, not just keywords. Automatically discovers similar issues even with different wording.

**Usage:**
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

### 3. **Related Issues**
Automatically find related issues based on semantic similarity.

**Usage:**
```typescript
const getRelated = useAction(api.ai.semanticSearch.getRelatedIssues);

const related = await getRelated({
  issueId: "...",
  limit: 5,
});
```

### 4. **Duplicate Detection**
Prevent duplicate issues by finding similar existing issues before creation.

**Usage:**
```typescript
const findDuplicates = useAction(api.ai.semanticSearch.findPotentialDuplicates);

const duplicates = await findDuplicates({
  title: "User can't log in",
  description: "When clicking the login button, nothing happens",
  projectId: "...",
  threshold: 0.85, // High similarity threshold
});
```

### 5. **AI Suggestions**

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

## Setup

### 1. Get OpenAI API Key
1. Visit https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-proj-...`)

### 2. Configure Environment Variables
```bash
# In .env.local
OPENAI_API_KEY=sk-proj-your-key-here
```

### 3. Deploy to Convex
```bash
# Set environment variable in Convex dashboard
npx convex env set OPENAI_API_KEY sk-proj-your-key-here

# Or via CLI
pnpm convex deploy
```

## Architecture

### Vector Embeddings
- Uses OpenAI's `text-embedding-3-small` model (1536 dimensions)
- Embeddings stored in `issues.embedding` field
- Automatic generation on issue create/update

### Models Used
- **Chat:** GPT-4o-mini (fast, cost-effective)
- **Embeddings:** text-embedding-3-small
- **Suggestions:** GPT-4o-mini

### Database Tables
- `aiChats` - Chat conversations
- `aiMessages` - Individual messages
- `aiSuggestions` - AI-generated suggestions
- `aiUsage` - Token usage tracking for billing

## Cost Estimation

Based on OpenAI pricing (as of 2025):
- **GPT-4o-mini:** $0.15 / 1M input tokens, $0.60 / 1M output tokens
- **text-embedding-3-small:** $0.02 / 1M tokens

**Typical costs:**
- Chat message: ~$0.001 - $0.005
- Issue embedding: ~$0.0001
- Suggestion: ~$0.001 - $0.003

**Monthly estimate for 100 active users:**
- ~1,000 chat messages: $3-5
- ~5,000 issue embeddings: $0.50
- ~2,000 suggestions: $4-6
- **Total: ~$8-12/month**

## Best Practices

### 1. Automatic Embedding Generation
Call `generateIssueEmbedding` after creating/updating issues:
```typescript
// In your issue creation mutation
const issueId = await ctx.db.insert("issues", { ...issueData });

// Generate embedding asynchronously
await ctx.scheduler.runAfter(0, internal.ai.generateIssueEmbedding, {
  issueId,
});
```

### 2. Rate Limiting
Implement rate limiting for AI endpoints to control costs:
```typescript
import { RateLimiter } from "@convex-dev/rate-limiter";

// Limit to 10 chat messages per user per minute
const limiter = new RateLimiter({
  name: "ai-chat",
  limit: 10,
  period: 60_000, // 1 minute
});
```

### 3. Caching
Cache frequently requested suggestions to reduce API calls.

### 4. User Feedback
Track suggestion acceptance rate to improve prompts:
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

### "OPENAI_API_KEY not set" error
1. Check `.env.local` has the API key
2. In production, set in Convex dashboard: Settings → Environment Variables

### Slow responses
- GPT-4o-mini is fast (~1-2s)
- Consider adding loading states in UI
- Use streaming for chat (future enhancement)

### High costs
- Monitor usage in `aiUsage` table
- Implement rate limiting
- Set monthly budget alerts in OpenAI dashboard

## Future Enhancements

1. **Streaming Chat** - Real-time streaming responses
2. **Multi-model Support** - Claude, Gemini, etc.
3. **Custom Fine-tuning** - Project-specific models
4. **Sprint Planning AI** - Automated sprint recommendations
5. **Risk Detection** - Proactive issue warnings
6. **Code Integration** - Link GitHub commits with AI analysis

## Support

For questions or issues:
1. Check Convex logs: `npx convex logs`
2. Review `aiUsage` table for debugging
3. See OpenAI docs: https://platform.openai.com/docs

---

**Last Updated:** 2025-11-23
**Version:** 1.0.0
