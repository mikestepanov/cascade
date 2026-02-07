# UI Slop Audit

> Complete analysis of inline style soup, semantic violations, and patterns to extract.

## Summary

| Category | Count | Severity |
|----------|-------|----------|
| `as="span"` on Typography | 93 | HIGH |
| `<span className="...">` | 459+ | MEDIUM |
| Typography className overrides | 97+ | MEDIUM |
| Repeated patterns to extract | 20+ | HIGH |
| Semantic HTML violations | 15+ | MEDIUM |
| Raw flex divs | 12+ | LOW |
| Complex nested selectors | 1 | 🔴 CRITICAL |
| Raw `<kbd>` with className | 6+ | MEDIUM |
| Inline `style={{}}` props | 10+ | MEDIUM |
| `data-[attribute]` selectors | 3+ | LOW |

---

## 1. Typography `as="span"` Violations (93 instances)

### Why it's slop
Using `as="span"` forces Typography to render as inline `<span>` instead of semantic elements, breaking HTML structure.

### By File

| File | Count | Lines |
|------|-------|-------|
| ActivityFeed.tsx | 3 | 190, 193, 197 |
| AppHeader.tsx | 1 | 57 |
| AppSidebar.tsx | 4 | 442, 558, 567, 625 |
| AI/AIChat.tsx | 1 | 223 |
| AI/AISuggestionsPanel.tsx | 5 | 158, 173, 177, 205, 212 |
| Admin/HourComplianceDashboard.tsx | 2 | 280, 288 |
| Calendar/CreateEventModal.tsx | 2 | 300, 322 |
| Calendar/EventDetailsModal.tsx | 2 | 221, 269 |
| Calendar/RoadmapView.tsx | 6 | 159, 162, 176, 179, 193, 196 |
| Calendar/shadcn-calendar/* | 4 | Various |
| CommandPalette.tsx | 3 | 118, 124, 130 |
| Dashboard/RecentActivity.tsx | 2 | 79, 84 |
| FilterBar.tsx | 4 | 150, 318, 334, 366 |
| GlobalSearch.tsx | 5 | 240, 320, 385, 391, 398 |
| IssueCard.tsx | 2 | 128, 217 |
| IssueComments.tsx | 3 | 101, 104, 108 |
| IssueDetail/SubtasksList.tsx | 2 | 148, 149 |
| LabelsManager.tsx | 4 | 282, 285, 289, 344 |
| landing/HeroSection.tsx | 2 | 38, 64 |
| landing/NavHeader.tsx | 2 | 28, 55 |
| NotificationBell.tsx | 3 | 170, 175, 176 |
| NotificationCenter.tsx | 1 | 94 |
| NotificationItem.tsx | 3 | 148, 153, 154 |
| Onboarding/Checklist.tsx | 2 | 84, 157 |
| PresenceIndicator.tsx | 1 | 24 |
| Settings/ProfileContent.tsx | 4 | 82, 85, 90, 93 |
| SprintManager.tsx | 3 | 56, 70, 73 |
| TimeTracker.tsx | 3 | 40, 46, 109 |
| TimeTracking/*.tsx | 2 | 564, 109 |
| VersionHistory.tsx | 2 | 149, 153 |
| webhooks/WebhookLogs.tsx | 2 | 110, 116 |

### Routes

| File | Count | Lines |
|------|-------|-------|
| invite.$token.tsx | 4 | 107, 190, 196, 274 |
| onboarding.tsx | 1 | 121 |
| documents/index.tsx | 3 | 104, 107, 110 |
| workspaces/index.tsx | 4 | 76, 90, 93, 96 |
| teams/index.tsx | 4 | 61, 75, 78, 81 |

---

## 2. Patterns to Extract (High Priority)

### ShortcutHint Component
**Files:** CommandPalette.tsx (3x), GlobalSearch.tsx (3x)
```tsx
// CURRENT (repeated 6 times)
<Typography variant="meta" as="span">
  <CommandShortcut>↑↓</CommandShortcut> Navigate
</Typography>

// SHOULD BE
<ShortcutHint keys="↑↓" text="Navigate" />
```

### ResponsiveText Component
**File:** Calendar/RoadmapView.tsx (6 instances)
```tsx
// CURRENT (repeated 6 times)
<Typography as="span" className="sm:hidden">W</Typography>
<Typography as="span" className="hidden sm:inline">Week</Typography>

// SHOULD BE
<ResponsiveText short="W" long="Week" />
```

### Metadata Usage (Expand)
**Files:** NotificationBell.tsx, NotificationItem.tsx, VersionHistory.tsx, documents/index.tsx, workspaces/index.tsx
```tsx
// CURRENT (repeated 8+ times)
<Flex align="center" gap="xs">
  <Typography variant="meta" as="span">{time}</Typography>
  <Typography variant="meta" as="span">•</Typography>
  <Typography variant="meta" as="span">{author}</Typography>
</Flex>

// SHOULD BE (component exists but underused)
<Metadata>
  <MetadataTimestamp date={time} />
  <MetadataItem>by {author}</MetadataItem>
</Metadata>
```

### Badge-Style Typography
**Files:** Admin/HourComplianceDashboard.tsx, AI/AISuggestionsPanel.tsx (10+ instances)
```tsx
// CURRENT
<Typography variant="meta" as="span" className="px-2 py-0.5 bg-ui-bg-tertiary rounded">
  {text}
</Typography>

// SHOULD BE
<Badge variant="subtle">{text}</Badge>
```

### Tag Component Usage
**Files:** TimeTracking/ManualTimeEntryModal.tsx, TimeTracking/TimeEntryModal.tsx
```tsx
// CURRENT
<Flex as="span" inline className="px-2 py-1 bg-brand-subtle text-brand-hover text-xs rounded">
  {tag}
</Flex>

// SHOULD BE
<Tag>{tag}</Tag>
```

---

## 3. Typography className Overrides (50+ instances)

### Pattern: Size Conflicts
```tsx
// SLOP - variant already defines size
<Typography variant="h1" className="text-2xl font-bold">

// CLEAN
<Typography variant="h1">
```

### Pattern: Spacing via className
```tsx
// SLOP
<Typography variant="p" className="mb-6">

// CLEAN - use parent container
<Flex gap="lg">
  <Typography variant="p">
</Flex>
```

### Pattern: Color Override
```tsx
// SLOP
<Typography className="text-ui-text-secondary">

// CLEAN
<Typography color="secondary">
```

### Worst Offenders

| File | Lines | Issue |
|------|-------|-------|
| invite.$token.tsx | 79, 102, 125, 147 | `variant="h1" className="text-2xl font-bold mb-3"` |
| onboarding.tsx | 158, 161 | `variant="h1" className="text-3xl font-bold mb-3 tracking-tight"` |
| _auth routes | Various | `variant="h2" className="text-xl font-medium mb-2"` |
| Dashboard/RecentActivity.tsx | 79, 84 | `variant="small" className="font-semibold text-ui-text"` |
| landing/HeroSection.tsx | 38-65 | Badge + gradient styling via className |

---

## 4. Semantic HTML Violations

### Manual Bullet Separators

| File | Lines | Should Use |
|------|-------|-----------|
| DocumentHeader.tsx | 189-191 | `<Metadata>` |
| Dashboard/MyIssuesList.tsx | 181-183 | `<Metadata>` |
| fields/CustomFieldCard.tsx | 66-67 | `<Metadata>` |
| ProjectsList.tsx | 109-111 | `<Metadata>` |
| Settings/ApiKeysManager.tsx | 220-239 | `<Metadata>` |
| AI/AIChat.tsx | 118-130 | `<Metadata>` |

### Timestamps Without `<time>`

| File | Lines | Current | Should Be |
|------|-------|---------|-----------|
| FileAttachments.tsx | 197 | `<Typography>` | `<MetadataTimestamp>` |
| webhooks/WebhookLogs.tsx | 65-68 | `<span>` | `<time dateTime="">` |
| VersionHistory.tsx | 74-88 | `<span>` | `<time dateTime="">` |
| ApiKeysManager.tsx | 585 | `<span>` | `<time dateTime="">` |

---

## 5. Raw Flex Divs

| File | Line | Current | Should Be |
|------|------|---------|-----------|
| board.tsx | 112 | `<div className="flex-1 overflow-hidden">` | `<Flex>` |
| route.tsx | 90 | `<div className="flex-1 overflow-hidden">` | `<Flex>` |
| + 10 more | Various | `<div className="px-4 py-2 ...">` | `<Flex>` with props |

---

## 6. Complex Nested Selectors (CRITICAL)

### The Worst Slop in the Codebase

**File:** `src/components/ui/Command.tsx` (line 33)

```tsx
// 200+ characters of unmaintainable selector chains
className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-ui-text-secondary [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5..."
```

**Why it's critical:**
- Impossible to read or maintain
- Couples styling to cmdk library internals
- Violates design system principles
- If cmdk changes structure, styling breaks

**Should be:** Extract to CSS module or create wrapper components.

---

## 7. Raw `<kbd>` with className

**Files:** CommandPalette.tsx, GlobalSearch.tsx, Onboarding/MemberOnboarding.tsx

```tsx
// CURRENT
<kbd className="bg-ui-bg border border-ui-border px-2 py-1 rounded text-ui-text font-sans">
  ↑↓
</kbd>

// SHOULD BE
<KeyboardShortcut keys="↑↓" />
```

| File | Count |
|------|-------|
| CommandPalette.tsx | 3 |
| GlobalSearch.tsx | 3 |
| Onboarding/*.tsx | 2+ |

---

## 8. Inline `style={{}}` Props

**Files:** IssueCard.tsx, LabelsManager.tsx (2x), FilterBar.tsx, RoadmapView.tsx

```tsx
// CURRENT - repeated 4+ times for label colors
<span
  className="px-3 py-1 rounded-full text-sm font-medium"
  style={{ backgroundColor: label.color }}
>
  {label.name}
</span>

// SHOULD BE
<LabelBadge color={label.color}>{label.name}</LabelBadge>
```

| File | Pattern | Count |
|------|---------|-------|
| IssueCard.tsx | Label badge | 1 |
| LabelsManager.tsx | Label badge | 2 |
| FilterBar.tsx | Color indicator | 1 |
| RoadmapView.tsx | Date bar positioning | 1 |

---

## 9. Framework Attribute Selectors

**Files:** CommandPalette.tsx

```tsx
// CURRENT
className="cursor-pointer data-[selected=true]:bg-brand-subtle"

// CONCERN: Couples to cmdk's internal data-selected attribute
```

Low severity but worth documenting - if cmdk changes attributes, styling breaks.

---

## Priority Actions

### Phase 1: Extract Components (Highest Impact)
1. **ShortcutHint** - Eliminates 6 instances
2. **ResponsiveText** - Eliminates 6 instances
3. Expand **Metadata** usage - Eliminates 15+ instances

### Phase 2: Replace as="span"
Remove all `as="span"` from Typography. File-by-file cleanup targeting the 93 instances.

### Phase 3: Badge Consolidation
Replace badge-style Typography with proper `<Badge>` component (10+ instances).

### Phase 4: Typography Cleanup
Remove className overrides that conflict with variants (50+ instances).

### Phase 5: Semantic HTML
- Add `<time>` elements to all timestamps
- Replace manual bullet separators with Metadata
