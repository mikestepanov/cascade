# Competitor Analysis: Otter.ai

> **Focus:** Real-Time Transcription & Collaboration
> **Vibe:** "The Google Docs of Meetings" - Live, collaborative, ubiquitous.

## 1. Feature Scraping Matrix

| Feature                | Why it's useful                                      | Nixelo's "Configurable Edge"                                                                |
| :--------------------- | :--------------------------------------------------- | :------------------------------------------------------------------------------------------ |
| **OtterPilot**         | Auto-joins meetings so you don't have to.            | **"Ghost Mode":** Join, record, leave audio summary, but don't look like a "bot" user.      |
| **Slide Capture**      | Auto-screenshots shared slides & inserts into notes. | **Context Anchor:** Link slide image to the _code_ being discussed (if screen sharing IDE). |
| **Live Collaboration** | Highlight text _during_ the meeting.                 | **Chat-to-Ticket:** Highlight text -> "Create Jira Issue".                                  |
| **Speaker ID**         | "Who said what" for accountability.                  | **Auto-Assign:** If "Mike" says "I'll do it", auto-assign the resulting task to Mike.       |

## 2. Deep Dive: Otter.ai (The "Standard")

**Why it wins:** First mover advantage, ubiquity, and the "real-time" aspect. Seeing words appear as they are spoken is addictive and builds trust.
**Weakness:** It's a "destination app". You have to go _to_ Otter to read. It doesn't push data _into_ your workflow (Jira/Linear) effectively.

### Technical Architecture

- **Real-Time Stack:** Heavy use of **WebSockets** for streaming audio/text.
- **Diarization:** Audio fingerprinting to distinguish speakers even in noisy environments.
- **Salesforce Integration:**
  - **Mapping:** Maps specific insights to "Opportunity" fields (e.g., "Budget" mentioned -> Updates Salesforce field).
  - **Write-Back:** Can "append" notes to existing contacts vs overwriting.

## 3. Nixelo Strategy

We will **NOT** build a full transcription engine (too expensive/commoditized).
**Strategy:** Integrate with Otter API or use a cheaper transcription provider (Deepgram/Whisper) to power the _Actions_, not the _Reading_.
