# Competitor Analysis: Meeting Intelligence

> **Focus:** Read AI vs Otter.ai vs Gong
> **Goal:** Identify "scrappable" features for Nixelo's Meeting AI module.

## 1. Executive Summary

| Feature                | Read AI                           | Otter.ai                  | Gong                          |
| :--------------------- | :-------------------------------- | :------------------------ | :---------------------------- |
| **Primary Use Case**   | Meeting Co-pilot & Wellness       | Transcription & Notes     | Revenue Intelligence (Sales)  |
| **Pricing**            | Free / $15 / $22.50               | Free / $8.33 / $20        | ~ $1,400/yr (Enterprise only) |
| **Key Moat**           | "Read the Room" (Sentiment)       | Transcription Accuracy    | Deep CRM/Deal Analytics       |
| **Nixelo Opportunity** | Focus on **Coaching & Sentiment** | Focus on **Action Items** | Focus on **Project Linking**  |

## 2. Deep Dive: Read AI

**Core Value Proposition:**
"Meeting wellness" and real-time coaching. Less about just "what was said" and more about "how it was received."

**Key Features to "Scrap" (Adopt):**

- **Engagement Score:** Real-time graph showing if people are tuning out.
- **Speaker Coach:** Private feedback (e.g., "You're talking too fast" or "Monologue warning").
- **Sentiment Analysis:** Positive/Negative sentiment tracking per topic.
- **Automated Summaries:** "For those who missed it" style recaps.

**Tech Stack:**

- **Audio/Video:** WebRTC for real-time capture.
- **AI Models:** Multi-modal analysis (Audio + Video frames for facial cues).

## 3. Deep Dive: Otter.ai

**Core Value Proposition:**
The "Searchable Voice Recorder" for business. Trusted, simple, everywhere.

**Key Features to "Scrap":**

- **Live Transcript:** Scrolling text during the meeting (highly valued by users).
- **"OtterPilot":** Auto-joins meetings so you don't have to.
- **Slide Capture:** Auto-screenshots shared slides and inserts them into notes.

## 4. Deep Dive: Gong

**Core Value Proposition:**
"Reality" for sales teams. Tells you which deals are _actually_ real based on customer behavior.

**Key Features to "Scrap" (for Enterprise Tier):**

- **Topic Tracker:** "How many minutes did we discuss Pricing vs Features?"
- **Deal Risk:** AI warning if a project/deal has gone "quiet" (no meetings/emails).

## 5. Strategic Recommendations for Nixelo

1.  **Do NOT compete on Transcription:** It's a commodity (Whisper is free).
2.  **Compete on Context:**
    - Link meeting notes directly to **Nixelo Issues**.
    - If a user says "I'll fix the login bug", Nixelo should suggest "Create Issue: Fix login bug".
3.  **The "Dev" Angle:**
    - Like Read AI's "Speaker Coach," build a **"Standup Coach"**: "You spent 5 minutes on yesterday's work, try to focus on blockers."
