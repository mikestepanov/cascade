# Competitor Analysis: Gong

> **Focus:** Revenue Intelligence (Sales)
> **Vibe:** "Big Brother for Sales" - but highly valuable Big Brother.

## 1. Feature Scraping Matrix

| Feature             | Why it's useful                                  | Nixelo's "Configurable Edge"                                                                               |
| :------------------ | :----------------------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| **Deal Likelihood** | Predicts success based on behavioral signals.    | **"Release Confidence":** Prediction score for shipping on time based on _commit velocity_ and _bug rate_. |
| **Talk Ratio**      | "You're talking too much, listening too little." | **"Standup Police":** Alert if one dev talks for > 5 mins in a 15 min standup.                             |
| **Tracker**         | Mentions of "Competitors" or "Pricing".          | **"Tech Debt Tracker":** Track mentions of "legacy", "refactor", "hacky" in engineering syncs.             |

## 2. Deep Dive: Gong (The "Intelligence" Layer)

**Why it wins:** It moves beyond "What was said" to "What does it mean?". It quantifies the qualitative (sales calls).
**Weakness:** Extremely expensive ($1k+/user). 100% focused on Sales; useless for Eng/Product workflows.

### Technical Architecture

- **300+ Signals:** Analyzes email, calendar, and call data combined.
- **Deal Algorithm:** Multi-model AI. Base model trained on billions of interactions + Custom model fine-tuned on specific customer data (2 years history).
- **Dynamic Weighting:** The AI acts as a "Market Maker," adjusting the weight of signals daily based on win/loss outcomes.

## 3. Nixelo Strategy

We are building **"Gong for Engineering"**.
Where Gong monitors _Revenue Health_, Nixelo monitors _Delivery Health_.
We will scrap their **"Signal-based Scoring"** approach:

- Instead of "Deal Health", we calculate **"Sprint Health"**.
- Instead of "Competitor Mentions", we track **"Blocker Mentions"**.
