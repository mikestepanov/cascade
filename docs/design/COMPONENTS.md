# Component Patterns

## The Problem

Bad component design forces inline style soup:

```tsx
// SLOP
<span className="text-xs text-ui-text-secondary">by {name}</span>
<span className="text-xs text-ui-text-secondary">•</span>
<span className="text-xs text-ui-text-secondary">3h ago</span>

// CLEAN
<Metadata>
  <MetadataItem>by {name}</MetadataItem>
  <MetadataItem>3h ago</MetadataItem>
</Metadata>
```

## Rules

### 1. No Inline Style Soup

```tsx
// NEVER
<span className="text-xs opacity-70">({count})</span>

// OK - plain text inherits parent style
{showCount && ` (${count})`}

// OK - semantic component
<MetadataItem>{count}</MetadataItem>
```

### 2. Extract Repeated Patterns

If 3+ elements appear twice, make a component:

```tsx
// Extracted helper
function IssueDisplay({ type, issueKey, title }) {
  return (
    <span className="flex items-center gap-2 min-w-0">
      <span className="shrink-0">{getIcon(type)}</span>
      <span className="shrink-0 font-mono text-xs text-ui-text-secondary">{issueKey}</span>
      <span className="truncate text-sm text-ui-text">{title}</span>
    </span>
  );
}
```

### 3. Use Semantic HTML

```tsx
// GOOD
<time dateTime={date.toISOString()}>{formatted}</time>
<kbd>⌘K</kbd>
<article>...</article>

// BAD
<span>{formatted}</span>
<span className="font-mono">⌘K</span>
```

## Available Components

### Metadata

Auto-separated inline metadata.

```tsx
import { Metadata, MetadataItem, MetadataTimestamp } from "@/components/ui/Metadata";

<Metadata>
  <MetadataItem>1,234 words</MetadataItem>
  <MetadataItem>5 min</MetadataItem>
  <MetadataTimestamp date={createdAt} />
</Metadata>
```

### ListItem

Structured list items with slots.

```tsx
import { ListItem } from "@/components/ui/ListItem";

<ListItem
  icon={<FileIcon />}
  title="Document.pdf"
  subtitle="Uploaded yesterday"
  meta="2.4 MB"
/>
```

### UserDisplay

Avatar + name + subtitle.

```tsx
import { UserDisplay } from "@/components/ui/UserDisplay";

<UserDisplay
  name={user.name}
  image={user.image}
  subtitle={user.role}
/>
```

### CollapsibleHeader

Section header with icon/badge/chevron.

```tsx
import { Collapsible, CollapsibleHeader, CollapsibleContent } from "@/components/ui/Collapsible";

<Collapsible>
  <CollapsibleHeader icon={<Mic />} badge={<Badge>Active</Badge>}>
    Section Title
  </CollapsibleHeader>
  <CollapsibleContent>...</CollapsibleContent>
</Collapsible>
```

## Refactoring Progress

- [x] `MeetingRecordingSection.tsx`
- [x] `IssueDependencies.tsx`
- [ ] `GlobalSearch.tsx`
- [ ] `NotificationBell.tsx`
- [ ] `LabelsManager.tsx`
