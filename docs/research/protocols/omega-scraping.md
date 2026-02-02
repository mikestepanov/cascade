# Omega Scraping Protocol

**Objective:** Capture a "High-Fidelity Mirror" of competitor UI/UX across all device strata and themes.

---

## 1. Device Strata

For every target URL, the full mirror captures **6 viewports x 2 themes = 12 screenshots**.

### Viewports

| Name          | Resolution  | Use Case                                          |
| ------------- | ----------- | ------------------------------------------------- |
| **Desktop**   | `1920x1080` | Standard workstation, dashboards, complex tables  |
| **Laptop**    | `1366x768`  | Most common laptop screen, compact layouts        |
| **Phablet**   | `768x1024`  | Small tablet / large phone, breakpoint testing    |
| **Tablet**    | `1024x1366` | iPad-class, hybrid nav patterns                   |
| **Mobile**    | `375x667`   | iPhone SE/8 class, stacked layouts, touch targets |
| **Ultrawide** | `3440x1440` | Widescreen monitors, max-width behavior           |

### Themes

- **Light** — default color scheme
- **Dark** — `prefers-color-scheme: dark`

### Artifact Naming

```
{page}_{viewport}_{theme}.png
```

Example: `home_desktop_light.png`, `pricing_mobile_dark.png`

---

## 2. Technical Capture (X-Ray Mode)

For every page, the scraper extracts deep technical metadata:

### Deep Data (`{page}_deep.json`)

- **CSS Variables** — all custom properties (`--bg-color`, `--font-size`, etc.)
- **Keyframes** — all `@keyframes` animation definitions
- **Fonts** — loaded font families, weights, styles, status
- **Scripts** — all `<script src>` URLs
- **Fingerprint** — detected frameworks, UI libraries, and analytics tools (React, Tailwind, PostHog, etc.)

### Motion Capture (`{page}_motion.webm`)

- 5-10 second video recording of the page during exploration.
- Useful for documenting micro-interactions, scroll-triggered animations, and loading states.

### Network Log (`{page}_network.json`)

- Every HTTP request/response during page load
- URL, status code, resource type, response size
- Useful for identifying API endpoints (`graphql`, `api`, `trpc`, `_next/data`)

### Asset Manifest (`{page}_manifest.json`)

Downloaded assets organized by category:

| Category      | Extensions                              | Example                       |
| ------------- | --------------------------------------- | ----------------------------- |
| `js/`         | `.js`, `.mjs`                           | Bundle chunks, framework code |
| `css/`        | `.css`                                  | Stylesheets                   |
| `fonts/`      | `.woff`, `.woff2`, `.ttf`, `.otf`       | Web fonts                     |
| `images/`     | `.png`, `.jpg`, `.svg`, `.webp`, `.ico` | Logos, icons, photos          |
| `animations/` | `.lottie`, lottie `.json`               | Motion graphics               |

### HTML Snapshot (`{page}.html`)

Full rendered DOM after JavaScript execution, scroll-to-bottom (triggers lazy loading), and 5-second stabilization wait.

---

## 3. Workflow Steps

1. **Navigate** — Go to URL with 120s timeout, wait for `load` + `networkidle`
2. **Stabilize** — 5-second buffer for animations and lazy content
3. **Extract HTML** — Save full rendered DOM
4. **Extract Deep Data** — CSS vars, keyframes, fonts, scripts
5. **Capture Network** — Log all resource requests/responses
6. **Screenshot** — 12-shot capture across all viewport/theme combinations
7. **Download Assets** — Fetch JS, CSS, fonts, images, animations to local `assets/` folder
8. **Save Manifests** — Write `_deep.json`, `_network.json`, `_manifest.json`

---

## 4. Scripts

### Full Mirror (single page)

Captures everything: 12 screenshots, HTML, deep data, network log, assets.

```bash
pnpm run mirror <url> <competitor> <page>

# Example:
node scripts/scrape_full_mirror.js https://linear.app/features linear features
```

**Output:** `docs/research/library/<competitor>/`

### Batch Mirror (all competitors)

Runs full mirror against 25+ predefined pages across all tracked competitors. Skips competitors that already have data.

```bash
pnpm run mirror:batch

# Runs: scripts/mirror_batch.js
```

**Competitors configured:** Linear, ClickUp, Notion, Asana, Fireflies, Gong, Jira, Meeting BaaS, Monday, Otter, Read AI, Recall.ai, tl;dv, Height, Shortcut, Clockify, Jibble, Toggl, TimeCamp, TMetric, Harvest

### Automated Target Discovery

Saves a JSON list of high-value pages (pricing, features, etc.) by parsing a competitor's sitemap.

```bash
pnpm run discover <url> <competitor>

# Example:
node scripts/discover_targets.js https://linear.app linear
```

- **Common Probe**: Automatically tries standard SaaS patterns (e.g., `/settings`, `/billing`) to find pages not in the sitemap.
- **Scoring**: Ranks pages based on relevance to UI/UX research.

**Output:** `docs/research/library/<competitor>_discovery.json`

### Route Crawling (Fast Discovery)

Use the dedicated crawler to map out all routes (public and authenticated) before running a full mirror.

```bash
# Public only
pnpm run crawl <url> <competitor>

# With internal auth discovery
pnpm run crawl <url> <competitor> --auth google
```

- **Lightweight**: Optimized for speed (no screenshots/assets).
- **Consolidated**: Merges sitemaps, SaaS probes, and dashboard links into one `_discovery.json`.

### Internal Route Discovery (Authenticated)

When running with `--auth`, the scraper will dynamically discover new high-value internal routes by scanning sidebars and navigation menus for keywords like "Settings", "Team", or "Profile".

- **Deep Data Injection**: These discovered routes are saved in the `discoveredRoutes` key of the `_deep.json` output.
- **Usage**: Check the `_deep.json` of a dashboard scrape to find more specific internal URLs to target next.

### AI Design Analysis (UX Audit)

Uses Claude 3.5 Sonnet Vision to generate a UX audit, layout labels, and design token analysis from a screenshot.

```bash
pnpm run analyze <competitor> <page>

# Example:
node scripts/analyze_design.js linear home
```

**Output:** `docs/research/library/<competitor>/<page>_analysis.json`

### Authenticated Scraping

For capturing pages behind a login (e.g., dashboards, settings), use the session-based auth system. This system is designed to be **highly automatic** for sites using "Login with Google".

1.  **Universal Setup**: Run the setup script **once** to establish your Google identity.
    ```bash
    pnpm run setup:auth google
    ```
2.  **Automatic Handshake**: When you run the scraper with `--auth google`, it will:
    - Automatically detect "Continue with Google" buttons.
    - Automatically select your primary account on the Google auth screen.
    - Securely cache the competitor-specific session for the duration of the 12-shot capture.

    ```bash
    pnpm run mirror <url> <competitor> <page> --auth google
    ```

### Freshness & Staleness

To avoid redundant scraping, `mirror:batch` and `mirror` now use a 7-day freshness window.

- **Automatic Skipping**: If a page has been scraped within the last 7 days, it will be skipped by `mirror:batch`.
- **Custom Window**: Change the window (in days) using `--days=N`.
  ```bash
  pnpm run mirror:batch --days=14
  ```
- **Manual Force**: Bypass the freshness check and re-scrape everything.
  ```bash
  pnpm run mirror:batch --force
  ```

### Deep Data Only (lightweight)

Quick single-page scrape — only HTML + deep metadata JSON. No screenshots, no assets.

```bash
node scripts/scrape_deep_data.js <url> <competitor/page>

# Example:
node scripts/scrape_deep_data.js https://clickup.com/pricing clickup/pricing
```

**Output:** `{page}.html` + `{page}_deep.json`

### Inventory Audit

Scans analysis docs and scraped data, generates a coverage matrix.

```bash
pnpm run inventory

# Runs: scripts/check_inventory.js
```

**Output:** `docs/research/INVENTORY.md`

---

## 5. Output Structure

```
docs/research/library/<competitor>/
├── <page>.html                          # Rendered DOM
├── <page>_deep.json                     # CSS vars, keyframes, fonts, scripts
├── <page>_network.json                  # All HTTP requests (gitignored)
├── <page>_manifest.json                 # Asset download manifest (gitignored)
├── <page>_desktop_light.png             # Screenshots (12 per page)
├── <page>_desktop_dark.png
├── <page>_motion.webm                   # Micro-interaction recording (gitignored)
├── <page>_analysis.json                 # AI UX Audit / Layout labeling
├── <page>_laptop_light.png
├── <page>_laptop_dark.png
├── <page>_phablet_light.png
├── <page>_phablet_dark.png
├── <page>_tablet_light.png
├── <page>_tablet_dark.png
├── <page>_mobile_light.png
├── <page>_mobile_dark.png
├── <page>_ultrawide_light.png
├── <page>_ultrawide_dark.png
└── assets/                              # Downloaded assets (gitignored)
    ├── js/
    ├── css/
    ├── fonts/
    ├── images/
    └── animations/
```

### What's Committed to Git

- `*.png` — screenshots (visual evidence)
- `*_tech.json` — tech summaries
- `*_analysis.json` — AI design audits
- `README.md` — library index

### What's Gitignored

- `*.html` — full DOM dumps (large, regenerable)
- `*.webm` — screen recordings
- `*_manifest.json`, `*_network.json`, `*_deep.json` — raw capture data
- `assets/` — downloaded JS/CSS/fonts/images
