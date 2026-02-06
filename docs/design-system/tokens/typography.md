# Typography Design Tokens

> **Source**: Mintlify design research + Nixelo implementation
> **Last Updated**: 2026-02-05

This document defines the complete typography system for Nixelo, based on analysis of Mintlify's design patterns and current implementation.

---

## Table of Contents

1. [Font Families](#font-families)
2. [Type Scale](#type-scale)
3. [Letter Spacing](#letter-spacing)
4. [Line Height](#line-height)
5. [Font Weights](#font-weights)
6. [Type Hierarchy Examples](#type-hierarchy-examples)
7. [CSS Implementation](#css-implementation)
8. [Gap Analysis: Nixelo vs Mintlify](#gap-analysis-nixelo-vs-mintlify)
9. [Usage Guidelines](#usage-guidelines)

---

## Font Families

### Primary Font: Inter

Inter is the primary typeface for all UI text, chosen for its excellent readability at small sizes and robust support for variable font features.

```css
--font-family-sans: "Inter var", ui-sans-serif, system-ui, -apple-system,
                    BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
                    Arial, "Noto Sans", sans-serif;
```

**Mintlify Reference:**
```css
--font-inter: "inter", "inter Fallback";
```

### Monospace Font: Geist Mono

Geist Mono is used for code blocks, inline code, and technical content. It features excellent legibility and a modern aesthetic.

```css
--font-family-mono: "Geist Mono", ui-monospace, SFMono-Regular,
                    "SF Mono", Menlo, Consolas, "Liberation Mono",
                    monospace;
```

**Mintlify Reference:**
```css
--font-geist-mono: "Geist Mono", "Geist Mono Fallback";
```

### Font Files Available

| Font | Format | Weight Range | File |
|------|--------|--------------|------|
| Inter Variable | TTF | 100-900 | `InterVariable-s.p.494bb210.ttf` |
| Geist Mono | WOFF2 | 100-900 | Multiple WOFF2 files |

---

## Type Scale

The type scale follows a modular ratio of approximately 1.25 (major third), providing clear visual hierarchy.

### Complete Scale

| Token | Size | Tailwind Class | Use Case |
|-------|------|----------------|----------|
| `display` | 60px / 3.75rem | `text-6xl` | Hero headlines, landing pages |
| `h1` | 48px / 3rem | `text-5xl` (lg) / `text-4xl` | Page titles |
| `h2` | 30px / 1.875rem | `text-3xl` | Section headings |
| `h3` | 24px / 1.5rem | `text-2xl` | Subsection headings |
| `h4` | 20px / 1.25rem | `text-xl` | Card titles, minor headings |
| `body` | 16px / 1rem | `text-base` | Body text, default |
| `body-sm` | 14px / 0.875rem | `text-sm` | Secondary text, metadata |
| `caption` | 12px / 0.75rem | `text-xs` | Labels, timestamps |
| `micro` | 10px / 0.625rem | `text-caption` | Badge text, tiny labels |
| `code` | 14px / 0.875rem | `text-sm` | Inline code |
| `code-block` | 14px / 0.875rem | `text-sm` | Code blocks |

### ASCII Type Scale Visualization

```
Display (60px)   ████████████████████████████████████████████████████████████
H1 (48px)        ████████████████████████████████████████████████
H2 (30px)        ██████████████████████████████
H3 (24px)        ████████████████████████
H4 (20px)        ████████████████████
Body (16px)      ████████████████
Body-sm (14px)   ██████████████
Caption (12px)   ████████████
Micro (10px)     ██████████
```

---

## Letter Spacing

Letter spacing (tracking) is critical for readability and visual polish. Mintlify uses tight tracking for headings.

### Values

| Element | Value | CSS Property | Notes |
|---------|-------|--------------|-------|
| Display | -0.02em | `tracking-tight` | Tight for large sizes |
| H1 | -0.015em / -0.24px | `tracking-tight` | Mintlify signature: `-0.24px` |
| H2 | -0.01em | `tracking-tight` | Slightly tight |
| H3 | -0.01em | `tracking-tight` | Slightly tight |
| H4 | 0 | `tracking-normal` | Normal |
| Body | 0 | `tracking-normal` | Normal for readability |
| Caption | 0.01em | `tracking-wide` | Slightly loose for small text |
| Code | 0 | `tracking-normal` | Normal |

### Mintlify's Magic Number

Mintlify uses a specific tracking value for headings:

```css
--tw-tracking: -0.24px;
```

This creates the tight, polished feel in headlines. The value translates to approximately `-0.015em` at 16px base.

---

## Line Height

Line height (leading) ensures comfortable reading and proper vertical rhythm.

### Values

| Element | Value | CSS Class | Notes |
|---------|-------|-----------|-------|
| Display | 1.1 | `leading-tight` | Compact for large display text |
| H1 | 1.2 | `leading-tight` | Tight but readable |
| H2 | 1.25 | `leading-tight` | Slightly more room |
| H3 | 1.3 | `leading-snug` | Balanced |
| H4 | 1.3 | `leading-snug` | Balanced |
| Body | 1.6 | `leading-relaxed` | Generous for readability |
| Body-sm | 1.5 | `leading-normal` | Standard |
| Caption | 1.4 | `leading-snug` | Compact |
| Code | 1.5 | `leading-normal` | Monospace needs room |
| Code-block | 1.6 | `leading-relaxed` | Matches body |

### ASCII Line Height Visualization

```
Tight (1.1-1.2)
┌────────────────────────────────────┐
│ The quick brown fox jumps over     │
│ the lazy dog. Pack my box with     │  <- Lines close together
│ five dozen liquor jugs.            │
└────────────────────────────────────┘

Relaxed (1.6-1.7)
┌────────────────────────────────────┐
│ The quick brown fox jumps over     │
│                                    │
│ the lazy dog. Pack my box with     │  <- More breathing room
│                                    │
│ five dozen liquor jugs.            │
└────────────────────────────────────┘
```

---

## Font Weights

Font weight creates hierarchy and emphasis within text elements.

### Weight Scale

| Weight | Value | CSS Class | Use Case |
|--------|-------|-----------|----------|
| Regular | 400 | `font-normal` | Body text, default |
| Medium | 500 | `font-medium` | Labels, buttons, emphasis |
| Semibold | 600 | `font-semibold` | H2-H4, subheadings |
| Bold | 700 | `font-bold` | Strong emphasis |
| Extrabold | 800 | `font-extrabold` | H1, display text |

### Weight by Element

| Element | Weight | Class |
|---------|--------|-------|
| Display | 800 | `font-extrabold` |
| H1 | 800 | `font-extrabold` |
| H2 | 600 | `font-semibold` |
| H3 | 600 | `font-semibold` |
| H4 | 600 | `font-semibold` |
| Body | 400 | `font-normal` |
| Body-sm | 400 | `font-normal` |
| Labels | 500 | `font-medium` |
| Buttons | 500 | `font-medium` |
| Caption | 400 | `font-normal` |
| Code | 400-600 | `font-normal` / `font-semibold` |

---

## Type Hierarchy Examples

### Example 1: Page Header

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║  Dashboard                                        [h1: 48px/800] ║
║  ─────────────────────                                           ║
║  Manage your projects and track progress         [lead: 20px]   ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

### Example 2: Card with Content

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║  Project Settings                                [h3: 24px/600]  ║
║                                                                  ║
║  Configure your project's name, description,     [body: 16px]   ║
║  and visibility settings. Changes are saved                     ║
║  automatically.                                                  ║
║                                                                  ║
║  ┌──────────────────────────────────────────┐                   ║
║  │ Project Name                [label: 14px/500]                ║
║  │ ┌──────────────────────────────────────┐ │                   ║
║  │ │ My Awesome Project      [input: 16px] │ │                   ║
║  │ └──────────────────────────────────────┘ │                   ║
║  └──────────────────────────────────────────┘                   ║
║                                                                  ║
║  Last updated: 2 hours ago               [caption: 12px/gray]   ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

### Example 3: Sidebar Navigation

```
┌───────────────────────────────┐
│                               │
│  WORKSPACE                    │  <- [caption: 12px/500, uppercase]
│                               │
│  ◉ Dashboard                  │  <- [body: 14px/500, active]
│  ○ Projects                   │  <- [body: 14px/400]
│  ○ Documents                  │  <- [body: 14px/400]
│  ○ Calendar                   │  <- [body: 14px/400]
│                               │
│  SETTINGS                     │  <- [caption: 12px/500, uppercase]
│                               │
│  ○ Team Settings              │  <- [body: 14px/400]
│  ○ Integrations               │  <- [body: 14px/400]
│                               │
└───────────────────────────────┘
```

### Example 4: Code Block

```
╔══════════════════════════════════════════════════════════════════╗
║ const config = {                              [code: 14px/mono]  ║
║   theme: "dark",                                                 ║
║   primaryColor: "#6366F1",                                       ║
║   fontFamily: "Inter"                                            ║
║ };                                                               ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## CSS Implementation

### Ready-to-Copy CSS for `src/index.css`

Add these tokens to the `@theme` block:

```css
@theme {
  /* ============================================================
   * TYPOGRAPHY TOKENS
   * ============================================================ */

  /* Font Families */
  --font-family-sans: "Inter var", ui-sans-serif, system-ui, -apple-system,
                      BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
                      Arial, "Noto Sans", sans-serif;
  --font-family-mono: "Geist Mono", ui-monospace, SFMono-Regular,
                      "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;

  /* Type Scale - Base sizes */
  --text-display: 3.75rem;      /* 60px */
  --text-h1: 3rem;              /* 48px */
  --text-h2: 1.875rem;          /* 30px */
  --text-h3: 1.5rem;            /* 24px */
  --text-h4: 1.25rem;           /* 20px */
  --text-body: 1rem;            /* 16px */
  --text-body-sm: 0.875rem;     /* 14px */
  --text-caption: 0.75rem;      /* 12px - already exists */
  --text-micro: 0.625rem;       /* 10px */

  /* Letter Spacing */
  --tracking-display: -0.02em;
  --tracking-heading: -0.015em;  /* Mintlify's -0.24px at 16px base */
  --tracking-tight: -0.01em;
  --tracking-normal: 0;
  --tracking-wide: 0.01em;

  /* Line Heights */
  --leading-display: 1.1;
  --leading-heading: 1.2;
  --leading-snug: 1.3;
  --leading-normal: 1.5;
  --leading-relaxed: 1.6;
  --leading-loose: 1.75;

  /* Font Weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;
}
```

### Typography Utility Classes

Add to your global styles or as component classes:

```css
/* Display Text (Hero headlines) */
.text-display {
  font-size: var(--text-display);
  font-weight: var(--font-weight-extrabold);
  letter-spacing: var(--tracking-display);
  line-height: var(--leading-display);
}

/* H1 */
.text-heading-1 {
  font-size: var(--text-h1);
  font-weight: var(--font-weight-extrabold);
  letter-spacing: var(--tracking-heading);
  line-height: var(--leading-heading);
}

/* H2 */
.text-heading-2 {
  font-size: var(--text-h2);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-heading);
}

/* H3 */
.text-heading-3 {
  font-size: var(--text-h3);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-snug);
}

/* H4 */
.text-heading-4 {
  font-size: var(--text-h4);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--tracking-normal);
  line-height: var(--leading-snug);
}

/* Body */
.text-body {
  font-size: var(--text-body);
  font-weight: var(--font-weight-normal);
  letter-spacing: var(--tracking-normal);
  line-height: var(--leading-relaxed);
}

/* Body Small */
.text-body-sm {
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-normal);
  letter-spacing: var(--tracking-normal);
  line-height: var(--leading-normal);
}

/* Caption */
.text-caption {
  font-size: var(--text-caption);
  font-weight: var(--font-weight-normal);
  letter-spacing: var(--tracking-wide);
  line-height: var(--leading-snug);
}

/* Label */
.text-label {
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--tracking-normal);
  line-height: var(--leading-normal);
}

/* Code */
.text-code {
  font-family: var(--font-family-mono);
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-normal);
  letter-spacing: var(--tracking-normal);
  line-height: var(--leading-normal);
}
```

---

## Gap Analysis: Nixelo vs Mintlify

### Current Nixelo Implementation

Based on `src/components/ui/Typography.tsx`:

```typescript
const typographyVariants = cva("text-ui-text", {
  variants: {
    variant: {
      h1: "text-4xl font-extrabold tracking-tight lg:text-5xl",
      h2: "text-3xl font-semibold tracking-tight",
      h3: "text-2xl font-semibold tracking-tight",
      h4: "text-xl font-semibold tracking-tight",
      p: "leading-7",
      // ...
    },
  },
});
```

### Comparison Table

| Aspect | Nixelo Current | Mintlify | Gap/Action |
|--------|----------------|----------|------------|
| **Primary Font** | Inter Variable | Inter | Aligned |
| **Mono Font** | Not defined | Geist Mono | Add Geist Mono |
| **H1 Size** | 36-48px responsive | 48px | Aligned |
| **Heading Tracking** | `tracking-tight` (generic) | `-0.24px` (specific) | Define exact value |
| **Display Type** | Not defined | 60px | Add display variant |
| **Body Line Height** | `leading-7` (1.75) | 1.6 | Adjust to 1.6 |
| **Font Weight Medium** | 500 via Tailwind | `--font-weight-medium` | Add CSS variable |
| **Caption Size** | `text-sm` (14px) | 12px | Add `text-caption` token |
| **Prose Tokens** | Not defined | Full prose system | Consider adding |

### Priority Actions

1. **High Priority**
   - [ ] Add `--font-family-mono` token for Geist Mono
   - [ ] Define `--tracking-heading: -0.24px` for Mintlify-style tight headings
   - [ ] Add `display` variant to Typography component

2. **Medium Priority**
   - [ ] Adjust body line height from 1.75 to 1.6
   - [ ] Add `--text-display` token for hero text
   - [ ] Define explicit letter-spacing tokens

3. **Lower Priority**
   - [ ] Add prose token system for long-form content
   - [ ] Create micro text size (10px) for badges
   - [ ] Add font weight CSS variables for consistency

---

## Usage Guidelines

### Do

- Use the `Typography` component for all text elements
- Follow the established hierarchy (display > h1 > h2 > h3 > h4 > body)
- Use `font-medium` (500) for labels and buttons
- Use `font-semibold` (600) for headings H2-H4
- Use `font-extrabold` (800) for H1 and display text

### Don't

- Don't use raw HTML tags (`<p>`, `<h1>`, etc.) - use `<Typography>`
- Don't skip heading levels (h1 to h3 without h2)
- Don't use bold (700) for headings - use semibold or extrabold
- Don't use tight tracking on body text - only on headings
- Don't mix font families within the same text block

### Component Usage Examples

```tsx
import { Typography } from "@/components/ui";

// Page title
<Typography variant="h1">Dashboard</Typography>

// Section heading
<Typography variant="h2">Recent Projects</Typography>

// Card title
<Typography variant="h4">Project Settings</Typography>

// Body text
<Typography variant="p">
  Configure your project settings here.
</Typography>

// Secondary text
<Typography variant="p" color="secondary">
  Last updated 2 hours ago
</Typography>

// Inline code
<Typography variant="inlineCode">npm install</Typography>
```

---

## References

- **Mintlify Research**: `docs/research/library/mintlify/`
- **Font Assets**: `docs/research/library/mintlify/assets/fonts/`
- **Current Implementation**: `src/index.css`, `src/components/ui/Typography.tsx`
- **Design Analysis**: `docs/research/library/mintlify/DESIGN_ANALYSIS.md`
