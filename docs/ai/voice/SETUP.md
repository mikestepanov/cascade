# Voice AI Setup Guide

## Overview

The Voice AI system consists of two parts:
1. **Bot Service** - Standalone service that joins meetings (deployed separately)
2. **Convex Functions** - Backend functions for scheduling and storing results

## Quick Start

### 1. Set Up Bot Service

```bash
cd bot-service
pnpm install
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` with your API keys:

```bash
# Bot Service Authentication
BOT_SERVICE_API_KEY=your-secret-key-here

# Convex Connection
CONVEX_URL=https://your-deployment.convex.cloud

# Transcription (at least one required)
OPENAI_API_KEY=sk-proj-xxxxx              # For Whisper

# Summarization (required)
ANTHROPIC_API_KEY=sk-ant-xxxxx            # For Claude
```

### 3. Run Locally

```bash
pnpm dev
```

### 4. Deploy to Railway

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

## Environment Variables

### Required Variables

| Variable | Description |
|----------|-------------|
| `BOT_SERVICE_API_KEY` | Secret key for Convex → Bot authentication |
| `CONVEX_URL` | Your Convex deployment URL |
| `ANTHROPIC_API_KEY` | Claude API key for summarization |

### Transcription Provider Keys

At least one transcription provider is required:

| Variable | Provider | Free Tier |
|----------|----------|-----------|
| `OPENAI_API_KEY` | OpenAI Whisper | Pay per use ($0.006/min) |
| `SPEECHMATICS_API_KEY` | Speechmatics | Limited free tier |
| `GOOGLE_SPEECH_CREDENTIALS` | Google Speech-to-Text | 60 min/month |
| `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` | Azure Speech | 5 hrs/month |
| `GLADIA_API_KEY` | Gladia | Limited free tier |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Bot service port |
| `NODE_ENV` | development | Environment mode |
| `MAX_MEETING_DURATION` | 14400000 | Max duration (4 hours in ms) |

## Convex Configuration

Set these in Convex dashboard → Settings → Environment Variables:

```bash
# Bot Service Connection
BOT_SERVICE_URL=https://your-bot-service.railway.app
BOT_SERVICE_API_KEY=your-secret-key-here  # Same as bot service

# App URL (for callbacks)
SITE_URL=https://your-app.com
```

## Transcription Provider Setup

### OpenAI Whisper (Recommended)

1. Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Set `OPENAI_API_KEY` in bot service

```bash
OPENAI_API_KEY=sk-proj-xxxxx
```

### Google Speech-to-Text

1. Create project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Speech-to-Text API
3. Create service account and download credentials JSON
4. Set environment variable:

```bash
GOOGLE_SPEECH_CREDENTIALS={"type":"service_account",...}
# Or path to credentials file:
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
```

### Azure Speech Services

1. Create Speech resource in [Azure Portal](https://portal.azure.com/)
2. Get key and region from resource

```bash
AZURE_SPEECH_KEY=xxxxx
AZURE_SPEECH_REGION=eastus  # or your region
```

### Speechmatics

1. Sign up at [Speechmatics](https://www.speechmatics.com/)
2. Get API key from dashboard

```bash
SPEECHMATICS_API_KEY=xxxxx
```

### Gladia

1. Sign up at [Gladia](https://www.gladia.io/)
2. Get API key from dashboard

```bash
GLADIA_API_KEY=xxxxx
```

## Provider Rotation

The system automatically rotates between transcription providers based on free tier usage. Configure multiple providers for cost optimization:

```bash
# Primary (used first)
OPENAI_API_KEY=sk-proj-xxxxx

# Secondary (fallback)
GOOGLE_SPEECH_CREDENTIALS={"type":"service_account",...}

# Tertiary
AZURE_SPEECH_KEY=xxxxx
AZURE_SPEECH_REGION=eastus
```

## Deployment Options

### Railway (Recommended)

```bash
# Install CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd bot-service
railway init

# Set environment variables
railway variables set BOT_SERVICE_API_KEY=your-key
railway variables set CONVEX_URL=https://your-deployment.convex.cloud
railway variables set OPENAI_API_KEY=sk-proj-xxxxx
railway variables set ANTHROPIC_API_KEY=sk-ant-xxxxx

# Deploy
railway up
```

### Docker

```dockerfile
FROM node:20-slim

# Install Playwright dependencies
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx playwright install chromium

EXPOSE 3001
CMD ["npm", "start"]
```

### Render / Fly.io

Similar to Railway - create a web service and set environment variables.

## Testing

### Health Check

```bash
curl http://localhost:3001/health
```

### Create Test Job

```bash
curl -X POST http://localhost:3001/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "recordingId": "test-recording-id",
    "meetingUrl": "https://meet.google.com/xxx-yyyy-zzz",
    "platform": "google_meet",
    "botName": "Test Bot"
  }'
```

### Check Job Status

```bash
curl http://localhost:3001/api/jobs/job-id \
  -H "Authorization: Bearer your-api-key"
```

## Security Considerations

1. **API Key Security**
   - Use strong, unique API keys
   - Rotate keys periodically
   - Never commit keys to version control

2. **Network Security**
   - Use HTTPS in production
   - Restrict access to bot service API

3. **Meeting Access**
   - Bot appears as visible participant
   - Users see "Nixelo Notetaker" joined
   - Transparent recording notification

## Troubleshooting

### Bot service won't start

1. Check all required environment variables are set
2. Check Playwright is installed: `npx playwright install`
3. Check Node version (requires 18+)

### Can't connect to Convex

1. Verify `CONVEX_URL` is correct
2. Check Convex deployment is running
3. Verify API key matches on both sides

### Transcription fails

1. Check at least one transcription provider is configured
2. Verify API keys are valid
3. Check provider-specific requirements (credentials format, etc.)

### Bot can't join meeting

1. Check meeting URL format is correct
2. Verify meeting allows anonymous joins
3. Check for waiting room settings
4. Review bot service logs

### Audio not captured

1. Check Playwright browser permissions
2. Verify audio elements are present
3. Check browser console for errors

## Monitoring

### Logs

```bash
# Railway
railway logs

# Local
pnpm dev  # Logs to console
```

### Metrics to Watch

- Job success rate
- Transcription duration
- Summary generation time
- Provider usage (for cost tracking)

---

**Related Documentation:**
- [Voice AI Overview](./README.md)
- [Architecture](./ARCHITECTURE.md)
- [Text AI Setup](../text/SETUP.md)

---

*Last Updated: 2025-11-27*
