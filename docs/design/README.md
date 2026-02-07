# Nixelo Design System

## Quick Links

| Doc | Purpose |
|-----|---------|
| [TOKENS.md](./TOKENS.md) | Colors, spacing, typography, shadows |
| [COMPONENTS.md](./COMPONENTS.md) | Component patterns, composition rules |
| [AUDIT.md](./AUDIT.md) | How to audit and fix UI issues |
| [research/mintlify.md](./research/mintlify.md) | Mintlify reference analysis |

## Core Principles

1. **Semantic tokens** - Never use raw colors (`bg-gray-500`). Use `bg-ui-bg`.
2. **Component composition** - No inline style soup. Use semantic components.
3. **8px grid** - All spacing is multiples of 8px.
4. **Dark mode automatic** - Tokens use `light-dark()`. No `dark:` prefixes.

## Quick Reference

```tsx
// Colors
bg-ui-bg, bg-ui-bg-elevated, bg-brand
text-ui-text, text-ui-text-secondary, text-brand
border-ui-border, border-brand, border-status-*

// Shadows
shadow-card, shadow-elevated

// Layout
<Flex>, <Typography>, <Card>, <Button>

// Metadata
<Metadata>
  <MetadataItem>value</MetadataItem>
  <MetadataTimestamp date={date} />
</Metadata>

// Lists
<ListItem icon={} title="" subtitle="" meta="" />
```

## Validation

```bash
node scripts/validate.js  # Should return 0 errors
```
