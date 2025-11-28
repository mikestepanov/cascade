# Voice AI - Meeting Bot

The Voice AI system provides intelligent meeting assistance through automated recording, transcription, and summarization.

## Features

- **Automatic Meeting Joining** - Bot joins meetings at scheduled time
- **Audio Recording** - Captures meeting audio during session
- **Multi-Provider Transcription** - Whisper, Google, Azure, Speechmatics, Gladia
- **AI Summarization** - Claude generates meeting summaries
- **Action Item Extraction** - Automatic action item detection
- **Convex Integration** - Results stored with calendar events

## How It Works

```
1. User schedules recording    →  Convex stores job
2. Bot service picks up job    →  Playwright launches browser
3. Bot joins meeting           →  Appears as "Nixelo Notetaker"
4. Audio captured              →  Recording during meeting
5. Meeting ends                →  Audio sent to transcription
6. Transcript generated        →  Sent to Claude for summary
7. Results stored              →  Back to Convex with event link
```

## Supported Platforms

| Platform | Status | Notes |
|----------|--------|-------|
| Google Meet | Supported | Full support |
| Zoom | Planned | Coming soon |
| Microsoft Teams | Planned | Coming soon |

## Meeting Summary Output

The AI generates structured meeting summaries:

```typescript
interface MeetingSummary {
  executiveSummary: string;      // 2-3 sentence overview
  keyPoints: string[];           // Main discussion points
  actionItems: ActionItem[];     // Tasks with assignees
  decisions: string[];           // Decisions made
  openQuestions: string[];       // Unresolved items
  topics: Topic[];               // Discussion topics
  overallSentiment: string;      // positive/neutral/negative/mixed
}

interface ActionItem {
  description: string;
  assignee?: string;             // Person's name if mentioned
  dueDate?: string;              // Date if mentioned
  priority?: "low" | "medium" | "high";
}
```

## Usage

### Schedule a Recording

```typescript
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

const scheduleRecording = useMutation(api.meetingBot.scheduleRecording);

await scheduleRecording({
  eventId: "calendar-event-id",
  meetingUrl: "https://meet.google.com/xxx-yyyy-zzz",
  platform: "google_meet",
  botName: "Nixelo Notetaker",  // Optional
});
```

### Cancel a Recording

```typescript
const cancelRecording = useMutation(api.meetingBot.cancelRecording);

await cancelRecording({
  recordingId: "recording-id",
});
```

### List Recordings

```typescript
import { useQuery } from "convex/react";

const recordings = useQuery(api.meetingBot.listRecordings, {
  eventId: "calendar-event-id",  // Optional filter
});
```

## Recording Status States

| Status | Description |
|--------|-------------|
| `scheduled` | Waiting for meeting time |
| `joining` | Bot attempting to join |
| `recording` | Bot in meeting, recording audio |
| `processing` | Audio being prepared |
| `transcribing` | Whisper processing audio |
| `summarizing` | Claude generating summary |
| `completed` | All done, results available |
| `cancelled` | User cancelled |
| `failed` | Error occurred |

## Directory Structure

```
bot-service/
├── src/
│   ├── index.ts                    # Express server entry
│   ├── convex-api.ts               # Convex API types
│   ├── bot/
│   │   ├── manager.ts              # Bot job management
│   │   └── google-meet.ts          # Google Meet implementation
│   ├── services/
│   │   ├── transcription.ts        # Transcription orchestration
│   │   ├── summary.ts              # Claude summarization
│   │   ├── convex-client.ts        # Convex HTTP client
│   │   └── transcription-providers/
│   │       ├── index.ts            # Provider registry
│   │       ├── provider.ts         # Provider interface
│   │       ├── speechmatics.ts     # Speechmatics provider
│   │       ├── google.ts           # Google Speech-to-Text
│   │       ├── azure.ts            # Azure Speech Services
│   │       └── gladia.ts           # Gladia provider
│   ├── middleware/
│   │   └── auth.ts                 # API authentication
│   └── utils/
│       └── retry.ts                # Retry utilities
├── package.json
└── README.md

convex/
└── meetingBot.ts                   # Convex functions for bot
```

## Transcription Providers

| Provider | Free Tier | Accuracy | Speed |
|----------|-----------|----------|-------|
| OpenAI Whisper | Pay per use | Excellent | Fast |
| Speechmatics | Limited | Excellent | Fast |
| Google Speech | 60 min/month | Very Good | Fast |
| Azure Speech | 5 hrs/month | Very Good | Fast |
| Gladia | Limited | Good | Fast |

The system automatically rotates between providers based on free tier usage.

## Cost Estimates

| Component | Cost |
|-----------|------|
| Railway (bot server) | ~$5-10/month |
| Whisper API | $0.006/minute |
| Claude API | ~$0.01-0.05/meeting |

**Example: 50 meetings/month @ 45 min average:**
- Whisper: 50 × 45 × $0.006 = $13.50
- Claude: 50 × $0.03 = $1.50
- Railway: ~$5
- **Total: ~$20/month**

## Limitations

- Bot appears as visible participant (not hidden)
- Requires meeting to allow anonymous/guest joins OR authenticated bot account
- Audio capture quality depends on browser capabilities
- Max meeting duration: 4 hours

## UI Component

The `MeetingRecordingSection` component provides the UI:

```typescript
import { MeetingRecordingSection } from "@/components/MeetingRecordingSection";

<MeetingRecordingSection
  eventId={event._id}
  meetingUrl={event.meetingUrl}
  platform={detectPlatform(event.meetingUrl)}
/>
```

Features:
- Platform detection (Google Meet, Zoom, Teams)
- Schedule/cancel recording buttons
- Recording status display
- Integration with calendar events

## Troubleshooting

### Bot fails to join

1. Check if meeting requires authentication
2. Check if meeting has a waiting room
3. Verify the meeting URL format
4. Check bot service logs

### No audio captured

1. Check browser permissions in Playwright config
2. Verify audio elements exist in the meeting page
3. Check for CORS or security restrictions

### Transcription fails

1. Verify transcription provider API key is set
2. Check audio file exists and is valid format
3. Verify file size (providers have limits)

### Summary not generated

1. Verify `ANTHROPIC_API_KEY` is set
2. Check transcript was generated successfully
3. Check Claude API status

---

**Related Documentation:**
- [Setup Guide](./SETUP.md)
- [Architecture](./ARCHITECTURE.md)
- [Text AI](../text/README.md)
- [AI Overview](../README.md)

---

*Last Updated: 2025-11-27*
