# Nixelo Design System Index

> **The comprehensive entry point for Nixelo's Mintlify-inspired design system**
>
> **Goal**: Transform Nixelo from "functional but generic" to "premium, polished, enterprise-grade"
> **Status**: Active Development
> **Last Updated**: 2026-02-05

---

## Executive Summary

The Nixelo Design System is a comprehensive visual language and component architecture designed to achieve **Mintlify-level polish** - the gold standard for modern SaaS design. This initiative transforms our project management platform from a functional tool into a premium experience that enterprises will trust with their critical workflows.

### What This Achieves

| Aspect | Before | After |
|--------|--------|-------|
| **Dark Mode** | Generic gray (`#111827`) | Premium near-black (`#08090a`) |
| **Borders** | Visible, defined lines | Ultra-subtle, barely perceptible |
| **Whitespace** | Compact, utilitarian | Generous, breathable |
| **Transitions** | Instant or inconsistent | Smooth 0.2s ease-out |
| **Text Hierarchy** | Fixed gray values | Opacity-based (100%, 70%, 50%) |
| **Overall Feel** | "Works but generic" | "Premium and intentional" |

### Design Philosophy

```
+------------------------------------------------------------------+
|                                                                    |
|   "The best interface is one that disappears, letting users       |
|    focus on their work while feeling confident and supported."    |
|                                                                    |
+------------------------------------------------------------------+
```

We achieve this through:
- **Restraint** - Every element earns its place
- **Consistency** - Predictable patterns reduce cognitive load
- **Polish** - Micro-interactions signal quality and care
- **Accessibility** - Premium means inclusive

---

## Quick Start

### For Developers

1. **Read the Master Plan first**: `docs/design-system/MASTER_PLAN.md`
2. **Check tokens before coding**: `docs/design-system/tokens/`
3. **Reference page specs**: `docs/design-system/pages/`
4. **Use semantic tokens**: Never hardcode colors, use `bg-ui-bg`, `text-brand`, etc.

### For Designers

1. **Study Mintlify captures**: `docs/research/library/mintlify/`
2. **Compare current state**: `e2e/screenshots/`
3. **Document proposals**: Follow the page spec template in MASTER_PLAN.md

### Key Commands

```bash
# View current UI screenshots
ls e2e/screenshots/

# Explore Mintlify reference
ls docs/research/library/mintlify/

# Check theme tokens
cat src/index.css | head -250
```

---

## Design Principles

### 1. Near-Black Dark Mode

The dark mode background should feel like a premium canvas, not a gray screen.

```
Current:  #111827 (gray-900)     Target: #08090a (near-black)
          +------------------+           +------------------+
          |                  |           |                  |
          |  Visible gray    |    -->    |  Deep void       |
          |  background      |           |  Content floats  |
          |                  |           |                  |
          +------------------+           +------------------+
```

**Token**: `--color-ui-bg-hero` for primary surfaces

### 2. Ultra-Subtle Borders

Borders should guide the eye, not divide the interface.

```
Current:                          Target:
+----------------------+          +----------------------+
| Card with            |          | Card with            |
| visible border       |    -->   | barely-there border  |
| around it            |          | (5-7% white opacity) |
+----------------------+          +----------------------+
    ^--- rgb(55,65,81)                ^--- rgba(255,255,255,0.07)
```

**Token**: `--color-ui-border` with subtle opacity values

### 3. Generous Whitespace

Content needs room to breathe. Cramped layouts feel cheap.

```
Before (Cramped)                  After (Generous)
+------------------------+        +------------------------+
|Title                   |        |                        |
|Subtitle                |        | Title                  |
|[Button][Button]        |        |                        |
|Content here...         |        | Subtitle               |
|More content...         |        |                        |
+------------------------+        | [Button]   [Button]    |
                                  |                        |
                                  | Content here...        |
                                  |                        |
                                  +------------------------+
```

**Guidelines**:
- Section padding: 32-64px
- Card padding: 24px
- Element gaps: 12-16px
- Line height: 1.5-1.6

### 4. 0.2s Transitions

Every interactive element should have smooth, perceptible transitions.

```
Duration Guide:
+-----------+----------+----------------------------------+
| Duration  | Easing   | Use Case                         |
+-----------+----------+----------------------------------+
| 0.15s     | ease-out | Buttons, quick feedback          |
| 0.2s      | ease-out | Cards, general interactions      |
| 0.3s      | ease-out | Page transitions, modals         |
| 0.4s      | ease-out | Complex animations, stagger      |
+-----------+----------+----------------------------------+
```

**Token**: `--transition-default: all 0.2s ease-out;`

### 5. Opacity-Based Text Hierarchy

Use opacity to create depth, not arbitrary gray values.

```
Text Hierarchy Stack:
+-----------------------------------------------+
|  Primary Text     | 100% opacity | #FFFFFF    |
|  (headings, CTAs) |              |            |
+-----------------------------------------------+
|  Secondary Text   | 70% opacity  | rgba(...)  |
|  (body, labels)   |              |            |
+-----------------------------------------------+
|  Tertiary Text    | 50% opacity  | rgba(...)  |
|  (hints, meta)    |              |            |
+-----------------------------------------------+
|  Muted Text       | 40% opacity  | rgba(...)  |
|  (disabled)       |              |            |
+-----------------------------------------------+
```

**Tokens**: `--color-ui-text`, `--color-ui-text-secondary`, `--color-ui-text-tertiary`

---

## File Index

### Core Documentation

| File | Description | Status |
|------|-------------|--------|
| `MASTER_PLAN.md` | Complete roadmap, templates, implementation phases | Complete |
| `INDEX.md` | This file - comprehensive entry point | Complete |

### Design Tokens (`tokens/`)

| File | Description | Status |
|------|-------------|--------|
| `colors.md` | Two-tier color architecture, Mintlify mapping, recommendations | Complete |
| `typography.md` | Font stack, type scale, text hierarchy | TODO |
| `spacing.md` | Spacing scale, layout constraints, border radius | TODO |
| `animations.md` | Keyframes, transitions, staggered animations, microinteractions | Complete |

### Page Specifications (`pages/`)

Each page gets a detailed spec with current state analysis, target wireframes, and implementation checklists.

| File | Page | Priority | Status |
|------|------|----------|--------|
| `01-landing.md` | Landing / Marketing | HIGH | TODO |
| `02-signin.md` | Sign In | HIGH | Complete |
| `03-signup.md` | Sign Up | HIGH | TODO |
| `04-dashboard.md` | Main Dashboard | HIGH | TODO |
| `05-projects.md` | Projects List | MEDIUM | TODO |
| `06-board.md` | Project Kanban Board | HIGH | TODO |
| `07-backlog.md` | Project Backlog | MEDIUM | TODO |
| `08-issue.md` | Issue Detail View | HIGH | TODO |
| `09-documents.md` | Documents List | MEDIUM | TODO |
| `10-editor.md` | Document Editor | HIGH | TODO |
| `11-calendar.md` | Calendar Views | MEDIUM | TODO |
| `12-settings.md` | Settings Pages | LOW | TODO |
| `13-analytics.md` | Analytics Dashboard | LOW | TODO |

### Component Specifications (`components/`)

| File | Component | Priority | Status |
|------|-----------|----------|--------|
| `button.md` | Button variants | HIGH | TODO |
| `card.md` | Card containers | HIGH | TODO |
| `input.md` | Form inputs | HIGH | TODO |
| `dialog.md` | Modal/Dialog | HIGH | TODO |
| `dropdown.md` | Dropdown menus | MEDIUM | TODO |
| `tooltip.md` | Tooltips | MEDIUM | TODO |
| `badge.md` | Status badges | MEDIUM | TODO |
| `avatar.md` | User avatars | MEDIUM | TODO |
| `navigation.md` | Top navigation | HIGH | TODO |
| `sidebar.md` | Side navigation | HIGH | TODO |
| `table.md` | Data tables | MEDIUM | TODO |
| `empty-state.md` | Empty states | HIGH | TODO |
| `loading.md` | Loading states | MEDIUM | TODO |

---

## Key Metrics: Before/After Comparison

### Visual Polish Score (Subjective 1-10)

| Aspect | Before | Target | Notes |
|--------|--------|--------|-------|
| Dark mode depth | 4 | 9 | Near-black vs gray |
| Border subtlety | 5 | 9 | Opacity-based |
| Whitespace balance | 5 | 8 | Generous padding |
| Animation polish | 3 | 8 | Consistent 0.2s |
| Text hierarchy | 6 | 9 | Opacity-based |
| Component quality | 6 | 9 | Refined details |
| **Overall** | **4.8** | **8.7** | Enterprise-grade |

### Technical Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Semantic color tokens | ~60 | ~80+ |
| Animation keyframes | 3 | 15+ |
| Transition coverage | ~40% | 100% |
| Dark mode support | Good | Excellent |
| Accessibility (WCAG) | AA | AAA |

---

## Implementation Priority

### Phase 1: Foundation (CRITICAL)

```
Week 1-2: Token System Overhaul
+------------------------------------------+
| 1. Update dark mode background to #08090a |
| 2. Add opacity-based border tokens        |
| 3. Add animation keyframes to index.css   |
| 4. Update text hierarchy tokens           |
| 5. Add transition utilities               |
+------------------------------------------+
```

**Files to modify**:
- `src/index.css` - Add new tokens and keyframes
- `src/components/ui/` - Update to use new tokens

### Phase 2: Core Components (HIGH)

```
Week 2-4: Component Refresh
+------------------------------------------+
| 1. Button - all variants with animations  |
| 2. Card - subtle borders, hover lift      |
| 3. Input - dark theme, focus states       |
| 4. Dialog - scale-in animation            |
| 5. Sidebar - smooth transitions           |
| 6. Navigation - refined hover states      |
+------------------------------------------+
```

### Phase 3: Auth Flow (HIGH)

```
Week 3-4: First Impression
+------------------------------------------+
| 1. Landing page hero redesign             |
| 2. Sign-in full-screen dark               |
| 3. Sign-up flow polish                    |
| 4. Onboarding experience                  |
+------------------------------------------+
```

### Phase 4: Dashboard & App (MEDIUM)

```
Week 4-6: Core Experience
+------------------------------------------+
| 1. Dashboard layout refresh               |
| 2. Project board polish                   |
| 3. Issue detail view                      |
| 4. Document editor                        |
| 5. Calendar views                         |
+------------------------------------------+
```

### Phase 5: Micro-interactions (LOW)

```
Week 6-8: Polish Pass
+------------------------------------------+
| 1. Page transitions                       |
| 2. Staggered list animations              |
| 3. Loading skeletons                      |
| 4. Empty state illustrations              |
| 5. Success/error feedback                 |
+------------------------------------------+
```

---

## Resource Links

### Mintlify Research (Primary Inspiration)

```
docs/research/library/mintlify/
├── README.md                    # Overview and study notes
├── landing_deep.json            # CSS token extraction
├── landing_desktop_dark.png     # Dark mode reference
├── landing_desktop_light.png    # Light mode reference
├── signup_desktop_dark.png      # Auth flow reference
├── pricing_desktop_dark.png     # Pricing page reference
├── dashboard/                   # Dashboard captures
│   ├── editor-full.png         # Document editor
│   ├── settings-*.png          # Settings pages
│   └── ...
├── assets/
│   ├── css/                    # Extracted stylesheets
│   ├── fonts/                  # Inter Variable font
│   └── animations/             # Lottie files
└── *_motion.webm               # Interaction recordings
```

### Current App Screenshots

```
e2e/screenshots/
├── Empty States (01-12)
│   ├── 01-empty-landing.png
│   ├── 02-empty-signin.png
│   ├── 03-empty-invite-invalid.png
│   ├── 04-empty-dashboard.png
│   ├── 05-empty-projects.png
│   ├── 06-empty-issues.png
│   ├── 07-empty-documents.png
│   ├── 08-empty-documents-templates.png
│   ├── 09-empty-workspaces.png
│   ├── 10-empty-time-tracking.png
│   ├── 11-empty-settings.png
│   └── 12-empty-settings-profile.png
│
└── Filled States (01-34)
    ├── 01-filled-dashboard.png
    ├── 02-filled-projects.png
    ├── 03-filled-issues.png
    ├── ...
    ├── 24-filled-issue-demo-1.png
    ├── 31-filled-document-editor.png
    └── ...
```

### Theme File

```
src/index.css
├── @theme block (line 7-227)
│   ├── Border Radius tokens
│   ├── Box Shadow tokens
│   ├── Surface color tokens (6)
│   ├── Text color tokens (4)
│   ├── Border color tokens (4)
│   ├── Brand color tokens (9)
│   ├── Accent color tokens (9)
│   ├── Status color tokens (12)
│   ├── Palette color tokens (30)
│   ├── Priority color tokens (5)
│   ├── Issue type color tokens (5)
│   ├── Landing color tokens (4)
│   ├── Custom spacing tokens
│   └── Animation keyframes (3 existing)
│
└── :root block (line 234-400)
    └── Tier 1 Color Primitives
```

### Component Library

```
src/components/ui/
├── button.tsx
├── card.tsx
├── input.tsx
├── dialog.tsx
├── dropdown-menu.tsx
├── tooltip.tsx
├── badge.tsx
├── avatar.tsx
├── typography.tsx
├── flex.tsx
├── loading-spinner.tsx
├── empty-state.tsx
└── ...
```

---

## ASCII Site Map

```
NIXELO APPLICATION STRUCTURE
============================

                              +----------------+
                              |    Landing     |
                              |    (index)     |
                              +-------+--------+
                                      |
              +-----------------------+------------------------+
              |                       |                        |
      +-------v-------+       +-------v-------+        +-------v-------+
      |    Sign In    |       |    Sign Up    |        |    Invite     |
      |   (signin)    |       |   (signup)    |        | (invite.$tok) |
      +-------+-------+       +-------+-------+        +---------------+
              |                       |
              +-----------+-----------+
                          |
                  +-------v-------+
                  |  Onboarding   |
                  |  (onboarding) |
                  +-------+-------+
                          |
                          |
+-------------------------v-----------------------------------------+
|                         AUTHENTICATED APP                          |
|  +--------------------------------------------------------------+  |
|  |                    Organization Context                       |  |
|  |  /$orgSlug                                                   |  |
|  |                                                              |  |
|  |  +------------------+  +------------------+  +--------------+ |  |
|  |  |    Dashboard     |  |    Projects      |  |    Issues    | |  |
|  |  |   (dashboard)    |  |   (projects/)    |  |   (issues/)  | |  |
|  |  +------------------+  +--------+---------+  +------+-------+ |  |
|  |                                 |                   |         |  |
|  |                     +-----------+-----------+       |         |  |
|  |                     |                       |       |         |  |
|  |             +-------v-------+       +-------v-------+-------v-+  |
|  |             | Project Detail|       | Issue Detail           |  |
|  |             | /$key         |       | /$key                  |  |
|  |             +-------+-------+       +------------------------+  |
|  |                     |                                         |  |
|  |     +---------------+---------------+---------------+         |  |
|  |     |       |       |       |       |       |       |         |  |
|  |  +--v--+ +--v--+ +--v--+ +--v--+ +--v--+ +--v--+ +--v--+      |  |
|  |  |Board| |Back | |Sprnt| |Road | |Calndr| |Activ| |Anltc|     |  |
|  |  |     | |log  | |     | |map  | |      | |ity  | |     |     |  |
|  |  +-----+ +-----+ +-----+ +-----+ +------+ +-----+ +-----+     |  |
|  |                                                              |  |
|  |  +------------------+  +------------------+  +--------------+ |  |
|  |  |    Documents     |  |   Workspaces     |  |    Time      | |  |
|  |  |   (documents/)   |  |  (workspaces/)   |  |   Tracking   | |  |
|  |  +--------+---------+  +--------+---------+  +--------------+ |  |
|  |           |                     |                             |  |
|  |   +-------v-------+     +-------v-------+                     |  |
|  |   | Doc Editor    |     | Workspace     |                     |  |
|  |   | /$id          |     | /$slug        |                     |  |
|  |   +---------------+     +-------+-------+                     |  |
|  |                                 |                             |  |
|  |                         +-------v-------+                     |  |
|  |                         |    Teams      |                     |  |
|  |                         | (teams/)      |                     |  |
|  |                         +-------+-------+                     |  |
|  |                                 |                             |  |
|  |                         +-------v-------+                     |  |
|  |                         | Team Detail   |                     |  |
|  |                         | /$teamSlug    |                     |  |
|  |                         +---------------+                     |  |
|  |                                                              |  |
|  |  +------------------+                                        |  |
|  |  |    Settings      |                                        |  |
|  |  |   (settings/)    |                                        |  |
|  |  +--------+---------+                                        |  |
|  |           |                                                  |  |
|  |   +-------v-------+                                          |  |
|  |   |    Profile    |                                          |  |
|  |   |   (profile)   |                                          |  |
|  |   +---------------+                                          |  |
|  +--------------------------------------------------------------+  |
+--------------------------------------------------------------------+


PAGE COUNT SUMMARY
==================
Auth/Public:     5 pages (landing, signin, signup, forgot-password, invite)
Onboarding:      1 page
Dashboard:       1 page
Projects:        9 pages (list + detail with 8 tabs)
Issues:          2 pages (list + detail)
Documents:       3 pages (list + templates + editor)
Workspaces:      4 pages (list + detail + teams + team detail)
Time Tracking:   1 page
Settings:        2 pages (general + profile)
-----------------------------------------
TOTAL:          28 unique page templates
```

---

## Token Quick Reference

### Colors (Most Used)

```css
/* Surfaces */
bg-ui-bg              /* Primary background */
bg-ui-bg-secondary    /* Elevated surfaces */
bg-ui-bg-tertiary     /* Hover states */
bg-ui-bg-hero         /* Hero sections (near-black) */

/* Text */
text-ui-text          /* Primary text */
text-ui-text-secondary /* Secondary text (70%) */
text-ui-text-tertiary  /* Tertiary text (50%) */

/* Brand */
bg-brand              /* Primary actions */
text-brand            /* Links, accents */
border-brand-ring     /* Focus rings */

/* Status */
text-status-success   /* Success states */
text-status-error     /* Error states */
bg-status-warning-bg  /* Warning backgrounds */
```

### Animations (Ready to Use)

```css
/* Entry */
animation: fade-in 0.3s ease-out;
animation: slide-up 0.4s ease-out;
animation: scale-in 0.2s ease-out;

/* Utility */
animation: spin 1s linear infinite;

/* Transitions */
transition: all 0.2s ease-out;  /* Default */
transition: all 0.15s ease-out; /* Fast */
transition: all 0.3s ease-out;  /* Slow */
```

### Spacing (Common Values)

```css
/* Gaps */
gap-2   /* 8px - tight */
gap-3   /* 12px - default */
gap-4   /* 16px - medium */
gap-6   /* 24px - large */

/* Padding */
p-4     /* 16px - default */
p-6     /* 24px - cards */
p-8     /* 32px - sections */
p-12    /* 48px - major sections */
```

---

## Contributing to the Design System

### Adding a New Page Spec

1. Copy the template from `MASTER_PLAN.md` > "Page Spec Template"
2. Create file in `docs/design-system/pages/XX-pagename.md`
3. Fill in current state analysis with screenshots
4. Document target state with ASCII wireframes
5. List all components used
6. Create implementation checklist

### Adding a New Component Spec

1. Copy the template from `MASTER_PLAN.md` > "Component Spec Template"
2. Create file in `docs/design-system/components/component-name.md`
3. Document all variants and states
4. Include Mintlify reference screenshots
5. List all tokens used
6. Add accessibility notes

### Updating Tokens

1. Propose changes in a design doc first
2. Update `src/index.css` `@theme` block
3. Update `docs/design-system/tokens/` documentation
4. Run validator: `node scripts/validate.js`
5. Update affected components

---

## FAQ

### Why Mintlify as inspiration?

Mintlify represents the current gold standard for SaaS design - premium, polished, and trusted by enterprises like Anthropic, Vercel, and X. Their design choices reflect thousands of hours of refinement.

### Are we copying Mintlify?

No. We're learning from their design language while maintaining Nixelo's unique brand identity (indigo instead of emerald, project management context instead of documentation). The goal is to achieve the same level of polish, not the same appearance.

### Why near-black instead of gray-900?

Near-black (#08090a) creates a sense of depth and premium quality. Content appears to float on a void rather than sit on a visible surface. It's subtle but impactful.

### Why 0.2s transitions?

0.2s is the sweet spot - fast enough to feel responsive, slow enough to be perceived. Faster feels robotic, slower feels sluggish. This duration is backed by UX research and matches Mintlify's choices.

### How do I know which tokens to use?

Always use semantic tokens (Tier 2). If you need `bg-gray-900`, use `bg-ui-bg` instead. The tokens automatically handle light/dark mode via `light-dark()`. Check `src/index.css` for all available tokens.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-02-05 | Created INDEX.md with comprehensive documentation | Design System Team |
| 2026-02-05 | Added colors.md and animations.md token docs | Design System Team |
| 2026-02-05 | Added 02-signin.md page specification | Design System Team |
| 2026-02-05 | Created MASTER_PLAN.md with templates and roadmap | Design System Team |

---

*This document is the central hub for Nixelo's design system. For questions or contributions, start here and follow the links to specific documentation.*
