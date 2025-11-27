# Cascade Meeting Bot Service

A Playwright-based bot service that joins Google Meet meetings, records audio, and processes it through Whisper (transcription) and Claude (summarization).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Cascade (Convex)                        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐ │
│  │  Calendar   │───►│  Recording  │───►│  Bot Job Queue  │ │
│  │   Events    │    │   Records   │    │  (Scheduler)    │ │
│  └─────────────┘    └─────────────┘    └────────┬────────┘ │
└────────────────────────────────────────────────┬───────────┘
                                                 │
                                                 ▼ HTTP
┌─────────────────────────────────────────────────────────────┐
│              Bot Service (Railway)                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐ │
│  │  Express    │───►│  Playwright │───►│  Google Meet    │ │
│  │  API        │    │  Bot        │    │  (Browser)      │ │
│  └─────────────┘    └──────┬──────┘    └─────────────────┘ │
│                            │                                │
│                            ▼                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐ │
│  │  Audio      │───►│  Whisper    │───►│  Claude         │ │
│  │  Capture    │    │  (OpenAI)   │    │  (Anthropic)    │ │
│  └─────────────┘    └─────────────┘    └────────┬────────┘ │
└─────────────────────────────────────────────────┬──────────┘
                                                  │
                                                  ▼ HTTP
┌─────────────────────────────────────────────────────────────┐
│                     Cascade (Convex)                        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐ │
│  │ Transcript  │    │  Summary    │    │  Action Items   │ │
│  │  Storage    │    │  Storage    │    │  → Issues       │ │
│  └─────────────┘    └─────────────┘    └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Setup

### 1. Install Dependencies

```bash
cd bot-service
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys
```

Required environment variables:
- `BOT_SERVICE_API_KEY` - Secret key for authenticating Convex → Bot requests
- `CONVEX_URL` - Your Convex deployment URL
- `OPENAI_API_KEY` - For Whisper transcription
- `ANTHROPIC_API_KEY` - For Claude summarization

### 3. Run Locally

```bash
pnpm dev
```

### 4. Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

## API Endpoints

### `POST /api/jobs`
Create a new bot job to join a meeting.

```json
{
  "jobId": "optional-job-id",
  "recordingId": "convex-recording-id",
  "meetingUrl": "https://meet.google.com/xxx-yyyy-zzz",
  "platform": "google_meet",
  "botName": "Cascade Notetaker",
  "callbackUrl": "https://your-convex-url.convex.cloud"
}
```

### `GET /api/jobs/:jobId`
Get status of a specific job.

### `GET /api/jobs`
List all active jobs.

### `POST /api/jobs/:jobId/stop`
Stop a running bot job.

### `GET /health`
Health check endpoint.

## Supported Platforms

- ✅ Google Meet
- 🔜 Zoom (planned)
- 🔜 Microsoft Teams (planned)

## How It Works

1. **Convex schedules a job** via `ctx.scheduler.runAt()`
2. **Bot service receives the job** via HTTP POST
3. **Playwright launches Chrome** and navigates to the meeting
4. **Bot joins as "Cascade Notetaker"** (visible participant)
5. **Audio is captured** during the meeting
6. **When meeting ends**, audio is sent to Whisper for transcription
7. **Transcript is sent to Claude** for summarization
8. **Results are saved back to Convex** via HTTP mutations

## Cost Estimates

| Component | Cost |
|-----------|------|
| Railway (bot server) | ~$5-10/mo |
| Whisper API | $0.006/min |
| Claude API | ~$0.01-0.05/meeting |

For 50 meetings/month @ 45 min average:
- Whisper: 50 × 45 × $0.006 = $13.50
- Claude: 50 × $0.03 = $1.50
- Railway: ~$5
- **Total: ~$20/month**

## Limitations

- Bot appears as visible participant (not hidden)
- Requires meeting to allow anonymous/guest joins OR authenticated bot account
- Audio capture quality depends on browser capabilities
- Max meeting duration: 4 hours

## Troubleshooting

### Bot fails to join

1. Check if meeting requires authentication
2. Check if meeting has a waiting room
3. Verify the meeting URL format

### No audio captured

1. Check browser permissions in Playwright config
2. Verify audio elements exist in the meeting page
3. Check for CORS or security restrictions

### Transcription fails

1. Verify OPENAI_API_KEY is set
2. Check audio file exists and is valid format
3. Verify file size (Whisper has limits)
