# Competitor Analysis: Height

> **Focus:** AI-Native Project Management
> **Vibe:** "The AI Colleague" - It does the chores for you.

## 1. Feature Scraping Matrix

| Feature          | Why it's useful                                                  | Nixelo's "Configurable Edge"                                           |
| :--------------- | :--------------------------------------------------------------- | :--------------------------------------------------------------------- |
| **Code-to-Task** | Devs live in IDE. Context switching allows bugs to be forgotten. | **VS Code Extension:** Parsing `// TODO:` comments into actual Issues. |
| **Chat-to-Task** | Slack conversations are where decisions happen but are lost.     | **Slack Bot:** Listen for "We should fix X" -> "Create Issue?".        |
| **Auto-Triage**  | Bug reports are messy. AI categorizes them.                      | **Triage Agent:** Auto-label "Frontend", "High Priority" based on NLP. |

## 2. Deep Dive: Height (The "Automator")

**Why it wins:** It targets the "maintenance" pain of PM tools. Nobody likes updating status. Height tries to do it automatically.
**Weakness:** Recently acquired/sunset risks. Can feel "too magical" (trust issues with AI editing content).

### Technical Implementation

- **Local Processing:** "Code-to-task" often runs locally to respect codebase privacy.
- **LLM integration:** Heavy usage of LLMs for "Chat to Task" parsing.

## 3. Nixelo Strategy

We scrap the **"Automation"** mindset.
Height proves that _manual data entry is the enemy_.
**Strategy:** "Zero-Click PM". If a task can be created from a side-effect (Code comment, Slack message, Pull Request), it should be.
