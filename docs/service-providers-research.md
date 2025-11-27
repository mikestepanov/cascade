# Service Providers Research

**Last Updated:** 2025-11-27
**Researched By:** Claude (AI Assistant)

This document contains comprehensive research on third-party service providers for transcription (speech-to-text) and email delivery. It includes pricing, free tiers, quality assessments, and recommendations.

---

## Table of Contents

1. [Speech-to-Text Providers](#speech-to-text-providers)
2. [Email Delivery Providers](#email-delivery-providers)
3. [Recommendations](#recommendations)
4. [Implementation Status](#implementation-status)

---

## Speech-to-Text Providers

### Summary Table

| Provider | Free Tier | Free Type | Cost After Free | Quality | Speed | Diarization | Recommended |
|----------|-----------|-----------|-----------------|---------|-------|-------------|-------------|
| Speechmatics | 8 hrs/month | Monthly reset | $0.50/hr | Excellent | Fast | Yes | ✅ Yes |
| Gladia | 8 hrs/month | Monthly reset | $0.30/hr | Very Good | Fast | Yes | ✅ Yes |
| Azure Speech | 5 hrs/month | Monthly reset | $1.00/hr | Very Good | Fast | Yes | ✅ Yes |
| AssemblyAI | 100 hrs | One-time | $0.15/hr | Excellent | Medium | Yes | ⚠️ No (one-time) |
| Deepgram | $200 credit | One-time | $0.26/hr | Excellent | Very Fast | Yes | ⚠️ No (one-time) |
| OpenAI Whisper | None | N/A | $0.36/hr | Excellent | Medium | No | ⚠️ Paid only |
| Google Cloud STT | 60 min/month | Monthly reset | $1.44/hr | Very Good | Fast | Yes | ✅ Yes |
| AWS Transcribe | None | N/A | $1.44/hr | Good | Medium | Yes | ❌ No free tier |
| Rev.ai | None | N/A | $0.60/hr | Excellent | Medium | Yes | ❌ No free tier |

---

### Detailed Provider Analysis

#### 1. Speechmatics

**Website:** https://www.speechmatics.com/
**Documentation:** https://docs.speechmatics.com/

**Pricing:**
- Free tier: 8 hours/month (480 minutes)
- Free tier type: **Monthly reset** ✅
- Paid: ~$0.0083/minute ($0.50/hour)
- No credit card required for free tier

**Quality:**
- Accuracy: 95%+ (industry-leading for accents)
- Supports 50+ languages
- Excellent handling of accents and dialects
- Real-time and batch processing

**Features:**
- Speaker diarization: Yes
- Punctuation: Yes
- Custom vocabulary: Yes
- Profanity filtering: Yes
- Word-level timestamps: Yes

**Pros:**
- Best-in-class accent recognition
- Generous monthly free tier
- No credit card for free tier
- Excellent documentation

**Cons:**
- Higher cost after free tier
- Requires polling for batch jobs

**API Notes:**
- REST API with async job processing
- Webhook support available
- Response includes word-level timing

---

#### 2. Gladia

**Website:** https://www.gladia.io/
**Documentation:** https://docs.gladia.io/

**Pricing:**
- Free tier: 8 hours/month (480 minutes)
- Free tier type: **Monthly reset** ✅
- Paid: ~$0.005/minute ($0.30/hour)
- No credit card required

**Quality:**
- Accuracy: 93-95%
- Supports 100+ languages
- Good accent handling
- Uses Whisper under the hood with enhancements

**Features:**
- Speaker diarization: Yes
- Punctuation: Yes
- Translation: Yes (unique feature)
- Summarization: Yes (AI-powered)
- Word-level timestamps: Yes

**Pros:**
- Very affordable after free tier
- Built-in translation
- AI summarization included
- No credit card for free tier

**Cons:**
- Newer company (less track record)
- Slightly lower accuracy than Speechmatics

**API Notes:**
- REST API
- File upload then poll for results
- Supports audio URLs

---

#### 3. Azure Speech Services

**Website:** https://azure.microsoft.com/en-us/products/ai-services/speech-to-text
**Documentation:** https://learn.microsoft.com/en-us/azure/ai-services/speech-service/

**Pricing:**
- Free tier: 5 hours/month (300 minutes)
- Free tier type: **Monthly reset** ✅
- Standard: $1.00/hour ($0.0167/minute)
- Custom models: $1.40/hour
- Requires Azure account (credit card needed)

**Quality:**
- Accuracy: 93-95%
- Supports 100+ languages
- Good for business/enterprise use
- Custom model training available

**Features:**
- Speaker diarization: Yes
- Punctuation: Yes
- Custom speech models: Yes
- Real-time streaming: Yes
- Batch transcription: Yes

**Pros:**
- Enterprise-grade reliability
- Custom model training
- Good Azure ecosystem integration
- Real-time streaming support

**Cons:**
- Requires Azure account setup
- Credit card required
- More complex API
- Smaller free tier than competitors

**API Notes:**
- REST API and SDKs
- Batch API for long audio
- Real-time WebSocket API

---

#### 4. AssemblyAI

**Website:** https://www.assemblyai.com/
**Documentation:** https://www.assemblyai.com/docs

**Pricing:**
- Free tier: 100 hours one-time credit
- Free tier type: **One-time only** ⚠️
- Paid: $0.15/hour ($0.0025/minute)
- Credit card required after free credits

**Quality:**
- Accuracy: 95%+ (excellent)
- Supports English primarily (other languages in beta)
- Excellent for meetings and podcasts
- Built-in AI features

**Features:**
- Speaker diarization: Yes (excellent)
- Punctuation: Yes
- PII redaction: Yes
- Sentiment analysis: Yes
- Topic detection: Yes
- Auto chapters: Yes
- Summarization: Yes

**Pros:**
- Excellent accuracy
- Rich AI features built-in
- Very affordable paid pricing
- Great for meeting transcription

**Cons:**
- **One-time free credits only**
- Primarily English-focused
- Credits don't reset

**API Notes:**
- Simple REST API
- Upload file, poll for results
- Webhook support

---

#### 5. Deepgram

**Website:** https://deepgram.com/
**Documentation:** https://developers.deepgram.com/

**Pricing:**
- Free tier: $200 one-time credit (~775 hours with Nova-2)
- Free tier type: **One-time only** ⚠️
- Nova-2: $0.0043/minute ($0.26/hour)
- Whisper (hosted): $0.0048/minute
- Credit card required after credits

**Quality:**
- Accuracy: 95%+ with Nova-2
- Supports 30+ languages
- Fastest transcription (near real-time)
- Excellent for live streaming

**Features:**
- Speaker diarization: Yes
- Punctuation: Yes (smart formatting)
- Real-time streaming: Yes (excellent)
- Topic detection: Yes
- Sentiment: Yes
- Summarization: Yes

**Pros:**
- Fastest transcription available
- Excellent streaming support
- Very affordable paid pricing
- Large one-time credit

**Cons:**
- **One-time free credits only**
- Credits eventually expire
- Requires credit card

**API Notes:**
- REST API (synchronous for short audio)
- WebSocket for real-time
- Pre-recorded returns immediately

---

#### 6. OpenAI Whisper API

**Website:** https://openai.com/
**Documentation:** https://platform.openai.com/docs/guides/speech-to-text

**Pricing:**
- Free tier: **None** ❌
- Cost: $0.006/minute ($0.36/hour)
- Requires OpenAI API account with billing

**Quality:**
- Accuracy: 95%+ (state-of-the-art)
- Supports 50+ languages
- Excellent multilingual support
- Open-source model (can self-host)

**Features:**
- Speaker diarization: **No** ❌
- Punctuation: Yes
- Translation: Yes (to English)
- Word-level timestamps: Yes

**Pros:**
- Excellent accuracy
- Great multilingual support
- Can self-host (open source)
- Simple API

**Cons:**
- **No free tier**
- No speaker diarization
- Higher cost than alternatives
- 25MB file limit per request

**API Notes:**
- Simple REST API
- Synchronous (immediate response)
- Max 25MB per file

---

#### 7. Google Cloud Speech-to-Text

**Website:** https://cloud.google.com/speech-to-text
**Documentation:** https://cloud.google.com/speech-to-text/docs

**Pricing:**
- Free tier: 60 minutes/month
- Free tier type: **Monthly reset** ✅
- Standard: $0.024/minute ($1.44/hour)
- Enhanced: $0.036/minute
- Medical: $0.078/minute

**Quality:**
- Accuracy: 93-95%
- Supports 125+ languages
- Good for production use

**Features:**
- Speaker diarization: Yes
- Punctuation: Yes
- Real-time streaming: Yes
- Custom vocabulary: Yes

**Pros:**
- Google infrastructure reliability
- Many languages
- Real-time streaming

**Cons:**
- **Very limited free tier (1 hour/month)**
- Expensive after free tier
- Complex GCP setup required

**API Notes:**
- REST and gRPC APIs
- Requires GCP project setup
- Complex authentication

---

#### 8. AWS Transcribe

**Website:** https://aws.amazon.com/transcribe/
**Documentation:** https://docs.aws.amazon.com/transcribe/

**Pricing:**
- Free tier: **None** (12-month trial only for new AWS accounts)
- Standard: $0.024/minute ($1.44/hour)
- Medical: $0.075/minute

**Quality:**
- Accuracy: 90-93%
- Supports 37 languages
- Good for AWS ecosystem

**Features:**
- Speaker diarization: Yes
- Punctuation: Yes
- Custom vocabulary: Yes
- PII redaction: Yes
- Real-time streaming: Yes

**Pros:**
- AWS ecosystem integration
- HIPAA compliant options
- Good for enterprise

**Cons:**
- **No permanent free tier**
- Lower accuracy than competitors
- Expensive
- Complex AWS setup

**API Notes:**
- AWS SDK required
- Async job-based processing
- S3 integration required

---

#### 9. Rev.ai

**Website:** https://www.rev.ai/
**Documentation:** https://docs.rev.ai/

**Pricing:**
- Free tier: **None** ❌
- Cost: $0.01/minute ($0.60/hour)
- Human transcription also available

**Quality:**
- Accuracy: 95%+ (excellent)
- English-focused
- Excellent for meetings

**Features:**
- Speaker diarization: Yes (excellent)
- Punctuation: Yes
- Real-time streaming: Yes
- Human transcription option

**Pros:**
- Excellent accuracy
- Best-in-class diarization
- Human fallback option

**Cons:**
- **No free tier**
- English-only for API
- Higher cost

---

## Email Delivery Providers

### Summary Table

| Provider | Free Tier | Free Type | Cost After Free | Deliverability | Recommended |
|----------|-----------|-----------|-----------------|----------------|-------------|
| Resend | 3,000/month | Monthly reset | $0.001/email | Excellent | ✅ Yes |
| SendPulse | 15,000/month | Monthly reset | $0.0008/email | Good | ✅ Yes |
| Mailgun | 1,000/month | Monthly reset | $0.001/email | Excellent | ✅ Yes |
| SendGrid | 100/day | Daily reset | $0.001/email | Excellent | ✅ Yes |
| Postmark | None | N/A | $1.25/1000 | Excellent | ❌ No free tier |
| Amazon SES | 62,000/month* | Monthly (EC2 only) | $0.0001/email | Excellent | ⚠️ Complex |
| Mailchimp Transactional | None | N/A | $20/mo + usage | Good | ❌ No free tier |

*Amazon SES free tier only applies when sending from EC2

---

### Detailed Provider Analysis

#### 1. Resend

**Website:** https://resend.com/
**Documentation:** https://resend.com/docs

**Pricing:**
- Free tier: 3,000 emails/month, 100/day limit
- Free tier type: **Monthly reset** ✅
- Pro: $20/month for 50,000 emails
- Pay-as-you-go: $0.001/email after free tier

**Deliverability:**
- Excellent (95%+ inbox rate)
- Built by former SendGrid team
- Modern infrastructure

**Features:**
- React email templates: Yes (unique)
- Webhooks: Yes
- Analytics: Yes
- Custom domains: Yes
- DKIM/SPF: Yes

**Pros:**
- Developer-friendly API
- React email support
- Modern, clean interface
- No credit card for free tier
- Great documentation

**Cons:**
- 100/day limit on free tier
- Newer company
- Fewer integrations than SendGrid

**API Notes:**
- Simple REST API
- SDK for Node.js, Python, etc.
- React Email integration

---

#### 2. SendPulse

**Website:** https://sendpulse.com/
**Documentation:** https://sendpulse.com/integrations/api

**Pricing:**
- Free tier: 15,000 emails/month (up to 500 subscribers)
- Free tier type: **Monthly reset** ✅
- Paid: Starts at $8/month
- SMTP: $0.0008/email

**Deliverability:**
- Good (90-93% inbox rate)
- Established company
- Good for marketing emails

**Features:**
- SMTP relay: Yes
- Marketing automation: Yes
- Chatbots: Yes
- SMS: Yes
- Web push: Yes

**Pros:**
- Very generous free tier
- Multi-channel platform
- No credit card required
- Good for startups

**Cons:**
- 500 subscriber limit on free
- Interface can be complex
- Lower deliverability than Resend/SendGrid

**API Notes:**
- REST API with OAuth2
- SMTP relay available
- Multi-channel API

---

#### 3. Mailgun

**Website:** https://www.mailgun.com/
**Documentation:** https://documentation.mailgun.com/

**Pricing:**
- Free tier: 1,000 emails/month (Flex plan, first 3 months)
- Free tier type: **Monthly reset** ✅ (but limited trial period)
- Foundation: $35/month for 50,000 emails
- Pay-as-you-go: ~$0.001/email

**Deliverability:**
- Excellent (95%+ inbox rate)
- Industry veteran
- Great reputation

**Features:**
- Email validation: Yes
- Analytics: Yes
- Webhooks: Yes
- Inbound routing: Yes
- Templates: Yes

**Pros:**
- Excellent deliverability
- Powerful routing features
- Good analytics
- Established reputation

**Cons:**
- Free tier is limited/trial
- Credit card required
- Can be expensive at scale

**API Notes:**
- REST API
- SMTP relay
- Webhooks for events

---

#### 4. SendGrid (Twilio)

**Website:** https://sendgrid.com/
**Documentation:** https://docs.sendgrid.com/

**Pricing:**
- Free tier: 100 emails/day forever
- Free tier type: **Daily reset** ✅
- Essentials: $19.95/month for 50,000 emails
- Pro: $89.95/month for 100,000 emails

**Deliverability:**
- Excellent (95%+ inbox rate)
- Industry leader
- Owned by Twilio

**Features:**
- Email validation: Yes
- Marketing campaigns: Yes
- Templates: Yes
- Analytics: Yes
- Webhooks: Yes

**Pros:**
- Industry leader
- Excellent deliverability
- Rich feature set
- Good documentation

**Cons:**
- **Only 100/day free** (3,000/month equivalent)
- Complex pricing tiers
- Can be expensive

**API Notes:**
- REST API v3
- SMTP relay
- Web API and SDKs

---

#### 5. Amazon SES

**Website:** https://aws.amazon.com/ses/
**Documentation:** https://docs.aws.amazon.com/ses/

**Pricing:**
- Free tier: 62,000 emails/month **only from EC2**
- Free tier type: **Monthly reset** (EC2 only) ⚠️
- Standard: $0.10 per 1,000 emails ($0.0001/email)

**Deliverability:**
- Excellent (when configured properly)
- AWS infrastructure
- Requires warm-up

**Features:**
- Dedicated IPs: Yes (paid)
- Webhooks: Yes (via SNS)
- Templates: Yes
- Analytics: Yes

**Pros:**
- Extremely cheap at scale
- AWS ecosystem
- High throughput

**Cons:**
- **Free tier only from EC2**
- Complex setup
- Requires reputation management
- No free tier for external servers

**API Notes:**
- AWS SDK required
- SMTP interface available
- Complex IAM setup

---

#### 6. Postmark

**Website:** https://postmarkapp.com/
**Documentation:** https://postmarkapp.com/developer

**Pricing:**
- Free tier: **None** ❌ (only 100 test emails)
- Starting: $15/month for 10,000 emails
- Per email: ~$0.00125/email

**Deliverability:**
- Excellent (98%+ inbox rate)
- Best-in-class for transactional
- Strict anti-spam policies

**Features:**
- Templates: Yes
- Analytics: Yes
- Webhooks: Yes
- Inbound processing: Yes

**Pros:**
- Best deliverability
- Fast delivery times
- Great for transactional

**Cons:**
- **No free tier**
- Marketing emails not allowed
- More expensive

---

## Recommendations

### For Cascade Project

#### Transcription (Speech-to-Text)

**Use these providers (monthly reset free tiers):**
1. **Speechmatics** (Priority 1) - 8 hrs/month
2. **Gladia** (Priority 2) - 8 hrs/month
3. **Azure Speech** (Priority 3) - 5 hrs/month
4. **Google Cloud STT** (Priority 4) - 1 hr/month

**Total free capacity:** 22 hours/month

**Do NOT use (one-time credits):**
- AssemblyAI - 100 hrs but one-time only
- Deepgram - $200 but one-time only
- OpenAI Whisper - No free tier

#### Email Delivery

**Use these providers (monthly reset free tiers):**
1. **Resend** (Priority 1) - 3,000/month
2. **SendPulse** (Priority 2) - 15,000/month
3. **Mailgun** (Priority 3) - 1,000/month (trial)
4. **SendGrid** (Priority 4) - 100/day (~3,000/month)

**Total free capacity:** 22,000 emails/month

---

## Implementation Status

### Transcription Providers

| Provider | Implemented | In Rotation | Notes |
|----------|-------------|-------------|-------|
| Speechmatics | ✅ Yes | ✅ Yes | Priority 1 |
| Gladia | ✅ Yes | ✅ Yes | Priority 2 |
| Azure Speech | ✅ Yes | ✅ Yes | Priority 3 |
| Google Cloud STT | ✅ Yes | ✅ Yes | Priority 4 |
| AssemblyAI | ✅ Yes | ❌ No | One-time credits, removed from rotation |
| Deepgram | ✅ Yes | ❌ No | One-time credits, removed from rotation |
| Whisper | ✅ Yes | ❌ No | No free tier, paid fallback only |

### Email Providers

| Provider | Implemented | In Rotation | Notes |
|----------|-------------|-------------|-------|
| Resend | ✅ Yes | ✅ Yes | Priority 1 |
| SendPulse | ✅ Yes | ✅ Yes | Priority 2 |
| Mailgun | ✅ Yes | ✅ Yes | Priority 3 |
| SendGrid | ✅ Yes | ✅ Yes | Priority 4 |

---

## Environment Variables

### Transcription (Active)
```bash
SPEECHMATICS_API_KEY=your_key
GLADIA_API_KEY=your_key
AZURE_SPEECH_KEY=your_key
AZURE_SPEECH_REGION=eastus
GOOGLE_CLOUD_API_KEY=your_key
GOOGLE_CLOUD_PROJECT_ID=your_project_id  # Optional, alternative to API key
```

### Transcription (Inactive - for reference)
```bash
ASSEMBLYAI_API_KEY=your_key      # One-time credits only
DEEPGRAM_API_KEY=your_key        # One-time credits only
OPENAI_API_KEY=your_key          # Paid only
```

### Email (Active)
```bash
RESEND_API_KEY=your_key
RESEND_FROM_EMAIL=Cascade <notifications@yourdomain.com>

SENDPULSE_ID=your_client_id
SENDPULSE_SECRET=your_client_secret
SENDPULSE_FROM_EMAIL=Cascade <notifications@yourdomain.com>

MAILGUN_API_KEY=your_key
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_FROM_EMAIL=Cascade <notifications@yourdomain.com>
MAILGUN_REGION=us  # or "eu"

SENDGRID_API_KEY=your_key
SENDGRID_FROM_EMAIL=Cascade <notifications@yourdomain.com>
```

---

## References

- Speechmatics: https://www.speechmatics.com/pricing
- Gladia: https://www.gladia.io/pricing
- Azure Speech: https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/
- AssemblyAI: https://www.assemblyai.com/pricing
- Deepgram: https://deepgram.com/pricing
- OpenAI Whisper: https://openai.com/pricing
- Google Cloud STT: https://cloud.google.com/speech-to-text/pricing
- AWS Transcribe: https://aws.amazon.com/transcribe/pricing/
- Resend: https://resend.com/pricing
- SendPulse: https://sendpulse.com/prices
- Mailgun: https://www.mailgun.com/pricing/
- SendGrid: https://sendgrid.com/pricing/
- Amazon SES: https://aws.amazon.com/ses/pricing/
