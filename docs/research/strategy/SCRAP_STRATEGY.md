# Master Scrap Strategy: The "Feature Theft" Backlog

> **Objective:** Build the ultimate "Frankenstein" productivity suite by adopting ("scrapping") the best specific features from competitors, while discarding their "bloat" or "spyware" tendencies.

## 1. Time Tracking Scraps (The "Modular Monitoring" Engine)

| Source         | Feature to Scrap                 | Why?                             | Nixelo Implementation                                                                 |
| :------------- | :------------------------------- | :------------------------------- | :------------------------------------------------------------------------------------ |
| **Jibble**     | **Biometric/Selfie Clock-in**    | Prevents buddy punching.         | **Module:** `proof_of_presence`. Optional. Local-first verification.                  |
| **Clockify**   | **Idle Detection Pop-up**        | Cleans dirty data.               | **Module:** `idle_check`. "Are you still working on [Task]?" dialog.                  |
| **Hubstaff**   | **Activity Meter**               | identifying burnout/slacking.    | **Module:** `flow_meter`. **TWIST:** Show "Deep Work" intensity, not "keylog" counts. |
| **Harvest**    | **Budget Alerts**                | Prevents over-servicing clients. | **Module:** `budget_guard`. Alert when project hits 80% of hours.                     |
| **Insightful** | **Contextual Project Detection** | Reduces manual tagging.          | **Module:** `auto_context`. `VS Code` = Valid Work. `YouTube` = Questionable.         |

## 2. Meeting Intelligence Scraps (The "Anti-Amnesia" Engine)

| Source        | Feature to Scrap           | Why?                       | Nixelo Implementation                                                         |
| :------------ | :------------------------- | :------------------------- | :---------------------------------------------------------------------------- |
| **Fireflies** | **Voice Commands**         | Action items in real-time. | **Keyword Trigger:** "Nixelo, create a task..." adds issue to current sprint. |
| **Read AI**   | **"What You Missed"**      | Catch-up for late joiners. | **Private Whisper:** Sidebar summary for late arrivals.                       |
| **Otter.ai**  | **Speaker Identification** | know who promised what.    | **Auto-Assign:** "Mike said 'I will fix this'" -> Task assigned to Mike.      |

## 3. Project Management Scraps (The "Flow" Engine)

| Source     | Feature to Scrap              | Why?                          | Nixelo Implementation                                              |
| :--------- | :---------------------------- | :---------------------------- | :----------------------------------------------------------------- |
| **Height** | **Code-to-Task**              | Devs hate switch contexts.    | **VS Code Ext:** `// TODO: fix this` -> Auto-creates Nixelo Issue. |
| **Height** | **Chat-to-Task**              | Slack conversations get lost. | **Slack Bot:** 🤖 listens for "We need to X" -> Suggested Issue.   |
| **Linear** | **Keyboard-First navigation** | Speed.                        | **Global Hotkeys:** `C` to create, `K` to search. No mouse needed. |
| **Jira**   | **JQL (Query Language)**      | Power user reporting.         | **NQL:** Natural Language Search. "Show me bugs blocked by Mike".  |

## 4. The "Do Not Scrap" List (The Anti-Patterns)

- [ ] **Screenshots as default:** Only enable for "High Trust" or "Contractor" policies. Never default.
- [ ] **Keystroke logging:** Too invasive. Use "Activity Intensity" instead.
- [ ] **Public "Shame games":** Never show "Bottom 10 employees" leaderboards.
