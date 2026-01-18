## 2024-05-24 - Copy Affordances
**Learning:** Users frequently need to copy identifiers (like issue keys) for use in external contexts (Git, Slack).
**Action:** Always provide a one-click copy button next to primary identifiers in detail views.

## 2025-05-27 - Dynamic ARIA Labels
**Learning:** Users relying on screen readers need immediate context about notification counts (e.g., "5 unread") without having to open the notification panel.
**Action:** Implement dynamic `aria-label` attributes on notification triggers that include the unread count when > 0.
