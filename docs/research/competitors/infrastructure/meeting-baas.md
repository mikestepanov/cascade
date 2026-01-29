# Meeting BaaS - Infrastructure Analysis

> **Last Updated:** 2026-01-28
> **Category:** Infrastructure / Meeting Bot API
> **Type:** Paid API + Self-Hosted Option (BSL License)
> **Website:** https://www.meetingbaas.com

---

## Overview

**Meeting BaaS** (Meeting Bot as a Service) positions itself as a "Meetings-as-a-Service" alternative to Recall.ai, offering similar functionality with a focus on affordability and self-hosting. The platform provides an open-source meeting bot transcription API for Zoom, Google Meet, and Microsoft Teams. Its key differentiator is the on-premises deployment option, which reduces costs to approximately $0.066/hour per bot while giving teams full data sovereignty. Meeting BaaS markets itself as delivering "80% of Recall.ai functionality at 50% of the cost," making it an attractive option for cost-conscious startups and privacy-focused organizations.

The company maintains an active GitHub presence with multiple open-source repositories, including bot implementations, transcript management tools, and speaking bot integrations built with Pipecat. The source-available BSL license converts to Apache 2.0 after 18 months, aligning with open-source values while protecting commercial interests.

---

## Pricing

| Plan | Cost | Details |
|------|------|---------|
| **Free Trial** | $0 | 4 hours free on signup |
| **Pay-as-you-go** | $0.69/hour | Per bot hour, no contracts |
| **Token Packs** | Volume discounts | Pre-purchase tokens, never expire |
| **On-Premises** | ~$0.066/hour | Self-hosted on own infrastructure |
| **Enterprise** | Custom | Platform fees + volume pricing |

### Pricing Analysis

Meeting BaaS sits in the middle of the meeting bot API market. At $0.69/hour for hosted usage, it undercuts Recall.ai ($0.50/hour recording + $0.15/hour transcription + storage fees) when factoring in total cost of ownership. The on-premises option at $0.066/hour is transformatively cheaper for high-volume users, reducing costs by roughly 90% compared to hosted alternatives. Token packs that never expire provide flexibility for teams with variable meeting volumes.

---

## Core Features

### Bot Management (★★★★☆)
- Unified API for Zoom, Google Meet, and Microsoft Teams
- Custom bot names, avatars, and chat message capabilities
- Bot deployment, removal, and lifecycle management via REST API
- Real-time audio and video streaming from meetings

### Transcription & Recording (★★★★☆)
- Meeting recording with configurable quality settings
- Transcription via Gladia provider
- Retranscription with different providers after recording
- Meeting metadata extraction (participants, timestamps)

### Calendar Integration (★★★☆☆)
- Google and Microsoft calendar connectivity
- Event listing and scheduled recording automation
- Calendar sync for proactive bot deployment

### Speaking Bots & Agentic AI (★★★★☆)
- Fully autonomous speaking bots via Pipecat integration
- Agentic interactions within live meetings
- Real-time audio streaming for AI-powered responses
- Open-source speaking bot reference implementation

### Self-Hosting & On-Premises (★★★★★)
- Deploy on own AWS infrastructure
- One-day setup claim for on-premises deployment
- Automatic updates with zero-downtime deployments
- Complete data sovereignty and customization

### Developer Experience (★★★★☆)
- TypeScript SDK with type-safe access
- Official SDK generator for client creation
- Webhook management for event notifications
- RESTful API with JSON payloads

---

## Strengths

1. **Self-Hosting Option:** Unique selling point for privacy and control; no other major competitor offers a fully self-hostable meeting bot infrastructure at this price point.
2. **Cost Efficiency:** On-premises deployment at $0.066/hour is roughly 10x cheaper than Recall.ai, making high-volume meeting intelligence economically viable.
3. **Open Source Ecosystem:** Multiple MIT-licensed companion projects (Transcript Seeker, Speaking Bots) and BSL-licensed core that converts to Apache 2.0.
4. **Speaking Bot Support:** Pipecat-based speaking bots enable agentic meeting interactions, a feature not widely available from competitors.
5. **Developer-First Approach:** TypeScript SDK, SDK generator, open GitHub repos, and comprehensive API documentation lower the integration barrier.
6. **Flexible Pricing:** Token packs that never expire and pay-as-you-go billing accommodate teams of all sizes without lock-in.

---

## Weaknesses

1. **Smaller Company:** Less proven at enterprise scale compared to Recall.ai ($51M funded, 300+ enterprise clients).
2. **Limited Transcription Providers:** Currently supports Gladia only, compared to Skribby's 10+ transcription model options.
3. **Documentation Maturity:** Less comprehensive documentation and fewer integration guides than Recall.ai.
4. **No Compliance Certifications:** Lacks SOC2, HIPAA, ISO 27001 certifications that enterprise customers require; self-hosted users must manage compliance independently.
5. **BSL License Restrictions:** Cannot offer Meeting BaaS as a commercial service to third parties until the 18-month conversion to Apache 2.0.
6. **Platform Coverage:** Supports only Zoom, Google Meet, and Teams; missing Webex, Slack Huddles, and GoTo Meeting that Recall.ai covers.

---

## Compliance & Security

| Certification | Status |
|---------------|--------|
| SOC2 Type II | Not certified |
| ISO 27001 | Not certified |
| GDPR | Data sovereignty via self-hosting |
| CCPA | Not formally certified |
| HIPAA | Not certified; self-hosted can manage independently |

### Data Handling
- **Self-Hosted:** Full data sovereignty; data never leaves customer infrastructure
- **Cloud-Hosted:** Data processed on Meeting BaaS infrastructure
- **Encryption:** Dependent on self-hosted deployment configuration
- **Data Retention:** Customer-controlled in on-premises deployments
- **License:** BSL (converts to Apache 2.0 after 18 months per release)

---

## Integration Strategy

### API Design
- RESTful API with standard HTTP methods and JSON payloads
- Bearer token authentication
- Webhook-based event notification system
- Calendar sync APIs for Google and Microsoft

### SDKs & Libraries
- Official TypeScript SDK with type-safe access
- SDK generator tool for custom client creation
- MCP (Model Context Protocol) server for AI agent integration
- Open-source reference implementations on GitHub

### Key Endpoints
- `POST` Deploy Bots / `DELETE` Remove Bots
- `GET` Meeting Data (recordings, transcripts, metadata)
- `GET` List Bots / Events
- `POST` Schedule Recordings / Retranscribe
- Webhook management and persona management APIs

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| API Style | RESTful with JSON |
| SDKs | TypeScript (official), SDK generator |
| Auth | Bearer token |
| Real-time | WebSocket streaming, webhooks |
| Self-host | AWS infrastructure, Docker/K8s |
| Speaking Bots | Pipecat framework |
| License | BSL -> Apache 2.0 |

---

## Alternatives

| Provider | Hosted Price | Self-Host | Platforms | Transcription |
|----------|-------------|-----------|-----------|---------------|
| **Meeting BaaS** | $0.69/hr | Yes ($0.066/hr) | 3 | Gladia |
| **Recall.ai** | ~$0.65/hr total | No | 6 | Built-in |
| **Skribby** | $0.35/hr | No | 3 | 10+ providers |
| **MeetingBot (OSS)** | Free | Yes (AWS) | 3 | BYO |

---

## Nixelo vs Meeting BaaS

| Dimension | Nixelo | Meeting BaaS |
|-----------|--------|--------------|
| **Primary Function** | Project management + Voice AI | Meeting bot infrastructure |
| **Relationship** | Consumer of bot APIs | Provider of bot APIs |
| **Self-Hosting** | Potential future tier | Core offering |
| **Meeting Platforms** | Via bot-service (Recall.ai) | Zoom, Meet, Teams |
| **Calendar Integration** | Google Calendar sync | Google + Microsoft Calendar |
| **AI Features** | Text AI, Voice AI, action items | Speaking bots, transcription |
| **Pricing Model** | Platform subscription | Pay-per-bot-hour |
| **Open Source** | Partial | BSL + MIT ecosystem |

---

## Key Takeaways

### What to Learn
- **Self-hosting as a tier:** Meeting BaaS proves there is demand for self-hosted meeting infrastructure; Nixelo could offer a similar self-hosted Voice AI tier.
- **Open-source ecosystem approach:** Companion tools (Transcript Seeker, Speaking Bots) under MIT license build community and trust.
- **Token-based pricing:** Non-expiring tokens accommodate variable usage patterns better than strict per-hour billing.
- **Agentic meeting bots:** Pipecat-based speaking bots represent the next evolution beyond passive recording.

### What to Avoid
- **Launching without compliance certs:** Enterprise buyers require SOC2/HIPAA before evaluating; Meeting BaaS's lack of certifications limits its addressable market.
- **Single transcription provider:** Depending solely on Gladia restricts flexibility; offer multiple transcription backends.
- **BSL licensing complexity:** The dual-phase license creates confusion for potential contributors and commercial users.

---

## Nixelo Integration Strategy

Meeting BaaS is a strong candidate for Nixelo's **self-hosted Voice AI tier**, allowing users to run their own meeting bots without paying monthly fees to a third party. The integration approach should be:

1. **Current State:** Nixelo's bot-service currently uses Recall.ai for cloud-hosted bot deployment.
2. **Dual-Provider Strategy:** Add Meeting BaaS as an alternative backend, especially for the self-hosted deployment scenario.
3. **Self-Hosted Tier:** Package Meeting BaaS's on-premises option ($0.066/hr) as Nixelo's "Self-Hosted Voice AI" tier for cost-sensitive and privacy-conscious customers.
4. **Speaking Bot Potential:** Leverage Meeting BaaS's Pipecat-based speaking bots to build agentic meeting features (e.g., Nixelo AI actively participating in standup meetings).
5. **Calendar Sync:** Meeting BaaS's calendar integration complements Nixelo's existing Google Calendar sync; evaluate for Microsoft Calendar coverage.

---

## Verdict

Meeting BaaS occupies a unique position as the only meeting bot API provider offering genuine self-hosting with open-source components. For Nixelo, it represents the best path to offering a cost-effective, privacy-first Voice AI tier. The $0.066/hour on-premises cost makes high-volume meeting intelligence economically viable for teams that cannot justify Recall.ai's pricing. However, the lack of enterprise compliance certifications and limited transcription provider support mean it is not yet a full replacement for Recall.ai in the cloud tier. **Recommendation:** Integrate as secondary provider for self-hosted deployments; keep Recall.ai for cloud/enterprise tier until Meeting BaaS matures its compliance posture.
