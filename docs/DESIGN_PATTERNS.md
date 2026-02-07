# Design Patterns: Professional UI Components

> **Goal:** Eliminate "AI slop" by following patterns from Linear, Vercel, Stripe, and Notion.

---

## The Core Problem

Our components force inline span gymnastics because the **blocks themselves are poorly designed**:

```tsx
// OUR CODE (bad) - 120+ instances across 45+ files
<Flex align="center" gap="sm">
  <Typography variant="meta" as="span">by {name}</Typography>
  <Typography variant="meta" as="span">•</Typography>
  <Typography variant="meta" as="span">3h ago</Typography>
</Flex>

// PROFESSIONAL CODE (good)
<Metadata>
  <Metadata.Item>by {name}</Metadata.Item>
  <Metadata.Item>3h ago</Metadata.Item>
</Metadata>
```

The fix isn't Typography. The fix is **redesigning the blocks**.

---

## 1. How Professional Systems Actually Work

### Linear (Orbiter Design System)

- Built on **Radix Primitives** for accessibility
- Uses **LCH color space** with just 3 variables: base, accent, contrast
- Typography: **Inter Display** for headings, **Inter** for body
- **8px spacing scale**: 8, 16, 32, 64px

### Vercel (Geist)

- Custom typefaces: **Geist Sans** (UI), **Geist Mono** (code)
- Semantic class names: `text-heading-24`, `text-copy-20`
- CSS custom properties for all tokens

### Stripe Apps

- **Typed CSS prop** instead of Tailwind classes
- **Props-as-slots** pattern for ListItem (not children)
- **Separate imports**: `import { Table, TableHead, TableRow }` (NOT `Table.Head`)
- Component categories: Views, Layout, Navigation, Content, Forms

```tsx
// Stripe's actual pattern
<ListItem
  title={user.name}
  secondaryTitle={user.email}
  value={role}
  icon={<Icon name="user" />}
/>
```

---

## 2. Metadata Display

### Anti-Pattern: Span Soup (Our Current State)

Found in: `MeetingRecordingSection`, `NotificationBell`, `GlobalSearch`, `ActivityFeed`

```tsx
// BAD - 10+ instances in MeetingRecordingSection alone
<Flex gap="md">
  <Typography variant="meta" as="span">
    {wordCount} words
  </Typography>
  <Typography variant="meta" as="span">•</Typography>
  <Typography variant="meta" as="span">
    {duration} min
  </Typography>
  <Typography variant="meta" as="span">•</Typography>
  <Typography variant="meta" as="span">
    {speakerCount} speakers
  </Typography>
</Flex>
```

### Pattern: Metadata Component

```tsx
// GOOD - handles separators, spacing, semantics automatically
<Metadata>
  <Metadata.Item>{wordCount} words</Metadata.Item>
  <Metadata.Item>{duration} min</Metadata.Item>
  <Metadata.Item>{speakerCount} speakers</Metadata.Item>
</Metadata>

// With semantic time element
<Metadata>
  <Metadata.Timestamp date={createdAt} />
  <Metadata.Item>by {author}</Metadata.Item>
</Metadata>
```

The Metadata component handles:
- Automatic separators (• or |)
- Consistent styling
- Semantic `<time>` elements for dates
- No `as="span"` needed

---

## 3. List Item Architecture

### Anti-Pattern: Manual Flex Items

Found in: `IssueDependencies` (3x), `LabelsManager`, `NotificationItem`

```tsx
// BAD - repeated 3 times in IssueDependencies
<Flex align="center" gap="sm" className="flex-1 min-w-0">
  <Typography variant="small" as="span">
    {getTypeIcon(link.issue.type)}
  </Typography>
  <Typography variant="mono" as="span">
    {link.issue.key}
  </Typography>
  <Typography variant="small" as="span" className="truncate">
    {link.issue.title}
  </Typography>
</Flex>
```

### Pattern: Props-as-Slots (Stripe Style)

```tsx
// GOOD - Stripe's actual pattern
<ListItem
  icon={getTypeIcon(issue.type)}
  title={issue.key}
  secondaryTitle={issue.title}
  titleMono
  truncate
/>
```

### Pattern: Compound Components (Alternative)

```tsx
// GOOD - if you need more flexibility
import { ListItem, ListItemIcon, ListItemContent, ListItemMeta } from './ui/ListItem';

<ListItem>
  <ListItemIcon>{icon}</ListItemIcon>
  <ListItemContent>
    <ListItemTitle mono>{key}</ListItemTitle>
    <ListItemSubtitle truncate>{title}</ListItemSubtitle>
  </ListItemContent>
  <ListItemMeta>{status}</ListItemMeta>
</ListItem>
```

**Note:** Use separate imports, NOT dot notation. This matches Radix/Stripe patterns.

---

## 4. User Display Pattern

Found repeated across: `IssueComments`, `ActivityFeed`, `NotificationItem`, `Dashboard`

### Anti-Pattern

```tsx
// BAD
<Flex align="center" gap="md">
  <Avatar src={user.image} name={user.name} />
  <div>
    <Typography variant="label" as="span">{user.name}</Typography>
    <Typography variant="meta" as="span">{user.role}</Typography>
  </div>
</Flex>
```

### Pattern: UserDisplay Component

```tsx
// GOOD
<UserDisplay user={user} showRole />

// or with slots for flexibility
<UserDisplay>
  <UserDisplay.Avatar user={user} />
  <UserDisplay.Info>
    <UserDisplay.Name>{user.name}</UserDisplay.Name>
    <UserDisplay.Role>{user.role}</UserDisplay.Role>
  </UserDisplay.Info>
</UserDisplay>
```

---

## 5. Typography Rules

### When to Use Typography

```tsx
// ✅ Standalone headings and paragraphs
<Typography variant="h2">{title}</Typography>
<Typography variant="p">{description}</Typography>

// ✅ Standalone blocks
<Typography variant="blockquote">{quote}</Typography>
```

### When NOT to Use Typography

```tsx
// ❌ DON'T - metadata inside list items
<Typography variant="meta" as="span">{timestamp}</Typography>

// ✅ DO - use structured component
<Metadata.Timestamp date={timestamp} />

// ❌ DON'T - inline text with overrides
<Typography variant="small" as="span" className="truncate">{text}</Typography>

// ✅ DO - let parent component handle styling
<ListItemTitle truncate>{text}</ListItemTitle>
```

**Rule:** If you're typing `as="span"`, you need a better component.

---

## 6. Responsive Text

### Anti-Pattern

```tsx
// BAD - hidden via className
<Typography variant="meta" as="span" className="hidden sm:inline">
  — {description}
</Typography>
```

### Pattern: Responsive Prop

```tsx
// GOOD - explicit responsive behavior
<Metadata.Item hideBelow="sm">— {description}</Metadata.Item>

// or
<Text responsive={{ base: 'hidden', sm: 'visible' }}>
  {description}
</Text>
```

---

## 7. AI Slop Checklist

### Visual AI Slop (Universal)

- [ ] Purple-to-blue gradient heroes
- [ ] Excessive rounded corners (`rounded-lg` on everything)
- [ ] Flat backgrounds without depth
- [ ] No micro-interactions or transitions
- [ ] Static hover states
- [ ] Generic fonts (Inter everywhere)

### Structural AI Slop (Our Codebase)

- [ ] `as="span"` on Typography (120+ instances)
- [ ] Typography with inline `className` (200+ instances)
- [ ] Manual Flex for every list item
- [ ] Manual bullet separators (`•` via Typography)
- [ ] No semantic `<time>` elements
- [ ] Props explosion (10+ props on one component)
- [ ] Raw Tailwind colors

### Professional Indicators

- [x] Compound components with semantic slots
- [x] Props-as-slots for simple items (Stripe pattern)
- [x] Separate imports for subcomponents (Radix pattern)
- [x] Semantic HTML (article, header, footer, time)
- [x] Design tokens for all values
- [x] Consistent spacing scale (8px)
- [x] Components handle their children's styling
- [x] `asChild` pattern for flexible rendering

---

## 8. Worst Offenders (Audit Results)

| File | `as="span"` Count | Issue |
|------|------------------|-------|
| `MeetingRecordingSection.tsx` | 10+ | Span soup for transcript metadata |
| `IssueDependencies.tsx` | 12 | Same 3-span pattern repeated 3 times |
| `GlobalSearch.tsx` | 6+ | Keyboard shortcuts, search metadata |
| `LabelsManager.tsx` | 5 | Group headers with counts |
| `NotificationBell.tsx` | 6 | Notification timestamps |

---

## 9. Migration Priority

### Phase 1: Create Core Components (Highest Impact)

```
src/components/ui/
├── Metadata/
│   ├── Metadata.tsx
│   ├── MetadataItem.tsx
│   └── MetadataTimestamp.tsx  // renders <time>
├── ListItem/
│   ├── ListItem.tsx
│   ├── ListItemIcon.tsx
│   ├── ListItemContent.tsx
│   ├── ListItemTitle.tsx
│   ├── ListItemSubtitle.tsx
│   └── ListItemMeta.tsx
└── UserDisplay/
    ├── UserDisplay.tsx
    └── ...
```

### Phase 2: Refactor Top 5 Offenders

1. `MeetingRecordingSection.tsx` → use `Metadata`
2. `IssueDependencies.tsx` → use `ListItem`
3. `GlobalSearch.tsx` → use `Metadata`
4. `LabelsManager.tsx` → use `ListItem`
5. `NotificationBell.tsx` → use `Metadata`, `ListItem`

### Phase 3: Eliminate `as="span"`

After blocks are fixed, `as="span"` should disappear from the codebase.

---

## 10. Component Implementation Notes

### Use React Context for Compound State

```tsx
// Parent creates context
const MetadataContext = createContext<{ size: 'sm' | 'md' }>({ size: 'md' });

function Metadata({ size = 'md', children }) {
  return (
    <MetadataContext.Provider value={{ size }}>
      <div className="flex items-center gap-2">{children}</div>
    </MetadataContext.Provider>
  );
}

// Children consume it
function MetadataItem({ children }) {
  const { size } = useContext(MetadataContext);
  return <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>{children}</span>;
}
```

### Use Radix's asChild Pattern

```tsx
// Allow rendering as different element
<Button asChild>
  <Link href="/dashboard">Dashboard</Link>
</Button>
```

### Separate Exports (Not Dot Notation)

```tsx
// ✅ How Radix/Stripe do it
import { ListItem, ListItemContent, ListItemMeta } from './ui/ListItem';

// ❌ Not this (though it looks nice, it's not the standard)
import { ListItem } from './ui/ListItem';
<ListItem.Content>
```

---

## References

- [Linear UI Redesign](https://linear.app/now/how-we-redesigned-the-linear-ui) - Orbiter design system
- [Linear + Radix Case Study](https://www.radix-ui.com/primitives/case-studies/linear)
- [Vercel Geist Design System](https://vercel.com/geist/introduction)
- [Stripe Apps Components](https://docs.stripe.com/stripe-apps/components)
- [Stripe Apps Styling](https://docs.stripe.com/stripe-apps/style) - CSS prop pattern
- [Stripe ListItem](https://docs.stripe.com/stripe-apps/components/list) - Props-as-slots
- [Advanced React Component Composition](https://frontendmastery.com/posts/advanced-react-component-composition-guide/)
- [Escape AI Slop Guide](https://techbytes.app/posts/escape-ai-slop-frontend-design-guide/)
- [Notion's Block Data Model](https://www.notion.com/blog/data-model-behind-notion)
