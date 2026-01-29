# Nixelo Documentation

> Complete documentation index for AI assistants and developers.

## Quick Reference

```bash
pnpm dev              # Start frontend + backend
pnpm run check        # Typecheck + lint + tests
pnpm e2e:ui           # E2E tests (interactive)
pnpm convex deploy    # Deploy backend
```

**Stack:** React 19 + Vite 6 + Convex + TanStack Router + Tailwind CSS + BlockNote

**AI:** Anthropic Claude (Opus 4.5 for chat, Haiku 4.5 for suggestions) + Voyage AI (embeddings)

---

## Complete File Index

### AI Features (`ai/`)

| File                       | Description                                                     |
| -------------------------- | --------------------------------------------------------------- |
| `ai/text/SETUP.md`         | Text AI setup: API keys, Voyage AI, environment variables       |
| `ai/voice/SETUP.md`        | Voice AI setup: bot service deployment, transcription providers |
| `ai/voice/ARCHITECTURE.md` | Meeting bot architecture: Playwright, audio capture, job flow   |

**Text AI Features:**

- AI Chat (Claude Opus 4.5) - natural language queries about projects
- Semantic Search (Voyage AI) - find issues by meaning
- Duplicate Detection - prevent duplicate issues
- AI Suggestions (Claude Haiku 4.5) - generate descriptions, priority, labels

**Voice AI Features:**

- Automatic meeting joining (Google Meet, Zoom/Teams planned)
- Multi-provider transcription: Speechmatics (8hr), Gladia (8hr), Azure (5hr), Google (1hr) = 22hr/month free
- Claude summarization with action item extraction

**Key Files:**

- `convex/ai/` - Text AI backend (config, providers, actions, semanticSearch, suggestions)
- `bot-service/` - Voice AI service (Playwright bot, transcription, summary)
- `src/components/AI/` - Frontend components

**Environment Variables:**

```bash
ANTHROPIC_API_KEY=sk-ant-...     # Required for AI features
VOYAGE_API_KEY=pa-...            # For embeddings/semantic search
BOT_SERVICE_URL=...              # Voice AI bot service URL
BOT_SERVICE_API_KEY=...          # Voice AI authentication
```

---

### Architecture (`architecture/`)

| File                                    | Description                                               |
| --------------------------------------- | --------------------------------------------------------- |
| `architecture/data-model.md`            | Complete database schema visualization (9 domains)        |
| `architecture/grand-unified-model.md`   | Full system diagram combining all domains                 |
| `architecture/workflows.md`             | Sequence diagrams: sprint planning, presence, GitHub sync |
| `architecture/seo-strategy.md`          | SPA SEO strategy, public docs indexing                    |
| `architecture/ARCHITECTURE_DECISION.md` | Linear-style hierarchy decision                           |

---

### Bundle Optimization (`bundle/`)

| File                  | Description                                   |
| --------------------- | --------------------------------------------- |
| `bundle/GUIDE.md`     | Bundle optimization techniques and strategies |
| `bundle/RESULTS_*.md` | Historical bundle size measurements           |

---

### Convex Backend (`convex/`)

| File                       | Description                                  |
| -------------------------- | -------------------------------------------- |
| `convex/BEST_PRACTICES.md` | Query optimization, error handling, patterns |
| `convex/COMPONENTS.md`     | Rate limiter, cache, aggregates              |
| `convex/ERRORS.md`         | Error handling patterns, ConvexError usage   |
| `convex/PERFORMANCE.md`    | Query limits, indexing, optimization         |
| `convex/PAGINATION.md`     | Cursor-based pagination patterns             |

**Quick Patterns:**

```typescript
// Error handling
import { forbidden, notFound, validation } from "./lib/errors";
throw forbidden("Not authorized");

// Query limits
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "./lib/queryLimits";
.take(DEFAULT_PAGE_SIZE); // 50

// Pagination
const { page, continueCursor } = await ctx.db
  .query("issues")
  .paginate(paginationOpts);
```

---

### Email System (`email/`)

| File             | Description                               |
| ---------------- | ----------------------------------------- |
| `email/SETUP.md` | Email provider setup, domain verification |

**Features:**

- Universal email wrapper - all emails use `sendEmail()`
- Provider rotation - Resend (3k), SendPulse (15k), Mailgun (1k), SendGrid (3k), Mailtrap (1k) = 23k/month free
- React Email templates in `emails/`
- User notification preferences

**Email Types:** OTP verification, password reset, @mentions, assignments, comments, digests

---

### Integrations (`integrations/`)

| File                                    | Description                          |
| --------------------------------------- | ------------------------------------ |
| `integrations/GOOGLE_CALENDAR_SETUP.md` | Google Calendar OAuth and sync setup |

**GitHub Integration:**

- OAuth authentication
- Link repositories to projects
- Auto PR/commit tracking (issue keys in messages)
- Webhook support for real-time updates
- Functions: `convex/github.ts`

**Google Calendar Integration:**

- Bi-directional sync (import/export/both)
- OAuth with Google Cloud
- Functions: `convex/googleCalendar.ts`

**Offline Mode (PWA):**

- Service worker caching
- IndexedDB for local storage
- Offline mutation queue with auto-sync
- Installable as native app
- Functions: `convex/offlineSync.ts`, `src/lib/offline.ts`

---

### Research & Strategy (`research/`)

| File                                        | Description                               |
| ------------------------------------------- | ----------------------------------------- |
| `research/strategy/SCRAP_STRATEGY.md`       | **NEW:** Master list of features to adopt |
| `research/strategy/NICHE_STRATEGY.md`       | How we win against giants                 |
| `research/strategy/GAPS_vs_Competitors.md`  | Critical missing features (Roadmap)       |
| `research/strategy/FEATURE_DEEP_DIVE.md`    | Technical analysis of core domains        |
| `research/INVENTORY.md`                     | **NEW:** Catalog of all collection data   |
| `research/comparisons/pm-architecture.md`   | Jira vs Linear vs ClickUp architecture    |
| `research/comparisons/meeting-landscape.md` | Overview of the Meeting AI market         |
| `research/comparisons/feature-matrix.md`    | Detailed comparison matrix                |
| `research/competitor-tech-stack.md`         | **NEW:** Linear tech stack deep dive      |

**Omega Comparison Library (`research/library/`):**

Automated visual and technical captures of competitor sites. See [library/README.md](research/library/README.md) for the full index.

- **Linear:** Home (Desktop/Tablet/Mobile), Features, Docs + `home.html` (2.5MB DOM) + `home_deep.json` (CSS vars, fonts, network)
- **ClickUp:** Home, Pricing screenshots + tech summaries
- **Notion:** Product screenshots + tech summaries

**Protocols (`research/protocols/`):**

| File                          | Description                                        |
| ----------------------------- | -------------------------------------------------- |
| `protocols/omega-scraping.md` | **NEW:** Multi-device scraping protocol for agents |

**Competitor Deep Dives:**

- **PM Suites:** [Jira](research/competitors/pm-suites/jira.md), [Linear](research/competitors/pm-suites/linear.md), [Notion](research/competitors/pm-suites/notion.md), [Height](research/competitors/pm-suites/height.md), [Shortcut](research/competitors/pm-suites/shortcut.md), [Monday](research/competitors/pm-suites/monday.md), [Asana](research/competitors/pm-suites/asana.md), [ClickUp](research/competitors/pm-suites/clickup.md)
- **Meeting AI:** [Read AI](research/competitors/meeting-ai/read-ai.md), [Fireflies](research/competitors/meeting-ai/fireflies.md), [Otter](research/competitors/meeting-ai/otter.md), [Gong](research/competitors/meeting-ai/gong.md), [TL;DV](research/competitors/meeting-ai/tldv.md)
- **Time Tracking:** [Overview](research/competitors/time-tracking/overview.md), [Clockify](research/competitors/time-tracking/clockify.md), [TMetric](research/competitors/time-tracking/tmetric.md), [TimeCamp](research/competitors/time-tracking/timecamp.md), [Jibble](research/competitors/time-tracking/jibble.md), [Toggl](research/competitors/time-tracking/toggl.md)
- **Infrastructure:** [Recall.ai](research/competitors/infrastructure/recall-ai.md), [Meeting BaaS](research/competitors/infrastructure/meeting-baas.md), [Nylas](research/competitors/infrastructure/nylas.md), [Skribby](research/competitors/infrastructure/skribby.md)
- **Open Source:** [AppFlowy](research/competitors/open-source/appflowy.md), [Cal.com](research/competitors/open-source/cal-com.md), [Kimai](research/competitors/open-source/kimai.md), [Canvas LMS](research/competitors/open-source/canvas-lms.md)

**Strategic Goal:**
Combine **Real-time Issue Tracking** (Linear) + **Integrated Docs** (Notion) + **Meeting Intelligence** (Read AI) + **Open Source** (GitLab) to create a unique value proposition.

---

### Setup & Configuration (`setup/`)

| File                    | Description                                  |
| ----------------------- | -------------------------------------------- |
| `setup/ENV.md`          | Complete environment variables documentation |
| `setup/PWA.md`          | Progressive Web App configuration            |
| `setup/PATH_ALIASES.md` | Import path configuration                    |

**Quick Start:**

```bash
pnpm install
cp .env.example .env.local
pnpm run dev:backend   # Start Convex
pnpm run dev:frontend  # Start Vite
```

**Key Environment Variables:**

- `SITE_URL` - Frontend URL (required)
- `RESEND_API_KEY` - Email notifications
- `AUTH_GOOGLE_ID/SECRET` - Google sign-in
- `ANTHROPIC_API_KEY` - AI features

---

### Testing (`testing/`)

| File                                   | Description                                    |
| -------------------------------------- | ---------------------------------------------- |
| `testing/e2e.md`                       | Playwright E2E testing, page objects, fixtures |
| `testing/unit.md`                      | Vitest unit testing, component testing         |
| `testing/backend.md`                   | Convex function testing with convex-test       |
| `testing/E2E_SIGNIN_FLAKINESS.md`      | Auth flow debugging notes                      |
| `testing/E2E_INVESTIGATION_SUMMARY.md` | E2E test investigation                         |
| `testing/UNIT-TEST-INVESTIGATION.md`   | Unit test investigation                        |

**Test Commands:**

```bash
pnpm test              # Unit tests (watch)
pnpm test:convex       # Backend tests
pnpm e2e               # E2E tests (headless)
pnpm e2e:ui            # E2E tests (interactive)
pnpm run check         # All checks (CI)
```

**Selector Priority (Playwright):**

1. `getByRole` - buttons, headings, links
2. `getByLabel` - form inputs
3. `getByPlaceholder` - inputs without labels
4. `getByText` - visible text
5. `getByTestId` - last resort

---

### Root-Level Docs

| File                | Description                                  |
| ------------------- | -------------------------------------------- |
| `API.md`            | REST API endpoints, authentication, examples |
| `AUTHENTICATION.md` | Auth methods, user management, RBAC          |
| `COLORS.md`         | Semantic color tokens, theming system        |
| `FUZZY_SEARCH.md`   | Search implementation guide                  |

---

### Archive (`archive/`)

Historical/deprecated documentation for reference.

| File                                     | Description              |
| ---------------------------------------- | ------------------------ |
| `archive/E2E-AUTH-FAILURE-ROOT-CAUSE.md` | Past auth debugging      |
| `archive/PHASE3-ROUTES-PROGRESS.md`      | Route migration progress |

---

## Directory Structure

```
docs/
├── ai/                  # AI features (text + voice)
│   ├── text/
│   └── voice/
├── architecture/        # System design, data model
├── archive/             # Deprecated docs
├── bundle/              # Bundle optimization
├── convex/              # Convex backend patterns
├── email/               # Email system
├── integrations/        # GitHub, Calendar, Offline
├── research/            # Competitor analysis
├── setup/               # Setup guides
└── testing/             # Test guides
```

---

## Key Links

- **Main Project Guide:** [CLAUDE.md](../CLAUDE.md)
- **Backend README:** [convex/README.md](../convex/README.md)
- **E2E Tests:** [e2e/README.md](../e2e/README.md)
- **Convex Dashboard:** https://dashboard.convex.dev/d/peaceful-salmon-964

---

_Last Updated: 2026-01-28_
