# Slop Fixer Guide

> Hyper-detailed guide for eliminating UI slop patterns. Each pattern has multiple solutions with pros/cons analysis.

---

## Table of Contents

1. [Typography `as="span"` Pattern](#1-typography-asspan-pattern)
2. [Inline `<span className>` Pattern](#2-inline-span-classname-pattern)
3. [Typography className Overrides](#3-typography-classname-overrides)
4. [Repeated Metadata Pattern](#4-repeated-metadata-pattern)
5. [Repeated Shortcut Hint Pattern](#5-repeated-shortcut-hint-pattern)
6. [Responsive Text Pattern](#6-responsive-text-pattern)
7. [Badge-Style Text Pattern](#7-badge-style-text-pattern)
8. [Timestamp Display Pattern](#8-timestamp-display-pattern)
9. [Manual Bullet Separators](#9-manual-bullet-separators)
10. [Decision Matrix](#10-decision-matrix)

---

## 1. Typography `as="span"` Pattern

### The Problem
```tsx
<Typography variant="meta" as="span">{text}</Typography>
```

Typography is designed for block-level text (headings, paragraphs). Using `as="span"` forces inline rendering, breaking semantic HTML and indicating the wrong component is being used.

### Solution A: Remove `as="span"` entirely

```tsx
// Before
<Typography variant="meta" as="span">{text}</Typography>

// After
<Typography variant="meta">{text}</Typography>
```

| Pros | Cons |
|------|------|
| Simplest fix | May break layout if parent expects inline |
| Semantic HTML restored | Typography renders as `<p>` by default |
| No new components needed | Might need parent layout adjustment |

**When to use:** When the text is truly a standalone block element, not inline with other content.

---

### Solution B: Use plain text (no wrapper)

```tsx
// Before
<Button>
  <Icon />
  <Typography as="span">Label</Typography>
</Button>

// After
<Button>
  <Icon />
  Label
</Button>
```

| Pros | Cons |
|------|------|
| Zero wrapper overhead | No direct styling control |
| Inherits parent styles naturally | Must ensure parent has correct styles |
| Cleanest possible markup | Not suitable if text needs unique styling |

**When to use:** When text is inside a styled container (Button, Badge, etc.) and should inherit that container's text styles.

---

### Solution C: Use semantic HTML element

```tsx
// Before
<Typography variant="meta" as="span">{time}</Typography>

// After
<time dateTime={date.toISOString()}>{formatted}</time>
```

| Pros | Cons |
|------|------|
| Proper semantic HTML | Need to add styling classes |
| Accessibility benefits | More verbose for simple cases |
| SEO/machine-readable | Must know which semantic element applies |

**Semantic elements to consider:**
- `<time>` - timestamps, dates, durations
- `<kbd>` - keyboard keys
- `<code>` - inline code
- `<abbr>` - abbreviations
- `<cite>` - citations
- `<mark>` - highlighted text
- `<strong>` / `<em>` - emphasis

**When to use:** When there's a semantic HTML element that matches the content type.

---

### Solution D: Use a composition component

```tsx
// Before
<Flex>
  <Typography variant="meta" as="span">{time}</Typography>
  <Typography variant="meta" as="span">•</Typography>
  <Typography variant="meta" as="span">{author}</Typography>
</Flex>

// After
<Metadata>
  <MetadataTimestamp date={time} />
  <MetadataItem>{author}</MetadataItem>
</Metadata>
```

| Pros | Cons |
|------|------|
| Eliminates multiple instances at once | Requires component to exist |
| Consistent styling guaranteed | Learning curve for new pattern |
| Handles edge cases (separators, responsive) | May be overkill for one-off cases |

**When to use:** When the same pattern appears 3+ times across the codebase.

---

### Solution E: Create a Typography variant

```tsx
// In Typography component, add inline variant
<Typography variant="inline-meta">{text}</Typography>

// Renders as <span> with meta styling
```

| Pros | Cons |
|------|------|
| Keeps Typography system | Adds complexity to Typography |
| Explicit intent ("inline-meta") | Still using Typography for inline |
| Easy migration path | Doesn't solve underlying design issue |

**When to use:** As a temporary migration step, not a final solution.

---

## 2. Inline `<span className>` Pattern

### The Problem
```tsx
<span className="text-xs text-ui-text-secondary ml-1">{text}</span>
```

Raw spans with className scatter styling across the codebase, making it hard to maintain consistency.

### Solution A: Plain text (no wrapper)

```tsx
// Before
<Button>
  Save
  <span className="text-xs opacity-70">(draft)</span>
</Button>

// After
<Button>
  Save (draft)
</Button>
```

| Pros | Cons |
|------|------|
| Simplest possible | Loses ability to style "(draft)" differently |
| No className soup | May not be visually identical |
| Parent handles all styling | Only works for simple cases |

**When to use:** When the visual difference is subtle and not worth the complexity.

---

### Solution B: Use existing component

```tsx
// Before
<span className="text-xs text-ui-text-secondary">{count} items</span>

// After
<MetadataItem>{count} items</MetadataItem>
```

| Pros | Cons |
|------|------|
| Consistent with design system | Must import component |
| Styling centralized | Component must exist |
| Easier to update globally | Slight overhead |

**When to use:** When a suitable component already exists.

---

### Solution C: Create a utility component

```tsx
// New component: InlineText
<InlineText size="xs" color="secondary">{text}</InlineText>

// Renders as <span> with consistent styling
```

| Pros | Cons |
|------|------|
| Type-safe props | Yet another component |
| Consistent API | May encourage more inline text |
| Centralized styling | Could become a dumping ground |

**When to use:** Only if the pattern is extremely common and no existing component fits.

---

### Solution D: Move styling to parent

```tsx
// Before
<div>
  <span className="font-semibold">{name}</span>
  <span className="text-ui-text-secondary ml-2">{role}</span>
</div>

// After
<UserDisplay name={name} subtitle={role} />
```

| Pros | Cons |
|------|------|
| Encapsulates the pattern | Requires component creation |
| Single source of truth | May be too specific |
| Cleaner usage site | Learning curve |

**When to use:** When the span pattern is part of a larger repeated structure.

---

## 3. Typography className Overrides

### The Problem
```tsx
<Typography variant="h1" className="text-2xl font-bold mb-3">{title}</Typography>
```

The variant already defines size/weight, but className overrides it. This indicates either wrong variant or missing variant.

### Solution A: Use correct variant (no className)

```tsx
// Before
<Typography variant="h1" className="text-2xl font-bold mb-3">{title}</Typography>

// After
<Typography variant="h2">{title}</Typography>  // h2 is the right size
```

| Pros | Cons |
|------|------|
| Clean, no overrides | Must know all variants |
| Uses design system correctly | May need to check variant definitions |
| Consistent sizing | Variant might not exist |

**When to use:** When a suitable variant exists.

---

### Solution B: Add spacing to parent container

```tsx
// Before
<Typography variant="h1" className="mb-6">{title}</Typography>
<Typography variant="p">{description}</Typography>

// After
<Flex direction="column" gap="lg">
  <Typography variant="h1">{title}</Typography>
  <Typography variant="p">{description}</Typography>
</Flex>
```

| Pros | Cons |
|------|------|
| Spacing is layout concern, not text concern | Extra wrapper element |
| Consistent spacing via gap tokens | Slightly more verbose |
| Typography stays clean | Must refactor surrounding code |

**When to use:** When className is only for spacing (margin, padding).

---

### Solution C: Use Typography's built-in props

```tsx
// Before
<Typography className="text-ui-text-secondary">{text}</Typography>

// After
<Typography color="secondary">{text}</Typography>
```

| Pros | Cons |
|------|------|
| Uses component API | Prop must exist |
| Type-safe | May need to add prop to component |
| Self-documenting | Limited to what component supports |

**When to use:** When Typography has a prop for the override.

---

### Solution D: Create new variant

```tsx
// Before
<Typography variant="p" className="text-center text-lg italic">{quote}</Typography>

// After
<Typography variant="blockquote">{quote}</Typography>
```

| Pros | Cons |
|------|------|
| Reusable for same pattern | Adds to variant list |
| Single source of truth | Must update Typography component |
| Semantic meaning | Overkill for one-off cases |

**When to use:** When the same className combo appears 3+ times.

---

### Solution E: Accept minimal className

```tsx
// Sometimes acceptable
<Typography variant="h1" className="tracking-tight">{title}</Typography>
```

| Pros | Cons |
|------|------|
| Simple, works | Still has override |
| Minor adjustment only | Sets precedent for more overrides |
| No new abstractions | Inconsistent if not all h1s have it |

**When to use:** For minor, truly one-off adjustments. Document why.

---

## 4. Repeated Metadata Pattern

### The Problem
```tsx
<Flex align="center" gap="xs">
  <Typography variant="meta" as="span">{time}</Typography>
  <Typography variant="meta" as="span">•</Typography>
  <Typography variant="meta" as="span">{author}</Typography>
</Flex>
```

This 3+ element pattern repeats across notifications, versions, comments, etc.

### Solution A: Use Metadata component (EXISTS)

```tsx
// Before (3+ elements repeated)
<Flex align="center" gap="xs">
  <Typography variant="meta" as="span">{time}</Typography>
  <Typography variant="meta" as="span">•</Typography>
  <Typography variant="meta" as="span">{author}</Typography>
</Flex>

// After
<Metadata>
  <MetadataTimestamp date={time} />
  <MetadataItem>by {author}</MetadataItem>
</Metadata>
```

| Pros | Cons |
|------|------|
| Component already exists | Must learn component API |
| Handles separators automatically | Slightly different visual (verify) |
| Semantic `<time>` element included | May need prop additions |
| Single import | |

**When to use:** For any metadata display (timestamps, author, counts, etc.).

---

### Solution B: Simple string join

```tsx
// Before
<Flex>
  <span>{project}</span>
  <span>•</span>
  <span>{status}</span>
</Flex>

// After
<span className="text-sm text-ui-text-secondary">
  {[project, status].join(' • ')}
</span>
```

| Pros | Cons |
|------|------|
| No component needed | No semantic elements |
| Very simple | All items same style |
| Works for simple cases | Can't style items differently |

**When to use:** When all items are plain strings with identical styling.

---

## 5. Repeated Shortcut Hint Pattern

### The Problem
```tsx
<Typography variant="meta" as="span">
  <CommandShortcut className="bg-ui-bg-tertiary px-2 py-1 rounded">↑↓</CommandShortcut>
  {" "}Navigate
</Typography>
```

Repeated 6 times across CommandPalette.tsx and GlobalSearch.tsx.

### Solution A: Create ShortcutHint component

```tsx
// New component
export function ShortcutHint({ keys, text }: { keys: string; text: string }) {
  return (
    <span className="text-xs text-ui-text-secondary">
      <kbd className="px-2 py-1 bg-ui-bg-tertiary rounded font-mono">{keys}</kbd>
      {' '}{text}
    </span>
  );
}

// Usage
<ShortcutHint keys="↑↓" text="Navigate" />
<ShortcutHint keys="Enter" text="Select" />
<ShortcutHint keys="Esc" text="Close" />
```

| Pros | Cons |
|------|------|
| Eliminates 6 instances | New component to maintain |
| Uses semantic `<kbd>` | Very specific use case |
| Consistent styling | |
| Self-documenting | |

**When to use:** This is the correct solution for this pattern.

---

### Solution B: Array map

```tsx
const shortcuts = [
  { keys: '↑↓', text: 'Navigate' },
  { keys: 'Enter', text: 'Select' },
  { keys: 'Esc', text: 'Close' },
];

{shortcuts.map(s => (
  <ShortcutHint key={s.keys} {...s} />
))}
```

| Pros | Cons |
|------|------|
| Data-driven | Still needs ShortcutHint component |
| Easy to modify | May be overkill for 3 items |
| Consistent | |

**When to use:** Combined with Solution A when there are many shortcuts.

---

## 6. Responsive Text Pattern

### The Problem
```tsx
<Typography as="span" className="sm:hidden">W</Typography>
<Typography as="span" className="hidden sm:inline">Week</Typography>
```

Repeated 6 times in RoadmapView.tsx for Week/Month/Quarter toggles.

### Solution A: Create ResponsiveText component

```tsx
// New component
export function ResponsiveText({
  short,
  long,
  breakpoint = 'sm'
}: {
  short: string;
  long: string;
  breakpoint?: 'sm' | 'md' | 'lg';
}) {
  return (
    <>
      <span className={`${breakpoint}:hidden`}>{short}</span>
      <span className={`hidden ${breakpoint}:inline`}>{long}</span>
    </>
  );
}

// Usage
<ResponsiveText short="W" long="Week" />
<ResponsiveText short="M" long="Month" />
<ResponsiveText short="Q" long="Quarter" />
```

| Pros | Cons |
|------|------|
| Eliminates 6 instances | Two DOM elements per usage |
| Clear intent | Slight complexity |
| Reusable across app | |
| Configurable breakpoint | |

**When to use:** Anywhere short/long text variants are needed for responsive.

---

### Solution B: CSS-only with content

```tsx
// CSS
.responsive-week::before {
  content: 'W';
}
@media (min-width: 640px) {
  .responsive-week::before {
    content: 'Week';
  }
}

// Usage
<span className="responsive-week" />
```

| Pros | Cons |
|------|------|
| Single DOM element | Content in CSS is anti-pattern |
| No JS logic | Hard to maintain |
| | Not accessible (screen readers) |
| | Can't use variables |

**When to use:** Never. This is worse.

---

### Solution C: JS-based with hook

```tsx
const isMobile = useMediaQuery('(max-width: 639px)');
<span>{isMobile ? 'W' : 'Week'}</span>
```

| Pros | Cons |
|------|------|
| Single DOM element | Requires JS/hydration |
| Dynamic | Flash of wrong content on SSR |
| Flexible | Extra hook import |

**When to use:** When you need JS logic anyway, but Solution A is usually better.

---

## 7. Badge-Style Text Pattern

### The Problem
```tsx
<Typography variant="meta" as="span" className="px-2 py-0.5 bg-ui-bg-tertiary rounded capitalize">
  {status}
</Typography>
```

Text styled to look like a badge but not using Badge component.

### Solution A: Use Badge component (EXISTS)

```tsx
// Before
<Typography variant="meta" as="span" className="px-2 py-0.5 bg-ui-bg-tertiary rounded">
  {text}
</Typography>

// After
<Badge variant="subtle" size="sm">{text}</Badge>
```

| Pros | Cons |
|------|------|
| Component already exists | Badge may have different sizing |
| Consistent with design system | May need new Badge variant |
| All Badge variants available | Visual diff (verify) |

**When to use:** Always. If Badge doesn't have the right variant, add it to Badge.

---

### Solution B: Add Badge variant

```tsx
// In Badge component, add variant
<Badge variant="inline">{text}</Badge>

// Renders smaller, more subtle
```

| Pros | Cons |
|------|------|
| Extends existing component | Must modify Badge |
| Consistent API | More variants to maintain |
| Single source of truth | |

**When to use:** When existing Badge variants don't fit but it's clearly a badge.

---

## 8. Timestamp Display Pattern

### The Problem
```tsx
<span>{new Date(timestamp).toLocaleDateString()}</span>
```

Timestamps without semantic `<time>` element.

### Solution A: Use MetadataTimestamp (EXISTS)

```tsx
// Before
<span>{formatDate(timestamp)}</span>

// After
<MetadataTimestamp date={timestamp} format="relative" />
```

| Pros | Cons |
|------|------|
| Semantic `<time>` element | Component required |
| Consistent formatting | May not fit all contexts |
| Accessible | |
| Machine-readable dateTime | |

**When to use:** For metadata-style timestamps (comments, versions, etc.).

---

### Solution B: Raw `<time>` element

```tsx
// Before
<span>{formatted}</span>

// After
<time dateTime={date.toISOString()} className="text-sm text-ui-text-secondary">
  {formatted}
</time>
```

| Pros | Cons |
|------|------|
| Semantic HTML | Manual styling |
| No component needed | Must remember dateTime format |
| Flexible | Inconsistent if not careful |

**When to use:** When MetadataTimestamp doesn't fit the context.

---

### Solution C: Create TimeDisplay component

```tsx
export function TimeDisplay({
  date,
  format = 'relative',
  className
}: {
  date: Date | number;
  format?: 'relative' | 'date' | 'datetime';
  className?: string;
}) {
  const d = new Date(date);
  const formatted = formatTime(d, format);

  return (
    <time dateTime={d.toISOString()} className={className}>
      {formatted}
    </time>
  );
}
```

| Pros | Cons |
|------|------|
| Flexible styling via className | Yet another component |
| Always semantic | Similar to MetadataTimestamp |
| Centralized formatting | May duplicate functionality |

**When to use:** If MetadataTimestamp is too opinionated for your use case.

---

## 9. Manual Bullet Separators

### The Problem
```tsx
<span>{item1}</span>
<span>•</span>
<span>{item2}</span>
```

Manual bullet/pipe separators between metadata items.

### Solution A: Use Metadata component (EXISTS)

```tsx
// Before
<Flex>
  <span>{a}</span>
  <span>•</span>
  <span>{b}</span>
</Flex>

// After
<Metadata separator="•">
  <MetadataItem>{a}</MetadataItem>
  <MetadataItem>{b}</MetadataItem>
</Metadata>
```

| Pros | Cons |
|------|------|
| Handles separators automatically | Must use component |
| Consistent | Slight learning curve |
| No manual bullets | |

**When to use:** Always for metadata-style lists.

---

### Solution B: Array join

```tsx
// Before
<span>{a}</span><span>•</span><span>{b}</span>

// After
<span>{[a, b].filter(Boolean).join(' • ')}</span>
```

| Pros | Cons |
|------|------|
| No component needed | All same style |
| Handles empty values | No semantic elements |
| Simple | Less flexible |

**When to use:** For simple, uniform metadata strings.

---

### Solution C: CSS ::before/::after

```tsx
// CSS
.meta-item:not(:first-child)::before {
  content: '•';
  margin: 0 0.5rem;
  color: var(--color-ui-text-tertiary);
}

// Usage
<div className="flex">
  <span className="meta-item">{a}</span>
  <span className="meta-item">{b}</span>
</div>
```

| Pros | Cons |
|------|------|
| No separator elements | CSS dependency |
| Clean markup | Harder to customize |
| Automatic | Screen readers may not handle well |

**When to use:** When you want pure CSS solution and accessibility isn't a concern.

---

## 10. Decision Matrix

### Quick Reference: What Solution to Use

| Pattern | Primary Solution | Fallback |
|---------|------------------|----------|
| `as="span"` in block context | Remove it | Use correct variant |
| `as="span"` for inline | Plain text or Metadata | Semantic HTML |
| Repeated 3+ elements | Extract component | Use existing component |
| Typography + spacing className | Move to parent Flex gap | Accept if one-off |
| Typography + color className | Use color prop | Accept if one-off |
| Typography + size className | Use correct variant | Create variant |
| Timestamp in span | MetadataTimestamp | Raw `<time>` |
| Keyboard shortcut | ShortcutHint (create) | `<kbd>` element |
| Badge-style text | Badge component | Add Badge variant |
| Metadata with bullets | Metadata component | Array join |
| Responsive short/long | ResponsiveText (create) | CSS classes |

### Questions to Ask

1. **Does a component already exist?** → Use it
2. **Is this pattern repeated 3+ times?** → Create component
3. **Is this truly inline text?** → Plain text (no wrapper)
4. **Is there semantic HTML for this?** → Use it (`<time>`, `<kbd>`, etc.)
5. **Is this a one-off?** → Minimal className may be acceptable (document why)

### Red Flags (Never Do)

```tsx
// NEVER - inline style soup
<span className="text-xs text-ui-text-secondary ml-1 opacity-70">{text}</span>

// NEVER - Typography as generic inline wrapper
<Typography as="span" className="...">{text}</Typography>

// NEVER - manual separators repeated
<span>•</span>

// NEVER - timestamps without <time>
<span>{date.toLocaleDateString()}</span>
```

---

## Components to Create

Based on this analysis, create these components:

### 1. ShortcutHint
- Location: `src/components/ui/ShortcutHint.tsx`
- Usage: Keyboard shortcut hints like "↑↓ Navigate"
- Instances eliminated: 6

### 2. ResponsiveText
- Location: `src/components/ui/ResponsiveText.tsx`
- Usage: Mobile/desktop text variants
- Instances eliminated: 6

### Components to Expand Usage

### 1. Metadata / MetadataItem / MetadataTimestamp
- Already exists at `src/components/ui/Metadata.tsx`
- Underused in: notifications, versions, comments, headers
- Instances to convert: 15+

### 2. Badge
- Already exists at `src/components/ui/Badge.tsx`
- Add `variant="inline"` if needed
- Instances to convert: 10+

---

## Execution Checklist

For each file with slop:

- [ ] Identify all slop patterns
- [ ] Categorize by type (use this guide)
- [ ] Choose solution (primary, then fallback)
- [ ] Implement fix
- [ ] Verify visual parity
- [ ] Run `node scripts/validate.js`
- [ ] Mark file as done in SLOP_AUDIT.md
