# Design System

## Docs

| Doc | Purpose | Updates |
|-----|---------|---------|
| [STANDARDS.md](./STANDARDS.md) | Timeless principles, checklists | Rarely |
| [REFERENCE.md](./REFERENCE.md) | Current tokens, components | When code changes |

## Specs

Detailed page and component breakdowns with ASCII wireframes:

- [specs/pages/](./specs/pages/) - Page-by-page analysis
- [specs/components/](./specs/components/) - Component deep-dives

## Research

External reference material:

- [../research/library/mintlify/](../research/library/mintlify/) - Screenshots, CSS, animations

## Quick Start

```tsx
// Tokens
bg-ui-bg, text-ui-text, border-ui-border
bg-brand, text-status-error

// Composition
<Metadata>
  <MetadataItem>value</MetadataItem>
</Metadata>

<ListItem icon={} title="" subtitle="" />

<UserDisplay name="" image="" subtitle="" />
```

## Validation

```bash
node scripts/validate.js
```
