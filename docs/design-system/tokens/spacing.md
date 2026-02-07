# Spacing, Layout & Depth Tokens

> **Design System Documentation** | Last Updated: 2026-02-05
> **Source**: `docs/research/library/mintlify/*_deep.json`, `src/index.css`, `src/lib/constants.ts`

This document provides a comprehensive reference for spacing, layout constraints, border-radius, z-index, and shadow/elevation tokens in Nixelo, with mappings from Mintlify's design system for visual polish inspiration.

---

## Table of Contents

1. [Whitespace Philosophy](#whitespace-philosophy)
2. [Spacing Scale](#spacing-scale)
3. [Layout Constraints](#layout-constraints)
4. [Border Radius Scale](#border-radius-scale)
5. [Z-Index Scale](#z-index-scale)
6. [Shadow & Elevation Scale](#shadow--elevation-scale)
7. [ASCII Layout Diagrams](#ascii-layout-diagrams)
8. [Ready-to-Copy CSS](#ready-to-copy-css)
9. [Mapping Table: Mintlify to Nixelo](#mapping-table-mintlify-to-nixelo)

---

## Whitespace Philosophy

### Mintlify's Approach: Generous & Intentional

Mintlify embraces **generous whitespace** as a core design principle:

```
+------------------------------------------------------------------+
|                                                                  |
|     [Logo]                                    [Nav]  [CTA]       |  <- 80-100px header
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|                                                                  |
|                                                                  |
|              "The Intelligent Documentation Platform"            |  <- Hero with
|                                                                  |     substantial
|                        [Primary CTA]                             |     vertical
|                                                                  |     padding
|                                                                  |  <- 120-160px
+------------------------------------------------------------------+
```

**Key Characteristics:**

| Aspect | Mintlify | Typical SaaS | Nixelo Target |
|--------|----------|--------------|---------------|
| Information Density | Low | Medium-High | Medium |
| Content Max-Width | ~1200px | 1400px+ | 1280px |
| Section Padding | 80-120px | 40-60px | 64-96px |
| Card Padding | 24-32px | 16-20px | 20-24px |
| Component Gaps | 16-24px | 8-12px | 12-16px |

### Design Principle

> **"Let content breathe"** - Every section should have room to stand on its own. Whitespace is not wasted space; it's breathing room that reduces cognitive load.

### When to Be Dense vs. Generous

| Context | Approach | Rationale |
|---------|----------|-----------|
| Landing pages | Generous | Focus attention, premium feel |
| Dashboards | Medium | Balance info density with scanability |
| Data tables | Dense | Maximize visible rows |
| Forms | Medium | Group related fields, separate sections |
| Modals/Dialogs | Generous padding | Frame content clearly |
| Cards | Generous internal | Content needs room |
| Lists | Tight rows, generous sections | Scannable but organized |

---

## Spacing Scale

### Base Unit: 4px

Both Mintlify and Nixelo use a **4px base unit** for spacing. This creates a consistent rhythm across all UI elements.

### Scale Definition

```
4px  Base Unit
|
+-- 1   =  4px   (0.25rem)  --  Micro spacing, icon padding
+-- 2   =  8px   (0.5rem)   --  Tight gaps, small margins
+-- 3   = 12px   (0.75rem)  --  Component internal padding
+-- 4   = 16px   (1rem)     --  Standard gap, form fields
+-- 5   = 20px   (1.25rem)  --  Comfortable spacing
+-- 6   = 24px   (1.5rem)   --  Section gaps, card padding
+-- 8   = 32px   (2rem)     --  Section spacing
+-- 10  = 40px   (2.5rem)   --  Large section breaks
+-- 12  = 48px   (3rem)     --  Hero internal spacing
+-- 16  = 64px   (4rem)     --  Major section breaks
+-- 20  = 80px   (5rem)     --  Landing page sections
+-- 24  = 96px   (6rem)     --  Hero vertical padding
```

### Visual Scale

```
1 (4px):   [=]
2 (8px):   [==]
3 (12px):  [===]
4 (16px):  [====]
5 (20px):  [=====]
6 (24px):  [======]
8 (32px):  [========]
10 (40px): [==========]
12 (48px): [============]
16 (64px): [================]
20 (80px): [====================]
24 (96px): [========================]
```

### Tailwind Class Mapping

| Scale | Pixels | Rem | Tailwind Class | Usage |
|-------|--------|-----|----------------|-------|
| 1 | 4px | 0.25rem | `gap-1`, `p-1`, `m-1` | Icon gaps |
| 2 | 8px | 0.5rem | `gap-2`, `p-2`, `m-2` | Tight spacing |
| 3 | 12px | 0.75rem | `gap-3`, `p-3`, `m-3` | Button padding |
| 4 | 16px | 1rem | `gap-4`, `p-4`, `m-4` | Default gap |
| 5 | 20px | 1.25rem | `gap-5`, `p-5`, `m-5` | Comfortable |
| 6 | 24px | 1.5rem | `gap-6`, `p-6`, `m-6` | Card padding |
| 8 | 32px | 2rem | `gap-8`, `p-8`, `m-8` | Section gap |
| 10 | 40px | 2.5rem | `gap-10`, `p-10`, `m-10` | Large gap |
| 12 | 48px | 3rem | `gap-12`, `p-12`, `m-12` | Hero spacing |
| 16 | 64px | 4rem | `gap-16`, `p-16`, `m-16` | Section break |
| 20 | 80px | 5rem | `gap-20`, `p-20`, `m-20` | Landing section |
| 24 | 96px | 6rem | `gap-24`, `p-24`, `m-24` | Hero padding |

### Current Nixelo Spacing Constants

From `src/lib/constants.ts`:

```typescript
export const SPACING = {
  xs: "gap-1",   // 4px
  sm: "gap-2",   // 8px
  md: "gap-4",   // 16px
  lg: "gap-6",   // 24px
  xl: "gap-8",   // 32px
} as const;
```

---

## Layout Constraints

### Max-Widths

| Token | Value | Usage | Tailwind Class |
|-------|-------|-------|----------------|
| `--max-width-prose` | 65ch | Long-form text, docs | `max-w-prose` |
| `--max-width-content` | 720px | Article content | `max-w-3xl` |
| `--max-width-container` | 1024px | Standard container | `max-w-5xl` |
| `--max-width-wide` | 1280px | Wide layouts | `max-w-7xl` |
| `--max-width-full` | 1440px | Full-width sections | `max-w-[1440px]` |

### ASCII: Content Width Hierarchy

```
|<-------------------- Viewport (100%) -------------------->|
|                                                           |
|  +-----------------------------------------------------+  |
|  |            max-w-full (1440px)                      |  |
|  |  +-----------------------------------------------+  |  |
|  |  |          max-w-wide (1280px)                  |  |  |
|  |  |  +----------------------------------------+   |  |  |
|  |  |  |      max-w-container (1024px)          |   |  |  |
|  |  |  |  +----------------------------------+  |   |  |  |
|  |  |  |  |   max-w-content (720px)          |  |   |  |  |
|  |  |  |  |  +---------------------------+   |  |   |  |  |
|  |  |  |  |  |  max-w-prose (65ch)       |   |  |   |  |  |
|  |  |  |  |  +---------------------------+   |  |   |  |  |
|  |  |  |  +----------------------------------+  |   |  |  |
|  |  |  +----------------------------------------+   |  |  |
|  |  +-----------------------------------------------+  |  |
|  +-----------------------------------------------------+  |
|                                                           |
```

### Sidebar Widths

| Component | Collapsed | Expanded | CSS Token |
|-----------|-----------|----------|-----------|
| Main Sidebar | 64px | 256px | `--sidebar-width` |
| Docs Sidebar | - | 280px | `--sidebar-docs-width` |
| Right Panel | - | 320px | `--panel-right-width` |

### ASCII: Sidebar Layout

```
Collapsed Sidebar (64px)         Expanded Sidebar (256px)
+----+------------------------+  +----------+-------------------+
|    |                        |  |          |                   |
|icon|     Main Content       |  | Sidebar  |   Main Content    |
|icon|                        |  | Nav      |                   |
|icon|                        |  | Links    |                   |
|    |                        |  |          |                   |
+----+------------------------+  +----------+-------------------+
 64px         flex-1               256px         flex-1
```

### Header Heights

| Component | Height | CSS Token |
|-----------|--------|-----------|
| Main Header | 64px | `--header-height` |
| Toolbar | 48px | `--toolbar-height` |
| Breadcrumb Bar | 40px | `--breadcrumb-height` |

### ASCII: Vertical Layout

```
+----------------------------------------------------------+
|                    Header (64px)                          |
+----------------------------------------------------------+
|                    Toolbar (48px)                         |
+----------------------------------------------------------+
|                                                           |
|                                                           |
|                                                           |
|                    Main Content                           |
|                    (flex-1)                               |
|                                                           |
|                                                           |
|                                                           |
+----------------------------------------------------------+
```

### Current Nixelo Panel Height Tokens

From `src/index.css`:

```css
--max-height-panel: 80vh;
--max-height-panel-lg: 85vh;
--max-height-panel-sm: 50vh;
--max-height-panel-md: 60vh;
```

---

## Border Radius Scale

### Philosophy

Mintlify uses **generous border radius** for a modern, approachable feel. Sharp corners feel dated; too round feels playful/childish. The sweet spot is 8-12px for most UI elements.

### Scale Definition

```
+------+--------+---------+----------------------------------+
| Name | Value  | Tailwind| Usage                            |
+------+--------+---------+----------------------------------+
| none | 0      | rounded-none | Sharp edges (tables, dividers) |
| sm   | 4px    | rounded-sm   | Small elements (tags, badges)  |
| DEFAULT | 8px | rounded      | Standard (inputs, buttons)     |
| md   | 8px    | rounded-md   | Alias for default              |
| lg   | 12px   | rounded-lg   | Cards, containers              |
| xl   | 16px   | rounded-xl   | Large cards, dialogs           |
| 2xl  | 24px   | rounded-2xl  | Hero cards, featured content   |
| full | 9999px | rounded-full | Avatars, pills                 |
+------+--------+---------+----------------------------------+
```

### Visual Scale

```
none:     +--------+     sm:       +--------+
          |        |               /        \
          |        |              |          |
          +--------+               \        /

DEFAULT:  /--------\     lg:      /--------\
         |          |            /          \
         |          |           |            |
          \--------/             \          /

xl:       /---------\    2xl:    /----------\
         /           \          /            \
        |             |        |              |
         \           /          \            /

full:        ____
           (      )
           (      )
             ----
```

### Current Nixelo Tokens

From `src/index.css`:

```css
--radius: 8px;              /* Default */
--radius-secondary: 4px;    /* Small elements */
--radius-container: 12px;   /* Cards, containers */
--radius-feature: 10px;     /* Feature cards (landing) */
```

### Recommendations

| Element | Current | Recommended | Reasoning |
|---------|---------|-------------|-----------|
| Buttons | 8px | 8px | Keep (standard) |
| Inputs | 8px | 8px | Keep (matches buttons) |
| Cards | 12px | 12px | Keep (slightly larger) |
| Dialogs | 12px | 16px | Increase (more presence) |
| Dropdown | 8px | 12px | Increase (more polished) |
| Avatars | full | full | Keep (standard circles) |
| Badges | 4px | full | Consider pills for tags |

---

## Z-Index Scale

### Philosophy

A well-organized z-index scale prevents stacking conflicts. Use semantic names, not arbitrary numbers.

### Scale Definition

```
Level   Value    Usage                           Token
------- -------  ------------------------------- ------------------------
base    0        Default stacking                z-0
raised  10       Slightly elevated cards         z-10
dropdown 20      Dropdowns, select menus         z-20
sticky  30       Sticky headers, nav             z-30
fixed   40       Fixed position elements         z-40
modal-bg 50      Modal backdrop/overlay          z-50
modal   60       Modal content                   z-60
popover 70       Popovers, tooltips              z-70
toast   80       Toast notifications             z-80
tooltip 90       Tooltips (highest priority)     z-90
critical 9999    System-level (debug, errors)    z-toast-critical
```

### ASCII: Z-Index Layers

```
Side View (stacking order):

                    +---+  z-9999 (critical)
                   +---+   z-90 (tooltip)
                  +---+    z-80 (toast)
                 +---+     z-70 (popover)
                +---+      z-60 (modal)
               +---+       z-50 (modal-bg/overlay)
              +---+        z-40 (fixed)
             +---+         z-30 (sticky)
            +---+          z-20 (dropdown)
           +---+           z-10 (raised)
          +---+            z-0 (base)
-----------+------------------- document flow
```

### Current Nixelo Token

From `src/index.css`:

```css
--z-toast-critical: 9999;
```

### Proposed Complete Scale

```css
@theme {
  /* Z-Index Scale */
  --z-base: 0;
  --z-raised: 10;
  --z-dropdown: 20;
  --z-sticky: 30;
  --z-fixed: 40;
  --z-modal-backdrop: 50;
  --z-modal: 60;
  --z-popover: 70;
  --z-toast: 80;
  --z-tooltip: 90;
  --z-critical: 9999;
}
```

---

## Shadow & Elevation Scale

### Philosophy

Mintlify uses **subtle, layered shadows** to create depth without being heavy. Dark mode shadows are softer (higher opacity with lower intensity).

### Mintlify Shadow Patterns

From `docs_deep.json`:

```css
--tw-shadow: 0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.1);
--twoslash-popup-shadow: rgba(0,0,0,0.08) 0px 1px 4px;
```

### Scale Definition

```
Level      Shadow Definition                              Usage
---------- ---------------------------------------------- ------------------
none       none                                           Flat elements
xs         0 1px 2px rgba(0,0,0,0.05)                    Subtle lift
sm         0 1px 3px rgba(0,0,0,0.08),
           0 1px 2px rgba(0,0,0,0.06)                    Small cards
DEFAULT    0 1px 4px rgba(0,0,0,0.1)                     Standard
md         0 4px 6px -1px rgba(0,0,0,0.1),
           0 2px 4px -2px rgba(0,0,0,0.1)                Cards
lg         0 10px 15px -3px rgba(0,0,0,0.1),
           0 4px 6px -4px rgba(0,0,0,0.1)                Modals
xl         0 20px 25px -5px rgba(0,0,0,0.1),
           0 8px 10px -6px rgba(0,0,0,0.1)               Large dialogs
2xl        0 25px 50px -12px rgba(0,0,0,0.25)            Hero elements
```

### Visual Representation

```
no-shadow:    flat element
              +------------+
              |            |
              +------------+

shadow-sm:    subtle lift (barely visible)
              +------------+
              |            |
              +============+  <- 1-2px soft blur

shadow-md:    standard card (visible but soft)
              +------------+
              |            |
              +============+
                  =====      <- 4-6px blur, offset

shadow-lg:    elevated (modals, dialogs)
              +------------+
              |            |
              +============+
                =========    <- 10-15px blur

shadow-2xl:   floating (hero cards)
              +------------+
              |            |
              +============+
              =============  <- 25px+ blur
```

### Current Nixelo Tokens

From `src/index.css`:

```css
--shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
--shadow-hover: 0 2px 8px rgba(0, 0, 0, 0.12);
--shadow-soft: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06);
--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04);
--shadow-card-hover: 0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
--shadow-elevated: 0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08);
```

### Tailwind Class Mapping

| Token | Tailwind | Usage |
|-------|----------|-------|
| `--shadow-soft` | `shadow-soft` | Subtle cards, inputs |
| `--shadow` | `shadow` | Default shadow |
| `--shadow-hover` | `shadow-hover` | Hover states |
| `--shadow-card` | `shadow-card` | Card default |
| `--shadow-card-hover` | `shadow-card-hover` | Card hover |
| `--shadow-elevated` | `shadow-elevated` | Modals, dialogs |

### Dark Mode Considerations

In dark mode, shadows should be:
1. **Reduced opacity** (elements are already dark)
2. **Larger blur** (softer edges)
3. **Subtle glow** for elevated elements (optional)

```css
/* Dark mode shadow variant */
.dark {
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(0, 0, 0, 0.15);
  --shadow-elevated: 0 4px 16px rgba(0, 0, 0, 0.3), 0 2px 6px rgba(0, 0, 0, 0.2);
}
```

---

## ASCII Layout Diagrams

### Dashboard Layout

```
+------------------------------------------------------------------+
|  [=] Logo          Search [__________]     [?] [N] [Avatar]      |
+--------+-----------------------------------------------------+---+
|        |                                                      |   |
| MENU   |  Dashboard                                    [+New] |   |
|        |                                                      |   |
| [Home] |  +--------------------+  +--------------------+      |   |
| [Proj] |  |    Quick Stats    |  |   Recent Activity  |      |   |
| [Docs] |  |                    |  |                    |      |   |
| [Cal]  |  | +--+ +--+ +--+    |  | - Updated doc...   |      |   |
|        |  | |24| |12| |5 |    |  | - Created issue... |      |   |
| ----   |  | +--+ +--+ +--+    |  | - Commented on...  |      |   |
|        |  +--------------------+  +--------------------+      |   |
| [Set]  |                                                      |   |
+--------+-----------------------------------------------------+---+
   256px              flex-1 (content area)                     320px
                                                            (optional)
```

**Spacing Annotations:**

```
+------------------------------------------------------------------+
|  px-6 (24px)                                           px-6 (24px)|
|  +-------------------------------------------------------------+  |
|  | py-4 (16px) - Header                                        |  |
+------------------------------------------------------------------+
|        | gap-6 (24px)                                             |
|  py-6  | +------------------+ gap-4 +------------------+          |
| (24px) | | p-6 (24px)       |       | p-6 (24px)       |          |
|        | | Card Content     |       | Card Content     |          |
|        | +------------------+       +------------------+          |
```

### Card Component

```
+--------------------------------------------------+
|  p-6 (24px padding all around)                    |
|                                                   |
|  +---------------------------------------------+  |
|  |  Card Header                          [...]  |  |
|  +---------------------------------------------+  |
|  |  mb-4 (16px margin-bottom)                   |  |
|  +---------------------------------------------+  |
|  |                                              |  |
|  |  Card Body Content                          |  |
|  |  gap-3 (12px) between items                 |  |
|  |                                              |  |
|  +---------------------------------------------+  |
|  |  mt-4 (16px margin-top)                      |  |
|  +---------------------------------------------+  |
|  |  Card Footer                  [Action] [OK] |  |
|  +---------------------------------------------+  |
|                                                   |
+--------------------------------------------------+
     border-radius: 12px (--radius-container)
     shadow: var(--shadow-card)
```

### Modal Dialog

```
+================================================================+
|                        OVERLAY                                  |
|                    bg-ui-bg-overlay                             |
|                    z-modal-backdrop (50)                        |
|                                                                  |
|       +--------------------------------------------------+       |
|       |  z-modal (60)                                    |       |
|       |  rounded-xl (16px)                               |       |
|       |  shadow-elevated                                 |       |
|       |  max-w-lg (512px)                               |       |
|       |                                                  |       |
|       |  +--------------------------------------------+  |       |
|       |  |  p-6 (24px)  Dialog Header          [X]   |  |       |
|       |  +--------------------------------------------+  |       |
|       |  |                                            |  |       |
|       |  |  p-6 (24px)  Dialog Body                  |  |       |
|       |  |                                            |  |       |
|       |  +--------------------------------------------+  |       |
|       |  |  p-6 (24px)  Dialog Footer   [Cancel][OK] |  |       |
|       |  +--------------------------------------------+  |       |
|       |                                                  |       |
|       +--------------------------------------------------+       |
|                                                                  |
+================================================================+
```

### Form Layout

```
+------------------------------------------+
|  Form Container (max-w-md, 448px)        |
|                                          |
|  +------------------------------------+  |
|  |  Label                             |  |
|  |  mb-1.5 (6px)                      |  |
|  +------------------------------------+  |
|  |  +--------------------------------+|  |
|  |  |  Input Field                   ||  |
|  |  |  h-10 (40px height)            ||  |
|  |  |  px-3 (12px horizontal)        ||  |
|  |  |  rounded (8px)                 ||  |
|  |  +--------------------------------+|  |
|  |  Helper text                       |  |
|  |  mt-1.5 (6px)                      |  |
|  +------------------------------------+  |
|                                          |
|  space-y-4 (16px between fields)         |
|                                          |
|  +------------------------------------+  |
|  |  Label                             |  |
|  |  ...next field...                  |  |
|  +------------------------------------+  |
|                                          |
+------------------------------------------+
```

### Kanban Board

```
+------------------------------------------------------------------+
|  Board Header                                      [+ Add Column] |
+------------------------------------------------------------------+
|  gap-4 (16px between columns)                                     |
|                                                                   |
|  +---------------+  +---------------+  +---------------+          |
|  | Column Header |  | Column Header |  | Column Header |          |
|  | p-3 (12px)    |  | p-3 (12px)    |  | p-3 (12px)    |          |
|  +---------------+  +---------------+  +---------------+          |
|  | w-72 (288px)  |  |               |  |               |          |
|  |               |  |               |  |               |          |
|  | +----------+  |  | +----------+  |  | +----------+  |          |
|  | | Card     |  |  | | Card     |  |  | | Card     |  |          |
|  | | p-3      |  |  | | p-3      |  |  | | p-3      |  |          |
|  | | mb-2     |  |  | | mb-2     |  |  | | mb-2     |  |          |
|  | +----------+  |  | +----------+  |  | +----------+  |          |
|  | | Card     |  |  | | Card     |  |  |               |          |
|  | | ...      |  |  | | ...      |  |  |               |          |
|  | +----------+  |  | +----------+  |  |               |          |
|  |               |  |               |  |               |          |
|  +---------------+  +---------------+  +---------------+          |
|                                                                   |
+------------------------------------------------------------------+
```

---

## Ready-to-Copy CSS

### Complete Spacing & Layout Tokens

Add to `@theme` block in `src/index.css`:

```css
@theme {
  /* ============================================================
   * SPACING & LAYOUT TOKENS
   * ============================================================ */

  /* --- Spacing Scale (custom beyond Tailwind defaults) --- */
  --spacing-form-field: 16px;     /* gap between form fields */
  --spacing-section: 32px;        /* section separation */
  --spacing-section-lg: 64px;     /* large section breaks */
  --spacing-hero: 96px;           /* hero vertical padding */

  /* --- Layout Constraints --- */
  --max-width-prose: 65ch;
  --max-width-content: 720px;
  --max-width-container: 1024px;
  --max-width-wide: 1280px;
  --max-width-full: 1440px;

  /* --- Sidebar Dimensions --- */
  --sidebar-width-collapsed: 64px;
  --sidebar-width-expanded: 256px;
  --sidebar-docs-width: 280px;
  --panel-right-width: 320px;

  /* --- Header Heights --- */
  --header-height: 64px;
  --toolbar-height: 48px;
  --breadcrumb-height: 40px;

  /* --- Panel Heights (existing) --- */
  --max-height-panel: 80vh;
  --max-height-panel-lg: 85vh;
  --max-height-panel-sm: 50vh;
  --max-height-panel-md: 60vh;

  /* --- Border Radius Scale --- */
  --radius: 8px;
  --radius-sm: 4px;
  --radius-secondary: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-container: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-feature: 10px;
  --radius-full: 9999px;

  /* --- Z-Index Scale --- */
  --z-base: 0;
  --z-raised: 10;
  --z-dropdown: 20;
  --z-sticky: 30;
  --z-fixed: 40;
  --z-modal-backdrop: 50;
  --z-modal: 60;
  --z-popover: 70;
  --z-toast: 80;
  --z-tooltip: 90;
  --z-toast-critical: 9999;

  /* --- Shadow Scale (existing, enhanced) --- */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  --shadow-hover: 0 2px 8px rgba(0, 0, 0, 0.12);
  --shadow-soft: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04);
  --shadow-card-hover: 0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-elevated: 0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08);
  --shadow-modal: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  --shadow-popover: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
}
```

### Constants for TypeScript

Add to `src/lib/constants.ts`:

```typescript
/**
 * Layout constraints (in pixels)
 */
export const LAYOUT = {
  /** Prose max-width (characters) */
  PROSE_WIDTH: "65ch",
  /** Content max-width */
  CONTENT_WIDTH: 720,
  /** Container max-width */
  CONTAINER_WIDTH: 1024,
  /** Wide layout max-width */
  WIDE_WIDTH: 1280,
  /** Full-width max */
  FULL_WIDTH: 1440,
  /** Sidebar collapsed width */
  SIDEBAR_COLLAPSED: 64,
  /** Sidebar expanded width */
  SIDEBAR_EXPANDED: 256,
  /** Header height */
  HEADER_HEIGHT: 64,
  /** Toolbar height */
  TOOLBAR_HEIGHT: 48,
} as const;

/**
 * Z-index scale
 */
export const Z_INDEX = {
  BASE: 0,
  RAISED: 10,
  DROPDOWN: 20,
  STICKY: 30,
  FIXED: 40,
  MODAL_BACKDROP: 50,
  MODAL: 60,
  POPOVER: 70,
  TOAST: 80,
  TOOLTIP: 90,
  CRITICAL: 9999,
} as const;
```

---

## Mapping Table: Mintlify to Nixelo

### Spacing

| Context | Mintlify | Nixelo Current | Nixelo Target |
|---------|----------|----------------|---------------|
| Hero padding | ~120px | 64-80px | 96px |
| Section gap | ~80px | 32-48px | 64px |
| Card padding | 24-32px | 16-24px | 24px |
| Component gap | 16-24px | 8-16px | 16px |
| Form field gap | ~16px | 16px | 16px (keep) |

### Border Radius

| Element | Mintlify | Nixelo Current | Nixelo Target |
|---------|----------|----------------|---------------|
| Buttons | 9999px (pill) | 8px | 8px (keep) |
| Inputs | 12px | 8px | 8px (keep) |
| Cards | 16px | 12px | 12px (keep) |
| Dialogs | 16px | 12px | 16px (update) |
| Dropdowns | 12px | 8px | 12px (update) |

### Shadows

| Element | Mintlify | Nixelo Current | Recommendation |
|---------|----------|----------------|----------------|
| Card default | Subtle (0.08 opacity) | Similar | Keep |
| Card hover | More pronounced | Similar | Keep |
| Modal | Prominent | Similar | Keep |
| Popup | `0px 1px 4px rgba(0,0,0,0.08)` | Similar | Keep |

### Key Differences

1. **Mintlify is more generous** with whitespace on landing pages
2. **Mintlify uses pill buttons** (full radius) for CTAs
3. **Mintlify has softer shadows** overall
4. **Nixelo is appropriately denser** for app dashboards

---

## Quick Reference

### Common Spacing Patterns

```tsx
// Card with standard padding
<Card className="p-6 space-y-4">...</Card>

// Section with generous vertical spacing
<section className="py-16 lg:py-24">...</section>

// Form with proper field gaps
<form className="space-y-4 max-w-md">...</form>

// Grid with consistent gaps
<div className="grid grid-cols-3 gap-6">...</div>

// Flex layout with standard gap
<Flex gap="4">...</Flex>
```

### Shadow Usage

```tsx
// Flat element (no shadow)
<div className="bg-ui-bg-secondary">...</div>

// Subtle card
<Card className="shadow-soft">...</Card>

// Interactive card with hover
<Card className="shadow-card hover:shadow-card-hover transition-shadow">...</Card>

// Modal dialog
<Dialog className="shadow-modal">...</Dialog>
```

### Z-Index Usage

```tsx
// Sticky header
<header className="sticky top-0 z-sticky">...</header>

// Modal with backdrop
<div className="fixed inset-0 z-modal-backdrop">
  <div className="z-modal">Modal content</div>
</div>

// Toast notification
<Toast className="z-toast">...</Toast>
```

---

## Related Documentation

- [MASTER_PLAN.md](../MASTER_PLAN.md) - Overall design system roadmap
- [colors.md](./colors.md) - Color token reference
- [typography.md](./typography.md) - Typography token reference
- [animations.md](./animations.md) - Animation token reference
- [src/index.css](../../../src/index.css) - Source of truth for CSS tokens
- [src/lib/constants.ts](../../../src/lib/constants.ts) - TypeScript constants
- [Mintlify Research](../../research/library/mintlify/) - Full research capture
