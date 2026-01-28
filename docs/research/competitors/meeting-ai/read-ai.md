# Competitor Analysis: Read AI

> **Focus:** Engagement & Wellness
> **Vibe:** "The Fitbit for Meetings" - Metrics, scores, and health.

## 1. Feature Scraping Matrix

| Feature                     | Why it's useful                               | Nixelo's "Configurable Edge"                                                                 |
| :-------------------------- | :-------------------------------------------- | :------------------------------------------------------------------------------------------- |
| **Engagement Score**        | Validates if the meeting was a waste of time. | **"Meeting Cost"**: Real-time ticker showing $$$ burn per minute based on attendee salaries. |
| **Speaker Coach**           | Private feedback to improve soft skills.      | **"Interrupt Blocker":** Private nudge if a Senior Dev keeps interrupting Juniors.           |
| **For Those Who Missed It** | "What you missed" video clips.                | **"Async Standup":** Auto-post a 30s summary of _your_ update to Slack if you miss standup.  |

## 2. Deep Dive: Read AI (The "Metric" Layer)

**Why it wins:** It gamifies meetings. "Engagement scores" give managers a concrete metric to judge meeting quality.
**Weakness:** "Privacy creepiness". Users feel judged by the AI.

### Technical Implementation

- **Engagement Calc:** Weighted formula of: Pacing + Filler Words + Head Movement (Computer Vision) + Eye Contact.
- **Technicals:**
  - **Audio:** OpenAI Whisper for text.
  - **NLP:** SpaCy/NLTK for "hedging language" detection (e.g., "kind of", "maybe").
  - **Vision:** OpenCV/YOLO for facial sentiment analysis.
- **Real-Time:** Processes streams to give live feedback (requires low-latency inference).

## 3. Nixelo Strategy

We scrap the **"Metrics"** but apply them to **Process**, not **People**.

- Don't score the _person_ ("Mike used 50 filler words").
- Score the _meeting_ ("This planning session had 80% engagement").
- **Differentiation:** Focus on **"Wellness"** (preventing burnout) rather than **"Performance"** (policing speech).
