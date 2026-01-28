# Competitor Analysis: TimeCamp

> **Focus:** Automatic Time Tracking & Attendance
> **Vibe:** "The Invisible Accountant" - It works in the background.

## 1. Feature Scraping Matrix

| Feature               | Why it's useful                                      | Nixelo's "Configurable Edge"                                                      |
| :-------------------- | :--------------------------------------------------- | :-------------------------------------------------------------------------------- |
| **Keyword Tracking**  | Magic. "If URL contains 'jira', track to Project A". | **"Context Awareness":** Auto-tag time based on VS Code workspace or Browser URL. |
| **Attendance Module** | managing vacation/sick leave in the same app.        | **"Availability State":** Unified status for "Out of Office" vs "Deep Work".      |
| **Private Time**      | auto-discard time on "Instagram" or "Banking".       | **"Private Mode":** Explicit toggle or auto-blacklisting of sensitive domains.    |

## 2. Deep Dive: TimeCamp (The Hybrid)

**Why it wins:** It bridges the gap between "hard" trackers (screenshots) and "soft" trackers (manual timers). The keyword-based auto-tracking is its killer feature.
**Weakness:** UI is functional but dated. Setup for keywords can be tedious.

### Technical Implementation

- **Keyword Engine:** Desktop app monitors window titles/URLs. Local regex matching against user-defined rules.
- **Attendance:** Separate module from time tracking (often sold separately).

## 3. Nixelo Strategy

TimeCamp proves that **Automation > Manual Entry**.
We scrap their **"Keyword Rules"** concept.
**Strategy:** "Zero-Click Time Tracking". Nixelo should _guess_ what you are doing. "You spent 2h on `github.com/nixelo`. Assign to Project Nixelo?"
