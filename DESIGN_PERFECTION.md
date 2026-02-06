# Design Perfection Protocol v2

> **Goal**: State-of-the-art visual quality matching Mintlify/Linear/Vercel standards
> **Method**: Hands-on manual inspection. NO automated scoring. NO subagents.
> **Acceptance**: Zero tolerance. Every pixel intentional.

---

## Execution Model

```
PASS 1: COMPONENTS
    For each component in src/components/ui/:
        1. Read the file
        2. Apply exact standards from Component Checklist
        3. Fix ALL issues before moving to next component
        4. Take screenshot if visual component

PASS 2: PAGES (Structural Consistency)
    For each page:
        1. Capture desktop/tablet screenshots in light + dark mode
        2. Compare spacing/gaps against Page Standards
        3. Fix structural inconsistencies across ALL pages
        4. Pages must be structurally identical (same header height, same padding, same gaps)

PASS 3: COLORS
    For each screen:
        1. Manual visual inspection in BOTH modes
        2. Check borders, shadows, text contrast
        3. Zero hardcoded colors
        4. Zero dark mode "accidents"

REPEAT until perfect.
```

---

## PASS 1: Component Standards

### Spacing (8px Grid - NO EXCEPTIONS)

| Token | Pixels | Use Case |
|-------|--------|----------|
| `gap-1` | 4px | Icon-to-text inline |
| `gap-2` | 8px | Tight groups (button content) |
| `gap-3` | 12px | List items, form fields |
| `gap-4` | 16px | Card sections, related content |
| `gap-6` | 24px | Page sections |
| `gap-8` | 32px | Major sections |

**HARD RULE**: Never use arbitrary spacing (`gap-[14px]`). Pick the closest standard value.

### Padding Standards

| Context | Value | Classes |
|---------|-------|---------|
| Button sm | 8px 12px | `px-3 py-2` |
| Button default | 12px 16px | `px-4 py-3` |
| Button lg | 16px 24px | `px-6 py-4` |
| Card content | 16px | `p-4` |
| Card lg | 24px | `p-6` |
| Page container | 24px | `p-6` |
| Modal content | 24px | `p-6` |
| Dropdown item | 8px 12px | `px-3 py-2` |

### Border Standards

| Token | Use Case |
|-------|----------|
| `border-ui-border` | Default borders (subtle, consistent) |
| `border-ui-border-hover` | Hover states |
| `border-ui-border-focus` | Focus rings (with `ring-2 ring-brand`) |
| `border-status-*` | Status indicators only |

**HARD RULE**: Never use `border-gray-*`, `border-slate-*`, or any raw color.

### Shadow Standards

| Token | Use Case |
|-------|----------|
| `shadow-sm` | NEVER USE - too subtle |
| `shadow-card` | Cards, panels |
| `shadow-elevated` | Dropdowns, popovers, modals |
| `shadow-glow` | Brand elements (sparingly) |

**HARD RULE**: Every elevated surface uses `shadow-elevated`. Cards use `shadow-card`.

### Radius Standards

| Token | Use Case |
|-------|----------|
| `rounded` | Buttons, inputs, badges |
| `rounded-lg` | Cards, panels |
| `rounded-xl` | Modals, large containers |
| `rounded-full` | Avatars, pills, icons |
| `rounded-container` | Standard container radius |

---

## Component Checklist (Every Component MUST Pass)

### Structure
- [ ] Uses `<Flex>` not raw `<div className="flex">`
- [ ] Uses `<Typography>` not raw `<p>`, `<h1>`, etc.
- [ ] Uses `cn()` for class merging, never template literals
- [ ] File is PascalCase (`Button.tsx` not `button.tsx`)

### Spacing
- [ ] All gaps use standard tokens (gap-1 through gap-8)
- [ ] All padding uses standard tokens (p-1 through p-8)
- [ ] No arbitrary spacing values
- [ ] Internal spacing consistent across all variants

### Colors (ZERO EXCEPTIONS)
- [ ] Background: `bg-ui-bg`, `bg-ui-bg-soft`, `bg-ui-bg-elevated`, `bg-brand`, `bg-status-*`
- [ ] Text: `text-ui-text`, `text-ui-text-secondary`, `text-ui-text-tertiary`, `text-brand`, `text-brand-foreground`
- [ ] Border: `border-ui-border`, `border-ui-border-hover`, `border-brand`, `border-status-*`
- [ ] NO `text-gray-*`, `bg-slate-*`, `border-zinc-*` or any raw Tailwind color
- [ ] NO hardcoded hex (`#fff`, `#000`, etc.)
- [ ] NO `text-white`, `text-black` - use `text-brand-foreground` or semantic tokens

### Interactivity
- [ ] Hover state defined and visible
- [ ] Focus ring uses `ring-2 ring-brand ring-offset-2`
- [ ] Disabled state uses `opacity-50 cursor-not-allowed`
- [ ] Loading state shows spinner, uses `aria-busy`
- [ ] Transitions use `transition-default` or explicit duration

### Accessibility
- [ ] `aria-label` where needed (icon-only buttons, etc.)
- [ ] `aria-invalid` on error states
- [ ] `aria-busy` on loading states
- [ ] Focus visible on keyboard navigation
- [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 large text)

---

## PASS 2: Page Structural Standards

### Every Page MUST Have Identical:

| Element | Standard |
|---------|----------|
| **Page header height** | Consistent across ALL pages |
| **Page padding** | `p-6` (24px) on all sides |
| **Header-to-content gap** | `gap-6` (24px) |
| **Section gaps** | `gap-8` (32px) between major sections |
| **Card gaps** | `gap-4` (16px) between cards in a grid |
| **Sidebar width** | Fixed at design token value |
| **Content max-width** | Consistent (e.g., `max-w-5xl`) |

### Page Layout Checklist

- [ ] Same header height as other pages
- [ ] Same padding around content
- [ ] Same gap between header and content
- [ ] No weird extra whitespace
- [ ] No cramped areas with different spacing
- [ ] Responsive stacking consistent with other pages
- [ ] Tablet layout matches tablet layout of similar pages
- [ ] Mobile layout matches mobile layout of similar pages

### Known Pages to Audit

1. Dashboard
2. Projects list
3. Project board
4. Project backlog
5. Project settings
6. Issues list
7. Issue detail
8. Documents list
9. Document editor
10. Calendar (day/week/month views)
11. Workspaces
12. Time tracking
13. Settings pages (all)
14. Team pages
15. Landing page
16. Sign in / Sign up

---

## PASS 3: Color Perfection

### Light Mode Standards

| Element | Token | Visual Result |
|---------|-------|---------------|
| Page background | `bg-ui-bg` | Off-white, not pure white |
| Card background | `bg-ui-bg-elevated` | White with subtle shadow |
| Sidebar | `bg-ui-bg-soft` | Very subtle gray tint |
| Primary text | `text-ui-text` | Near-black, not pure black |
| Secondary text | `text-ui-text-secondary` | Medium gray |
| Muted text | `text-ui-text-tertiary` | Light gray |
| Borders | `border-ui-border` | Very subtle, barely visible |
| Shadows | `shadow-card` / `shadow-elevated` | Soft, diffuse |

### Dark Mode Standards

| Element | Token | Visual Result |
|---------|-------|---------------|
| Page background | `bg-ui-bg` | Deep dark, not pure black |
| Card background | `bg-ui-bg-elevated` | Slightly lighter than page |
| Sidebar | `bg-ui-bg-soft` | Subtle variation |
| Primary text | `text-ui-text` | Off-white, not pure white |
| Secondary text | `text-ui-text-secondary` | Medium light gray |
| Borders | `border-ui-border` | Subtle, visible but not harsh |
| Shadows | Very subtle or none | Shadows work differently in dark |

### Dark Mode Failure Patterns (MUST FIX)

- **Inverted colors**: Elements that look "negative" or inverted
- **Pure white on dark**: Harsh `#fff` instead of soft off-white
- **Missing contrast**: Elements that blend into background
- **Wrong background levels**: Cards same color as page
- **Harsh borders**: Borders too visible/bright
- **Broken shadows**: Shadows that look wrong in dark

### Color Audit Command

```bash
# Find all color violations
node scripts/validate.js

# Should return 0 color-related warnings
```

---

## Visual Inspection Protocol

For each screen, capture screenshots in:
1. Desktop light mode (1920x1080)
2. Desktop dark mode (1920x1080)
3. Tablet light mode (768px)
4. Tablet dark mode (768px)

### Inspection Checklist

- [ ] First impression: Does it look professional and polished?
- [ ] Spacing: Is everything evenly spaced?
- [ ] Alignment: Are all elements properly aligned?
- [ ] Typography: Is hierarchy clear?
- [ ] Colors: Do all colors look intentional?
- [ ] Borders: Are borders consistent (not too dark, not too light)?
- [ ] Shadows: Are shadows appropriate for the elevation?
- [ ] Dark mode: Does it look designed for dark, not just inverted?
- [ ] Tablet: Does layout adapt cleanly?

---

## Execution Tracking

### Pass 1: Components

| Component | Checked | Issues Found | Fixed |
|-----------|---------|--------------|-------|
| Button | | | |
| Card | | | |
| Dialog | | | |
| Input | | | |
| Select | | | |
| Dropdown | | | |
| Tooltip | | | |
| Popover | | | |
| Badge | | | |
| Avatar | | | |
| Table | | | |
| Checkbox | | | |
| Radio | | | |
| Switch | | | |
| Tabs | | | |
| Progress | | | |
| Skeleton | | | |
| EmptyState | | | |
| ... | | | |

### Pass 2: Pages

| Page | Desktop Light | Desktop Dark | Tablet | Issues | Fixed |
|------|---------------|--------------|--------|--------|-------|
| Dashboard | | | | | |
| Projects | | | | | |
| Board | | | | | |
| Issues | | | | | |
| Documents | | | | | |
| Calendar | | | | | |
| Settings | | | | | |
| ... | | | | | |

### Pass 3: Colors

| Screen | Light Mode OK | Dark Mode OK | Issues | Fixed |
|--------|---------------|--------------|--------|-------|
| Dashboard | | | | |
| Projects | | | | |
| ... | | | | |

---

## Quick Reference

### Semantic Tokens (Use These)

```
Backgrounds: bg-ui-bg, bg-ui-bg-soft, bg-ui-bg-elevated, bg-ui-bg-hover, bg-brand
Text: text-ui-text, text-ui-text-secondary, text-ui-text-tertiary, text-brand, text-brand-foreground
Borders: border-ui-border, border-ui-border-hover, border-brand
Shadows: shadow-card, shadow-elevated
Status: bg-status-*, text-status-*, border-status-* (success, warning, error, info)
```

### Forbidden Patterns

```
❌ bg-gray-*, bg-slate-*, bg-zinc-*
❌ text-gray-*, text-white, text-black
❌ border-gray-*, border-slate-*
❌ #fff, #000, rgb(*), hsl(*)
❌ shadow-sm, shadow-md, shadow-lg (use semantic shadows)
❌ gap-[Xpx], p-[Xpx] (arbitrary values)
❌ dark: prefixes on semantic tokens
```

---

*Execute manually. Inspect visually. Accept nothing less than perfect.*
