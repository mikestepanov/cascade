# Text AI Setup Guide

## Quick Start

### 1. Get Anthropic API Key

1. Visit [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or log in
3. Go to API Keys → Create Key
4. Copy the key (starts with `sk-ant-...`)

### 2. Get Voyage AI API Key (for embeddings)

1. Visit [https://www.voyageai.com/](https://www.voyageai.com/)
2. Sign up (50M tokens/month free)
3. Get your API key from the dashboard

### 3. Set Environment Variables

In Convex dashboard → Settings → Environment Variables:

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
VOYAGE_API_KEY=pa-your-voyage-key-here
```

### 4. Deploy

```bash
pnpm convex deploy
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Anthropic Claude API key |
| `ANTHROPIC_MODEL` | No | Override default model (default: claude-opus-4-5) |
| `VOYAGE_API_KEY` | For embeddings | Voyage AI API key for semantic search |

## Models

### Claude Opus 4.5

- Model ID: `claude-opus-4-5` (alias auto-points to latest)
- Used for: AI Chat
- Best for: Complex reasoning, detailed responses

### Claude Haiku 4.5

- Model ID: `claude-haiku-4-5` (alias auto-points to latest)
- Used for: Suggestions (descriptions, priority, labels)
- Best for: Fast, simple tasks

### Voyage AI voyage-3-lite

- Used for: Embeddings (semantic search)
- Dimensions: 512 (padded to 1536 for compatibility)
- Free tier: 50M tokens/month

## Feature Configuration

### AI Chat

Uses Opus 4.5 by default. Override with:

```bash
ANTHROPIC_MODEL=claude-haiku-4-5  # Use Haiku for cheaper chat
```

### Suggestions

Always uses Haiku 4.5 for cost efficiency. Cached for 1 hour.

### Embeddings / Semantic Search

Requires `VOYAGE_API_KEY`. Without it:
- Semantic search will fail
- Duplicate detection will fail
- Related issues will fail

## Testing

### Verify Setup

```typescript
import { isAIConfigured } from "./convex/ai/config";

if (isAIConfigured()) {
  console.log("AI is ready!");
}
```

### Test Chat

In Convex dashboard → Functions → `ai.chat`:

```json
{
  "message": "Hello, what can you help me with?"
}
```

### Test Embeddings

In Convex dashboard → Functions → `internal.ai.generateEmbedding`:

```json
{
  "text": "Test embedding generation"
}
```

## Cost Management

### Anthropic Pricing (approximate)

| Model | Input | Output |
|-------|-------|--------|
| Opus 4.5 | $15/M tokens | $75/M tokens |
| Haiku 4.5 | $0.25/M tokens | $1.25/M tokens |

### Voyage AI Pricing

- Free tier: 50M tokens/month
- Paid: $0.06/M tokens

### Cost-Saving Tips

1. **Use Haiku for suggestions** - Already configured
2. **Enable caching** - Suggestions are cached by default
3. **Rate limit users** - Built-in rate limits active
4. **Monitor usage** - Check `aiUsage` table

### Set Budget Alerts

In [Anthropic Console](https://console.anthropic.com/):
1. Go to Settings → Billing
2. Set up spending limits and alerts

## Troubleshooting

### "ANTHROPIC_API_KEY not configured"

```bash
# Check in Convex dashboard → Settings → Environment Variables
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### "VOYAGE_API_KEY not configured"

Embeddings require Voyage AI. Set the key or disable semantic search features.

### "Rate limit exceeded"

Wait and retry. Default limits:
- Chat: 10/minute per user
- Suggestions: 20/hour per user
- Semantic search: 30/minute per user

### Invalid API Key

1. Check the key is correctly copied (no extra spaces)
2. Verify the key is active in Anthropic/Voyage dashboard
3. Check the key has necessary permissions

## Security

1. **Never commit API keys** - Use environment variables only
2. **Rotate keys regularly** - Create new keys periodically
3. **Use separate keys** - Different keys for dev/staging/production
4. **Monitor usage** - Watch for unexpected spikes

---

**Related Documentation:**
- [Docs Index](../../README.md)
- [Voice AI Setup](../voice/SETUP.md)

---

*Last Updated: 2025-11-27*
