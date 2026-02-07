# Design Audit Protocol

## Execution

```
PASS 1: COMPONENTS
    For each component in src/components/ui/:
        1. Read the file
        2. Check against Component Checklist
        3. Fix issues before moving on

PASS 2: PAGES
    For each page:
        1. Screenshot desktop + tablet, light + dark
        2. Check structural consistency
        3. Fix spacing/alignment issues

PASS 3: COLORS
    For each screen:
        1. Visual inspection both modes
        2. Check contrast, borders, shadows
        3. Zero hardcoded colors

REPEAT until perfect.
```

## Component Checklist

### Structure
- [ ] Uses `<Flex>` not `<div className="flex">`
- [ ] Uses `<Typography>` not raw `<p>`, `<h1>`
- [ ] Uses `cn()` for class merging
- [ ] No inline style soup

### Colors
- [ ] All backgrounds use `bg-ui-*` or `bg-brand` or `bg-status-*`
- [ ] All text uses `text-ui-*` or `text-brand` or `text-status-*`
- [ ] No raw Tailwind colors
- [ ] No hardcoded hex

### Interactivity
- [ ] Hover state visible
- [ ] Focus ring: `ring-2 ring-brand ring-offset-2`
- [ ] Disabled: `opacity-50 cursor-not-allowed`
- [ ] Loading uses spinner

### Accessibility
- [ ] `aria-label` on icon buttons
- [ ] Focus visible on keyboard nav
- [ ] Color contrast WCAG AA

## Page Checklist

Every page must match:

| Element | Standard |
|---------|----------|
| Page padding | `p-6` |
| Header-to-content gap | `gap-6` |
| Section gaps | `gap-8` |
| Card gaps | `gap-4` |

## Color Audit

### Light Mode
- Page bg: `bg-ui-bg` (off-white)
- Card bg: `bg-ui-bg-elevated` (white with shadow)
- Primary text: `text-ui-text` (near-black)
- Borders: `border-ui-border` (subtle)

### Dark Mode
- Page bg: `bg-ui-bg` (deep dark)
- Card bg: `bg-ui-bg-elevated` (slightly lighter)
- Primary text: `text-ui-text` (off-white)
- Borders: `border-ui-border` (subtle, not harsh)

### Dark Mode Failures
- Inverted/negative looking elements
- Pure white `#fff` instead of off-white
- Elements blending into background
- Harsh borders

## Validation

```bash
node scripts/validate.js
# Target: 0 errors, 0 warnings
```
