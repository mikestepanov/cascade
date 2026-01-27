# Competitor Analysis: Fireflies.ai

> **Focus:** Integrations & "Voice Commands"
> **Vibe:** " The Connecting Glue" - It connects meetings to apps.

## 1. Feature Scraping Matrix

| Feature            | Why it's useful                                        | Nixelo's "Configurable Edge"                                                                 |
| :----------------- | :----------------------------------------------------- | :------------------------------------------------------------------------------------------- |
| **Voice Commands** | Trigger actions without leaving the conversation.      | **"Magic Words":** "Hey Nixelo, flag this as a blocker" -> Creates high-priority issue.      |
| **Topic Tracker**  | Track specific keywords (e.g., "Competitor X", "Bug"). | **"Regression Alert":** If "Bug" + "Production" mentioned > 3 times, alert Engineering Lead. |
| **AskFred**        | ChatGPT wrapper to query meeting history.              | **"Recall":** "When did we decide to use Postgres?" -> Links to specific meeting timestamp.  |

## 2. Deep Dive: Fireflies.ai (The "Integrator")

**Why it wins:** It connects to _everything_ (Zapier, Slack, Asana, Salesforce). It frames itself as an "Workflow Automation" tool, not just a "Recorder".
**Weakness:** Transcription accuracy can be lower than Otter. UI feels more utilitarian.

### Technical Implementation

- **Topic Tracker:** Uses keyword extraction + basic NLP to categorize segments.
- **AskFred:** Built on **OpenAI GPT** models. It indexes transcripts into a vector database for RAG (Retrieval Augmented Generation).
- **Integration Engines:** Heavy usage of **Webhooks** and middleware (Zapier/Make) to push data out.

## 3. Nixelo Strategy

Fireflies proves that **Voice-to-Action** is valuable.
**Strategy:** We should implement **Voice Commands** as a primary interface for the "Proof of Work" module. "I'm starting deep work code" (spoken) -> Starts Timer & Slack DND.
