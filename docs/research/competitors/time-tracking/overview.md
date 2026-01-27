# Time Tracking: Competitive Landscape & Strategy

> **Goal:** Design the "Modular Monitoring" engine for Nixelo.

## 1. Feature Scraping Matrix (The Master List)

| Competitor     | "Scrappable" Feature     | Why it's useful                                              | Nixelo's "Configurable Edge"                                                                   |
| :------------- | :----------------------- | :----------------------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| **Jibble**     | **Biometric Selfie**     | Prevents "buddy punching" in physical offices.               | **Trust Level:** Off by default. <br>**Proof Level:** Optional on clock-in.                    |
| **Clockify**   | **Idle Detection**       | Pop-up to clean "dirty data" when timer is left running.     | **Trust Level:** Just a nudge. <br>**Accountability:** Auto-discard idle time.                 |
| **Hubstaff**   | **Activity Percentages** | Helps spot burnout or "ghost employees."                     | **Scrap:** Key/Mouse counts. <br>**Edge:** **"Flow State" Meter** (High activity = Deep Work). |
| **Toggl**      | **Timeline Track**       | Low-friction way to reconstruct the day.                     | **Edge:** **"Private Mode"** (Ignore banking/personal sites).                                  |
| **Insightful** | **Productivity Labels**  | Categorizes URLs (StackOverflow = Work, YouTube = Personal). | **Edge:** Auto-suggests project based on URL context.                                          |
| **Staffcop**   | **Screen Capture**       | Proof of work for contractors.                               | **Edge:** **"Privacy-First"** (Blur or B&W only). Auto-delete after 72h.                       |

### Quick Feature Comparison (Legacy)

| Feature            | Clockify                       | Jibble                     | Toggl Track            |
| :----------------- | :----------------------------- | :------------------------- | :--------------------- |
| **Vibe**           | "Corporate Timesheet"          | "Construction/Field"       | "Developer/Freelancer" |
| **Free Tier**      | Generous (Unlimited users)     | Generous (Unlimited users) | Limited (5 users)      |
| **Idle Detection** | Yes (Pop-up: "Are you there?") | No (Focus is on GPS/Bio)   | Yes (Timeline view)    |
| **Screenshots**    | Enterprise Only                | Yes (Configurable)         | No (privacy stance)    |
| **Biometrics**     | No                             | **Face ID / GPS Geofence** | No                     |

## 2. Nixelo's "Modular" Strategy

The user wants a **Policy-Based System**. We can mix-and-match:

### Policy A: "Trust" (Like Toggl)

- **Modules:** Timer, Manual Entry.
- **Data:** Self-reported.

### Policy B: "Proof" (Like Clockify)

- **Modules:** Idle Detection, Auto-Tracker (Private).
- **Data:** Verified by local agent heuristic.

### Policy C: "Accountability" (Like Jibble)

- **Modules:** Screenshots (Blurred), App Usage Logging.
- **Data:** Manager viewable.

### The "Nixelo" Twist

Instead of just "tracking," use the data to **protect** the developer:

- _IF_ `VS Code` activity > 45 mins _THEN_ set Slack status to "Deep Work".
- _IF_ `Meeting` detected _THEN_ auto-stop "Coding" timer.
