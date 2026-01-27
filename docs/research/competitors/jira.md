# Competitor Analysis: Enterprise Project Management

> **Focus:** Jira vs Linear
> **Goal:** Identify the "Enterprise Moat" Nixelo needs to cross.

## 1. The Battlefield

| Feature           | Jira (The Empire)          | Linear (The Rebel)         | Nixelo (The New Challenger) |
| :---------------- | :------------------------- | :------------------------- | :-------------------------- |
| **Target**        | Fortune 500, Non-Tech      | High-Performance Devs      | Modern Teams                |
| **Speed**         | Slow (~2s loads)           | Instant (<50ms)            | Instant (Real-time)         |
| **Customization** | Infinite (Workflow Editor) | Opinionated (Fixed States) | **Hybrid Needed**           |
| **Data Model**    | Issues = Everything        | Issues, Projects, Cycles   | Docs + Issues Combined      |

## 2. Deep Dive: Jira's "Enterprise Moat"

Jira is not just a tracker; it's a **compliance and reporting database**.

**Key Moats to Attack:**

1.  **JQL (Jira Query Language):**
    - _Why:_ Power users live in JQL. "Show me all bugs in 'Checkout' created last week by 'Junior Devs'".
    - _Nixelo Scrap:_ We need a robust filter bar or a natural language query ("NQL").
2.  **Advanced Roadmaps:**
    - _Why:_ Managers need to see dependencies across 50 teams.
    - _Nixelo Scrap:_ A "Master Timeline" view that aggregates multiple projects.
3.  **Permissions Schemes:**
    - _Why:_ "Contractors can't see the 'Acquisition' project."
    - _Nixelo Scrap:_ Field-level permissions (granularity).

## 3. Deep Dive: Linear's "Productivity Moat"

Linear wins on **"Flow"**.

**Key Features to "Scrap":**

- **Cycles:** Automatic sprint management. Unfinished tasks auto-roll to next cycle.
- **Command Palette (Cmd+K):** Never touch the mouse.
- **Triage:** Inbox zero for bugs.

## 4. Technical Architecture Comparison

- **Jira:** Java/Tomcat monolithic roots. Server-side rendering heavy. "Flexible but heavy."
- **Linear:** Local-first sync engine. Pre-loads data. "Rigid but fast."
- **Nixelo:** Convex (Real-time). The best of both?
  - _Advantage:_ We have the "Real-time" aspect of Linear but the "Database" power of Convex.

## 5. Strategic Recommendations

1.  **Don't clone Jira's UI.** It's hated.
2.  **Clone Jira's "Power".**
    - Directly map the **Tracking Policy** idea to Jira's "Schemes" (Permission Schemes, Workflow Schemes).
    - **Nixelo differentiator:** "Policy as Code" or simple UI toggles (as requested by user), rather than Jira's 50-click admin panel.
3.  **The "Import" Wedge:**
    - We _must_ have a bulletproof "Import from Jira" button. It's the #1 blocker for switching.
