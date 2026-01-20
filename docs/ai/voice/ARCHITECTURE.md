# Voice AI Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Nixelo Application                                │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │  Calendar UI    │───►│  MeetingRecording│───►│  Convex: meetingBot.ts  │  │
│  │  Component      │    │  Section         │    │  - scheduleRecording    │  │
│  └─────────────────┘    └─────────────────┘    │  - cancelRecording      │  │
│                                                 │  - listRecordings       │  │
│                                                 └───────────┬─────────────┘  │
└───────────────────────────────────────────────────────────┬─────────────────┘
                                                            │
                                                            │ HTTP (scheduled job)
                                                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Bot Service (Railway)                                │
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │  Express API    │───►│  Bot Manager    │───►│  Google Meet Bot        │  │
│  │  (index.ts)     │    │  (manager.ts)   │    │  (google-meet.ts)       │  │
│  │                 │    │                 │    │                         │  │
│  │  POST /api/jobs │    │  Job queue      │    │  Playwright browser     │  │
│  │  GET /api/jobs  │    │  Status tracking│    │  Audio capture          │  │
│  └─────────────────┘    └─────────────────┘    └───────────┬─────────────┘  │
│                                                            │                │
│                                                            │ Audio file     │
│                                                            ▼                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Transcription Service                             │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │   │
│  │  │ Whisper │  │Speechm- │  │ Google  │  │  Azure  │  │ Gladia  │   │   │
│  │  │ (OpenAI)│  │atics    │  │ Speech  │  │ Speech  │  │         │   │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │   │
│  │                                                                      │   │
│  │  Provider rotation based on free tier usage                          │   │
│  └──────────────────────────────────┬──────────────────────────────────┘   │
│                                     │                                       │
│                                     │ Transcript                            │
│                                     ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Summary Service (Claude)                          │   │
│  │                                                                      │   │
│  │  - Executive summary                                                 │   │
│  │  - Key points extraction                                             │   │
│  │  - Action item detection                                             │   │
│  │  - Decision tracking                                                 │   │
│  │  - Topic segmentation                                                │   │
│  │  - Sentiment analysis                                                │   │
│  └──────────────────────────────────┬──────────────────────────────────┘   │
│                                     │                                       │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
                                      │ HTTP (results callback)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Nixelo (Convex)                                   │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │  Transcript     │    │  Summary        │    │  Action Items           │  │
│  │  Storage        │    │  Storage        │    │  → Issues (optional)    │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Frontend Layer

**Calendar UI Component**
- Displays calendar events with meeting links
- Shows recording status indicator
- Triggers recording schedule/cancel

**MeetingRecordingSection**
- Platform detection (Google Meet, Zoom, Teams)
- Recording controls UI
- Status display

### 2. Convex Backend

**meetingBot.ts**
```typescript
// Key functions
scheduleRecording()   // Creates recording job
cancelRecording()     // Cancels scheduled job
listRecordings()      // Lists recordings for event
updateRecordingStatus() // Updates status from bot service
```

**Database Tables**
```typescript
meetingRecordings: {
  eventId: Id<"calendarEvents">,
  status: "scheduled" | "joining" | "recording" | ...
  meetingUrl: string,
  platform: "google_meet" | "zoom" | "teams",
  botJobId?: string,
  transcript?: string,
  summary?: MeetingSummary,
  error?: string,
}
```

### 3. Bot Service

**Express API (index.ts)**
```
POST /api/jobs      - Create new bot job
GET  /api/jobs/:id  - Get job status
GET  /api/jobs      - List active jobs
POST /api/jobs/:id/stop - Stop running job
GET  /health        - Health check
```

**Bot Manager (manager.ts)**
- Job queue management
- Status tracking
- Concurrent job limiting
- Error handling and retries

**Google Meet Bot (google-meet.ts)**
- Playwright browser automation
- Meeting join logic
- Audio capture
- Participant detection

### 4. Transcription Service

**Provider Interface**
```typescript
interface TranscriptionProvider {
  name: string;
  isConfigured(): boolean;
  transcribe(audioPath: string): Promise<TranscriptionResult>;
}

interface TranscriptionResult {
  fullText: string;
  segments: TranscriptSegment[];
  language: string;
  modelUsed: string;
  processingTime: number;
  wordCount: number;
  durationMinutes: number;
}
```

**Provider Selection**
1. Query Convex for provider with most free tier remaining
2. Fall back to first configured provider
3. Record usage after transcription

### 5. Summary Service

**Claude Integration**
```typescript
class SummaryService {
  async summarize(transcript: string): Promise<MeetingSummary>;
  async quickSummary(transcript: string): Promise<string>;
}
```

**Output Structure**
```typescript
interface MeetingSummary {
  executiveSummary: string;
  keyPoints: string[];
  actionItems: ActionItem[];
  decisions: string[];
  openQuestions: string[];
  topics: Topic[];
  overallSentiment: "positive" | "neutral" | "negative" | "mixed";
  modelUsed: string;
  promptTokens?: number;
  completionTokens?: number;
  processingTime: number;
}
```

## Data Flow

### Recording Flow

```
1. User clicks "Record" on calendar event
   └─► MeetingRecordingSection.scheduleRecording()

2. Convex creates recording record
   └─► meetingBot.scheduleRecording()
   └─► Status: "scheduled"

3. Convex scheduler triggers at meeting time
   └─► HTTP POST to bot service /api/jobs

4. Bot service creates job
   └─► BotManager.createJob()
   └─► Status: "joining"

5. Playwright joins meeting
   └─► GoogleMeetBot.join()
   └─► Status: "recording"

6. Audio captured during meeting
   └─► Audio buffer accumulated

7. Meeting ends (or manually stopped)
   └─► Status: "processing"

8. Audio sent to transcription
   └─► TranscriptionService.transcribe()
   └─► Status: "transcribing"

9. Transcript sent to Claude
   └─► SummaryService.summarize()
   └─► Status: "summarizing"

10. Results sent back to Convex
    └─► HTTP callback to Convex
    └─► Status: "completed"
```

### Error Handling Flow

```
Error at any step:
└─► Catch error
└─► Log details
└─► Update status to "failed"
└─► Store error message
└─► Notify Convex via callback
```

## Scaling Considerations

### Current Limitations

- Single bot per meeting
- Max 4 hour meeting duration
- Sequential transcription processing
- Single bot service instance

### Future Scaling Options

1. **Multiple Bot Instances**
   - Load balancer for bot service
   - Job distribution across instances

2. **Parallel Processing**
   - Chunk audio for parallel transcription
   - Multiple Claude calls for long meetings

3. **Queue System**
   - Redis/RabbitMQ for job queue
   - Better job distribution

## Security Model

### Authentication

```
Convex → Bot Service:
  - BOT_SERVICE_API_KEY in Authorization header
  - Validated by auth middleware

Bot Service → Convex:
  - HTTP client with Convex URL
  - No additional auth (internal API)
```

### Data Security

- Audio files: Temporary, deleted after processing
- Transcripts: Stored in Convex (encrypted at rest)
- API keys: Environment variables only

### Meeting Privacy

- Bot appears as visible participant
- Name clearly indicates recording
- Meeting host can remove bot

## Monitoring Points

### Key Metrics

| Metric | Location | Purpose |
|--------|----------|---------|
| Job success rate | Bot service logs | Reliability |
| Join time | Bot manager | Performance |
| Transcription time | Transcription service | Cost tracking |
| Summary time | Summary service | Performance |
| Provider usage | Convex serviceUsage table | Cost optimization |

### Log Points

```typescript
// Bot service
console.log(`Job ${jobId}: Status changed to ${status}`);
console.log(`Transcription completed: ${provider} (${duration}min)`);
console.log(`Summary generated: ${tokenCount} tokens`);

// Convex
console.log(`Recording ${id}: Scheduled for ${meetingTime}`);
console.log(`Recording ${id}: Completed successfully`);
```

---

**Related Documentation:**
- [Docs Index](../../README.md)
- [Setup Guide](./SETUP.md)
- [Bot Service Code](../../../bot-service/)

---

*Last Updated: 2025-11-27*
