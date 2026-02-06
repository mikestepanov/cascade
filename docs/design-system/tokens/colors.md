# Color Tokens Reference

> **Design System Documentation** | Last Updated: 2026-02-05

This document provides a comprehensive reference for color tokens in Nixelo, with mappings from Mintlify's design system for visual polish inspiration.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Mintlify Color Tokens](#mintlify-color-tokens)
3. [Nixelo Color Tokens](#nixelo-color-tokens)
4. [Mapping Table: Mintlify to Nixelo](#mapping-table-mintlify-to-nixelo)
5. [The light-dark() CSS Function](#the-light-dark-css-function)
6. [Recommendations: KEEP vs UPDATE](#recommendations-keep-vs-update)
7. [CSS Code Blocks](#css-code-blocks)

---

## Architecture Overview

Both Mintlify and Nixelo use a **two-tier color architecture**:

```
+---------------------------+      +---------------------------+
|   TIER 1: Primitives      |      |   TIER 2: Semantic        |
|   (Raw color values)      | ---> |   (What components use)   |
|   Never use directly      |      |   Use via Tailwind        |
+---------------------------+      +---------------------------+
```

### Key Differences

| Aspect | Mintlify | Nixelo |
|--------|----------|--------|
| Brand Color | Emerald/Teal (`#18e299`) | Indigo (`#4F46E5`) |
| Background (Dark) | Near-black (`#08090a`) | Gray-900 (`#111827`) |
| Text Opacity | Uses `rgba()` with opacity | Uses Tailwind gray scale |
| Border Style | Very subtle (5-15% opacity) | More defined borders |
| Dark Mode | Default dark-first | Supports both via `light-dark()` |

---

## Mintlify Color Tokens

Extracted from `docs/research/library/mintlify/landing_deep.json`:

### Core Colors

```
+------------+------------------+-------------------------------------+
|   Swatch   |     Token        |     Value                           |
+------------+------------------+-------------------------------------+
|   [####]   | background-main  | #08090a (near-black)                |
|   [    ]   | background-invert| #fff (white)                        |
|   [    ]   | text-main        | #fff (white)                        |
|   [####]   | text-invert      | #08090a (near-black)                |
|   [====]   | text-soft        | rgba(255,255,255,0.7)               |
|   [====]   | text-sub         | rgba(255,255,255,0.6)               |
|   [----]   | muted            | rgba(255,255,255,0.5)               |
|   [----]   | muted-invert     | rgba(8,9,10,0.5)                    |
+------------+------------------+-------------------------------------+
```

### Brand Colors

```
+------------+------------------+-------------------------------------+
|   Swatch   |     Token        |     Value                           |
+------------+------------------+-------------------------------------+
|   [****]   | brand            | #18e299 (mint/emerald)              |
|   [****]   | brand-light      | #0c8c5e (darker emerald)            |
+------------+------------------+-------------------------------------+
```

### Border Colors

```
+------------+------------------+-------------------------------------+
|   Swatch   |     Token        |     Value                           |
+------------+------------------+-------------------------------------+
|   [    ]   | border-solid     | #fff (white)                        |
|   [----]   | border-soft      | rgba(255,255,255,0.15)              |
|   [....] | border-sub       | rgba(255,255,255,0.07)              |
|   [....] | border-surface   | rgba(255,255,255,0.05)              |
+------------+------------------+-------------------------------------+
```

### Surface Colors

```
+------------+------------------+-------------------------------------+
|   Swatch   |     Token        |     Value                           |
+------------+------------------+-------------------------------------+
|   [....] | background-soft  | rgba(255,255,255,0.05)              |
+------------+------------------+-------------------------------------+
```

### Code Highlighting (Twoslash)

```css
/* Error States */
--twoslash-error-color: #ff6b6b;
--twoslash-error-bg: rgba(255,107,107,0.19);

/* Warning States */
--twoslash-warn-color: orange;
--twoslash-warn-bg: rgba(255,165,0,0.19);

/* Info/Tags */
--twoslash-tag-color: #6bb6ff;
--twoslash-tag-bg: rgba(107,182,255,0.19);

/* Success/Annotate */
--twoslash-tag-annotate-color: #4ade80;
--twoslash-tag-annotate-bg: rgba(74,222,128,0.19);

/* Highlighted */
--twoslash-highlighted-border: rgba(255,165,0,0.5);
--twoslash-highlighted-bg: rgba(255,165,0,0.19);

/* Popup */
--twoslash-popup-bg: #151819;
--twoslash-border-color: #222526;
```

---

## Nixelo Color Tokens

From `src/index.css`:

### Tier 1: Color Primitives (`:root`)

These are the raw values. **Never use directly in components.**

#### Neutrals

| Token | Light Value | Swatch |
|-------|-------------|--------|
| `--p-white` | `#FFFFFF` | [    ] |
| `--p-black` | `#000000` | [####] |
| `--p-gray-50` | `#F9FAFB` | [    ] |
| `--p-gray-100` | `#F3F4F6` | [    ] |
| `--p-gray-200` | `#E5E7EB` | [====] |
| `--p-gray-300` | `#D1D5DB` | [====] |
| `--p-gray-400` | `#9CA3AF` | [----] |
| `--p-gray-500` | `#6B7280` | [----] |
| `--p-gray-600` | `#4B5563` | [####] |
| `--p-gray-700` | `#374151` | [####] |
| `--p-gray-800` | `#1F2937` | [####] |
| `--p-gray-900` | `#111827` | [####] |
| `--p-gray-950` | `#030712` | [####] |

#### Brand: Indigo

| Token | Value | Swatch |
|-------|-------|--------|
| `--p-indigo-50` | `#EEF2FF` | [    ] |
| `--p-indigo-100` | `#E0E7FF` | [    ] |
| `--p-indigo-200` | `#C7D2FE` | [====] |
| `--p-indigo-300` | `#A5B4FC` | [****] |
| `--p-indigo-400` | `#818CF8` | [****] |
| `--p-indigo-500` | `#6366F1` | [****] |
| `--p-indigo-600` | `#4F46E5` | [****] |
| `--p-indigo-700` | `#4338CA` | [****] |
| `--p-indigo-800` | `#3730A3` | [****] |
| `--p-indigo-900` | `#312E81` | [****] |
| `--p-indigo-950` | `#1E1B4B` | [****] |

#### Accent: Purple

| Token | Value | Swatch |
|-------|-------|--------|
| `--p-purple-500` | `#A855F7` | [++++] |
| `--p-purple-600` | `#9333EA` | [++++] |

#### Status Colors

| Color | 500 Value | Usage |
|-------|-----------|-------|
| Green | `#22C55E` | Success |
| Amber | `#F59E0B` | Warning |
| Red | `#EF4444` | Error |
| Blue | `#3B82F6` | Info |

### Tier 2: Semantic Tokens (`@theme`)

These are what components use. All use `light-dark()` for automatic dark mode.

#### Surface Tokens (6)

| Token | Light | Dark | Tailwind Class |
|-------|-------|------|----------------|
| `--color-ui-bg` | white | gray-900 | `bg-ui-bg` |
| `--color-ui-bg-secondary` | gray-50 | gray-800 | `bg-ui-bg-secondary` |
| `--color-ui-bg-tertiary` | gray-100 | gray-700 | `bg-ui-bg-tertiary` |
| `--color-ui-bg-elevated` | white | gray-800 | `bg-ui-bg-elevated` |
| `--color-ui-bg-overlay` | rgba(0,0,0,0.5) | rgba(0,0,0,0.75) | `bg-ui-bg-overlay` |
| `--color-ui-bg-sidebar` | #f8f9fb | gray-900 | `bg-ui-bg-sidebar` |

#### Text Tokens (4)

| Token | Light | Dark | Tailwind Class |
|-------|-------|------|----------------|
| `--color-ui-text` | gray-900 | gray-50 | `text-ui-text` |
| `--color-ui-text-secondary` | gray-500 | gray-300 | `text-ui-text-secondary` |
| `--color-ui-text-tertiary` | gray-400 | gray-400 | `text-ui-text-tertiary` |
| `--color-ui-text-inverse` | white | gray-900 | `text-ui-text-inverse` |

#### Border Tokens (4)

| Token | Light | Dark | Tailwind Class |
|-------|-------|------|----------------|
| `--color-ui-border` | gray-200 | gray-700 | `border-ui-border` |
| `--color-ui-border-secondary` | gray-300 | gray-600 | `border-ui-border-secondary` |
| `--color-ui-border-focus` | indigo-600 | indigo-400 | `border-ui-border-focus` |
| `--color-ui-border-error` | red-500 | red-400 | `border-ui-border-error` |

#### Brand Tokens (9)

| Token | Light | Dark | Tailwind Class |
|-------|-------|------|----------------|
| `--color-brand` | indigo-600 | indigo-400 | `bg-brand`, `text-brand` |
| `--color-brand-foreground` | white | white | `text-brand-foreground` |
| `--color-brand-hover` | indigo-700 | indigo-300 | `hover:bg-brand-hover` |
| `--color-brand-active` | indigo-800 | indigo-200 | `active:bg-brand-active` |
| `--color-brand-subtle` | indigo-50 | indigo-950 | `bg-brand-subtle` |
| `--color-brand-subtle-foreground` | indigo-600 | indigo-300 | `text-brand-subtle-foreground` |
| `--color-brand-muted` | indigo-400 | indigo-500 | `text-brand-muted` |
| `--color-brand-border` | indigo-200 | indigo-800 | `border-brand-border` |
| `--color-brand-ring` | indigo-400 | indigo-500 | `ring-brand-ring` |

#### Status Tokens (12)

| Token | Light | Dark | Tailwind Class |
|-------|-------|------|----------------|
| `--color-status-success` | green-500 | green-400 | `text-status-success` |
| `--color-status-success-bg` | green-50 | green-950 | `bg-status-success-bg` |
| `--color-status-success-text` | green-700 | green-300 | `text-status-success-text` |
| `--color-status-warning` | amber-500 | amber-400 | `text-status-warning` |
| `--color-status-warning-bg` | amber-50 | amber-950 | `bg-status-warning-bg` |
| `--color-status-warning-text` | amber-700 | amber-300 | `text-status-warning-text` |
| `--color-status-error` | red-500 | red-400 | `text-status-error` |
| `--color-status-error-bg` | red-50 | red-950 | `bg-status-error-bg` |
| `--color-status-error-text` | red-700 | red-300 | `text-status-error-text` |
| `--color-status-info` | blue-500 | blue-400 | `text-status-info` |
| `--color-status-info-bg` | blue-50 | blue-950 | `bg-status-info-bg` |
| `--color-status-info-text` | blue-700 | blue-300 | `text-status-info-text` |

---

## Mapping Table: Mintlify to Nixelo

| Mintlify Token | Mintlify Value | Nixelo Equivalent | Notes |
|----------------|----------------|-------------------|-------|
| `--color-background-main` | `#08090a` | `--color-ui-bg` (dark: `#111827`) | Mintlify darker |
| `--color-background-invert` | `#fff` | `--color-ui-bg` (light) | Equivalent |
| `--color-text-main` | `#fff` | `--color-ui-text` (dark: gray-50) | Equivalent |
| `--color-text-invert` | `#08090a` | `--color-ui-text` (light: gray-900) | Equivalent |
| `--color-text-soft` | `rgba(255,255,255,0.7)` | `--color-ui-text-secondary` | Mintlify uses opacity |
| `--color-text-sub` | `rgba(255,255,255,0.6)` | `--color-ui-text-tertiary` | Mintlify uses opacity |
| `--color-muted` | `rgba(255,255,255,0.5)` | No direct equivalent | Consider adding |
| `--color-brand` | `#18e299` (emerald) | `--color-brand` (indigo) | **KEEP Nixelo indigo** |
| `--color-brand-light` | `#0c8c5e` | `--color-brand-hover` | Different hue |
| `--color-border-solid` | `#fff` | `--color-ui-border` | Different approach |
| `--color-border-soft` | `rgba(255,255,255,0.15)` | `--color-ui-border` | Mintlify more subtle |
| `--color-border-sub` | `rgba(255,255,255,0.07)` | `--color-ui-border-secondary` | Mintlify more subtle |
| `--color-border-surface` | `rgba(255,255,255,0.05)` | No direct equivalent | Consider adding |
| `--color-background-soft` | `rgba(255,255,255,0.05)` | `--color-ui-bg-secondary` | Mintlify uses opacity |

### Code Syntax Highlighting Mapping

| Mintlify Token | Mintlify Value | Nixelo Equivalent |
|----------------|----------------|-------------------|
| `--twoslash-error-color` | `#ff6b6b` | `--color-status-error` |
| `--twoslash-warn-color` | `orange` | `--color-status-warning` |
| `--twoslash-tag-color` | `#6bb6ff` | `--color-status-info` |
| `--twoslash-tag-annotate-color` | `#4ade80` | `--color-status-success` |

---

## The light-dark() CSS Function

Nixelo uses the CSS `light-dark()` function for automatic dark mode support. This is a modern CSS feature that selects between two values based on the user's color scheme preference.

### Syntax

```css
property: light-dark(light-value, dark-value);
```

### How It Works

1. The `:root` element sets `color-scheme: light dark;`
2. Tailwind's dark mode variant is configured: `@variant dark (&:where(.dark, .dark *));`
3. Each semantic token uses `light-dark()` to provide both values

### Example

```css
/* In @theme block */
--color-ui-bg: light-dark(var(--p-white), var(--p-gray-900));
--color-ui-text: light-dark(var(--p-gray-900), var(--p-gray-50));
--color-brand: light-dark(var(--p-indigo-600), var(--p-indigo-400));
```

### Usage in Components

```tsx
// No dark: prefix needed for semantic tokens
<div className="bg-ui-bg text-ui-text border-ui-border">
  Content automatically adapts to light/dark mode
</div>

// The above is equivalent to:
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50">
  Manual dark mode (avoid this pattern)
</div>
```

### Browser Support

The `light-dark()` function is supported in:
- Chrome 123+
- Firefox 120+
- Safari 17.5+

For older browsers, ensure fallbacks are in place or use a polyfill strategy.

---

## Recommendations: KEEP vs UPDATE

### KEEP (Nixelo Brand Identity)

These tokens define Nixelo's unique identity and should NOT be changed to match Mintlify:

| Category | Tokens | Reason |
|----------|--------|--------|
| **Brand Color** | `--color-brand*` (indigo) | Core brand identity |
| **Accent Color** | `--color-accent*` (purple) | Secondary brand color |
| **Status Colors** | `--color-status-*` | Standard semantics |
| **Priority Colors** | `--color-priority-*` | Domain-specific |
| **Issue Type Colors** | `--color-issue-type-*` | Domain-specific |
| **Palette Colors** | `--color-palette-*` | Full utility palette |

### UPDATE (Mintlify Polish)

These tokens could be updated to match Mintlify's premium feel:

| Category | Current | Mintlify Inspiration | Benefit |
|----------|---------|---------------------|---------|
| **Dark Background** | `#111827` (gray-900) | `#08090a` | Deeper, more premium dark mode |
| **Border Opacity** | Solid gray values | 5-15% white opacity | Softer, more subtle borders |
| **Text Hierarchy** | Fixed gray values | Opacity-based (`0.7`, `0.6`, `0.5`) | More nuanced hierarchy |
| **Surface Layers** | Three levels | Add `background-soft` at 5% | Better visual depth |

### CONSIDER ADDING (New Tokens)

Based on Mintlify's system, consider adding these tokens:

```css
/* Muted text (lighter than tertiary) */
--color-ui-text-muted: light-dark(var(--p-gray-300), rgba(255,255,255,0.5));

/* Ultra-subtle border for surfaces */
--color-ui-border-surface: light-dark(rgba(0,0,0,0.05), rgba(255,255,255,0.05));

/* Soft background for hover states */
--color-ui-bg-soft: light-dark(rgba(0,0,0,0.03), rgba(255,255,255,0.05));
```

---

## CSS Code Blocks

### Complete Mintlify Tokens (Ready to Copy)

```css
/* Mintlify Color Tokens - Dark Mode First */
:root {
  /* Fonts */
  --font-geist-mono: "Geist Mono", "Geist Mono Fallback";
  --font-inter: "inter", "inter Fallback";

  /* Core Colors */
  --color-background-main: #08090a;
  --color-background-invert: #fff;
  --color-text-main: #fff;
  --color-text-invert: #08090a;
  --color-text-soft: rgba(255,255,255,0.7);
  --color-text-sub: rgba(255,255,255,0.6);
  --color-muted: rgba(255,255,255,0.5);
  --color-muted-invert: rgba(8,9,10,0.5);

  /* Brand */
  --color-brand: #18e299;
  --color-brand-light: #0c8c5e;

  /* Borders */
  --color-border-solid: #fff;
  --color-border-soft: rgba(255,255,255,0.15);
  --color-border-sub: rgba(255,255,255,0.07);
  --color-border-surface: rgba(255,255,255,0.05);

  /* Surfaces */
  --color-background-soft: rgba(255,255,255,0.05);

  /* Code Highlighting */
  --twoslash-border-color: #222526;
  --twoslash-popup-bg: #151819;
  --twoslash-error-color: #ff6b6b;
  --twoslash-error-bg: rgba(255,107,107,0.19);
  --twoslash-warn-color: orange;
  --twoslash-warn-bg: rgba(255,165,0,0.19);
  --twoslash-tag-color: #6bb6ff;
  --twoslash-tag-bg: rgba(107,182,255,0.19);
  --twoslash-tag-annotate-color: #4ade80;
  --twoslash-tag-annotate-bg: rgba(74,222,128,0.19);
  --twoslash-highlighted-border: rgba(255,165,0,0.5);
  --twoslash-highlighted-bg: rgba(255,165,0,0.19);
}
```

### Suggested Nixelo Updates (Ready to Copy)

```css
/* Add to @theme block in src/index.css */

/* --- Enhanced Dark Mode Background --- */
/* Option: Use Mintlify's deeper black for hero sections */
--color-ui-bg-hero: var(--p-gray-950); /* Already exists, consider #08090a */

/* --- Subtle Border Variants --- */
--color-ui-border-surface: light-dark(
  rgba(0, 0, 0, 0.05),
  rgba(255, 255, 255, 0.05)
);
--color-ui-border-subtle: light-dark(
  rgba(0, 0, 0, 0.07),
  rgba(255, 255, 255, 0.07)
);

/* --- Muted Text Level --- */
--color-ui-text-muted: light-dark(
  var(--p-gray-300),
  rgba(255, 255, 255, 0.5)
);

/* --- Soft Background for Hover --- */
--color-ui-bg-soft: light-dark(
  rgba(0, 0, 0, 0.03),
  rgba(255, 255, 255, 0.05)
);
```

### Proposed Darker Dark Mode (Optional)

If you want to adopt Mintlify's deeper dark aesthetic:

```css
/* Add new primitive */
:root {
  --p-gray-1000: #08090a; /* Mintlify's near-black */
}

/* Update semantic token */
@theme {
  --color-ui-bg: light-dark(var(--p-white), var(--p-gray-1000));
}
```

---

## Visual Reference

### Mintlify Dark Mode
- Screenshot: `docs/research/library/mintlify/landing_desktop_dark.png`
- Characteristics:
  - Near-black background (#08090a)
  - Emerald/mint brand color (#18e299)
  - Very subtle borders (5-15% white opacity)
  - Aurora/gradient hero effect
  - White text with opacity hierarchy

### Mintlify Light Mode
- Screenshot: `docs/research/library/mintlify/landing_desktop_light.png`
- Characteristics:
  - Pure white background
  - Same emerald brand color
  - Very subtle gray borders
  - Warm gradient hero (teal/gold clouds)
  - Dark text with opacity hierarchy

### Key Takeaways for Nixelo

1. **Keep the indigo brand** - It's distinctive and professional
2. **Consider deeper dark mode** - `#08090a` vs `#111827` for premium feel
3. **Adopt opacity-based borders** - More subtle and elegant
4. **Add text muted level** - Better hierarchy for secondary content
5. **Use soft backgrounds** - For hover states and surface layering

---

## Related Documentation

- [MASTER_PLAN.md](../MASTER_PLAN.md) - Overall design system roadmap
- [src/index.css](../../../src/index.css) - Source of truth for tokens
- [Mintlify Research](../../research/library/mintlify/) - Full research capture
