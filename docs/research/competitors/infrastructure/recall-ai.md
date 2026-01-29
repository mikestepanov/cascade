# Recall.ai - Infrastructure Analysis

> **Last Updated:** 2026-01-28
> **Category:** Infrastructure / Meeting Bot API
> **Type:** Paid API (Bot-as-a-Service)
> **Website:** https://www.recall.ai

---

## Overview

**Recall.ai** is a unified API for meeting bots and recording infrastructure. You call their API, and they spin up a fully managed bot that joins the meeting to capture audio, video, transcriptions, and participant metadata. The platform is the market leader in the meeting bot API space, trusted by major companies including HubSpot, ClickUp, and Rippling as core recording infrastructure. Recall.ai closed a $38M Series B in September 2025 led by Bessemer Venture Partners, bringing total funding to $51M at a $250M valuation and establishing an estimated $10M ARR with 300+ enterprise clients.

Recall.ai is Nixelo's **current infrastructure provider** for the Voice AI meeting bot service (bot-service/). The platform handles all the complexity of joining meetings across multiple video conferencing platforms, managing bot lifecycle, and delivering recordings and transcripts back to Nixelo for processing into action items and meeting intelligence.

---

## Platforms Supported

| Platform | Status | Notes |
|----------|--------|-------|
| Zoom | Supported | Full audio/video, participant metadata |
| Google Meet | Supported | Full audio/video, participant metadata |
| Microsoft Teams | Supported | Full audio/video, participant metadata |
| Webex | Supported | Enterprise meeting platform coverage |
| Slack Huddles | Supported | Informal meeting coverage |
| GoTo Meeting | Supported | Legacy platform support |

---

## Pricing

| Component | Cost | Details |
|-----------|------|---------|
| **Recording** | $0.50/hour | Core bot recording fee |
| **Transcription** | $0.15/hour | Optional add-on |
| **Storage** | Free (7 days) | Then $0.05/hour/month |
| **Free Tier** | 5 hours | Initial testing allocation |
| **Billing** | Per-second proration | No rounding to nearest minute |
| **Commitment** | None | Pay-as-you-go, no contracts required |
| **Enterprise** | Custom | Volume discounts, dedicated support |

### Pricing Analysis

At $0.50/hour for recording plus $0.15/hour for transcription, a typical meeting costs approximately $0.65/hour in total. At scale, this adds up: 1,000 hours of meetings per month would cost approximately $650/month ($500 recording + $150 transcription). Storage costs compound if recordings are retained beyond 7 days ($0.05/hour/month). Per-second billing proration is a unique advantage that prevents overpaying for short meetings. Enterprise volume discounts are available but require contacting the sales team. Compared to alternatives, Recall.ai is more expensive than Skribby ($0.35/hr all-in) and Meeting BaaS ($0.69/hr hosted but $0.066/hr self-hosted), but the premium covers broader platform support, enterprise compliance, and proven reliability.

---

## Core Features

### Meeting Bot API (★★★★★)
- Custom bot name via `bot_name` parameter (e.g., "Nixelo Notetaker")
- Bot joins meeting and captures audio, video, and screen share
- Participant metadata including emails, names, join/leave times
- Meeting titles, screen share events, and active speaker changes
- Per-second billing proration for cost efficiency

### Real-time Streaming (★★★★★)
- WebSocket connections for live audio and video streaming
- Separate or mixed participant audio streams
- Mixed video stream for observer rooms or real-time AI processing
- Sub-second latency for real-time transcription delivery via webhooks

### Output Media (★★★★☆)
- Bot can respond directly in meetings with audio/video output
- Context-aware responses using real-time chat and participant feeds
- Enables building of interactive AI agents in meetings

### Desktop Recording SDK (★★★★☆)
- Record on-device from Mac or Windows without a bot joining the call
- Captures meeting audio, video, system audio, and screen share
- Supports Zoom, Google Meet, Teams, Slack Huddles, and in-person meetings
- npm package: `@recallai/desktop-sdk`
- One-day integration claim

### Transcription (★★★★☆)
- Built-in transcription at $0.15/hour
- Real-time transcription via AssemblyAI and Deepgram integrations
- 30+ language support including multi-language detection within meetings
- Desktop SDK supports real-time transcription with multiple providers

### Webhooks & Events (★★★★★)
- Dashboard webhooks for bot status changes (e.g., `in_waiting_room`, `call_ended`)
- Real-time webhook endpoints configured per-bot in Create Bot request
- Powered by Svix webhook infrastructure for enterprise-grade delivery
- 60 automatic retries with 1-second intervals per event
- Handles tens of thousands of events within very short timeframes

---

## Strengths

1. **Zero Maintenance:** Recall.ai handles all platform UI changes, API updates, and bot infrastructure; no engineering effort required to maintain meeting integrations.
2. **Broadest Platform Support:** 6 platforms (Zoom, Meet, Teams, Webex, Slack Huddles, GoTo Meeting) covered by a single API.
3. **Enterprise-Grade Reliability:** 99.9% uptime SLA with proven scale at 300+ enterprise clients including HubSpot, ClickUp, and Rippling.
4. **Comprehensive Compliance:** SOC2, ISO 27001, GDPR, CCPA, and HIPAA certifications with BAA agreements for healthcare use cases.
5. **Simple REST API:** Straightforward integration with minimal code required to deploy a meeting bot.
6. **Dual Recording Modes:** Meeting Bot API for in-call recording plus Desktop Recording SDK for device-level capture without visible bots.

---

## Weaknesses

1. **Cost at Scale:** $0.65/hour total cost means $650/month for 1,000 hours of meetings, plus storage fees for retention beyond 7 days.
2. **Black Box Infrastructure:** No visibility into or control over bot behavior internals; dependent on Recall.ai's implementation decisions.
3. **Vendor Dependency:** Full reliance on Recall.ai's uptime, pricing decisions, and feature roadmap with no migration path.
4. **No Self-Hosting Option:** Fully managed only; no on-premises or self-hosted deployment available.
5. **Storage Costs Compound:** Free storage for 7 days only; long-term retention at $0.05/hour/month adds up for compliance-focused organizations.
6. **Limited Transcription Providers:** Desktop SDK currently supports only AssemblyAI and Deepgram for real-time transcription.

---

## Compliance & Security

| Certification | Status | Details |
|---------------|--------|---------|
| SOC2 Type II | Certified | Enterprise security audit |
| ISO 27001:2022 | Certified | Information security management |
| GDPR | Compliant | Data protection regulation |
| CCPA | Compliant | California consumer privacy |
| HIPAA | Compliant | BAA agreements available for healthcare |

### Data Handling
- **Zero-Data Retention:** Option available for sensitive use cases
- **Data Residency:** Regional endpoint selection (us-west-2, us-east-1, eu-central-1, ap-northeast-1)
- **Recording Consent:** Built-in consent features for compliance
- **SSO:** Single sign-on for enterprise account management
- **Encryption:** Data encrypted in transit and at rest
- **Storage:** Configurable retention with customer-controlled deletion

---

## Integration Strategy

### API Design
- RESTful API with JSON payloads
- Regional endpoints for data residency compliance
- Bot lifecycle management (create, monitor, remove)
- Real-time webhook delivery for status changes and transcription events
- Per-bot configuration for custom names, transcription settings, and webhook URLs

### SDKs & Libraries
- **Desktop Recording SDK** - npm package (`@recallai/desktop-sdk`) for Mac/Windows
- Stable and nightly release channels
- RESTful API accessible from any language with HTTP client
- No language-specific server SDKs (API is simple enough for direct HTTP calls)

### Webhook Architecture (Svix-Powered)
- Two webhook types: Dashboard (global) and Real-time (per-bot)
- Dashboard webhooks configured in Recall.ai admin UI
- Real-time webhooks specified in Create Bot request payload
- 60 retry attempts per event with 1-second intervals
- Best practice: enqueue events immediately, process asynchronously (Redis, SQS, RabbitMQ)

### Real-time Streaming
- WebSocket connections for live audio and video data
- Binary-encoded audio/video frames at high frequency
- Suitable for observer rooms, deepfake detection, real-time AI processing

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| API Style | RESTful with JSON |
| SDKs | Desktop SDK (npm), REST API (any language) |
| Auth | API key |
| Real-time | WebSocket (audio/video), webhooks (events/transcription) |
| Webhook Infra | Svix |
| Regions | us-west-2, us-east-1, eu-central-1, ap-northeast-1 |
| Transcription | Built-in + AssemblyAI + Deepgram |
| Uptime SLA | 99.9% |

---

## Alternatives

| Provider | Price/hr | Platforms | Self-Host | Compliance | Maturity |
|----------|---------|-----------|-----------|------------|----------|
| **Recall.ai** | ~$0.65 | 6 | No | SOC2, HIPAA, ISO | Market leader |
| **Meeting BaaS** | $0.69 (hosted) | 3 | Yes ($0.066/hr) | None | Growing |
| **Skribby** | $0.35 | 3 | No | None | Startup |
| **Nylas Notetaker** | $0.70 | 3 | No | SOC2, HIPAA, ISO | New (2025) |

---

## Nixelo vs Recall.ai

| Dimension | Nixelo | Recall.ai |
|-----------|--------|-----------|
| **Primary Function** | Project management + Voice AI | Meeting bot infrastructure API |
| **Relationship** | Customer (bot-service uses Recall.ai) | Infrastructure provider |
| **Meeting Platforms** | Via Recall.ai integration | Zoom, Meet, Teams, Webex, Slack, GoTo |
| **AI Processing** | Text AI chat/search, Voice AI action items | Raw recording, transcription, metadata |
| **Calendar** | Google Calendar sync | No calendar features |
| **User Facing** | End-user teams and organizations | Developer teams building meeting products |
| **Compliance** | Inherits from Convex + Recall.ai | SOC2, ISO 27001, GDPR, CCPA, HIPAA |
| **Pricing** | Platform subscription | Per-hour usage-based |

---

## Key Takeaways

### What to Learn
- **Platform abstraction:** Recall.ai's single API covering 6 platforms is the gold standard for multi-platform meeting integration; Nixelo benefits from this abstraction layer.
- **Webhook reliability at scale:** Svix-powered webhook infrastructure with 60 retries ensures event delivery; adopt similar patterns for Nixelo's own webhook/notification systems.
- **Dual recording modes:** Offering both bot-based and SDK-based recording gives customers flexibility; consider exposing both options in Nixelo.
- **Regional data residency:** Supporting multiple regions (US, EU, APAC) is critical for enterprise compliance; plan for this in Nixelo's infrastructure.

### What to Avoid
- **Single-vendor dependency:** Recall.ai is a black box; if they change pricing or experience outages, Nixelo's Voice AI is directly affected. Maintain a secondary provider.
- **Cost accumulation:** At $0.65/hour, high-volume usage quickly becomes expensive; negotiate volume discounts or implement usage caps for Nixelo users.
- **Storage fee surprises:** The 7-day free storage with ongoing fees afterward can catch teams off guard; be transparent about storage costs in Nixelo's pricing.

---

## Nixelo Integration Strategy

Recall.ai is Nixelo's **primary meeting bot infrastructure provider** and the best option for the cloud-hosted Voice AI tier:

1. **Current State:** Nixelo's bot-service already integrates with Recall.ai for meeting bot deployment, recording, and transcription. This is the production infrastructure.
2. **Cost Management:** At $0.50/hour recording + $0.15/hour transcription, implement intelligent recording controls (start/stop based on meeting activity, skip silence) to optimize per-meeting costs.
3. **Volume Negotiation:** As Nixelo scales, negotiate enterprise volume discounts with Recall.ai; their pricing model supports custom enterprise agreements.
4. **Secondary Provider:** Add Meeting BaaS as a fallback provider for self-hosted deployments and as leverage in pricing negotiations with Recall.ai.
5. **Desktop SDK Evaluation:** Evaluate Recall.ai's Desktop Recording SDK as an alternative to bot-based recording for users who prefer no visible bot in meetings.
6. **Output Media for Agentic AI:** Leverage Recall.ai's Output Media feature to build interactive Voice AI that can speak and respond in meetings, evolving beyond passive recording to active AI participation.
7. **Data Residency:** Use regional endpoints (eu-central-1) for European customers requiring GDPR-compliant data processing.

---

## Verdict

Recall.ai is the clear market leader in meeting bot infrastructure, offering the broadest platform coverage, strongest compliance posture, and most proven reliability at enterprise scale. For Nixelo, it remains the correct choice for the cloud-hosted Voice AI tier, backed by $51M in funding, 300+ enterprise clients, and a 99.9% uptime SLA. The primary risk is cost at scale and vendor lock-in. **Recommendation:** Continue using Recall.ai as the primary meeting bot provider; negotiate volume discounts as usage grows; implement Meeting BaaS as a secondary provider for self-hosted deployments; explore the Desktop SDK and Output Media features for expanding Voice AI capabilities beyond passive recording. Too expensive for self-hosted users unless they bring their own API key.
