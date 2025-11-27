# AI Features Overview

Nixelo includes two distinct AI systems that enhance project management and collaboration.

**All AI features use Anthropic Claude exclusively (no OpenAI).**

## AI Systems

### 1. Text AI - Project Assistant

Intelligent text-based assistance for project management.

**Features:**
- AI Chat - Ask questions about projects in natural language
- Semantic Search - Find issues by meaning, not just keywords
- Duplicate Detection - Prevent duplicate issues
- AI Suggestions - Generate descriptions, priority, labels

**Models Used:**
- **Claude Opus 4.5** (`claude-opus-4-5`) - Chat (high quality)
- **Claude Haiku 4.5** (`claude-haiku-4-5`) - Suggestions (fast, cheap)
- **Voyage AI** (`voyage-3-lite`) - Embeddings (50M tokens/month free)

**Documentation:**
- [Text AI Overview](./text/README.md)
- [Text AI Setup](./text/SETUP.md)

---

### 2. Voice AI - Meeting Bot

Automated meeting recording, transcription, and summarization.

**Features:**
- Automatic Meeting Joining - Bot joins at scheduled time
- Audio Recording - Captures meeting audio
- Multi-Provider Transcription - Speechmatics, Gladia, Azure, Google (all with free tiers)
- AI Summarization - Claude generates structured summaries
- Action Item Extraction - Automatic task detection

**Models Used:**
- **Claude Opus 4.5** (`claude-opus-4-5`) - Meeting summarization

**Transcription Providers (Free Tiers):**
| Provider | Free Tier |
|----------|-----------|
| Speechmatics | 8 hrs/month |
| Gladia | 8 hrs/month |
| Azure Speech | 5 hrs/month |
| Google Cloud STT | 1 hr/month |
| **Total** | **22 hrs/month** |

**Documentation:**
- [Voice AI Overview](./voice/README.md)
- [Voice AI Setup](./voice/SETUP.md)
- [Voice AI Architecture](./voice/ARCHITECTURE.md)

---

## Quick Comparison

| Feature | Text AI | Voice AI |
|---------|---------|----------|
| **Input** | Text (issues, queries) | Audio (meetings) |
| **Output** | Suggestions, search results | Transcripts, summaries |
| **AI Provider** | Anthropic Claude | Anthropic Claude |
| **Embedding Provider** | Voyage AI | - |
| **Location** | `convex/ai/` | `bot-service/` |
| **Deployment** | Part of Convex | Separate service |

## Directory Structure

```
docs/ai/
├── README.md           # This file
├── text/
│   ├── README.md       # Text AI overview
│   └── SETUP.md        # Text AI setup guide
└── voice/
    ├── README.md       # Voice AI overview
    ├── SETUP.md        # Voice AI setup guide
    └── ARCHITECTURE.md # Voice AI architecture

convex/ai/              # Text AI backend
├── config.ts           # Claude configuration
├── providers.ts        # Provider abstraction
├── actions.ts          # Chat actions
├── queries.ts          # Data queries
├── mutations.ts        # Chat mutations
├── semanticSearch.ts   # Vector search (Voyage AI)
└── suggestions.ts      # AI suggestions (Haiku)

bot-service/            # Voice AI service
├── src/
│   ├── bot/            # Meeting bot logic
│   ├── services/       # Transcription, summary (Claude)
│   └── ...
└── README.md

src/components/AI/      # Text AI frontend
├── AIChat.tsx
├── AISuggestionsPanel.tsx
└── ...
```

## Environment Variables Summary

### Text AI (Convex)

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-xxxxx        # Claude API key

# Optional
ANTHROPIC_MODEL=claude-opus-4-5  # Override default model (alias)
VOYAGE_API_KEY=pa-xxxxx               # For embeddings/semantic search
```

### Voice AI (Bot Service)

```bash
# Required
BOT_SERVICE_API_KEY=your-secret       # Service authentication
CONVEX_URL=https://xxx.convex.cloud   # Convex connection
ANTHROPIC_API_KEY=sk-ant-xxxxx        # For Claude summaries

# Transcription (at least one)
SPEECHMATICS_API_KEY=xxxxx            # 8 hrs/month free
GLADIA_API_KEY=xxxxx                  # 8 hrs/month free
AZURE_SPEECH_KEY=xxxxx                # 5 hrs/month free
AZURE_SPEECH_REGION=eastus
GOOGLE_SPEECH_CREDENTIALS={...}       # 1 hr/month free
```

### Convex Dashboard

```bash
# For bot service connection
BOT_SERVICE_URL=https://your-bot.railway.app
BOT_SERVICE_API_KEY=your-secret
```

## Getting Started

### Text AI Only

1. Set `ANTHROPIC_API_KEY` in Convex dashboard
2. Optionally set `VOYAGE_API_KEY` for semantic search
3. Deploy: `pnpm convex deploy`
4. Use AI features in the app

See [Text AI Setup](./text/SETUP.md) for details.

### Voice AI Only

1. Deploy bot service to Railway
2. Set environment variables
3. Configure Convex connection
4. Schedule recordings from calendar

See [Voice AI Setup](./voice/SETUP.md) for details.

### Both Systems

1. Set up Text AI first (simpler)
2. Then set up Voice AI
3. Both share `ANTHROPIC_API_KEY`

## Cost Estimates

### Text AI

~$15-80/month for 100 active users:
- Chat (Opus): $15-75
- Suggestions (Haiku): $0.50-2.50
- Embeddings (Voyage): Free

### Voice AI

~$10-20/month for 50 meetings:
- Transcription: Free (22 hrs/month across providers)
- Summarization (Claude): $5-15
- Server (Railway): ~$5

### Combined

~$25-100/month for moderate usage

---

**Related Documentation:**
- [Email System](../email/README.md)
- [Main Project Docs](../../CLAUDE.md)

---

*Last Updated: 2025-11-27*
