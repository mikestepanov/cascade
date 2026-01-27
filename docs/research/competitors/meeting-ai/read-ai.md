# Read AI - Competitor Analysis

> **Category:** End-User Meeting Intelligence
> **Type:** Proprietary SaaS
> **Website:** https://www.read.ai

---

## Overview

**Read AI** is an AI meeting assistant with cross-platform search. It is a primary competitor for meeting intelligence features.

## Platforms

- Google Meet
- Zoom
- Microsoft Teams

## Features

- Meeting transcription & recording
- AI-generated summaries
- Action item extraction
- Real-time notes during meetings
- Speaker analytics ("Speaker Coach")
- Email summaries
- Cross-platform search (meetings + emails + chats)
- Chrome extension
- Desktop apps (Windows, macOS)
- Mobile apps (iOS, Android)
- Integrations: Slack, Notion, Salesforce, HubSpot, 20+ others

## Pricing

- **Free:** 5 meetings/month
- **Pro:** ~$20/user/month (estimated)
- **Enterprise:** Custom

## Strengths ✅

- Polished consumer product
- Multi-platform (web, desktop, mobile)
- Strong integrations ecosystem
- Speaker analytics unique feature

## Weaknesses ❌

- Standalone tool - doesn't integrate with PM workflows naturally
- No project management features
- User data lives in their cloud (privacy concern)

## Nixelo Advantage

Native PM integration - action items identified by AI become issues automatically in Nixelo.

## 🧠 Deep Dive: "Scrappable" Features (Added 2026-01-26)

To build a competitive Meeting AI module, we should "scrap" (adopt) these specific interactions from Read AI:

### 1. Engagement & Wellness

- **Engagement Score:** A real-time graph showing if attendees are tuning out (based on talk time/activity).
- **Speaker Coach:** Private, real-time feedback (e.g., _"You've been monologuing for 5 minutes"_ or _"You're talking too fast"_).
- **Sentiment Analysis:** Track positive/negative sentiment per topic to identify contentious decisions.

### 2. The "For Those Who Missed It" Recap

- **Automated Video Highlights:** Auto-clip the 3 most important minutes of the meeting.
- **"What You Missed" Summary:** If a user joins 10 minutes late, privately show them a summary of the first 10 minutes so they don't interrupt to ask "What did I miss?".

### 3. Technical Implementation

- **Audio/Video:** WebRTC for real-time capture.
- **AI Models:** Multi-modal analysis (Audio + Video frames for facial cues).
