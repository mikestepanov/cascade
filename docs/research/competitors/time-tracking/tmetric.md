# Competitor Analysis: TMetric

> **Focus:** Developer Time Tracking & Invoicing
> **Vibe:** "The Freelancer's Friend" - Simple, effective, visual.

## 1. Feature Scraping Matrix

| Feature            | Why it's useful                                      | Nixelo's "Configurable Edge"                                                           |
| :----------------- | :--------------------------------------------------- | :------------------------------------------------------------------------------------- |
| **Timeline View**  | Visualizing the day as a 10-min block bar.           | **"Flow Timeline":** Show work clusters. "You had 3h of uninterrupted coding here."    |
| **Apps Usage Bar** | See exactly what apps were open during a time block. | **"Context Overlay":** Hover over a specific hour to see "VS Code (80%), Slack (20%)". |
| **Team Activity**  | Seeing who is online/working right now.              | **"Live Presence":** Convex-powered real-time "Working on X" status.                   |

## 2. Deep Dive: TMetric (The Visualizer)

**Why it wins:** The **Timeline** visualization. It's much easier to fix time entries when you can _see_ the gaps and blocks.
**Weakness:** Reporting is good but basic. Mobile app is just okay.

### Technical Implementation

- **Timeline:** Visualizes 10-minute intervals. If mouse/keyboard activity > threshold, block is filled.
- **Activity Polling:** Desktop app polls active window title every ~1 second.

## 3. Nixelo Strategy

TMetric proves that **Visualization** helps memory.
We scrap their **"Timeline UI"**.
**Strategy:** Instead of just a list of time entries, show a visual "Day in the Life" bar. Green = Deep Work, Red = Meeting, Grey = Idle.
