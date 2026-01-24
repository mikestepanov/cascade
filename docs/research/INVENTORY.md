# Research Inventory: Competitor Data Collection Status

This document catalogs the state of research data collected for Nixelo's competitors.
**Last Updated:** 2026-01-24

## 📊 Quick Summary

- **Total Competitors Tracked:** 19
- **High-Fidelity Captures (DOM/CSS):** 3 (Linear, ClickUp, Notion)
- **Deep Technical Analysis:** 6 (PM Suites)
- **Specialized Analysis:** 9 (Meeting AI, Infrastructure, Open Source)

---

## 🏗️ Project Management Suites (Primary)

| Competitor     | High-Fidelity Library | CSS Vars / Themes | Tech Stack Audit | Authenticated Screenshots |               Analysis Doc               |
| :------------- | :-------------------: | :---------------: | :--------------: | :-----------------------: | :--------------------------------------: |
| **Linear**     |        ✅ Full        |   ✅ Extracted    | ✅ GraphQL/MobX  |    ✅ Dashboard/Modal     | [View](competitors/pm-suites/linear.md)  |
| **ClickUp**    |    ✅ Home/Pricing    |   ✅ Extracted    | ✅ Next.js Trace |        ❌ Missing         | [View](competitors/pm-suites/clickup.md) |
| **Notion**     | ✅ Product/Templates  |   ✅ Blocks CSS   |  ✅ React/Next   |        ❌ Missing         | [View](competitors/pm-suites/notion.md)  |
| **Jira**       |      ❌ Missing       |    ❌ Missing     |     ⚠️ Basic     |        ❌ Missing         |  [View](competitors/pm-suites/jira.md)   |
| **Asana**      |      ❌ Missing       |    ❌ Missing     |     ⚠️ Basic     |        ❌ Missing         |  [View](competitors/pm-suites/asana.md)  |
| **Monday.com** |      ❌ Missing       |    ❌ Missing     |     ⚠️ Basic     |        ❌ Missing         | [View](competitors/pm-suites/monday.md)  |

---

## 🤖 Specialized Domains

### Meeting AI

| Competitor       | Depth    | Status      | Notes                           |
| :--------------- | :------- | :---------- | :------------------------------ |
| **Fireflies.ai** | Standard | ✅ Analyzed | Focus on transcription pipeline |
| **Gong.io**      | Standard | ✅ Analyzed | Focus on revenue intelligence   |
| **Read.ai**      | Standard | ✅ Analyzed | Focus on scheduling             |
| **Otter.ai**     | Basic    | ✅ Analyzed | -                               |
| **tl;dv**        | Standard | ✅ Analyzed | Focus on Loom-like clips        |

### Infrastructure & Bots

| Competitor      | Depth    | Status      | Notes                             |
| :-------------- | :------- | :---------- | :-------------------------------- |
| **Recall.ai**   | Deep     | ✅ Analyzed | "Bot-as-a-Service" implementation |
| **MeetingBaas** | Standard | ✅ Analyzed | Bot infrastructure                |
| **Nylas**       | Deep     | ✅ Analyzed | Email/Calendar sync architecture  |
| **Skribby**     | Basic    | ✅ Analyzed | Startup competitor                |

### Open Source

| Competitor     | Depth | Status      | Notes                            |
| :------------- | :---- | :---------- | :------------------------------- |
| **AppFlowy**   | Deep  | ✅ Analyzed | Rust/Flutter architecture        |
| **Kimai**      | Deep  | ✅ Analyzed | Time-tracking & invoicing logic  |
| **Cal.com**    | Deep  | ✅ Analyzed | Scheduling & API design          |
| **Canvas LMS** | Deep  | ✅ Analyzed | Scalable Ruby/Rails architecture |

---

## 🧭 Strategic Overviews

These documents synthesize the raw data into actionable engineering plans:

- **[Feature Deep Dive](strategy/FEATURE_DEEP_DIVE.md)**: 1-to-1 comparison of Nixelo vs Competitors.
- **[Competitor Gaps](strategy/GAPS_vs_Competitors.md)**: Roadmap highlighting P0/P1 gaps.
- **[Niche Strategy](strategy/NICHE_STRATEGY.md)**: Analysis of our PM/Agency focus areas.

---

## 🚫 What is Missing (Priority Gaps)

1.  **Authenticated Audits (High Priority)**:
    - We need logged-in captures of **ClickUp's** "everything view" and **Notion's** database relations.
    - **Jira and Asana** currently only have manual analysis; no automated DOM mirrors exist.
2.  **Mobile App Analysis**:
    - Zero data collected for native iOS/Android implementations.
    - Need to analyze how Linear handles "swipe-to-complete" and mobile navigation.
3.  **Real-time Performance Benchmarks**:
    - We have Linear's network trace, but we haven't benchmarked Nixelo's Convex sync speed vs Linear's WebSocket sync side-by-side.
4.  **UI Physics (Animations)**:
    - We have Linear's cubic-beziers, but we haven't extracted transition curves for ClickUp (which often feels "heavier").

---

_Files can be found in `docs/research/library/` (raw data) and `docs/research/competitors/` (analysis)._
