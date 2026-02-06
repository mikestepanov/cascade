# Nixelo Design System Overhaul - Master Plan

> **Goal**: Transform Nixelo from "functional but generic" to "Mintlify-level premium polish"
> **Source Material**: `docs/research/library/mintlify/` (453 files - complete site capture)
> **Status**: IN PROGRESS

---

## Table of Contents

1. [Design Tokens](#1-design-tokens)
2. [Page-by-Page Breakdown](#2-page-by-page-breakdown)
3. [Component Library](#3-component-library)
4. [Animation System](#4-animation-system)
5. [Typography System](#5-typography-system)
6. [Color System](#6-color-system)
7. [Spacing & Layout](#7-spacing--layout)
8. [Implementation Phases](#8-implementation-phases)

---

## 1. Design Tokens

**Source**: `docs/research/library/mintlify/landing_deep.json`

### 1.1 Colors (Dark Mode Primary)

| Token | Mintlify Value | Nixelo Current | Action |
|-------|----------------|----------------|--------|
| `--color-bg-primary` | `#08090a` | TBD | Update |
| `--color-bg-soft` | `rgba(255,255,255,.05)` | TBD | Update |
| `--color-text-primary` | `#fff` | TBD | Verify |
| `--color-text-soft` | `rgba(255,255,255,.7)` | TBD | Update |
| `--color-text-muted` | `rgba(255,255,255,.5)` | TBD | Update |
| `--color-border-subtle` | `rgba(255,255,255,.07)` | TBD | Update |
| `--color-border-soft` | `rgba(255,255,255,.15)` | TBD | Update |
| `--color-brand` | `#18e299` | Teal variant | Keep Nixelo brand |

### 1.2 Typography

| Token | Mintlify Value | Purpose |
|-------|----------------|---------|
| `--font-body` | Inter | Body text |
| `--font-mono` | Geist Mono | Code blocks |
| `--tw-tracking` | `-0.24px` | Heading letter-spacing |
| `--tw-duration` | `0.2s` | Default transition |

### 1.3 Spacing Scale

TBD - Extract from CSS analysis

### 1.4 Border Radius Scale

TBD - Extract from CSS analysis

---

## 2. Page-by-Page Breakdown

Each page gets its own detailed spec file in `docs/design-system/pages/`

### Pages to Document

| Page | Source Screenshots | Spec File | Status |
|------|-------------------|-----------|--------|
| Landing | `landing_desktop_*.png` | `pages/01-landing.md` | TODO |
| Sign In | `app-dashboard_desktop_*.png` | `pages/02-signin.md` | TODO |
| Sign Up | `signup_desktop_*.png` | `pages/03-signup.md` | TODO |
| Dashboard | `dashboard/*.png` | `pages/04-dashboard.md` | TODO |
| Projects List | N/A (Nixelo-specific) | `pages/05-projects.md` | TODO |
| Project Board | N/A (Nixelo-specific) | `pages/06-board.md` | TODO |
| Project Backlog | N/A (Nixelo-specific) | `pages/07-backlog.md` | TODO |
| Issue Detail | N/A (Nixelo-specific) | `pages/08-issue.md` | TODO |
| Documents List | N/A (Nixelo-specific) | `pages/09-documents.md` | TODO |
| Document Editor | `dashboard/editor-full.png` | `pages/10-editor.md` | TODO |
| Calendar | N/A (Nixelo-specific) | `pages/11-calendar.md` | TODO |
| Settings | `dashboard/settings-*.png` | `pages/12-settings.md` | TODO |
| Analytics | `dashboard/analytics.png` | `pages/13-analytics.md` | TODO |

### Page Spec Template

Each page spec file should contain:

```markdown
# [Page Name]

## Current State
- Screenshot: `e2e/screenshots/XX-filled-*.png`
- Issues identified: [list]

## Target State
- Reference: `docs/research/library/mintlify/[file].png`
- Key improvements: [list]

## ASCII Wireframe
[ASCII representation of layout]

## Functionality Breakdown
- [ ] Feature 1
- [ ] Feature 2

## Component Inventory
| Component | Current | Target | Notes |
|-----------|---------|--------|-------|

## Design Tokens Used
- Colors: [list]
- Typography: [list]
- Spacing: [list]

## Animations
- Entry: [description]
- Hover states: [description]
- Transitions: [description]

## Implementation Checklist
- [ ] Update layout structure
- [ ] Apply new color tokens
- [ ] Add animations
- [ ] Update components
- [ ] Test responsive breakpoints
```

---

## 3. Component Library

Each component gets documented in `docs/design-system/components/`

### Core Components

| Component | Spec File | Priority |
|-----------|-----------|----------|
| Button | `components/button.md` | HIGH |
| Card | `components/card.md` | HIGH |
| Input | `components/input.md` | HIGH |
| Modal/Dialog | `components/dialog.md` | HIGH |
| Dropdown | `components/dropdown.md` | MEDIUM |
| Tooltip | `components/tooltip.md` | MEDIUM |
| Badge | `components/badge.md` | MEDIUM |
| Avatar | `components/avatar.md` | MEDIUM |
| Navigation | `components/navigation.md` | HIGH |
| Sidebar | `components/sidebar.md` | HIGH |
| Table | `components/table.md` | MEDIUM |
| Empty State | `components/empty-state.md` | HIGH |
| Loading | `components/loading.md` | MEDIUM |

### Component Spec Template

```markdown
# [Component Name]

## Visual Reference
- Mintlify: [screenshot path]
- Current Nixelo: [screenshot path]

## Variants
- Default
- Hover
- Active
- Disabled
- Loading

## ASCII States
[ASCII for each state]

## Props/API
| Prop | Type | Default | Description |
|------|------|---------|-------------|

## Styling Tokens
- Background: [token]
- Border: [token]
- Text: [token]
- Shadow: [token]

## Animations
- Hover: [description]
- Click: [description]
- Entry: [description]

## Accessibility
- Focus states
- ARIA attributes
- Keyboard navigation

## Code Example
[Current implementation snippet]

## Target Implementation
[Target implementation snippet]
```

---

## 4. Animation System

**Source**: `landing_deep.json` keyframes

### 4.1 Entry Animations

```css
@keyframes enterFromRight {
  0% { opacity: 0; transform: translate(200px); }
  100% { opacity: 1; transform: translate(0px); }
}

@keyframes enterFromLeft {
  0% { opacity: 0; transform: translate(-200px); }
  100% { opacity: 1; transform: translate(0px); }
}

@keyframes scaleIn {
  0% { opacity: 0; transform: rotateX(-10deg) scale(0.96); }
  100% { opacity: 1; transform: rotateX(0deg) scale(1); }
}
```

### 4.2 Exit Animations

```css
@keyframes exitToRight {
  0% { opacity: 1; transform: translate(0px); }
  100% { opacity: 0; transform: translate(200px); }
}

@keyframes exitToLeft {
  0% { opacity: 1; transform: translate(0px); }
  100% { opacity: 0; transform: translate(-200px); }
}

@keyframes scaleOut {
  0% { opacity: 1; transform: rotateX(0deg) scale(1); }
  100% { opacity: 0; transform: rotateX(-10deg) scale(0.96); }
}
```

### 4.3 Utility Animations

```css
@keyframes spin {
  100% { transform: rotate(360deg); }
}

@keyframes loader-spin {
  100% { transform: rotate(1turn); }
}
```

### 4.4 Transition Defaults

- Duration: `0.2s`
- Easing: `ease-out` (for entries), `ease-in` (for exits)
- Hover transitions: `all 0.2s ease`

---

## 5. Typography System

### 5.1 Font Stack

```css
--font-body: "Inter", "Inter Fallback", system-ui, sans-serif;
--font-mono: "Geist Mono", "Geist Mono Fallback", ui-monospace, monospace;
```

### 5.2 Type Scale

| Name | Size | Weight | Line Height | Letter Spacing | Usage |
|------|------|--------|-------------|----------------|-------|
| Display | 48px+ | 700 | 1.1 | -0.5px | Hero headlines |
| H1 | 36px | 700 | 1.2 | -0.24px | Page titles |
| H2 | 28px | 600 | 1.3 | -0.24px | Section titles |
| H3 | 22px | 600 | 1.4 | -0.12px | Subsections |
| H4 | 18px | 600 | 1.4 | 0 | Card titles |
| Body | 16px | 400 | 1.6 | 0 | Default text |
| Body SM | 14px | 400 | 1.5 | 0 | Secondary text |
| Caption | 12px | 400 | 1.4 | 0.2px | Labels, metadata |
| Code | 14px | 400 | 1.5 | 0 | Inline code |

### 5.3 Text Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-text-primary` | `#fff` | Primary content |
| `--color-text-soft` | `rgba(255,255,255,.7)` | Secondary content |
| `--color-text-muted` | `rgba(255,255,255,.5)` | Tertiary/disabled |
| `--color-text-brand` | `var(--color-brand)` | Links, accents |

---

## 6. Color System

### 6.1 Background Colors

| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `--color-bg-primary` | `#08090a` | `#fff` | Page background |
| `--color-bg-soft` | `rgba(255,255,255,.05)` | `rgba(0,0,0,.03)` | Subtle sections |
| `--color-bg-card` | `rgba(255,255,255,.03)` | `#fff` | Card backgrounds |
| `--color-bg-hover` | `rgba(255,255,255,.08)` | `rgba(0,0,0,.05)` | Hover states |

### 6.2 Border Colors

| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `--color-border-subtle` | `rgba(255,255,255,.07)` | `rgba(0,0,0,.07)` | Default borders |
| `--color-border-soft` | `rgba(255,255,255,.15)` | `rgba(0,0,0,.15)` | Emphasized borders |
| `--color-border-solid` | `#fff` | `#000` | Strong borders |

### 6.3 Brand Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-brand` | `#18e299` (Mintlify) / Nixelo teal | Primary brand |
| `--color-brand-soft` | `rgba(brand, 0.15)` | Brand backgrounds |
| `--color-brand-hover` | Lightened variant | Hover states |

### 6.4 Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-success` | Green | Positive states |
| `--color-warning` | Orange | Warning states |
| `--color-error` | Red | Error states |
| `--color-info` | Blue | Informational |

---

## 7. Spacing & Layout

### 7.1 Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight gaps |
| `--space-2` | 8px | Small gaps |
| `--space-3` | 12px | Default gap |
| `--space-4` | 16px | Medium gap |
| `--space-5` | 20px | Section padding |
| `--space-6` | 24px | Card padding |
| `--space-8` | 32px | Large sections |
| `--space-10` | 40px | Page sections |
| `--space-12` | 48px | Major sections |
| `--space-16` | 64px | Hero spacing |

### 7.2 Layout Constraints

| Token | Value | Usage |
|-------|-------|-------|
| `--max-width-content` | 1200px | Main content |
| `--max-width-narrow` | 680px | Text content |
| `--max-width-card` | 400px | Card max width |
| `--sidebar-width` | 240px | Navigation |
| `--header-height` | 64px | Top bar |

### 7.3 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Small elements |
| `--radius-md` | 8px | Default |
| `--radius-lg` | 12px | Cards |
| `--radius-xl` | 16px | Modals |
| `--radius-full` | 9999px | Pills, avatars |

---

## 8. Implementation Phases

### Phase 1: Foundation (HIGH PRIORITY)
- [ ] Update `src/index.css` with new design tokens
- [ ] Update dark mode background to near-black
- [ ] Reduce border visibility globally
- [ ] Add animation keyframes
- [ ] Update font configuration

### Phase 2: Core Components
- [ ] Button component refresh
- [ ] Card component refresh
- [ ] Input/Form components refresh
- [ ] Navigation/Sidebar refresh
- [ ] Modal/Dialog refresh

### Phase 3: Auth Flow
- [ ] Landing page hero redesign
- [ ] Sign-in page (full-screen, minimal)
- [ ] Sign-up page
- [ ] Onboarding flow

### Phase 4: Dashboard & App
- [ ] Dashboard layout refresh
- [ ] Project board polish
- [ ] Issue detail polish
- [ ] Document editor polish
- [ ] Settings pages

### Phase 5: Micro-interactions
- [ ] Page transitions
- [ ] Hover state animations
- [ ] Loading states
- [ ] Empty state illustrations
- [ ] Success/error feedback

---

## File Structure

```
docs/design-system/
├── MASTER_PLAN.md              # This file
├── tokens/
│   ├── colors.md               # Color system deep dive
│   ├── typography.md           # Typography deep dive
│   ├── spacing.md              # Spacing deep dive
│   └── animations.md           # Animation deep dive
├── pages/
│   ├── 01-landing.md
│   ├── 02-signin.md
│   ├── 03-signup.md
│   ├── 04-dashboard.md
│   ├── 05-projects.md
│   ├── 06-board.md
│   ├── 07-backlog.md
│   ├── 08-issue.md
│   ├── 09-documents.md
│   ├── 10-editor.md
│   ├── 11-calendar.md
│   ├── 12-settings.md
│   └── 13-analytics.md
├── components/
│   ├── button.md
│   ├── card.md
│   ├── input.md
│   ├── dialog.md
│   ├── dropdown.md
│   ├── tooltip.md
│   ├── badge.md
│   ├── avatar.md
│   ├── navigation.md
│   ├── sidebar.md
│   ├── table.md
│   ├── empty-state.md
│   └── loading.md
└── assets/
    ├── current/                # Current Nixelo screenshots
    └── target/                 # Target state mockups/references
```

---

## Agent Instructions

When working on this design system:

1. **Always reference source material** in `docs/research/library/mintlify/`
2. **Use deep.json files** for exact CSS values
3. **Include ASCII wireframes** for visual clarity
4. **Document before/after** states
5. **Link to specific screenshots** for visual reference
6. **Keep Nixelo's brand identity** - don't blindly copy Mintlify colors
7. **Test responsive breakpoints** - mobile, tablet, desktop, ultrawide

---

## Quick Reference

### Mintlify Source Files
- Landing: `landing_desktop_dark.png`, `landing_deep.json`
- Auth: `app-dashboard_desktop_dark.png`
- Dashboard: `dashboard/*.png`
- Editor: `dashboard/editor-full.png`
- All CSS: `assets/css/*.css`
- All Animations: `landing_deep.json` → keyframes

### Nixelo Current State
- All pages: `e2e/screenshots/*.png`
- Theme: `src/index.css`
- Components: `src/components/ui/`

---

*Last Updated: 2026-02-05*
*Created by: Design System Overhaul Initiative*
