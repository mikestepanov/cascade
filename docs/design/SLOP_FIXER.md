# Slop Fixer Guide

> Hyper-detailed guide for eliminating UI slop patterns. Each pattern has multiple solutions with pros/cons analysis.

---

## Important Notes

### Typography Status
Typography is **appropriate for block-level text** (headings, paragraphs, blockquotes). It is **not appropriate for inline text** within flex layouts, buttons, or metadata displays. For inline text, use:
- Plain text (inherits parent styles)
- Semantic HTML (`<time>`, `<kbd>`, `<code>`)
- Composition components (`Metadata`, `ListItem`, `UserDisplay`)

### Existing Components to Leverage
Before creating new components, check these exist:
- `Metadata` / `MetadataItem` / `MetadataTimestamp` - inline metadata with auto-separators
- `ListItem` - structured list items with icon/title/subtitle/meta slots
- `UserDisplay` - avatar + name + subtitle
- `Badge` - status/label badges with variants
- `KeyboardShortcut` - keyboard key display with `<kbd>` semantic element
- `CollapsibleHeader` - section headers with icon/badge/chevron

---

## Table of Contents

1. [Typography `as="span"` Pattern](#1-typography-asspan-pattern)
2. [Inline `<span className>` Pattern](#2-inline-span-classname-pattern)
3. [Typography className Overrides](#3-typography-classname-overrides)
4. [Repeated Metadata Pattern](#4-repeated-metadata-pattern)
5. [Keyboard Shortcut Hints Pattern](#5-keyboard-shortcut-hints-pattern)
6. [Responsive Text Pattern](#6-responsive-text-pattern)
7. [Badge-Style Text Pattern](#7-badge-style-text-pattern)
8. [Tag Display Pattern](#8-tag-display-pattern)
9. [Timestamp Display Pattern](#9-timestamp-display-pattern)
10. [Manual Bullet Separators](#10-manual-bullet-separators)
11. [Multiple Issues in One Element](#11-multiple-issues-in-one-element)
12. [Decision Matrix](#12-decision-matrix)

---

## 1. Typography `as="span"` Pattern

### The Problem
```tsx
<Typography variant="meta" as="span">{text}</Typography>
```

Typography defaults to `<p>` tag. Using `as="span"` forces inline rendering, but this indicates the wrong component is being used.

### ⚠️ Warning
Simply removing `as="span"` will break layout because Typography renders as `<p>` (block element). You must also refactor the parent or use a different approach.

### Solution A: Use Metadata component (RECOMMENDED)

```tsx
// Before
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
| Eliminates multiple elements at once | Must learn Metadata API |
| Handles separators automatically | Slightly different visual (verify) |
| Semantic `<time>` element included | |
| Already exists, no new code | |

**When to use:** For any inline metadata (timestamps, author, counts, stats).

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
| Inherits parent styles naturally | Only works if parent has correct styles |
| Cleanest possible markup | Not suitable if text needs unique styling |

**When to use:** When text is inside a styled container (Button, Badge, etc.) and should inherit that container's text styles.

---

### Solution C: Use semantic HTML element

```tsx
// Before
<Typography variant="meta" as="span">{time}</Typography>

// After
<time dateTime={date.toISOString()} className="text-xs text-ui-text-secondary">
  {formatted}
</time>
```

| Pros | Cons |
|------|------|
| Proper semantic HTML | Need to add styling classes |
| Accessibility benefits | More verbose for simple cases |
| SEO/machine-readable | Must know which semantic element applies |

**Semantic elements to use:**
- `<time>` - timestamps, dates, durations
- `<kbd>` - keyboard keys (use KeyboardShortcut component)
- `<code>` - inline code
- `<abbr>` - abbreviations
- `<strong>` / `<em>` - emphasis

**When to use:** When there's a semantic HTML element that matches the content type.

---

### Solution D: Refactor parent to use block layout

```tsx
// Before - inline layout forcing as="span"
<Flex align="center">
  <Typography as="span">{a}</Typography>
  <Typography as="span">{b}</Typography>
</Flex>

// After - stack layout, Typography renders as blocks
<Flex direction="column" gap="xs">
  <Typography variant="meta">{a}</Typography>
  <Typography variant="meta">{b}</Typography>
</Flex>
```

| Pros | Cons |
|------|------|
| Typography used correctly | Changes layout direction |
| Semantic block elements | May not fit design |
| No `as="span"` needed | Requires parent refactoring |

**When to use:** When vertical stacking is acceptable or preferred.

---

### Solution E: Remove Typography entirely

```tsx
// Before
<div className="text-sm">
  <Typography as="span">{text}</Typography>
</div>

// After
<div className="text-sm">
  {text}
</div>
```

| Pros | Cons |
|------|------|
| Simplest fix | No Typography styling |
| No wrapper overhead | Parent must handle all styling |
| Clean markup | |

**When to use:** When Typography adds no value (parent already styled).

---

## 2. Inline `<span className>` Pattern

### The Problem
```tsx
<span className="text-xs text-ui-text-secondary ml-1">{text}</span>
```

Raw spans with className scatter styling across the codebase.

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
| Easier to update globally | |

**When to use:** When a suitable component already exists.

---

### Solution C: Move styling to parent container

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
| Encapsulates the pattern | Requires component to exist |
| Single source of truth | May be too specific |
| Cleaner usage site | |

**When to use:** When the span pattern is part of a larger repeated structure.

---

### Solution D: Accept minimal styling (LAST RESORT)

```tsx
// Sometimes acceptable for truly one-off cases
<span className="font-mono">{code}</span>
```

| Pros | Cons |
|------|------|
| Simple, works | Still inline styling |
| No abstraction overhead | Sets precedent |
| | Must document why |

**When to use:** Only for truly one-off cases. Document the reason in a comment.

**Acceptable className patterns:**
- Single utility: `font-mono`, `truncate`, `capitalize`
- Never acceptable: Multiple utilities, color + size + spacing combos

---

## 3. Typography className Overrides

### The Problem
```tsx
<Typography variant="h1" className="text-2xl font-bold mb-3">{title}</Typography>
```

The variant already defines size/weight, but className overrides it.

### Solution A: Use correct variant (no className)

```tsx
// Before
<Typography variant="h1" className="text-2xl font-bold mb-3">{title}</Typography>

// After
<Typography variant="h2">{title}</Typography>  // h2 might be the right size
```

| Pros | Cons |
|------|------|
| Clean, no overrides | Must know all variants |
| Uses design system correctly | Variant might not exist |
| Consistent sizing | |

**When to use:** When a suitable variant exists. Check Typography.tsx for all variants.

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
| Spacing is layout concern | Extra wrapper element |
| Consistent via gap tokens | Slightly more verbose |
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
| Type-safe | May need to add prop |
| Self-documenting | |

**When to use:** When Typography has a prop for the override.

---

### Solution D: Create new variant (if pattern repeats 3+ times)

```tsx
// Before (appears 3+ times across codebase)
<Typography variant="p" className="text-center text-lg italic">{quote}</Typography>

// After - add variant to Typography component
<Typography variant="blockquote">{quote}</Typography>
```

| Pros | Cons |
|------|------|
| Reusable | Adds to variant list |
| Single source of truth | Must update Typography |
| Semantic meaning | Overkill for one-off |

**When to use:** When the same className combo appears 3+ times.

---

### Solution E: Accept minimal className (document why)

```tsx
// Acceptable - single non-size/color utility
<Typography variant="h1" className="tracking-tight">{title}</Typography>
```

| Pros | Cons |
|------|------|
| Simple | Still has override |
| Minor adjustment only | Must be consistent |

**Acceptable:**
- `tracking-tight`, `tracking-tighter` (letter-spacing)
- `truncate`, `line-clamp-2` (overflow)
- `capitalize`, `uppercase` (text-transform)

**Not acceptable:**
- Size overrides: `text-2xl`, `text-lg`
- Color overrides: `text-ui-text-secondary`
- Weight overrides: `font-bold`, `font-semibold`
- Spacing: `mb-4`, `mt-2`

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

This 3+ element pattern repeats across notifications, versions, comments.

### Solution A: Use Metadata component (RECOMMENDED)

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
| Component already exists | Must learn API |
| Handles separators automatically | Verify visual match |
| Semantic `<time>` included | |
| Single import | |

**When to use:** For any metadata display. This is the primary solution.

---

### Solution B: Simple string join (plain strings only)

```tsx
// Before
<Flex>
  <span>{project}</span>
  <span>•</span>
  <span>{status}</span>
</Flex>

// After
<span className="text-sm text-ui-text-secondary">
  {[project, status].filter(Boolean).join(' • ')}
</span>
```

| Pros | Cons |
|------|------|
| No component needed | No semantic elements |
| Very simple | All items same style |
| Handles empty values | Less flexible |
| | No `<time>` for dates |

**When to use:** Only when all items are plain strings with identical styling AND no timestamps.

---

## 5. Keyboard Shortcut Hints Pattern

### The Problem
```tsx
<Typography variant="meta" as="span">
  <CommandShortcut className="bg-ui-bg-tertiary px-2 py-1 rounded">↑↓</CommandShortcut>
  {" "}Navigate
</Typography>
```

Repeated 6 times in CommandPalette.tsx and GlobalSearch.tsx.

### Solution A: Use Metadata + KeyboardShortcut (RECOMMENDED)

```tsx
// Before
<Typography variant="meta" as="span">
  <CommandShortcut className="...">↑↓</CommandShortcut> Navigate
</Typography>
<Typography variant="meta" as="span">
  <CommandShortcut className="...">Enter</CommandShortcut> Select
</Typography>

// After
<Metadata size="sm" gap="lg">
  <MetadataItem>
    <KeyboardShortcut shortcut="↑↓" size="sm" /> Navigate
  </MetadataItem>
  <MetadataItem>
    <KeyboardShortcut shortcut="Enter" size="sm" /> Select
  </MetadataItem>
</Metadata>
```

| Pros | Cons |
|------|------|
| Uses existing components | Slightly more verbose |
| KeyboardShortcut has semantic `<kbd>` | Must verify visual match |
| Metadata handles layout | |
| No new components needed | |

**When to use:** For all keyboard shortcut hints.

---

### Solution B: Direct KeyboardShortcut usage

```tsx
// For simpler cases
<div className="flex items-center gap-4 text-xs text-ui-text-secondary">
  <span><KeyboardShortcut shortcut="↑↓" size="sm" /> Navigate</span>
  <span><KeyboardShortcut shortcut="Enter" size="sm" /> Select</span>
</div>
```

| Pros | Cons |
|------|------|
| Uses semantic `<kbd>` | Manual layout |
| Simple | Inline spans |
| | Less consistent |

**When to use:** When Metadata feels too heavy.

---

## 6. Responsive Text Pattern

### The Problem
```tsx
<Typography as="span" className="sm:hidden">W</Typography>
<Typography as="span" className="hidden sm:inline">Week</Typography>
```

Repeated 6 times in RoadmapView.tsx for Week/Month/Quarter toggles.

### Context Matters
These appear inside `<button>` elements. The button already has text styling.

### Solution A: Plain spans with Tailwind (RECOMMENDED)

```tsx
// Before
<button>
  <Typography as="span" className="sm:hidden">W</Typography>
  <Typography as="span" className="hidden sm:inline">Week</Typography>
</button>

// After
<button>
  <span className="sm:hidden">W</span>
  <span className="hidden sm:inline">Week</span>
</button>
```

| Pros | Cons |
|------|------|
| Removes Typography misuse | Still two elements |
| Button handles text styling | Responsive classes inline |
| Simple, works | |

**When to use:** When inside a styled container that handles text styling.

---

### Solution B: Create ResponsiveText component (LOWER PRIORITY)

```tsx
// New component - only if pattern appears 10+ times
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
```

| Pros | Cons |
|------|------|
| Encapsulates pattern | New component for 6 uses |
| Clear intent | May be premature abstraction |
| Configurable breakpoint | Two DOM elements still |

**When to use:** Only if pattern appears 10+ times. Currently 6 instances - Solution A is sufficient.

---

### Solution C: Abbreviation with title

```tsx
// Alternative semantic approach
<abbr title="Week" className="no-underline">
  <span className="sm:hidden">W</span>
  <span className="hidden sm:inline">Week</span>
</abbr>
```

| Pros | Cons |
|------|------|
| Semantic HTML | Still two inner spans |
| Tooltip on hover | More complex |
| Accessible | |

**When to use:** When the short form is a true abbreviation.

---

## 7. Badge-Style Text Pattern

### The Problem
```tsx
<Typography variant="meta" as="span" className="px-2 py-0.5 bg-ui-bg-tertiary rounded capitalize">
  {status}
</Typography>
```

Text styled to look like a badge but not using Badge component.

### Solution A: Use Badge component (RECOMMENDED)

```tsx
// Before
<Typography variant="meta" as="span" className="px-2 py-0.5 bg-ui-bg-tertiary rounded">
  {text}
</Typography>

// After
<Badge variant="secondary" size="sm">{text}</Badge>
```

| Pros | Cons |
|------|------|
| Component already exists | Badge may have different sizing |
| Consistent with design system | May need new variant |
| All variants available | Verify visual match |

**When to use:** Always. If Badge doesn't have the right variant, add it to Badge.

---

### Solution B: Add Badge variant

```tsx
// In Badge component
<Badge variant="inline">{text}</Badge>  // New variant for smaller, subtler badges
```

| Pros | Cons |
|------|------|
| Extends existing component | Must modify Badge |
| Consistent API | More variants to maintain |
| Single source of truth | |

**When to use:** When existing Badge variants don't fit but it's clearly a badge.

---

### Solution C: Use in constrained contexts (search results, command items)

```tsx
// When Badge feels too heavy inside CommandItem
<span className="px-1.5 py-0.5 text-xs bg-ui-bg-tertiary rounded">
  {type}
</span>
```

| Pros | Cons |
|------|------|
| Lightweight | Inline styling |
| Fits constrained space | Inconsistent with Badge |

**When to use:** Only in tight spaces where Badge is too large. Document why.

---

## 8. Tag Display Pattern

### The Problem
```tsx
<Flex as="span" inline className="px-2 py-1 bg-brand-subtle text-brand-hover text-xs rounded">
  {tag}
  <Button size="icon" variant="ghost" onClick={onRemove}>×</Button>
</Flex>
```

Removable tags with inline styling.

### Solution A: Create/use Tag component

```tsx
// If Tag component exists
<Tag onRemove={() => removeTag(tag)}>{tag}</Tag>

// If not, create one
export function Tag({
  children,
  onRemove
}: {
  children: React.ReactNode;
  onRemove?: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-brand-subtle text-brand text-xs rounded">
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:text-brand-hover"
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </span>
  );
}
```

| Pros | Cons |
|------|------|
| Reusable | New component if doesn't exist |
| Consistent | |
| Handles remove button | |

**When to use:** For any removable tag/chip pattern.

---

### Solution B: Use Badge with remove

```tsx
<Badge variant="brand" size="sm">
  {tag}
  <button onClick={onRemove} className="ml-1">×</button>
</Badge>
```

| Pros | Cons |
|------|------|
| Uses existing Badge | Badge may not support remove |
| Consistent | Less semantic |

**When to use:** If Badge already supports this pattern.

---

## 9. Timestamp Display Pattern

### The Problem
```tsx
<span>{new Date(timestamp).toLocaleDateString()}</span>
```

Timestamps without semantic `<time>` element.

### Solution A: Use MetadataTimestamp (RECOMMENDED)

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
| Flexible | |

**When to use:** When MetadataTimestamp doesn't fit the context.

---

## 10. Manual Bullet Separators

### The Problem
```tsx
<span>{item1}</span>
<span>•</span>
<span>{item2}</span>
```

Manual bullet/pipe separators between metadata items.

### Solution A: Use Metadata component (RECOMMENDED)

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
| Consistent | |
| aria-hidden on separators | |

**When to use:** Always for metadata-style lists.

---

### Solution B: Array join (plain strings only)

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
| Simple | |

**When to use:** For simple, uniform metadata strings without timestamps.

---

## 11. Multiple Issues in One Element

### The Problem
```tsx
<Typography variant="h1" className="text-2xl font-bold mb-3 tracking-tight">{title}</Typography>
```

This has 3 issues:
1. Size conflict (variant vs className)
2. Spacing via className
3. Arbitrary Tailwind (tracking-tight)

### Solution: Fix in order of severity

**Step 1: Remove size/weight conflicts**
```tsx
// Remove text-2xl and font-bold (variant handles these)
<Typography variant="h1" className="mb-3 tracking-tight">{title}</Typography>
```

**Step 2: Move spacing to parent**
```tsx
<Flex direction="column" gap="md">
  <Typography variant="h1" className="tracking-tight">{title}</Typography>
  <Typography variant="p">{description}</Typography>
</Flex>
```

**Step 3: Evaluate remaining className**
```tsx
// tracking-tight is acceptable (minor adjustment, consistent across all h1s)
<Typography variant="h1" className="tracking-tight">{title}</Typography>

// OR add to variant if used on all h1s
```

| Order | Fix | Impact |
|-------|-----|--------|
| 1st | Remove size/weight | Eliminates conflict |
| 2nd | Move spacing to parent | Separates concerns |
| 3rd | Evaluate remaining | Keep if minor, extract if repeated |

---

## 12. Decision Matrix

### Quick Reference: What Solution to Use

| Pattern | Primary Solution | Fallback | Notes |
|---------|------------------|----------|-------|
| `as="span"` for metadata | Metadata component | Semantic HTML | Never just remove |
| `as="span"` in button/container | Plain text | Remove Typography | Parent handles styling |
| Repeated 3+ elements | Extract component | Use existing component | Check if exists first |
| Typography + spacing className | Move to parent Flex gap | | Never on Typography |
| Typography + color className | Use color prop | | |
| Typography + size className | Use correct variant | Create variant | Never override |
| Typography + tracking | Accept with comment | | Minor adjustment |
| Timestamp in span | MetadataTimestamp | Raw `<time>` | Must have dateTime |
| Keyboard shortcut | KeyboardShortcut + Metadata | | Semantic `<kbd>` |
| Badge-style text | Badge component | Add Badge variant | |
| Metadata with bullets | Metadata component | Array join | |
| Responsive short/long | Plain spans | ResponsiveText | Low priority |
| Multiple issues | Fix in order | | Size → Spacing → Rest |

### Questions to Ask

1. **Does a component already exist for this?** → Use it (Metadata, Badge, KeyboardShortcut, etc.)
2. **Is this pattern repeated 3+ times?** → Create component or use existing
3. **Is this inside a styled container?** → Plain text, remove wrapper
4. **Is there semantic HTML for this?** → Use it (`<time>`, `<kbd>`, `<abbr>`)
5. **Is this a one-off minor adjustment?** → Accept with comment

### Almost Never Do (Exceptions Must Be Documented)

```tsx
// ALMOST NEVER - inline style soup
<span className="text-xs text-ui-text-secondary ml-1 opacity-70">{text}</span>
// Exception: Truly one-off with comment explaining why

// ALMOST NEVER - Typography for inline
<Typography as="span" className="...">{text}</Typography>
// Exception: None. Use Metadata, plain text, or semantic HTML

// ALMOST NEVER - manual separators
<span>•</span>
// Exception: Inside existing component that can't use Metadata

// ALMOST NEVER - timestamps without <time>
<span>{date.toLocaleDateString()}</span>
// Exception: None. Always use <time> or MetadataTimestamp
```

---

## Components Summary

### Use These (Already Exist)

| Component | Location | Use For |
|-----------|----------|---------|
| `Metadata` | `ui/Metadata.tsx` | Inline metadata with separators |
| `MetadataItem` | `ui/Metadata.tsx` | Single metadata value |
| `MetadataTimestamp` | `ui/Metadata.tsx` | Dates with `<time>` element |
| `Badge` | `ui/Badge.tsx` | Status/label badges |
| `KeyboardShortcut` | `ui/KeyboardShortcut.tsx` | Keyboard keys with `<kbd>` |
| `ListItem` | `ui/ListItem.tsx` | Structured list items |
| `UserDisplay` | `ui/UserDisplay.tsx` | Avatar + name + subtitle |

### Consider Creating (Low Priority)

| Component | Use For | Instances | Priority |
|-----------|---------|-----------|----------|
| `ResponsiveText` | Mobile/desktop variants | 6 | LOW - plain spans work |
| `Tag` | Removable tags | 2+ | MEDIUM - if Badge doesn't fit |

---

## Execution Checklist

For each file with slop:

- [ ] Read the file, identify all slop patterns
- [ ] Check if existing components solve it (Metadata, Badge, KeyboardShortcut)
- [ ] Categorize by pattern type (use this guide)
- [ ] Choose solution (primary, then fallback)
- [ ] If multiple issues in one element, fix in order (size → spacing → rest)
- [ ] Implement fix
- [ ] Verify visual parity (screenshot before/after if needed)
- [ ] Verify accessibility (semantic HTML, focus states)
- [ ] Run `node scripts/validate.js`
- [ ] Update SLOP_AUDIT.md status
