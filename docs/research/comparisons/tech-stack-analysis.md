# Competitor Technical Analysis: Linear

> **Status:** Authenticated Audit Complete
> **Date:** 2026-01-20
> **Target:** `linear.app` (Logged in as `agent.smith.starthub`)

## 🎥 Interaction Analysis

We captured a live session of the Linear dashboard to analyze their "feel".
**Recording:** `linear_deep_capture_1768967855411.webp` (Attached in chat)

### Key Interactions

1.  **Sidebar Hover:** Instant background color change with regular transition (`0.25s`).
2.  **Modal Entrance:** "New Issue" modal scales up from 0.95 to 1.00 with opacity fade-in.
    - **Easing:** `cubic-bezier(.645,.045,.355,1)` (Custom punchy ease)
3.  **Shadow Depth:** Modals use multi-layered shadows for extreme depth without heavy borders.

## 🎨 Design System (Extracted)

### Typography

- **Body Font:** `Inter Variable` (Primary), `SF Pro Display` (Fallback)
- **Monospace:** `Berkeley Mono`, `SFMono Regular`
- **Density:**
  - Base Font Size: `13px` (Sidebar), `14px` (Lists), `15px` (Editor)
  - Line Height: `1.5`

### CSS Variables (The "Linear Look")

| Variable               | Value             | Notes                                   |
| ---------------------- | ----------------- | --------------------------------------- |
| `--bg-base-color`      | `#fcfcfc`         | Slightly off-white, not harsh `#ffffff` |
| `--color-text-primary` | `lch(9.7% 0 282)` | Deep charcoal, never pure black         |
| `--focus-color`        | `lch(53% 52 286)` | "Linear Purple"                         |
| `--sidebar-width`      | `244px`           | Fixed width                             |
| `--speed-quick`        | `0.1s`            | For hover states                        |
| `--speed-regular`      | `0.25s`           | For layout shifts                       |

## ⚡ Technical Stack

### Architecture

- **Protocol:** **GraphQL** over HTTPS (`client-api.linear.app/graphql`)
- **Real-time:** **WebSockets** for "local-first" sync feel (engine syncs in background).
- **State Management:** **MobX** (Observable state patterns seen in bundle).

### Frontend Frameworks

- **Core:** React 18+
- **Bundler:** Vite / Rolldown (Modern ESM delivery)
- **Animation:** `framer-motion` (Heavy usage for layout transitions)
- **Editor:** `Prosemirror` (Headless rich text editor)

### Network Payload

- **Initial Load:** Heavy pre-loading of JS chunks (50+ modules).
- **Data Fetching:**
  - `POST /graphql`: Batch queries for `initialSync`.
  - `WSS /socket`: Persistent connection for `IssueCreated`, `IssueUpdated` events.

## 📸 Visual Evidence

### Dashboard Structure

![Sidebar Density](/docs/research/assets/linear_sidebar.png)
_Observation: Sidebar items are 28px height with 0px vertical padding, relying on line-height for spacing._

### Modal Design

![New Issue Modal](/docs/research/assets/linear_new_issue.png)
_Observation: Modal is not centered but "top-weighted" (15% from top), creating a feeling of lightness._
