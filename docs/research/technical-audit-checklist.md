# Product & Technical Audit Checklist

Use this checklist when manually inspecting competitors (Linear, ClickUp, Notion, etc.) to reverse-engineer their "magic."

## 🕵️‍♂️ Phase 1: Authentication & Onboarding

- [ ] **Auth Provider:** Do they use Auth0, Clerk, or custom?
  - _Check `network` tab for redirects._
- [ ] **Onboarding Flow:** How many steps?
  - _Note URL changes (e.g., `/welcome` -> `/setup` -> `/invite`)._
- [ ] **"Aha!" Moment:** How quickly do you get to the core value?
  - _Is there sample data populated?_
- [ ] **Email Stack:** What emails do you receive immediately?
  - _Check headers: SendGrid, Postmark, AWS SES?_

## 🎨 Phase 2: UI/UX & Interaction (The "Feel")

- [ ] **Optimistic UI:** Click a button (e.g., "Complete Task").
  - _Does it update instantly? Is there a spinner?_
  - _Turn off WiFi and click. Does it revert or queue?_
- [ ] **Animations:**
  - _Transitions between pages (View Transition API? Framer Motion?)_
  - _Micro-interactions on hover/click._
- [ ] **Density:**
  - _Measure row height in pixels (Inspect Element)._
  - _Font sizes used for body vs headers._

## ⚡ Phase 3: Network & Data (The "Engine")

- [ ] **Real-time Sync:**
  - _Filter Network tab by `WS` (WebSocket)._
  - _Look for `pusher`, `socket.io`, `firebase`, or custom sockets._
  - _Open two tabs. Update in one. Measure latency in the other._
- [ ] **Data Fetching:**
  - _Do they use GraphQL (`/graphql`)? REST? tRPC?_
  - _Check payload sizes (are they over-fetching?)._
- [ ] **Offline Support:**
  - _Check `Application > Service Workers`._
  - _Check `Application > Local Storage` or `IndexedDB` (Client-side DB?)._

## 🛠️ Phase 4: CSS & Assets

- [ ] **CSS Architecture:**
  - _Tailwind classes visible? (`text-red-500`)_
  - _CSS Variables? (`--color-primary`)_
  - _Styled Components (random hashes `sc-1234`)?_
- [ ] **Icons:**
  - _SVG sprites? Font Awesome? Inline SVGs?_
- [ ] **Fonts:**
  - _What font family? (Inter, San Francisco, Custom)_
  - _Self-hosted woff2 or Google Fonts CDN?_

## 🧪 Phase 5: Weird/Edge Cases

- [ ] **Error Handling:** Disconnect internet and try to save.
- [ ] **Large Data:** Paste 10,000 words into a doc. Does it lag?
- [ ] **Multi-user:** Invite yourself (different email). what is the invite flow?
