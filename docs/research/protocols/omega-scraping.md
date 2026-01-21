# Omega Scraping Protocol 🛸

**Objective:** Capture a "High-Fidelity Mirror" of competitor UI/UX across all device stratas.
**Agent Mode:** `browser_subagent` (Headed/Visual)

## 1. Device Stratums

For every target URL, capture the following 3 viewports.

### 🖥️ Desktop (The Workstation)

- **Viewport:** `1920 x 1080`
- **User Agent:** Default Chrome (Win10)
- **Goal:** Capture high-density dashboards, complex tables, and hover states.
- **Artifact:** `{name}_desktop.png`

### 📱 Tablet (The Hybrid)

- **Viewport:** `820 x 1180` (iPad Air)
- **User Agent:** `Mozilla/5.0 (iPad; CPU OS 13_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/87.0.4280.77 Mobile/15E148 Safari/604.1`
- **Goal:** Verify "Hamburger" menus vs. visible nav, touch target sizing.
- **Artifact:** `{name}_tablet.png`

### 📲 Mobile (The Companion)

- **Viewport:** `390 x 844` (iPhone 12/13)
- **User Agent:** `Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1`
- **Goal:** Verify stacked layouts, hidden columns, mobile interactions.
- **Artifact:** `{name}_mobile.png`

## 2. Technical Capture (The "Git" Commit)

For every page, we must enable "X-Ray Mode":

1.  **SSR Verification:**
    - Fetch page with `curl` / `fetch` (No JS).
    - If `<body>` is empty -> **SPA** (Client-side).
    - If `<body>` has content -> **SSR** (Server-side).
    - Save to: `{name}_tech.json` (`"renderMode": "SSR|SPA"`)

2.  **Network Tap:**
    - Capture `performance.getEntries()`
    - Filter for `graphql`, `api`, `trpc`, `_next/data`.
    - Save to: `{name}_network.json`

## 3. Workflow Steps

1.  **Init:** Agent reads this protocol.
2.  **Navigate:** Go to URL.
3.  **Wait:** Explicit 3s wait for skeletons to resolve.
4.  **Scroll:** `window.scrollTo(0, document.body.scrollHeight)` (Trigger Lazy Load).
5.  **Capture:** Execute the 3 screenshots (using `setViewport`).
6.  **Dump:** Save JSONs.

## 4. Total Mirror Script (Automated)

For full asset capture (HTML + all JS/CSS/fonts/images), use the Node.js script:

```bash
# Single page
pnpm run mirror <url> <competitor> <page>

# Batch all targets
pnpm run mirror:batch
```

**Output:** `docs/research/library/<competitor>/<page>_deep.json`

See `scripts/scrape_full_mirror.js` for implementation.
