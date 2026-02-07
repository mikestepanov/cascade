# Design Tokens

All tokens defined in `src/index.css` `@theme` block.

## Colors

### Backgrounds

| Token | Usage |
|-------|-------|
| `bg-ui-bg` | Page background |
| `bg-ui-bg-soft` | Sidebar, subtle sections |
| `bg-ui-bg-elevated` | Cards, panels |
| `bg-ui-bg-hover` | Hover states |
| `bg-brand` | Primary actions |
| `bg-brand-subtle` | Brand backgrounds |
| `bg-status-*` | success, warning, error, info |

### Text

| Token | Usage |
|-------|-------|
| `text-ui-text` | Primary content |
| `text-ui-text-secondary` | Secondary content |
| `text-ui-text-tertiary` | Muted, disabled |
| `text-brand` | Links, accents |
| `text-brand-foreground` | Text on brand bg |
| `text-status-*` | success, warning, error |

### Borders

| Token | Usage |
|-------|-------|
| `border-ui-border` | Default borders |
| `border-ui-border-hover` | Hover states |
| `border-brand` | Focus rings |
| `border-status-*` | Status indicators |

## Spacing (8px Grid)

| Class | Pixels | Usage |
|-------|--------|-------|
| `gap-1` | 4px | Icon-to-text |
| `gap-2` | 8px | Tight groups |
| `gap-3` | 12px | List items |
| `gap-4` | 16px | Card sections |
| `gap-6` | 24px | Page sections |
| `gap-8` | 32px | Major sections |

### Padding

| Context | Classes |
|---------|---------|
| Button sm | `px-3 py-2` |
| Button default | `px-4 py-3` |
| Card | `p-4` or `p-6` |
| Page | `p-6` |
| Dropdown item | `px-3 py-2` |

## Shadows

| Token | Usage |
|-------|-------|
| `shadow-card` | Cards, panels |
| `shadow-elevated` | Dropdowns, modals |

## Border Radius

| Token | Usage |
|-------|-------|
| `rounded` | Buttons, inputs |
| `rounded-lg` | Cards |
| `rounded-xl` | Modals |
| `rounded-full` | Avatars, pills |

## Typography

| Variant | Usage |
|---------|-------|
| `text-ui-text` | Body text |
| `font-mono` | Code, keys |
| `font-medium` | Emphasis |
| `text-xs` | Metadata |
| `text-sm` | Secondary |

## Forbidden

Never use:
- `bg-gray-*`, `bg-slate-*`, `text-gray-*`
- `#fff`, `#000`, `rgb()`, `hsl()`
- `text-white`, `text-black`
- `shadow-sm`, `shadow-md`, `shadow-lg`
- `gap-[Npx]`, `p-[Npx]` (arbitrary values)
- `dark:` prefixes on semantic tokens
