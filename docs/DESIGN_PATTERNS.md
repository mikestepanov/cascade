# Design Patterns: Eliminating UI Slop

## The Problem

Components force inline styling because the blocks are poorly designed:

```tsx
// SLOP - inline style soup
<Flex gap="sm">
  <span className="text-xs text-ui-text-secondary">by {name}</span>
  <span className="text-xs text-ui-text-secondary">•</span>
  <span className="text-xs text-ui-text-secondary">3h ago</span>
</Flex>

// CLEAN - component handles styling
<Metadata>
  <MetadataItem>by {name}</MetadataItem>
  <MetadataItem>3h ago</MetadataItem>
</Metadata>
```

---

## Components Built

| Component | Location | Purpose |
|-----------|----------|---------|
| `Metadata` | `ui/Metadata.tsx` | Auto-separated metadata (timestamps, counts) |
| `ListItem` | `ui/ListItem.tsx` | Structured list items with icon/title/subtitle/meta |
| `UserDisplay` | `ui/UserDisplay.tsx` | Avatar + name + role patterns |
| `CollapsibleHeader` | `ui/Collapsible.tsx` | Header with icon/badge/chevron slots |

---

## Rules

### 1. No Inline Style Soup

```tsx
// NEVER - even if it's "just one span"
<span className="text-xs opacity-70">({count})</span>

// GOOD - plain text, parent handles style
{showCount && ` (${count})`}

// GOOD - semantic component
<MetadataItem>{count}</MetadataItem>
```

### 2. No Typography for Inline Text

```tsx
// NEVER
<Typography variant="meta" as="span">{text}</Typography>

// GOOD - let parent component handle it
<MetadataItem>{text}</MetadataItem>
<ListItemSubtitle>{text}</ListItemSubtitle>
```

### 3. Extract Repeated Patterns

If you write the same 3+ elements twice, make a component:

```tsx
// Before: repeated 3 times in file
<span className="flex items-center gap-2">
  <span>{icon}</span>
  <span className="font-mono">{key}</span>
  <span className="truncate">{title}</span>
</span>

// After: reusable component
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

### 4. Use Semantic HTML

```tsx
// GOOD
<time dateTime={date.toISOString()}>{formatted}</time>
<article>...</article>
<kbd>⌘K</kbd>

// BAD
<span>{formatted}</span>
<div>...</div>
<span className="font-mono">⌘K</span>
```

---

## Files Refactored

- [x] `MeetingRecordingSection.tsx` - Collapsible + Metadata
- [x] `IssueDependencies.tsx` - IssueDisplay helper
- [ ] `GlobalSearch.tsx` - in progress
- [ ] `NotificationBell.tsx`
- [ ] `LabelsManager.tsx`

---

## Quick Reference

### Metadata (auto-separated)
```tsx
<Metadata>
  <MetadataItem>1,234 words</MetadataItem>
  <MetadataItem>5 min</MetadataItem>
  <MetadataTimestamp date={createdAt} />
</Metadata>
```

### ListItem (props-as-slots)
```tsx
<ListItem
  icon={<FileIcon />}
  title="Document.pdf"
  subtitle="Uploaded yesterday"
  meta="2.4 MB"
/>
```

### UserDisplay
```tsx
<UserDisplay
  name={user.name}
  image={user.image}
  subtitle={user.role}
/>
```

### CollapsibleHeader
```tsx
<Collapsible>
  <CollapsibleHeader icon={<Mic />} badge={<Badge>Active</Badge>}>
    Section Title
  </CollapsibleHeader>
  <CollapsibleContent>...</CollapsibleContent>
</Collapsible>
```
